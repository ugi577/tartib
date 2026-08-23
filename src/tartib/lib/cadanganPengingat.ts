// Pengingat cadangan data — kapan terakhir pengguna mengunduh berkas
// cadangan .json, dan apakah sudah waktunya diingatkan lagi.
//
// Waktu dicatat di localStorage (bukan IndexedDB) dengan alasan yang sama
// seperti Pengaturan (K-21): penanda ini melekat pada perangkat, tidak boleh
// ikut tercadangkan (cadangan yang memuat waktu dirinya sendiri aneh), dan
// tidak perlu migrasi skema Dexie. Semua fungsi murni terhadap antarmuka
// `Penyimpanan` dan `Date` agar bisa diuji tanpa browser.

import type { Penyimpanan } from './gdrive';

export const KUNCI_CADANGAN_TERAKHIR = 'tartib.cadangan.terakhir';

/** Cadangan lebih tua dari ini (hari) dianggap perlu diingatkan. */
export const AMBANG_HARI_PENGINGAT = 14;

export interface StatusCadangan {
  /** ISO waktu cadangan terakhir; null bila belum pernah membuat cadangan. */
  terakhir: string | null;
  /** Umur cadangan dalam hari utuh; null bila belum pernah. */
  umurHari: number | null;
  /** Benar bila belum pernah cadangan ATAU umurnya mencapai ambang. */
  perluIngatkan: boolean;
}

export function catatWaktuCadangan(sekarang: Date, tersimpan: Penyimpanan): void {
  tersimpan.setItem(KUNCI_CADANGAN_TERAKHIR, sekarang.toISOString());
}

export function bacaWaktuCadangan(tersimpan: Penyimpanan): string | null {
  const mentah = tersimpan.getItem(KUNCI_CADANGAN_TERAKHIR);
  if (!mentah) return null;
  const waktu = new Date(mentah);
  return Number.isNaN(waktu.getTime()) ? null : waktu.toISOString();
}

export function statusPengingatCadangan(terakhir: string | null, hariIni: Date): StatusCadangan {
  if (!terakhir) {
    return { terakhir: null, umurHari: null, perluIngatkan: true };
  }
  const selisihMs = hariIni.getTime() - new Date(terakhir).getTime();
  const umurHari = Math.max(0, Math.floor(selisihMs / 86_400_000));
  return { terakhir, umurHari, perluIngatkan: umurHari >= AMBANG_HARI_PENGINGAT };
}
