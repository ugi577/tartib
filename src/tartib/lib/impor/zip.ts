// Pembaca ZIP minimal untuk impor dokumen (Batch V).
//
// DOCX adalah arsip ZIP; Tartib tidak menambah library (BRIEF Bagian 4),
// jadi arsip dibaca langsung: end-of-central-directory → central directory →
// local header → data, lalu inflate dengan DecompressionStream('deflate-raw')
// yang tersedia di browser modern & Node ≥ 18. Hanya metode 0 (stored) dan
// 8 (deflate) yang didukung — cukup untuk DOCX buatan Word/LibreOffice.

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
