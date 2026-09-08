'use client';

// Dialog aplikasi — satu-satunya mekanisme modal di Tartib (BRIEF: tanpa
// window.confirm/alert; konfirmasi destruktif lewat KonfirmasiDialog).
//
// Sesi 22: overlay + panel dirender lewat portal ke `document.body`. Sebelumnya
// dialog dirender di tempat pemanggil; bila pemanggil berada di dalam elemen
// ber-`transform` (lembar kanvas cetak 1123px), `position: fixed` jadi relatif
// ke lembar itu dan dialog muncul di luar layar HP. Portal membuat `fixed`
// selalu relatif ke viewport. Selagi terbuka, scroll body dikunci; tombol ✕
// dibesarkan ke 40×40 (target sentuh); overlay `print:hidden`.

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { KELAS } from '../ui/kelas';

interface PropsAppDialog {
  terbuka: boolean;
  judul: string;
  onTutup: () => void;
  children: ReactNode;
  lebar?: 'sm' | 'md' | 'lg';
}

const LEBAR: Record<NonNullable<PropsAppDialog['lebar']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
};

// ── Kunci scroll body ──────────────────────────────────────────────────────
// Dihitung dengan penghitung agar dua dialog yang terbuka bersamaan
// (mis. FormDialog + KonfirmasiDialog) tidak saling melepas kunci lebih awal.
let jumlahKunci = 0;
let overflowSebelum = '';

function kunciScrollBody(): () => void {
  if (jumlahKunci === 0) {
    overflowSebelum = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  jumlahKunci += 1;
  return () => {
    jumlahKunci = Math.max(0, jumlahKunci - 1);
    if (jumlahKunci === 0) document.body.style.overflow = overflowSebelum;
  };
}

/**
 * `true` hanya setelah komponen terpasang di browser. Saat prerender statis
 * (`next build`) `document` belum ada, jadi render pertama di server maupun
 * klien sama-sama `null` — tidak ada selisih hidrasi.
 */
function useSudahTerpasang(): boolean {
  const [terpasang, setTerpasang] = useState(false);
  useEffect(() => {
    setTerpasang(true);
  }, []);
  return terpasang;
}

export function AppDialog({ terbuka, judul, onTutup, children, lebar = 'md' }: PropsAppDialog) {
  const terpasang = useSudahTerpasang();
  const idJudul = useId();

  // Simpan handler di ref supaya effect di bawah tidak lepas-pasang listener
  // setiap render (pemanggil hampir selalu memberi lambda baru).
  const onTutupRef = useRef(onTutup);
  useEffect(() => {
    onTutupRef.current = onTutup;
  });

  useEffect(() => {
    if (!terbuka || !terpasang) return;
    const padaKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onTutupRef.current();
    };
    window.addEventListener('keydown', padaKey);
    const lepasKunci = kunciScrollBody();
    return () => {
      window.removeEventListener('keydown', padaKey);
      lepasKunci();
    };
  }, [terbuka, terpasang]);

  if (!terbuka || !terpasang || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4 print:hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby={idJudul}
    >
      <div className="absolute inset-0 bg-netral-900/40 backdrop-blur-sm" onClick={onTutup} />
      <div
        className={`relative w-full ${LEBAR[lebar]} max-h-[85vh] overflow-y-auto overscroll-contain rounded-kartu border border-white/70 bg-permukaan-kartu p-5 shadow-angkat backdrop-blur-xl`}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id={idJudul} className="text-lg font-semibold text-teks-utama">
            {judul}
          </h2>
          <button
            type="button"
            onClick={onTutup}
            aria-label="Tutup dialog"
            className={`${KELAS.tombolIkon} -mr-1.5 min-h-[40px] min-w-[40px] shrink-0`}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5" aria-hidden="true">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}

interface PropsKonfirmasi {
  terbuka: boolean;
  judul: string;
  pesan: string;
  labelYa?: string;
  bahaya?: boolean;
  onBatal: () => void;
  onYa: () => void;
}

export function KonfirmasiDialog({
  terbuka,
  judul,
  pesan,
  labelYa = 'Hapus',
  bahaya = true,
  onBatal,
  onYa,
}: PropsKonfirmasi) {
  return (
    <AppDialog terbuka={terbuka} judul={judul} onTutup={onBatal} lebar="sm">
      <p className="text-sm text-teks-sedang">{pesan}</p>
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" onClick={onBatal} className={KELAS.tombolSekunder}>
          Batal
        </button>
        <button
          type="button"
          onClick={onYa}
          className={bahaya ? KELAS.tombolBahayaSolid : KELAS.tombolUtama}
        >
          {labelYa}
        </button>
      </div>
    </AppDialog>
  );
}

interface PropsFormDialog {
  terbuka: boolean;
  judul: string;
  onTutup: () => void;
  onSimpan: () => void;
  labelSimpan?: string;
  children: ReactNode;
  /** Pesan error dari service layer — ditampilkan di atas tombol simpan. */
  error?: string | null;
}

export function FormDialog({
  terbuka,
  judul,
  onTutup,
  onSimpan,
  labelSimpan = 'Simpan',
  children,
  error = null,
}: PropsFormDialog) {
  return (
    <AppDialog terbuka={terbuka} judul={judul} onTutup={onTutup}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSimpan();
        }}
      >
        <div className="space-y-4">{children}</div>
        {error && <p className={`mt-3 ${KELAS.error}`}>{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onTutup} className={KELAS.tombolSekunder}>
            Batal
          </button>
          <button type="submit" className={KELAS.tombolUtama}>
            {labelSimpan}
          </button>
        </div>
      </form>
    </AppDialog>
  );
}
