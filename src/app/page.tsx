'use client';

// Shell routing Tartib: routing via query param (?view=…&dok=…).
// Nav bawah 5 tab: Beranda, Preset, Struktur & PIC, Kanvas Cetak, Pengaturan.
// Fitur lain (Template SOP acara, Acara, Tamu & Porsi, Evaluasi, e-Konfirmasi)
// dibuka dari kartu Beranda. Kontrol atas melayang: logo (ke beranda), Cari
// (⌘K), dan status printer.
//
// Sesi 22: nama menu disamakan di nav, kartu beranda, dan judul view (satu
// nama per tujuan); banner beranda dipangkas; kartu Template/Evaluasi/
// e-Konfirmasi dikembalikan (dulu hanya bisa lewat URL); navigasi antar view
// dari dalam src/tartib lewat prop onBuka (bukan <a href> mentah yang rusak di
// basePath GitHub Pages); ⌘K benar-benar membuka pencarian.

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { AcaraView } from '../tartib/components/AcaraView';
import { EvaluasiView } from '../tartib/components/EvaluasiView';
import { TemplateView } from '../tartib/components/TemplateView';
import { TamuView } from '../tartib/components/TamuView';
import { PengaturanView } from '../tartib/components/PengaturanView';
import { EKonfirmasiView } from '../tartib/components/EKonfirmasiView';
import { SopView } from '../tartib/components/SopView';
import { CanvasHubView } from '../tartib/components/CanvasHubView';
import { PresetLibraryView } from '../tartib/components/PresetLibraryView';
import { PrinterStatusBadge } from '../tartib/components/PrinterStatusBadge';
import { SearchModal } from '../tartib/components/SearchModal';
import { pasangUnduhanNative } from './unduhNative';
import { jalankanSeed } from '../tartib/db/seed';
import { KELAS } from '../tartib/ui/kelas';
import { LogoTartib } from '../tartib/components/LogoTartib';
import type { DokumenKanvas } from '../tartib/host/TartibHost';

type View =
  | 'beranda'
  | 'preset'
  | 'sop'
  | 'canvas'
  | 'pengaturan'
  | 'template'
  | 'acara'
  | 'tamu'
  | 'evaluasi'
  | 'tentang'
  | 'konfirmasi';

const SEMUA_VIEW: readonly View[] = [
  'beranda',
  'preset',
  'sop',
  'canvas',
  'pengaturan',
  'template',
  'acara',
  'tamu',
  'evaluasi',
  'tentang',
  'konfirmasi',
];

function apakahView(v: string | null): v is View {
  return v !== null && (SEMUA_VIEW as readonly string[]).includes(v);
}

function apakahDokumen(v: string | null): v is DokumenKanvas {
  return v === 'struktur' || v === 'kbm' || v === 'tiket';
}

/** Susun URL view (+ dokumen kanvas bila ada). Satu tempat, dipakai semua navigasi. */
function urlView(view: string, dok?: string): string {
  return dok ? `/?view=${view}&dok=${dok}` : `/?view=${view}`;
}

// ── Ikon SVG nav bawah ─────────────────────────────────────────────────────
const IKON = {
  beranda: (aktif: boolean) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={aktif ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={aktif ? 0 : 1.5} className="h-5 w-5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  ),
  preset: (aktif: boolean) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={aktif ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={aktif ? 0 : 1.5} className="h-5 w-5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  ),
  sop: (aktif: boolean) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={aktif ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={aktif ? 0 : 1.5} className="h-5 w-5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
    </svg>
  ),
  canvas: (aktif: boolean) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={aktif ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={aktif ? 0 : 1.5} className="h-5 w-5" aria-hidden="true">
      <polyline points="6 9 6 2 18 2 18 9" strokeWidth="1.5" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" strokeWidth="1.5" />
      <rect x="6" y="14" width="12" height="8" strokeWidth="1.5" />
    </svg>
  ),
  pengaturan: (aktif: boolean) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={aktif ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={aktif ? 0 : 1.5} className="h-5 w-5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
} as const;

// Satu nama per tujuan — dipakai di nav, kartu beranda, dan judul view.
const TAB_NAV: ReadonlyArray<{ view: View; label: string; ikon: keyof typeof IKON }> = [
  { view: 'beranda', label: 'Beranda', ikon: 'beranda' },
  { view: 'preset', label: 'Preset', ikon: 'preset' },
  { view: 'sop', label: 'Struktur', ikon: 'sop' },
  { view: 'canvas', label: 'Kanvas', ikon: 'canvas' },
  { view: 'pengaturan', label: 'Pengaturan', ikon: 'pengaturan' },
];

const PINTU_MASUK: ReadonlyArray<{ view: View; dok?: DokumenKanvas; judul: string; keterangan: string; ikon: string }> = [
  { view: 'sop', judul: 'Struktur & PIC', keterangan: 'Bagan organisasi, PIC, dan daftar tugas berceklis.', ikon: '👥' },
  { view: 'canvas', judul: 'Kanvas Cetak', keterangan: 'Pratinjau lembar A4, F4/Folio, Letter, Legal, A5, thermal.', ikon: '🖨️' },
  { view: 'canvas', dok: 'kbm', judul: 'Jadwal KBM', keterangan: 'Matriks jadwal harian/mingguan siap cetak.', ikon: '📅' },
  { view: 'preset', judul: 'Preset', keterangan: 'Template struktur, SOP acara, dan jadwal siap pakai.', ikon: '⚡' },
  { view: 'template', judul: 'Template SOP Acara', keterangan: 'Fase H-30 … H+1, item tugas per divisi, impor/ekspor .docx.', ikon: '📋' },
  { view: 'acara', judul: 'Acara', keterangan: 'Papan tugas dari template, PIC per divisi, lembar cetak.', ikon: '🗓️' },
  { view: 'tamu', judul: 'Tamu & Porsi', keterangan: 'Kelompok undangan, RSVP, kalkulator porsi & perlengkapan.', ikon: '🍽️' },
  { view: 'evaluasi', judul: 'Evaluasi', keterangan: 'Catatan per divisi seusai acara, promosikan ke template.', ikon: '📝' },
  { view: 'konfirmasi', judul: 'e-Konfirmasi Kehadiran', keterangan: 'Halaman konfirmasi HTML siap dibagikan ke undangan.', ikon: '✅' },
  { view: 'pengaturan', judul: 'Pengaturan', keterangan: 'Kop lembaga, Google Drive, cadangan & pemulihan data.', ikon: '⚙️' },
];

function useScrollDirection() {
  const [shrunk, setShrunk] = useState(false);
  const lastY = useRef(0);
  const ticking = useRef(false);

  const onScroll = useCallback(() => {
    if (ticking.current) return;
    ticking.current = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      const delta = y - lastY.current;
      if (delta > 12 && y > 60) setShrunk(true);
      else if (delta < -8 || y < 30) setShrunk(false);
      lastY.current = y;
      ticking.current = false;
    });
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [onScroll]);

  return shrunk;
}

function Konten() {
  const router = useRouter();
  const params = useSearchParams();
  const paramView = params.get('view');
  const view: View = apakahView(paramView) ? paramView : 'beranda';
  const paramDok = params.get('dok');
  const dokumenKanvas: DokumenKanvas = apakahDokumen(paramDok) ? paramDok : 'struktur';
  const viewTab: View = view === 'tentang' ? 'pengaturan' : view;
  const shrunk = useScrollDirection();
  const [modalCariBuka, setModalCariBuka] = useState(false);

  const buka = useCallback(
    (v: string, dok?: string) => {
      router.push(urlView(v, dok));
    },
    [router],
  );

  // ⌘K / Ctrl+K membuka (dan menutup) pencarian — dulu hanya menutup.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setModalCariBuka((b) => !b);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div className="min-h-screen">
      {/* Kontrol atas melayang: logo (beranda), Cari, status printer */}
      <div className="fixed inset-x-0 top-2 z-40 mx-auto flex max-w-4xl items-center justify-between px-3 pointer-events-none print:hidden sm:top-3 sm:px-4">
        <Link
          href="/?view=beranda"
          aria-label="Beranda Tartib"
          className="pointer-events-auto flex h-9 items-center gap-2 rounded-full border border-white/40 bg-white/60 px-2.5 shadow-md backdrop-blur-xl transition hover:bg-white/80 active:scale-95 sm:px-3"
        >
          <LogoTartib judul="Logo Tartib" className="h-5 w-5 drop-shadow-[0_2px_6px_rgb(197_168_123/0.3)]" />
          <span className="hidden text-xs font-bold tracking-tight text-slate-800 sm:inline">Tartib</span>
        </Link>

        <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => setModalCariBuka(true)}
            aria-label="Cari cepat"
            title="Cari cepat (⌘K / Ctrl+K)"
            className="flex h-9 min-w-9 items-center justify-center gap-1.5 rounded-full border border-white/40 bg-white/60 px-2.5 text-xs font-medium text-slate-700 shadow-md backdrop-blur-xl transition hover:bg-white/80 hover:text-slate-900 active:scale-95 sm:px-3"
          >
            <span aria-hidden="true">🔍</span>
            <span className="hidden sm:inline">Cari…</span>
            <kbd className="hidden rounded bg-slate-200/80 px-1 text-[10px] font-mono text-slate-600 sm:inline">⌘K</kbd>
          </button>

          <PrinterStatusBadge />
        </div>
      </div>

      {/* Konten view aktif — pt mengikuti tinggi kontrol melayang (≈46px), pb untuk nav bawah */}
      <main className="mx-auto max-w-4xl px-4 pt-14 pb-28 sm:pt-16">
        {view === 'beranda' && (
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-kartu border border-emas-300/50 bg-gradient-to-br from-white via-amber-50/40 to-emerald-50/30 p-4 shadow-kartu sm:p-6">
              <h2 className="text-lg font-bold tracking-tight text-slate-800 sm:text-xl">
                Dokumen siap cetak untuk pesantren &amp; panitia
              </h2>
              <p className="mt-1 text-xs text-slate-600 sm:text-sm">
                Struktur organisasi, jadwal KBM, dan SOP acara — tersimpan di perangkat ini, tanpa akun, tanpa server.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
              {PINTU_MASUK.map((p) => (
                <Link
                  key={`${p.view}-${p.dok ?? ''}`}
                  href={urlView(p.view, p.dok)}
                  className={`${KELAS.kartu} block p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-emas-400/80 hover:shadow-angkat sm:p-4`}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-base shadow-inner" aria-hidden="true">
                    {p.ikon}
                  </span>
                  <h3 className="mt-2 text-sm font-bold text-slate-800">{p.judul}</h3>
                  <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-teks-halus sm:text-xs">{p.keterangan}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {view === 'preset' && <PresetLibraryView onPilihPresetSelesai={buka} />}
        {view === 'sop' && <SopView onBuka={buka} />}
        {view === 'canvas' && <CanvasHubView dokumenAwal={dokumenKanvas} onBuka={buka} />}
        {view === 'acara' && <AcaraView />}
        {view === 'template' && <TemplateView />}
        {view === 'tamu' && <TamuView />}
        {view === 'evaluasi' && <EvaluasiView />}
        {(view === 'pengaturan' || view === 'tentang') && (
          <PengaturanView bagianAwal={view === 'tentang' ? 'tentang' : 'umum'} />
        )}
        {view === 'konfirmasi' && <EKonfirmasiView />}
      </main>

      {/* Nav bawah kapsul kaca */}
      <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center pb-[calc(0.5rem+env(safe-area-inset-bottom))] print:hidden pointer-events-none">
        <nav
          aria-label="Navigasi utama"
          className={`pointer-events-auto nav-capsule mx-4 mb-3 flex items-center gap-1 rounded-2xl border border-emerald-400/35 bg-aksen-900/85 px-2 py-1 shadow-[0_12px_36px_rgba(16,71,56,0.45),inset_0_1px_0_rgba(255,255,255,0.2)] backdrop-blur-2xl backdrop-saturate-150 sm:gap-2 sm:px-4 sm:py-1.5 ${
            shrunk ? 'shrunk' : ''
          }`}
        >
          {TAB_NAV.map((t) => {
            const aktif = viewTab === t.view;
            return (
              <Link
                key={t.view}
                href={urlView(t.view)}
                aria-current={aktif ? 'page' : undefined}
                aria-label={t.label}
                className={`relative flex min-h-11 min-w-11 flex-col items-center justify-center rounded-xl px-2 py-1 transition-all duration-200 active:scale-90 sm:flex-row sm:gap-1.5 sm:px-3 ${
                  aktif
                    ? 'bg-gradient-to-b from-emerald-500 to-aksen-600 text-white shadow-md ring-1 ring-inset ring-white/40 font-semibold'
                    : 'text-emerald-100/80 hover:bg-white/15 hover:text-white font-medium'
                }`}
              >
                {IKON[t.ikon](aktif)}
                <span
                  className={`mt-0.5 text-[10px] leading-none sm:mt-0 sm:text-xs ${
                    aktif ? 'font-bold text-white' : 'sr-only font-medium text-emerald-100/90 sm:not-sr-only'
                  }`}
                >
                  {t.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      <SearchModal
        terbuka={modalCariBuka}
        onTutup={() => setModalCariBuka(false)}
        onPilihHasil={buka}
      />
    </div>
  );
}

export default function Halaman() {
  useEffect(() => {
    void jalankanSeed();
    pasangUnduhanNative();
  }, []);

  return (
    <Suspense fallback={<main className="flex min-h-screen items-center justify-center text-sm text-teks-halus">Memuat…</main>}>
      <Konten />
    </Suspense>
  );
}
