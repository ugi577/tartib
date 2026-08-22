'use client';

// Kop lembaga khusus cetak (sesi 16) — muncul HANYA di kertas (print:block),
// tidak di layar, di atas setiap kop laporan/buku acara/panduan. Isinya dari
// tab Pengaturan; bila belum diisi, tidak ada yang dicetak sama sekali
// (lembar tetap seperti sebelum sesi 16).

import { barisKop } from '../lib/pengaturan';
import { usePengaturan } from '../lib/usePengaturan';

export function KopCetak() {
  const pengaturan = usePengaturan();
  const baris = barisKop(pengaturan);
  if (baris.length === 0) return null;

  return (
    <div className="mb-3 hidden border-b border-slate-400 pb-2 text-center print:block">
      <p className="text-sm font-bold uppercase tracking-wide text-slate-900">{baris[0]}</p>
      {baris[1] ? <p className="text-[11px] text-slate-600">{baris[1]}</p> : null}
    </div>
  );
}
