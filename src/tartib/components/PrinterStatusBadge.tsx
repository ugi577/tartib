'use client';

// Indikator printer di kontrol atas + dialog "Printer" (sesi 22: jujur).
//
// Bawaan = Printer sistem (dialog cetak peramban/OS, termasuk "Simpan sebagai
// PDF") — satu-satunya jalur yang benar-benar mencetak. Bluetooth/USB hanya
// pairing, itu pun bila API-nya ada; di APK Android (WebView) tidak ada, jadi
// tombolnya dinonaktifkan dengan keterangan, bukan dibiarkan gagal diam-diam.
// Tidak ada lagi "Mode Simulasi", angka baterai, maupun "Uji Cetak" (yang
// dulu mencetak halaman apa pun yang sedang terbuka) — cetak nyata dilakukan
// dari Kanvas Cetak atau dokumen (Struktur & PIC, SOP).
//
// Dialog lewat AppDialog (portal & z-index seragam; dulu modal buatan sendiri
// terjebak di stacking context z-40 kontrol atas sehingga nav bawah z-50
// menutupinya). Badge kecil di HP: teks dipangkas ≤110px; area sentuh ≥40px
// lewat pseudo-elemen agar tinggi visual tetap sejajar tombol Cari di
// sebelahnya.

import { useEffect, useState } from 'react';
import { AppDialog } from './AppDialog';
import { ambilKertas } from '../lib/cetak/kertas';
import {
  CATATAN_PENGIRIMAN_BELUM_DIDUKUNG,
  apakahPairingSaja,
  hubungkanPrinterBluetooth,
  hubungkanPrinterSistem,
  hubungkanPrinterUsb,
  keteranganPrinter,
  periksaDukunganBluetooth,
  periksaDukunganUsb,
  putuskanPrinter,
  subscribePrinter,
} from '../lib/printer/webPrinterService';
import type { PerangkatPrinter } from '../types/kbm';
import { KELAS } from '../ui/kelas';

const KETERANGAN_TIDAK_TERSEDIA = 'Tidak tersedia di aplikasi Android — gunakan Printer Sistem';

function IkonPrinter({ className }: { className: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  );
}

interface PropsBarisPilihan {
  judul: string;
  keterangan: string;
  labelTombol: string;
  onPilih: () => void;
  nonaktif?: boolean;
  sibuk?: boolean;
}

/** Satu baris pilihan printer: teks di kiri, tombol KELAS di kanan. */
function BarisPilihan({ judul, keterangan, labelTombol, onPilih, nonaktif = false, sibuk = false }: PropsBarisPilihan) {
  return (
    <div className={`${KELAS.blok} flex items-center justify-between gap-3`}>
      <div className="min-w-0">
        <p className={`text-sm font-medium ${nonaktif ? 'text-teks-halus' : 'text-teks-kuat'}`}>{judul}</p>
        <p className={`mt-0.5 ${KELAS.keteranganKecil}`}>{keterangan}</p>
      </div>
      <button
        type="button"
        onClick={onPilih}
        disabled={nonaktif || sibuk}
        aria-disabled={nonaktif || undefined}
        className={`${KELAS.tombolSekunderKecil} min-h-10 shrink-0`}
      >
        {sibuk ? 'Memindai…' : labelTombol}
      </button>
    </div>
  );
}

export function PrinterStatusBadge() {
  const [printer, setPrinter] = useState<PerangkatPrinter | null>(null);
  const [dialogBuka, setDialogBuka] = useState(false);
  const [memuat, setMemuat] = useState(false);
  const [pesanError, setPesanError] = useState<string | null>(null);
  const [pesanInfo, setPesanInfo] = useState<string | null>(null);
  // Dukungan API & jenis penunjuk hanya diketahui di klien — dibaca setelah
  // mount supaya render server/hidrasi tidak berbeda.
  const [adaBt, setAdaBt] = useState(false);
  const [adaUsb, setAdaUsb] = useState(false);
  const [desktop, setDesktop] = useState(false);

  useEffect(() => subscribePrinter(setPrinter), []);

  useEffect(() => {
    setAdaBt(periksaDukunganBluetooth());
    setAdaUsb(periksaDukunganUsb());
    try {
      setDesktop(window.matchMedia('(hover: hover) and (pointer: fine)').matches);
    } catch {
      setDesktop(false);
    }
  }, []);

  function bukaDialog() {
    setPesanError(null);
    setPesanInfo(null);
    setDialogBuka(true);
  }

  async function jalankan(aksi: () => Promise<PerangkatPrinter>, gagal: string) {
    setMemuat(true);
    setPesanError(null);
    setPesanInfo(null);
    try {
      const dev = await aksi();
      setPesanInfo(
        apakahPairingSaja(dev)
          ? `${dev.nama} terpasang. ${CATATAN_PENGIRIMAN_BELUM_DIDUKUNG}`
          : `Menggunakan ${dev.nama}.`,
      );
    } catch (err) {
      setPesanError(err instanceof Error ? err.message : gagal);
    } finally {
      setMemuat(false);
    }
  }

  function pilihSistem() {
    setPesanError(null);
    const dev = hubungkanPrinterSistem();
    setPesanInfo(`Menggunakan ${dev.nama} — dialog cetak / Simpan sebagai PDF.`);
  }

  function lepas() {
    putuskanPrinter();
    setPesanError(null);
    setPesanInfo('Kembali ke Printer sistem.');
  }

  const namaBadge = printer ? printer.nama : 'Printer sistem';
  const terpasang = Boolean(printer && printer.tipe !== 'system');
  const kertasBawaan = printer ? ambilKertas(printer.lebarKertasBawaan).label : ambilKertas('a4').label;

  return (
    <>
      <button
        type="button"
        onClick={bukaDialog}
        aria-label={`Printer: ${namaBadge}. Buka pengaturan printer`}
        aria-haspopup="dialog"
        title={desktop ? `Printer: ${namaBadge}` : undefined}
        className={`relative flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium shadow-md backdrop-blur-xl transition-all duration-200 active:scale-95 before:absolute before:inset-x-0 before:-inset-y-1.5 before:content-[''] ${
          terpasang
            ? 'border-emerald-300/60 bg-emerald-50/80 text-emerald-900 hover:bg-emerald-100/90'
            : 'border-white/60 bg-white/60 text-slate-700 hover:bg-white/80 hover:text-slate-900'
        }`}
      >
        <IkonPrinter className="h-3.5 w-3.5" />
        <span
          aria-hidden="true"
          className={`h-2 w-2 rounded-full ${
            terpasang && printer?.terhubung ? 'bg-emerald-500' : terpasang ? 'bg-amber-400' : 'bg-slate-400'
          }`}
        />
        <span className="max-w-[110px] truncate sm:max-w-[160px]">{namaBadge}</span>
      </button>

      <AppDialog terbuka={dialogBuka} judul="Printer" onTutup={() => setDialogBuka(false)} lebar="md">
        {/* Status aktif */}
        <div className={KELAS.blok}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-2">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-aksen-100/70 text-aksen-700">
                <IkonPrinter className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-teks-kuat">
                  {printer ? printer.nama : 'Printer sistem'}
                  {!printer && <span className={`ml-2 ${KELAS.badgeNetral}`}>bawaan</span>}
                </p>
                <p className={`mt-0.5 ${KELAS.keteranganKecil}`}>
                  {printer ? keteranganPrinter(printer) : 'Dialog cetak / Simpan sebagai PDF'}
                </p>
                <p className={`mt-0.5 ${KELAS.keteranganKecil}`}>Kertas bawaan: {kertasBawaan}</p>
              </div>
            </div>
            {printer && (
              <button type="button" onClick={lepas} className={`${KELAS.tombolBahaya} min-h-10 shrink-0`}>
                Lepas
              </button>
            )}
          </div>
        </div>

        {pesanError && (
          <p role="alert" className={`mt-3 ${KELAS.error}`}>
            {pesanError}
          </p>
        )}
        {pesanInfo && (
          <p role="status" className="mt-3 rounded-kontrol bg-aksen-100/60 px-3 py-2 text-sm text-aksen-800 ring-1 ring-inset ring-aksen-200/70">
            {pesanInfo}
          </p>
        )}

        {/* Pilihan */}
        <p className="mb-2 mt-4 text-xs font-medium uppercase tracking-wide text-teks-halus">Pilih printer</p>
        <div className="space-y-2">
          <BarisPilihan
            judul="Printer sistem"
            keterangan="Dialog cetak peramban/OS, termasuk Simpan sebagai PDF. Bekerja di semua perangkat."
            labelTombol={printer?.tipe === 'system' ? 'Dipakai' : 'Pilih'}
            onPilih={pilihSistem}
            nonaktif={printer?.tipe === 'system'}
          />
          <BarisPilihan
            judul="Printer Bluetooth"
            keterangan={adaBt ? CATATAN_PENGIRIMAN_BELUM_DIDUKUNG : KETERANGAN_TIDAK_TERSEDIA}
            labelTombol="Pasangkan"
            onPilih={() => void jalankan(hubungkanPrinterBluetooth, 'Gagal memasangkan printer Bluetooth')}
            nonaktif={!adaBt}
            sibuk={memuat}
          />
          <BarisPilihan
            judul="Printer USB"
            keterangan={adaUsb ? CATATAN_PENGIRIMAN_BELUM_DIDUKUNG : KETERANGAN_TIDAK_TERSEDIA}
            labelTombol="Pasangkan"
            onPilih={() => void jalankan(hubungkanPrinterUsb, 'Gagal memasangkan printer USB')}
            nonaktif={!adaUsb}
            sibuk={memuat}
          />
        </div>

        <p className={`mt-4 ${KELAS.keterangan}`}>
          Mencetak dilakukan dari <strong>Kanvas Cetak</strong> atau dari dokumen (Struktur &amp; PIC, SOP acara):
          dialog cetak sistem akan terbuka dengan ukuran kertas yang dipilih di sana.
        </p>

        <div className="mt-5 flex justify-end">
          <button type="button" onClick={() => setDialogBuka(false)} className={KELAS.tombolSekunder}>
            Tutup
          </button>
        </div>
      </AppDialog>
    </>
  );
}
