'use client';

// Shell routing Tartib (Sesi 0 keputusan): routing via query param (?view=…)
// dan impor next/* hanya hidup di src/app — src/tartib bebas next/* (Gate A).
// useSearchParams dibungkus Suspense karena halaman diprerender statis.

import Link from 'next/link';
import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { AcaraView } from '../tartib/components/AcaraView';
import { EvaluasiView } from '../tartib/components/EvaluasiView';
import { TemplateView } from '../tartib/components/TemplateView';
import { TamuView } from '../tartib/components/TamuView';
import { PengaturanView } from '../tartib/components/PengaturanView';
import { EKonfirmasiView } from '../tartib/components/EKonfirmasiView';
import { SopView } from '../tartib/components/SopView';
import { pasangUnduhanNative } from './unduhNative';
import { jalankanSeed } from '../tartib/db/seed';
import { KELAS } from '../tartib/ui/kelas';
import { LogoTartib } from '../tartib/components/LogoTartib';
import { BintangDelapan, PitaIslami } from '../tartib/components/OrnamenIslami';

// 'tentang' bukan lagi tab tersendiri (sesi 16) — tab "Tentang" dipindah
// menjadi bagian di dalam tab Pengaturan. Nilainya dipertahankan di tipe ini
// agar tautan lama `?view=tentang` tetap membuka isi yang sama.
// 'sop' (Batch X) = SOP berdiri sendiri: papan amanah semi-paten + SOP kustom.
type View = 'beranda' | 'template' | 'acara' | 'sop' | 'tamu' | 'evaluasi' | 'pengaturan' | 'tentang' | 'konfirmasi';

// BUG-U2 (Batch U): sebelumnya enam <Link> ditulis satu per satu di dalam
// `flex` tanpa wrap — di lebar ponsel dua tab terakhir (Evaluasi, Tentang)
// keluar batas kontainer dan tidak terjangkau. Daftar tab dijadikan data agar
// satu kelas berlaku untuk semua dan tidak ada tab yang terlewat lagi.
// Batch X menambah tab ketujuh (SOP) — nav dibuat selalu membungkus agar
// pelajaran BUG-U2 tidak kambuh di lebar mana pun.
const TAB: ReadonlyArray<{ view: View; label: string }> = [
  { view: 'beranda', label: 'Beranda' },
  { view: 'template', label: 'Template' },
  { view: 'acara', label: 'Acara' },
  { view: 'sop', label: 'SOP' },
  { view: 'tamu', label: 'Tamu & Porsi' },
  { view: 'evaluasi', label: 'Evaluasi' },
  { view: 'pengaturan', label: 'Pengaturan' },
];

// Kartu pintu masuk di beranda. Sebelum Batch U hanya ada tiga (Template,
// Acara, Tamu) — Evaluasi dan Tentang tidak punya pintu masuk sama sekali
// selain tab, jadi keduanya ditambahkan agar beranda mewakili seluruh alur.
const PINTU_MASUK: ReadonlyArray<{ view: View; judul: string; keterangan: string }> = [
  {
    view: 'template',
    judul: 'Template SOP',
    keterangan: 'Kelola template acara: fase, item SOP, divisi PIC, rumus kuantitas, duplikat & versi baru.',
  },
  {
    view: 'acara',
    judul: 'Papan Acara',
    keterangan: 'Buat acara dari template, tetapkan PIC, dan pantau progres tugas per fase.',
  },
  {
    view: 'sop',
    judul: 'SOP & Amanah',
    keterangan:
      'Amanah/khidmah santri dan SOP kustom berdiri sendiri — lengkap dengan PIC dan ceklis mudah, siap cetak.',
  },
  {
    view: 'tamu',
    judul: 'Tamu & Porsi',
    keterangan: 'Kelompok tamu, RSVP berombongan, kalkulator porsi, dan ceklis perlengkapan.',
  },
  {
    view: 'evaluasi',
    judul: 'Evaluasi',
    keterangan: 'Catat evaluasi tiap divisi seusai acara, lalu promosikan usulan jadi versi template baru.',
  },
  {
    view: 'pengaturan',
    judul: 'Pengaturan',
    keterangan: 'Kop cetak lembaga, nilai baku kalkulator porsi, Google Drive, cadangan data, dan tentang aplikasi.',
  },
  {
    view: 'konfirmasi',
    judul: 'Buat e-Konfirmasi Kehadiran',
    keterangan: 'Susun halaman konfirmasi kehadiran untuk acara Anda — bidang menyesuaikan kategori acara, unduh HTML siap dibagikan.',
  },
];

function Konten() {
  const params = useSearchParams();
  const view = (params.get('view') as View | null) ?? 'beranda';
  // Tab Pengaturan yang menampung bagian Tentang: tautan lama ?view=tentang
  // langsung membuka bagian itu, dan tab Pengaturan tetap tersorot.
  const viewTab: View = view === 'tentang' ? 'pengaturan' : view;
  const aktif = (v: View) =>
    viewTab === v
      ? 'bg-gradient-to-b from-aksen-500 to-aksen-600 text-white shadow-glowAksen ring-1 ring-inset ring-white/30'
      : 'bg-white/60 text-teks-sedang ring-1 ring-inset ring-white/70 backdrop-blur-sm hover:bg-white/80 hover:text-teks-utama';

  return (
    <div className="min-h-screen">
      {/* Bilah header (sesi 15–16, arahan Ahmed): ornamen islami bintang 8 di
          area identitas + pita pemisah, lalu baris tab TERPISAH di bawahnya
          dengan latar sendiri. Aturan mobile: keenam tab selalu terlihat
          penuh (grid 3×2 di layar sempit), tanpa overflow. Sesi 16 (referensi
          gambar Ahmed): gradasi biru→hijau lebih tegas, judul tebal, dan ikon
          dokumen-grafik di atas cahaya putih. */}
      <header className="sticky top-0 z-40 print:hidden">
        {/* Area identitas: logo + judul, latar glass gradasi + ornamen samar */}
        <div className="relative overflow-hidden border-b border-white/70 bg-gradient-to-r from-sky-200/95 via-sky-50/95 to-emerald-200/90 shadow-[0_1px_2px_rgb(15_23_42/0.04),0_12px_32px_-16px_rgb(15_23_42/0.18)] backdrop-blur-xl">
          <BintangDelapan className="pointer-events-none absolute -right-3 -top-4 h-24 w-24 text-emerald-700/10" />
          <BintangDelapan className="pointer-events-none absolute -bottom-5 -left-4 h-20 w-20 text-emerald-700/10" />
          <BintangDelapan className="pointer-events-none absolute left-1/3 -top-3 h-12 w-12 text-emerald-700/[0.08]" />
          <div className="relative mx-auto flex max-w-3xl flex-wrap items-center gap-x-3 gap-y-2 px-4 pt-3">
            {/* Cahaya putih di belakang ikon — sesuai referensi gambar. */}
            <span className="relative flex h-11 w-11 shrink-0 items-center justify-center sm:h-12 sm:w-12">
              <span
                aria-hidden="true"
                className="absolute inset-0 rounded-full bg-white/75 blur-[6px]"
              />
              <LogoTartib
                judul="Logo Tartib"
                className="relative h-9 w-9 drop-shadow-[0_6px_14px_rgb(2_132_199/0.28)] sm:h-10 sm:w-10"
              />
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lg font-bold tracking-tight text-teks-utama sm:text-2xl">
                Tartib — Pembuat SOP
              </h1>
              <p className="hidden truncate text-xs text-teks-sedang sm:block sm:text-sm">
                Susun template SOP, buat acara dari template, dan kawal tugas panitia sampai H+1.
              </p>
            </div>
          </div>
          {/* Pita pemisah islami antara identitas dan baris tab */}
          <PitaIslami className="relative mt-2 pb-1.5 text-emerald-600/50" />
        </div>

        {/* Baris tab — area terpisah di bawah header, memakai warna dasar
            header (gradasi sky→emerald) agar efek kaca pil tab lebih keliatan
            (arahan Ahmed sesi 16). */}
        <nav
          aria-label="Navigasi utama"
          className="border-t border-white/60 bg-gradient-to-r from-sky-100/80 via-white/65 to-emerald-100/80 shadow-[0_8px_20px_-12px_rgb(15_23_42/0.15)] backdrop-blur-xl"
        >
          {/* Batch X: kini tujuh tab — sm:flex-wrap (bukan nowrap) agar tidak
              ada tab yang keluar batas di lebar sm sempit (pelajaran BUG-U2). */}
          <div className="mx-auto grid max-w-3xl grid-cols-3 gap-1.5 px-4 py-2.5 sm:flex sm:flex-wrap sm:justify-center sm:gap-2">
            {TAB.map((t) => (
              <Link
                key={t.view}
                href={`/?view=${t.view}`}
                aria-current={viewTab === t.view ? 'page' : undefined}
                className={`whitespace-nowrap rounded-full px-2.5 py-1.5 text-center text-sm font-medium sm:px-3 ${aktif(t.view)}`}
              >
                {t.label}
              </Link>
            ))}
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-10 pt-6">
        {view === 'template' && <TemplateView />}
      {view === 'acara' && <AcaraView />}
      {view === 'sop' && <SopView />}
      {view === 'tamu' && <TamuView />}
      {view === 'evaluasi' && <EvaluasiView />}
      {(view === 'pengaturan' || view === 'tentang') && (
        <PengaturanView bagianAwal={view === 'tentang' ? 'tentang' : 'umum'} />
      )}
      {view === 'konfirmasi' && <EKonfirmasiView />}
      {view === 'beranda' && (
        <div className="grid gap-4 sm:grid-cols-2">
          {PINTU_MASUK.map((p) => (
            <Link
              key={p.view}
              href={`/?view=${p.view}`}
              className={`${KELAS.kartu} block p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-white hover:shadow-angkat`}
            >
              <h3 className={KELAS.judulKartu}>{p.judul}</h3>
              <p className="mt-1 text-sm text-teks-halus">{p.keterangan}</p>
            </Link>
          ))}
        </div>
      )}
      </main>
      {/* Watermark pengembang (sesi 16, arahan Ahmed): tampil di bawah
          seluruh halaman; tidak menghalangi sentuhan (pointer-events-none)
          dan tidak ikut tercetak. */}
      <footer className="pointer-events-none fixed inset-x-0 bottom-0 z-10 print:hidden">
        <p className="pb-1 text-center text-[11px] tracking-wide text-teks-redup/80">
          dev achshoks@askarquran
        </p>
      </footer>
    </div>
  );
}

export default function Halaman() {
  // Seed berjalan sekali di titik masuk aplikasi (idempotent — lihat
  // db/seed.ts). Sebelumnya tidak pernah dipanggil sama sekali sehingga
  // pnpm dev selalu mulai kosong; ini bug pra-Batch D, diperbaiki di sini.
  useEffect(() => {
    void jalankanSeed();
    // Unduhan native (Capacitor): Android WebView mengabaikan anchor
    // download — shell memasang handler Filesystem+Share (sesi 16).
    pasangUnduhanNative();
  }, []);

  return (
    <Suspense fallback={<main className="flex min-h-screen items-center justify-center text-sm text-teks-halus">Memuat…</main>}>
      <Konten />
    </Suspense>
  );
}
