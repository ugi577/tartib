'use client';

// Dialog aplikasi — satu-satunya mekanisme modal di Tartib (BRIEF: tanpa
// window.confirm/alert; konfirmasi destruktif lewat KonfirmasiDialog).

import { useEffect, type ReactNode } from 'react';
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

export function AppDialog({ terbuka, judul, onTutup, children, lebar = 'md' }: PropsAppDialog) {
  useEffect(() => {
    if (!terbuka) return;
    const padaKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onTutup();
    };
    window.addEventListener('keydown', padaKey);
    return () => window.removeEventListener('keydown', padaKey);
  }, [terbuka, onTutup]);

  if (!terbuka) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onTutup} />
      <div
        className={`relative w-full ${LEBAR[lebar]} max-h-[85vh] overflow-y-auto rounded-kartu border border-white/70 bg-permukaan-kartu p-5 shadow-angkat backdrop-blur-xl`}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-teks-utama">{judul}</h2>
          <button
            onClick={onTutup}
            aria-label="Tutup dialog"
            className="rounded-full p-1 text-teks-redup hover:bg-white/60 hover:text-teks-sedang"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
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
        <button
          onClick={onBatal}
          className={KELAS.tombolSekunder}
        >
          Batal
        </button>
        <button
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
        {error && (
          <p className={`mt-3 ${KELAS.error}`}>{error}</p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onTutup}
            className={KELAS.tombolSekunder}
          >
            Batal
          </button>
          <button
            type="submit"
            className={KELAS.tombolUtama}
          >
            {labelSimpan}
          </button>
        </div>
      </form>
    </AppDialog>
  );
}
