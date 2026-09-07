// Preset SOP & Timeline Acara (Katalog Template Siap Pakai)

export interface ItemSopPreset {
  fase: string; // mis. 'H-30 s.d H-7', 'Hari-H', 'H+1'
  seksi: string; // mis. 'Acara', 'Konsumsi', 'Perlengkapan'
  judul: string;
  catatan?: string;
  wajib?: boolean;
}

export interface PresetSop {
  id: string;
  nama: string;
  kategori: 'sop';
  deskripsi: string;
  ikon: string;
  items: ItemSopPreset[];
}

export const PRESET_SOP_RESEPSI: PresetSop = {
  id: 'sop-resepsi',
  nama: 'Acara Resepsi & Akad Nikah',
  kategori: 'sop',
  deskripsi: 'SOP tahapan persiapan dari H-30, H-1 gladi bersih, jalannya akad nikah, prasmanan tamu, hingga pelunasan vendor H+1.',
  ikon: '💐',
  items: [
    { fase: 'Fase Persiapan (H-30 s/d H-7)', seksi: 'Acara', judul: 'Finalisasi susunan acara & teks MC akad nikah', wajib: true },
    { fase: 'Fase Persiapan (H-30 s/d H-7)', seksi: 'Konsumsi', judul: 'Uji rasa (food testing) & konfirmasi jumlah porsi katering', wajib: true },
    { fase: 'Fase Persiapan (H-30 s/d H-7)', seksi: 'Perlengkapan', judul: 'Konfirmasi panggung pelaminan, kursi tamu, dan genset', wajib: true },
    { fase: 'Fase Persiapan (H-30 s/d H-7)', seksi: 'Sekretariat', judul: 'Penyebaran undangan cetak & pengiriman e-undangan', wajib: false },

    { fase: 'Fase Gladi & H-1', seksi: 'Acara', judul: 'Gladi resik kirab pengantin & serah terima seserahan', wajib: true },
    { fase: 'Fase Gladi & H-1', seksi: 'Perlengkapan', judul: 'Cek mic wireless akad nikah & sound system pelaminan', wajib: true },
    { fase: 'Fase Gladi & H-1', seksi: 'Among Tamu', judul: 'Briefing seragam, penempatan pos pagar bagus & buku tamu', wajib: false },
    { fase: 'Fase Gladi & H-1', seksi: 'Konsumsi', judul: 'Pengecekan stok air mineral dus & meja prasmanan VIP', wajib: true },

    { fase: 'Hari-H (Akad & Resepsi)', seksi: 'Acara', judul: 'Penyambutan rombongan calon mempelai pria & seserahan', wajib: true },
    { fase: 'Hari-H (Akad & Resepsi)', seksi: 'Acara', judul: 'Prosesi Ijab Qobul & penandatanganan buku nikah KUA', wajib: true },
    { fase: 'Hari-H (Akad & Resepsi)', seksi: 'Among Tamu', judul: 'Pengisian buku tamu & pembagian souvenir pernikahan', wajib: true },
    { fase: 'Hari-H (Akad & Resepsi)', seksi: 'Konsumsi', judul: 'Pembukaan stall makanan & pengawasan refill prasmanan', wajib: true },
    { fase: 'Hari-H (Akad & Resepsi)', seksi: 'Dokumentasi', judul: 'Sesi foto keluarga inti & foto bersama para tamu', wajib: false },

    { fase: 'Pasca Acara (H+1)', seksi: 'Perlengkapan', judul: 'Pengecekan & pengembalian barang sewa gedung / tenda', wajib: true },
    { fase: 'Pasca Acara (H+1)', seksi: 'Bendahara', judul: 'Pelunasan sisa tagihan katering, MUA, dan fotografer', wajib: true },
    { fase: 'Pasca Acara (H+1)', seksi: 'Sekretariat', judul: 'Pengamanan kotak amplop & rekapitulasi data kehadiran tamu', wajib: true },
  ],
};

export const PRESET_SOP_RIHLAH: PresetSop = {
  id: 'sop-rihlah',
  nama: 'Rihlah / Wisata Santri',
  kategori: 'sop',
  deskripsi: 'SOP kegiatan luar pondok / outing: booking bus, surat izin wali, logistik P3K, kawal safar, hingga cek barang pulang.',
  ikon: '🚌',
  items: [
    { fase: 'Fase Persiapan (H-14 s/d H-3)', seksi: 'Sekretariat', judul: 'Surat izin wali santri & pendataan riwayat kesehatan', wajib: true },
    { fase: 'Fase Persiapan (H-14 s/d H-3)', seksi: 'Transportasi', judul: 'Booking armada bus pariwisata berizin & cek kondisi ban/AC', wajib: true },
    { fase: 'Fase Persiapan (H-14 s/d H-3)', seksi: 'Kesehatan', judul: 'Penyiapan kotak obat P3K, tolak angin, dan kantong kresek', wajib: true },

    { fase: 'Hari-H Keberangkatan', seksi: 'Keamanan', judul: 'Briefing adab safar, doa naik kendaraan, & pembagian seat bus', wajib: true },
    { fase: 'Hari-H Keberangkatan', seksi: 'Konsumsi', judul: 'Distribusi snack box pagi & air mineral ke tiap bus', wajib: true },
    { fase: 'Hari-H Di Lokasi Wisata', seksi: 'Acara', judul: 'Penetapan titik kumpul (meeting point) & batas waktu bebas', wajib: true },
    { fase: 'Hari-H Di Lokasi Wisata', seksi: 'Ibadah', judul: 'Kordinasi shalat jama’ qashar Dhuhur & Ashar berjamaah', wajib: true },

    { fase: 'Kepulangan & H+1', seksi: 'Keamanan', judul: 'Absensi santri per bus sebelum roda bus berputar pulang', wajib: true },
    { fase: 'Kepulangan & H+1', seksi: 'Keamanan', judul: 'Pemeriksaan barang tertinggal di bagasi & jok atas bus', wajib: true },
    { fase: 'Kepulangan & H+1', seksi: 'Sekretariat', judul: 'Konfirmasi santri telah tiba selamat di asrama kepada wali santri', wajib: true },
  ],
};

export const PRESET_SOP_UJIAN_SEMESTER: PresetSop = {
  id: 'sop-ujian',
  nama: 'Ujian Semester (PAS / PAT)',
  kategori: 'sop',
  deskripsi: 'SOP pelaksanaan evaluasi belajar: pembuatan naskah, penggandaan soal rahasia, pengawasan ruang, dan input raport.',
  ikon: '📝',
  items: [
    { fase: 'Fase Pra-Ujian (H-14)', seksi: 'Kurikulum', judul: 'Pengumpulan naskah soal dari guru mata pelajaran', wajib: true },
    { fase: 'Fase Pra-Ujian (H-14)', seksi: 'Penggandaan', judul: 'Pencetakan lembar soal & amplop berlabel per ruang ujian', wajib: true },
    { fase: 'Fase Pra-Ujian (H-7)', seksi: 'Perlengkapan', judul: 'Penomoran meja ujian & pemasangan tata tertib di pintu ruang', wajib: true },

    { fase: 'Hari-H Pelaksanaan Ujian', seksi: 'Sekretariat', judul: 'Briefing pengawas ruang & penyerahan berkas soal bersegel', wajib: true },
    { fase: 'Hari-H Pelaksanaan Ujian', seksi: 'Pengawas', judul: 'Pemeriksaan kartu peserta & absensi kehadiran peserta didik', wajib: true },
    { fase: 'Hari-H Pelaksanaan Ujian', seksi: 'Pengawas', judul: 'Penghitungan lembar jawab & pengembalian ke ruang panitia', wajib: true },

    { fase: 'Pasca Ujian (Koreksi & Nilai)', seksi: 'Kurikulum', judul: 'Pendistribusian lembar jawaban ke guru pengampu untuk dikoreksi', wajib: true },
    { fase: 'Pasca Ujian (Koreksi & Nilai)', seksi: 'Kurikulum', judul: 'Input nilai ke sistem e-Raport / leger nilai madrasah', wajib: true },
    { fase: 'Pasca Ujian (Koreksi & Nilai)', seksi: 'Pimpinan', judul: 'Rapat pleno kenaikan kelas / kelulusan bersama kepala madrasah', wajib: true },
  ],
};

export const PRESET_SOP_DAUROH: PresetSop = {
  id: 'sop-dauroh',
  nama: 'Dauroh / Kajian Akbar Islami',
  kategori: 'sop',
  deskripsi: 'SOP penyelenggaraan tabligh akbar/dauroh ilmiah: akomodasi narasumber, live streaming, shaf jamaah, dan konsumsi.',
  ikon: '🎙️',
  items: [
    { fase: 'Fase Persiapan (H-14 s/d H-3)', seksi: 'Acara', judul: 'Konfirmasi tema materi & jadwal kedatangan Ustadz narasumber', wajib: true },
    { fase: 'Fase Persiapan (H-14 s/d H-3)', seksi: 'Media', judul: 'Desain & publikasi poster digital di media sosial & grup WA', wajib: false },
    { fase: 'Fase Persiapan (H-14 s/d H-3)', seksi: 'Perlengkapan', judul: 'Cek mic podium, sound system outdoor, & monitor live streaming', wajib: true },

    { fase: 'Hari-H Pelaksanaan', seksi: 'Penyambutan', judul: 'Penjemputan & jamuan transit pemateri di ruang VIP', wajib: true },
    { fase: 'Hari-H Pelaksanaan', seksi: 'Keamanan', judul: 'Penataan parkir motor/mobil & pembatasan batas shaf ikhwan-akhwat', wajib: true },
    { fase: 'Hari-H Pelaksanaan', seksi: 'Media', judul: 'Uji siaran live streaming YouTube/Facebook & perekaman audio kajian', wajib: true },
    { fase: 'Hari-H Pelaksanaan', seksi: 'Konsumsi', judul: 'Distribusi snack kajian & air mineral kemasan kepada jamaah', wajib: true },

    { fase: 'Penutupan & Evaluasi', seksi: 'Bendahara', judul: 'Penyerahan bisyarah / tanda terima narasumber & rekap kotak infaq', wajib: true },
    { fase: 'Penutupan & Evaluasi', seksi: 'Kebersihan', judul: 'Operasi semut pembersihan sampah aula & masjid pasca acara bubar', wajib: true },
  ],
};

export const DAFTAR_PRESET_SOP: PresetSop[] = [
  PRESET_SOP_RESEPSI,
  PRESET_SOP_RIHLAH,
  PRESET_SOP_UJIAN_SEMESTER,
  PRESET_SOP_DAUROH,
];
