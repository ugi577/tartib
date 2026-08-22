// Kelas tampilan bersama Tartib (Batch U-3).
//
// Satu-satunya sumber kelas untuk tombol, input, kartu, badge, dan status.
// Sebelum Batch U, setiap komponen menulis kelasnya sendiri — akibatnya aksi
// dengan peran sama tampil dalam tiga gaya berbeda (emerald / slate-800 /
// outline) dan status tugas tampil sebagai teks polos sementara status acara
// tampil sebagai badge.
//
// Aturan pakai:
// - Aksi utama: `tombolUtama` — satu saja per kartu/panel, dan pada layar
//   tanpa kartu satu saja untuk seluruh layar.
// - Aksi pendamping: `tombolSekunder`; aksi baris/daftar: `tombolHalus`.
// - Aksi merusak: `tombolBahaya` (berdiri sendiri), `tombolBahayaHalus`
//   (berulang tiap baris), `tombolBahayaSolid` (dialog konfirmasi, saat
//   pengguna sudah sadar konsekuensinya).
// - Radius: `rounded-kontrol` untuk kontrol, `rounded-kartu` untuk kartu,
//   `rounded-full` hanya untuk badge & bar progres.

import type { StatusAcara, StatusRsvp, StatusTugas } from '../types';

const TOMBOL_DASAR =
  'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-kontrol font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60';
const UKURAN_NORMAL = 'px-4 py-2 text-sm';
const UKURAN_KECIL = 'px-3 py-1.5 text-sm';

export const KELAS = {
  // ── Permukaan ────────────────────────────────────────────────────────────
  /** Kartu berisi konten mandiri (daftar, panel, lembar). */
  kartu: 'rounded-kartu border border-garis bg-permukaan-kartu shadow-kartu',
  /** Kartu dengan padding baku. */
  kartuIsi: 'rounded-kartu border border-garis bg-permukaan-kartu p-4 shadow-kartu',
  /** Blok tenang di dalam kartu — baris item, kotak perhitungan. */
  blok: 'rounded-kontrol bg-permukaan-halus px-3 py-2',
  /** Kondisi kosong ("belum ada …"). */
  kosong: 'rounded-kartu border border-dashed border-garis-kuat p-8 text-center text-sm text-teks-halus',
  /** Kotak pesan error dari service layer. */
  error: 'rounded-kontrol bg-red-50 px-3 py-2 text-sm text-red-700',

  // ── Tipografi ────────────────────────────────────────────────────────────
  judulHalaman: 'text-xl font-semibold text-teks-utama',
  judulKartu: 'text-base font-semibold text-teks-utama',
  keterangan: 'text-sm text-teks-halus',
  keteranganKecil: 'text-xs text-teks-halus',

  // ── Tombol ───────────────────────────────────────────────────────────────
  tombolUtama: `${TOMBOL_DASAR} ${UKURAN_NORMAL} bg-aksen-600 text-white shadow-kartu hover:bg-aksen-700 disabled:bg-netral-300 disabled:text-white`,
  tombolUtamaKecil: `${TOMBOL_DASAR} ${UKURAN_KECIL} bg-aksen-600 text-white hover:bg-aksen-700 disabled:bg-netral-300 disabled:text-white`,
  tombolSekunder: `${TOMBOL_DASAR} ${UKURAN_NORMAL} border border-garis-kuat bg-permukaan-kartu text-teks-sedang hover:bg-netral-50`,
  tombolSekunderKecil: `${TOMBOL_DASAR} ${UKURAN_KECIL} border border-garis-kuat bg-permukaan-kartu text-teks-sedang hover:bg-netral-50`,
  /** Aksi ringan di dalam baris daftar — tanpa garis, tanpa isian. */
  tombolHalus: `${TOMBOL_DASAR} ${UKURAN_KECIL} text-teks-sedang hover:bg-netral-100`,
  tombolBahaya: `${TOMBOL_DASAR} ${UKURAN_KECIL} text-red-600 hover:bg-red-50`,
  /**
   * Aksi merusak yang berulang di setiap baris daftar (mis. Hapus item
   * template, 33 baris sekaligus). Netral sampai disorot, supaya merah tidak
   * jadi elemen paling mencolok di halaman; konfirmasi tetap lewat
   * KonfirmasiDialog. Aksi merusak yang berdiri sendiri tetap `tombolBahaya`.
   */
  tombolBahayaHalus: `${TOMBOL_DASAR} ${UKURAN_KECIL} text-teks-halus hover:bg-red-50 hover:text-red-600`,
  tombolBahayaSolid: `${TOMBOL_DASAR} ${UKURAN_NORMAL} bg-red-600 text-white hover:bg-red-700`,
  /** Tombol ikon persegi (pindah urutan ↑ ↓, tutup dialog). */
  tombolIkon: `${TOMBOL_DASAR} h-8 w-8 text-teks-halus hover:bg-netral-100 hover:text-teks-sedang`,

  // ── Kontrol isian ────────────────────────────────────────────────────────
  input:
    'w-full rounded-kontrol border border-garis-kuat bg-permukaan-kartu px-3 py-2 text-sm text-teks-utama placeholder:text-teks-redup',
  inputKecil:
    'rounded-kontrol border border-garis-kuat bg-permukaan-kartu px-2 py-1.5 text-sm text-teks-utama placeholder:text-teks-redup',
  label: 'block text-sm font-medium text-teks-sedang',

  // ── Badge ────────────────────────────────────────────────────────────────
  badgeNetral:
    'inline-flex items-center rounded-full bg-netral-100 px-2 py-0.5 text-xs font-medium text-teks-sedang ring-1 ring-inset ring-netral-200',
  badgeAksen: 'inline-flex items-center rounded-full bg-aksen-50 px-2 py-0.5 text-xs font-medium text-aksen-700',
  badgeAksenPekat: 'inline-flex items-center rounded-full bg-aksen-600 px-2 py-0.5 text-xs font-medium text-white',
  badgePeringatan: 'inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700',
  badgeBahaya: 'inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600',
  badgeInfo: 'inline-flex items-center rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700',
  badgeUngu: 'inline-flex items-center rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700',
} as const;

// ── Status ─────────────────────────────────────────────────────────────────
// Satu pola untuk semua status yang tampil di layar. Sebelumnya pemetaan warna
// ini terduplikasi di `AcaraView` dan `TamuView`, dan status tugas malah tidak
// memakai badge sama sekali.

/** Badge lengkap untuk status acara (DRAF → DIEVALUASI). */
export function badgeStatusAcara(s: StatusAcara): string {
  switch (s) {
    case 'DRAF':
      return KELAS.badgeNetral;
    case 'SIAP':
      return KELAS.badgeInfo;
    case 'BERJALAN':
      return KELAS.badgePeringatan;
    case 'SELESAI':
      return KELAS.badgeAksen;
    case 'DIEVALUASI':
      return KELAS.badgeUngu;
  }
}

/** Badge lengkap untuk status tugas (BELUM → BATAL). */
export function badgeStatusTugas(s: StatusTugas): string {
  switch (s) {
    case 'BELUM':
      return KELAS.badgeNetral;
    case 'JALAN':
      return KELAS.badgeInfo;
    case 'SELESAI':
      return KELAS.badgeAksen;
    case 'BATAL':
      return KELAS.badgeBahaya;
  }
}

/** Badge lengkap untuk status RSVP kelompok tamu. */
export function badgeStatusRsvp(s: StatusRsvp): string {
  switch (s) {
    case 'BELUM':
      return KELAS.badgeNetral;
    case 'HADIR':
      return KELAS.badgeAksen;
    case 'TIDAK_HADIR':
      return KELAS.badgeBahaya;
  }
}
