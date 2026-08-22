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

function Konten() {
  const params = useSearchParams();
  const view = (params.get('view') as View | null) ?? 'beranda';
  const aktif = (v: View) => (view === v ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100');

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-8">
      <header className="mb-6 print:hidden">
        <h1 className="text-2xl font-semibold text-slate-800">Tartib — Pembuat SOP Acara</h1>
        <p className="mt-1 text-sm text-slate-500">
          Susun template SOP, buat acara dari template, dan kawal tugas panitia sampai hari-H.
        </p>
        <nav className="mt-4 flex flex-wrap gap-2">
          {TAB.map((t) => (
            <Link
              key={t.view}
              href={`/?view=${t.view}`}
              aria-current={view === t.view ? 'page' : undefined}
              className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium sm:px-4 ${aktif(t.view)}`}
            >
              {t.label}
            </Link>
          ))}
        </nav>
      </header>

      {view === 'template' && <TemplateView />}
      {view === 'acara' && <AcaraView />}
      {view === 'tamu' && <TamuView />}
      {view === 'evaluasi' && <EvaluasiView />}
      {view === 'tentang' && <TentangView />}
      {view === 'beranda' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/?view=template"
            className="rounded-xl border border-slate-200 bg-white p-6 hover:border-emerald-300"
          >
            <h3 className="font-semibold text-slate-800">Template SOP</h3>
            <p className="mt-1 text-sm text-slate-500">
              Kelola template acara: fase, item SOP, divisi PIC, rumus kuantitas, duplikat & versi baru.
            </p>
          </Link>
          <Link
            href="/?view=acara"
            className="rounded-xl border border-slate-200 bg-white p-6 hover:border-emerald-300"
          >
            <h3 className="font-semibold text-slate-800">Papan Acara</h3>
            <p className="mt-1 text-sm text-slate-500">
              Buat acara dari template, tetapkan PIC, dan pantau progres tugas per fase.
            </p>
          </Link>
          <Link
            href="/?view=tamu"
            className="rounded-xl border border-slate-200 bg-white p-6 hover:border-emerald-300"
          >
            <h3 className="font-semibold text-slate-800">Tamu & Porsi</h3>
            <p className="mt-1 text-sm text-slate-500">
              Kelompok tamu, RSVP berombongan, kalkulator porsi, dan ceklis perlengkapan.
            </p>
          </Link>
        </div>
      )}
    </main>
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
    <Suspense fallback={<main className="flex min-h-screen items-center justify-center text-sm text-slate-500">Memuat…</main>}>
      <Konten />
    </Suspense>
  );
}
