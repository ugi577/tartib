// Nama hari jadwal KBM — satu bentuk kanonik (sesi 22, temuan audit [78]).
//
// Sebelumnya `HariKbm` memuat 'Jumat' DAN "Jum'at" sekaligus: preset pesantren
// memakai "Jum'at", preset lain 'Jumat', dan KbmMatriksView menambal dengan
// tiga pembanding ad-hoc `hari === "Jum'at" && e.hari === 'Jumat'`. Data yang
// diimpor dari JSON atau tersimpan lama di localStorage bisa memuat variasi
// lain lagi ("Jum’at", "jumat", "Minggu"). Kini:
//   - kanonik di data: 'Jumat' dan 'Ahad' (tanpa tanda kutip, tanpa 'Minggu');
//   - `labelHari()` untuk TAMPILAN ("Jum'at" sesuai ejaan yang lazim di pesantren);
//   - `normalisasiJadwal()` dipanggil di setiap titik baca (localStorage, impor
//     JSON, katalog kustom) sehingga komponen cukup membandingkan `===`.

import type { EntriJadwal, HariKbm, ModelJadwalKbm } from '../../types/kbm';

/** Urutan hari kanonik (Senin → Ahad). */
export const DAFTAR_HARI_KBM: readonly HariKbm[] = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Ahad'];

/**
 * Terima berbagai ejaan ("Jum'at", "Jum’at", "jumat", " JUMAT ", "Minggu") dan
 * kembalikan bentuk kanonik; null bila bukan nama hari yang dikenali.
 */
export function normalisasiHari(h: string): HariKbm | null {
  if (typeof h !== 'string') return null;
  // Buang spasi, tanda kutip lurus/keriting, backtick, dan aksen — semua
  // variasi "Jum'at" jatuh ke "jumat".
  const kunci = h
    .toLowerCase()
    .replace(/[\s'’‘`´]/g, '');
  switch (kunci) {
    case 'senin':
      return 'Senin';
    case 'selasa':
      return 'Selasa';
    case 'rabu':
      return 'Rabu';
    case 'kamis':
      return 'Kamis';
    case 'jumat':
      return 'Jumat';
    case 'sabtu':
      return 'Sabtu';
    case 'ahad':
    case 'minggu':
      return 'Ahad';
    default:
      return null;
  }
}

/** Label tampilan: 'Jumat' → "Jum'at", hari lain apa adanya. */
export function labelHari(h: HariKbm): string {
  return h === 'Jumat' ? "Jum'at" : h;
}

/**
 * Normalisasi seluruh jadwal: `daftarHari` (tanpa duplikat, hari tak dikenal
 * dibuang) dan `entri[].hari`; entri dengan hari tak dikenal dibuang.
 * Bidang lain tidak disentuh.
 */
export function normalisasiJadwal(j: ModelJadwalKbm): ModelJadwalKbm {
  const daftarHari: HariKbm[] = [];
  for (const h of Array.isArray(j.daftarHari) ? j.daftarHari : []) {
    const n = normalisasiHari(String(h));
    if (n && !daftarHari.includes(n)) daftarHari.push(n);
  }

  const entri: EntriJadwal[] = [];
  for (const e of Array.isArray(j.entri) ? j.entri : []) {
    if (!e || typeof e !== 'object') continue;
    const n = normalisasiHari(String(e.hari));
    if (!n) continue;
    entri.push(n === e.hari ? e : { ...e, hari: n });
  }

  return { ...j, daftarHari, entri };
}
