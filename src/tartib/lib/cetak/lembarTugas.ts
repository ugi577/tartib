// Lembar tugas per PIC (Batch F) — fungsi murni untuk cetak lembar kerja
// tiap penanggung jawab divisi. Satu lembar = satu orang (Gate F: "satu
// halaman per PIC"), berisi hanya tugas divisi yang dipic-nya. Semua
// hitungan deterministik dari data yang sudah termuat; tidak menyentuh
// IndexedDB.

import type { Acara, AcaraDivisi, Divisi, Fase, StatusTugas, Tugas } from '../../types';

export interface TugasLembar {
  faseUrutan: number;
  faseLabel: string;
  offsetHari: number;
  urutan: number;
  judul: string;
  catatan: string;
  wajib: boolean;
  status: StatusTugas;
}

export interface LembarPic {
  picNama: string;
  picKontak: string;
  divisiId: string;
  divisiNama: string;
  tugas: TugasLembar[];
}

export interface SusunLembarParams {
  acara: Acara;
  fases: Fase[];
  divisi: Divisi[];
  acaraDivisi: AcaraDivisi[];
  tugas: Tugas[];
}

export function susunLembarTugas({ acara, fases, divisi, acaraDivisi, tugas }: SusunLembarParams): LembarPic[] {
  const urutanFase = new Map(fases.map((f) => [f.id, f.urutan]));
  const labelFase = new Map(fases.map((f) => [f.id, f.label]));
  const offsetFase = new Map(fases.map((f) => [f.id, f.offsetHari]));
  const urutanDivisi = new Map(divisi.map((d) => [d.id, d.urutan]));

  // PIC tanpa nama belum layak dicetak (A-01 mewajibkan nama sebelum SIAP).
  const baris = acaraDivisi
    .filter((r) => r.acaraId === acara.id && r.picNama.trim() !== '')
    .sort((a, b) => {
      const ua = urutanDivisi.get(a.divisiId) ?? Number.MAX_SAFE_INTEGER;
      const ub = urutanDivisi.get(b.divisiId) ?? Number.MAX_SAFE_INTEGER;
      return ua - ub || a.divisiId.localeCompare(b.divisiId);
    });

  const urutTugas = (a: TugasLembar, b: TugasLembar) => a.faseUrutan - b.faseUrutan || a.urutan - b.urutan;

  return baris.map((r) => {
    const divisiNama = divisi.find((d) => d.id === r.divisiId)?.nama ?? 'Divisi tidak ditemukan';
    const tugasDivisi = tugas
      .filter((t) => t.acaraId === acara.id && t.divisiId === r.divisiId)
      .map((t) => ({
        faseUrutan: urutanFase.get(t.faseId) ?? Number.MAX_SAFE_INTEGER,
        faseLabel: labelFase.get(t.faseId) ?? 'Fase tidak ditemukan',
        offsetHari: offsetFase.get(t.faseId) ?? 0,
        urutan: t.urutan,
        judul: t.judul,
        catatan: t.catatan,
        wajib: t.wajib,
        status: t.status,
      }))
      .sort(urutTugas);
    return { picNama: r.picNama.trim(), picKontak: r.picKontak, divisiId: r.divisiId, divisiNama, tugas: tugasDivisi };
  });
}
