'use client';

// Halaman ?view=tentang (Batch T, K-13): posisi produk Tartib berdasarkan
// riset lanskap aplikasi SOP & manajemen acara (Ahmed, 2026-08-22).
// Konten statis — tidak ada akses data.

import { KELAS } from '../ui/kelas';

const LANSKAP = [
  {
    nama: 'AI SOP Genie, SOPmate, Quick SOP',
    fokus: 'Pembuatan dokumen SOP',
    catatan: 'Kuat menyusun dokumen (AI, suara, visual), tetapi tidak terhubung dengan eksekusi acara di lapangan.',
  },
  {
    nama: 'Coordon, ORGA',
    fokus: 'Eksekusi acara',
    catatan:
      'Kuat mengelola timeline dan delegasi, tetapi SOP-nya disusun manual dan desainnya berat untuk acara kecil–menengah.',
  },
];

const CARA_MENGISI_CELAH = [
  {
    judul: 'SOP menjadi alur kerja, otomatis',
    isi: 'Satu klik "Buat Acara" menyalin template menjadi tugas nyata: tiap fase mendapat tanggal kalender sungguhan (tanggal acara digeser offset hari), tiap item menjadi tugas milik divisinya, lengkap dengan PIC yang wajib terisi.',
  },
  {
    judul: 'Eksekusi real-time di papan acara',
    isi: 'Status tugas berjalan BELUM → JALAN → SELESAI/BATAL dengan jejak waktu penyelesaian; progres per fase, per divisi, dan keseluruhan terhitung otomatis; fase yang jatuh hari ini disorot.',
  },
  {
    judul: 'Laporan audit satu tombol',
    isi: 'Laporan Eksekusi siap cetak: identitas acara, tanggal tiap fase, status seluruh tugas beserta waktu selesai, dan PIC tiap divisi — jejak lengkap bahwa SOP benar-benar dijalankan.',
  },
  {
    judul: 'Ringan untuk acara kecil–menengah',
    isi: 'Tanpa akun, tanpa server, tanpa biaya langganan: seluruh data tersimpan lokal di perangkat (IndexedDB). Cukup untuk tasyakuran, khataman, hingga acara cabang — tanpa kerumitan alat acara besar.',
  },
];

export function TentangView() {
  return (
    <div className="space-y-6">
      <section className={`${KELAS.kartu} p-6`}>
        <h2 className={KELAS.judulHalaman}>Tentang Tartib</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Tartib adalah pembuat SOP acara yang menyatukan <strong>dokumen</strong> dan{' '}
          <strong>eksekusi</strong> dalam satu alur: susun template SOP (fase, item, divisi, rumus
          kuantitas), buat acara dari template, lalu kawal tugas panitia di papan eksekusi sampai
          hari-H dan cetak laporannya.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Berjalan sepenuhnya offline di perangkat Anda, dan dirancang sebagai modul yang dapat
          diintegrasikan ke aplikasi induk melalui satu titik sambungan (TartibHost).
        </p>
      </section>

      <section className={`${KELAS.kartu} p-6`}>
        <h3 className="font-semibold text-slate-800">Posisi produk — riset lanskap 2026-08-22</h3>
        <p className="mt-1 text-sm text-slate-500">
          Riset terhadap aplikasi SOP dan manajemen acara yang sudah ada menemukan satu celah besar:
          aplikasi pembuat SOP berhenti di dokumen, aplikasi eksekusi acara memulai dari nol — tidak
          ada yang menghubungkan keduanya untuk acara kecil–menengah.
        </p>
        <div className="mt-4 space-y-3">
          {LANSKAP.map((l) => (
            <div key={l.nama} className="rounded-lg bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-700">{l.nama}</p>
              <p className="mt-0.5 text-xs font-medium uppercase tracking-wide text-emerald-700">{l.fokus}</p>
              <p className="mt-1 text-sm text-slate-600">{l.catatan}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm leading-relaxed text-slate-600">
          Tartib mengisi celah itu: template SOP yang sekali dibuat langsung menjadi mesin
          eksekusi — bukan dokumen yang dilupakan di rak.
        </p>
      </section>

      <section className={`${KELAS.kartu} p-6`}>
        <h3 className="font-semibold text-slate-800">Bagaimana Tartib mengisi celah itu</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {CARA_MENGISI_CELAH.map((c) => (
            <div key={c.judul} className="rounded-lg border border-slate-100 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-700">{c.judul}</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">{c.isi}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={`${KELAS.kartu} p-6`}>
        <h3 className="font-semibold text-slate-800">Yang disengaja belum ada</h3>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">
          Notifikasi push, sinkronisasi Slack/WhatsApp, dan integrasi ERP/QMS membutuhkan jaringan —
          bertentangan dengan prinsip offline penuh Tartib. Semua tercatat sebagai visi jangka
          panjang (backlog), bukan janji fitur. Langkah integrasi terdekat yang direncanakan adalah
          penyematan Tartib sebagai modul di aplikasi induk melalui TartibHost.
        </p>
      </section>
    </div>
  );
}
