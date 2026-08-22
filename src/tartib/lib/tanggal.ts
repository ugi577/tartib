// Utilitas tanggal papan acara (Batch C) — murni dan deterministik.
// Tanggal acara disimpan YYYY-MM-DD dan diolah sebagai tanggal kalender
// lokal (bukan UTC) agar geseran melewati pergantian bulan/tahun dan
// tahun kabisat selalu konsisten di semua zona waktu host.

export class TanggalError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TanggalError';
  }
}

function bagianTanggal(tanggal: string): { tahun: number; bulan: number; hari: number } {
  const cocok = /^(\d{4})-(\d{2})-(\d{2})$/.exec(tanggal);
  if (!cocok) throw new TanggalError(`Tanggal tidak sah (harus YYYY-MM-DD): ${tanggal}`);
  const tahun = Number(cocok[1]);
  const bulan = Number(cocok[2]);
  const hari = Number(cocok[3]);
  // Validasi kalender: 2026-02-30 / 2026-13-01 digulirkan Date, jadi
  // dibandingkan balik dengan komponen input.
  const d = new Date(tahun, bulan - 1, hari);
  if (d.getFullYear() !== tahun || d.getMonth() !== bulan - 1 || d.getDate() !== hari) {
    throw new TanggalError(`Tanggal tidak sah: ${tanggal}`);
  }
  return { tahun, bulan, hari };
}

// Geser tanggal acara sebesar offset fase (H-30, H-7, H+1 dst). Mengembalikan
// YYYY-MM-DD baru.
export function geserTanggal(tanggal: string, offsetHari: number): string {
  if (!Number.isInteger(offsetHari)) {
    throw new TanggalError('Offset hari harus berupa bilangan bulat');
  }
  const { tahun, bulan, hari } = bagianTanggal(tanggal);
  const d = new Date(tahun, bulan - 1, hari);
  d.setDate(d.getDate() + offsetHari);
  const t = d.getFullYear();
  const b = String(d.getMonth() + 1).padStart(2, '0');
  const h = String(d.getDate()).padStart(2, '0');
  return `${t}-${b}-${h}`;
}

const FORMAT_TANGGAL = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

// "2026-08-22" → "22 Agustus 2026" (locale id-ID, tidak bergantung zona waktu
// host karena dibangun dari bagian tanggal kalender).
export function formatTanggalIndonesia(tanggal: string): string {
  const { tahun, bulan, hari } = bagianTanggal(tanggal);
  return FORMAT_TANGGAL.format(new Date(tahun, bulan - 1, hari));
}

// Label offset fase relatif hari-H: 0 → "Hari H", -30 → "H-30", +1 → "H+1".
export function formatOffsetHari(offsetHari: number): string {
  if (offsetHari === 0) return 'Hari H';
  return offsetHari < 0 ? `H${offsetHari}` : `H+${offsetHari}`;
}

// Tanggal kalender lokal hari ini, YYYY-MM-DD (bukan UTC, agar tidak
// melompati hari di zona waktu +7 saat sore/lewati tengah malam UTC).
export function tanggalHariIni(): string {
  const d = new Date();
  const t = d.getFullYear();
  const b = String(d.getMonth() + 1).padStart(2, '0');
  const h = String(d.getDate()).padStart(2, '0');
  return `${t}-${b}-${h}`;
}
