'use client';

// Satu sumber data untuk satu papan struktur/SOP (sesi 22).
//
// Sebelumnya PanelItemSop (mode daftar) dan BaganOrganisasi (bagan) masing-
// masing memegang state items/subItems sendiri, sehingga perubahan di mode
// daftar tidak terlihat saat kembali ke bagan (data basi) dan logika muat,
// pengelompokan sub per item, ikhtisar, serta ceklis optimis ditulis dua kali.
// Hook ini dipegang SATU induk (BaganOrganisasi / panel SOP kustom) dan
// diteruskan ke tampilan mana pun yang aktif — pindah mode selalu segar.
//
// Fungsi baca service MURNI: tidak ada lagi "sinkronisasi" nama PIC yang dulu
// diam-diam menulis DB dari dalam muat().

import { useCallback, useEffect, useMemo, useState } from 'react';
import * as sopSvc from '../../services/sopService';
import type { SopItem, SopSubItem } from '../../types';

export function pesanError(e: unknown): string {
  return e instanceof Error ? e.message : 'Terjadi kesalahan';
}

export interface PapanSop {
  sopId: string;
  items: SopItem[];
  subItems: SopSubItem[];
  /** Sub-tugas per item induk, terurut di dalam induknya. */
  subByItem: ReadonlyMap<string, SopSubItem[]>;
  /** Progres SEMUA kotak ceklis (item + sub) — mode daftar. */
  ikhtisar: sopSvc.IkhtisarCeklis;
  /** Progres tugas rinci saja (sub) — bagan menghitung tugas, bukan jabatan. */
  ikhtisarSub: sopSvc.IkhtisarCeklis;
  memuat: boolean;
  error: string | null;
  setError: (pesan: string | null) => void;
  /** Baca ulang dari DB — dipanggil setelah setiap mutasi. */
  muat: () => Promise<void>;
  /** Ceklis optimis: UI merespons seketika, lalu disinkronkan ulang dari DB. */
  centangItem: (item: SopItem, selesai: boolean) => Promise<void>;
  centangSub: (sub: SopSubItem, selesai: boolean) => Promise<void>;
}

export function usePapanSop(sopId: string): PapanSop {
  const [items, setItems] = useState<SopItem[]>([]);
  const [subItems, setSubItems] = useState<SopSubItem[]>([]);
  const [memuat, setMemuat] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const muat = useCallback(async () => {
    try {
      const [it, sub] = await Promise.all([sopSvc.daftarItemSop(sopId), sopSvc.daftarSubItemSop(sopId)]);
      setItems(it);
      setSubItems(sub);
      setError(null);
    } catch (e) {
      setError(pesanError(e));
    } finally {
      setMemuat(false);
    }
  }, [sopId]);

  useEffect(() => {
    setMemuat(true);
    void muat();
  }, [muat]);

  const subByItem = useMemo(() => {
    const peta = new Map<string, SopSubItem[]>();
    for (const s of subItems) {
      const daftar = peta.get(s.itemId) ?? [];
      daftar.push(s);
      peta.set(s.itemId, daftar);
    }
    peta.forEach((daftar) => daftar.sort((a, b) => a.urutan - b.urutan));
    return peta;
  }, [subItems]);

  const ikhtisar = useMemo(() => sopSvc.ikhtisarCeklis([...items, ...subItems]), [items, subItems]);
  const ikhtisarSub = useMemo(() => sopSvc.ikhtisarCeklis(subItems), [subItems]);

  const centangItem = useCallback(
    async (item: SopItem, selesai: boolean) => {
      setItems((lama) => lama.map((x) => (x.id === item.id ? { ...x, selesai } : x)));
      try {
        await sopSvc.tandaiCeklis(item.id, selesai);
      } catch (e) {
        setError(pesanError(e));
      } finally {
        await muat();
      }
    },
    [muat],
  );

  const centangSub = useCallback(
    async (sub: SopSubItem, selesai: boolean) => {
      setSubItems((lama) => lama.map((x) => (x.id === sub.id ? { ...x, selesai } : x)));
      try {
        await sopSvc.tandaiCeklisSub(sub.id, selesai);
      } catch (e) {
        setError(pesanError(e));
      } finally {
        await muat();
      }
    },
    [muat],
  );

  return { sopId, items, subItems, subByItem, ikhtisar, ikhtisarSub, memuat, error, setError, muat, centangItem, centangSub };
}
