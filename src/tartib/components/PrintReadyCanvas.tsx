'use client';

// Kanvas Cetak — pratinjau lembar fisik yang benar-benar mengikuti kertas
// (sesi 22, keluhan Ahmed: "print preview yg tdk mengikuti ukuran kertas
// sebenarnya"). Yang diperbaiki dari versi sebelumnya:
//   - lembar berdimensi TETAP dalam mm (lebar × tinggi kertas, dari
//     lib/cetak/kertas.ts) dan padding = margin cetak, sehingga garis batas
//     cetak di pratinjau tepat di tepi area cetak;
//   - fit-to-width: lembar diskalakan dengan transform agar seluruh halaman
//     terlihat di HP (dulu lembar A4 dipipihkan flex-shrink jadi 309px, atau
//     terpotong); pembungkus diberi tinggi = tinggi lembar × skala karena
//     transform tidak mengubah kotak layout;
//   - tanpa transform saat skala 1 (elemen ber-transform menjadi containing
//     block bagi dialog/menu `position: fixed` di dalamnya);
//   - garis perkiraan batas halaman bila isi melebihi satu halaman;
//   - cetak lewat host.cetak({ jenis: 'kanvas', … }) yang menyuntik @page
//     sesuai kertas & orientasi (K-04) — bukan window.print() langsung;
//   - slot `#kanvas-toolbar-slot` di toolbar untuk kontrol milik dokumen
//     (mis. pemilih template KBM) agar tidak ikut berada di dalam kertas.

import { useState, type ReactNode } from 'react';
import {
  DAFTAR_KERTAS,
  apakahGulung,
  bacaPilihanKertas,
  dimensiKertas,
  labelDimensi,
  mmKePx,
  simpanPilihanKertas,
  simpananPerangkat,
  type IdKertas,
  type OrientasiKertas,
} from '../lib/cetak/kertas';
import { useUkuranElemen } from '../lib/useUkuranElemen';
import { standaloneHost } from '../host/standaloneHost';
import type { DokumenKanvas } from '../host/TartibHost';
import { KELAS } from '../ui/kelas';

export const ID_SLOT_TOOLBAR_KANVAS = 'kanvas-toolbar-slot';

interface PrintReadyCanvasProps {
  judulDokumen: string;
  dokumen: DokumenKanvas;
  /** Kertas awal; bila kosong dibaca dari preferensi perangkat. */
  ukuranAwal?: IdKertas;
  orientasiAwal?: OrientasiKertas;
  /** Batasi pilihan kertas (mis. tiket thermal saja). */
  pilihanKertas?: readonly IdKertas[];
  /** Kontrol tambahan milik dokumen (dirender di baris aksi toolbar). */
  tombolKustom?: ReactNode;
  children: ReactNode;
}

/** Padding meja kerja (px) — dikurangkan dari lebar wadah saat menghitung skala pas. */
const PADDING_MEJA_PX = 16;
const LANGKAH_ZOOM = 0.1;

export function PrintReadyCanvas({
  judulDokumen,
  dokumen,
  ukuranAwal,
  orientasiAwal,
  pilihanKertas,
  tombolKustom,
  children,
}: PrintReadyCanvasProps) {
  const daftarKertas = pilihanKertas
    ? DAFTAR_KERTAS.filter((k) => pilihanKertas.includes(k.id))
    : DAFTAR_KERTAS;

  const [kertas, setKertas] = useState<IdKertas>(() => {
    if (ukuranAwal) return ukuranAwal;
    const p = bacaPilihanKertas(simpananPerangkat());
    return daftarKertas.some((k) => k.id === p.id) ? p.id : daftarKertas[0].id;
  });
  const [orientasi, setOrientasi] = useState<OrientasiKertas>(() => {
    if (orientasiAwal) return orientasiAwal;
    return bacaPilihanKertas(simpananPerangkat()).orientasi;
  });
  const [tampilkanBatas, setTampilkanBatas] = useState(true);
  const [modeZoom, setModeZoom] = useState<'pas' | 'manual'>('pas');
  const [zoomManual, setZoomManual] = useState(1);
  const [sedangMencetak, setSedangMencetak] = useState(false);

  const [refMeja, ukuranMeja] = useUkuranElemen<HTMLDivElement>();
  const [refLembar, ukuranLembar] = useUkuranElemen<HTMLDivElement>();

  const gulung = apakahGulung(kertas);
  const dim = dimensiKertas(kertas, orientasi);
  const lebarLembarPx = mmKePx(dim.lebarMm);
  const tinggiHalamanPx = dim.tinggiMm === null ? null : mmKePx(dim.tinggiMm);

  const lebarTersedia = Math.max(0, ukuranMeja.lebar - PADDING_MEJA_PX * 2);
  const skalaPas = lebarTersedia > 0 ? Math.min(1, lebarTersedia / lebarLembarPx) : 1;
  const skala = modeZoom === 'pas' ? skalaPas : zoomManual;

  // Tinggi lembar nyata (isi bisa lebih panjang dari satu halaman).
  const tinggiLembarPx = ukuranLembar.tinggi > 0 ? ukuranLembar.tinggi : tinggiHalamanPx ?? mmKePx(120);
  const jumlahHalaman =
    tinggiHalamanPx && tinggiLembarPx > 0 ? Math.max(1, Math.ceil((tinggiLembarPx - 1) / tinggiHalamanPx)) : 1;

  function pilihKertas(id: IdKertas) {
    setKertas(id);
    // Preferensi perangkat hanya untuk kertas lembaran — pilihan thermal
    // milik dokumen tiket saja, jangan menular ke cetak papan/laporan.
    if (!apakahGulung(id)) simpanPilihanKertas(simpananPerangkat(), { id, orientasi });
  }

  function pilihOrientasi(o: OrientasiKertas) {
    setOrientasi(o);
    if (!gulung) simpanPilihanKertas(simpananPerangkat(), { id: kertas, orientasi: o });
  }

  function ubahZoom(arah: 1 | -1) {
    const dasar = modeZoom === 'pas' ? skalaPas : zoomManual;
    const baru = Math.min(2, Math.max(0.25, Math.round((dasar + arah * LANGKAH_ZOOM) * 100) / 100));
    setModeZoom('manual');
    setZoomManual(baru);
  }

  async function cetak() {
    setSedangMencetak(true);
    try {
      await standaloneHost.cetak({ jenis: 'kanvas', dokumen, judul: judulDokumen, kertas, orientasi });
    } finally {
      setSedangMencetak(false);
    }
  }

  const klasPil = (aktif: boolean) => (aktif ? KELAS.subNavPilAktif : KELAS.subNavPil);

  return (
    <div className="space-y-3">
      {/* ── Toolbar (dua baris di HP): kertas & tampilan · aksi dokumen ── */}
      <div className="space-y-2 print:hidden">
        <div className="flex flex-wrap items-center gap-1.5">
          <label className="sr-only" htmlFor="kanvas-kertas">
            Ukuran kertas
          </label>
          <select
            id="kanvas-kertas"
            value={kertas}
            onChange={(e) => pilihKertas(e.target.value as IdKertas)}
            className={`${KELAS.inputKecil} w-auto`}
          >
            {daftarKertas.map((k) => (
              <option key={k.id} value={k.id}>
                {k.label}
              </option>
            ))}
          </select>

          {!gulung && (
            <>
              <button
                type="button"
                onClick={() => pilihOrientasi('portrait')}
                aria-pressed={orientasi === 'portrait'}
                className={klasPil(orientasi === 'portrait')}
              >
                Tegak
              </button>
              <button
                type="button"
                onClick={() => pilihOrientasi('landscape')}
                aria-pressed={orientasi === 'landscape'}
                className={klasPil(orientasi === 'landscape')}
              >
                Mendatar
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => setTampilkanBatas((v) => !v)}
            aria-pressed={tampilkanBatas}
            title="Tampilkan garis batas area cetak (margin printer)"
            className={klasPil(tampilkanBatas)}
          >
            Batas cetak
          </button>

          <div className="ml-auto inline-flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => setModeZoom('pas')}
              aria-pressed={modeZoom === 'pas'}
              className={klasPil(modeZoom === 'pas')}
            >
              Pas lebar
            </button>
            <button type="button" onClick={() => ubahZoom(-1)} aria-label="Perkecil" className={KELAS.tombolIkon}>
              −
            </button>
            <span className="w-11 text-center font-mono text-xs text-teks-sedang">{Math.round(skala * 100)}%</span>
            <button type="button" onClick={() => ubahZoom(1)} aria-label="Perbesar" className={KELAS.tombolIkon}>
              +
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <div id={ID_SLOT_TOOLBAR_KANVAS} className="flex flex-wrap items-center gap-1.5" />
          {tombolKustom}
          <button
            type="button"
            disabled={sedangMencetak}
            onClick={() => void cetak()}
            className={`ml-auto ${KELAS.tombolUtamaKecil}`}
          >
            {sedangMencetak ? 'Menyiapkan…' : '🖨️ Cetak'}
          </button>
        </div>

        <p className={`truncate ${KELAS.keteranganKecil}`}>
          {labelDimensi(kertas, orientasi)} · margin {dim.marginMm} mm
          {jumlahHalaman > 1 ? ` · ±${jumlahHalaman} halaman` : ''}
          {' · untuk PDF pilih "Simpan sebagai PDF" di dialog cetak'}
        </p>
      </div>

      {/* ── Meja kerja & lembar ─────────────────────────────────────────── */}
      <div
        ref={refMeja}
        className="overflow-x-auto rounded-kartu border border-emas-300/40 bg-netral-300/30 shadow-inner"
        style={{ padding: PADDING_MEJA_PX }}
      >
        <div
          className="mx-auto"
          style={{ width: lebarLembarPx * skala, height: tinggiLembarPx * skala }}
        >
          <div
            ref={refLembar}
            id="print-ready-sheet"
            className="relative shrink-0 bg-white text-slate-900 shadow-[0_20px_50px_rgba(0,0,0,0.18),0_1px_3px_rgba(0,0,0,0.08)]"
            style={{
              width: `${dim.lebarMm}mm`,
              minHeight: dim.tinggiMm === null ? '80mm' : `${dim.tinggiMm}mm`,
              padding: `${dim.marginMm}mm`,
              transform: skala !== 1 ? `scale(${skala})` : undefined,
              transformOrigin: 'top left',
            }}
          >
            {tampilkanBatas && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute border border-dashed border-aksen-400/70 print:hidden"
                style={{ inset: `${dim.marginMm}mm` }}
              />
            )}

            {/* Perkiraan batas halaman berikutnya (hanya di layar). */}
            {tinggiHalamanPx !== null &&
              Array.from({ length: jumlahHalaman - 1 }, (_, i) => (
                <div
                  key={i}
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 border-t border-dashed border-red-400/70 print:hidden"
                  style={{ top: `${(i + 1) * (dim.tinggiMm ?? 0)}mm` }}
                >
                  <span className="absolute right-1 -top-4 rounded bg-white/90 px-1 text-[10px] text-red-500">
                    ± halaman {i + 2}
                  </span>
                </div>
              ))}

            <div className="relative">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
