'use client';

// Ukuran kotak sebuah elemen yang ikut berubah saat layout berubah
// (ResizeObserver). Dipakai pratinjau cetak untuk menskalakan lembar kertas
// berukuran mm agar pas lebar wadah (fit-to-width) di layar HP — transform
// scale tidak mengubah kotak layout, jadi tinggi wadah dihitung dari ukuran
// asli × skala.

import { useEffect, useRef, useState } from 'react';

export interface UkuranElemen {
  lebar: number;
  tinggi: number;
}

export function useUkuranElemen<T extends HTMLElement>(): [React.RefObject<T>, UkuranElemen] {
  const ref = useRef<T>(null);
  const [ukuran, setUkuran] = useState<UkuranElemen>({ lebar: 0, tinggi: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const perbarui = () => {
      const lebar = el.offsetWidth;
      const tinggi = el.offsetHeight;
      setUkuran((lama) => (lama.lebar === lebar && lama.tinggi === tinggi ? lama : { lebar, tinggi }));
    };
    perbarui();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', perbarui);
      return () => window.removeEventListener('resize', perbarui);
    }
    const ro = new ResizeObserver(perbarui);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return [ref, ukuran];
}
