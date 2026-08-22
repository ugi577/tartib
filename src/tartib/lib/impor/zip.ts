// Pembaca & penulis ZIP minimal untuk impor/ekspor dokumen (Batch V, W).
//
// DOCX adalah arsip ZIP; Tartib tidak menambah library (BRIEF Bagian 4),
// jadi arsip dibaca langsung: end-of-central-directory → central directory →
// local header → data, lalu inflate dengan DecompressionStream('deflate-raw')
// yang tersedia di browser modern & Node ≥ 18. Hanya metode 0 (stored) dan
// 8 (deflate) yang didukung — cukup untuk DOCX buatan Word/LibreOffice.
// Penulisan (buatZip) memakai kebalikannya: CRC32 tabel baku (polinomial
// 0xedb88320), deflate via CompressionStream('deflate-raw'), dan tanggal DOS
// 0x0021 (1 Jan 1980) supaya byte arsip deterministik.

/** Isi satu berkas dalam arsip ZIP. */
export interface BerkasZip {
  nama: string;
  isi: Uint8Array;
}

const TANDA_EOCD = 0x06054b50; // "PK\x05\x06"
const TANDA_CD = 0x02014b50; // "PK\x01\x02"
const TANDA_LOKAL = 0x04034b50; // "PK\x03\x04"
const TANDA_AKHIR_CD = 0x08074b50; // deskriptor opsional (dilewati)

export class ZipError extends Error {
  constructor(pesan: string) {
    super(pesan);
    this.name = 'ZipError';
  }
}

function bacaU16(b: Uint8Array, off: number): number {
  return b[off] | (b[off + 1] << 8);
}

function bacaU32(b: Uint8Array, off: number): number {
  return b[off] | (b[off + 1] << 8) | (b[off + 2] << 16) | (b[off + 3] << 24);
}

// Salin ke Uint8Array ber-ArrayBuffer murni: Blob/DecompressionStream menuntut
// ArrayBufferView<ArrayBuffer>, sedangkan subarray() menghasilkan view bersama.
function salin(u: Uint8Array): Uint8Array<ArrayBuffer> {
  const hasil = new Uint8Array(u.length);
  for (let i = 0; i < u.length; i += 1) hasil[i] = u[i];
  return hasil;
}

async function inflate(data: Uint8Array): Promise<Uint8Array<ArrayBuffer>> {
  const ds = new DecompressionStream('deflate-raw');
  const aliran = new Blob([salin(data)]).stream().pipeThrough(ds);
  const hasil = await new Response(aliran).arrayBuffer();
  return new Uint8Array(hasil);
}

/** Cari penanda EOCD dari akhir arsip (komentar ZIP boleh mengikutinya). */
function cariEOCD(b: Uint8Array): number {
  const maks = Math.min(b.length, 22 + 65535);
  for (let i = b.length - 22; i >= b.length - maks; i -= 1) {
    if (i < 0) break;
    if (bacaU32(b, i) === TANDA_EOCD) return i;
  }
  throw new ZipError('Bukan arsip ZIP (penanda akhir arsip tidak ditemukan)');
}

/** Baca seluruh entry ZIP menjadi Map nama → isi (hanya metode 0 & 8). */
export async function bacaZip(buffer: ArrayBuffer): Promise<Map<string, Uint8Array>> {
  const b = new Uint8Array(buffer);
  if (b.length < 22) throw new ZipError('Berkas terlalu kecil untuk arsip ZIP');
  const eocd = cariEOCD(b);
  const jumlahEntry = bacaU16(b, eocd + 10);
  const offsetCD = bacaU32(b, eocd + 16);

  const hasil = new Map<string, Uint8Array>();
  let pos = offsetCD;
  for (let i = 0; i < jumlahEntry; i += 1) {
    if (bacaU32(b, pos) !== TANDA_CD) throw new ZipError('Arsip ZIP rusak (central directory)');
    const metode = bacaU16(b, pos + 10);
    const ukuranKompres = bacaU32(b, pos + 20);
    const ukuranAsli = bacaU32(b, pos + 24);
    const panjangNama = bacaU16(b, pos + 28);
    const panjangEkstra = bacaU16(b, pos + 30);
    const panjangKomentar = bacaU16(b, pos + 32);
    const offsetLokal = bacaU32(b, pos + 42);
    const nama = new TextDecoder().decode(b.subarray(pos + 46, pos + 46 + panjangNama));
    pos += 46 + panjangNama + panjangEkstra + panjangKomentar;

    // Local header bisa punya ekstra sendiri; data dimulai setelahnya.
    let lokal = offsetLokal;
    if (bacaU32(b, lokal) === TANDA_LOKAL) {
      const panjangNamaLokal = bacaU16(b, lokal + 26);
      const panjangEkstraLokal = bacaU16(b, lokal + 28);
      lokal += 30 + panjangNamaLokal + panjangEkstraLokal;
    }
    let data = b.subarray(lokal, lokal + ukuranKompres);

    if (metode === 8) {
      data = await inflate(data);
    } else if (metode !== 0) {
      throw new ZipError(`Metode kompresi ${metode} tidak didukung ("${nama}")`);
    }
    if (data.length !== ukuranAsli) {
      throw new ZipError(`Ukuran tidak cocok untuk "${nama}"`);
    }
    hasil.set(nama, data);
  }
  return hasil;
}

// ===== Penulis (Batch W, untuk ekspor .docx — lihat lib/ekspor/tulisDocx) =====

const TABEL_CRC: number[] = (() => {
  const t: number[] = new Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

/** CRC-32 (IEEE 802.3, polinomial 0xedb88320) — nilai header entry ZIP. */
export function crc32(data: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i += 1) c = TABEL_CRC[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

async function deflate(data: Uint8Array): Promise<Uint8Array<ArrayBuffer>> {
  const cs = new CompressionStream('deflate-raw');
  const aliran = new Blob([salin(data)]).stream().pipeThrough(cs);
  return new Uint8Array(await new Response(aliran).arrayBuffer());
}

export interface EntryZip {
  nama: string;
  isi: Uint8Array;
  /** 0 = stored tanpa kompresi, 8 = deflate (bawaan). */
  metode?: 0 | 8;
}

/** Bangun arsip ZIP berisi beberapa entry — bisa dibaca ulang oleh bacaZip. */
export async function buatZip(entries: EntryZip[]): Promise<Uint8Array<ArrayBuffer>> {
  const disiapkan = await Promise.all(
    entries.map(async (e) => {
      const nama = new TextEncoder().encode(e.nama);
      const asli = salin(e.isi);
      const metode = e.metode ?? 8;
      const data = metode === 0 ? asli : await deflate(asli);
      return { nama, data, crc: crc32(asli), metode, ukuranAsli: asli.length };
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
    dv.setUint32(pos, TANDA_LOKAL, true); pos += 4;
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
    dv.setUint32(pos, TANDA_CD, true); pos += 4;
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

  // Ukuran CD dihitung SEBELUM penulisan EOCD — memakai pos yang sudah maju
  // ke dalam EOCD membuat cdSize 12 byte terlalu besar dan berkas ditolak
  // pembaca ketat (unzip/Word).
  const ukuranCd = pos - cdMulai;
  dv.setUint32(pos, TANDA_EOCD, true); pos += 4;
  dv.setUint16(pos, 0, true); pos += 2; // disk ini
  dv.setUint16(pos, 0, true); pos += 2; // disk CD
  dv.setUint16(pos, disiapkan.length, true); pos += 2;
  dv.setUint16(pos, disiapkan.length, true); pos += 2;
  dv.setUint32(pos, ukuranCd, true); pos += 4;
  dv.setUint32(pos, cdMulai, true); pos += 4; // ofset CD
  dv.setUint16(pos, 0, true); pos += 2; // komentar
  return buf;
}
