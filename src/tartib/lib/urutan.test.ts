import { describe, expect, it } from 'vitest';
import { urutanBerikutnya } from './urutan';

describe('urutanBerikutnya', () => {
  it('kosong → 1', () => {
    expect(urutanBerikutnya([])).toBe(1);
  });

  it('urutan rapat → max + 1', () => {
    expect(urutanBerikutnya([{ urutan: 1 }, { urutan: 2 }, { urutan: 3 }])).toBe(4);
  });

  it('tidak merapat ke lubang setelah hapus', () => {
    expect(urutanBerikutnya([{ urutan: 1 }, { urutan: 3 }])).toBe(4);
    expect(urutanBerikutnya([{ urutan: 5 }])).toBe(6);
  });
});
