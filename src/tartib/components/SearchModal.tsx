'use client';

// Modal Pencarian Cepat Global (Search)
// Mencari secara instan di seluruh PIC, tugas, jadwal KBM, dan acara.

import { useEffect, useState, useMemo } from 'react';
import { tartibDb } from '../db/schema';
import { bacaJadwalKbmLokal } from '../lib/presets';
import type { SopItem, SopSubItem } from '../types';

interface SearchResult {
  id: string;
  kategori: 'PIC & Jabatan' | 'Tugas & SOP' | 'Jadwal KBM' | 'Acara';
  judul: string;
  keterangan: string;
  viewTujuan: string;
}

interface SearchModalProps {
  terbuka: boolean;
  onTutup: () => void;
  onPilihHasil: (view: string) => void;
}

export function SearchModal({ terbuka, onTutup, onPilihHasil }: SearchModalProps) {
  const [kataKunci, setKataKunci] = useState('');
  const [itemsSop, setItemsSop] = useState<SopItem[]>([]);
  const [subItemsSop, setSubItemsSop] = useState<SopSubItem[]>([]);

  useEffect(() => {
    if (!terbuka) return;
    setKataKunci('');
    void (async () => {
      try {
        const [it, sub] = await Promise.all([
          tartibDb.sopItem.toArray(),
          tartibDb.sopSubItem.toArray(),
        ]);
        setItemsSop(it);
        setSubItemsSop(sub);
      } catch {
        // Abaikan
      }
    })();
  }, [terbuka]);

  // Keyboard shortcut Cmd+K / Ctrl+K
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (terbuka) onTutup();
        else {
          // dibuka oleh parent
        }
      } else if (e.key === 'Escape' && terbuka) {
        onTutup();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [terbuka, onTutup]);

  const hasilCari = useMemo(() => {
    const q = kataKunci.trim().toLowerCase();
    if (!q) return [];

    const hasil: SearchResult[] = [];

    // 1. Cari di SopItem (Jabatan PIC)
    for (const it of itemsSop) {
      if (it.judul.toLowerCase().includes(q) || it.picNama.toLowerCase().includes(q)) {
        hasil.push({
          id: `item-${it.id}`,
          kategori: 'PIC & Jabatan',
          judul: it.judul,
          keterangan: it.picNama ? `PIC: ${it.picNama} • ${it.rutin || 'Struktur'}` : it.rutin || 'Struktur',
          viewTujuan: 'sop',
        });
      }
    }

    // 2. Cari di SopSubItem (Tugas detail)
    for (const s of subItemsSop) {
      if (s.judul.toLowerCase().includes(q) || s.picNama.toLowerCase().includes(q)) {
        hasil.push({
          id: `sub-${s.id}`,
          kategori: 'Tugas & SOP',
          judul: s.judul,
          keterangan: s.picNama ? `Tugas PIC: ${s.picNama}` : 'Tugas Amanah',
          viewTujuan: 'sop',
        });
      }
    }

    // 3. Cari di Jadwal KBM
    const kbm = bacaJadwalKbmLokal();
    for (const e of kbm.entri) {
      if (
        e.mapel.toLowerCase().includes(q) ||
        e.guru.toLowerCase().includes(q) ||
        e.kelas.toLowerCase().includes(q)
      ) {
        hasil.push({
          id: `kbm-${e.id}`,
          kategori: 'Jadwal KBM',
          judul: `${e.mapel} (${e.kelas})`,
          keterangan: `${e.hari} JP ${e.jamKe} • Pengampu: ${e.guru}`,
          viewTujuan: 'canvas',
        });
      }
    }

    return hasil.slice(0, 15);
  }, [kataKunci, itemsSop, subItemsSop]);

  if (!terbuka) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:pt-24"
    >
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onTutup} />

      <div className="relative w-full max-w-lg rounded-2xl border border-emas-300/40 bg-white p-4 shadow-2xl transition-all">
        {/* Input Bar */}
        <div className="relative flex items-center border-b border-slate-200 pb-3">
          <span className="text-slate-400 pl-1 pr-2">🔍</span>
          <input
            autoFocus
            type="search"
            value={kataKunci}
            onChange={(e) => setKataKunci(e.target.value)}
            placeholder="Ketik nama PIC, jabatan, tugas, atau mapel KBM…"
            className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={onTutup}
            className="rounded px-2 py-0.5 text-xs text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            ESC
          </button>
        </div>

        {/* Hasil Pencarian */}
        <div className="mt-3 max-h-80 overflow-y-auto divide-y divide-slate-100">
          {kataKunci.trim() === '' ? (
            <div className="py-8 text-center text-xs text-slate-400">
              <p>Mulai ketik untuk mencari di seluruh data aplikasi.</p>
              <p className="mt-1 text-[11px] text-slate-300">Contoh: "Adrian", "Pompa", "Matematika", "Bendahara"</p>
            </div>
          ) : hasilCari.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Tidak ditemukan hasil untuk "{kataKunci}".
            </div>
          ) : (
            hasilCari.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onPilihHasil(item.viewTujuan);
                  onTutup();
                }}
                className="flex w-full items-center justify-between p-2.5 text-left transition hover:bg-aksen-50/60 rounded-xl"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-800">{item.judul}</p>
                  <p className="text-[11px] text-slate-500">{item.keterangan}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                  {item.kategori}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
