'use client';

// Pencarian cepat global (sesi 22) — dirender lewat AppDialog sehingga
// Escape, aria, portal, dan z-index seragam dengan dialog lain (listener
// ⌘K/Escape ganda yang dulu ada di sini dihapus; pembuka ⌘K ada di page.tsx).
//
// Sumber dibaca SEKALI saat dialog terbuka (bukan di useMemo tiap ketik):
// jabatan & tugas papan Struktur/SOP (tartibDb.sopItem/sopSubItem), acara
// (tartibDb.acara), template SOP (tartibDb.template), dan jadwal KBM aktif
// (bacaJadwalKbmLokal). Hasil KBM menuju Kanvas Cetak dengan penanda dokumen
// 'kbm' agar page.tsx bisa membuka `?view=canvas&dok=kbm`.

import { useEffect, useMemo, useRef, useState } from 'react';
import { AppDialog } from './AppDialog';
import { tartibDb } from '../db/schema';
import { bacaJadwalKbmLokal } from '../lib/presets';
import type { Acara, SopItem, SopSubItem, Template } from '../types';
import type { EntriJadwal } from '../types/kbm';
import { KELAS } from '../ui/kelas';

/** Dokumen Kanvas Cetak yang bisa dituju dari hasil pencarian. */
export type DokumenPencarian = 'struktur' | 'kbm' | 'tiket';

type ViewTujuan = 'sop' | 'canvas' | 'acara' | 'template';

interface HasilCari {
  id: string;
  kategori: 'PIC & Jabatan' | 'Tugas & SOP' | 'Jadwal KBM' | 'Acara' | 'Template SOP';
  judul: string;
  keterangan: string;
  viewTujuan: ViewTujuan;
  dokumen?: DokumenPencarian;
}

interface SearchModalProps {
  terbuka: boolean;
  onTutup: () => void;
  onPilihHasil: (view: string, dok?: DokumenPencarian) => void;
}

const BATAS_HASIL = 15;

const LABEL_STATUS_ACARA: Record<Acara['status'], string> = {
  DRAF: 'Draf',
  SIAP: 'Siap',
  BERJALAN: 'Berjalan',
  SELESAI: 'Selesai',
  DIEVALUASI: 'Dievaluasi',
};

function cocok(q: string, ...teks: Array<string | undefined>): boolean {
  return teks.some((t) => t !== undefined && t.toLowerCase().includes(q));
}

export function SearchModal({ terbuka, onTutup, onPilihHasil }: SearchModalProps) {
  const [kataKunci, setKataKunci] = useState('');
  const [itemsSop, setItemsSop] = useState<SopItem[]>([]);
  const [subItemsSop, setSubItemsSop] = useState<SopSubItem[]>([]);
  const [daftarAcara, setDaftarAcara] = useState<Acara[]>([]);
  const [daftarTemplate, setDaftarTemplate] = useState<Template[]>([]);
  const [entriKbm, setEntriKbm] = useState<EntriJadwal[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!terbuka) return;
    setKataKunci('');
    setEntriKbm(bacaJadwalKbmLokal().entri);
    let batal = false;
    void (async () => {
      try {
        const [it, sub, acara, template] = await Promise.all([
          tartibDb.sopItem.toArray(),
          tartibDb.sopSubItem.toArray(),
          tartibDb.acara.toArray(),
          tartibDb.template.toArray(),
        ]);
        if (batal) return;
        setItemsSop(it);
        setSubItemsSop(sub);
        setDaftarAcara(acara);
        setDaftarTemplate(template);
      } catch {
        // Basis data belum siap — pencarian tetap berjalan untuk sumber lain.
      }
    })();
    // autoFocus tidak andal di dalam portal; fokus setelah dialog terpasang.
    const t = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => {
      batal = true;
      window.clearTimeout(t);
    };
  }, [terbuka]);

  const hasilCari = useMemo<HasilCari[]>(() => {
    const q = kataKunci.trim().toLowerCase();
    if (!q) return [];
    const hasil: HasilCari[] = [];

    for (const it of itemsSop) {
      if (cocok(q, it.judul, it.picNama)) {
        hasil.push({
          id: `item-${it.id}`,
          kategori: 'PIC & Jabatan',
          judul: it.judul,
          keterangan: [it.picNama ? `PIC: ${it.picNama}` : null, it.rutin || 'Struktur'].filter(Boolean).join(' · '),
          viewTujuan: 'sop',
        });
      }
    }

    for (const s of subItemsSop) {
      if (cocok(q, s.judul, s.picNama)) {
        hasil.push({
          id: `sub-${s.id}`,
          kategori: 'Tugas & SOP',
          judul: s.judul,
          keterangan: s.picNama ? `Tugas PIC: ${s.picNama}` : 'Tugas',
          viewTujuan: 'sop',
        });
      }
    }

    for (const e of entriKbm) {
      if (cocok(q, e.mapel, e.guru, e.kelas)) {
        hasil.push({
          id: `kbm-${e.id}`,
          kategori: 'Jadwal KBM',
          judul: `${e.mapel} (${e.kelas || 'Semua'})`,
          keterangan: `${e.hari} · jam ke-${e.jamKe}${e.guru ? ` · ${e.guru}` : ''}`,
          viewTujuan: 'canvas',
          dokumen: 'kbm',
        });
      }
    }

    for (const a of daftarAcara) {
      if (cocok(q, a.nama, a.lokasi)) {
        hasil.push({
          id: `acara-${a.id}`,
          kategori: 'Acara',
          judul: a.nama,
          keterangan: [a.tanggal, a.lokasi, LABEL_STATUS_ACARA[a.status]].filter(Boolean).join(' · '),
          viewTujuan: 'acara',
        });
      }
    }

    for (const t of daftarTemplate) {
      if (cocok(q, t.nama, t.catatan)) {
        hasil.push({
          id: `template-${t.id}`,
          kategori: 'Template SOP',
          judul: t.nama,
          keterangan: `Versi ${t.versi} · ${t.aktif ? 'aktif' : 'diarsipkan'}`,
          viewTujuan: 'template',
        });
      }
    }

    return hasil.slice(0, BATAS_HASIL);
  }, [kataKunci, itemsSop, subItemsSop, entriKbm, daftarAcara, daftarTemplate]);

  function pilih(h: HasilCari) {
    onPilihHasil(h.viewTujuan, h.dokumen);
    onTutup();
  }

  const q = kataKunci.trim();

  return (
    <AppDialog terbuka={terbuka} judul="Cari cepat" onTutup={onTutup} lebar="lg">
      <div className="relative">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-teks-redup"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <label htmlFor="cari-cepat-input" className="sr-only">
          Kata kunci pencarian
        </label>
        <input
          ref={inputRef}
          id="cari-cepat-input"
          type="search"
          value={kataKunci}
          onChange={(e) => setKataKunci(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && hasilCari.length > 0) {
              e.preventDefault();
              pilih(hasilCari[0]);
            }
          }}
          placeholder="Cari PIC, jabatan, tugas, mapel, acara, template…"
          autoComplete="off"
          enterKeyHint="search"
          aria-controls="cari-cepat-hasil"
          className={`${KELAS.input} min-h-10 pl-9 ${q ? 'pr-11' : ''}`}
        />
        {q && (
          <button
            type="button"
            onClick={() => {
              setKataKunci('');
              inputRef.current?.focus();
            }}
            aria-label="Kosongkan pencarian"
            className={`${KELAS.tombolIkon} absolute right-1 top-1/2 h-10 w-10 -translate-y-1/2`}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="h-5 w-5">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        )}
      </div>

      <div id="cari-cepat-hasil" role="region" aria-live="polite" className="mt-3 max-h-[50dvh] overflow-y-auto">
        {q === '' ? (
          <div className={`py-6 text-center ${KELAS.keterangan}`}>
            <p>Ketik untuk mencari di seluruh data aplikasi.</p>
            <p className={`mt-1 ${KELAS.keteranganKecil}`}>
              Contoh: &quot;Bendahara&quot;, &quot;Tahfidz&quot;, &quot;Konsumsi&quot;
            </p>
          </div>
        ) : hasilCari.length === 0 ? (
          <p className={`py-6 text-center ${KELAS.keterangan}`}>Tidak ada hasil untuk &quot;{q}&quot;.</p>
        ) : (
          <ul className="divide-y divide-white/60">
            {hasilCari.map((h) => (
              <li key={h.id}>
                <button
                  type="button"
                  onClick={() => pilih(h)}
                  className="flex min-h-[44px] w-full items-center justify-between gap-3 rounded-kontrol px-2.5 py-2 text-left transition hover:bg-white/60"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-teks-kuat">{h.judul}</span>
                    <span className={`block truncate ${KELAS.keteranganKecil}`}>{h.keterangan}</span>
                  </span>
                  <span className={`${KELAS.badgeNetral} shrink-0`}>{h.kategori}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppDialog>
  );
}
