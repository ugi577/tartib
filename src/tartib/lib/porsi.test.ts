import { describe, expect, it } from 'vitest';
import { hitungPeralatan, hitungPorsi } from './porsi';

// Fixture 21 Agustus 2026 (docs/PRD.md 5.4):
// rsvp 130, santri 47, panitia 20, cadangan 10, buffer 25%
// → porsi = ceil(130 × 1,25) + 47 + 20 + 10 = 163 + 77 = 240
// → peralatan = ceil(240 × 0,6) = 144 (dengan tim pencuci)
//              = ceil(240 × 1,1) = 264 (tanpa tim pencuci)
describe('hitungPorsi', () => {
  it('fixture 21 Agustus 2026 → 240', () => {
    expect(hitungPorsi({ rsvpHadir: 130, jumlahSantri: 47, jumlahPanitia: 20, cadangan: 10 })).toBe(240);
  });

  it('default cadangan 10 dan buffer 25% memberi hasil yang sama', () => {
    expect(hitungPorsi({ rsvpHadir: 130, jumlahSantri: 47, jumlahPanitia: 20 })).toBe(240);
  });

  it('buffer 0% berarti tanpa buffer', () => {
    expect(hitungPorsi({ rsvpHadir: 100, jumlahSantri: 0, jumlahPanitia: 0, bufferPersen: 0 })).toBe(110);
  });

  it('buffer 20% tidak terpengaruh epsilon float (130 × 1,2 = 156,000…03)', () => {
    expect(hitungPorsi({ rsvpHadir: 130, jumlahSantri: 0, jumlahPanitia: 0, cadangan: 0, bufferPersen: 20 })).toBe(156);
  });

  it('pembulatan selalu ke atas: 1 rsvp dengan buffer 25% → 2', () => {
    expect(hitungPorsi({ rsvpHadir: 1, jumlahSantri: 0, jumlahPanitia: 0, cadangan: 0 })).toBe(2);
  });
});

describe('hitungPeralatan', () => {
  it('fixture dengan tim pencuci → 144', () => {
    expect(hitungPeralatan(240, true)).toBe(144);
  });

  it('fixture tanpa tim pencuci → 264', () => {
    expect(hitungPeralatan(240, false)).toBe(264);
  });

  it('dengan tim pencuci tidak pernah lebih besar dari tanpa tim pencuci', () => {
    expect(hitungPeralatan(100, true)).toBeLessThanOrEqual(hitungPeralatan(100, false));
  });
});
