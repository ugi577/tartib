'use client';

// Kepala halaman untuk SETIAP view (sesi 22, keluhan Ahmed "header di
// beberapa menu terlalu besar"). Sebelumnya tiap view menulis kepalanya
// sendiri: judul text-xl + paragraf keterangan 2–4 baris + bar tombol yang
// pecah dua baris + border bawah — di HP 375px kerangka ini memakan
// 200–500px sebelum konten pertama muncul.
//
// Aturan pakai:
// - `judul` pendek dan SAMA dengan label nav/kartu beranda (satu nama per
//   tujuan), supaya keterangan panjang tidak lagi dibutuhkan.
// - `keterangan` opsional, satu baris (text-xs). Penjelasan alur ditaruh di
//   kartu/dialog yang bersangkutan, bukan di kepala halaman.
// - `aksi` = tombol kecil (KELAS.tombolUtamaKecil / tombolSekunderKecil /
//   tombolIkon) yang duduk sebaris dengan judul.
// - `subNav` = pil bagian (KELAS.subNav) yang dirender di bawah judul.

import type { ReactNode } from 'react';
import { KELAS } from '../ui/kelas';

interface PropsHeaderView {
  judul: string;
  keterangan?: ReactNode;
  aksi?: ReactNode;
  subNav?: ReactNode;
  /** Tautan/tombol "← Kembali" kecil di atas judul (halaman detail). */
  kembali?: ReactNode;
}

export function HeaderView({ judul, keterangan, aksi, subNav, kembali }: PropsHeaderView) {
  return (
    <div className="space-y-2 print:hidden">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
        <div className="min-w-0">
          {kembali}
          <h2 className={KELAS.judulHalaman}>{judul}</h2>
          {keterangan && <p className={`mt-0.5 ${KELAS.keteranganKecil}`}>{keterangan}</p>}
        </div>
        {aksi && <div className="flex flex-wrap items-center gap-1.5">{aksi}</div>}
      </div>
      {subNav && <div className={KELAS.subNav}>{subNav}</div>}
    </div>
  );
}

interface PropsSubNav<T extends string> {
  daftar: ReadonlyArray<{ id: T; label: string }>;
  aktif: T;
  onPilih: (id: T) => void;
}

/** Pil sub-nav siap pakai (pola SopView/PengaturanView, kini satu sumber). */
export function SubNav<T extends string>({ daftar, aktif, onPilih }: PropsSubNav<T>) {
  return (
    <>
      {daftar.map((b) => (
        <button
          key={b.id}
          type="button"
          onClick={() => onPilih(b.id)}
          aria-current={aktif === b.id ? 'true' : undefined}
          className={aktif === b.id ? KELAS.subNavPilAktif : KELAS.subNavPil}
        >
          {b.label}
        </button>
      ))}
    </>
  );
}
