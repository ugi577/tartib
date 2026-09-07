// Preset Jadwal KBM (Katalog Template Siap Pakai)
import type { ModelJadwalKbm } from '../../types/kbm';

export const PRESET_KBM_5_HARI: ModelJadwalKbm = {
  id: 'kbm-5-hari',
  judul: 'Jadwal Pelajaran 5 Hari (Senin - Jumat)',
  tipe: '5-hari',
  deskripsi: 'Standar sekolah formal / full-day school: 8 jam pelajaran (JP) per hari dengan istirahat siang shalat & makan.',
  daftarHari: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'],
  daftarJam: [
    { ke: 1, label: '07:15 - 08:00' },
    { ke: 2, label: '08:00 - 08:45' },
    { ke: 3, label: '08:45 - 09:30' },
    { ke: 0, label: '09:30 - 10:00 (Istirahat Dhuha)', istirahat: true },
    { ke: 4, label: '10:00 - 10:45' },
    { ke: 5, label: '10:45 - 11:30' },
    { ke: 0, label: '11:30 - 12:45 (Ishoma)', istirahat: true },
    { ke: 6, label: '12:45 - 13:30' },
    { ke: 7, label: '13:30 - 14:15' },
    { ke: 8, label: '14:15 - 15:00' },
  ],
  daftarKelas: ['VII-A', 'VII-B', 'VIII-A', 'IX-A'],
  entri: [
    // Senin
    { id: '1', hari: 'Senin', jamKe: 1, kelas: 'VII-A', mapel: 'Upacara Bendera', guru: 'Wali Kelas VII-A' },
    { id: '2', hari: 'Senin', jamKe: 2, kelas: 'VII-A', mapel: 'Pendidikan Agama Islam', guru: 'Ust. Anshori, M.Pd' },
    { id: '3', hari: 'Senin', jamKe: 3, kelas: 'VII-A', mapel: 'Pendidikan Agama Islam', guru: 'Ust. Anshori, M.Pd' },
    { id: '4', hari: 'Senin', jamKe: 4, kelas: 'VII-A', mapel: 'Matematika', guru: 'Bu Siti Rahma, S.Pd' },
    { id: '5', hari: 'Senin', jamKe: 5, kelas: 'VII-A', mapel: 'Matematika', guru: 'Bu Siti Rahma, S.Pd' },
    { id: '6', hari: 'Senin', jamKe: 6, kelas: 'VII-A', mapel: 'Bahasa Indonesia', guru: 'Pak Bambang, S.Pd' },
    { id: '7', hari: 'Senin', jamKe: 7, kelas: 'VII-A', mapel: 'Bahasa Indonesia', guru: 'Pak Bambang, S.Pd' },
    { id: '8', hari: 'Senin', jamKe: 8, kelas: 'VII-A', mapel: 'Tahfidz Sore', guru: 'Ust. Bilal' },

    // Selasa
    { id: '9', hari: 'Selasa', jamKe: 1, kelas: 'VII-A', mapel: 'IPA Terpadu', guru: 'Drs. Supriyanto' },
    { id: '10', hari: 'Selasa', jamKe: 2, kelas: 'VII-A', mapel: 'IPA Terpadu', guru: 'Drs. Supriyanto' },
    { id: '11', hari: 'Selasa', jamKe: 3, kelas: 'VII-A', mapel: 'Bahasa Arab', guru: 'Ust. Farhan' },
    { id: '12', hari: 'Selasa', jamKe: 4, kelas: 'VII-A', mapel: 'Bahasa Arab', guru: 'Ust. Farhan' },
    { id: '13', hari: 'Selasa', jamKe: 5, kelas: 'VII-A', mapel: 'Bahasa Inggris', guru: 'Miss Linda, M.Ed' },
    { id: '14', hari: 'Selasa', jamKe: 6, kelas: 'VII-A', mapel: 'Bahasa Inggris', guru: 'Miss Linda, M.Ed' },
    { id: '15', hari: 'Selasa', jamKe: 7, kelas: 'VII-A', mapel: 'IPS', guru: 'Pak Hendra' },
    { id: '16', hari: 'Selasa', jamKe: 8, kelas: 'VII-A', mapel: 'Pramuka / Ekskul', guru: 'Tim Pembina' },
  ],
  dibuatPada: new Date().toISOString(),
};

export const PRESET_KBM_6_HARI: ModelJadwalKbm = {
  id: 'kbm-6-hari',
  judul: 'Jadwal Madrasah 6 Hari (Senin - Sabtu)',
  tipe: '6-hari',
  deskripsi: 'Sistem madrasah / pondok pesantren: kombinasi mapel diniyah (Nahwu, Fiqih, Hadits) & kurikulum nasional 6 JP per hari.',
  daftarHari: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'],
  daftarJam: [
    { ke: 1, label: '07:30 - 08:15' },
    { ke: 2, label: '08:15 - 09:00' },
    { ke: 3, label: '09:00 - 09:45' },
    { ke: 0, label: '09:45 - 10:15 (Istirahat)', istirahat: true },
    { ke: 4, label: '10:15 - 11:00' },
    { ke: 5, label: '11:00 - 11:45' },
    { ke: 6, label: '11:45 - 12:30' },
  ],
  daftarKelas: ['1 Diniyah (Ula)', '2 Diniyah (Wustha)', '3 Diniyah (Ulya)'],
  entri: [
    // Senin
    { id: '101', hari: 'Senin', jamKe: 1, kelas: '1 Diniyah (Ula)', mapel: 'Nahwu Jurumiyyah', guru: 'Ust. Abdurrahman' },
    { id: '102', hari: 'Senin', jamKe: 2, kelas: '1 Diniyah (Ula)', mapel: 'Nahwu Jurumiyyah', guru: 'Ust. Abdurrahman' },
    { id: '103', hari: 'Senin', jamKe: 3, kelas: '1 Diniyah (Ula)', mapel: 'Shorof Amtsilah', guru: 'Ust. Hasan' },
    { id: '104', hari: 'Senin', jamKe: 4, kelas: '1 Diniyah (Ula)', mapel: 'Fiqih Fathul Qorib', guru: 'Kiai Masykur' },
    { id: '105', hari: 'Senin', jamKe: 5, kelas: '1 Diniyah (Ula)', mapel: 'Aqidah Sanusiyyah', guru: 'Ust. Dimas' },
    { id: '106', hari: 'Senin', jamKe: 6, kelas: '1 Diniyah (Ula)', mapel: 'Hadits Arbain Nawawi', guru: 'Ust. Yusuf' },

    // Selasa
    { id: '107', hari: 'Selasa', jamKe: 1, kelas: '1 Diniyah (Ula)', mapel: 'Tarikh Islam', guru: 'Ust. Juswandi' },
    { id: '108', hari: 'Selasa', jamKe: 2, kelas: '1 Diniyah (Ula)', mapel: 'Tajwid Tuhfatul Athfal', guru: 'Ust. Hafizh' },
    { id: '109', hari: 'Selasa', jamKe: 3, kelas: '1 Diniyah (Ula)', mapel: 'Matematika Dasar', guru: 'Pak Wahyu' },
    { id: '110', hari: 'Selasa', jamKe: 4, kelas: '1 Diniyah (Ula)', mapel: 'Bahasa Indonesia', guru: 'Bu Anisa' },
    { id: '111', hari: 'Selasa', jamKe: 5, kelas: '1 Diniyah (Ula)', mapel: 'Bahasa Arab (Insya)', guru: 'Ust. Farhan' },
    { id: '112', hari: 'Selasa', jamKe: 6, kelas: '1 Diniyah (Ula)', mapel: 'Khath / Imla', guru: 'Ust. Syarif' },
  ],
  dibuatPada: new Date().toISOString(),
};

export const PRESET_KBM_ROSTER_TAHFIDZ: ModelJadwalKbm = {
  id: 'kbm-tahfidz',
  judul: 'Roster Halaqah Tahfidz Al-Qur’an',
  tipe: 'tahfidz',
  deskripsi: 'Jadwal 3 sesi utama harian: Ziyadah (Ba’da Subuh), Muroja’ah Dekat (Ba’da Ashar), dan Tasmi’ / Muroja’ah Akbar (Ba’da Maghrib).',
  daftarHari: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'],
  daftarJam: [
    { ke: 1, label: '05:15 - 06:45 (Sesi 1: Setoran Ziyadah Baru)' },
    { ke: 2, label: '16:00 - 17:30 (Sesi 2: Muroja’ah Sab’i / Dekat)' },
    { ke: 3, label: '18:30 - 20:00 (Sesi 3: Tasmi’ Juz & Mutqin)' },
  ],
  daftarKelas: ['Halaqah Ula (Juz 1-5)', 'Halaqah Wustha (Juz 6-15)', 'Halaqah Mutqinin (Juz 16-30)'],
  entri: [
    { id: '201', hari: 'Senin', jamKe: 1, kelas: 'Halaqah Ula (Juz 1-5)', mapel: 'Ziyadah 1/2 Halaman', guru: 'Ust. Hafizh Al-Hafidz' },
    { id: '202', hari: 'Senin', jamKe: 2, kelas: 'Halaqah Ula (Juz 1-5)', mapel: 'Muroja’ah 1/4 Juz', guru: 'Ust. Hafizh Al-Hafidz' },
    { id: '203', hari: 'Senin', jamKe: 3, kelas: 'Halaqah Ula (Juz 1-5)', mapel: 'Tasmi’ Berpasangan', guru: 'Ust. Bilal' },

    { id: '204', hari: 'Senin', jamKe: 1, kelas: 'Halaqah Wustha (Juz 6-15)', mapel: 'Ziyadah 1 Halaman Penuh', guru: 'Ust. Dimas Erlangga' },
    { id: '205', hari: 'Senin', jamKe: 2, kelas: 'Halaqah Wustha (Juz 6-15)', mapel: 'Muroja’ah 1/2 Juz', guru: 'Ust. Dimas Erlangga' },
    { id: '206', hari: 'Senin', jamKe: 3, kelas: 'Halaqah Wustha (Juz 6-15)', mapel: 'Uji Hafalan Pekanan', guru: 'Ust. Juswandi' },

    { id: '207', hari: 'Senin', jamKe: 1, kelas: 'Halaqah Mutqinin (Juz 16-30)', mapel: 'Ziyadah & Qira’at', guru: 'KH. Abdullah' },
    { id: '208', hari: 'Senin', jamKe: 2, kelas: 'Halaqah Mutqinin (Juz 16-30)', mapel: 'Muroja’ah 1 Juz Bil-Ghaib', guru: 'Ust. Yusuf' },
    { id: '209', hari: 'Senin', jamKe: 3, kelas: 'Halaqah Mutqinin (Juz 16-30)', mapel: 'Kajian Kaidah Tajwid Jazariyyah', guru: 'KH. Abdullah' },
  ],
  dibuatPada: new Date().toISOString(),
};

export const PRESET_KBM_PESANTREN_2026_2027: ModelJadwalKbm = {
  id: 'kbm-pesantren-2026-2027',
  judul: 'Jadwal Harian Pesantren Tahfidz',
  tahunAjaran: 'TAHUN AJARAN 2026-2027',
  subJudul: 'Hari/ Mata Pelajaran',
  tipe: 'pesantren',
  deskripsi: 'Jadwal harian lengkap pondok pesantren tahfidz 7 hari (Senin s/d Ahad): 8 majelis sabqi & murojaah, taklim harian, shalat berjamaah, hingga wajib tidur malam.',
  daftarHari: ['Senin', 'Selasa', 'Rabu', 'Kamis', "Jum'at", 'Sabtu', 'Ahad'],
  daftarJam: [
    { ke: 1, nomorSesi: 1, label: '03.00 - 03.45', warna: 'kuning' },
    { ke: 2, label: '03.45 - 04.30' },
    { ke: 3, label: '04.30 - 05.00', warna: 'hijau' },
    { ke: 4, label: '05.00 - 05.30', warna: 'kuning' },
    { ke: 5, nomorSesi: 2, label: '05.30 - 06.30', warna: 'kuning' },
    { ke: 6, label: '06.30 - 07.45' },
    { ke: 7, label: '07.45 - 08.00' },
    { ke: 8, nomorSesi: 3, label: '08.00 - 09.15', warna: 'kuning' },
    { ke: 9, nomorSesi: 4, label: '09.15 - SELESAI', warna: 'kuning' },
    { ke: 10, label: '11.00 - 12.00' },
    { ke: 11, label: '12.00 - 13.30' },
    { ke: 12, nomorSesi: 5, label: '13.30 - 15.00', warna: 'kuning' },
    { ke: 13, label: '15.00 - 15.45' },
    { ke: 14, label: '15.45 - 17.30', istirahat: true },
    { ke: 15, nomorSesi: 6, label: '17.30 - 18.00', warna: 'kuning' },
    { ke: 16, label: '18.00 - 18.45' },
    { ke: 17, nomorSesi: 7, label: '18.45 - 19.30', warna: 'kuning' },
    { ke: 18, label: '19.30 - 20.30' },
    { ke: 19, nomorSesi: 8, label: '20.00 - 20.45', warna: 'kuning' },
    { ke: 20, label: '20.40 - 21.15' },
    { ke: 21, label: '21.15 - 03.00', istirahat: true, warna: 'abu' },
  ],
  daftarKelas: ['Semua Santri / Halaqah', 'Halaqah Ula', 'Halaqah Wustha', 'Halaqah Ulya'],
  entri: [
    // ── JP 1 (03.00 - 03.45) Sesi 1 ──────────────────────────────────────────
    { id: 'p1-sen', hari: 'Senin', jamKe: 1, kelas: 'Semua Santri / Halaqah', mapel: 'Qiyamullail berjamaah, persiapan hafalan Sabqi', warna: 'kuning' },
    { id: 'p1-sel', hari: 'Selasa', jamKe: 1, kelas: 'Semua Santri / Halaqah', mapel: 'Qiyamullail berjamaah, persiapan hafalan Sabqi', warna: 'kuning' },
    { id: 'p1-rab', hari: 'Rabu', jamKe: 1, kelas: 'Semua Santri / Halaqah', mapel: 'Qiyamullail berjamaah, persiapan hafalan Sabqi', warna: 'kuning' },
    { id: 'p1-kam', hari: 'Kamis', jamKe: 1, kelas: 'Semua Santri / Halaqah', mapel: 'Qiyamullail berjamaah, persiapan hafalan Sabqi', warna: 'kuning' },
    { id: 'p1-jum', hari: "Jum'at", jamKe: 1, kelas: 'Semua Santri / Halaqah', mapel: 'Qiyamullail berjamaah, Infirodi', warna: 'kuning' },
    { id: 'p1-sab', hari: 'Sabtu', jamKe: 1, kelas: 'Semua Santri / Halaqah', mapel: 'Qiyamullail berjamaah, MUROJAAH IJMAALI 5 JUZ ( JUZ PERTAMA )', warna: 'kuning' },
    { id: 'p1-ahd', hari: 'Ahad', jamKe: 1, kelas: 'Semua Santri / Halaqah', mapel: 'Qiyamullail berjamaah, persiapan hafalan Sabqi', warna: 'kuning' },

    // ── JP 2 (03.45 - 04.30) ─────────────────────────────────────────────────
    { id: 'p2-sen', hari: 'Senin', jamKe: 2, kelas: 'Semua Santri / Halaqah', mapel: 'Surah Thoha, Muzzammil, Istigfar dan doa fajr' },
    { id: 'p2-sel', hari: 'Selasa', jamKe: 2, kelas: 'Semua Santri / Halaqah', mapel: 'Surah Thoha, Muzzammil, Istigfar dan doa fajr' },
    { id: 'p2-rab', hari: 'Rabu', jamKe: 2, kelas: 'Semua Santri / Halaqah', mapel: 'Surah Thoha, Muzzammil, Istigfar dan doa fajr' },
    { id: 'p2-kam', hari: 'Kamis', jamKe: 2, kelas: 'Semua Santri / Halaqah', mapel: 'Surah Thoha, Muzzammil, Istigfar dan doa fajr' },
    { id: 'p2-jum', hari: "Jum'at", jamKe: 2, kelas: 'Semua Santri / Halaqah', mapel: 'Surah Thoha, Muzzammil, Istigfar dan doa fajr' },
    { id: 'p2-sab', hari: 'Sabtu', jamKe: 2, kelas: 'Semua Santri / Halaqah', mapel: 'Surah Thoha, Muzzammil, Istigfar dan doa fajr' },
    { id: 'p2-ahd', hari: 'Ahad', jamKe: 2, kelas: 'Semua Santri / Halaqah', mapel: 'Surah Thoha, Muzzammil, Istigfar dan doa fajr' },

    // ── JP 3 (04.30 - 05.00) ─────────────────────────────────────────────────
    { id: 'p3-sen', hari: 'Senin', jamKe: 3, kelas: 'Semua Santri / Halaqah', mapel: 'Shalat Subuh, Dzikir Pagi', warna: 'hijau' },
    { id: 'p3-sel', hari: 'Selasa', jamKe: 3, kelas: 'Semua Santri / Halaqah', mapel: 'Shalat Subuh, Dzikir Pagi', warna: 'hijau' },
    { id: 'p3-rab', hari: 'Rabu', jamKe: 3, kelas: 'Semua Santri / Halaqah', mapel: 'Shalat Subuh, Dzikir Pagi', warna: 'hijau' },
    { id: 'p3-kam', hari: 'Kamis', jamKe: 3, kelas: 'Semua Santri / Halaqah', mapel: 'Shalat Subuh, Dzikir Pagi', warna: 'hijau' },
    { id: 'p3-jum', hari: "Jum'at", jamKe: 3, kelas: 'Semua Santri / Halaqah', mapel: 'Shalat Subuh, Dzikir Pagi', warna: 'hijau' },
    { id: 'p3-sab', hari: 'Sabtu', jamKe: 3, kelas: 'Semua Santri / Halaqah', mapel: 'Shalat Subuh, Dzikir Pagi', warna: 'hijau' },
    { id: 'p3-ahd', hari: 'Ahad', jamKe: 3, kelas: 'Semua Santri / Halaqah', mapel: 'Shalat Subuh, Dzikir Pagi', warna: 'hijau' },

    // ── JP 4 (05.00 - 05.30) ─────────────────────────────────────────────────
    { id: 'p4-sen', hari: 'Senin', jamKe: 4, kelas: 'Semua Santri / Halaqah', mapel: 'TAKLIM FIQIH', warna: 'kuning' },
    { id: 'p4-sel', hari: 'Selasa', jamKe: 4, kelas: 'Semua Santri / Halaqah', mapel: 'TAKLIM HADITS', warna: 'kuning' },
    { id: 'p4-rab', hari: 'Rabu', jamKe: 4, kelas: 'Semua Santri / Halaqah', mapel: 'TAKLIM BAHASA ARAB', warna: 'kuning' },
    { id: 'p4-kam', hari: 'Kamis', jamKe: 4, kelas: 'Semua Santri / Halaqah', mapel: 'KHATAMAN QURAN & DOA', warna: 'kuning' },
    { id: 'p4-jum', hari: "Jum'at", jamKe: 4, kelas: 'Semua Santri / Halaqah', mapel: 'TAKLIM / TARBIYAH', warna: 'kuning' },
    { id: 'p4-sab', hari: 'Sabtu', jamKe: 4, kelas: 'Semua Santri / Halaqah', mapel: 'EVALUASI PROGRAM YANG BERLANGSUNG SEMINGGU', warna: 'kuning' },
    { id: 'p4-ahd', hari: 'Ahad', jamKe: 4, kelas: 'Semua Santri / Halaqah', mapel: 'TAKLIM ULUMUL QURAN', warna: 'kuning' },

    // ── JP 5 (05.30 - 06.30) Sesi 2 ──────────────────────────────────────────
    { id: 'p5-sen', hari: 'Senin', jamKe: 5, kelas: 'Semua Santri / Halaqah', mapel: "Tasmi' / Persiapan ziyadah Pagi", warna: 'kuning' },
    { id: 'p5-sel', hari: 'Selasa', jamKe: 5, kelas: 'Semua Santri / Halaqah', mapel: "Tasmi' / Persiapan ziyadah Pagi", warna: 'kuning' },
    { id: 'p5-rab', hari: 'Rabu', jamKe: 5, kelas: 'Semua Santri / Halaqah', mapel: "Tasmi' / Persiapan ziyadah Pagi", warna: 'kuning' },
    { id: 'p5-kam', hari: 'Kamis', jamKe: 5, kelas: 'Semua Santri / Halaqah', mapel: 'KHATAMAN QURAN & DOA', warna: 'kuning' },
    { id: 'p5-jum', hari: "Jum'at", jamKe: 5, kelas: 'Semua Santri / Halaqah', mapel: 'MAJELIS SHOLAWAT BURDAH', warna: 'kuning' },
    { id: 'p5-sab', hari: 'Sabtu', jamKe: 5, kelas: 'Semua Santri / Halaqah', mapel: 'MUROJAAH IJMAALI 5 JUZ ( JUZ KEDUA )', warna: 'kuning' },
    { id: 'p5-ahd', hari: 'Ahad', jamKe: 5, kelas: 'Semua Santri / Halaqah', mapel: "Tasmi' / Persiapan ziyadah Pagi", warna: 'kuning' },

    // ── JP 6 (06.30 - 07.45) ─────────────────────────────────────────────────
    { id: 'p6-sen', hari: 'Senin', jamKe: 6, kelas: 'Semua Santri / Halaqah', mapel: 'Piket bersih-bersih, makan pagi,mandi' },
    { id: 'p6-sel', hari: 'Selasa', jamKe: 6, kelas: 'Semua Santri / Halaqah', mapel: 'Piket bersih-bersih, makan pagi,mandi' },
    { id: 'p6-rab', hari: 'Rabu', jamKe: 6, kelas: 'Semua Santri / Halaqah', mapel: 'Piket bersih-bersih, makan pagi,mandi' },
    { id: 'p6-kam', hari: 'Kamis', jamKe: 6, kelas: 'Semua Santri / Halaqah', mapel: 'Piket bersih-bersih, makan pagi,mandi' },
    { id: 'p6-jum', hari: "Jum'at", jamKe: 6, kelas: 'Semua Santri / Halaqah', mapel: 'KEBERSIHAN UMUM' },
    { id: 'p6-sab', hari: 'Sabtu', jamKe: 6, kelas: 'Semua Santri / Halaqah', mapel: 'KEBERSIHAN UMUM DI LINGKUNGAN MAHAD' },
    { id: 'p6-ahd', hari: 'Ahad', jamKe: 6, kelas: 'Semua Santri / Halaqah', mapel: 'Piket bersih-bersih, makan pagi,mandi' },

    // ── JP 7 (07.45 - 08.00) ─────────────────────────────────────────────────
    { id: 'p7-sen', hari: 'Senin', jamKe: 7, kelas: 'Semua Santri / Halaqah', mapel: 'Nazhom Aqidah, Dhuha berjamaah, Asmaul Husna dan Doa Majelis' },
    { id: 'p7-sel', hari: 'Selasa', jamKe: 7, kelas: 'Semua Santri / Halaqah', mapel: 'Nazhom Aqidah, Dhuha berjamaah, Asmaul Husna dan Doa Majelis' },
    { id: 'p7-rab', hari: 'Rabu', jamKe: 7, kelas: 'Semua Santri / Halaqah', mapel: 'Nazhom Aqidah, Dhuha berjamaah, Asmaul Husna dan Doa Majelis' },
    { id: 'p7-kam', hari: 'Kamis', jamKe: 7, kelas: 'Semua Santri / Halaqah', mapel: 'Nazhom Aqidah, Dhuha berjamaah, Asmaul Husna dan Doa Majelis' },
    { id: 'p7-jum', hari: "Jum'at", jamKe: 7, kelas: 'Semua Santri / Halaqah', mapel: 'KEBERSIHAN UMUM' },
    { id: 'p7-sab', hari: 'Sabtu', jamKe: 7, kelas: 'Semua Santri / Halaqah', mapel: 'KEBERSIHAN UMUM DI LINGKUNGAN MAHAD' },
    { id: 'p7-ahd', hari: 'Ahad', jamKe: 7, kelas: 'Semua Santri / Halaqah', mapel: 'Nazhom Aqidah, Dhuha berjamaah, Asmaul Husna dan Doa Majelis' },

    // ── JP 8 (08.00 - 09.15) Sesi 3 ──────────────────────────────────────────
    { id: 'p8-sen', hari: 'Senin', jamKe: 8, kelas: 'Semua Santri / Halaqah', mapel: 'Majelis SABQI PAGI', warna: 'kuning' },
    { id: 'p8-sel', hari: 'Selasa', jamKe: 8, kelas: 'Semua Santri / Halaqah', mapel: 'Majelis SABQI PAGI', warna: 'kuning' },
    { id: 'p8-rab', hari: 'Rabu', jamKe: 8, kelas: 'Semua Santri / Halaqah', mapel: 'Majelis SABQI PAGI', warna: 'kuning' },
    { id: 'p8-kam', hari: 'Kamis', jamKe: 8, kelas: 'Semua Santri / Halaqah', mapel: 'Majelis SABQI PAGI', warna: 'kuning' },
    { id: 'p8-jum', hari: "Jum'at", jamKe: 8, kelas: 'Semua Santri / Halaqah', mapel: 'QOILULAH DAN MEMPERHATIKAN SUNNAH-SUNNAH HARI JUMAT', warna: 'hijau' },
    { id: 'p8-sab', hari: 'Sabtu', jamKe: 8, kelas: 'Semua Santri / Halaqah', mapel: 'KEBERSIHAN UMUM DI LINGKUNGAN MAHAD' },
    { id: 'p8-ahd', hari: 'Ahad', jamKe: 8, kelas: 'Semua Santri / Halaqah', mapel: 'Majelis SABQI PAGI', warna: 'kuning' },

    // ── JP 9 (09.15 - SELESAI) Sesi 4 ────────────────────────────────────────
    { id: 'p9-sen', hari: 'Senin', jamKe: 9, kelas: 'Semua Santri / Halaqah', mapel: 'Majelis MUROJAAH SABQI', warna: 'kuning' },
    { id: 'p9-sel', hari: 'Selasa', jamKe: 9, kelas: 'Semua Santri / Halaqah', mapel: 'Majelis MUROJAAH SABQI', warna: 'kuning' },
    { id: 'p9-rab', hari: 'Rabu', jamKe: 9, kelas: 'Semua Santri / Halaqah', mapel: 'Majelis MUROJAAH SABQI', warna: 'kuning' },
    { id: 'p9-kam', hari: 'Kamis', jamKe: 9, kelas: 'Semua Santri / Halaqah', mapel: 'Majelis MUROJAAH SABQI', warna: 'kuning' },
    { id: 'p9-jum', hari: "Jum'at", jamKe: 9, kelas: 'Semua Santri / Halaqah', mapel: 'QOILULAH DAN MEMPERHATIKAN SUNNAH-SUNNAH HARI JUMAT', warna: 'hijau' },
    { id: 'p9-sab', hari: 'Sabtu', jamKe: 9, kelas: 'Semua Santri / Halaqah', mapel: 'MUROJAAH IJMAALI 5 JUZ ( JUZ KETIGA )', warna: 'kuning' },
    { id: 'p9-ahd', hari: 'Ahad', jamKe: 9, kelas: 'Semua Santri / Halaqah', mapel: 'Majelis MUROJAAH SABQI', warna: 'kuning' },

    // ── JP 10 (11.00 - 12.00) ────────────────────────────────────────────────
    { id: 'p10-sen', hari: 'Senin', jamKe: 10, kelas: 'Semua Santri / Halaqah', mapel: 'Wajib Qoilulah' },
    { id: 'p10-sel', hari: 'Selasa', jamKe: 10, kelas: 'Semua Santri / Halaqah', mapel: 'Wajib Qoilulah' },
    { id: 'p10-rab', hari: 'Rabu', jamKe: 10, kelas: 'Semua Santri / Halaqah', mapel: 'Wajib Qoilulah' },
    { id: 'p10-kam', hari: 'Kamis', jamKe: 10, kelas: 'Semua Santri / Halaqah', mapel: 'Wajib Qoilulah' },
    { id: 'p10-jum', hari: "Jum'at", jamKe: 10, kelas: 'Semua Santri / Halaqah', mapel: 'QOILULAH DAN MEMPERHATIKAN SUNNAH-SUNNAH HARI JUMAT', warna: 'hijau' },
    { id: 'p10-sab', hari: 'Sabtu', jamKe: 10, kelas: 'Semua Santri / Halaqah', mapel: 'MUROJAAH IJMAALI 5 JUZ ( JUZ KETIGA )', warna: 'kuning' },
    { id: 'p10-ahd', hari: 'Ahad', jamKe: 10, kelas: 'Semua Santri / Halaqah', mapel: 'Wajib Qoilulah' },

    // ── JP 11 (12.00 - 13.30) ────────────────────────────────────────────────
    { id: 'p11-sen', hari: 'Senin', jamKe: 11, kelas: 'Semua Santri / Halaqah', mapel: 'Persiapan dzuhur, shalat dzuhur, yaasin & doa' },
    { id: 'p11-sel', hari: 'Selasa', jamKe: 11, kelas: 'Semua Santri / Halaqah', mapel: 'Persiapan dzuhur, shalat dzuhur, yaasin & doa' },
    { id: 'p11-rab', hari: 'Rabu', jamKe: 11, kelas: 'Semua Santri / Halaqah', mapel: 'Persiapan dzuhur, shalat dzuhur, yaasin & doa' },
    { id: 'p11-kam', hari: 'Kamis', jamKe: 11, kelas: 'Semua Santri / Halaqah', mapel: 'Persiapan dzuhur, shalat dzuhur, yaasin & doa' },
    { id: 'p11-jum', hari: "Jum'at", jamKe: 11, kelas: 'Semua Santri / Halaqah', mapel: 'QOILULAH DAN MEMPERHATIKAN SUNNAH-SUNNAH HARI JUMAT', warna: 'hijau' },
    { id: 'p11-sab', hari: 'Sabtu', jamKe: 11, kelas: 'Semua Santri / Halaqah', mapel: 'REFRESH' },
    { id: 'p11-ahd', hari: 'Ahad', jamKe: 11, kelas: 'Semua Santri / Halaqah', mapel: 'Persiapan dzuhur, shalat dzuhur, yaasin & doa' },

    // ── JP 12 (13.30 - 15.00) Sesi 5 ─────────────────────────────────────────
    { id: 'p12-sen', hari: 'Senin', jamKe: 12, kelas: 'Semua Santri / Halaqah', mapel: 'Majelis SABQI SORE', warna: 'kuning' },
    { id: 'p12-sel', hari: 'Selasa', jamKe: 12, kelas: 'Semua Santri / Halaqah', mapel: 'Majelis SABQI SORE', warna: 'kuning' },
    { id: 'p12-rab', hari: 'Rabu', jamKe: 12, kelas: 'Semua Santri / Halaqah', mapel: 'Majelis SABQI SORE', warna: 'kuning' },
    { id: 'p12-kam', hari: 'Kamis', jamKe: 12, kelas: 'Semua Santri / Halaqah', mapel: 'MUROJAAH MANZIL 1 JUZ', warna: 'kuning' },
    { id: 'p12-jum', hari: "Jum'at", jamKe: 12, kelas: 'Semua Santri / Halaqah', mapel: 'QOILULAH DAN MEMPERHATIKAN SUNNAH-SUNNAH HARI JUMAT', warna: 'hijau' },
    { id: 'p12-sab', hari: 'Sabtu', jamKe: 12, kelas: 'Semua Santri / Halaqah', mapel: 'REFRESH' },
    { id: 'p12-ahd', hari: 'Ahad', jamKe: 12, kelas: 'Semua Santri / Halaqah', mapel: 'Majelis SABQI SORE', warna: 'kuning' },

    // ── JP 13 (15.00 - 15.45) ────────────────────────────────────────────────
    { id: 'p13-sen', hari: 'Senin', jamKe: 13, kelas: 'Semua Santri / Halaqah', mapel: 'Sholat Ashar, Zikr Sore, Al Waqiah+Doa' },
    { id: 'p13-sel', hari: 'Selasa', jamKe: 13, kelas: 'Semua Santri / Halaqah', mapel: 'Sholat Ashar, Zikr Sore, Al Waqiah+Doa' },
    { id: 'p13-rab', hari: 'Rabu', jamKe: 13, kelas: 'Semua Santri / Halaqah', mapel: 'Sholat Ashar, Zikr Sore, Al Waqiah+Doa' },
    { id: 'p13-kam', hari: 'Kamis', jamKe: 13, kelas: 'Semua Santri / Halaqah', mapel: 'Sholat Ashar, Zikr Sore, Al Waqiah+Doa' },
    { id: 'p13-jum', hari: "Jum'at", jamKe: 13, kelas: 'Semua Santri / Halaqah', mapel: 'Sholat Ashar, Zikr Sore, Al Waqiah+Doa' },
    { id: 'p13-sab', hari: 'Sabtu', jamKe: 13, kelas: 'Semua Santri / Halaqah', mapel: 'MUROJAAH IJMAALI 5 JUZ ( JUZ KEEMPAT )', warna: 'kuning' },
    { id: 'p13-ahd', hari: 'Ahad', jamKe: 13, kelas: 'Semua Santri / Halaqah', mapel: 'Sholat Ashar, Zikr Sore, Al Waqiah+Doa' },

    // ── JP 14 (15.45 - 17.30) ────────────────────────────────────────────────
    { id: 'p14-sen', hari: 'Senin', jamKe: 14, kelas: 'Semua Santri / Halaqah', mapel: 'Infirodi / istirahat' },
    { id: 'p14-sel', hari: 'Selasa', jamKe: 14, kelas: 'Semua Santri / Halaqah', mapel: 'Infirodi / istirahat' },
    { id: 'p14-rab', hari: 'Rabu', jamKe: 14, kelas: 'Semua Santri / Halaqah', mapel: 'Infirodi / istirahat' },
    { id: 'p14-kam', hari: 'Kamis', jamKe: 14, kelas: 'Semua Santri / Halaqah', mapel: 'Infirodi / istirahat' },
    { id: 'p14-jum', hari: "Jum'at", jamKe: 14, kelas: 'Semua Santri / Halaqah', mapel: 'Infirodi / istirahat' },
    { id: 'p14-sab', hari: 'Sabtu', jamKe: 14, kelas: 'Semua Santri / Halaqah', mapel: 'Infirodi / istirahat' },
    { id: 'p14-ahd', hari: 'Ahad', jamKe: 14, kelas: 'Semua Santri / Halaqah', mapel: 'Infirodi / istirahat' },

    // ── JP 15 (17.30 - 18.00) Sesi 6 ─────────────────────────────────────────
    { id: 'p15-sen', hari: 'Senin', jamKe: 15, kelas: 'Semua Santri / Halaqah', mapel: 'ZIKR PETANG, As-Sajdah, Al-Mulk & Ratib', warna: 'kuning' },
    { id: 'p15-sel', hari: 'Selasa', jamKe: 15, kelas: 'Semua Santri / Halaqah', mapel: 'ZIKR PETANG, As-Sajdah, Al-Mulk & Ratib', warna: 'kuning' },
    { id: 'p15-rab', hari: 'Rabu', jamKe: 15, kelas: 'Semua Santri / Halaqah', mapel: 'ZIKR PETANG, As-Sajdah, Al-Mulk & Ratib', warna: 'kuning' },
    { id: 'p15-kam', hari: 'Kamis', jamKe: 15, kelas: 'Semua Santri / Halaqah', mapel: 'TAKLIM KITAB FIQIH', warna: 'kuning' },
    { id: 'p15-jum', hari: "Jum'at", jamKe: 15, kelas: 'Semua Santri / Halaqah', mapel: 'ZIKR PETANG, As-Sajdah, Al-Mulk & Ratib', warna: 'kuning' },
    { id: 'p15-sab', hari: 'Sabtu', jamKe: 15, kelas: 'Semua Santri / Halaqah', mapel: 'ZIKR PETANG, As-Sajdah, Al-Mulk & Ratib', warna: 'kuning' },
    { id: 'p15-ahd', hari: 'Ahad', jamKe: 15, kelas: 'Semua Santri / Halaqah', mapel: 'ZIKR PETANG, As-Sajdah, Al-Mulk & Ratib', warna: 'kuning' },

    // ── JP 16 (18.00 - 18.45) ────────────────────────────────────────────────
    { id: 'p16-sen', hari: 'Senin', jamKe: 16, kelas: 'Semua Santri / Halaqah', mapel: "Shalat Maghrib Berjama'ah" },
    { id: 'p16-sel', hari: 'Selasa', jamKe: 16, kelas: 'Semua Santri / Halaqah', mapel: "Shalat Maghrib Berjama'ah" },
    { id: 'p16-rab', hari: 'Rabu', jamKe: 16, kelas: 'Semua Santri / Halaqah', mapel: "Shalat Maghrib Berjama'ah" },
    { id: 'p16-kam', hari: 'Kamis', jamKe: 16, kelas: 'Semua Santri / Halaqah', mapel: 'Magrib, AL-KAHFI, Ad - Dukhan, Al-Waqiah, Muzzammil dll', warna: 'kuning' },
    { id: 'p16-jum', hari: "Jum'at", jamKe: 16, kelas: 'Semua Santri / Halaqah', mapel: 'Majelis Nazhoman Tuhfah, Aqidah dan Wasiyhat Ikhwan', warna: 'kuning' },
    { id: 'p16-sab', hari: 'Sabtu', jamKe: 16, kelas: 'Semua Santri / Halaqah', mapel: "Shalat Maghrib Berjama'ah" },
    { id: 'p16-ahd', hari: 'Ahad', jamKe: 16, kelas: 'Semua Santri / Halaqah', mapel: "Shalat Maghrib Berjama'ah" },

    // ── JP 17 (18.45 - 19.30) Sesi 7 ─────────────────────────────────────────
    { id: 'p17-sen', hari: 'Senin', jamKe: 17, kelas: 'Semua Santri / Halaqah', mapel: 'HIZB HALAQOH MANZIL 1 JUZ / TAHSIN', warna: 'kuning' },
    { id: 'p17-sel', hari: 'Selasa', jamKe: 17, kelas: 'Semua Santri / Halaqah', mapel: 'HIZB HALAQOH MANZIL 1 JUZ / TAHSIN', warna: 'kuning' },
    { id: 'p17-rab', hari: 'Rabu', jamKe: 17, kelas: 'Semua Santri / Halaqah', mapel: 'HIZB HALAQOH MANZIL 1 JUZ / TAHSIN', warna: 'kuning' },
    { id: 'p17-kam', hari: 'Kamis', jamKe: 17, kelas: 'Semua Santri / Halaqah', mapel: 'latihan muhadhoroh/Ceramah' },
    { id: 'p17-jum', hari: "Jum'at", jamKe: 17, kelas: 'Semua Santri / Halaqah', mapel: 'MUSYAWARAH PEKANAN', warna: 'kuning' },
    { id: 'p17-sab', hari: 'Sabtu', jamKe: 17, kelas: 'Semua Santri / Halaqah', mapel: 'MUROJAAH IJMAALI 5 JUZ ( JUZ KELIMA )', warna: 'kuning' },
    { id: 'p17-ahd', hari: 'Ahad', jamKe: 17, kelas: 'Semua Santri / Halaqah', mapel: 'Majelis Sirah Nabawi + Doa', warna: 'kuning' },

    // ── JP 18 (19.30 - 20.30) ────────────────────────────────────────────────
    { id: 'p18-sen', hari: 'Senin', jamKe: 18, kelas: 'Semua Santri / Halaqah', mapel: 'Shalat isya berjamaah' },
    { id: 'p18-sel', hari: 'Selasa', jamKe: 18, kelas: 'Semua Santri / Halaqah', mapel: 'Shalat isya berjamaah' },
    { id: 'p18-rab', hari: 'Rabu', jamKe: 18, kelas: 'Semua Santri / Halaqah', mapel: 'Shalat isya berjamaah' },
    { id: 'p18-kam', hari: 'Kamis', jamKe: 18, kelas: 'Semua Santri / Halaqah', mapel: 'Infirodi / istirahat' },
    { id: 'p18-jum', hari: "Jum'at", jamKe: 18, kelas: 'Semua Santri / Halaqah', mapel: 'Infirodi / istirahat' },
    { id: 'p18-sab', hari: 'Sabtu', jamKe: 18, kelas: 'Semua Santri / Halaqah', mapel: 'Shalat isya berjamaah' },
    { id: 'p18-ahd', hari: 'Ahad', jamKe: 18, kelas: 'Semua Santri / Halaqah', mapel: 'Shalat isya berjamaah' },

    // ── JP 19 (20.00 - 20.45) Sesi 8 ─────────────────────────────────────────
    { id: 'p19-sen', hari: 'Senin', jamKe: 19, kelas: 'Semua Santri / Halaqah', mapel: 'Majelis Persiapan SABQI', warna: 'kuning' },
    { id: 'p19-sel', hari: 'Selasa', jamKe: 19, kelas: 'Semua Santri / Halaqah', mapel: 'Majelis Persiapan SABQI', warna: 'kuning' },
    { id: 'p19-rab', hari: 'Rabu', jamKe: 19, kelas: 'Semua Santri / Halaqah', mapel: 'Majelis Persiapan SABQI', warna: 'kuning' },
    { id: 'p19-kam', hari: 'Kamis', jamKe: 19, kelas: 'Semua Santri / Halaqah', mapel: 'Infirodi / istirahat' },
    { id: 'p19-jum', hari: "Jum'at", jamKe: 19, kelas: 'Semua Santri / Halaqah', mapel: 'Infirodi / istirahat' },
    { id: 'p19-sab', hari: 'Sabtu', jamKe: 19, kelas: 'Semua Santri / Halaqah', mapel: 'Majelis Persiapan SABQI', warna: 'kuning' },
    { id: 'p19-ahd', hari: 'Ahad', jamKe: 19, kelas: 'Semua Santri / Halaqah', mapel: 'infirodi persiapan hafalan baru' },

    // ── JP 20 (20.40 - 21.15) ────────────────────────────────────────────────
    { id: 'p20-sen', hari: 'Senin', jamKe: 20, kelas: 'Semua Santri / Halaqah', mapel: 'Infirodi' },
    { id: 'p20-sel', hari: 'Selasa', jamKe: 20, kelas: 'Semua Santri / Halaqah', mapel: 'Infirodi' },
    { id: 'p20-rab', hari: 'Rabu', jamKe: 20, kelas: 'Semua Santri / Halaqah', mapel: 'Infirodi' },
    { id: 'p20-kam', hari: 'Kamis', jamKe: 20, kelas: 'Semua Santri / Halaqah', mapel: 'Infirodi / istirahat' },
    { id: 'p20-jum', hari: "Jum'at", jamKe: 20, kelas: 'Semua Santri / Halaqah', mapel: 'Infirodi / istirahat' },
    { id: 'p20-sab', hari: 'Sabtu', jamKe: 20, kelas: 'Semua Santri / Halaqah', mapel: 'Infirodi' },
    { id: 'p20-ahd', hari: 'Ahad', jamKe: 20, kelas: 'Semua Santri / Halaqah', mapel: 'Infirodi' },

    // ── JP 21 (21.15 - 03.00) ────────────────────────────────────────────────
    { id: 'p21-sen', hari: 'Senin', jamKe: 21, kelas: 'Semua Santri / Halaqah', mapel: 'WAJIB TIDUR MALAM', warna: 'abu' },
    { id: 'p21-sel', hari: 'Selasa', jamKe: 21, kelas: 'Semua Santri / Halaqah', mapel: 'WAJIB TIDUR MALAM', warna: 'abu' },
    { id: 'p21-rab', hari: 'Rabu', jamKe: 21, kelas: 'Semua Santri / Halaqah', mapel: 'WAJIB TIDUR MALAM', warna: 'abu' },
    { id: 'p21-kam', hari: 'Kamis', jamKe: 21, kelas: 'Semua Santri / Halaqah', mapel: 'WAJIB TIDUR MALAM', warna: 'abu' },
    { id: 'p21-jum', hari: "Jum'at", jamKe: 21, kelas: 'Semua Santri / Halaqah', mapel: 'WAJIB TIDUR MALAM', warna: 'abu' },
    { id: 'p21-sab', hari: 'Sabtu', jamKe: 21, kelas: 'Semua Santri / Halaqah', mapel: 'WAJIB TIDUR MALAM', warna: 'abu' },
    { id: 'p21-ahd', hari: 'Ahad', jamKe: 21, kelas: 'Semua Santri / Halaqah', mapel: 'WAJIB TIDUR MALAM', warna: 'abu' },
  ],
  dibuatPada: new Date().toISOString(),
};

export const DAFTAR_PRESET_KBM: ModelJadwalKbm[] = [
  PRESET_KBM_PESANTREN_2026_2027,
  PRESET_KBM_5_HARI,
  PRESET_KBM_6_HARI,
  PRESET_KBM_ROSTER_TAHFIDZ,
];
