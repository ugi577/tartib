'use client';

// Bagian "Tentang" — sejak sesi 16 tampil DI DALAM tab Pengaturan (arahan
// Ahmed), bukan lagi tab tersendiri. Isinya dirapikan agar cocok dengan
// kemampuan yang benar-benar ada di aplikasi hari ini (Batch A–W + sesi 15–16):
// impor dokumen, ekspor .docx/Drive, cetak A4, dan cadangan data lokal.
// Konten statis — tidak ada akses data.

import { DIVISI_BAKU } from '../db/seed';
import { KELAS } from '../ui/kelas';

const KEMAMPUAN: ReadonlyArray<{ tab: string; judul: string; isi: string }> = [
  {
    tab: 'Template',
    judul: 'Menyusun SOP sekali, dipakai berulang',
    isi: `Template berisi fase (dengan offset hari, mis. H-30 sampai H+1), item tugas, divisi penanggung jawab dari ${DIVISI_BAKU.length} divisi baku, serta rumus kuantitas. Template bisa diduplikasi, diarsipkan, dan diterbitkan sebagai versi baru.`,
  },
  {
    tab: 'Template',
    judul: 'Impor dokumen SOP yang sudah ada',
    isi: 'Dokumen SOP berformat .docx dibaca langsung di perangkat: fase dan item dikenali dari heading, divisi ditebak dari kata kunci, hasilnya menjadi template biasa yang bisa diedit. Tidak ada berkas yang dikirim ke server.',
  },
  {
    tab: 'Template',
    judul: 'Ekspor & panduan cetak',
    isi: 'Template bisa diunduh sebagai .docx, disimpan ke Google Drive milik Anda sendiri, atau dicetak sebagai panduan pengisian manual di kertas A4.',
  },
  {
    tab: 'Acara',
    judul: 'SOP menjadi tugas nyata',
    isi: 'Satu klik "Buat Acara" menyalin template: tiap fase mendapat tanggal kalender sungguhan (tanggal acara digeser offset hari), tiap item menjadi tugas milik divisinya, dengan PIC yang wajib terisi.',
  },
  {
    tab: 'Acara',
    judul: 'Papan eksekusi & laporan cetak',
    isi: 'Status tugas berjalan BELUM → JALAN → SELESAI/BATAL dengan jejak waktu; progres per fase, per divisi, dan keseluruhan terhitung otomatis. Siap cetak A4: buku acara, laporan eksekusi, dan lembar tugas per divisi.',
  },
  {
    tab: 'Tamu & Porsi',
    judul: 'Undangan, porsi, dan perlengkapan',
    isi: 'Kelompok tamu dengan RSVP berombongan, kalkulator porsi (RSVP + buffer + santri + panitia + cadangan) dan kebutuhan peralatan makan, plus ceklis perlengkapan per divisi.',
  },
  {
    tab: 'Evaluasi',
    judul: 'Perbaikan masuk kembali ke template',
    isi: 'Catatan evaluasi tiap divisi seusai acara bisa dipromosikan menjadi item pada versi template berikutnya — SOP ikut membaik tiap kali acara selesai.',
  },
  {
    tab: 'Pengaturan',
    judul: 'Kop cetak, nilai baku, dan cadangan',
    isi: 'Nama lembaga untuk kop semua lembar A4, nilai baku kalkulator porsi, client ID Google Drive, serta unduh/pulihkan seluruh data dalam satu berkas .json.',
  },
];

const LANSKAP = [
  {
    nama: 'Aplikasi sejenis — penyusun dokumen SOP',
    fokus: 'Pembuatan dokumen SOP',
    catatan: 'Kuat menyusun dokumen (AI, suara, visual), tetapi tidak terhubung dengan eksekusi acara di lapangan.',
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
      <section className={`${KELAS.kartu} p-6`}>
        <h3 className={KELAS.judulKartu}>Tentang Tartib</h3>
        <p className="mt-2 text-sm leading-relaxed text-teks-sedang">
          Tartib adalah pembuat SOP acara yang menyatukan <strong>dokumen</strong> dan{' '}
          <strong>eksekusi</strong> dalam satu alur: susun template SOP, buat acara dari template,
          lalu kawal tugas panitia di papan eksekusi sampai H+1 dan cetak laporannya.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-teks-sedang">
          Berjalan sepenuhnya <strong>offline</strong>: tanpa akun, tanpa server, tanpa langganan.
          Seluruh data tersimpan di penyimpanan lokal peramban (IndexedDB) pada perangkat ini —
          karena itu cadangan berkala di bagian Data &amp; Cadangan bukan pelengkap, melainkan
          satu-satunya jaring pengaman. Aplikasi juga dirancang sebagai modul yang dapat disematkan
          ke aplikasi induk lewat satu titik sambungan (TartibHost).
        </p>
      </section>

      <section className={`${KELAS.kartu} p-6`}>
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

      <section className={`${KELAS.kartu} p-6`}>
        <h3 className={KELAS.judulKartu}>Posisi produk — riset lanskap 2026-08-22</h3>
        <p className={`mt-1 ${KELAS.keterangan}`}>
          Riset terhadap aplikasi sejenis (nama produk tidak disebutkan) menemukan satu celah
          besar: aplikasi pembuat SOP berhenti di dokumen, aplikasi eksekusi acara memulai dari
          nol — tidak ada yang menghubungkan keduanya untuk acara kecil–menengah.
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
          eksekusi — bukan dokumen yang dilupakan di rak.
        </p>
      </section>

      <section className={`${KELAS.kartu} p-6`}>
        <h3 className={KELAS.judulKartu}>Yang disengaja belum ada</h3>
        <p className="mt-1 text-sm leading-relaxed text-teks-sedang">
          Notifikasi push, sinkronisasi pesan instan, kolaborasi banyak perangkat secara real-time,
          dan integrasi ERP/QMS semuanya membutuhkan jaringan dan akun — bertentangan dengan
          prinsip offline penuh. Semua tercatat sebagai visi jangka panjang (backlog), bukan janji
          fitur. Langkah integrasi terdekat yang direncanakan adalah penyematan Tartib sebagai
          modul di aplikasi induk melalui TartibHost.
        </p>
      </section>

      <section className={`${KELAS.kartu} p-6`}>
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
