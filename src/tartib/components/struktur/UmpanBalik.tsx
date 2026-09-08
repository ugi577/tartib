'use client';

// Umpan balik salin/potong/tempel (sesi 22, temuan [19]): pil "Klip: …" dengan
// tombol Batal, dan baris pesan sukses yang bisa ditutup. Sebelumnya Salin /
// Potong tidak memberi tanda apa pun di layar.

import { labelKlip, type ItemKlip } from '../../lib/clipboard/appClipboard';
import { KELAS } from '../../ui/kelas';
import { PESAN_INFO } from './bersama';

export function PilKlip({ klip, onBatal }: { klip: ItemKlip; onBatal: () => void }) {
  return (
    <div
      role="status"
      className="flex items-center justify-between gap-2 rounded-kontrol bg-emas-100/70 px-3 py-1 text-xs text-emas-800 ring-1 ring-inset ring-emas-200/70"
    >
      <span className="min-w-0 truncate">Klip: {labelKlip(klip)}</span>
      <button type="button" onClick={onBatal} className={`${KELAS.tombolHalus} shrink-0`}>
        Batal
      </button>
    </div>
  );
}

export function BarisPesan({ pesan, onTutup }: { pesan: string; onTutup: () => void }) {
  return (
    <div role="status" className={`flex items-start justify-between gap-2 ${PESAN_INFO}`}>
      <span className="min-w-0">{pesan}</span>
      <button type="button" onClick={onTutup} aria-label="Tutup pesan" className={`${KELAS.tombolIkon} -my-1 shrink-0`}>
        ✕
      </button>
    </div>
  );
}
