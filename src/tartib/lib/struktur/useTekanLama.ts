'use client';

// Tekan lama (long-press) di layar sentuh → buka menu yang sama dengan klik
// kanan (sesi 22). Tombol ⋯ tetap jalan masuk utama di HP; hook ini hanya
// jalan pintas tambahan. Hanya bereaksi pada pointer sentuh (mouse punya klik
// kanan), batal bila jari bergeser > 8px atau dilepas sebelum 500 ms, dan
// menelan klik yang menyusul setelah menu terbuka agar kartu tidak ikut
// membuka/menutup rinciannya.

import { useEffect, useRef, type PointerEvent as PointerEventReact, type MouseEvent as MouseEventReact } from 'react';

const DURASI_MS = 500;
const AMBANG_GESER_PX = 8;
const ELEMEN_DILEWATI = 'input, button, a, select, textarea, label';

export interface HandlerTekanLama {
  onPointerDown: (e: PointerEventReact<HTMLElement>) => void;
  onPointerMove: (e: PointerEventReact<HTMLElement>) => void;
  onPointerUp: () => void;
  onPointerCancel: () => void;
  onPointerLeave: () => void;
  onClickCapture: (e: MouseEventReact<HTMLElement>) => void;
}

export function useTekanLama(onTekan: (elemen: HTMLElement) => void): HandlerTekanLama {
  const timer = useRef<number | null>(null);
  const awal = useRef<{ x: number; y: number } | null>(null);
  const terpicu = useRef(false);

  function batal() {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
    awal.current = null;
  }

  useEffect(() => batal, []);

  return {
    onPointerDown: (e) => {
      if (e.pointerType !== 'touch') return;
      if (e.target instanceof Element && e.target.closest(ELEMEN_DILEWATI)) return;
      batal();
      terpicu.current = false;
      awal.current = { x: e.clientX, y: e.clientY };
      const elemen = e.currentTarget;
      timer.current = window.setTimeout(() => {
        timer.current = null;
        awal.current = null;
        terpicu.current = true;
        onTekan(elemen);
      }, DURASI_MS);
    },
    onPointerMove: (e) => {
      if (!awal.current) return;
      if (Math.hypot(e.clientX - awal.current.x, e.clientY - awal.current.y) > AMBANG_GESER_PX) batal();
    },
    onPointerUp: batal,
    onPointerCancel: batal,
    onPointerLeave: batal,
    onClickCapture: (e) => {
      if (!terpicu.current) return;
      terpicu.current = false;
      e.preventDefault();
      e.stopPropagation();
    },
  };
}
