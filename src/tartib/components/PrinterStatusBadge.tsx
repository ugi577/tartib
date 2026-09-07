'use client';

// Indikator Status Printer (USB/BT) Minimalis di Sudut Kanan Atas
// Memiliki modal pairing instan sekali klik untuk Web Bluetooth, WebUSB, Printer Sistem, dan Simulasi.

import { useEffect, useState } from 'react';
import {
  ambilPrinterAktif,
  hubungkanPrinterBluetooth,
  hubungkanPrinterSimulasi,
  hubungkanPrinterSistem,
  hubungkanPrinterUsb,
  periksaDukunganBluetooth,
  periksaDukunganUsb,
  putuskanPrinter,
  subscribePrinter,
  jalankanCetak,
} from '../lib/printer/webPrinterService';
import type { PerangkatPrinter } from '../types/kbm';
import { KELAS } from '../ui/kelas';

export function PrinterStatusBadge() {
  const [printer, setPrinter] = useState<PerangkatPrinter | null>(null);
  const [modalBuka, setModalBuka] = useState(false);
  const [memuat, setMemuat] = useState(false);
  const [pesanError, setPesanError] = useState<string | null>(null);
  const [pesanSukses, setPesanSukses] = useState<string | null>(null);

  useEffect(() => {
    return subscribePrinter((p) => {
      setPrinter(p);
    });
  }, []);

  async function sambungBt() {
    setMemuat(true);
    setPesanError(null);
    setPesanSukses(null);
    try {
      const dev = await hubungkanPrinterBluetooth();
      setPesanSukses(`Berhasil terhubung ke ${dev.nama}`);
    } catch (err) {
      setPesanError(err instanceof Error ? err.message : 'Gagal menghubungkan Bluetooth');
    } finally {
      setMemuat(false);
    }
  }

  async function sambungUsb() {
    setMemuat(true);
    setPesanError(null);
    setPesanSukses(null);
    try {
      const dev = await hubungkanPrinterUsb();
      setPesanSukses(`Berhasil terhubung ke ${dev.nama}`);
    } catch (err) {
      setPesanError(err instanceof Error ? err.message : 'Gagal menghubungkan USB');
    } finally {
      setMemuat(false);
    }
  }

  function sambungSistem() {
    setPesanError(null);
    const dev = hubungkanPrinterSistem('Printer Sistem Default');
    setPesanSukses(`Menggunakan ${dev.nama}`);
  }

  function sambungSimulasi(nama: string) {
    setPesanError(null);
    const dev = hubungkanPrinterSimulasi(nama);
    setPesanSukses(`Terhubung ke ${dev.nama}`);
  }

  function putuskan() {
    putuskanPrinter();
    setPesanSukses('Koneksi printer telah diputuskan');
  }

  async function ujiCetak() {
    setMemuat(true);
    setPesanSukses('Mengirim perintah cetak...');
    try {
      await jalankanCetak('Uji Cetak Tartib', 'tiket-amanah', printer?.lebarKertasBawaan || 'thermal', 'portrait');
      setPesanSukses('Uji cetak berhasil dikirim!');
    } catch (err) {
      setPesanError(err instanceof Error ? err.message : 'Gagal mengirim cetak');
    } finally {
      setMemuat(false);
    }
  }

  const adaBt = periksaDukunganBluetooth();
  const adaUsb = periksaDukunganUsb();

  return (
    <>
      {/* Badge Ringkas di Kanan Atas Header */}
      <button
        type="button"
        onClick={() => {
          setPesanError(null);
          setPesanSukses(null);
          setModalBuka(true);
        }}
        title={printer ? `Terhubung ke ${printer.nama}. Klik untuk atur.` : 'Printer belum konek. Klik untuk menghubungkan.'}
        className={`group flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium shadow-md backdrop-blur-xl transition-all duration-200 active:scale-95 ${
          printer
            ? 'border-emerald-300/60 bg-emerald-50/80 text-emerald-900 hover:bg-emerald-100/90'
            : 'border-white/60 bg-white/60 text-slate-700 hover:bg-white/80 hover:text-slate-900'
        }`}
      >
        {/* Ikon Printer */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-3.5 w-3.5"
        >
          <polyline points="6 9 6 2 18 2 18 9" />
          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
          <rect x="6" y="14" width="12" height="8" />
        </svg>

        {/* Status Dot */}
        <span
          className={`h-2 w-2 rounded-full ${
            printer ? 'animate-pulse bg-emerald-400 shadow-[0_0_8px_rgb(52,211,153)]' : 'bg-slate-400'
          }`}
        />

        {/* Teks Status */}
        <span className="max-w-[120px] truncate sm:max-w-[160px]">
          {printer ? printer.nama : 'Belum Konek'}
        </span>
      </button>

      {/* Modal Pairing Instan */}
      {modalBuka && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setModalBuka(false)}
          />

          <div className="relative w-full max-w-md rounded-2xl border border-emas-300/40 bg-white p-5 shadow-2xl transition-all sm:p-6">
            {/* Header Modal */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-aksen-100 text-aksen-700">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                    <polyline points="6 9 6 2 18 2 18 9" />
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                    <rect x="6" y="14" width="12" height="8" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">Koneksi Printer Cepat</h3>
                  <p className="text-xs text-slate-500">Hubungkan printer USB, Bluetooth, atau sistem</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalBuka(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {/* Status Aktif */}
            <div className="mt-4 rounded-xl border border-slate-200/80 bg-slate-50 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      printer ? 'bg-emerald-500 shadow-[0_0_8px_rgb(16,185,129)]' : 'bg-slate-400'
                    }`}
                  />
                  <div>
                    <p className="text-xs font-semibold text-slate-800">
                      {printer ? printer.nama : 'Tidak Ada Printer Terhubung'}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {printer
                        ? `Tipe: ${printer.tipe.toUpperCase()} • Kertas: ${printer.lebarKertasBawaan.toUpperCase()}`
                        : 'Pilih salah satu metode koneksi di bawah'}
                    </p>
                  </div>
                </div>
                {printer && (
                  <button
                    type="button"
                    onClick={putuskan}
                    className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-medium text-red-600 hover:bg-red-100"
                  >
                    Putus
                  </button>
                )}
              </div>

              {printer && (
                <div className="mt-3 flex gap-2 border-t border-slate-200/60 pt-2.5">
                  <button
                    type="button"
                    disabled={memuat}
                    onClick={() => void ujiCetak()}
                    className="flex-1 rounded-lg bg-aksen-700 py-1.5 text-center text-xs font-medium text-white transition hover:bg-aksen-800 disabled:opacity-50"
                  >
                    {memuat ? 'Mencetak…' : '🖨️ Uji Cetak Slip (Test Print)'}
                  </button>
                </div>
              )}
            </div>

            {/* Alert Error / Sukses */}
            {pesanError && (
              <div className="mt-3 rounded-lg bg-red-50 p-2.5 text-xs text-red-700">
                ⚠️ {pesanError}
              </div>
            )}
            {pesanSukses && (
              <div className="mt-3 rounded-lg bg-emerald-50 p-2.5 text-xs text-emerald-700">
                ✅ {pesanSukses}
              </div>
            )}

            {/* Pilihan Metode Pairing */}
            <div className="mt-4 space-y-2">
              <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                Pilih Perangkat / Metode
              </p>

              {/* Bluetooth Web API */}
              <button
                type="button"
                disabled={memuat}
                onClick={() => void sambungBt()}
                className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-aksen-400 hover:bg-aksen-50/50"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                    📶
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-slate-800">Printer Bluetooth (Web Bluetooth)</p>
                    <p className="text-[11px] text-slate-500">
                      {adaBt ? 'Printer thermal kasir / POS 58mm/80mm' : 'Perlu Chrome/Edge di Android/Windows'}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-aksen-700">Pindai →</span>
              </button>

              {/* WebUSB */}
              <button
                type="button"
                disabled={memuat}
                onClick={() => void sambungUsb()}
                className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-aksen-400 hover:bg-aksen-50/50"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                    🔌
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-slate-800">Printer USB Langsung (WebUSB)</p>
                    <p className="text-[11px] text-slate-500">
                      {adaUsb ? 'Kabel USB printer thermal / desktop' : 'Didukung peramban Chromium'}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-aksen-700">Pindai →</span>
              </button>

              {/* Printer Sistem */}
              <button
                type="button"
                onClick={sambungSistem}
                className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-aksen-400 hover:bg-aksen-50/50"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                    🖥️
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-slate-800">Printer Bawaan Sistem (Dialog Print)</p>
                    <p className="text-[11px] text-slate-500">Universal di semua browser & sistem operasi</p>
                  </div>
                </div>
                <span className="text-xs text-aksen-700">Pilih →</span>
              </button>

              {/* Simulasi Instan */}
              <div className="pt-1">
                <p className="mb-1 text-[10px] text-slate-400">Mode Simulasi (Uji coba tanpa printer fisik):</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => sambungSimulasi('POS-58 BT (Simulasi)')}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-center text-[11px] font-medium text-slate-700 hover:bg-slate-100"
                  >
                    POS-58 Thermal
                  </button>
                  <button
                    type="button"
                    onClick={() => sambungSimulasi('Epson L3110 USB (Simulasi)')}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-center text-[11px] font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Epson L3110 A4
                  </button>
                </div>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="mt-5 flex justify-end border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setModalBuka(false)}
                className={`px-4 py-1.5 text-xs ${KELAS.tombolSekunder}`}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
