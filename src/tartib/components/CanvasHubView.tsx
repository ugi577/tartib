'use client';

// Kanvas Cetak (sesi 22) — membungkus dokumen ke dalam lembar fisik:
//   - Bagan Struktur & PIC (papan baku) — kop dari Pengaturan, bukan literal;
//   - Matriks Jadwal KBM (KbmMatriksView; toolbarnya di-portal ke slot
//     toolbar kanvas supaya tidak berada di dalam kertas);
//   - Tiket / slip tugas thermal per jabatan — data nyata dari papan baku,
//     bukan contoh fiktif.
// Aturan isi lembar: tanpa prefix responsif (sm:/md:) karena lembar mengikuti
// kertas, bukan viewport; `break-inside-avoid` pada unit dokumen; tanggal
// dihitung sekali (bukan new Date() tiap render).

import { useEffect, useMemo, useState } from 'react';
import { PrintReadyCanvas } from './PrintReadyCanvas';
import { KbmMatriksView } from './KbmMatriksView';
import { HeaderView, SubNav } from './HeaderView';
import * as sopSvc from '../services/sopService';
import { barisKop } from '../lib/pengaturan';
import { usePengaturan } from '../lib/usePengaturan';
import { formatTanggalIndonesia, tanggalHariIni } from '../lib/tanggal';
import type { Sop, SopItem, SopSubItem } from '../types';
import type { DokumenKanvas } from '../host/TartibHost';
import { KELAS } from '../ui/kelas';

const DAFTAR_DOKUMEN: ReadonlyArray<{ id: DokumenKanvas; label: string }> = [
  { id: 'struktur', label: 'Bagan Struktur' },
  { id: 'kbm', label: 'Matriks KBM' },
  { id: 'tiket', label: 'Tiket Thermal' },
];

const URUTAN_TIER = ['Pimpinan', 'Pengurus Inti', 'Divisi'] as const;
const LABEL_TIER: Record<string, string> = {
  Pimpinan: 'Pimpinan',
  'Pengurus Inti': 'Pengurus Inti',
  Divisi: 'Divisi & Seksi',
  Lainnya: 'Lainnya',
};

interface CanvasHubViewProps {
  dokumenAwal?: DokumenKanvas;
  /** Navigasi ke view lain (page.tsx meneruskan router) — bukan <a href> mentah. */
  onBuka?: (view: 'sop' | 'pengaturan') => void;
}

export function CanvasHubView({ dokumenAwal = 'struktur', onBuka }: CanvasHubViewProps) {
  const [dokumen, setDokumen] = useState<DokumenKanvas>(dokumenAwal);
  const [papanBaku, setPapanBaku] = useState<Sop | null>(null);
  const [items, setItems] = useState<SopItem[]>([]);
  const [subs, setSubs] = useState<SopSubItem[]>([]);
  const [memuat, setMemuat] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jabatanTiketId, setJabatanTiketId] = useState<string>('');
  const [tanggal] = useState(() => formatTanggalIndonesia(tanggalHariIni()));

  const pengaturan = usePengaturan();
  const kop = barisKop(pengaturan);

  useEffect(() => {
    setDokumen(dokumenAwal);
  }, [dokumenAwal]);

  useEffect(() => {
    let batal = false;
    void (async () => {
      try {
        const [sop] = await sopSvc.daftarSop({ baku: true });
        if (batal) return;
        if (sop) {
          setPapanBaku(sop);
          const [it, sub] = await Promise.all([sopSvc.daftarItemSop(sop.id), sopSvc.daftarSubItemSop(sop.id)]);
          if (batal) return;
          setItems(it);
          setSubs(sub);
          setJabatanTiketId((lama) => lama || it[0]?.id || '');
        }
        setError(null);
      } catch (e) {
        if (!batal) setError(e instanceof Error ? e.message : 'Struktur tidak dapat dimuat');
      } finally {
        if (!batal) setMemuat(false);
      }
    })();
    return () => {
      batal = true;
    };
  }, []);

  // Kelompok tier dengan urutan tetap; rutin di luar tier masuk "Lainnya"
  // (sama seperti bagan — dulu item semacam itu hilang dari cetakan).
  const tiers = useMemo(() => {
    const g = new Map<string, SopItem[]>();
    for (const it of items) {
      const t = (URUTAN_TIER as readonly string[]).includes(it.rutin ?? '') ? (it.rutin as string) : 'Lainnya';
      const d = g.get(t) ?? [];
      d.push(it);
      g.set(t, d);
    }
    return [...URUTAN_TIER, 'Lainnya'].filter((t) => (g.get(t)?.length ?? 0) > 0).map((t) => ({ tier: t, daftar: g.get(t)! }));
  }, [items]);

  const subByItem = useMemo(() => {
    const m = new Map<string, SopSubItem[]>();
    for (const s of subs) {
      const d = m.get(s.itemId) ?? [];
      d.push(s);
      m.set(s.itemId, d);
    }
    m.forEach((d) => d.sort((a, b) => a.urutan - b.urutan));
    return m;
  }, [subs]);

  const jabatanTiket = items.find((i) => i.id === jabatanTiketId) ?? null;

  const judulDokumen =
    dokumen === 'struktur'
      ? papanBaku?.judul ?? 'Struktur & PIC'
      : dokumen === 'kbm'
        ? 'Jadwal KBM'
        : `Slip tugas${jabatanTiket ? ` — ${jabatanTiket.judul}` : ''}`;

  return (
    <div className="space-y-4">
      <HeaderView
        judul="Kanvas Cetak"
        subNav={<SubNav daftar={DAFTAR_DOKUMEN} aktif={dokumen} onPilih={setDokumen} />}
      />

      {error && <p className={KELAS.error}>{error}</p>}

      {kop.length === 0 && dokumen !== 'kbm' && (
        <p className={`${KELAS.keteranganKecil} print:hidden`}>
          Kop lembaga belum diisi — isi di Pengaturan › Umum agar tercetak di atas dokumen.{' '}
          {onBuka && (
            <button type="button" onClick={() => onBuka('pengaturan')} className="font-medium text-aksen-700 hover:underline">
              Buka Pengaturan
            </button>
          )}
        </p>
      )}

      <PrintReadyCanvas
        key={dokumen}
        judulDokumen={judulDokumen}
        dokumen={dokumen}
        ukuranAwal={dokumen === 'tiket' ? 'thermal80' : undefined}
        orientasiAwal={dokumen === 'kbm' ? 'landscape' : undefined}
        pilihanKertas={dokumen === 'tiket' ? ['thermal80', 'thermal58'] : undefined}
        tombolKustom={
          dokumen === 'struktur' && onBuka ? (
            <button type="button" onClick={() => onBuka('sop')} className={KELAS.tombolSekunderKecil}>
              ✏️ Ubah struktur
            </button>
          ) : dokumen === 'tiket' && items.length > 0 ? (
            <>
              <label className="sr-only" htmlFor="tiket-jabatan">
                Jabatan untuk slip
              </label>
              <select
                id="tiket-jabatan"
                value={jabatanTiketId}
                onChange={(e) => setJabatanTiketId(e.target.value)}
                className={`${KELAS.inputKecil} max-w-[60vw]`}
              >
                {items.map((it) => (
                  <option key={it.id} value={it.id}>
                    {it.judul}
                    {it.picNama ? ` — ${it.picNama}` : ''}
                  </option>
                ))}
              </select>
            </>
          ) : null
        }
      >
        {dokumen === 'struktur' && (
          <div className="space-y-4 text-[11px] leading-snug">
            <div className="border-b-2 border-slate-900 pb-2 text-center">
              {kop[0] && <p className="text-sm font-bold uppercase tracking-wide">{kop[0]}</p>}
              {kop[1] && <p className="text-[11px] text-slate-600">{kop[1]}</p>}
              <h1 className={`${kop.length ? 'mt-1.5' : ''} text-lg font-bold uppercase tracking-tight`}>
                {papanBaku?.judul ?? 'Struktur & PIC'}
              </h1>
              {papanBaku?.catatan && <p className="text-[11px] text-slate-600">{papanBaku.catatan}</p>}
            </div>

            {memuat ? (
              <p className="py-8 text-center text-slate-400">Memuat data struktur…</p>
            ) : items.length === 0 ? (
              <p className="py-8 text-center text-slate-400">Belum ada jabatan di struktur — isi dulu di menu Struktur & PIC.</p>
            ) : (
              <div className="space-y-3">
                {tiers.map(({ tier, daftar }) => (
                  <div key={tier} className="space-y-1.5">
                    <div className="flex items-center gap-2 border-b border-slate-300 pb-1 break-after-avoid">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-800">{LABEL_TIER[tier] ?? tier}</span>
                      <span className="text-[10px] text-slate-500">({daftar.length} posisi)</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {daftar.map((it) => {
                        const daftarSub = subByItem.get(it.id) ?? [];
                        return (
                          <div key={it.id} className="break-inside-avoid rounded border border-slate-300 bg-slate-50 p-2 text-left">
                            <p className="text-xs font-bold text-slate-900">{it.judul}</p>
                            <p className="font-semibold text-slate-800">{it.picNama || '— belum ditentukan —'}</p>
                            {daftarSub.length > 0 && (
                              <ul className="mt-1 space-y-0.5 border-t border-slate-200 pt-1 text-[10px] text-slate-700">
                                {daftarSub.map((s) => (
                                  <li key={s.id} className="flex items-start gap-1">
                                    <span aria-hidden="true">▫</span>
                                    <span className="min-w-0 flex-1">
                                      {s.judul}
                                      {s.picNama ? <span className="text-slate-500"> · {s.picNama}</span> : null}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 flex items-end justify-between gap-4 break-inside-avoid text-[10px] text-slate-600">
              <span>Dicetak: {tanggal}</span>
              <div className="text-center">
                <p>Mengetahui,</p>
                <div className="mt-10 border-t border-slate-500 pt-0.5">( ……………………………… )</div>
              </div>
            </div>
          </div>
        )}

        {dokumen === 'kbm' && <KbmMatriksView />}

        {dokumen === 'tiket' && (
          <div className="space-y-2 font-mono text-[11px] leading-snug text-slate-900">
            <div className="border-b border-dashed border-slate-500 pb-1.5 text-center">
              {kop[0] && <p className="text-xs font-bold uppercase">{kop[0]}</p>}
              <p className="text-sm font-bold">SLIP TUGAS</p>
              <p className="text-[10px] text-slate-600">{tanggal}</p>
            </div>

            {jabatanTiket ? (
              <>
                <div className="space-y-0.5 border-b border-dashed border-slate-500 pb-1.5">
                  <div className="flex justify-between gap-2">
                    <span>Jabatan</span>
                    <span className="text-right font-bold">{jabatanTiket.judul}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span>PIC</span>
                    <span className="text-right">{jabatanTiket.picNama || '—'}</span>
                  </div>
                  {jabatanTiket.rutin && (
                    <div className="flex justify-between gap-2">
                      <span>Tingkat</span>
                      <span className="text-right">{jabatanTiket.rutin}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="font-bold">Daftar tugas:</p>
                  {(subByItem.get(jabatanTiket.id) ?? []).length === 0 ? (
                    <p className="text-slate-500">(belum ada rincian tugas)</p>
                  ) : (
                    (subByItem.get(jabatanTiket.id) ?? []).map((s) => (
                      <div key={s.id} className="flex items-start gap-1.5 break-inside-avoid">
                        <span>[{s.selesai ? 'x' : ' '}]</span>
                        <span className="min-w-0 flex-1">
                          {s.judul}
                          {s.picNama ? ` (${s.picNama})` : ''}
                        </span>
                      </div>
                    ))
                  )}
                </div>
                <div className="mt-2 border-t border-dashed border-slate-500 pt-1.5 text-center text-[10px] text-slate-600">
                  Beri tanda [x] bila selesai, lalu laporkan.
                </div>
              </>
            ) : (
              <p className="py-6 text-center text-slate-500">
                {memuat ? 'Memuat…' : 'Belum ada jabatan — isi struktur dulu di menu Struktur & PIC.'}
              </p>
            )}
          </div>
        )}
      </PrintReadyCanvas>
    </div>
  );
}
