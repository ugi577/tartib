'use client';

// Katalog Template Siap Pakai (Preset Library)
// Membantu pengguna memulai dari template instan:
// - Preset Struktur: Panitia Pernikahan, OSIS/Santri, RT/RW, Pengurus DKM
// - Preset SOP: Acara Resepsi, Rihlah/Wisata, Ujian Semester, Dauroh
// - Preset KBM: Jadwal 5 Hari, Jadwal 6 Hari, Roster Halaqah Tahfidz

import { useState } from 'react';
import {
  DAFTAR_PRESET_STRUKTUR,
  DAFTAR_PRESET_SOP,
  bacaSemuaKatalogKbm,
  terapkanPresetStruktur,
  simpanJadwalKbmLokal,
  type PresetStruktur,
  type PresetSop,
} from '../lib/presets';
import type { ModelJadwalKbm } from '../types/kbm';
import { KELAS } from '../ui/kelas';

type KategoriTab = 'semua' | 'struktur' | 'sop' | 'kbm';

interface PresetLibraryViewProps {
  onPilihPresetSelesai?: (viewTujuan: string) => void;
}

export function PresetLibraryView({ onPilihPresetSelesai }: PresetLibraryViewProps) {
  const [tab, setTab] = useState<KategoriTab>('semua');
  const [memuatId, setMemuatId] = useState<string | null>(null);
  const [notifikasi, setNotifikasi] = useState<string | null>(null);

  async function gunakanStruktur(p: PresetStruktur) {
    setMemuatId(p.id);
    try {
      await terapkanPresetStruktur(p);
      setNotifikasi(`Preset "${p.nama}" berhasil diterapkan ke Struktur PIC!`);
      if (onPilihPresetSelesai) {
        setTimeout(() => onPilihPresetSelesai('sop'), 600);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal menerapkan preset');
    } finally {
      setMemuatId(null);
    }
  }

  function gunakanKbm(p: ModelJadwalKbm) {
    setMemuatId(p.id);
    try {
      simpanJadwalKbmLokal(p);
      setNotifikasi(`Jadwal "${p.judul}" berhasil diterapkan ke Matriks KBM!`);
      if (onPilihPresetSelesai) {
        setTimeout(() => onPilihPresetSelesai('canvas'), 600);
      }
    } finally {
      setMemuatId(null);
    }
  }

  function gunakanSop(p: PresetSop) {
    setMemuatId(p.id);
    setNotifikasi(`Preset SOP "${p.nama}" siap digunakan di papan acara!`);
    if (onPilihPresetSelesai) {
      setTimeout(() => onPilihPresetSelesai('acara'), 600);
    }
    setMemuatId(null);
  }

  return (
    <div className="space-y-6">
      {/* Header Katalog */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emas-200/60 pb-4">
        <div>
          <h2 className={KELAS.judulHalaman}>Katalog Template Siap Pakai</h2>
          <p className="mt-1 text-sm text-slate-600">
            Pilih template instan agar tidak mulai dari kanvas kosong. Tersedia untuk struktur kepanitiaan, SOP acara, dan jadwal KBM.
          </p>
        </div>

        {/* Filter Kategori */}
        <div className="inline-flex rounded-xl border border-emas-300/60 bg-white/80 p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setTab('semua')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              tab === 'semua' ? 'bg-aksen-700 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Semua
          </button>
          <button
            type="button"
            onClick={() => setTab('struktur')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              tab === 'struktur' ? 'bg-aksen-700 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🏢 Struktur
          </button>
          <button
            type="button"
            onClick={() => setTab('sop')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              tab === 'sop' ? 'bg-aksen-700 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📋 SOP Acara
          </button>
          <button
            type="button"
            onClick={() => setTab('kbm')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              tab === 'kbm' ? 'bg-aksen-700 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📅 Jadwal KBM
          </button>
        </div>
      </div>

      {/* Banner Notifikasi */}
      {notifikasi && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-xs font-medium text-emerald-800">
          <span>✅ {notifikasi}</span>
          <button type="button" onClick={() => setNotifikasi(null)} className="text-emerald-600 hover:underline">
            Tutup
          </button>
        </div>
      )}

      {/* Grid Kartu Template */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Preset Struktur */}
        {(tab === 'semua' || tab === 'struktur') &&
          DAFTAR_PRESET_STRUKTUR.map((p) => (
            <div
              key={p.id}
              className="flex flex-col justify-between rounded-2xl border border-emas-300/40 bg-white/90 p-5 shadow-sm transition hover:border-emas-400 hover:shadow-md"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-xl shadow-inner">
                    {p.ikon}
                  </span>
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-semibold text-amber-800">
                    Struktur Organisasi
                  </span>
                </div>
                <h3 className="mt-3 font-bold text-slate-800">{p.nama}</h3>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">{p.deskripsi}</p>
                <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-400">
                  <span>👥 {p.items.length} Jabatan & Seksi</span>
                  <span>•</span>
                  <span>
                    📋{' '}
                    {p.items.reduce((acc, it) => acc + (it.sub?.length ?? 0), 0)} Sub-tugas terdaftar
                  </span>
                </div>
              </div>

              <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  disabled={memuatId === p.id}
                  onClick={() => void gunakanStruktur(p)}
                  className="flex-1 rounded-xl bg-aksen-700 py-2 text-center text-xs font-semibold text-white shadow-sm transition hover:bg-aksen-800 disabled:opacity-50"
                >
                  {memuatId === p.id ? 'Menerapkan…' : '⚡ Gunakan Template Ini'}
                </button>
              </div>
            </div>
          ))}

        {/* Preset SOP Acara */}
        {(tab === 'semua' || tab === 'sop') &&
          DAFTAR_PRESET_SOP.map((p) => (
            <div
              key={p.id}
              className="flex flex-col justify-between rounded-2xl border border-emas-300/40 bg-white/90 p-5 shadow-sm transition hover:border-emas-400 hover:shadow-md"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-xl shadow-inner">
                    {p.ikon}
                  </span>
                  <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-semibold text-blue-800">
                    SOP & Timeline
                  </span>
                </div>
                <h3 className="mt-3 font-bold text-slate-800">{p.nama}</h3>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">{p.deskripsi}</p>
                <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-400">
                  <span>⏱️ {p.items.length} Langkah SOP</span>
                  <span>•</span>
                  <span>🎯 Terbagi Multi-Fase</span>
                </div>
              </div>

              <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  disabled={memuatId === p.id}
                  onClick={() => gunakanSop(p)}
                  className="flex-1 rounded-xl bg-aksen-700 py-2 text-center text-xs font-semibold text-white shadow-sm transition hover:bg-aksen-800 disabled:opacity-50"
                >
                  {memuatId === p.id ? 'Menerapkan…' : '⚡ Gunakan Template Ini'}
                </button>
              </div>
            </div>
          ))}

        {/* Preset KBM */}
        {(tab === 'semua' || tab === 'kbm') &&
          bacaSemuaKatalogKbm().map((p) => {
            const isPesantren = p.id === 'kbm-pesantren-2026-2027';
            return (
              <div
                key={p.id}
                className={`flex flex-col justify-between rounded-2xl border p-5 shadow-sm transition hover:shadow-md ${
                  isPesantren
                    ? 'border-amber-400 bg-amber-50/40 ring-1 ring-amber-300'
                    : 'border-emas-300/40 bg-white/90 hover:border-emas-400'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-xl shadow-inner">
                      {p.kustom ? '⭐' : '📅'}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        isPesantren
                          ? 'bg-amber-200 text-amber-900 border border-amber-300'
                          : p.kustom
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {isPesantren
                        ? '★ Jadwal Pesantren 2026-2027'
                        : p.kustom
                        ? 'Template Kustom'
                        : 'Jadwal KBM'}
                    </span>
                  </div>
                  <h3 className="mt-3 font-bold text-slate-800">
                    {p.judul} {p.tahunAjaran ? `(${p.tahunAjaran})` : ''}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed">{p.deskripsi}</p>
                  <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-400">
                    <span>🗓️ {p.daftarHari.length} Hari Aktif</span>
                    <span>•</span>
                    <span>⏰ {p.daftarJam.length} Sesi Waktu</span>
                    <span>•</span>
                    <span>📖 {p.entri.length} Sesi Terjadwal</span>
                  </div>
                </div>

                <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    disabled={memuatId === p.id}
                    onClick={() => gunakanKbm(p)}
                    className="flex-1 rounded-xl bg-aksen-700 py-2 text-center text-xs font-semibold text-white shadow-sm transition hover:bg-aksen-800 disabled:opacity-50"
                  >
                    {memuatId === p.id ? 'Menerapkan…' : '⚡ Gunakan & Sesuaikan'}
                  </button>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
