'use client';

// Isi LEMBAR kertas Matriks KBM (sesi 22): kop bergaya dokumen + tabel +
// legenda warna. Dirender inline sebagai anak PrintReadyCanvas, yaitu DI DALAM
// `#print-ready-sheet` yang berukuran kertas tetap dan diskalakan fit-to-width
// dengan transform. Konsekuensinya:
//   - tanpa prefix responsif sm:/md: — lembar mengikuti kertas, bukan viewport;
//   - tanpa kartu/gradasi/bayangan/rounded besar — ini dokumen, bukan panel;
//   - kontrol layar ('+ Isi', tombol ⋯ per sel, petunjuk klik) print:hidden,
//     legenda warna tetap tercetak;
//   - tiap <tr> break-inside-avoid agar baris tidak terpotong antarhalaman;
//   - teks isi sel minimal 11px, label sekunder 10px.
// Semua aksi (klik sel, menu) dilempar ke induk lewat props — komponen ini
// murni tampilan.

import type { EntriJadwal, HariKbm, ModelJadwalKbm } from '../../types/kbm';
import { labelHari } from '../../lib/kbm/hari';
import { ambilIkonMapel } from '../../lib/ikonKontekstual';
import { formatTanggalIndonesia } from '../../lib/tanggal';
import { KELAS } from '../../ui/kelas';

/** Palet warna sel — dipakai tabel (render) dan dialog entri (pilihan). */
export const PILIHAN_WARNA: ReadonlyArray<{ id: string; label: string; bg: string; border: string; teks: string }> = [
  { id: 'kuning', label: 'Emas / Sesi Utama', bg: 'bg-[#fef08a]', border: 'border-amber-400', teks: 'text-amber-950' },
  { id: 'hijau', label: 'Hijau (Shalat / Dzikir)', bg: 'bg-emerald-100', border: 'border-emerald-400', teks: 'text-emerald-950' },
  { id: 'biru', label: 'Biru (Taklim / Kajian)', bg: 'bg-sky-100', border: 'border-sky-400', teks: 'text-sky-950' },
  { id: 'oranye', label: 'Oranye (Khataman / Evaluasi)', bg: 'bg-orange-100', border: 'border-orange-400', teks: 'text-orange-950' },
  { id: 'abu', label: 'Abu (Tidur / Istirahat)', bg: 'bg-netral-100', border: 'border-netral-300', teks: 'text-netral-800' },
  { id: 'putih', label: 'Putih / Netral', bg: 'bg-white', border: 'border-netral-200', teks: 'text-netral-900' },
];

function kelasWarnaSel(warna: string | undefined): string {
  const w = PILIHAN_WARNA.find((p) => p.id === warna) ?? PILIHAN_WARNA[PILIHAN_WARNA.length - 1];
  return `${w.bg} ${w.border} ${w.teks}`;
}

/** ISO/tanggal → "8 September 2026"; null bila kosong/tak terbaca. */
function tanggalTampil(iso: string | undefined): string | null {
  if (!iso) return null;
  let ymd = iso;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  try {
    return formatTanggalIndonesia(ymd);
  } catch {
    return null;
  }
}

export interface PropsKbmLembar {
  jadwal: ModelJadwalKbm;
  /** Baris ketiga kop: "Kelas / Halaqah: …" atau "Jadwal khusus Musyrif: …". */
  keterangan: string;
  ambilEntri: (hari: HariKbm, jamKe: number) => EntriJadwal | undefined;
  /** Entri yang sedang "dipotong" di papan klip — selnya diberi tanda. */
  idEntriDipotong: string | null;
  onKlikSel: (hari: HariKbm, jamKe: number) => void;
  /** Buka menu sel: klik kanan (x/y viewport) atau tombol ⋯ (plus kotak tombol sebagai jangkar). */
  onMenuSel: (hari: HariKbm, jamKe: number, x: number, y: number, anchor?: DOMRect) => void;
}

export function KbmLembar({ jadwal, keterangan, ambilEntri, idEntriDipotong, onKlikSel, onMenuSel }: PropsKbmLembar) {
  // Legenda hanya untuk warna yang benar-benar dipakai di jadwal ini.
  const warnaTerpakai = new Set<string>();
  for (const e of jadwal.entri) if (e.warna) warnaTerpakai.add(e.warna);
  for (const j of jadwal.daftarJam) if (j.warna) warnaTerpakai.add(j.warna);
  const legenda = PILIHAN_WARNA.filter((w) => w.id !== 'putih' && warnaTerpakai.has(w.id));
  const tanggal = tanggalTampil(jadwal.diubahPada ?? jadwal.dibuatPada);

  return (
    <div className="space-y-3 font-sans text-black">
      {/* ── Kop dokumen ───────────────────────────────────────────────── */}
      <div className="text-center">
        <h2 className="text-xl font-bold uppercase leading-tight tracking-wide">
          {jadwal.judul || 'Jadwal Harian'}
        </h2>
        {jadwal.tahunAjaran && (
          <p className="mt-0.5 text-sm font-semibold uppercase tracking-wider text-netral-700">{jadwal.tahunAjaran}</p>
        )}
        <p className="mt-0.5 text-[11px] text-netral-600">
          {keterangan} • {jadwal.daftarJam.length} sesi waktu • {jadwal.daftarHari.length} hari
        </p>
      </div>

      {/* ── Tabel matriks ─────────────────────────────────────────────── */}
      <div className="border-2 border-black bg-white">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="break-inside-avoid border-b-2 border-black bg-aksen-100 text-center font-bold text-black">
              <th rowSpan={2} className="w-12 border-r-2 border-black px-2 py-2 text-[11px] tracking-wider">
                No
              </th>
              <th rowSpan={2} className="w-32 border-r-2 border-black px-2 py-2 text-[11px] tracking-wider">
                Waktu
              </th>
              <th colSpan={jadwal.daftarHari.length} className="border-b border-netral-400 px-4 py-2 text-sm uppercase tracking-wide">
                {jadwal.subJudul || 'Hari / Mata Pelajaran'}
              </th>
            </tr>
            <tr className="break-inside-avoid border-b-2 border-black bg-aksen-100 text-center font-bold text-black">
              {jadwal.daftarHari.map((hari) => (
                <th key={hari} className="border-r border-netral-500 px-3 py-2 text-[11px] tracking-wide">
                  {labelHari(hari)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {jadwal.daftarJam.map((jam) => {
              const adaNomor = jam.nomorSesi !== undefined && jam.nomorSesi !== null;
              return (
                <tr
                  key={jam.ke}
                  className={`break-inside-avoid border-b border-netral-300 ${jam.istirahat ? 'bg-amber-50/40' : ''}`}
                >
                  {/* No sesi resmi */}
                  <td className="border-r-2 border-black bg-netral-50 px-1 py-1 text-center font-bold">
                    {adaNomor ? (
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-amber-400 bg-[#fef08a] text-[11px] font-black text-amber-950">
                        {jam.nomorSesi}
                      </span>
                    ) : (
                      <span className="text-[10px] text-netral-400">-</span>
                    )}
                  </td>

                  {/* Waktu */}
                  <td className="border-r-2 border-black bg-netral-50 px-2 py-1.5 text-center font-mono">
                    <div className="text-[11px] font-bold leading-tight">{jam.label}</div>
                    <div className="mt-0.5 font-sans text-[10px] text-netral-500">
                      JP {jam.ke}
                      {jam.istirahat ? ' • Istirahat' : ''}
                    </div>
                  </td>

                  {/* Sel per hari */}
                  {jadwal.daftarHari.map((hari) => {
                    const entri = ambilEntri(hari, jam.ke);
                    const warna = entri?.warna || (adaNomor ? 'kuning' : undefined);
                    const dipotong = entri !== undefined && entri.id === idEntriDipotong;
                    return (
                      <td
                        key={hari}
                        onClick={() => onKlikSel(hari, jam.ke)}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          onMenuSel(hari, jam.ke, e.clientX, e.clientY);
                        }}
                        className="cursor-pointer border-r border-netral-300 p-1.5 align-top"
                      >
                        {entri ? (
                          <div
                            className={`relative min-h-[48px] rounded-md border p-1.5 pr-7 text-xs font-medium ${kelasWarnaSel(warna)} ${
                              dipotong ? 'border-dashed opacity-60' : ''
                            }`}
                          >
                            <p className="flex items-start gap-1 font-bold leading-snug">
                              <span className="mt-0.5 shrink-0 select-none opacity-80" aria-hidden="true">
                                {ambilIkonMapel(entri.mapel)}
                              </span>
                              <span className="min-w-0 flex-1 break-words">{entri.mapel}</span>
                            </p>
                            {entri.guru && <p className="mt-1 text-[11px] font-semibold opacity-90">👤 {entri.guru}</p>}
                            {entri.ruang && <p className="mt-0.5 text-[10px] opacity-75">📍 {entri.ruang}</p>}
                            {/* Tombol menu sel — pengganti klik kanan di HP (target sentuh 40px). */}
                            <button
                              type="button"
                              aria-label={`Menu sesi ${entri.mapel}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                const r = e.currentTarget.getBoundingClientRect();
                                onMenuSel(hari, jam.ke, r.left, r.bottom, r);
                              }}
                              className={`absolute -right-1 -top-1 ${KELAS.tombolIkon} text-base leading-none print:hidden`}
                            >
                              ⋯
                            </button>
                          </div>
                        ) : (
                          <div className="flex h-10 items-center justify-center rounded border border-dashed border-netral-200 text-[10px] text-netral-300 hover:border-aksen-300 hover:text-aksen-600 print:hidden">
                            + Isi
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Legenda & keterangan kaki ─────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-netral-300 pt-2 text-[11px] text-netral-600">
        <div className="flex flex-wrap items-center gap-3">
          {legenda.map((w) => (
            <span key={w.id} className="flex items-center gap-1">
              <span className={`inline-block h-3 w-3 rounded border ${w.bg} ${w.border}`} /> {w.label}
            </span>
          ))}
          <span className="print:hidden">• Klik sel untuk mengedit • Klik kanan atau tombol ⋯ untuk Salin / Tempel</span>
        </div>
        <div className="font-mono text-[10px]">
          Tartib Matriks KBM{tanggal ? ` • Terakhir disesuaikan: ${tanggal}` : ''}
        </div>
      </div>
    </div>
  );
}
