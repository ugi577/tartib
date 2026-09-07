'use client';

// Menu Klik Kanan Kustom (Context Menu)
// Menyediakan aksi instan: Copy, Cut, Paste, Delete, Edit
// Mendeteksi posisi layar agar tidak terpotong tepi layar.

import { useEffect, useRef } from 'react';

export interface ItemMenuKlikKanan {
  label: string;
  ikon?: string;
  shortcut?: string;
  bahaya?: boolean;
  disabled?: boolean;
  onClick: () => void;
  pemisah?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  terbuka: boolean;
  onTutup: () => void;
  judul?: string;
  items: ItemMenuKlikKanan[];
}

export function ContextMenu({ x, y, terbuka, onTutup, judul, items }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!terbuka) return;

    function handleOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onTutup();
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onTutup();
    }

    function handleScroll() {
      onTutup();
    }

    window.addEventListener('mousedown', handleOutside);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      window.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [terbuka, onTutup]);

  if (!terbuka) return null;

  // Hitung posisi agar tidak keluar dari viewport
  const lebarMenu = 200;
  const tinggiMenu = items.length * 36 + 40;
  const maxX = typeof window !== 'undefined' ? window.innerWidth - lebarMenu - 10 : x;
  const maxY = typeof window !== 'undefined' ? window.innerHeight - tinggiMenu - 10 : y;

  const posX = Math.max(10, Math.min(x, maxX));
  const posY = Math.max(10, Math.min(y, maxY));

  return (
    <div
      ref={menuRef}
      role="menu"
      style={{ top: `${posY}px`, left: `${posX}px` }}
      className="fixed z-[100] w-52 overflow-hidden rounded-2xl border border-emerald-400/40 bg-aksen-950/90 p-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.35),0_0_1px_rgba(255,255,255,0.5)] backdrop-blur-2xl transition-opacity animate-in fade-in zoom-in-95 duration-100"
    >
      {judul && (
        <div className="border-b border-emerald-500/20 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-200/60">
          {judul}
        </div>
      )}

      <div className="py-0.5">
        {items.map((it, idx) => {
          if (it.pemisah) {
            return <div key={idx} className="my-1 border-t border-emerald-500/20" />;
          }

          return (
            <button
              key={idx}
              type="button"
              disabled={it.disabled}
              onClick={() => {
                it.onClick();
                onTutup();
              }}
              className={`flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-left text-xs transition active:scale-98 ${
                it.disabled
                  ? 'cursor-not-allowed text-emerald-100/30'
                  : it.bahaya
                  ? 'text-red-300 hover:bg-red-500/20 hover:text-red-100'
                  : 'text-emerald-100 hover:bg-white/15 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2">
                {it.ikon && <span className="text-sm">{it.ikon}</span>}
                <span className="font-medium">{it.label}</span>
              </span>

              {it.shortcut && (
                <span className="text-[10px] font-mono text-emerald-300/40">
                  {it.shortcut}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
