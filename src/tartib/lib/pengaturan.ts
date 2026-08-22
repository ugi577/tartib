// Pengaturan aplikasi (sesi 16) — preferensi milik PERANGKAT, bukan data acara.
//
// Disimpan di localStorage (bukan IndexedDB) dengan alasan yang sama seperti
// client ID Google Drive di lib/gdrive.ts: nilainya melekat pada perangkat
// pemakai, tidak ikut dicadangkan bersama data acara, dan tidak perlu migrasi
// skema Dexie. Semua fungsi murni terhadap antarmuka `Penyimpanan` agar bisa
// diuji tanpa browser.
//
// Aturan pembacaan: apa pun isi localStorage — kosong, rusak, tipe salah,
// angka di luar akal — hasil `bacaPengaturan` SELALU objek Pengaturan yang
// sah. Pengaturan yang tidak bisa dibaca tidak boleh membuat aplikasi gagal.

import type { Penyimpanan } from './gdrive';

export interface Pengaturan {
  /** Nama lembaga/panitia — dicetak sebagai kop di semua lembar A4. */
  organisasi: string;
  /** Baris kedua kop: alamat, kontak, atau keterangan singkat. */
  keteranganKop: string;
  /** Nilai baku kalkulator porsi: porsi cadangan di luar RSVP. */
  porsiCadangan: number;
  /** Nilai baku kalkulator porsi: buffer RSVP dalam persen. */
  porsiBufferPersen: number;
  /** Nilai baku kalkulator peralatan: ada tim pencuci (0,6×) atau tidak (1,1×). */
  adaTimPencuci: boolean;
}

export const KUNCI_PENGATURAN = 'tartib.pengaturan';

/** Nilai baku = perilaku aplikasi sebelum sesi 16 (lib/porsi.ts). */
export const PENGATURAN_BAKU: Pengaturan = {
  organisasi: '',
  keteranganKop: '',
  porsiCadangan: 10,
  porsiBufferPersen: 25,
  adaTimPencuci: true,
};

const PANJANG_MAKS_TEKS = 120;
export const BATAS_CADANGAN = { min: 0, maks: 10_000 } as const;
export const BATAS_BUFFER = { min: 0, maks: 200 } as const;

function teks(nilai: unknown, baku: string): string {
  if (typeof nilai !== 'string') return baku;
  return nilai.trim().slice(0, PANJANG_MAKS_TEKS);
}

function bilangan(nilai: unknown, baku: number, min: number, maks: number): number {
  const n = typeof nilai === 'number' ? nilai : Number(nilai);
  if (!Number.isFinite(n)) return baku;
  return Math.min(maks, Math.max(min, Math.round(n)));
}

/** Normalisasi objek apa pun menjadi Pengaturan sah (klem + potong + baku). */
export function bersihkanPengaturan(mentah: unknown): Pengaturan {
  if (typeof mentah !== 'object' || mentah === null) return { ...PENGATURAN_BAKU };
  const m = mentah as Record<string, unknown>;
  return {
    organisasi: teks(m.organisasi, PENGATURAN_BAKU.organisasi),
    keteranganKop: teks(m.keteranganKop, PENGATURAN_BAKU.keteranganKop),
    porsiCadangan: bilangan(
      m.porsiCadangan,
      PENGATURAN_BAKU.porsiCadangan,
      BATAS_CADANGAN.min,
      BATAS_CADANGAN.maks,
    ),
    porsiBufferPersen: bilangan(
      m.porsiBufferPersen,
      PENGATURAN_BAKU.porsiBufferPersen,
      BATAS_BUFFER.min,
      BATAS_BUFFER.maks,
    ),
    adaTimPencuci:
      typeof m.adaTimPencuci === 'boolean' ? m.adaTimPencuci : PENGATURAN_BAKU.adaTimPencuci,
  };
}

export function bacaPengaturan(tersimpan: Penyimpanan): Pengaturan {
  const mentah = tersimpan.getItem(KUNCI_PENGATURAN);
  if (!mentah) return { ...PENGATURAN_BAKU };
  try {
    return bersihkanPengaturan(JSON.parse(mentah));
  } catch {
    return { ...PENGATURAN_BAKU };
  }
}

export function simpanPengaturan(p: Pengaturan, tersimpan: Penyimpanan): Pengaturan {
  const bersih = bersihkanPengaturan(p);
  tersimpan.setItem(KUNCI_PENGATURAN, JSON.stringify(bersih));
  return bersih;
}

export function hapusPengaturan(tersimpan: Penyimpanan): void {
  tersimpan.removeItem(KUNCI_PENGATURAN);
}

/** Kop cetak siap tampil; kosong berarti tidak ada kop yang perlu dicetak. */
export function barisKop(p: Pengaturan): string[] {
  return [p.organisasi, p.keteranganKop].map((s) => s.trim()).filter((s) => s !== '');
}
