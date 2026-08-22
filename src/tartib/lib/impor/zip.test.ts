import { describe, expect, it } from 'vitest';
import { bacaZip, ZipError } from './zip';

// Pembuat ZIP minimal untuk pengujian: entry stored (metode 0) dan deflate
// (metode 8) via CompressionStream('deflate-raw'), CRC32 dihitung manual.

const TABEL_CRC: number[] = (() => {
  const t: number[] = new Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(data: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i += 1) c = TABEL_CRC[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

async function kompres(data: Uint8Array): Promise<Uint8Array> {
  const salinan = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i += 1) salinan[i] = data[i];
  const cs = new CompressionStream('deflate-raw');
  const aliran = new Blob([salinan]).stream().pipeThrough(cs);
  return new Uint8Array(await new Response(aliran).arrayBuffer());
}

async function buatZip(entries: { nama: string; isi: Uint8Array; metode: 0 | 8 }[]): Promise<Uint8Array> {
  const disiapkan = await Promise.all(
    entries.map(async (e) => {
      const nama = new TextEncoder().encode(e.nama);
      const data = e.metode === 8 ? await kompres(e.isi) : e.isi;
      return { nama, data, crc: crc32(e.isi), metode: e.metode, ukuranAsli: e.isi.length };
    }),
  );
  const panjangLokal = disiapkan.reduce((s, d) => s + 30 + d.nama.length + d.data.length, 0);
  const panjangCd = disiapkan.reduce((s, d) => s + 46 + d.nama.length, 0);
  const buf = new Uint8Array(panjangLokal + panjangCd + 22);
  const dv = new DataView(buf.buffer);
  let pos = 0;
  const ofset: number[] = [];

  for (const d of disiapkan) {
    ofset.push(pos);
    dv.setUint32(pos, 0x04034b50, true); pos += 4; // tanda lokal
    dv.setUint16(pos, 20, true); pos += 2; // versi
    dv.setUint16(pos, 0, true); pos += 2; // flag
    dv.setUint16(pos, d.metode, true); pos += 2;
    dv.setUint16(pos, 0, true); pos += 2; // waktu
    dv.setUint16(pos, 0x0021, true); pos += 2; // tanggal (1 Jan 1980)
    dv.setUint32(pos, d.crc, true); pos += 4;
    dv.setUint32(pos, d.data.length, true); pos += 4;
    dv.setUint32(pos, d.ukuranAsli, true); pos += 4;
    dv.setUint16(pos, d.nama.length, true); pos += 2;
    dv.setUint16(pos, 0, true); pos += 2; // ekstra
    buf.set(d.nama, pos); pos += d.nama.length;
    buf.set(d.data, pos); pos += d.data.length;
  }

  const cdMulai = pos;
  for (let i = 0; i < disiapkan.length; i += 1) {
    const d = disiapkan[i];
    dv.setUint32(pos, 0x02014b50, true); pos += 4; // tanda central directory
    dv.setUint16(pos, 20, true); pos += 2; // dibuat oleh
    dv.setUint16(pos, 20, true); pos += 2; // butuh versi
    dv.setUint16(pos, 0, true); pos += 2; // flag
    dv.setUint16(pos, d.metode, true); pos += 2;
    dv.setUint16(pos, 0, true); pos += 2; // waktu
    dv.setUint16(pos, 0x0021, true); pos += 2; // tanggal
    dv.setUint32(pos, d.crc, true); pos += 4;
    dv.setUint32(pos, d.data.length, true); pos += 4;
    dv.setUint32(pos, d.ukuranAsli, true); pos += 4;
    dv.setUint16(pos, d.nama.length, true); pos += 2;
    dv.setUint16(pos, 0, true); pos += 2; // ekstra
    dv.setUint16(pos, 0, true); pos += 2; // komentar
    dv.setUint16(pos, 0, true); pos += 2; // disk
    dv.setUint16(pos, 0, true); pos += 2; // atribut internal
    dv.setUint32(pos, 0, true); pos += 4; // atribut eksternal
    dv.setUint32(pos, ofset[i], true); pos += 4; // ofset lokal
    buf.set(d.nama, pos); pos += d.nama.length;
  }

  dv.setUint32(pos, 0x06054b50, true); pos += 4; // tanda EOCD
  dv.setUint16(pos, 0, true); pos += 2; // disk ini
  dv.setUint16(pos, 0, true); pos += 2; // disk CD
  dv.setUint16(pos, disiapkan.length, true); pos += 2;
  dv.setUint16(pos, disiapkan.length, true); pos += 2;
  dv.setUint32(pos, pos - cdMulai, true); pos += 4; // ukuran CD
  dv.setUint32(pos, cdMulai, true); pos += 4; // ofset CD
  dv.setUint16(pos, 0, true); pos += 2; // komentar
  return buf;
}

describe('bacaZip', () => {
  it('membaca entry stored dan deflate', async () => {
    const teks = 'Selamat datang di Tartib';
    const zip = await buatZip([
      { nama: 'word/document.xml', isi: new TextEncoder().encode(teks), metode: 8 },
      { nama: 'plain.txt', isi: new TextEncoder().encode('data mentah'), metode: 0 },
    ]);
    const hasil = await bacaZip(zip.buffer as ArrayBuffer);
    expect(hasil.size).toBe(2);
    expect(new TextDecoder().decode(hasil.get('word/document.xml'))).toBe(teks);
    expect(new TextDecoder().decode(hasil.get('plain.txt'))).toBe('data mentah');
  });

  it('menolak data yang bukan ZIP', async () => {
    await expect(bacaZip(new TextEncoder().encode('bukan zip').buffer)).rejects.toThrow(ZipError);
  });

  it('menolak metode kompresi yang tidak didukung', async () => {
    // Metode 99 dipalsukan di central directory: bangun zip lalu rusak byte metode.
    const zip = await buatZip([{ nama: 'a.txt', isi: new TextEncoder().encode('x'), metode: 0 }]);
    const bytes = new Uint8Array(zip);
    // Central directory entry pertama: tanda 4 byte + versi 4 byte + flags 2 + metode di offset 10.
    const cd = bytes.findIndex((b, i) => b === 0x50 && bytes[i + 1] === 0x4b && bytes[i + 2] === 0x01 && bytes[i + 3] === 0x02);
    expect(cd).toBeGreaterThan(0);
    bytes[cd + 10] = 99;
    await expect(bacaZip(bytes.buffer as ArrayBuffer)).rejects.toThrow(/tidak didukung/);
  });
});
