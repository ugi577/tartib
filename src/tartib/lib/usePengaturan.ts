'use client';

// Hook pembaca pengaturan (sesi 16).
//
// localStorage tidak ada saat prerender statis (next build), jadi pembacaan
// WAJIB terjadi setelah mount — bukan di useState initializer — supaya tidak
// terjadi hydration mismatch. Sebelum terbaca, nilai yang dipakai adalah
// PENGATURAN_BAKU (perilaku aplikasi sebelum sesi 16).
//
// Perubahan disiarkan lewat event `tartib:pengaturan` agar layar lain (kop
// cetak, kalkulator porsi) ikut segar tanpa muat ulang halaman.

import { useEffect, useState } from 'react';
import { bacaPengaturan, PENGATURAN_BAKU, type Pengaturan } from './pengaturan';

export const EVENT_PENGATURAN = 'tartib:pengaturan';

/** Siarkan bahwa pengaturan berubah — dipanggil setelah simpan/reset. */
export function siarkanPengaturan(): void {
  window.dispatchEvent(new Event(EVENT_PENGATURAN));
}

export function usePengaturan(): Pengaturan {
  const [pengaturan, setPengaturan] = useState<Pengaturan>(PENGATURAN_BAKU);

  useEffect(() => {
    const segarkan = () => setPengaturan(bacaPengaturan(localStorage));
    segarkan();
    window.addEventListener(EVENT_PENGATURAN, segarkan);
    return () => window.removeEventListener(EVENT_PENGATURAN, segarkan);
  }, []);

  return pengaturan;
}
