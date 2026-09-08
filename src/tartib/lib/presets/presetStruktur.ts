// Preset Struktur Organisasi (Katalog Template Siap Pakai)
//
// Sesi 22: Tartib adalah aplikasi publik (APK + GitHub Pages), sehingga
// preset TIDAK membawa nama orang — kolom PIC sengaja kosong dan diisi
// pengguna di Struktur PIC. Yang dibawa hanya kerangka: judul jabatan/seksi,
// kategori rutin, ikon catatan, dan sub-tugas. Menerapkan preset mengganti
// seluruh papan baku (dikonfirmasi dulu di PresetLibraryView).

export interface ItemStrukturPreset {
  judul: string;
  /** Dibiarkan kosong pada preset publik; tersedia untuk preset kustom/impor. */
  picNama?: string;
  catatan: string;
  rutin: 'Pimpinan' | 'Pengurus Inti' | 'Divisi';
  sub?: { judul: string; picNama?: string; catatan?: string }[];
}

export interface PresetStruktur {
  id: string;
  nama: string;
  kategori: 'struktur';
  deskripsi: string;
  ikon: string;
  items: ItemStrukturPreset[];
}

export const PRESET_PANITIA_PERNIKAHAN: PresetStruktur = {
  id: 'struktur-pernikahan',
  nama: 'Panitia Pernikahan / Walimah',
  kategori: 'struktur',
  deskripsi: 'Susunan kepanitiaan resepsi & akad nikah keluarga, lengkap dengan seksi among tamu & konsumsi.',
  ikon: '💍',
  items: [
    { judul: 'PENASIHAT & SHOHIBUL HAJAT', catatan: '🌟', rutin: 'Pimpinan' },
    { judul: 'KETUA PANITIA', catatan: '👑', rutin: 'Pengurus Inti' },
    { judul: 'SEKRETARIS', catatan: '📋', rutin: 'Pengurus Inti', sub: [
      { judul: 'Buku Tamu & Kotak Amplop' },
      { judul: 'Daftar Souvenir Tamu' },
    ]},
    { judul: 'BENDAHARA', catatan: '💰', rutin: 'Pengurus Inti', sub: [
      { judul: 'Pembayaran Vendor Katering & Dekor' },
      { judul: 'Amplop Petugas KUA & Saksi' },
    ]},
    { judul: 'SEKSI ACARA & AKAD', catatan: '🕌', rutin: 'Divisi', sub: [
      { judul: 'Kordinasi Penghulu KUA' },
      { judul: 'Qari Pembaca Al-Quran' },
      { judul: 'MC Resepsi & Akad' },
    ]},
    { judul: 'SEKSI KONSUMSI', catatan: '🍽️', rutin: 'Divisi', sub: [
      { judul: 'Cek Menu VIP Keluarga' },
      { judul: 'Pengecekan Prasmanan Reguler' },
      { judul: 'Air Minum & Es Buah' },
    ]},
    { judul: 'SEKSI AMONG TAMU', catatan: '🤝', rutin: 'Divisi', sub: [
      { judul: 'Penyambutan Besan & Rombongan' },
      { judul: 'Pemandu Jalur Pengantin' },
    ]},
    { judul: 'SEKSI PERLENGKAPAN & SOUND', catatan: '📦', rutin: 'Divisi', sub: [
      { judul: 'Genset & Catu Daya' },
      { judul: 'Mic Akad & Sound System' },
      { judul: 'AC Portabel & Kipas Blower' },
    ]},
    { judul: 'SEKSI DOKUMENTASI', catatan: '📷', rutin: 'Divisi', sub: [
      { judul: 'Foto Akad & Sungkeman' },
      { judul: 'Video Cinematic Resepsi' },
    ]},
  ],
};

export const PRESET_OSIS_SANTRI: PresetStruktur = {
  id: 'struktur-osis',
  nama: 'OSIS / Organisasi Santri Pesantren',
  kategori: 'struktur',
  deskripsi: 'Bagan organisasi kepengurusan santri putra/putri, seksi ibadah, kedisiplinan, bahasa, dan kebersihan.',
  ikon: '🎓',
  items: [
    { judul: 'PEMBINA OSIS / MUSYRIF', catatan: '🕌', rutin: 'Pimpinan' },
    { judul: 'KETUA OSIS', catatan: '👑', rutin: 'Pengurus Inti', sub: [
      { judul: 'Kontrol Harian Disiplin Santri' },
      { judul: 'Laporan Pekanan ke Pengasuh' },
    ]},
    { judul: 'WAKIL KETUA', catatan: '⚡', rutin: 'Pengurus Inti' },
    { judul: 'SEKRETARIS OSIS', catatan: '📋', rutin: 'Pengurus Inti', sub: [
      { judul: 'Absensi Halaqah & Jamaah' },
      { judul: 'Papan Pengumuman Asrama' },
    ]},
    { judul: 'BENDAHARA', catatan: '💰', rutin: 'Pengurus Inti', sub: [
      { judul: 'Uang Kas Kebersihan & Obat' },
      { judul: 'Iuran Kegiatan Santri' },
    ]},
    { judul: 'DIVISI IBADAH & TAHFIDZ', catatan: '📖', rutin: 'Divisi', sub: [
      { judul: 'Jadwal Muadzin 5 Waktu' },
      { judul: 'Imam Cadangan Shalat Rawatib' },
      { judul: 'Penertiban Shaf Masjid' },
    ]},
    { judul: 'DIVISI BAHASA (ARAB & INGGRIS)', catatan: '🗣️', rutin: 'Divisi', sub: [
      { judul: 'Kosakata Harian (Mufrodat)' },
      { judul: 'Penegakan Mahkamah Bahasa' },
    ]},
    { judul: 'DIVISI KEAMANAN & DISIPLIN', catatan: '🔒', rutin: 'Divisi', sub: [
      { judul: 'Ronda Malam & Kunci Gerbang' },
      { judul: 'Membangunkan Shalat Subuh' },
      { judul: 'Penertiban Sandal & Jemuran' },
    ]},
    { judul: 'DIVISI KEBERSIHAN & LINGKUNGAN', catatan: '🧹', rutin: 'Divisi', sub: [
      { judul: 'Piket Kamar Mandi & Aula' },
      { judul: 'Kerja Bakti Ahad Pagi' },
      { judul: 'Pengontrolan Tempat Sampah' },
    ]},
  ],
};

export const PRESET_RT_RW: PresetStruktur = {
  id: 'struktur-rtrw',
  nama: 'Pengurus Rukun Tetangga (RT / RW)',
  kategori: 'struktur',
  deskripsi: 'Struktur pengurus lingkungan warga: Ketua RT, Bendahara Kas, Seksi Ronda/Siskamling, dan Sosial.',
  ikon: '🏘️',
  items: [
    { judul: 'KETUA RT / RW', catatan: '🏛️', rutin: 'Pimpinan' },
    { judul: 'SEKRETARIS RT', catatan: '📋', rutin: 'Pengurus Inti', sub: [
      { judul: 'Surat Pengantar Warga' },
      { judul: 'Pembaruan Data Kependudukan KK' },
    ]},
    { judul: 'BENDAHARA RT', catatan: '💰', rutin: 'Pengurus Inti', sub: [
      { judul: 'Iuran Sampah & Keamanan Bulanan' },
      { judul: 'Laporan Kas Warga Transparan' },
    ]},
    { judul: 'SEKSI KEAMANAN & SISKAMLING', catatan: '🔒', rutin: 'Divisi', sub: [
      { judul: 'Jadwal Ronda Malam Warga' },
      { judul: 'Kordinasi Satpam Portal Perumahan' },
      { judul: 'Pengecekan CCTV Lingkungan' },
    ]},
    { judul: 'SEKSI KEBERSIHAN & LINGKUNGAN', catatan: '🌳', rutin: 'Divisi', sub: [
      { judul: 'Jadwal Petugas Gerobak Sampah' },
      { judul: 'Kerja Bakti Selokan Bulanan' },
      { judul: 'Penerangan Jalan Gang' },
    ]},
    { judul: 'SEKSI SOSIAL & KEMATIAN', catatan: '🤝', rutin: 'Divisi', sub: [
      { judul: 'Penyaluran Santunan Rukun Kematian' },
      { judul: 'Bantuan Warga Sakit / Kurang Mampu' },
    ]},
  ],
};

export const PRESET_PENGURUS_DKM: PresetStruktur = {
  id: 'struktur-dkm',
  nama: 'Pengurus DKM (Dewan Kemakmuran Masjid)',
  kategori: 'struktur',
  deskripsi: 'Struktur kepengurusan takmir masjid: Dewan Penasihat, Imam Rawatib, Bidang Idarah, Imarah, dan Riayah.',
  ikon: '🕌',
  items: [
    { judul: 'KETUA DEWAN PENASIHAT', catatan: '🌟', rutin: 'Pimpinan' },
    { judul: 'KETUA DKM MASJID', catatan: '👑', rutin: 'Pengurus Inti' },
    { judul: 'SEKRETARIS DKM', catatan: '📋', rutin: 'Pengurus Inti', sub: [
      { judul: 'Jadwal Penceramah Khutbah Jumat' },
      { judul: 'Notulensi Rapat Syuro Takmir' },
    ]},
    { judul: 'BENDAHARA KAS MASJID', catatan: '💰', rutin: 'Pengurus Inti', sub: [
      { judul: 'Penghitungan Kotak Infaq Jumat' },
      { judul: 'Pengumuman Saldo Kas Masjid di Papan' },
    ]},
    { judul: 'IMAM RAWATIB & MUADZIN', catatan: '📖', rutin: 'Divisi', sub: [
      { judul: 'Imam Shalat Fardhu 5 Waktu' },
      { judul: 'Kumandang Adzan Tepat Waktu' },
    ]},
    { judul: 'BIDANG IMARAH (DAKWAH & KAJIAN)', catatan: '🎙️', rutin: 'Divisi', sub: [
      { judul: 'Kajian Rutin Subuh Ahad' },
      { judul: 'PHBI (Maulid, Isra Miraj, Idul Adha)' },
      { judul: 'Pendidikan TPA / TPQ Anak' },
    ]},
    { judul: 'BIDANG RI’AYAH (PEMELIHARAAN & KEBERSIHAN)', catatan: '🧹', rutin: 'Divisi', sub: [
      { judul: 'Kebersihan Karpet & Tempat Wudhu' },
      { judul: 'Cek AC, Kipas Angin, & Sound Masjid' },
      { judul: 'Kerapihan Sandal & Parkiran' },
    ]},
  ],
};

export const DAFTAR_PRESET_STRUKTUR: PresetStruktur[] = [
  PRESET_PANITIA_PERNIKAHAN,
  PRESET_OSIS_SANTRI,
  PRESET_RT_RW,
  PRESET_PENGURUS_DKM,
];
