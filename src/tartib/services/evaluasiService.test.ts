// Test fungsi murni evaluasiService (Batch E) — tanpa IndexedDB.
import { describe, expect, it } from 'vitest';
import type { Fase } from '../types';
import { EvaluasiError, faseTerakhir, inputEvaluasiSah, itemDariUsulan } from './evaluasiService';

function fase(id: string, templateId: string, urutan: number): Fase {
  return { id, templateId, urutan, label: `Fase ${urutan}`, offsetHari: -urutan };
}

describe('inputEvaluasiSah', () => {
  it('men-trim seluruh teks dan mempertahankan divisi', () => {
    expect(
      inputEvaluasiSah({ divisiId: ' d1 ', berjalanBaik: ' lancar ', kurang: ' piring kurang ', usulan: ' rak tiris ' }),
    ).toEqual({ divisiId: 'd1', berjalanBaik: 'lancar', kurang: 'piring kurang', usulan: 'rak tiris' });
  });

  it('menolak tanpa divisi', () => {
    expect(() => inputEvaluasiSah({ divisiId: '', berjalanBaik: 'a', kurang: '', usulan: '' })).toThrow(EvaluasiError);
  });

  it('menolak bila ketiga kolom kosong — tidak ada yang bisa dipelajari', () => {
    expect(() => inputEvaluasiSah({ divisiId: 'd1', berjalanBaik: '   ', kurang: '', usulan: '' })).toThrow(
      EvaluasiError,
    );
  });

  it('usulan saja (tanpa baik/kurang) tetap sah — cukup sebagai bahan promosi', () => {
    const hasil = inputEvaluasiSah({ divisiId: 'd1', berjalanBaik: '', kurang: '', usulan: 'tambah rak tiris' });
    expect(hasil.usulan).toBe('tambah rak tiris');
  });
});

describe('faseTerakhir', () => {
  it('memilih urutan terbesar, bukan posisi terakhir di array', () => {
    const fases = [fase('f3', 't1', 3), fase('f1', 't1', 1), fase('f2', 't1', 2)];
    expect(faseTerakhir(fases)?.id).toBe('f3');
  });

  it('daftar kosong menghasilkan null', () => {
    expect(faseTerakhir([])).toBeNull();
  });
});

describe('itemDariUsulan', () => {
  it('membuat item milik fase target, urutan diberikan, tidak wajib, dengan catatan asal', () => {
    const target = fase('f9', 't-baru', 4);
    const item = itemDariUsulan('Sediakan rak tiris tambahan', 'd-konsumsi', target, 7);
    expect(item.templateId).toBe('t-baru');
    expect(item.faseId).toBe('f9');
    expect(item.divisiId).toBe('d-konsumsi');
    expect(item.judul).toBe('Sediakan rak tiris tambahan');
    expect(item.urutan).toBe(7);
    expect(item.wajib).toBe(false);
    expect(item.catatan).toContain('promosi evaluasi');
    expect(item.id).toBeTruthy();
  });
});
