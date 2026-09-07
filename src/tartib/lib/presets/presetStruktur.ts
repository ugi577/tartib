// Preset Struktur Organisasi (Katalog Template Siap Pakai)

export interface ItemStrukturPreset {
  judul: string;
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
    { judul: 'PENASIHAT & SHOHIBUL HAJAT', picNama: 'Bpk. H. Rahmat & Ibu', catatan: '🌟', rutin: 'Pimpinan' },
    { judul: 'KETUA PANITIA', picNama: 'Bpk. Hendra S.', catatan: '👑', rutin: 'Pengurus Inti' },
    { judul: 'SEKRETARIS', picNama: 'Faisal A.', catatan: '📋', rutin: 'Pengurus Inti', sub: [
      { judul: 'Buku Tamu & Kotak Amplop', picNama: 'Siti & Maya' },
      { judul: 'Daftar Souvenir Tamu', picNama: 'Maya' },
    ]},
    { judul: 'BENDAHARA', picNama: 'H. Bambang', catatan: '💰', rutin: 'Pengurus Inti', sub: [
      { judul: 'Pembayaran Vendor Katering & Dekor', picNama: 'H. Bambang' },
      { judul: 'Amplop Petugas KUA & Saksi', picNama: 'H. Bambang' },
    ]},
    { judul: 'SEKSI ACARA & AKAD', picNama: 'Ust. Ridwan', catatan: '🕌', rutin: 'Divisi', sub: [
      { judul: 'Kordinasi Penghulu KUA', picNama: 'Ust. Ridwan' },
      { judul: 'Qari Pembaca Al-Quran', picNama: 'Ust. Syarif' },
      { judul: 'MC Resepsi & Akad', picNama: 'Kang Dedi' },
    ]},
    { judul: 'SEKSI KONSUMSI', picNama: 'Ibu Hj. Nining', catatan: '🍽️', rutin: 'Divisi', sub: [
      { judul: 'Cek Menu VIP Keluarga', picNama: 'Ibu Hj. Nining' },
      { judul: 'Pengecekan Prasmanan Reguler', picNama: 'Ibu Ratna' },
      { judul: 'Air Minum & Es Buah', picNama: 'Roni' },
    ]},
    { judul: 'SEKSI AMONG TAMU', picNama: 'Keluarga Besar', catatan: '🤝', rutin: 'Divisi', sub: [
      { judul: 'Penyambutan Besan & Rombongan', picNama: 'Bpk. Gunawan' },
      { judul: 'Pemandu Jalur Pengantin', picNama: 'Bpk. Joko' },
    ]},
    { judul: 'SEKSI PERLENGKAPAN & SOUND', picNama: 'Dodi & Tim', catatan: '📦', rutin: 'Divisi', sub: [
      { judul: 'Genset & Catu Daya', picNama: 'Dodi' },
      { judul: 'Mic Akad & Sound System', picNama: 'Bayu' },
      { judul: 'AC Portabel & Kipas Blower', picNama: 'Dodi' },
    ]},
    { judul: 'SEKSI DOKUMENTASI', picNama: 'Studio Kreasi', catatan: '📷', rutin: 'Divisi', sub: [
      { judul: 'Foto Akad & Sungkeman', picNama: 'Aris Photograper' },
      { judul: 'Video Cinematic Resepsi', picNama: 'Aris Photograper' },
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
    { judul: 'PEMBINA OSIS / MUSYRIF', picNama: 'Ust. Juswandi', catatan: '🕌', rutin: 'Pimpinan' },
    { judul: 'KETUA OSIS', picNama: 'Adrian Maulana', catatan: '👑', rutin: 'Pengurus Inti', sub: [
      { judul: 'Kontrol Harian Disiplin Santri', picNama: 'Adrian' },
      { judul: 'Laporan Pekanan ke Pengasuh', picNama: 'Adrian' },
    ]},
    { judul: 'WAKIL KETUA', picNama: 'Zikri Firdaus', catatan: '⚡', rutin: 'Pengurus Inti' },
    { judul: 'SEKRETARIS OSIS', picNama: 'Husnil Mubarok', catatan: '📋', rutin: 'Pengurus Inti', sub: [
      { judul: 'Absensi Halaqah & Jamaah', picNama: 'Husnil' },
      { judul: 'Papan Pengumuman Asrama', picNama: 'Husnil' },
    ]},
    { judul: 'BENDAHARA', picNama: 'Yudi Nahyuddin', catatan: '💰', rutin: 'Pengurus Inti', sub: [
      { judul: 'Uang Kas Kebersihan & Obat', picNama: 'Yudi' },
      { judul: 'Iuran Kegiatan Santri', picNama: 'Said' },
    ]},
    { judul: 'DIVISI IBADAH & TAHFIDZ', picNama: 'Farhan Petir', catatan: '📖', rutin: 'Divisi', sub: [
      { judul: 'Jadwal Muadzin 5 Waktu', picNama: 'Farhan' },
      { judul: 'Imam Cadangan Shalat Rawatib', picNama: 'Affan' },
      { judul: 'Penertiban Shaf Masjid', picNama: 'Hadi' },
    ]},
    { judul: 'DIVISI BAHASA (ARAB & INGGRIS)', picNama: 'Affil & Hakim', catatan: '🗣️', rutin: 'Divisi', sub: [
      { judul: 'Kosakata Harian (Mufrodat)', picNama: 'Hakim' },
      { judul: 'Penegakan Mahkamah Bahasa', picNama: 'Affil' },
    ]},
    { judul: 'DIVISI KEAMANAN & DISIPLIN', picNama: 'Fauzan & Syaiful', catatan: '🔒', rutin: 'Divisi', sub: [
      { judul: 'Ronda Malam & Kunci Gerbang', picNama: 'Fauzan' },
      { judul: 'Membangunkan Shalat Subuh', picNama: 'Ardi, Said' },
      { judul: 'Penertiban Sandal & Jemuran', picNama: 'Andri' },
    ]},
    { judul: 'DIVISI KEBERSIHAN & LINGKUNGAN', picNama: 'Yudhi & Maher', catatan: '🧹', rutin: 'Divisi', sub: [
      { judul: 'Piket Kamar Mandi & Aula', picNama: 'Yudhi' },
      { judul: 'Kerja Bakti Ahad Pagi', picNama: 'Maher' },
      { judul: 'Pengontrolan Tempat Sampah', picNama: 'Zaki' },
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
    { judul: 'KETUA RT / RW', picNama: 'Bpk. H. Sukardi', catatan: '🏛️', rutin: 'Pimpinan' },
    { judul: 'SEKRETARIS RT', picNama: 'Bpk. Dani Wahyudi', catatan: '📋', rutin: 'Pengurus Inti', sub: [
      { judul: 'Surat Pengantar Warga', picNama: 'Dani' },
      { judul: 'Pembaruan Data Kependudukan KK', picNama: 'Dani' },
    ]},
    { judul: 'BENDAHARA RT', picNama: 'Ibu Endang', catatan: '💰', rutin: 'Pengurus Inti', sub: [
      { judul: 'Iuran Sampah & Kemanan Bulanan', picNama: 'Endang' },
      { judul: 'Laporan Kas Warga Transparan', picNama: 'Endang' },
    ]},
    { judul: 'SEKSI KEAMANAN & SISKAMLING', picNama: 'Bpk. Tatang', catatan: '🔒', rutin: 'Divisi', sub: [
      { judul: 'Jadwal Ronda Malam Warga', picNama: 'Tatang' },
      { judul: 'Kordinasi Satpam Portal Perumahan', picNama: 'Tatang' },
      { judul: 'Pengecekan CCTV Lingkungan', picNama: 'Bayu' },
    ]},
    { judul: 'SEKSI KEBERSIHAN & LINGKUNGAN', picNama: 'Bpk. Sunarto', catatan: '🌳', rutin: 'Divisi', sub: [
      { judul: 'Jadwal Petugas Gerobak Sampah', picNama: 'Sunarto' },
      { judul: 'Kerja Bakti Selokan Bulanan', picNama: 'Sunarto' },
      { judul: 'Penerangan Jalan Gang', picNama: 'Agus' },
    ]},
    { judul: 'SEKSI SOSIAL & KEMATIAN', picNama: 'Bpk. Ustadz Haris', catatan: '🤝', rutin: 'Divisi', sub: [
      { judul: 'Penyaluran Santunan Rukun Kematian', picNama: 'Haris' },
      { judul: 'Bantuan Warga Sakit / Kurang Mampu', picNama: 'Haris' },
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
    { judul: 'KETUA DEWAN PENASIHAT', picNama: 'KH. Abdullah Syukri', catatan: '🌟', rutin: 'Pimpinan' },
    { judul: 'KETUA DKM MASJID', picNama: 'Bpk. H. Mulyadi, M.Pd.', catatan: '👑', rutin: 'Pengurus Inti' },
    { judul: 'SEKRETARIS DKM', picNama: 'Ust. Anshori', catatan: '📋', rutin: 'Pengurus Inti', sub: [
      { judul: 'Jadwal Penceramah Khutbah Jumat', picNama: 'Ust. Anshori' },
      { judul: 'Notulensi Rapat Syuro Takmir', picNama: 'Ust. Anshori' },
    ]},
    { judul: 'BENDAHARA KAS MASJID', picNama: 'Bpk. H. Sulaiman', catatan: '💰', rutin: 'Pengurus Inti', sub: [
      { judul: 'Pengitungan Kotak Infaq Kotak Jumat', picNama: 'H. Sulaiman & Tim' },
      { judul: 'Pengumuman Saldo Kas Masjid di Papan', picNama: 'H. Sulaiman' },
    ]},
    { judul: 'IMAM RAWATIB & MUADZIN', picNama: 'Ust. Hafizh & Ust. Bilal', catatan: '📖', rutin: 'Divisi', sub: [
      { judul: 'Imam Shalat Fardhu 5 Waktu', picNama: 'Ust. Hafizh' },
      { judul: 'Kumandang Adzan Tepat Waktu', picNama: 'Ust. Bilal' },
    ]},
    { judul: 'BIDANG IMARAH (DAKWAH & KAJIAN)', picNama: 'Ust. Fakhruddin', catatan: '🎙️', rutin: 'Divisi', sub: [
      { judul: 'Kajian Rutin Subuh Ahad', picNama: 'Ust. Fakhruddin' },
      { judul: 'PHBI (Maulid, Isra Miraj, Idul Adha)', picNama: 'Ust. Fakhruddin' },
      { judul: 'Pendidikan TPA / TPQ Anak', picNama: 'Ustdzah Khadijah' },
    ]},
    { judul: 'BIDANG RI’AYAH (PEMELIHARAAN & KEBERSIHAN)', picNama: 'Bpk. Marbot Herman', catatan: '🧹', rutin: 'Divisi', sub: [
      { judul: 'Kebersihan Karpet & Tempat Wudhu', picNama: 'Herman' },
      { judul: 'Cek AC, Kipas Angin, & Sound Masjid', picNama: 'Pak Yono' },
      { judul: 'Kerapihan Sandal & Parkiran', picNama: 'Herman' },
    ]},
  ],
};

export const DAFTAR_PRESET_STRUKTUR: PresetStruktur[] = [
  PRESET_PANITIA_PERNIKAHAN,
  PRESET_OSIS_SANTRI,
  PRESET_RT_RW,
  PRESET_PENGURUS_DKM,
];
