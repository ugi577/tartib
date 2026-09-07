'use client';

// Tampilan Kanvas Cetak Utama (CanvasHubView) — 'Print-Ready Canvas'
// Membungkus dokumen aktif ke dalam lembar fisik cetak:
// - Bagan Struktur Organisasi & PIC Amanah
// - Matriks Jadwal KBM
// - Lembar Checklist SOP Acara
// - Tiket Amanah Ringkas (Khusus Thermal)

import { useState, useEffect } from 'react';
import { PrintReadyCanvas } from './PrintReadyCanvas';
import { KbmMatriksView } from './KbmMatriksView';
import { tartibDb } from '../db/schema';
import type { Sop, SopItem, SopSubItem } from '../types';
import type { UkuranKertas } from '../types/kbm';
import { KELAS } from '../ui/kelas';

type DokumenKanvas = 'struktur' | 'kbm' | 'thermal-tiket';

export function CanvasHubView() {
  const [dokumenPilihan, setDokumenPilihan] = useState<DokumenKanvas>('struktur');
  const [papanBaku, setPapanBaku] = useState<Sop | null>(null);
  const [itemsSop, setItemsSop] = useState<SopItem[]>([]);
  const [subsSop, setSubsSop] = useState<SopSubItem[]>([]);
  const [memuat, setMemuat] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const sop = await tartibDb.sop.filter((s) => s.baku).first();
        if (sop) {
          setPapanBaku(sop);
          const [it, sub] = await Promise.all([
            tartibDb.sopItem.where('sopId').equals(sop.id).sortBy('urutan'),
            tartibDb.sopSubItem.where('sopId').equals(sop.id).sortBy('urutan'),
          ]);
          setItemsSop(it);
          setSubsSop(sub);
        }
      } finally {
        setMemuat(false);
      }
    })();
  }, []);

  const ukuranKertasAwal: UkuranKertas = dokumenPilihan === 'thermal-tiket' ? 'thermal' : 'a4';
  const orientasiAwal = dokumenPilihan === 'kbm' ? 'landscape' : 'portrait';

  return (
    <div className="space-y-4">
      {/* Pemilih Dokumen yang Ditampilkan di Kanvas */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emas-200/60 pb-3 print:hidden">
        <div>
          <h2 className={KELAS.judulHalaman}>Print-Ready Canvas</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Pratinjau lembar cetak presisi (A4, F4/Folio, Thermal) dengan garis batas aman (*print safe-zone*).
          </p>
        </div>

        <div className="inline-flex rounded-xl border border-slate-200 bg-white/90 p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setDokumenPilihan('struktur')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              dokumenPilihan === 'struktur'
                ? 'bg-aksen-700 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🏢 Bagan Struktur
          </button>
          <button
            type="button"
            onClick={() => setDokumenPilihan('kbm')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              dokumenPilihan === 'kbm'
                ? 'bg-aksen-700 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📅 Matriks KBM
          </button>
          <button
            type="button"
            onClick={() => setDokumenPilihan('thermal-tiket')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              dokumenPilihan === 'thermal-tiket'
                ? 'bg-aksen-700 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🧾 Tiket Thermal
          </button>
        </div>
      </div>

      {/* Kanvas Cetak Presisi */}
      <PrintReadyCanvas
        key={dokumenPilihan}
        judulDokumen={
          dokumenPilihan === 'struktur'
            ? 'Struktur PIC Amanah'
            : dokumenPilihan === 'kbm'
            ? 'Jadwal Pelajaran KBM'
            : 'Tiket Amanah Ringkas'
        }
        jenisDokumen={dokumenPilihan === 'kbm' ? 'kbm' : dokumenPilihan === 'thermal-tiket' ? 'tiket-amanah' : 'struktur'}
        ukuranAwal={ukuranKertasAwal}
        orientasiAwal={orientasiAwal}
        tombolKustom={
          dokumenPilihan === 'struktur' ? (
            <a
              href="/?view=sop"
              title="Buka editor bagan untuk menambah, mengubah, atau menghapus jabatan & tugas"
              className="flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95"
            >
              <span>✏️ Ubah Struktur</span>
            </a>
          ) : null
        }
      >
        {/* 1. Tampilan Bagan Struktur Cetak */}
        {dokumenPilihan === 'struktur' && (
          <div className="space-y-4">
            <div className="border-b-2 border-slate-900 pb-2 text-center">
              <h1 className="text-lg font-bold tracking-tight text-slate-900 uppercase sm:text-xl">
                {papanBaku?.judul || 'STRUKTUR ORGANISASI SANTRI'}
              </h1>
              <p className="text-xs font-semibold text-aksen-800">
                PONDOK PESANTREN &amp; MADRASAH TARTIB
              </p>
              <p className="text-[10px] text-slate-500">
                Dokumen Resmi Penanggung Jawab Amanah &amp; Pembagian Tugas
              </p>
            </div>

            {memuat ? (
              <p className="py-8 text-center text-xs text-slate-400">Memuat data struktur…</p>
            ) : (
              <div className="space-y-3">
                {/* Kelompokkan berdasarkan tier (Pimpinan, Pengurus Inti, Divisi) */}
                {['Pimpinan', 'Pengurus Inti', 'Divisi'].map((tier) => {
                  const itemsTier = itemsSop.filter((i) => i.rutin === tier);
                  if (itemsTier.length === 0) return null;

                  return (
                    <div key={tier} className="space-y-2">
                      <div className="flex items-center gap-2 border-b border-slate-300 pb-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                          {tier === 'Pimpinan' ? '🕌 Tingkat Pimpinan' : tier === 'Pengurus Inti' ? '👑 Pengurus Inti' : '💼 Divisi & Seksi'}
                        </span>
                        <span className="text-[10px] text-slate-400">({itemsTier.length} Posisi)</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {itemsTier.map((it) => {
                          const subList = subsSop.filter((s) => s.itemId === it.id);
                          return (
                            <div
                              key={it.id}
                              className="rounded-lg border border-slate-300 bg-slate-50/50 p-2.5 text-left"
                            >
                              <p className="font-bold text-slate-900 text-xs">{it.judul}</p>
                              <p className="text-[11px] font-semibold text-aksen-800">
                                {it.picNama || '— Belum ditentukan —'}
                              </p>
                              {subList.length > 0 && (
                                <ul className="mt-1.5 space-y-0.5 border-t border-slate-200 pt-1 text-[10px] text-slate-600">
                                  {subList.map((s) => (
                                    <li key={s.id} className="flex items-start gap-1">
                                      <span>▫</span>
                                      <span className="truncate">{s.judul}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-6 flex items-center justify-between border-t border-slate-300 pt-2 text-[10px] text-slate-500">
              <span>Mengesahkan: Pimpinan Pondok</span>
              <span>Tanggal Terbit: {new Date().toLocaleDateString('id-ID')}</span>
            </div>
          </div>
        )}

        {/* 2. Tampilan Matriks KBM Cetak */}
        {dokumenPilihan === 'kbm' && <KbmMatriksView />}

        {/* 3. Tampilan Tiket Amanah Ringkas (Thermal Slip) */}
        {dokumenPilihan === 'thermal-tiket' && (
          <div className="space-y-2 text-slate-900">
            <div className="text-center">
              <h4 className="font-bold text-sm">SLIP TUGAS HARIAN</h4>
              <p className="text-[10px] text-slate-500">{new Date().toLocaleString('id-ID')}</p>
            </div>

            <div className="my-2 border-b border-dashed border-slate-400 pb-1 text-[11px]">
              <div className="flex justify-between">
                <span>Santri / PIC:</span>
                <span className="font-bold">Adrian Maulana</span>
              </div>
              <div className="flex justify-between">
                <span>Jabatan:</span>
                <span>Ketua Asrama</span>
              </div>
            </div>

            <div className="space-y-1.5 text-[11px]">
              <p className="font-bold">Daftar Ceklis Tugas:</p>
              <div className="flex items-center gap-1.5">
                <span className="font-mono">[ ]</span>
                <span>Cek Pompa Air &amp; Torrent Sungai</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono">[ ]</span>
                <span>Standby HP Kantor Pondok</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono">[ ]</span>
                <span>Kunci Gerbang Malam Pukul 22:00</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono">[ ]</span>
                <span>Membangunkan Shalat Tahajjud &amp; Subuh</span>
              </div>
            </div>

            <div className="mt-3 border-t border-dashed border-slate-400 pt-2 text-[10px] text-center">
              <p>Mohon diceklis &amp; dilaporkan kepada Musyrif seusai tugas selesai.</p>
            </div>
          </div>
        )}
      </PrintReadyCanvas>
    </div>
  );
}
