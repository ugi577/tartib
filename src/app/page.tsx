'use client';

// Shell routing Tartib (Sesi 0 keputusan): routing via query param (?view=…)
// dan impor next/* hanya hidup di src/app — src/tartib bebas next/* (Gate A).
// useSearchParams dibungkus Suspense karena halaman diprerender statis.

import Link from 'next/link';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AcaraView } from '../tartib/components/AcaraView';
import { TemplateView } from '../tartib/components/TemplateView';

type View = 'beranda' | 'template' | 'acara';

function Konten() {
  const params = useSearchParams();
  const view = (params.get('view') as View | null) ?? 'beranda';
  const aktif = (v: View) => (view === v ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100');

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-800">Tartib — Pembuat SOP Acara</h1>
        <p className="mt-1 text-sm text-slate-500">
          Susun template SOP, buat acara dari template, dan kawal tugas panitia sampai hari-H.
        </p>
        <nav className="mt-4 flex gap-2">
          <Link href="/?view=beranda" className={`rounded-lg px-4 py-2 text-sm font-medium ${aktif('beranda')}`}>
            Beranda
          </Link>
          <Link href="/?view=template" className={`rounded-lg px-4 py-2 text-sm font-medium ${aktif('template')}`}>
            Template
          </Link>
          <Link href="/?view=acara" className={`rounded-lg px-4 py-2 text-sm font-medium ${aktif('acara')}`}>
            Acara
          </Link>
        </nav>
      </header>

      {view === 'template' && <TemplateView />}
      {view === 'acara' && <AcaraView />}
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
        </div>
      )}
    </main>
  );
}

export default function Halaman() {
  return (
    <Suspense fallback={<main className="flex min-h-screen items-center justify-center text-sm text-slate-500">Memuat…</main>}>
      <Konten />
    </Suspense>
  );
}
