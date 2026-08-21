'use client';

// Halaman ?view=acara — papan acara lengkap hadir di Batch C.
// Stub ini hanya penanda agar nav "Acara" punya tujuan sejak Batch B.
export function AcaraView() {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center">
      <h2 className="text-lg font-semibold text-slate-700">Papan Acara</h2>
      <p className="mt-2 text-sm text-slate-500">
        Fitur acara (buat dari template, snapshot tugas, aturan PIC) hadir di Batch C.
        Mulai dari tab Template untuk menyusun SOP.
      </p>
    </div>
  );
}
