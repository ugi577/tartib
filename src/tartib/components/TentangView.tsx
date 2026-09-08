'use client';

// Bagian "Tentang" — tampil DI DALAM Pengaturan (sejak sesi 16), bukan tab
// tersendiri. Sesi 22: isi ditulis ulang mengikuti identitas produk yang
// sama dengan README.md dan metadata layout.tsx ("Struktur organisasi,
// jadwal KBM, dan SOP acara siap cetak — offline, tanpa akun"); KEMAMPUAN
// mengacu nama menu yang benar-benar ada (Struktur & PIC, Preset, Kanvas
// Cetak, Acara, e-Konfirmasi, Pengaturan); tanpa merek aplikasi lain (K-13:
// "Aplikasi sejenis"); tanpa klaim fitur yang tidak ada. Konten statis.

import { DIVISI_BAKU } from '../db/seed';
import { KELAS } from '../ui/kelas';

const KEMAMPUAN: ReadonlyArray<{ tab: string; judul: string; isi: string }> = [
  {
    tab: 'Struktur & PIC',
    judul: 'Bagan organisasi dan daftar amanah',
    isi: 'Jabatan bertingkat (Pimpinan, Pengurus Inti, Divisi) dengan PIC dan sub-tugas berceklis; menu konteks salin/duplikat/potong; tampilan bagan atau daftar. Siap cetak A4, F4/Folio, Letter, Legal, A5, bisa diunduh sebagai .docx dan diimpor kembali dari .docx.',
  },
  {
    tab: 'Preset',
    judul: 'Katalog siap pakai',
    isi: 'Struktur panitia dan organisasi (pernikahan/walimah, organisasi santri, RT/RW, DKM), SOP acara, serta jadwal KBM 5 hari, 6 hari, halaqah tahfidz, dan harian pesantren. Sekali terapkan, lalu ubah sesuka hati.',
  },
  {
    tab: 'Kanvas Cetak',
    judul: 'Pratinjau presisi sebelum dicetak',
    isi: 'Lembar berdimensi kertas sebenarnya (A4, F4/Folio 215×330, Letter, Legal, A5, Thermal 80/58 mm) dengan garis batas aman, orientasi tegak/mendatar, dan penyesuaian lebar layar HP. Dokumen: bagan struktur, matriks KBM, dan tiket/slip tugas thermal per jabatan.',
  },
  {
    tab: 'Kanvas Cetak',
    judul: 'Matriks jadwal KBM',
    isi: 'Kisi hari × jam per kelas dengan sesi istirahat, warna sorotan, dan kop kustom. Jadwal bisa disimpan sebagai template kustom, diekspor/diimpor sebagai JSON, dan dicetak mendatar.',
  },
  {
    tab: 'Acara',
    judul: 'SOP acara menjadi tugas nyata',
    isi: `Template SOP berisi fase (H-30 sampai H+1), item tugas per divisi dari ${DIVISI_BAKU.length} divisi baku, dan rumus kuantitas; bisa diduplikasi, diversikan, diimpor dari .docx, diunduh .docx, atau disimpan ke Google Drive. "Buat Acara" mengubahnya menjadi papan tugas bertanggal dengan PIC per divisi, status BELUM → JALAN → SELESAI/BATAL, progres otomatis, dan laporan cetak.`,
  },
  {
    tab: 'Acara',
    judul: 'Tamu, porsi, dan evaluasi',
    isi: 'Kelompok tamu dengan RSVP berombongan, kalkulator porsi (RSVP + buffer + santri + panitia + cadangan) dan peralatan makan, ceklis perlengkapan per divisi, serta catatan evaluasi tiap divisi yang bisa dipromosikan menjadi item pada versi template berikutnya.',
  },
  {
    tab: 'e-Konfirmasi',
    judul: 'Undangan konfirmasi kehadiran',
    isi: 'Isian manual (judul, tanggal, waktu, tempat, tautan peta, WhatsApp) dan kategori acara dengan preset bidang; hasilnya dipratinjau lalu diunduh sebagai satu berkas HTML mandiri yang bisa dibagikan.',
  },
  {
    tab: 'Pengaturan',
    judul: 'Kop cetak, nilai baku, dan cadangan',
    isi: 'Nama lembaga untuk kop semua lembar cetak, nilai baku kalkulator porsi, client ID Google Drive, serta unduh/pulihkan seluruh data dalam satu berkas .json — satu-satunya jaring pengaman karena data hanya ada di perangkat ini.',
  },
];

const LANSKAP = [
  {
    nama: 'Aplikasi sejenis — penyusun dokumen SOP',
    fokus: 'Pembuatan dokumen SOP',
    catatan: 'Kuat menyusun dokumen, tetapi tidak terhubung dengan eksekusi acara di lapangan.',
  },
  {
    nama: 'Aplikasi sejenis — pengelola eksekusi acara',
    fokus: 'Eksekusi acara',
    catatan:
      'Kuat mengelola timeline dan delegasi, tetapi SOP-nya disusun manual dan desainnya berat untuk acara kecil–menengah.',
  },
];

export function TentangView() {
  return (
    <div className="space-y-6">
      <section className={KELAS.kartuIsi}>
        <h3 className={KELAS.judulKartu}>Tentang Tartib</h3>
        <p className="mt-2 text-sm leading-relaxed text-teks-sedang">
          Tartib menyusun <strong>struktur organisasi &amp; PIC</strong>, <strong>jadwal KBM</strong>, dan{' '}
          <strong>SOP acara</strong> — semuanya siap cetak. Alurnya: pilih preset atau buat dari kosong,
          sesuaikan, pratinjau di Kanvas Cetak yang mengikuti ukuran kertas sebenarnya, lalu cetak atau
          simpan sebagai PDF lewat dialog cetak sistem.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-teks-sedang">
          Berjalan sepenuhnya <strong>offline</strong>: tanpa akun, tanpa server, tanpa langganan.
          Seluruh data tersimpan di penyimpanan lokal peramban (IndexedDB) pada perangkat ini —
          karena itu cadangan berkala di bagian Data &amp; Cadangan bukan pelengkap, melainkan
          satu-satunya jaring pengaman. Tersedia sebagai aplikasi web dan APK Android.
        </p>
      </section>

      <section className={KELAS.kartuIsi}>
        <h3 className={KELAS.judulKartu}>Apa yang bisa dikerjakan hari ini</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {KEMAMPUAN.map((k) => (
            <div key={k.judul} className={KELAS.blok}>
              <p className="text-xs font-medium uppercase tracking-wide text-aksen-700">{k.tab}</p>
              <p className="mt-0.5 text-sm font-medium text-teks-kuat">{k.judul}</p>
              <p className="mt-1 text-sm leading-relaxed text-teks-sedang">{k.isi}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={KELAS.kartuIsi}>
        <h3 className={KELAS.judulKartu}>Posisi produk — riset lanskap 2026-08-22</h3>
        <p className={`mt-1 ${KELAS.keterangan}`}>
          Riset terhadap aplikasi sejenis (nama produk tidak disebutkan) menemukan satu celah
          besar: aplikasi pembuat SOP berhenti di dokumen, aplikasi eksekusi acara memulai dari
          nol — tidak ada yang menghubungkan keduanya untuk acara kecil–menengah, apalagi
          menyatukannya dengan bagan organisasi dan jadwal yang siap cetak.
        </p>
        <div className="mt-4 space-y-3">
          {LANSKAP.map((l) => (
            <div key={l.nama} className={KELAS.blok}>
              <p className="text-sm font-medium text-teks-kuat">{l.nama}</p>
              <p className="mt-0.5 text-xs font-medium uppercase tracking-wide text-aksen-700">{l.fokus}</p>
              <p className="mt-1 text-sm text-teks-sedang">{l.catatan}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm leading-relaxed text-teks-sedang">
          Tartib mengisi celah itu: template SOP yang sekali dibuat langsung menjadi mesin
          eksekusi, dan struktur, jadwal, serta laporannya keluar sebagai lembar cetak yang rapi —
          bukan dokumen yang dilupakan di rak.
        </p>
      </section>

      <section className={KELAS.kartuIsi}>
        <h3 className={KELAS.judulKartu}>Yang disengaja belum ada</h3>
        <p className="mt-1 text-sm leading-relaxed text-teks-sedang">
          Notifikasi push, sinkronisasi pesan instan, kolaborasi banyak perangkat secara real-time,
          dan integrasi ERP/QMS semuanya membutuhkan jaringan dan akun — bertentangan dengan
          prinsip offline penuh. Pengiriman data cetak langsung ke printer Bluetooth/USB (ESC/POS)
          juga belum ada: semua pencetakan lewat dialog cetak sistem, termasuk Simpan sebagai PDF.
          Semua tercatat sebagai visi jangka panjang, bukan janji fitur.
        </p>
      </section>

      <section className={KELAS.kartuIsi}>
        <h3 className={KELAS.judulKartu}>Kontak Developer</h3>
        <p className="mt-1 text-sm text-teks-sedang">
          Pengembangan &amp; dukungan aplikasi ini dikelola oleh:{' '}
          <span className="font-medium text-teks-kuat">achshoks@askarquran</span>
        </p>
        <p className="mt-2 text-sm text-teks-sedang">
          WhatsApp / telepon:{' '}
          <a href="tel:085212351117" className="font-medium text-aksen-700 hover:underline">
            085212351117
          </a>
        </p>
      </section>
    </div>
  );
}
