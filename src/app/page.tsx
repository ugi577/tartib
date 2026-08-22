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
import { TentangView } from '../tartib/components/TentangView';
import { jalankanSeed } from '../tartib/db/seed';
import { KELAS } from '../tartib/ui/kelas';
import { LogoTartib } from '../tartib/components/LogoTartib';
import { BintangDelapan, PitaIslami } from '../tartib/components/OrnamenIslami';

type View = 'beranda' | 'template' | 'acara' | 'tamu' | 'evaluasi' | 'tentang';

// BUG-U2 (Batch U): sebelumnya enam <Link> ditulis satu per satu di dalam
// `flex` tanpa wrap — di lebar ponsel dua tab terakhir (Evaluasi, Tentang)
// keluar batas kontainer dan tidak terjangkau. Daftar tab dijadikan data agar
// satu kelas berlaku untuk semua dan tidak ada tab yang terlewat lagi.
const TAB: ReadonlyArray<{ view: View; label: string }> = [
  { view: 'beranda', label: 'Beranda' },
  { view: 'template', label: 'Template' },
  { view: 'acara', label: 'Acara' },
  { view: 'tamu', label: 'Tamu & Porsi' },
  { view: 'evaluasi', label: 'Evaluasi' },
  { view: 'tentang', label: 'Tentang' },
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
    view: 'tentang',
    judul: 'Tentang Tartib',
    keterangan: 'Posisi produk: dari dokumen SOP menjadi mesin eksekusi acara, dan apa yang sengaja tidak dikerjakan.',
  },
];

function Konten() {
  const params = useSearchParams();
  const view = (params.get('view') as View | null) ?? 'beranda';
  const aktif = (v: View) =>
    view === v
      ? 'bg-gradient-to-b from-aksen-500 to-aksen-600 text-white shadow-glowAksen ring-1 ring-inset ring-white/30'
      : 'bg-white/60 text-teks-sedang ring-1 ring-inset ring-white/70 backdrop-blur-sm hover:bg-white/80 hover:text-teks-utama';

  return (
    <div className="min-h-screen">
      {/* Bilah header (sesi 15, arahan Ahmed): ornamen islami bintang 8 di
          area identitas + pita pemisah, lalu baris tab TERPISAH di bawahnya
          dengan latar sendiri. Aturan mobile: keenam tab selalu terlihat
          penuh (grid 3×2 di layar sempit), tanpa overflow. */}
      <header className="sticky top-0 z-40 print:hidden">
        {/* Area identitas: logo + judul, latar glass gradasi + ornamen samar */}
        <div className="relative overflow-hidden border-b border-white/70 bg-gradient-to-r from-sky-100/90 via-white/90 to-emerald-100/90 shadow-[0_1px_2px_rgb(15_23_42/0.04),0_12px_32px_-16px_rgb(15_23_42/0.18)] backdrop-blur-xl">
          <BintangDelapan className="pointer-events-none absolute -right-3 -top-4 h-24 w-24 text-emerald-700/10" />
          <BintangDelapan className="pointer-events-none absolute -bottom-5 -left-4 h-20 w-20 text-emerald-700/10" />
          <BintangDelapan className="pointer-events-none absolute left-1/3 -top-3 h-12 w-12 text-emerald-700/[0.08]" />
          <div className="relative mx-auto flex max-w-3xl flex-wrap items-center gap-x-3 gap-y-2 px-4 pt-3">
            <LogoTartib
              judul="Logo Tartib"
              className="h-10 w-10 shrink-0 drop-shadow-[0_8px_16px_rgb(5_150_105/0.35)] sm:h-11 sm:w-11"
            />
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lg font-semibold text-teks-utama sm:text-xl">
                Tartib — Pembuat SOP Acara
              </h1>
              <p className="hidden truncate text-xs text-teks-halus sm:block sm:text-sm">
                Susun template SOP, buat acara dari template, dan kawal tugas panitia sampai H+1.
              </p>
            </div>
          </div>
          {/* Pita pemisah islami antara identitas dan baris tab */}
          <PitaIslami className="relative mt-2 pb-1.5 text-emerald-600/50" />
        </div>

        {/* Baris tab — area terpisah di bawah header */}
        <nav
          aria-label="Navigasi utama"
          className="border-t border-white/50 bg-white/75 shadow-[0_8px_20px_-12px_rgb(15_23_42/0.15)] backdrop-blur-md"
        >
          <div className="mx-auto grid max-w-3xl grid-cols-3 gap-1.5 px-4 py-2.5 sm:flex sm:flex-nowrap sm:justify-center sm:gap-2">
            {TAB.map((t) => (
              <Link
                key={t.view}
                href={`/?view=${t.view}`}
                aria-current={view === t.view ? 'page' : undefined}
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
      {view === 'tamu' && <TamuView />}
      {view === 'evaluasi' && <EvaluasiView />}
      {view === 'tentang' && <TentangView />}
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
    </div>
  );
}

export default function Halaman() {
  // Seed berjalan sekali di titik masuk aplikasi (idempotent — lihat
  // db/seed.ts). Sebelumnya tidak pernah dipanggil sama sekali sehingga
  // pnpm dev selalu mulai kosong; ini bug pra-Batch D, diperbaiki di sini.
  useEffect(() => {
    void jalankanSeed();
  }, []);

  return (
    <Suspense fallback={<main className="flex min-h-screen items-center justify-center text-sm text-teks-halus">Memuat…</main>}>
      <Konten />
    </Suspense>
  );
}
