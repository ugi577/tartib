// Layanan printer web — jujur & sederhana (sesi 22).
//
// Yang benar-benar bisa dilakukan aplikasi web / WebView Android hari ini:
//   - PRINTER SISTEM: dialog cetak peramban (host.cetak() → window.print()),
//     termasuk "Simpan sebagai PDF". Ini SATU-SATUNYA jalur yang benar-benar
//     mengirim dokumen ke printer.
//   - BLUETOOTH (Web Bluetooth) & USB (WebUSB): hanya PAIRING / pemilihan
//     perangkat, itu pun bila API-nya ada (Chrome/Edge desktop, Chrome
//     Android; TIDAK ada di WebView Android/APK maupun Safari). Pengiriman
//     data cetak (ESC/POS dsb.) BELUM didukung — dokumen tetap dicetak lewat
//     dialog sistem, dan itu dikatakan apa adanya kepada pengguna.
//
// Sebelum sesi 22 modul ini berpura-pura: Bluetooth/USB "berhasil dicetak"
// setelah setTimeout 600 ms tanpa mengirim satu byte pun, baterai 85%/94%
// fiktif, printer "Simulasi" bernama produk asli, atribut data-kertas
// ditempel ke body tanpa dicabut, dan window.print() dipanggil langsung
// (melanggar aturan cetak hanya lewat host.cetak()). Semua itu dihapus.
//
// Antrean cetak (localStorage) kini riwayat jujur: 'selesai' hanya bila
// dialog sistem ditutup setelah ambang waktu, 'dibatalkan' bila ditutup
// cepat, 'gagal' bila callback cetak melempar.

import type { ItemAntreanCetak, OrientasiKertas, PerangkatPrinter, UkuranKertas } from '../../types/kbm';

const KUNCI_PRINTER_AKTIF = 'tartib_perangkat_printer_aktif';
const KUNCI_ANTREAN_CETAK = 'tartib_antrean_cetak';
const BATAS_RIWAYAT_ANTREAN = 30;

/** afterprint yang datang lebih cepat dari ini = dialog ditutup tanpa mencetak. */
export const AMBANG_BATAL_MS = 700;
/** WebView yang tidak memancarkan afterprint: riwayat ditutup setelah tenggat ini. */
const TENGGAT_AFTERPRINT_MS = 30_000;

export const CATATAN_PENGIRIMAN_BELUM_DIDUKUNG =
  'Pairing saja; pengiriman data cetak belum didukung — dokumen dicetak lewat dialog sistem.';

// ── Tipe minimal Web Bluetooth / WebUSB (lib.dom belum menyediakannya) ──────

interface PerangkatBluetooth {
  id?: string;
  name?: string;
  gatt?: {
    connected: boolean;
    connect(): Promise<unknown>;
  };
}

interface PerangkatUsb {
  productName?: string;
  opened?: boolean;
  open(): Promise<void>;
}

interface NavigatorDenganPerangkat extends Navigator {
  bluetooth?: {
    requestDevice(opsi: { acceptAllDevices?: boolean; optionalServices?: string[] }): Promise<PerangkatBluetooth>;
  };
  usb?: {
    requestDevice(opsi: { filters: ReadonlyArray<{ vendorId?: number; productId?: number }> }): Promise<PerangkatUsb>;
  };
}

function ambilNavigator(): NavigatorDenganPerangkat | null {
  // Semua field tambahan opsional, jadi assertion ini hanya mempersempit ke subtipe bertipe.
  return typeof navigator !== 'undefined' ? (navigator as NavigatorDenganPerangkat) : null;
}

function idAcak(awalan: string): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  return `${awalan}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// ── Printer aktif (localStorage + langganan) ────────────────────────────────

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

function apakahPerangkatPrinter(v: unknown): v is PerangkatPrinter {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  return typeof o.id === 'string' && typeof o.nama === 'string' && typeof o.tipe === 'string';
}

export function ambilPrinterAktif(): PerangkatPrinter | null {
  if (printerAktifCache) return printerAktifCache;
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(KUNCI_PRINTER_AKTIF);
  if (!raw) return null;
  try {
    const p: unknown = JSON.parse(raw);
    // Printer "Simulasi" dari versi lama adalah perangkat fiktif — dibuang.
    if (!apakahPerangkatPrinter(p) || p.tipe === 'simulasi') {
      localStorage.removeItem(KUNCI_PRINTER_AKTIF);
      return null;
    }
    // Angka baterai lama fiktif — tidak dibawa serta.
    const bersih: PerangkatPrinter = { ...p };
    delete bersih.baterai;
    printerAktifCache = bersih;
    return printerAktifCache;
  } catch {
    localStorage.removeItem(KUNCI_PRINTER_AKTIF);
    return null;
  }
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

// ── Dukungan API ────────────────────────────────────────────────────────────

/** Web Bluetooth ada? (Chrome/Edge desktop & Chrome Android; tidak di WebView/APK.) */
export function periksaDukunganBluetooth(): boolean {
  return Boolean(ambilNavigator()?.bluetooth);
}

/** WebUSB ada? (Chromium desktop & Chrome Android; tidak di WebView/APK.) */
export function periksaDukunganUsb(): boolean {
  return Boolean(ambilNavigator()?.usb);
}

/** Printer yang hanya bisa di-pairing, belum bisa dikirimi data cetak. */
export function apakahPairingSaja(p: PerangkatPrinter | null): boolean {
  return p?.tipe === 'bluetooth' || p?.tipe === 'usb';
}

/** Keterangan jujur satu baris untuk badge/dialog. */
export function keteranganPrinter(p: PerangkatPrinter | null): string {
  if (!p || p.tipe === 'system') return 'Dialog cetak sistem / Simpan sebagai PDF';
  if (p.tipe === 'bluetooth') return `Bluetooth · ${p.terhubung ? 'terhubung' : 'terpasang, belum terhubung'} · ${CATATAN_PENGIRIMAN_BELUM_DIDUKUNG}`;
  if (p.tipe === 'usb') return `USB · ${p.terhubung ? 'terbuka' : 'terpasang'} · ${CATATAN_PENGIRIMAN_BELUM_DIDUKUNG}`;
  return 'Perangkat tidak dikenal';
}

// ── Pairing perangkat ───────────────────────────────────────────────────────

/**
 * Pasangkan printer Bluetooth: hanya bila Web Bluetooth ada. gatt.connect()
 * benar-benar dipanggil dan `terhubung` mengikuti hasil nyata. Tidak ada
 * angka baterai (tidak pernah dibaca dari perangkat). Pengiriman data cetak
 * belum didukung — lihat CATATAN_PENGIRIMAN_BELUM_DIDUKUNG.
 */
export async function hubungkanPrinterBluetooth(): Promise<PerangkatPrinter> {
  const nav = ambilNavigator();
  if (!nav?.bluetooth) {
    throw new Error('Web Bluetooth tidak tersedia di aplikasi/peramban ini — gunakan Printer Sistem.');
  }

  const device = await nav.bluetooth.requestDevice({
    acceptAllDevices: true,
    optionalServices: [
      '000018f0-0000-1000-8000-00805f9b34fb', // port serial umum printer POS thermal
      'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
    ],
  });

  let terhubung = false;
  if (device.gatt) {
    try {
      await device.gatt.connect();
      terhubung = device.gatt.connected;
    } catch {
      terhubung = false;
    }
  }

  const perangkat: PerangkatPrinter = {
    id: device.id || idAcak('bt'),
    nama: device.name || 'Printer Bluetooth',
    tipe: 'bluetooth',
    terhubung,
    lebarKertasBawaan: 'thermal80',
    terakhirTerhubung: new Date().toISOString(),
  };

  simpanPrinterAktif(perangkat);
  return perangkat;
}

/**
 * Pasangkan printer USB: hanya bila WebUSB ada. device.open() dipanggil
 * sungguhan; bila gagal (driver sistem memegang perangkat, izin ditolak)
 * galatnya diteruskan apa adanya. Pengiriman data cetak belum didukung.
 */
export async function hubungkanPrinterUsb(): Promise<PerangkatPrinter> {
  const nav = ambilNavigator();
  if (!nav?.usb) {
    throw new Error('WebUSB tidak tersedia di aplikasi/peramban ini — gunakan Printer Sistem.');
  }

  const device = await nav.usb.requestDevice({ filters: [] });
  await device.open();

  const perangkat: PerangkatPrinter = {
    id: idAcak('usb'),
    nama: device.productName || 'Printer USB',
    tipe: 'usb',
    terhubung: true,
    lebarKertasBawaan: 'a4',
    terakhirTerhubung: new Date().toISOString(),
  };

  simpanPrinterAktif(perangkat);
  return perangkat;
}

/** Printer sistem = dialog cetak peramban/OS (bawaan bila tidak ada pilihan). */
export function hubungkanPrinterSistem(nama = 'Printer sistem'): PerangkatPrinter {
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

// ── Antrean / riwayat cetak ─────────────────────────────────────────────────

export function ambilAntreanCetak(): ItemAntreanCetak[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(KUNCI_ANTREAN_CETAK);
  if (!raw) return [];
  try {
    const v: unknown = JSON.parse(raw);
    return Array.isArray(v) ? (v as ItemAntreanCetak[]) : [];
  } catch {
    return [];
  }
}

export function tambahKeAntrean(
  judulDokumen: string,
  jenisDokumen: ItemAntreanCetak['jenisDokumen'],
  ukuranKertas: UkuranKertas = 'a4',
  orientasi: OrientasiKertas = 'portrait',
): ItemAntreanCetak {
  const item: ItemAntreanCetak = {
    id: idAcak('cetak'),
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
    localStorage.setItem(KUNCI_ANTREAN_CETAK, JSON.stringify(list.slice(0, BATAS_RIWAYAT_ANTREAN)));
  }

  return item;
}

export function perbaruiStatusAntrean(id: string, status: ItemAntreanCetak['status'], pesan?: string): void {
  if (typeof window === 'undefined') return;
  const list = ambilAntreanCetak();
  const index = list.findIndex((i) => i.id === id);
  if (index === -1) return;
  list[index].status = status;
  if (pesan) list[index].pesan = pesan;
  if (status === 'selesai' || status === 'gagal' || status === 'dibatalkan') {
    list[index].selesaiPada = new Date().toISOString();
  }
  localStorage.setItem(KUNCI_ANTREAN_CETAK, JSON.stringify(list));
}

export function bersihkanAntrean(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(KUNCI_ANTREAN_CETAK);
  }
}

// ── Eksekusi cetak ──────────────────────────────────────────────────────────

export type FungsiCetak = () => Promise<void> | void;

/**
 * Catat satu pekerjaan cetak lalu jalankan `cetak` — callback dari pemanggil
 * (Kanvas memberi `() => host.cetak({ jenis: 'kanvas', … })`). Modul ini
 * TIDAK memanggil window.print() sendiri dan tidak menyentuh atribut body;
 * @page/penanda cetak adalah urusan host (standaloneHost.cetakLembarKanvas).
 *
 * Status riwayat ditentukan dari `afterprint` (sekali pakai):
 *   - datang < AMBANG_BATAL_MS  → 'dibatalkan' (dialog ditutup tanpa mencetak),
 *   - datang setelahnya         → 'selesai' (dokumen diserahkan ke dialog sistem),
 *   - callback melempar         → 'gagal',
 *   - tidak datang sama sekali (WebView tertentu) → 'selesai' setelah tenggat,
 *     dengan catatan bahwa hasilnya tidak terpantau.
 *
 * Printer Bluetooth/USB: TIDAK mengaku sukses. Callback yang sama dijalankan
 * (dialog sistem) dan riwayat diberi pesan bahwa pengiriman langsung belum
 * didukung.
 *
 * Parameter `cetak` sementara opsional (bawaan window.print()) agar pemanggil
 * lama dengan 4 argumen tetap kompilasi; pemanggil baru WAJIB memberi
 * callback host.
 *
 * Nilai balik: true bila dialog cetak berhasil dibuka (bukan "tercetak").
 */
export async function jalankanCetak(
  judul: string,
  jenis: ItemAntreanCetak['jenisDokumen'] = 'struktur',
  ukuranKertas: UkuranKertas = 'a4',
  orientasi: OrientasiKertas = 'portrait',
  cetak: FungsiCetak = () => window.print(),
): Promise<boolean> {
  const antrean = tambahKeAntrean(judul, jenis, ukuranKertas, orientasi);
  if (typeof window === 'undefined') {
    perbaruiStatusAntrean(antrean.id, 'gagal', 'Cetak hanya tersedia di peramban');
    return false;
  }

  const printer = ambilPrinterAktif();
  const namaPrinter = printer?.nama ?? 'Printer sistem';
  const catatanPairing = apakahPairingSaja(printer)
    ? `Pengiriman langsung ke printer ${namaPrinter} belum didukung — dicetak lewat dialog sistem`
    : null;

  perbaruiStatusAntrean(antrean.id, 'mencetak', catatanPairing ?? undefined);

  // Satu penutup untuk tiga jalur (afterprint / tenggat / galat) — yang
  // pertama datang menang; window.print() desktop memblokir sehingga
  // afterprint bisa tiba SEBELUM `await cetak()` selesai.
  const mulai = Date.now();
  let sudahDitutup = false;
  let tenggat: number | undefined;
  const tutup = (status: ItemAntreanCetak['status'], pesan: string) => {
    if (sudahDitutup) return;
    sudahDitutup = true;
    window.clearTimeout(tenggat);
    window.removeEventListener('afterprint', padaAfterprint);
    perbaruiStatusAntrean(antrean.id, status, pesan);
  };
  function padaAfterprint() {
    if (Date.now() - mulai < AMBANG_BATAL_MS) {
      tutup('dibatalkan', 'Dialog cetak ditutup tanpa mencetak');
    } else {
      tutup('selesai', catatanPairing ?? `Diserahkan ke dialog cetak sistem (${namaPrinter})`);
    }
  }
  window.addEventListener('afterprint', padaAfterprint, { once: true });
  tenggat = window.setTimeout(
    () => tutup('selesai', `${catatanPairing ?? 'Dialog cetak sistem dibuka'} · hasil tidak terpantau (afterprint tidak diterima)`),
    TENGGAT_AFTERPRINT_MS,
  );

  try {
    await cetak();
    return true;
  } catch (err) {
    tutup('gagal', err instanceof Error ? err.message : 'Gagal membuka dialog cetak');
    return false;
  }
}
