'use client';

// 'Print-Ready Canvas' di Layar Tengah
// Lembar kerja pratinjau dokumen dengan fidelitas tinggi sesuai dimensi fisik kertas:
// - Toggle ukuran kertas langsung: A4 (210×297mm), F4/Folio (215×330mm), Thermal (58mm/80mm roll).
// - Garis batas margin cetak halus (print safe-zone) 10mm (atau 3mm pada thermal).
// - Orientasi Portrait & Landscape.
// - Tombol eksekusi cetak langsung.

import React, { useState } from 'react';
import type { OrientasiKertas, UkuranKertas } from '../types/kbm';
import { jalankanCetak } from '../lib/printer/webPrinterService';

interface PrintReadyCanvasProps {
  judulDokumen?: string;
  subjudulDokumen?: string;
  jenisDokumen?: 'struktur' | 'sop' | 'kbm' | 'tiket-amanah';
  ukuranAwal?: UkuranKertas;
  orientasiAwal?: OrientasiKertas;
  tombolKustom?: React.ReactNode;
  children: React.ReactNode;
}

export function PrintReadyCanvas({
  judulDokumen = 'Dokumen Siap Cetak',
  subjudulDokumen = 'Pratinjau proporsional lembar fisik',
  jenisDokumen = 'struktur',
  ukuranAwal = 'a4',
  orientasiAwal = 'portrait',
  tombolKustom,
  children,
}: PrintReadyCanvasProps) {
  const [ukuran, setUkuran] = useState<UkuranKertas>(ukuranAwal);
  const [orientasi, setOrientasi] = useState<OrientasiKertas>(orientasiAwal);
  const [tampilkanSafeZone, setTampilkanSafeZone] = useState(true);
  const [sedangMencetak, setSedangMencetak] = useState(false);
  const [zoom, setZoom] = useState<number>(100);

  async function handleCetak() {
    setSedangMencetak(true);
    try {
      await jalankanCetak(judulDokumen, jenisDokumen, ukuran, orientasi);
    } finally {
      setSedangMencetak(false);
    }
  }

  // Dimensi CSS sesuai ukuran kertas
  function getGayaKertas(): { className: string; labelDimensi: string } {
    if (ukuran === 'thermal') {
      return {
        className: 'w-[80mm] max-w-full min-h-[140mm] font-mono p-[4mm] text-xs',
        labelDimensi: 'Thermal Roll 80mm',
      };
    }

    if (ukuran === 'f4') {
      return orientasi === 'portrait'
        ? { className: 'w-[215mm] min-h-[330mm] p-[12mm]', labelDimensi: 'F4 / Folio (215 × 330 mm)' }
        : { className: 'w-[330mm] min-h-[215mm] p-[12mm]', labelDimensi: 'F4 Landscape (330 × 215 mm)' };
    }

    // A4 bawaan
    return orientasi === 'portrait'
      ? { className: 'w-[210mm] min-h-[297mm] p-[12mm]', labelDimensi: 'A4 Portrait (210 × 297 mm)' }
      : { className: 'w-[297mm] min-h-[210mm] p-[12mm]', labelDimensi: 'A4 Landscape (297 × 210 mm)' };
  }

  const { className: kertasClass, labelDimensi } = getGayaKertas();

  return (
    <div className="space-y-4">
      {/* ── Toolbar Pengaturan Kertas di Atas Kanvas ────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emas-300/60 bg-white/90 p-3.5 shadow-sm backdrop-blur-md print:hidden sm:p-4">
        {/* Info & Pilihan Ukuran Kertas */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Kertas:</span>
          <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100/80 p-0.5 text-xs font-medium">
            <button
              type="button"
              onClick={() => setUkuran('a4')}
              className={`rounded-lg px-2.5 py-1 transition ${
                ukuran === 'a4' ? 'bg-white text-aksen-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              A4
            </button>
            <button
              type="button"
              onClick={() => setUkuran('f4')}
              className={`rounded-lg px-2.5 py-1 transition ${
                ukuran === 'f4' ? 'bg-white text-aksen-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              F4 / Folio
            </button>
            <button
              type="button"
              onClick={() => setUkuran('thermal')}
              className={`rounded-lg px-2.5 py-1 transition ${
                ukuran === 'thermal' ? 'bg-white text-aksen-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Thermal Roll
            </button>
          </div>

          {/* Toggle Orientasi (jika bukan thermal) */}
          {ukuran !== 'thermal' && (
            <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100/80 p-0.5 text-xs font-medium">
              <button
                type="button"
                onClick={() => setOrientasi('portrait')}
                title="Tegak (Portrait)"
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1 transition ${
                  orientasi === 'portrait' ? 'bg-white text-aksen-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>📄</span>
                <span className="hidden sm:inline">Portrait</span>
              </button>
              <button
                type="button"
                onClick={() => setOrientasi('landscape')}
                title="Mendatar (Landscape)"
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1 transition ${
                  orientasi === 'landscape' ? 'bg-white text-aksen-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="rotate-90">📄</span>
                <span className="hidden sm:inline">Landscape</span>
              </button>
            </div>
          )}

          {/* Toggle Safe-zone */}
          <button
            type="button"
            onClick={() => setTampilkanSafeZone(!tampilkanSafeZone)}
            title="Tampilkan garis batas aman margin printer"
            className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-medium transition ${
              tampilkanSafeZone
                ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'
            }`}
          >
            <span>📐</span>
            <span className="hidden sm:inline">Safe-Zone</span>
          </button>
        </div>

        {/* Tombol Aksi Tambahan & Tombol Cetak Utama */}
        <div className="flex items-center gap-2">
          {tombolKustom}

          <button
            type="button"
            disabled={sedangMencetak}
            onClick={() => void handleCetak()}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-aksen-700 to-aksen-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
          >
            <span>🖨️</span>
            <span>{sedangMencetak ? 'Memproses…' : 'Cetak Dokumen'}</span>
          </button>
        </div>
      </div>

      {/* ── Indikator Bar Dimensi Fisik Kertas ────────────────────────────── */}
      <div className="flex items-center justify-between px-1 text-[11px] text-slate-500 print:hidden">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700">{labelDimensi}</span>
          {tampilkanSafeZone && (
            <span className="inline-flex items-center gap-1 text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Garis putus-putus = Batas aman cetak (Margin {ukuran === 'thermal' ? '3mm' : '10mm'})
            </span>
          )}
        </div>

        {/* Kontrol Zoom Pratinjau */}
        <div className="hidden items-center gap-1.5 sm:flex">
          <button
            type="button"
            onClick={() => setZoom(Math.max(60, zoom - 10))}
            className="rounded px-1.5 py-0.5 text-slate-600 hover:bg-slate-200"
          >
            -
          </button>
          <span className="w-10 text-center font-mono">{zoom}%</span>
          <button
            type="button"
            onClick={() => setZoom(Math.min(150, zoom + 10))}
            className="rounded px-1.5 py-0.5 text-slate-600 hover:bg-slate-200"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => setZoom(100)}
            className="ml-1 text-[10px] text-aksen-700 hover:underline"
          >
            Reset
          </button>
        </div>
      </div>

      {/* ── Area Meja Kerja (Workbench) & Lembar Kertas Fisik ─────────────── */}
      <div className="overflow-x-auto rounded-2xl border border-slate-300/60 bg-slate-200/50 p-4 shadow-inner sm:p-8">
        <div className="flex justify-center">
          {/* Kontainer Lembar Kertas Putih */}
          <div
            id="print-ready-sheet"
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
            className={`relative mx-auto rounded-lg bg-white text-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.15),0_1px_3px_rgba(0,0,0,0.08)] transition-all ${kertasClass}`}
          >
            {/* Garis batas margin cetak halus (Print Safe-Zone) */}
            {tampilkanSafeZone && (
              <div
                aria-hidden="true"
                className={`pointer-events-none absolute inset-2.5 rounded border border-dashed border-emerald-400/60 print:hidden ${
                  ukuran === 'thermal' ? 'inset-1' : 'inset-3.5'
                }`}
              >
                <span className="absolute -top-2.5 left-3 bg-white px-1 font-mono text-[9px] font-semibold text-emerald-600">
                  SAFE MARGIN
                </span>
              </div>
            )}

            {/* Mode Thermal: Garis Sobek Tiket Kasir */}
            {ukuran === 'thermal' && (
              <div className="mb-3 border-b-2 border-dashed border-slate-300 pb-2 text-center">
                <p className="text-sm font-bold tracking-wider">TARTIB THERMAL</p>
                <p className="text-[10px] text-slate-500">{new Date().toLocaleDateString('id-ID')}</p>
              </div>
            )}

            {/* Konten Lembar Dokumen */}
            <div className="relative z-10">{children}</div>

            {/* Mode Thermal: Footer Slip */}
            {ukuran === 'thermal' && (
              <div className="mt-4 border-t-2 border-dashed border-slate-300 pt-2 text-center text-[9px] text-slate-400">
                <p>*** TANDA AMANAH SELESAI ***</p>
                <p>Simpan tanda ini untuk bukti serah terima</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
