'use client';

// Menu klik kanan / tekan-lama (context menu) Tartib — aksi instan pada baris
// SOP dan sel matriks KBM.
//
// Sesi 22: dirender lewat portal ke `document.body` (sebelumnya `fixed` di
// dalam lembar kanvas ber-`transform` → posisi relatif ke lembar, bukan
// layar). Ukuran menu diukur nyata (`getBoundingClientRect`) lalu dijepit ke
// viewport dengan margin 10px dan menyisakan ruang kapsul nav bawah; bila
// prop `anchor` diberi, menu ditempatkan di bawah (atau di atas) elemen
// jangkar. Aksesibilitas: `role="menu"`/`menuitem`, fokus ke item pertama,
// panah/Home/End, Escape, fokus dikembalikan saat tutup. Item ≥ 40px untuk
// jari; rupa kaca terang mengikuti `KELAS.kartu`.

import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { KELAS } from '../ui/kelas';

export interface ItemMenuKlikKanan {
  label: string;
  ikon?: string;
  shortcut?: string;
  bahaya?: boolean;
  disabled?: boolean;
  onClick: () => void;
  pemisah?: boolean;
}

/** Kotak jangkar (hasil `getBoundingClientRect()` atau objek setara). */
export interface JangkarMenu {
  left: number;
  top: number;
  bottom: number;
  right: number;
  width: number;
  height: number;
}

interface ContextMenuProps {
  x: number;
  y: number;
  terbuka: boolean;
  onTutup: () => void;
  judul?: string;
  items: ItemMenuKlikKanan[];
  /** Bila ada, menu ditempatkan di bawah jangkar (atau di atasnya bila tidak muat); `x,y` diabaikan. */
  anchor?: DOMRect | JangkarMenu;
}

/** Jarak minimum menu dari tepi viewport. */
const MARGIN_TEPI = 10;
/** Ruang yang disisakan di bawah untuk kapsul nav `fixed bottom` (≈77px) + safe-area. */
const RUANG_NAV_BAWAH = 88;
/** Celah antara menu dan jangkar. */
const CELAH_JANGKAR = 6;

interface Ukuran {
  lebar: number;
  tinggi: number;
}

interface Posisi {
  left: number;
  top: number;
}

/**
 * Menghitung posisi menu di viewport. Fungsi murni supaya mudah diuji:
 * prioritas di bawah jangkar → di atas jangkar → jepit ke batas viewport.
 * Tanpa jangkar, titik `x,y` (koordinat klien) dipakai lalu dijepit.
 */
export function hitungPosisiMenu(
  ukuranMenu: Ukuran,
  viewport: Ukuran,
  target: { x: number; y: number; anchor?: JangkarMenu },
): Posisi {
  const batasBawah = viewport.tinggi - RUANG_NAV_BAWAH;
  const leftMaks = Math.max(MARGIN_TEPI, viewport.lebar - ukuranMenu.lebar - MARGIN_TEPI);
  const topMaks = Math.max(MARGIN_TEPI, batasBawah - ukuranMenu.tinggi);

  let left = target.x;
  let top = target.y;
  if (target.anchor) {
    const j = target.anchor;
    left = j.left;
    top = j.bottom + CELAH_JANGKAR;
    if (top + ukuranMenu.tinggi > batasBawah) {
      const diAtas = j.top - CELAH_JANGKAR - ukuranMenu.tinggi;
      if (diAtas >= MARGIN_TEPI) top = diAtas;
    }
  }

  return {
    left: Math.min(Math.max(MARGIN_TEPI, left), leftMaks),
    top: Math.min(Math.max(MARGIN_TEPI, top), topMaks),
  };
}

// `useLayoutEffect` di server hanya memicu peringatan; saat prerender statis
// komponen ini toh mengembalikan null, jadi cukup ganti ke `useEffect`.
const useLayoutEffectAman = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/** `true` hanya setelah terpasang di browser — aman untuk prerender statis. */
function useSudahTerpasang(): boolean {
  const [terpasang, setTerpasang] = useState(false);
  useEffect(() => {
    setTerpasang(true);
  }, []);
  return terpasang;
}

const SELEKTOR_ITEM = '[role="menuitem"]:not(:disabled)';

export function ContextMenu({ x, y, terbuka, onTutup, judul, items, anchor }: ContextMenuProps) {
  const terpasang = useSudahTerpasang();
  const idJudul = useId();
  const menuRef = useRef<HTMLDivElement>(null);
  const [posisi, setPosisi] = useState<Posisi | null>(null);
  const aktif = terbuka && terpasang;

  // Handler disimpan di ref agar effect di bawah tidak lepas-pasang listener
  // setiap render (pemanggil memberi lambda baru tiap render).
  const onTutupRef = useRef(onTutup);
  useEffect(() => {
    onTutupRef.current = onTutup;
  });

  // ── Ukur ukuran nyata lalu posisikan; ulangi saat viewport berubah ─────
  useLayoutEffectAman(() => {
    if (!aktif) return;
    const el = menuRef.current;
    if (!el) return;
    const susun = () => {
      const r = el.getBoundingClientRect();
      const baru = hitungPosisiMenu(
        { lebar: r.width, tinggi: r.height },
        { lebar: window.innerWidth, tinggi: window.innerHeight },
        { x, y, anchor },
      );
      setPosisi((lama) =>
        lama && lama.left === baru.left && lama.top === baru.top ? lama : baru,
      );
    };
    susun();
    window.addEventListener('resize', susun);
    return () => window.removeEventListener('resize', susun);
    // `items` & `judul` ikut: jumlah baris berubah → tinggi menu berubah.
  }, [aktif, x, y, anchor, items, judul]);

  // ── Fokus, keyboard, dan tutup saat sentuh/klik di luar ─────────────────
  useEffect(() => {
    if (!aktif) return;
    const el = menuRef.current;
    const fokusSebelumnya =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const daftarItem = () =>
      el ? Array.from(el.querySelectorAll<HTMLButtonElement>(SELEKTOR_ITEM)) : [];

    daftarItem()[0]?.focus({ preventScroll: true });

    const padaPointerDown = (e: PointerEvent) => {
      if (el && e.target instanceof Node && !el.contains(e.target)) onTutupRef.current();
    };

    const padaKeyDown = (e: KeyboardEvent) => {
      const tombol = daftarItem();
      const n = tombol.length;
      const idx = tombol.findIndex((b) => b === document.activeElement);
      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          onTutupRef.current();
          break;
        case 'Tab':
          // Biarkan fokus berpindah alami; menu tidak boleh memerangkap Tab.
          onTutupRef.current();
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (n) tombol[idx < 0 || idx === n - 1 ? 0 : idx + 1].focus();
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (n) tombol[idx <= 0 ? n - 1 : idx - 1].focus();
          break;
        case 'Home':
          e.preventDefault();
          tombol[0]?.focus();
          break;
        case 'End':
          e.preventDefault();
          tombol[n - 1]?.focus();
          break;
        // Enter / Space: perilaku bawaan <button> yang sedang fokus (klik).
      }
    };

    document.addEventListener('pointerdown', padaPointerDown);
    window.addEventListener('keydown', padaKeyDown);
    return () => {
      document.removeEventListener('pointerdown', padaPointerDown);
      window.removeEventListener('keydown', padaKeyDown);
      setPosisi(null);
      // Kembalikan fokus hanya bila aksi menu tidak memindahkannya ke tempat
      // lain (mis. dialog Edit yang baru terbuka).
      const sekarang = document.activeElement;
      const fokusMasihDiMenu = !sekarang || sekarang === document.body || (el?.contains(sekarang) ?? false);
      if (fokusMasihDiMenu && fokusSebelumnya?.isConnected) {
        fokusSebelumnya.focus({ preventScroll: true });
      }
    };
  }, [aktif]);

  if (!aktif || typeof document === 'undefined') return null;

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      tabIndex={-1}
      aria-labelledby={judul ? idJudul : undefined}
      aria-label={judul ? undefined : 'Menu aksi'}
      style={{
        left: posisi?.left ?? x,
        top: posisi?.top ?? y,
        // Sembunyikan sampai terukur agar tidak berkedip di posisi lama.
        visibility: posisi ? 'visible' : 'hidden',
      }}
      className={`${KELAS.kartu} fixed z-[100] w-56 max-w-[calc(100vw-20px)] overflow-hidden p-1.5 print:hidden`}
    >
      {judul && (
        <div
          id={idJudul}
          className="truncate px-3 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wider text-teks-halus"
        >
          {judul}
        </div>
      )}

      <div className="flex flex-col">
        {items.map((it, idx) => {
          if (it.pemisah) {
            return <div key={idx} role="separator" className="my-1 border-t border-garis" />;
          }

          const warna = it.disabled
            ? 'cursor-not-allowed text-teks-redup'
            : it.bahaya
            ? 'text-red-600 hover:bg-red-100/70 focus-visible:bg-red-100/70'
            : 'text-teks-utama hover:bg-white/70 focus-visible:bg-white/70';

          return (
            <button
              key={idx}
              type="button"
              role="menuitem"
              disabled={it.disabled}
              onClick={() => {
                it.onClick();
                onTutup();
              }}
              className={`flex min-h-[40px] w-full items-center justify-between gap-3 rounded-kontrol px-3 py-2 text-left text-sm transition-colors ${warna}`}
            >
              <span className="flex min-w-0 items-center gap-2">
                {it.ikon && (
                  <span aria-hidden="true" className="w-5 shrink-0 text-center text-base leading-none">
                    {it.ikon}
                  </span>
                )}
                <span className="truncate font-medium">{it.label}</span>
              </span>

              {it.shortcut && (
                <span className="hidden shrink-0 font-mono text-[11px] text-teks-redup sm:inline">
                  {it.shortcut}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>,
    document.body,
  );
}
