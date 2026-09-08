// Konstanta & helper kecil bersama komponen struktur (sesi 22) — dipakai
// PanelItemSop (daftar), BaganOrganisasi/KartuJabatan (bagan), dan form.

import type { MouseEvent as MouseEventReact } from 'react';
import type { Posisi } from '../../lib/struktur/useAksiStruktur';
import { KELAS } from '../../ui/kelas';

export function formatWaktu(iso: string): string {
  return new Date(iso).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

// Saran kategori rutin (arahan Ahmed Batch Y: "pekerjaan rutin harian,
// mingguan, bulanan, part, insidential/saat dibutuhkan saja") — isian bebas
// teks, daftar ini hanya saran cepat.
export const SARAN_RUTIN = ['Harian', 'Mingguan', 'Bulanan', 'Part', 'Tahunan', 'Insidental (saat dibutuhkan saja)'];

// Tier bagan dikendalikan field `rutin`. Nilai di luar tiga tier utama (mis.
// 'Harian' dari mode daftar) TIDAK boleh hilang dari bagan — masuk grup
// 'Lainnya' (temuan [17]).
export const TIER_UTAMA: readonly string[] = ['Pimpinan', 'Pengurus Inti', 'Divisi'];
export const TIER_LAINNYA = 'Lainnya';
export const URUTAN_TIER: readonly string[] = [...TIER_UTAMA, TIER_LAINNYA];

export function tierDari(rutin: string | undefined): string {
  return rutin && TIER_UTAMA.includes(rutin) ? rutin : TIER_LAINNYA;
}

/** Posisi menu dari klik kanan: di titik kursor. */
export function posisiDariEvent(e: MouseEventReact): Posisi {
  return { x: e.clientX, y: e.clientY };
}

/** Posisi menu dari tombol ⋯ / tekan lama: tepat di bawah tepi kiri elemen. */
export function posisiDariElemen(el: Element): Posisi {
  const rect = el.getBoundingClientRect();
  return { x: rect.left, y: rect.bottom + 4 };
}

/** Tanda kartu/baris yang sedang "dipotong" (menunggu Tempel). */
export const KELAS_DIPOTONG = 'border-dashed border-emas-400/70 opacity-60';

/** Tombol ⋯ pembuka menu — target sentuh ≥ 40px (temuan [21][48][49]). */
export const TOMBOL_MENU = `${KELAS.tombolIkon} min-h-10 min-w-10 text-lg leading-none`;

/** Baris pesan sukses/umpan balik (di bawah bar ringkasan). */
export const PESAN_INFO = 'rounded-kontrol bg-aksen-100/70 px-3 py-1.5 text-xs text-aksen-700 ring-1 ring-inset ring-aksen-200/70';
