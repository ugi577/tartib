// Kelas tampilan bersama Tartib (Batch U-3), rupa kaca di atas krem dengan
// aksen emas (Sesi 20, referensi UI Ahmed — ornamen kartu bertepi emas,
// tombol utama teal gelap berbingkai emas).
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
// - Radius: tombol & badge berbentuk pil (`rounded-full`, pola candy glass),
//   `rounded-kontrol` untuk kontrol isian, `rounded-kartu` untuk kartu.
//
// Pola kaca: permukaan memakai token alpha dari tailwind.config (permukaan.*),
// tepi emas lembut (border-emas-*), backdrop-blur agar latar krem tampak
// kabur di belakang kaca, dan shadow-glosAtas/glowAksen untuk kilau candy.

import type { StatusAcara, StatusRsvp, StatusTugas } from '../types';

const TOMBOL_DASAR =
  'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60';
const UKURAN_NORMAL = 'px-4 py-2 text-sm';
const UKURAN_KECIL = 'px-3 py-1.5 text-sm';

export const KELAS = {
  // ── Permukaan ────────────────────────────────────────────────────────────
  /** Kartu kaca berisi konten mandiri (daftar, panel, lembar) — tepi emas. */
  kartu:
    'rounded-kartu border border-emas-300/60 bg-permukaan-kartu shadow-kartu backdrop-blur-xl backdrop-saturate-150',
  /** Kartu kaca dengan padding baku — tepi emas. */
  kartuIsi:
    'rounded-kartu border border-emas-300/60 bg-permukaan-kartu p-4 shadow-kartu backdrop-blur-xl backdrop-saturate-150',
  /** Blok tenang di dalam kartu — baris item, kotak perhitungan. */
  blok: 'rounded-kontrol bg-permukaan-halus px-3 py-2 ring-1 ring-inset ring-white/50',
  /** Kondisi kosong ("belum ada …"). */
  kosong:
    'rounded-kartu border border-dashed border-garis bg-permukaan-halus p-8 text-center text-sm text-teks-halus backdrop-blur-md',
  /** Kotak pesan error dari service layer. */
  error:
    'rounded-kontrol bg-red-100/70 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-300/60',

  // ── Tipografi ────────────────────────────────────────────────────────────
  judulHalaman: 'text-xl font-semibold text-teks-utama',
  judulKartu: 'text-base font-semibold text-teks-utama',
  keterangan: 'text-sm text-teks-halus',
  keteranganKecil: 'text-xs text-teks-halus',

  // ── Tombol ───────────────────────────────────────────────────────────────
  /** Pil teal gelap berbingkai emas: gradasi aksen + kilau + cahaya (Sesi 20). */
  tombolUtama: `${TOMBOL_DASAR} ${UKURAN_NORMAL} bg-gradient-to-b from-aksen-700 to-aksen-600 text-white shadow-glowAksen ring-1 ring-inset ring-emas-400/70 hover:from-aksen-600 hover:to-aksen-500 disabled:bg-none disabled:bg-netral-300 disabled:text-white disabled:shadow-none disabled:ring-0`,
  tombolUtamaKecil: `${TOMBOL_DASAR} ${UKURAN_KECIL} bg-gradient-to-b from-aksen-700 to-aksen-600 text-white shadow-glowAksen ring-1 ring-inset ring-emas-400/70 hover:from-aksen-600 hover:to-aksen-500 disabled:bg-none disabled:bg-netral-300 disabled:text-white disabled:shadow-none disabled:ring-0`,
  /** Pil kaca bening untuk aksi pendamping. */
  tombolSekunder: `${TOMBOL_DASAR} ${UKURAN_NORMAL} border border-white/80 bg-permukaan-kartu text-teks-sedang shadow-kartu backdrop-blur-md hover:bg-white/75 hover:text-teks-utama`,
  tombolSekunderKecil: `${TOMBOL_DASAR} ${UKURAN_KECIL} border border-white/80 bg-permukaan-kartu text-teks-sedang shadow-kartu backdrop-blur-md hover:bg-white/75 hover:text-teks-utama`,
  /** Aksi ringan di dalam baris daftar — tanpa garis, tanpa isian. */
  tombolHalus: `${TOMBOL_DASAR} ${UKURAN_KECIL} text-teks-sedang hover:bg-white/60 hover:text-teks-utama`,
  tombolBahaya: `${TOMBOL_DASAR} ${UKURAN_KECIL} text-red-600 hover:bg-red-100/70`,
  /**
   * Aksi merusak yang berulang di setiap baris daftar (mis. Hapus item
   * template, 33 baris sekaligus). Netral sampai disorot, supaya merah tidak
   * jadi elemen paling mencolok di halaman; konfirmasi tetap lewat
   * KonfirmasiDialog. Aksi merusak yang berdiri sendiri tetap `tombolBahaya`.
   */
  tombolBahayaHalus: `${TOMBOL_DASAR} ${UKURAN_KECIL} text-teks-halus hover:bg-red-100/70 hover:text-red-600`,
  tombolBahayaSolid: `${TOMBOL_DASAR} ${UKURAN_NORMAL} bg-red-600 text-white shadow-[0_10px_24px_-8px_rgb(220_38_38/0.45)] ring-1 ring-inset ring-white/30 hover:bg-red-700`,
  /** Tombol ikon pil kecil (pindah urutan ↑ ↓, tutup dialog). */
  tombolIkon: `${TOMBOL_DASAR} h-8 w-8 text-teks-sedang hover:bg-white/60 hover:text-teks-utama`,

  // ── Kontrol isian ────────────────────────────────────────────────────────
  input:
    'w-full rounded-kontrol border border-white/80 bg-permukaan-kartu px-3 py-2 text-sm text-teks-utama shadow-glosAtas backdrop-blur-md placeholder:text-teks-redup',
  inputKecil:
    'rounded-kontrol border border-white/80 bg-permukaan-kartu px-2 py-1.5 text-sm text-teks-utama shadow-glosAtas backdrop-blur-md placeholder:text-teks-redup',
  label: 'block text-sm font-medium text-teks-sedang',

  // ── Badge ────────────────────────────────────────────────────────────────
  badgeNetral:
    'inline-flex items-center rounded-full bg-white/60 px-2 py-0.5 text-xs font-medium text-teks-sedang ring-1 ring-inset ring-white/80 backdrop-blur-sm',
  badgeAksen:
    'inline-flex items-center rounded-full bg-aksen-100/70 px-2 py-0.5 text-xs font-medium text-aksen-700 ring-1 ring-inset ring-aksen-200/70',
  badgeAksenPekat:
    'inline-flex items-center rounded-full bg-aksen-600 px-2 py-0.5 text-xs font-medium text-white shadow-glowAksen ring-1 ring-inset ring-white/30',
  badgePeringatan:
    'inline-flex items-center rounded-full bg-amber-100/70 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-200/70',
  badgeBahaya:
    'inline-flex items-center rounded-full bg-red-100/70 px-2 py-0.5 text-xs font-medium text-red-600 ring-1 ring-inset ring-red-200/70',
  badgeInfo:
    'inline-flex items-center rounded-full bg-emas-100/70 px-2 py-0.5 text-xs font-medium text-emas-700 ring-1 ring-inset ring-emas-200/70',
  badgeUngu:
    'inline-flex items-center rounded-full bg-violet-100/70 px-2 py-0.5 text-xs font-medium text-violet-700 ring-1 ring-inset ring-violet-200/70',
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
