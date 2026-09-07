import { buatId, type TartibDb, tartibDb } from './schema';

// ===== Data murni (diuji oleh seed.test.ts, tanpa menyentuh IndexedDB) =====

// 13 divisi baku — BRIEF Bagian 8.
export const DIVISI_BAKU: readonly { nama: string; tanggungJawab: string }[] = [
  { nama: 'Ketua Panitia', tanggungJawab: 'Keputusan akhir, penghubung ke Mudir' },
  { nama: 'Sekretaris', tanggungJawab: 'Surat & undangan, rekap konfirmasi, buku tamu' },
  { nama: 'Bendahara', tanggungJawab: 'Anggaran, belanja, amplop, laporan keuangan' },
  { nama: 'Acara & MC', tanggungJawab: 'Rundown, gladi, koordinasi pengisi acara' },
  { nama: 'Konsumsi', tanggungJawab: 'Masak, hidang, peralatan makan, pencucian' },
  { nama: 'Perlengkapan & Sound', tanggungJawab: 'Tenda, karpet, kursi, sound, listrik, genset' },
  { nama: 'Penerima Tamu', tanggungJawab: 'Sambutan pintu, antar ke tempat duduk, buku tamu' },
  { nama: 'Parkir & Sandal', tanggungJawab: 'Pengaturan kendaraan, rak sandal, penomoran' },
  { nama: 'Kebersihan', tanggungJawab: 'Tempat sampah, sapu keliling' },
  { nama: 'Dokumentasi & Live', tanggungJawab: 'Foto, video, streaming' },
  { nama: 'Kesehatan', tanggungJawab: 'P3K, obat dasar, nomor klinik terdekat' },
  { nama: 'Koordinator Jamaah Putri', tanggungJawab: 'Tempat duduk, ketenangan, konsumsi area putri' },
  { nama: 'Aroma & Suasana', tanggungJawab: 'Bukhur, arang, pengharum, ventilasi' },
];

// 8 jenis acara — PRD 2.1.
export const JENIS_ACARA_BAKU: readonly { nama: string; deskripsi: string }[] = [
  { nama: 'Tasyakuran Khatam', deskripsi: 'Tasyakuran khatam Al-Qur\'an santri' },
  { nama: 'Maulid', deskripsi: 'Peringatan maulid Nabi' },
  { nama: 'Haflah', deskripsi: 'Haflah akhir tahun / pentas seni' },
  { nama: 'Wisuda', deskripsi: 'Wisuda santri' },
  { nama: 'Dauroh', deskripsi: 'Dauroh / pelatihan santri' },
  { nama: 'Rapat Wali Santri', deskripsi: 'Rapat wali santri' },
  { nama: 'PHBI', deskripsi: 'Peringatan hari besar Islam' },
  { nama: 'Custom', deskripsi: 'Jenis acara lain yang dibuat manual' },
];

export interface FaseContoh {
  urutan: number;
  label: string;
  offsetHari: number;
  items: { divisiUrutan: number; judul: string; catatan: string; wajib: boolean; rumusQty?: string }[];
}

// Template contoh dari Buku Panduan SOP Acara Ma'had Askar Qur'an
// (Bagian 3: linimasa, Bagian 4: ceklis perlengkapan) — representasi seed.
export const TEMPLATE_CONTOH: {
  nama: string;
  versi: number;
  jenisAcaraNama: string;
  catatan: string;
  fase: FaseContoh[];
} = {
  nama: 'Tasyakuran Khatam',
  versi: 1,
  jenisAcaraNama: 'Tasyakuran Khatam',
  catatan: 'Template contoh dari Buku Panduan SOP Acara (linimasa & ceklis perlengkapan)',
  fase: [
    {
      urutan: 1,
      label: 'Persiapan H-30',
      offsetHari: -30,
      items: [
        { divisiUrutan: 1, judul: 'Rapat pembentukan panitia', catatan: 'Tentukan ketua, sekretaris, bendahara, dan koordinator divisi', wajib: true },
        { divisiUrutan: 2, judul: 'Susun daftar undangan', catatan: 'Tetapkan target undangan tiap kelompok', wajib: true },
        { divisiUrutan: 3, judul: 'Susun anggaran', catatan: 'Rincian pemasukan & pengeluaran', wajib: true },
        { divisiUrutan: 4, judul: 'Susun rundown acara', catatan: 'Alur acara dari pembukaan sampai penutup', wajib: true },
        { divisiUrutan: 5, judul: 'Rencanakan menu konsumsi', catatan: 'Sesuaikan dengan porsi hasil kalkulator', wajib: true },
        { divisiUrutan: 6, judul: 'Cek kebutuhan perlengkapan', catatan: 'Tenda, karpet, kursi, sound, genset', wajib: true },
        { divisiUrutan: 10, judul: 'Tunjuk tim dokumentasi', catatan: 'Foto, video, streaming', wajib: false },
        { divisiUrutan: 12, judul: 'Koordinasi area jamaah putri', catatan: 'Tempat duduk & ketenangan', wajib: true },
      ],
    },
    {
      urutan: 2,
      label: 'Persiapan H-7',
      offsetHari: -7,
      items: [
        { divisiUrutan: 2, judul: 'Kirim undangan & rekap konfirmasi', catatan: 'Konfirmasi tamu dicatat per rombongan', wajib: true },
        { divisiUrutan: 3, judul: 'Belanja kebutuhan', catatan: 'Sesuai anggaran', wajib: true },
        { divisiUrutan: 5, judul: 'Belanja bahan konsumsi', catatan: 'Hitung porsi dari rekap konfirmasi', wajib: true },
        { divisiUrutan: 6, judul: 'Sewa & pasang perlengkapan', catatan: 'Tenda, kursi, sound', wajib: true },
        { divisiUrutan: 7, judul: 'Tentukan petugas penyambutan', catatan: 'Jadwal sambutan pintu', wajib: true },
        { divisiUrutan: 8, judul: 'Siapkan parkir & rak sandal', catatan: 'Penomoran sandal, area parkir', wajib: true },
        { divisiUrutan: 9, judul: 'Siapkan tempat sampah', catatan: 'Titik-titik strategis', wajib: true },
        { divisiUrutan: 11, judul: 'Siapkan P3K & obat dasar', catatan: 'Nomor klinik terdekat ditempel di lokasi', wajib: true },
        { divisiUrutan: 13, judul: 'Belanja bukhur & arang', catatan: 'Cukup untuk durasi acara', wajib: false },
      ],
    },
    {
      urutan: 3,
      label: 'Hari H',
      offsetHari: 0,
      items: [
        { divisiUrutan: 4, judul: 'Gladi resik', catatan: 'Sebelum acara dimulai', wajib: true },
        { divisiUrutan: 5, judul: 'Hidangkan konsumsi', catatan: 'Porsi dari kalkulator', wajib: true, rumusQty: 'porsi' },
        { divisiUrutan: 5, judul: 'Siapkan peralatan makan', catatan: 'Asumsi tanpa tim pencuci: 1,1 × porsi', wajib: true, rumusQty: 'ceil(porsi * 1.1)' },
        { divisiUrutan: 6, judul: 'Operasikan sound & listrik', catatan: 'Genset standby', wajib: true },
        { divisiUrutan: 7, judul: 'Sambut tamu di pintu', catatan: 'Antar ke tempat duduk, isi buku tamu', wajib: true },
        { divisiUrutan: 8, judul: 'Atur parkir & sandal', catatan: 'Koordinasi tukang parkir, sandal bernomor', wajib: true },
        { divisiUrutan: 9, judul: 'Jaga kebersihan', catatan: 'Sapu keliling', wajib: true },
        { divisiUrutan: 10, judul: 'Dokumentasikan acara', catatan: 'Foto & video sesuai rundown', wajib: true },
        { divisiUrutan: 12, judul: 'Jaga area putri', catatan: 'Ketenangan & konsumsi area putri', wajib: true },
        { divisiUrutan: 13, judul: 'Nyalakan bukhur', catatan: 'Ventilasi tetap dijaga', wajib: true },
      ],
    },
    {
      urutan: 4,
      label: 'Evaluasi H+1',
      offsetHari: 1,
      items: [
        { divisiUrutan: 1, judul: 'Rapat evaluasi', catatan: 'Isi evaluasi per divisi di aplikasi', wajib: true },
        { divisiUrutan: 2, judul: 'Rekap tamu hadir', catatan: 'Buku tamu & jumlah rombongan nyata', wajib: true },
        { divisiUrutan: 3, judul: 'Laporan keuangan', catatan: 'Sisa dana & amplop', wajib: true },
        { divisiUrutan: 5, judul: 'Kembalikan pinjaman peralatan makan', catatan: 'Cocokkan dengan catatan peminjaman', wajib: true },
        { divisiUrutan: 6, judul: 'Bongkar & kembalikan sewaan', catatan: 'Tenda, kursi, sound', wajib: true },
        { divisiUrutan: 9, judul: 'Bersihkan lokasi', catatan: 'Sampah habis, lokasi dikembalikan', wajib: true },
      ],
    },
  ],
};

// Template baku sebagai PANDUAN MANUAL PENGISIAN (sesi 15, arahan Ahmed):
// itemnya teks contoh — cetak ("Cetak Panduan A4") atau unduh .docx, lalu
// isi manual di kertas (tanggal tiap fase, PIC tiap item). Idempoten per nama
// (bukan "hanya bila tabel kosong") supaya muncul juga di data yang sudah ada.
export const TEMPLATE_PANDUAN: {
  nama: string;
  versi: number;
  jenisAcaraNama: string;
  catatan: string;
  fase: FaseContoh[];
} = {
  nama: 'SOP Baku (Panduan Manual)',
  versi: 1,
  jenisAcaraNama: 'Custom',
  catatan:
    'Template baku berisi contoh pengisian — cetak (Cetak Panduan A4) atau unduh .docx, lalu isi manual: nama acara, tanggal tiap fase, dan PIC tiap item. Ganti teks contoh dengan tugas acara Anda.',
  fase: [
    {
      urutan: 1,
      label: 'Penetapan',
      offsetHari: -30,
      items: [
        { divisiUrutan: 1, judul: 'Contoh: tetapkan tanggal, jam mulai & selesai acara', catatan: 'Tulis tanggal fase di kolom yang tersedia', wajib: true },
        { divisiUrutan: 1, judul: 'Contoh: bentuk panitia & tulis nama PIC tiap divisi', catatan: 'Satu nama pemilik per tugas', wajib: true },
        { divisiUrutan: 3, judul: 'Contoh: susun anggaran kasar', catatan: '', wajib: true },
        { divisiUrutan: 4, judul: 'Contoh: susun rundown acara', catatan: '', wajib: true },
      ],
    },
    {
      urutan: 2,
      label: 'Undangan & Anggaran',
      offsetHari: -14,
      items: [
        { divisiUrutan: 2, judul: 'Contoh: kirim undangan & rekap konfirmasi tamu', catatan: '', wajib: true },
        { divisiUrutan: 5, judul: 'Contoh: rencanakan menu & hitung porsi konsumsi', catatan: '', wajib: true },
        { divisiUrutan: 6, judul: 'Contoh: cek kebutuhan tenda, kursi, dan sound', catatan: '', wajib: true },
      ],
    },
    {
      urutan: 3,
      label: 'Persiapan Lokasi',
      offsetHari: -7,
      items: [
        { divisiUrutan: 6, judul: 'Contoh: sewa & pasang perlengkapan lokasi', catatan: '', wajib: true },
        { divisiUrutan: 8, judul: 'Contoh: siapkan parkir & rak sandal', catatan: '', wajib: true },
        { divisiUrutan: 9, judul: 'Contoh: siapkan titik sampah', catatan: '', wajib: true },
      ],
    },
    {
      urutan: 4,
      label: 'Gladi & Penataan',
      offsetHari: -1,
      items: [
        { divisiUrutan: 4, judul: 'Contoh: gladi resik seluruh rundown', catatan: '', wajib: true },
        { divisiUrutan: 13, judul: 'Contoh: pasang penunjuk arah & pembatas area', catatan: '', wajib: true },
      ],
    },
    {
      urutan: 5,
      label: 'Hari H',
      offsetHari: 0,
      items: [
        { divisiUrutan: 7, judul: 'Contoh: sambut tamu & isi buku tamu', catatan: '', wajib: true },
        { divisiUrutan: 5, judul: 'Contoh: hidangkan konsumsi sesuai porsi', catatan: '', wajib: true },
        { divisiUrutan: 10, judul: 'Contoh: dokumentasikan acara', catatan: '', wajib: true },
      ],
    },
    {
      urutan: 6,
      label: 'Evaluasi',
      offsetHari: 1,
      items: [
        { divisiUrutan: 1, judul: 'Contoh: rapat evaluasi per divisi', catatan: '', wajib: true },
        { divisiUrutan: 6, judul: 'Contoh: kembalikan seluruh barang pinjaman', catatan: '', wajib: true },
      ],
    },
  ],
};

// Papan baku SEMI-PATEN (Batch X, arahan Ahmed: "menu SOP untuk hal bersifat
// semi paten, misal SOP daftar tugas/amanah/khidmah santri dan PICnya yg
// mudah ceklist"): struktur amanah relatif tetap, nama PIC boleh berganti
// kapan saja, dan tiap item mudah diceklis di tab SOP. Idempoten per judul
// (pola TEMPLATE_PANDUAN) supaya muncul juga pada data yang sudah ada.
export const SOP_AMANAH_BAKU: {
  judul: string;
  catatan: string;
  items: {
    judul: string;
    picNama?: string;
    catatan: string;
    rutin: string;
    sub?: { judul: string; picNama?: string; catatan?: string }[];
  }[];
} = {
  judul: 'Struktur PIC Amanah',
  catatan:
    'Struktur organisasi santri — jabatan dan penanggung jawab amanah. Klik jabatan untuk melihat daftar tugas, tambah/ubah jabatan dan tugas sesuai kebutuhan.',
  items: [
    // Pimpinan
    { judul: 'MUDIR', picNama: 'Pimpinan Pondok', catatan: '🕌', rutin: 'Pimpinan' },
    // Pengurus Inti
    { judul: 'HUMAS/SOSIAL', picNama: 'Habib Abdillah Al At thos', catatan: '🤝', rutin: 'Pengurus Inti' },
    {
      judul: 'KETUA',
      picNama: 'Adrian',
      catatan: '👑',
      rutin: 'Pengurus Inti',
      sub: [
        { judul: 'Pompa Sungai', picNama: 'Adrian' },
        { judul: 'Hp. Pondok', picNama: 'Adrian' },
      ],
    },
    { judul: 'KORDINATOR MUSYRIF', picNama: 'ust Juswandi', catatan: '👥', rutin: 'Pengurus Inti' },
    {
      judul: 'LOGISTIK MAHAD',
      picNama: 'Yudi Nahyuddin',
      catatan: '📦',
      rutin: 'Pengurus Inti',
      sub: [
        { judul: 'Kunci Motor', picNama: 'Yudhi' },
        { judul: 'Lemari Tool', picNama: 'Hakim' },
        { judul: 'Baterai & Charger', picNama: 'Syarif' },
        { judul: 'Vacuum Cleaner', picNama: 'Zaki' },
      ],
    },
    { judul: 'PEMBINA CIJULANG', picNama: 'ust Dimas Erilangga', catatan: '🏘️', rutin: 'Pengurus Inti' },
    // Divisi
    {
      judul: 'BENDAHARA',
      picNama: 'Yudi Nahyuddin',
      catatan: '💰',
      rutin: 'Divisi',
      sub: [
        { judul: 'PJ. Bendahara Kas', picNama: 'Yudi' },
        { judul: 'Iuran Bulanan / Darda', picNama: 'Said' },
      ],
    },
    {
      judul: 'SEKRETARIS',
      picNama: 'Husnil',
      catatan: '📋',
      rutin: 'Divisi',
      sub: [{ judul: 'WC Aula Depan', picNama: 'Husnil' }],
    },
    {
      judul: 'KEAMANAN',
      picNama: 'Zikri, Fauzan',
      catatan: '🔒',
      rutin: 'Divisi',
      sub: [
        { judul: 'Kran Air', picNama: 'Farhan' },
        { judul: 'Sandal', picNama: 'Andri - Farhan Petir' },
        { judul: 'Matikan Lampu', picNama: 'Fikri - Ardi, Sam-Sam' },
      ],
    },
    {
      judul: 'BISNIS',
      picNama: 'Hakim, Affil',
      catatan: '💼',
      rutin: 'Divisi',
      sub: [
        { judul: 'Nampan & Piring', picNama: 'Hafiz, Affil' },
        { judul: 'Kerapihan Rak Pampers', picNama: 'Affil, Hafiz' },
      ],
    },
    {
      judul: 'KEMANAN GHAZA',
      picNama: 'Syaiful',
      catatan: '🛡️',
      rutin: 'Divisi',
      sub: [{ judul: 'Pompa Kolam', picNama: 'Ghaza' }],
    },
    {
      judul: 'PJ KESEHATAN',
      picNama: 'Rizky, Aziz',
      catatan: '🏥',
      rutin: 'Divisi',
      sub: [{ judul: 'Jemuran Jatuh', picNama: 'Hadi - Aziz' }],
    },
    {
      judul: 'PJ MEMBANGUNKAN',
      picNama: 'Ardi, Said',
      catatan: '⏰',
      rutin: 'Divisi',
      sub: [
        { judul: 'Membangunkan Santri', picNama: 'Ardi, Said' },
        { judul: 'Gazebo', picNama: 'Ardi' },
        { judul: 'Aula', picNama: 'Ardi' },
        { judul: 'Dapur', picNama: 'Ardi, Rishi A.' },
        { judul: 'Ingatkan Jumat', picNama: 'Said, Hafiz' },
        { judul: 'Alat Kebersihan', picNama: 'Said Syarif' },
      ],
    },
    {
      judul: 'MEDIA',
      picNama: 'Fahmi, Abdul Hadi',
      catatan: '📷',
      rutin: 'Divisi',
      sub: [
        { judul: 'Hp. Media', picNama: 'Fahmi' },
        { judul: 'Hadroh', picNama: 'Luthfi Maskur' },
        { judul: 'Motor Ustadz', picNama: 'Hafizh, Aqi' },
        { judul: 'Jendela & Lap Frame', picNama: 'Affan R.' },
        { judul: 'Torrent Air', picNama: 'Azkhtar' },
        { judul: 'Meja Majlis', picNama: 'Maher' },
        { judul: 'Catat Lampu Rusak', picNama: 'Abdurrahman' },
      ],
    },
  ],
};

// ===== Fungsi seed (hanya berjalan di browser, butuh IndexedDB) =====
// Semua fungsi idempotent: tidak menulis apa pun jika tabel sudah terisi.

// Cek-lalu-tulis dibungkus satu transaksi Dexie per fungsi (bukan dua
// panggilan await terpisah) supaya idempotensi tetap berlaku walau
// jalankanSeed() dipanggil dua kali beriringan — mis. React StrictMode
// dev me-render efek dua kali, yang tanpa ini menggandakan baris seed
// (bug ditemukan saat verifikasi UI Batch D).

export async function seedDivisiBaku(db: TartibDb = tartibDb): Promise<number> {
  return db.transaction('rw', db.divisi, async () => {
    if ((await db.divisi.count()) > 0) return 0;
    const rows = DIVISI_BAKU.map((d, i) => ({ id: buatId(), ...d, urutan: i + 1, baku: true }));
    await db.divisi.bulkAdd(rows);
    return rows.length;
  });
}

export async function seedJenisAcara(db: TartibDb = tartibDb): Promise<number> {
  return db.transaction('rw', db.jenisAcara, async () => {
    if ((await db.jenisAcara.count()) > 0) return 0;
    const rows = JENIS_ACARA_BAKU.map((j) => ({ id: buatId(), ...j, aktif: true }));
    await db.jenisAcara.bulkAdd(rows);
    return rows.length;
  });
}

// Menanam satu template (fase + item) — dipakai seedTemplateContoh dan
// seedTemplatePanduan. Harus dipanggil di dalam transaksi pemanggilnya.
async function tanamTemplate(
  db: TartibDb,
  data: { nama: string; versi: number; jenisAcaraNama: string; catatan: string; fase: FaseContoh[] },
  labelAsal: string,
): Promise<number> {
  const jenisAcara = await db.jenisAcara.where('nama').equals(data.jenisAcaraNama).first();
  if (!jenisAcara) {
    throw new Error(`${labelAsal}: jenis acara "${data.jenisAcaraNama}" belum ada — jalankan seedJenisAcara dulu`);
  }

  const divisi = (await db.divisi.toArray()).sort((a, b) => a.urutan - b.urutan);
  const divisiByUrutan = new Map(divisi.map((d) => [d.urutan, d.id]));

  const templateId = buatId();
  const items: { id: string; templateId: string; faseId: string; divisiId: string; judul: string; catatan: string; wajib: boolean; rumusQty?: string; urutan: number }[] = [];

  for (const fase of data.fase) {
    const faseId = buatId();
    await db.fase.add({ id: faseId, templateId, urutan: fase.urutan, label: fase.label, offsetHari: fase.offsetHari });
    fase.items.forEach((item, i) => {
      const divisiId = divisiByUrutan.get(item.divisiUrutan);
      if (!divisiId) {
        throw new Error(`${labelAsal}: divisi urutan ${item.divisiUrutan} tidak ada (item "${item.judul}")`);
      }
      items.push({ id: buatId(), templateId, faseId, divisiId, judul: item.judul, catatan: item.catatan, wajib: item.wajib, rumusQty: item.rumusQty, urutan: i + 1 });
    });
  }

  await db.template.add({ id: templateId, jenisAcaraId: jenisAcara.id, versi: data.versi, nama: data.nama, catatan: data.catatan, dibuatPada: new Date().toISOString(), aktif: true });
  await db.templateItem.bulkAdd(items);
  return items.length;
}

export async function seedTemplateContoh(db: TartibDb = tartibDb): Promise<number> {
  return db.transaction('rw', db.template, db.templateItem, db.fase, db.jenisAcara, db.divisi, async () => {
    if ((await db.template.count()) > 0) return 0;
    return tanamTemplate(db, TEMPLATE_CONTOH, 'seedTemplateContoh');
  });
}

// Idempoten PER NAMA (bukan "hanya bila tabel kosong") supaya template panduan
// muncul juga pada data yang sudah berisi template lain.
export async function seedTemplatePanduan(db: TartibDb = tartibDb): Promise<number> {
  return db.transaction('rw', db.template, db.templateItem, db.fase, db.jenisAcara, db.divisi, async () => {
    const sudahAda = await db.template.filter((t) => t.nama === TEMPLATE_PANDUAN.nama).first();
    if (sudahAda) return 0;
    return tanamTemplate(db, TEMPLATE_PANDUAN, 'seedTemplatePanduan');
  });
}

// Idempoten per TANDA baku (bukan per judul): pengguna boleh mengganti judul
// papan baku tanpa memicu seed menanam salinan kedua saat halaman dimuat
// ulang. Papan baku ditandai baku: true — sopService menolak menghapusnya
// (semi-paten).
export async function seedSopAmanah(db: TartibDb = tartibDb): Promise<number> {
  return db.transaction('rw', db.sop, db.sopItem, db.sopSubItem, async () => {
    const sudahAda = await db.sop.filter((s) => s.baku).first();
    if (sudahAda) return 0;
    const sopId = buatId();
    await db.sop.add({
      id: sopId,
      judul: SOP_AMANAH_BAKU.judul,
      catatan: SOP_AMANAH_BAKU.catatan,
      baku: true,
      urutan: 1,
      dibuatPada: new Date().toISOString(),
    });

    let totalItems = 0;
    for (let i = 0; i < SOP_AMANAH_BAKU.items.length; i++) {
      const it = SOP_AMANAH_BAKU.items[i];
      const itemId = buatId();
      await db.sopItem.add({
        id: itemId,
        sopId,
        judul: it.judul,
        picNama: it.picNama ?? '',
        catatan: it.catatan,
        rutin: it.rutin,
        selesai: false,
        urutan: i + 1,
      });
      totalItems++;

      if (it.sub && it.sub.length > 0) {
        await db.sopSubItem.bulkAdd(
          it.sub.map((s, j) => ({
            id: buatId(),
            sopId,
            itemId,
            judul: s.judul,
            picNama: s.picNama ?? '',
            catatan: s.catatan ?? '',
            selesai: false,
            urutan: j + 1,
          })),
        );
      }
    }
    return totalItems;
  });
}

export async function jalankanSeed(db: TartibDb = tartibDb): Promise<void> {
  await seedDivisiBaku(db);
  await seedJenisAcara(db);
  await seedTemplateContoh(db);
  await seedTemplatePanduan(db);
  await seedSopAmanah(db);
}
