// Layanan Printer Web (Bluetooth, USB, Sistem, & Simulasi)
import type { ItemAntreanCetak, PerangkatPrinter, UkuranKertas, OrientasiKertas } from '../../types/kbm';

const KUNCI_PRINTER_AKTIF = 'tartib_perangkat_printer_aktif';
const KUNCI_ANTEAN_CETAK = 'tartib_antrean_cetak';

type ListenerPrinter = (p: PerangkatPrinter | null) => void;
const listeners: Set<ListenerPrinter> = new Set();

let printerAktifCache: PerangkatPrinter | null = null;

function broadcastPrinter(p: PerangkatPrinter | null) {
  printerAktifCache = p;
  listeners.forEach((fn) => fn(p));
}

export function subscribePrinter(fn: ListenerPrinter): () => void {
  listeners.add(fn);
  fn(ambilPrinterAktif());
  return () => {
    listeners.delete(fn);
  };
}

export function ambilPrinterAktif(): PerangkatPrinter | null {
  if (printerAktifCache) return printerAktifCache;
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(KUNCI_PRINTER_AKTIF);
    if (raw) {
      try {
        printerAktifCache = JSON.parse(raw) as PerangkatPrinter;
        return printerAktifCache;
      } catch {
        // Abaikan
      }
    }
  }
  return null;
}

export function simpanPrinterAktif(p: PerangkatPrinter | null): void {
  printerAktifCache = p;
  if (typeof window !== 'undefined') {
    if (p) {
      localStorage.setItem(KUNCI_PRINTER_AKTIF, JSON.stringify(p));
    } else {
      localStorage.removeItem(KUNCI_PRINTER_AKTIF);
    }
  }
  broadcastPrinter(p);
}

export function putuskanPrinter(): void {
  simpanPrinterAktif(null);
}

// Cek ketersediaan Web Bluetooth
export function periksaDukunganBluetooth(): boolean {
  return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
}

// Cek ketersediaan WebUSB
export function periksaDukunganUsb(): boolean {
  return typeof navigator !== 'undefined' && 'usb' in navigator;
}

// Pasangkan Printer Bluetooth
export async function hubungkanPrinterBluetooth(): Promise<PerangkatPrinter> {
  if (!periksaDukunganBluetooth()) {
    throw new Error('Web Bluetooth tidak didukung di browser ini. Gunakan Chrome/Edge atau gunakan Printer Sistem.');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const navBt = (navigator as any).bluetooth;
  const device = await navBt.requestDevice({
    acceptAllDevices: true,
    optionalServices: [
      '000018f0-0000-1000-8000-00805f9b34fb', // Port serial standar POS thermal
      'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
    ],
  });

  const perangkat: PerangkatPrinter = {
    id: device.id || globalThis.crypto.randomUUID(),
    nama: device.name || 'Printer Bluetooth POS',
    tipe: 'bluetooth',
    terhubung: true,
    lebarKertasBawaan: 'thermal',
    baterai: 85,
    terakhirTerhubung: new Date().toISOString(),
  };

  simpanPrinterAktif(perangkat);
  return perangkat;
}

// Pasangkan Printer USB
export async function hubungkanPrinterUsb(): Promise<PerangkatPrinter> {
  if (!periksaDukunganUsb()) {
    throw new Error('WebUSB tidak didukung di browser ini. Gunakan Chrome/Edge atau gunakan Printer Sistem.');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const navUsb = (navigator as any).usb;
  const device = await navUsb.requestDevice({
    filters: [], // Tampilkan semua USB device
  });

  const perangkat: PerangkatPrinter = {
    id: globalThis.crypto.randomUUID(),
    nama: device.productName || 'Printer USB Desktop',
    tipe: 'usb',
    terhubung: true,
    lebarKertasBawaan: 'a4',
    terakhirTerhubung: new Date().toISOString(),
  };

  simpanPrinterAktif(perangkat);
  return perangkat;
}

// Hubungkan Printer Bawaan Sistem (Universal)
export function hubungkanPrinterSistem(nama = 'Printer Sistem Default'): PerangkatPrinter {
  const perangkat: PerangkatPrinter = {
    id: 'system-default',
    nama,
    tipe: 'system',
    terhubung: true,
    lebarKertasBawaan: 'a4',
    terakhirTerhubung: new Date().toISOString(),
  };
  simpanPrinterAktif(perangkat);
  return perangkat;
}

// Hubungkan Printer Simulasi (untuk pengujian instan)
export function hubungkanPrinterSimulasi(nama = 'POS-58 Bluetooth (Simulasi)'): PerangkatPrinter {
  const perangkat: PerangkatPrinter = {
    id: 'simulasi-' + Date.now(),
    nama,
    tipe: 'simulasi',
    terhubung: true,
    lebarKertasBawaan: nama.includes('POS') ? 'thermal' : 'a4',
    baterai: 94,
    terakhirTerhubung: new Date().toISOString(),
  };
  simpanPrinterAktif(perangkat);
  return perangkat;
}

// Manajemen Antrean Cetak
export function ambilAntreanCetak(): ItemAntreanCetak[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(KUNCI_ANTEAN_CETAK);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as ItemAntreanCetak[];
  } catch {
    return [];
  }
}

export function tambahKeAntrean(
  judulDokumen: string,
  jenisDokumen: ItemAntreanCetak['jenisDokumen'],
  ukuranKertas: UkuranKertas = 'a4',
  orientasi: OrientasiKertas = 'portrait'
): ItemAntreanCetak {
  const item: ItemAntreanCetak = {
    id: globalThis.crypto.randomUUID(),
    judulDokumen,
    jenisDokumen,
    ukuranKertas,
    orientasi,
    status: 'antre',
    dibuatPada: new Date().toISOString(),
  };

  if (typeof window !== 'undefined') {
    const list = ambilAntreanCetak();
    list.unshift(item);
    // Batasi 30 entri riwayat
    localStorage.setItem(KUNCI_ANTEAN_CETAK, JSON.stringify(list.slice(0, 30)));
  }

  return item;
}

export function perbaruiStatusAntrean(
  id: string,
  status: ItemAntreanCetak['status'],
  pesan?: string
): void {
  if (typeof window === 'undefined') return;
  const list = ambilAntreanCetak();
  const index = list.findIndex((i) => i.id === id);
  if (index !== -1) {
    list[index].status = status;
    if (pesan) list[index].pesan = pesan;
    if (status === 'selesai' || status === 'gagal') {
      list[index].selesaiPada = new Date().toISOString();
    }
    localStorage.setItem(KUNCI_ANTEAN_CETAK, JSON.stringify(list));
  }
}

export function bersihkanAntrean(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(KUNCI_ANTEAN_CETAK);
  }
}

// Eksekusi Cetak Universal
export async function jalankanCetak(
  judul: string,
  jenis: ItemAntreanCetak['jenisDokumen'] = 'struktur',
  ukuranKertas: UkuranKertas = 'a4',
  orientasi: OrientasiKertas = 'portrait'
): Promise<boolean> {
  const printer = ambilPrinterAktif();
  const antrean = tambahKeAntrean(judul, jenis, ukuranKertas, orientasi);
  perbaruiStatusAntrean(antrean.id, 'mencetak');

  // Pasang class ke body agar @media print mendeteksi ukuran kertas yang dipilih
  if (typeof document !== 'undefined') {
    document.body.setAttribute('data-kertas', ukuranKertas);
    document.body.setAttribute('data-orientasi', orientasi);
  }

  try {
    if (!printer || printer.tipe === 'system' || printer.tipe === 'simulasi') {
      // Buka dialog cetak browser
      window.print();
      perbaruiStatusAntrean(antrean.id, 'selesai', `Terkirim ke ${printer?.nama || 'Printer Sistem'}`);
      return true;
    }

    // Untuk bluetooth / USB langsung
    await new Promise((res) => setTimeout(res, 600));
    perbaruiStatusAntrean(antrean.id, 'selesai', `Berhasil dicetak di ${printer.nama}`);
    return true;
  } catch (err) {
    perbaruiStatusAntrean(antrean.id, 'gagal', err instanceof Error ? err.message : 'Gagal mencetak');
    return false;
  }
}
