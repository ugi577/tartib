'use client';

// Hook daftar terpaginasi lokal (pola v3-mandated: terima Table langsung).
// Opsi disimpan di ref agar pemanggil boleh memberi fungsi filter inline
// tanpa memicu infinite re-render loop.

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Table } from 'dexie';

export interface OpsiPagedList<T> {
  orderBy: string & keyof T;
  arah?: 'asc' | 'desc';
  filter?: (item: T) => boolean;
  perHalaman?: number;
  /** Kunci eksternal (mis. id template) — berubah memicu muat ulang. */
  kunci?: string;
}

interface IsiPagedList<T> {
  items: T[];
  total: number;
  halaman: number;
  totalHalaman: number;
  memuat: boolean;
}

export function usePagedList<T>(table: Table<T, string>, opsi: OpsiPagedList<T>) {
  const [isi, setIsi] = useState<IsiPagedList<T>>({
    items: [],
    total: 0,
    halaman: 1,
    totalHalaman: 1,
    memuat: true,
  });
  const [versi, setVersi] = useState(0);

  const opsiRef = useRef(opsi);
  opsiRef.current = opsi;

  const setHalaman = useCallback((h: number) => {
    setIsi((s) => ({ ...s, halaman: h }));
  }, []);

  const muatUlang = useCallback(() => {
    setVersi((v) => v + 1);
  }, []);

  useEffect(() => {
    let batal = false;
    const { orderBy, arah = 'asc', filter, perHalaman = 10 } = opsiRef.current;

    setIsi((s) => ({ ...s, memuat: true }));

    void (async () => {
      try {
        let koleksi = table.orderBy(orderBy);
        if (arah === 'desc') koleksi = koleksi.reverse();
        if (filter) koleksi = koleksi.filter(filter);

        const total = await koleksi.count();
        const totalHalaman = Math.max(1, Math.ceil(total / perHalaman));
        const halamanAman = Math.min(isi.halaman, totalHalaman);
        const items = await koleksi
          .offset((halamanAman - 1) * perHalaman)
          .limit(perHalaman)
          .toArray();

        if (!batal) {
          setIsi({ items, total, halaman: halamanAman, totalHalaman, memuat: false });
        }
      } catch (err) {
        if (!batal) {
          setIsi((s) => ({ ...s, items: [], total: 0, memuat: false }));
          console.error('usePagedList gagal memuat:', err);
        }
      }
    })();

    return () => {
      batal = true;
    };
  }, [table, isi.halaman, versi, opsi.kunci]);

  return {
    items: isi.items,
    total: isi.total,
    halaman: isi.halaman,
    totalHalaman: isi.totalHalaman,
    memuat: isi.memuat,
    setHalaman,
    muatUlang,
  };
}
