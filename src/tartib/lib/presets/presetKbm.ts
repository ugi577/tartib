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

export const DAFTAR_PRESET_KBM: ModelJadwalKbm[] = [
  PRESET_KBM_5_HARI,
  PRESET_KBM_6_HARI,
  PRESET_KBM_ROSTER_TAHFIDZ,
];
