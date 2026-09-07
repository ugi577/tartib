// Pustaka Deteksi Ikon Otomatis Sesuai Konteks Jabatan & Tugas
// Mendeteksi kata kunci kontekstual (Indonesia, pesantren, sekolah, kepanitiaan, kantor)
// untuk menyajikan emoji/ikon yang hidup dan akurat secara otomatis.

export interface AturanIkon {
  kataKunci: string[];
  ikon: string;
}

// ── 1. Ikon Jabatan / Divisi / Peran Struktur ────────────────────────────────
export const ATURAN_IKON_JABATAN: AturanIkon[] = [
  // Pimpinan, Pengasuh & Tokoh
  {
    kataKunci: ['mudir', 'pengasuh', 'kyai', 'kiai', 'buya', 'habib', 'syaikh', 'pesantren', 'mahad', 'pondok'],
    ikon: '🕌',
  },
  {
    kataKunci: ['ketua', 'pimpinan', 'direktur', 'rektor', 'kepala', 'president', 'presidium', 'lurah', 'amir'],
    ikon: '👑',
  },
  {
    kataKunci: ['wakil', 'wa. ketua', 'waka', 'co-chair', 'vice'],
    ikon: '⚡',
  },
  {
    kataKunci: ['pembina', 'penasihat', 'penasehat', 'shohibul hajat', 'sesepuh', 'dewan', 'musyrif'],
    ikon: '🌟',
  },

  // Majelis & Pengajian
  {
    kataKunci: ['majelis', 'majlis', 'majelis taklim', 'majlis taklim', 'pj majelis', 'kajian majelis'],
    ikon: '🕌',
  },

  // Kesekretariatan & Administrasi
  {
    kataKunci: ['sekretaris', 'admin', 'tata usaha', 'persuratan', 'registrasi', 'arsip', 'notulen', 'dokumen'],
    ikon: '📋',
  },

  // Keuangan, Usaha & Bisnis
  {
    kataKunci: ['bendahara', 'keuangan', 'kasir', 'akuntansi', 'anggaran', 'budget', 'kas', 'fiskal'],
    ikon: '💰',
  },
  {
    kataKunci: ['bisnis', 'usaha', 'koperasi', 'kantin', 'merchandise', 'dana', 'sponsor', 'donatur', 'darda', 'iuran'],
    ikon: '💼',
  },

  // Hubungan Masyarakat, Tamu & Acara
  {
    kataKunci: ['humas', 'sosial', 'liaison', 'liaison officer', 'relasi', 'kemitraan', 'jaringan', 'eksternal'],
    ikon: '🤝',
  },
  {
    kataKunci: ['among tamu', 'penerima tamu', 'tamu', 'usher', 'penyambutan', 'vip', 'vvip', 'besan'],
    ikon: '💐',
  },
  {
    kataKunci: ['acara', 'protokoler', 'mc', 'pembawa acara', 'rundown', 'panggung', 'akad', 'resepsi'],
    ikon: '🎙️',
  },

  // Media, Desain & Dokumentasi
  {
    kataKunci: ['media', 'dokumentasi', 'foto', 'video', 'kamera', 'creator', 'konten', 'podcast', 'youtube', 'instagram', 'tiktok'],
    ikon: '📷',
  },
  {
    kataKunci: ['desain', 'grafis', 'publikasi', 'dekorasi', 'baliho', 'spanduk', 'banner'],
    ikon: '🎨',
  },
  {
    kataKunci: ['it', 'website', 'programmer', 'aplikasi', 'sistem', 'komputer', 'teknisi it', 'jaringan'],
    ikon: '💻',
  },

  // Toren & Pengairan
  {
    kataKunci: [
      'torent air',
      'torent',
      'toren air',
      'toren',
      'torrent air',
      'torrent',
      'torn air',
      'torn',
      'tandon air',
      'tandon',
      'tangki air',
      'tangki',
      'pj torent',
      'pj toren',
      'pj torrent',
      'pj tandon',
      'air toren',
      'air torent',
      'kuras toren',
      'kuras torent',
      'pengairan',
    ],
    ikon: '🛢️',
  },

  // Jendela, Kaca & Ventilasi
  {
    kataKunci: ['jendela', 'kaca jendela', 'ventilasi', 'pj jendela'],
    ikon: '🪟',
  },

  // Frame, Bingkai & Pigura
  {
    kataKunci: ['frame', 'bingkai', 'pigura', 'pj frame', 'lukisan'],
    ikon: '🖼️',
  },

  // Logistik, Perlengkapan & Sarana
  {
    kataKunci: ['logistik', 'perlengkapan', 'gudang', 'barang'],
    ikon: '📦',
  },

  // Perabotan, Meubel, Meja & Kursi
  {
    kataKunci: ['meja & kursi', 'meja kursi', 'perabotan', 'meubel', 'mebel', 'furniture', 'furnitur', 'seksi meubel', 'meja', 'kursi'],
    ikon: '🪑',
  },

  // Inventaris & Sarpras
  {
    kataKunci: ['inventaris', 'sarpras', 'sarana prasarana', 'aset', 'fasilitas', 'seksi inventaris', 'divisi inventaris'],
    ikon: '🏷️',
  },
  {
    kataKunci: ['sound', 'audio', 'mic', 'listrik', 'genset', 'penerangan', 'blower', 'ac', 'teknis'],
    ikon: '⚡',
  },

  // Keamanan & Ketertiban
  {
    kataKunci: ['keamanan', 'security', 'satpam', 'disiplin', 'ketertiban', 'ronda', 'pospam', 'pengawas', 'intel', 'ghaza'],
    ikon: '🔒',
  },

  // Konsumsi & Tata Boga
  {
    kataKunci: ['konsumsi', 'katering', 'dapur', 'masak', 'makanan', 'minuman', 'prasmanan', 'snack', 'gizi', 'chef'],
    ikon: '🍽️',
  },

  // Kebersihan & Lingkungan
  {
    kataKunci: ['kebersihan', 'lingkungan', 'sampah', 'sanitasi', 'pertamanan', 'taman', 'k3', 'asri', 'cleaning'],
    ikon: '🧹',
  },

  // Kesehatan & Medis
  {
    kataKunci: ['kesehatan', 'medis', 'dokter', 'perawat', 'p3k', 'obat', 'uks', 'poskestren', 'klinik', 'ambulans'],
    ikon: '🏥',
  },

  // Keagamaan, Ibadah & Bahasa
  {
    kataKunci: ['ibadah', 'masjid', 'shalat', 'sholat', 'adzan', 'muadzin', 'imam', 'marbot', 'dakwah', 'tahfidz', 'quran'],
    ikon: '📖',
  },
  {
    kataKunci: ['bahasa', 'arab', 'inggris', 'language', 'mufrodat', 'bilingual'],
    ikon: '🗣️',
  },

  // Waktu & Ketertiban Santri
  {
    kataKunci: ['membangunkan', 'bangun', 'alarm', 'bel', 'kedisiplinan'],
    ikon: '⏰',
  },

  // Transportasi: Motor & Mobil
  {
    kataKunci: ['motor', 'sepeda motor', 'pj motor'],
    ikon: '🛵',
  },
  {
    kataKunci: ['transportasi', 'kendaraan', 'driver', 'sopir', 'pengemudi', 'bus', 'mobil', 'parkir'],
    ikon: '🚗',
  },
  {
    kataKunci: ['akomodasi', 'penginapan', 'asrama', 'kamar', 'losmen', 'hotel', 'villa', 'homestay'],
    ikon: '🏘️',
  },

  // Olahraga & Seni
  {
    kataKunci: ['olahraga', 'jasmani', 'futsal', 'sepakbola', 'silat', 'bela diri', 'atletik'],
    ikon: '⚽',
  },
  {
    kataKunci: ['seni', 'hadroh', 'marawis', 'nasyid', 'rebana', 'musik', 'budaya'],
    ikon: '🥁',
  },
];

// ── 2. Ikon Tugas / Sub-Tugas Detail ─────────────────────────────────────────
export const ATURAN_IKON_TUGAS: AturanIkon[] = [
  // Toren & Tangki Air
  {
    kataKunci: [
      'torent air',
      'torent',
      'toren air',
      'toren',
      'torrent air',
      'torrent',
      'torn air',
      'torn',
      'tandon air',
      'tandon',
      'tangki air',
      'tangki',
      'pj torent',
      'pj toren',
      'pj torrent',
      'pj tandon',
      'air toren',
      'air torent',
      'kuras toren',
      'kuras torent',
      'pengairan',
    ],
    ikon: '🛢️',
  },

  // Kran & Sanitasi Air
  {
    kataKunci: ['kran air', 'keran air', 'kran', 'keran', 'wastafel', 'bak air', 'gayung', 'ember'],
    ikon: '🚰',
  },

  // Air & Pompa
  {
    kataKunci: ['pompa sungai', 'pompa kolam', 'pompa air', 'pompa', 'sumur', 'mata air', 'selang', 'pipa', 'drainase', 'air'],
    ikon: '💧',
  },

  // Motor & Sepeda Motor
  {
    kataKunci: ['motor ustadz', 'motor dinas', 'sepeda motor', 'kunci motor', 'parkir motor', 'bengkel motor', 'vespa', 'matic', 'motor'],
    ikon: '🛵',
  },

  // Mobil & Kendaraan Roda 4
  {
    kataKunci: ['mobil', 'pick up', 'pikap', 'ambulans', 'elf', 'bus', 'bis', 'van', 'kendaraan'],
    ikon: '🚗',
  },

  // Sepeda
  {
    kataKunci: ['sepeda', 'ontel', 'gowes'],
    ikon: '🚲',
  },

  // Jendela & Kaca
  {
    kataKunci: ['jendela & lap frame', 'kaca jendela', 'lap jendela', 'ventilasi', 'jalusi', 'jendela'],
    ikon: '🪟',
  },

  // Frame, Bingkai, Kaligrafi & Pigura
  {
    kataKunci: ['lap frame', 'frame foto', 'bingkai foto', 'pigura', 'bingkai', 'lukisan', 'kaligrafi frame', 'frame'],
    ikon: '🖼️',
  },

  // Kursi, Bangku & Sofa
  {
    kataKunci: ['kursi tamu', 'kursi plastik', 'kursi lipat', 'kursi guru', 'kursi aula', 'kursi santai', 'sofa', 'bangku', 'jok', 'kursi'],
    ikon: '🪑',
  },

  // Meja & Mebel Kayu
  {
    kataKunci: ['meja majlis', 'meja majelis', 'meja guru', 'meja makan', 'meja rapat', 'meja kantor', 'meja belajar', 'meja tamu', 'meja kerja', 'meja'],
    ikon: '🪵',
  },

  // Majelis & Pengajian
  {
    kataKunci: ['majelis taklim', 'majlis taklim', 'ruang majlis', 'ruang majelis', 'halaqah majelis', 'majelis', 'majlis'],
    ikon: '🕌',
  },

  // Perabotan & Meubel Umum
  {
    kataKunci: ['perabotan', 'meubel', 'mebel', 'furniture', 'furnitur'],
    ikon: '🪑',
  },

  // Lemari Perkakas / Tools
  {
    kataKunci: ['lemari tool', 'rak tool', 'rak perkakas'],
    ikon: '🧰',
  },

  // Lemari & Rak Perabotan
  {
    kataKunci: ['lemari pakaian', 'lemari arsip', 'lemari buku', 'lemari', 'bufet', 'rak buku', 'rak pampers', 'loker', 'kabinet', 'etalase', 'rak sepatu', 'rak'],
    ikon: '🗄️',
  },

  // Tempat Tidur & Kasur
  {
    kataKunci: ['kasur', 'dipan', 'ranjang', 'tempat tidur', 'bantal', 'guling', 'sprei', 'selimut'],
    ikon: '🛏️',
  },

  // Cermin
  {
    kataKunci: ['cermin', 'kaca cermin', 'kaca rias', 'kaca wastafel'],
    ikon: '🪞',
  },

  // Pintu, Gerbang & Tirai
  {
    kataKunci: ['pintu', 'gerbang', 'rolling door', 'gorden', 'tirai', 'korden', 'kelambu'],
    ikon: '🚪',
  },

  // Karpet & Sajadah
  {
    kataKunci: ['karpet', 'ambal', 'tikar', 'permadani', 'terpal'],
    ikon: '🧶',
  },

  // Inventaris & Sarpras
  {
    kataKunci: ['inventaris', 'sarpras', 'sarana prasarana', 'aset', 'fasilitas', 'perlengkapan & aset', 'daftar inventaris'],
    ikon: '🏷️',
  },

  // Kipas Angin & Pendingin
  {
    kataKunci: ['kipas angin', 'blower', 'kipas blower', 'kipas'],
    ikon: '🌀',
  },
  {
    kataKunci: ['ac', 'pendingin ruangan', 'air conditioner'],
    ikon: '❄️',
  },

  // Elektronik Display & Proyektor
  {
    kataKunci: ['proyektor', 'infocus', 'layar proyektor', 'screen proyektor', 'tv', 'televisi', 'monitor'],
    ikon: '📽️',
  },
  {
    kataKunci: ['dispenser', 'galon air', 'galon', 'kulkas', 'freezer'],
    ikon: '🧊',
  },
  {
    kataKunci: ['jam dinding', 'jam lonceng', 'jam meja'],
    ikon: '🕰️',
  },
  {
    kataKunci: ['papan tulis', 'whiteboard', 'blackboard', 'mading', 'papan pengumuman'],
    ikon: '📋',
  },
  {
    kataKunci: ['podium', 'mimbar', 'panggung'],
    ikon: '🏛️',
  },

  // Gadget & Komunikasi
  {
    kataKunci: ['hp', 'handphone', 'ponsel', 'telepon', 'wa', 'whatsapp', 'sms', 'kuota', 'pulsa', 'hotspot', 'wifi'],
    ikon: '📱',
  },

  // Kunci & Gembok
  {
    kataKunci: ['kunci', 'gembok', 'slot pintu'],
    ikon: '🔑',
  },

  // Peralatan & Perkakas
  {
    kataKunci: ['tool', 'perkakas', 'obeng', 'tang', 'palu', 'bor', 'gergaji', 'bengkel', 'peralatan'],
    ikon: '🧰',
  },

  // Baterai, Listrik & Lampu
  {
    kataKunci: ['baterai', 'charger', 'cas', 'colokan', 'accu', 'aki', 'power bank'],
    ikon: '🔋',
  },
  {
    kataKunci: ['lampu', 'matikan lampu', 'catat lampu', 'neon', 'bohlam', 'saklar', 'kabel', 'listrik', 'genset', 'stopkontak'],
    ikon: '💡',
  },

  // Kebersihan, Sapu, Pel & Toilet
  {
    kataKunci: ['vacuum', 'vakum', 'sapu', 'pel', 'kemoceng', 'sikat', 'kebersihan', 'alat kebersihan', 'kerja bakti'],
    ikon: '🧹',
  },
  {
    kataKunci: ['wc', 'toilet', 'kamar mandi', 'urinoir', 'wudhu', 'kloset', 'septic'],
    ikon: '🚻',
  },
  {
    kataKunci: ['sampah', 'buang', 'bak sampah', 'tong', 'limbah'],
    ikon: '🗑️',
  },

  // Sandal, Sepatu & Pakaian
  {
    kataKunci: ['sandal', 'sepatu', 'alas kaki'],
    ikon: '👟',
  },
  {
    kataKunci: ['jemuran', 'jemur', 'pakaian', 'baju', 'jubah', 'gamis', 'laundry', 'cuci', 'setrika'],
    ikon: '👕',
  },

  // Makanan, Dapur & Nampan
  {
    kataKunci: ['nampan', 'piring', 'gelas', 'sendok', 'garpu', 'mangkok', 'cuci piring', 'hidangan'],
    ikon: '🍽️',
  },
  {
    kataKunci: ['dapur', 'masak', 'kompor', 'gas', 'lpg', 'goreng', 'rebus', 'koki'],
    ikon: '🍳',
  },
  {
    kataKunci: ['minum', 'air minum', 'es buah', 'snack', 'kopi', 'teh'],
    ikon: '☕',
  },

  // Waktu, Bangun & Ibadah
  {
    kataKunci: ['membangunkan', 'bangun', 'alarm', 'subuh', 'jadwal'],
    ikon: '⏰',
  },
  {
    kataKunci: ['masjid', 'aula', 'ingatkan jumat', 'jumat', 'adzan', 'imam', 'muadzin', 'shaf', 'halaqah', 'quran'],
    ikon: '🕌',
  },

  // Gedung & Area
  {
    kataKunci: ['gazebo', 'taman', 'teras', 'halaman', 'kolam ikan'],
    ikon: '🏡',
  },
  {
    kataKunci: ['gedung', 'auditorium', 'asrama', 'mahad', 'kantor'],
    ikon: '🏛️',
  },

  // Musik, Seni & Hadroh
  {
    kataKunci: ['hadroh', 'rebana', 'marawis', 'nasyid', 'sound', 'mic', 'microphone', 'audio'],
    ikon: '🥁',
  },

  // Keuangan, Kas & Amplop
  {
    kataKunci: ['kas', 'uang', 'amplop', 'iuran', 'darda', 'bayar', 'kuitansi', 'struk', 'bank'],
    ikon: '💵',
  },

  // Administrasi, Catatan & Tamu
  {
    kataKunci: ['catat', 'buku tamu', 'daftar', 'souvenir', 'absen', 'surat', 'dokumen', 'print'],
    ikon: '📝',
  },

  // Medis & P3K
  {
    kataKunci: ['obat', 'p3k', 'perban', 'kasa', 'betadine', 'minyak angin', 'termometer', 'klinik', 'sakit'],
    ikon: '💊',
  },
];

// ── 3. Ikon Pelajaran / Mata Pelajaran KBM ───────────────────────────────────
export const ATURAN_IKON_MAPEL: AturanIkon[] = [
  { kataKunci: ['quran', 'al-quran', 'tahfidz', 'tajwid', 'murottal'], ikon: '📖' },
  { kataKunci: ['hadits', 'hadis', 'arba\'in', 'bulughul maram'], ikon: '📜' },
  { kataKunci: ['fiqih', 'fikih', 'ushul fiqih'], ikon: '⚖️' },
  { kataKunci: ['aqidah', 'akidah', 'tauhid', 'akhlak'], ikon: '🤍' },
  { kataKunci: ['bahasa arab', 'nahwu', 'shorof', 'mufrodat', 'muhadatsah'], ikon: '🗣️' },
  { kataKunci: ['bahasa inggris', 'english'], ikon: '🌐' },
  { kataKunci: ['bahasa indonesia', 'sastra'], ikon: '📚' },
  { kataKunci: ['matematika', 'mtk', 'kalkulus', 'aljabar'], ikon: '📐' },
  { kataKunci: ['ipa', 'sains', 'fisika', 'biologi', 'kimia'], ikon: '🔬' },
  { kataKunci: ['ips', 'sejarah', 'ski', 'geografi', 'sosiologi'], ikon: '🌍' },
  { kataKunci: ['penjas', 'olahraga', 'pjok'], ikon: '⚽' },
  { kataKunci: ['seni', 'kaligrafi', 'prakarya'], ikon: '🎨' },
  { kataKunci: ['tik', 'informatika', 'komputer'], ikon: '💻' },
  { kataKunci: ['istirahat', 'break', 'makan siang'], ikon: '☕' },
  { kataKunci: ['upacara', 'apel'], ikon: '🇮🇩' },
];

// ── Fungsi Pencari / Pengenal Otomatis ───────────────────────────────────────

function cocokkanAturan(teksTarget: string, aturanList: AturanIkon[]): string | null {
  const norm = ` ${teksTarget.toLowerCase()} `;
  for (const item of aturanList) {
    for (const k of item.kataKunci) {
      const kNorm = k.toLowerCase();
      if (kNorm.includes(' ') || kNorm.includes('-') || kNorm.includes('&')) {
        if (norm.includes(kNorm)) return item.ikon;
      } else {
        const regex = new RegExp(`(^|[^a-zA-Z0-9])${kNorm}([^a-zA-Z0-9]|$)`, 'i');
        if (regex.test(teksTarget)) {
          return item.ikon;
        }
      }
    }
  }
  return null;
}

/**
 * Mendapatkan ikon otomatis untuk Jabatan / Posisi Struktur.
 * Prioritas:
 * 1. Emoji kustom di catatan pengguna (misal catatan dimulai dengan emoji 🕌)
 * 2. Hasil deteksi kontekstual dari judul
 * 3. Hasil deteksi kontekstual dari catatan
 * 4. Fallback berbasis tingkat tier (`Pimpinan` -> 👑, `Pengurus Inti` -> 🏛️, `Divisi` -> 📌)
 */
export function ambilIkonJabatan(judul: string, catatan?: string, rutin?: string): string {
  // Jika pengguna menulis emoji eksplisit kustom (bukan pin fallback) di awal catatan, hormati pilihan tersebut
  if (catatan && catatan.length > 0) {
    const trimmed = catatan.trim();
    // Karakter non-alfanumerik di awal catatan biasanya emoji
    if (!/^[a-zA-Z0-9\s([{"']/.test(trimmed)) {
      const seg = trimmed.split(/\s/)[0];
      if (seg && seg !== '📌' && seg !== '🏛️' && seg !== '👑' && seg !== '🔹') {
        return seg;
      }
    }
  }

  // Deteksi kontekstual judul
  const dariJudul = cocokkanAturan(judul, ATURAN_IKON_JABATAN);
  if (dariJudul) return dariJudul;

  // Deteksi kontekstual catatan
  if (catatan) {
    const dariCatatan = cocokkanAturan(catatan, ATURAN_IKON_JABATAN);
    if (dariCatatan) return dariCatatan;
  }

  // Fallback hierarkis
  if (rutin === 'Pimpinan') return '👑';
  if (rutin === 'Pengurus Inti') return '🏛️';
  return '📌';
}

/**
 * Mendapatkan ikon otomatis untuk Tugas / Sub-Tugas Detail.
 * Menganalisis kata kunci tugas seperti pompa, kunci, kabel, sandal, vacuum, dsb.
 */
export function ambilIkonTugas(judul: string, catatan?: string): string {
  // Jika ada emoji eksplisit di awal judul atau catatan
  const trimmed = judul.trim();
  if (!/^[a-zA-Z0-9\s([{"']/.test(trimmed)) {
    const seg = trimmed.split(/\s/)[0];
    if (seg && seg.length <= 4 && seg !== '🔹' && seg !== '📌') return seg;
  }

  const dariJudul = cocokkanAturan(judul, ATURAN_IKON_TUGAS);
  if (dariJudul) return dariJudul;

  if (catatan) {
    const dariCatatan = cocokkanAturan(catatan, ATURAN_IKON_TUGAS);
    if (dariCatatan) return dariCatatan;
  }

  // Fallback netral namun tetap rapi
  return '🔹';
}

/**
 * Mendapatkan ikon otomatis untuk mata pelajaran KBM.
 */
export function ambilIkonMapel(mapel: string): string {
  const dariMapel = cocokkanAturan(mapel, ATURAN_IKON_MAPEL);
  if (dariMapel) return dariMapel;
  return '📚';
}

/**
 * Memberikan daftar emoji saran cepat yang relevan dengan konteks input.
 */
export function saranIkonCepat(teks: string, jenis: 'jabatan' | 'tugas' = 'jabatan'): string[] {
  const aturan = jenis === 'jabatan' ? ATURAN_IKON_JABATAN : ATURAN_IKON_TUGAS;
  const norm = teks.toLowerCase();
  const hasil: string[] = [];

  for (const it of aturan) {
    if (it.kataKunci.some((k) => norm.includes(k) || k.includes(norm))) {
      if (!hasil.includes(it.ikon)) hasil.push(it.ikon);
    }
  }

  // Tambahkan beberapa rekomendasi umum jika saran sedikit
  const standar = jenis === 'jabatan'
    ? ['👑', '🕌', '👥', '📋', '💰', '📦', '🔒', '🍽️', '🧹', '📷', '🏥', '🚗', '🛵', '🪑', '🏷️', '⚡', '🤝']
    : ['💧', '🛢️', '🔑', '📱', '🧰', '🔋', '💡', '🧹', '🚻', '👟', '👕', '🍽️', '⏰', '🕌', '🛵', '🪟', '🖼️', '🪑', '🪵', '🗄️', '🏷️', '📝'];

  for (const s of standar) {
    if (!hasil.includes(s)) hasil.push(s);
    if (hasil.length >= 8) break;
  }

  return hasil.slice(0, 8);
}

// ── 4. Katalog Emoji Pilihan Manual Terstruktur ─────────────────────────────

export interface KategoriEmoji {
  id: string;
  nama: string;
  ikon: string;
  daftar: { ikon: string; label: string }[];
}

export const KATALOG_EMOJI_MANUAL: KategoriEmoji[] = [
  {
    id: 'perabotan',
    nama: 'Perabotan & Meubel',
    ikon: '🪑',
    daftar: [
      { ikon: '🛢️', label: 'Toren / Tandon Air' },
      { ikon: '🪑', label: 'Kursi / Bangku' },
      { ikon: '🪵', label: 'Meja' },
      { ikon: '🪟', label: 'Jendela / Kaca' },
      { ikon: '🖼️', label: 'Frame / Bingkai / Lukisan' },
      { ikon: '🗄️', label: 'Lemari / Filing Cabinet' },
      { ikon: '🛏️', label: 'Kasur / Ranjang' },
      { ikon: '🪞', label: 'Cermin / Kaca Rias' },
      { ikon: '🚪', label: 'Pintu / Gerbang' },
      { ikon: '🧶', label: 'Karpet / Tikar / Sajadah' },
      { ikon: '🛋️', label: 'Sofa / Kursi Tamu' },
      { ikon: '🚰', label: 'Kran Air / Wastafel' },
      { ikon: '🧊', label: 'Dispenser / Kulkas' },
      { ikon: '🌀', label: 'Kipas Angin / Blower' },
      { ikon: '❄️', label: 'AC / Pendingin' },
      { ikon: '🪣', label: 'Ember / Bak Air' },
      { ikon: '🚿', label: 'Shower / Kamar Mandi' },
      { ikon: '🚽', label: 'Toilet / Kloset' },
      { ikon: '🪜', label: 'Tangga / Stepladder' },
      { ikon: '📦', label: 'Kardus / Box Penyimpanan' },
      { ikon: '🧺', label: 'Keranjang Laundry' },
      { ikon: '🪴', label: 'Pot Bunga / Tanaman' },
      { ikon: '🏺', label: 'Guci / Vas' },
      { ikon: '⛺', label: 'Tenda / Terpal' },
      { ikon: '🏡', label: 'Gazebo / Teras' },
    ],
  },
  {
    id: 'struktur',
    nama: 'Jabatan & Tim',
    ikon: '👑',
    daftar: [
      { ikon: '👑', label: 'Ketua / Pimpinan' },
      { ikon: '🏛️', label: 'Pengurus Inti / Yayasan' },
      { ikon: '🕌', label: 'Mudir / Pengasuh' },
      { ikon: '🌟', label: 'Pembina / Penasihat' },
      { ikon: '⚡', label: 'Wakil Ketua / Asisten' },
      { ikon: '💰', label: 'Bendahara / Kasir' },
      { ikon: '📋', label: 'Sekretaris / Administrasi' },
      { ikon: '💼', label: 'Bisnis / Koperasi' },
      { ikon: '🤝', label: 'Humas / Tamu' },
      { ikon: '💐', label: 'Among Tamu / Usher' },
      { ikon: '🎙️', label: 'Acara / MC / Protokoler' },
      { ikon: '🔒', label: 'Keamanan / Satpam' },
      { ikon: '🛡️', label: 'Pengawal / Pertahanan' },
      { ikon: '🏥', label: 'Kesehatan / Medis' },
      { ikon: '🧹', label: 'Kebersihan / Janitor' },
      { ikon: '🍽️', label: 'Konsumsi / Katering' },
      { ikon: '👨‍🍳', label: 'Koki / Juru Masak' },
      { ikon: '📷', label: 'Dokumentasi / Foto' },
      { ikon: '🎥', label: 'Videografer / Streaming' },
      { ikon: '🎨', label: 'Desain / Dekorasi' },
      { ikon: '💻', label: 'IT / Programmer' },
      { ikon: '🧑‍🏫', label: 'Ustadz / Guru' },
      { ikon: '👨‍🎓', label: 'Santri / Siswa' },
      { ikon: '👥', label: 'Anggota / Tim' },
      { ikon: '📌', label: 'Divisi / Seksi Umum' },
    ],
  },
  {
    id: 'sarpras',
    nama: 'Inventaris & Alat',
    ikon: '🏷️',
    daftar: [
      { ikon: '🏷️', label: 'Inventaris / Label Aset' },
      { ikon: '📦', label: 'Logistik / Gudang' },
      { ikon: '🧰', label: 'Kotak Tool / Perkakas' },
      { ikon: '🔨', label: 'Palu / Martil' },
      { ikon: '🔧', label: 'Kunci Pas / Inggris' },
      { ikon: '🪛', label: 'Obeng' },
      { ikon: '🪚', label: 'Gergaji' },
      { ikon: '⚙️', label: 'Mesin / Sparepart' },
      { ikon: '📱', label: 'Hp / Gadget' },
      { ikon: '☎️', label: 'Telepon Kantor' },
      { ikon: '🔋', label: 'Baterai / Cas' },
      { ikon: '🔌', label: 'Colokan / Stopkontak' },
      { ikon: '💡', label: 'Lampu / Bohlam' },
      { ikon: '🔦', label: 'Senter / Lampu Darurat' },
      { ikon: '🔑', label: 'Kunci / Master Key' },
      { ikon: '🔐', label: 'Gembok / Brankas' },
      { ikon: '⏰', label: 'Jam Alarm / Waktu' },
      { ikon: '🕰️', label: 'Jam Dinding' },
      { ikon: '📽️', label: 'Proyektor / Layar' },
      { ikon: '📺', label: 'TV / Monitor' },
      { ikon: '🔊', label: 'Speaker / Sound' },
      { ikon: '📢', label: 'Megafon / Toa' },
      { ikon: '🎙️', label: 'Mic / Mikrofon' },
      { ikon: '📡', label: 'WiFi / Router / Antena' },
      { ikon: '🖨️', label: 'Printer / Fotokopi' },
      { ikon: '🚻', label: 'Toilet / WC' },
      { ikon: '🗑️', label: 'Tempat Sampah' },
      { ikon: '👟', label: 'Sandal / Sepatu' },
      { ikon: '👕', label: 'Pakaian / Seragam' },
      { ikon: '💧', label: 'Pompa / Sumber Air' },
      { ikon: '✂️', label: 'Gunting / Cutter' },
      { ikon: '📏', label: 'Meteran / Penggaris' },
      { ikon: '📎', label: 'Klip / Dokumen' },
      { ikon: '💊', label: 'Obat / P3K' },
      { ikon: '🩹', label: 'Plester / Perban' },
      { ikon: '🩺', label: 'Stetoskop / Tensi' },
      { ikon: '🧯', label: 'APAR / Pemadam' },
      { ikon: '🚧', label: 'Pembatas / Kerucut' },
    ],
  },
  {
    id: 'dapur',
    nama: 'Konsumsi & Dapur',
    ikon: '🍽️',
    daftar: [
      { ikon: '🍽️', label: 'Piring & Sendok / Makan' },
      { ikon: '🍳', label: 'Wajan / Masak' },
      { ikon: '🔪', label: 'Pisau Dapur' },
      { ikon: '🍚', label: 'Nasi / Beras' },
      { ikon: '🍱', label: 'Nasi Kotak / Box' },
      { ikon: '🥘', label: 'Sayur / Masakan' },
      { ikon: '🍗', label: 'Ayam Goreng' },
      { ikon: '🥩', label: 'Daging / Qurban' },
      { ikon: '🐟', label: 'Ikan' },
      { ikon: '🥚', label: 'Telur' },
      { ikon: '🍞', label: 'Roti / Kue' },
      { ikon: '🍉', label: 'Buah / Semangka' },
      { ikon: '☕', label: 'Kopi Hangat' },
      { ikon: '🍵', label: 'Teh' },
      { ikon: '🥤', label: 'Es / Minuman Dingin' },
      { ikon: '🥛', label: 'Susu' },
      { ikon: '🫖', label: 'Teko / Ceret' },
      { ikon: '🍶', label: 'Tumbler / Botol Air' },
      { ikon: '🥣', label: 'Mangkok / Sup' },
      { ikon: '🥢', label: 'Sumpit / Garpu' },
    ],
  },
  {
    id: 'kendaraan',
    nama: 'Transportasi',
    ikon: '🚗',
    daftar: [
      { ikon: '🛵', label: 'Sepeda Motor / Vespa' },
      { ikon: '🚗', label: 'Mobil Pribadi' },
      { ikon: '🚐', label: 'Mobil Elf / Minibus' },
      { ikon: '🚌', label: 'Bus Rombongan' },
      { ikon: '🛻', label: 'Pick Up / Mobil Bak' },
      { ikon: '🚚', label: 'Truk Box' },
      { ikon: '🚲', label: 'Sepeda Ontel / Gowes' },
      { ikon: '⛽', label: 'Bensin / SPBU' },
      { ikon: '🅿️', label: 'Area Parkir' },
      { ikon: '🛞', label: 'Ban / Roda' },
      { ikon: '🪪', label: 'SIM / STNK' },
      { ikon: '🚦', label: 'Lampu Lalu Lintas' },
    ],
  },
  {
    id: 'ibadah',
    nama: 'Ibadah & Majelis',
    ikon: '🕌',
    daftar: [
      { ikon: '🕌', label: 'Masjid / Majelis' },
      { ikon: '🕋', label: 'Ka\'bah / Haji / Umrah' },
      { ikon: '📖', label: 'Al-Qur\'an / Mushaf' },
      { ikon: '📜', label: 'Hadits / Kitab Kuning' },
      { ikon: '⚖️', label: 'Fiqih / Hukum Syariat' },
      { ikon: '🤍', label: 'Akhlak / Aqidah' },
      { ikon: '🗣️', label: 'Bahasa Arab' },
      { ikon: '🥁', label: 'Hadroh / Rebana' },
      { ikon: '🎼', label: 'Nasyid' },
      { ikon: '🕯️', label: 'Bukhur / Arang Wangi' },
      { ikon: '📿', label: 'Tasbih / Dzikir' },
      { ikon: '🤲', label: 'Doa / Halaqah' },
    ],
  },
  {
    id: 'akademik',
    nama: 'Sekolah & KBM',
    ikon: '📚',
    daftar: [
      { ikon: '📚', label: 'Buku / Perpustakaan' },
      { ikon: '📝', label: 'Catatan / Ujian' },
      { ikon: '📐', label: 'Matematika / Geometri' },
      { ikon: '🔬', label: 'IPA / Sains / Lab' },
      { ikon: '🌍', label: 'IPS / Sejarah' },
      { ikon: '🌐', label: 'Bahasa Inggris' },
      { ikon: '💻', label: 'Informatika / Komputer' },
      { ikon: '🎨', label: 'Seni / Kaligrafi' },
      { ikon: '⚽', label: 'Sepak Bola / Futsal' },
      { ikon: '🏸', label: 'Bulu Tangkis' },
      { ikon: '🏓', label: 'Tenis Meja' },
      { ikon: '🏹', label: 'Panahan' },
      { ikon: '🥋', label: 'Bela Diri / Silat' },
      { ikon: '🏕️', label: 'Pramuka / Kemah' },
      { ikon: '🇮🇩', label: 'Upacara / Bendera' },
      { ikon: '🎓', label: 'Wisuda / Kelulusan' },
      { ikon: '🏆', label: 'Piala / Juara' },
      { ikon: '🥇', label: 'Medali Emas' },
    ],
  },
  {
    id: 'simbol',
    nama: 'Simbol & Status',
    ikon: '🌟',
    daftar: [
      { ikon: '✅', label: 'Selesai / Ceklis' },
      { ikon: '⏳', label: 'Sedang Proses / Menunggu' },
      { ikon: '⚠️', label: 'Perhatian / Penting' },
      { ikon: '⛔', label: 'Dilarang / Tertutup' },
      { ikon: '🛑', label: 'Stop / Berhenti' },
      { ikon: '🎯', label: 'Target / Sasaran' },
      { ikon: '🚩', label: 'Bendera / Posko' },
      { ikon: '🔔', label: 'Bel / Notifikasi' },
      { ikon: '🎁', label: 'Hadiah / Souvenir' },
      { ikon: '💌', label: 'Surat / Undangan' },
      { ikon: '🔍', label: 'Cek / Audit' },
      { ikon: '💡', label: 'Ide / Rencana' },
      { ikon: '❤️', label: 'Sosial / Peduli' },
      { ikon: '💵', label: 'Uang Tunai / Amplop' },
      { ikon: '💳', label: 'Kartu / Debit' },
      { ikon: '🧾', label: 'Kwitansi / Nota' },
    ],
  },
];

/**
 * Mengekstrak emoji kustom manual dari catatan jika ada.
 * Mengabaikan karakter alfanumerik atau emoji fallback bawaan.
 */
export function ekstrakEmojiKustom(catatan?: string): string | null {
  if (!catatan) return null;
  const trimmed = catatan.trim();
  if (!/^[a-zA-Z0-9\s([{"']/.test(trimmed)) {
    const seg = trimmed.split(/\s/)[0];
    if (seg && seg !== '📌' && seg !== '🏛️' && seg !== '👑' && seg !== '🔹') {
      return seg;
    }
  }
  return null;
}

/**
 * Menyimpan atau menghapus emoji manual ke dalam string catatan,
 * menjaga teks catatan tambahan yang mungkin ditulis pengguna.
 */
export function pasangEmojiKustom(emoji: string | null, catatanLama?: string): string {
  const teks = catatanLama || '';
  const trimmed = teks.trim();
  let sisaTeks = trimmed;

  if (trimmed.length > 0 && !/^[a-zA-Z0-9\s([{"']/.test(trimmed)) {
    const parts = trimmed.split(/\s+/);
    parts.shift(); // Buang emoji lama
    sisaTeks = parts.join(' ').trim();
  }

  if (!emoji) {
    return sisaTeks;
  }
  return sisaTeks ? `${emoji} ${sisaTeks}` : emoji;
}

