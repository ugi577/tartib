import { describe, expect, it } from 'vitest';
import { bacaZip, buatZip, ZipError } from './zip';

describe('bacaZip', () => {
  it('membaca entry stored dan deflate hasil buatZip', async () => {
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

  it('menggunakan deflate sebagai metode bawaan', async () => {
    const zip = await buatZip([{ nama: 'a.txt', isi: new TextEncoder().encode('x'.repeat(100)) }]);
    const hasil = await bacaZip(zip.buffer as ArrayBuffer);
    expect(new TextDecoder().decode(hasil.get('a.txt'))).toBe('x'.repeat(100));
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
