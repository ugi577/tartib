// Test hitungPerlengkapan (Batch D) — fungsi murni, tanpa IndexedDB.
// Konteks pakai fixture 21 Agustus 2026 (docs/PRD.md 5.4): porsi 240.
import { describe, expect, it } from 'vitest';
import type { Perlengkapan, Tugas } from '../types';
import { hitungPerlengkapan, PerlengkapanError } from './perlengkapanService';

function tugas(id: string, judul: string, divisiId: string, rumusQty?: string): Tugas {
  return {
    id,
    acaraId: 'a1',
    faseId: 'f1',
    divisiId,
    judul,
    catatan: '',
    wajib: true,
    status: 'BELUM',
    urutan: 1,
    rumusQty,
  };
}

const KONTEKS = { porsi: 240, santri: 47, panitia: 20, rsvp: 130 };

describe('hitungPerlengkapan', () => {
  it('mengabaikan tugas tanpa rumusQty', () => {
    const hasil = hitungPerlengkapan([tugas('t1', 'Sambutan panitia', 'd1')], [], 'a1', KONTEKS);
    expect(hasil).toEqual([]);
  });

  it('menghitung qtyHitung dari rumusQty (fixture peralatan 144/264)', () => {
    const tugasList = [
      tugas('t1', 'Peralatan makan (dengan pencuci)', 'd1', 'ceil(porsi * 0.6)'),
      tugas('t2', 'Peralatan makan (tanpa pencuci)', 'd2', 'ceil(porsi * 1.1)'),
    ];
    const hasil = hitungPerlengkapan(tugasList, [], 'a1', KONTEKS);
    expect(hasil.map((p) => p.qtyHitung)).toEqual([144, 264]);
    expect(hasil.map((p) => p.qtyFinal)).toEqual([144, 264]);
    expect(hasil.every((p) => p.status === 'BELUM' && p.acaraId === 'a1')).toBe(true);
    expect(hasil[0].divisiId).toBe('d1');
  });

  it('baris baru: qtyFinal = qtyHitung; baris existing: qtyFinal dipertahankan', () => {
    const tugasList = [tugas('t1', 'Nasi kotak', 'd1', 'porsi')];
    const existing: Perlengkapan[] = [
      { id: 'p1', acaraId: 'a1', divisiId: 'd1', nama: 'Nasi kotak', satuan: 'kotak', qtyHitung: 200, qtyFinal: 250, status: 'SELESAI', catatan: 'ditimpa manual' },
    ];
    const hasil = hitungPerlengkapan(tugasList, existing, 'a1', KONTEKS);
    expect(hasil).toHaveLength(1);
    expect(hasil[0].id).toBe('p1');
    expect(hasil[0].qtyHitung).toBe(240); // ditulis ulang
    expect(hasil[0].qtyFinal).toBe(250); // override manual tidak tersentuh
    expect(hasil[0].satuan).toBe('kotak');
    expect(hasil[0].status).toBe('SELESAI');
  });

  it('melempar PerlengkapanError bila rumusQty tidak sah, menyebut judul tugas', () => {
    const tugasList = [tugas('t1', 'Item rusak', 'd1', 'porsi * eval(1)')];
    expect(() => hitungPerlengkapan(tugasList, [], 'a1', KONTEKS)).toThrow(PerlengkapanError);
    expect(() => hitungPerlengkapan(tugasList, [], 'a1', KONTEKS)).toThrow(/Item rusak/);
  });
});
