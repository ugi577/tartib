import { describe, expect, it } from 'vitest';
import { parseRumusQty, RumusError } from './rumusQty';

const konteks = { porsi: 240, santri: 47, panitia: 20, rsvp: 130 };

describe('parseRumusQty — ekspresi sah', () => {
  it('variabel tunggal', () => {
    expect(parseRumusQty('porsi', konteks)).toBe(240);
    expect(parseRumusQty('santri', konteks)).toBe(47);
    expect(parseRumusQty('panitia', konteks)).toBe(20);
    expect(parseRumusQty('rsvp', konteks)).toBe(130);
  });

  it('angka polos dan spasi bebas', () => {
    expect(parseRumusQty('  40 ', konteks)).toBe(40);
    expect(parseRumusQty('porsi + santri', konteks)).toBe(287);
  });

  it('operasi campuran mengikuti prioritas operator', () => {
    expect(parseRumusQty('porsi + santri * 2', konteks)).toBe(334);
    expect(parseRumusQty('(porsi + santri) * 2', konteks)).toBe(574);
    expect(parseRumusQty('porsi / 2', konteks)).toBe(120);
    expect(parseRumusQty('porsi - 40', konteks)).toBe(200);
    expect(parseRumusQty('porsi * 1.1', konteks)).toBeCloseTo(264);
  });

  it('ceil dan round', () => {
    expect(parseRumusQty('ceil(porsi * 0.6)', konteks)).toBe(144);
    expect(parseRumusQty('round(porsi / 3)', konteks)).toBe(80);
    expect(parseRumusQty('ceil((porsi + santri) / 2)', konteks)).toBe(144);
  });
});

describe('parseRumusQty — input berbahaya DITOLAK (A-04)', () => {
  const tolak = (ekspresi: string) => {
    expect(() => parseRumusQty(ekspresi, konteks), `harus tolak: "${ekspresi}"`).toThrow(RumusError);
  };

  it('menolak eval dan pemanggilan fungsi apa pun di luar whitelist', () => {
    tolak('eval("porsi")');
    tolak('eval(porsi)');
    tolak('alert(1)');
    tolak('Math.ceil(porsi)');
    tolak('fetch("http://x")');
    tolak('globalThis');
  });

  it('menolak variabel tak dikenal', () => {
    tolak('porsi + jumlah');
    tolak('porsi + x');
  });

  it('menolak token tak dikenal (string, titik koma, akses properti)', () => {
    tolak("'porsi'");
    tolak('porsi; rm -rf /');
    tolak('porsi.constructor');
    tolak('porsi[0]');
  });

  it('menolak ekspresi kosong atau tidak lengkap', () => {
    tolak('');
    tolak('   ');
    tolak('porsi +');
    tolak('(porsi');
    tolak('porsi)');
    tolak('ceil(porsi');
    tolak('ceil()');
    tolak('()');
  });

  it('menolak arity salah pada ceil/round', () => {
    tolak('ceil(porsi, santri)');
    tolak('round(porsi + santri, 2)');
  });

  it('menolak pembagian dengan nol', () => {
    tolak('porsi / 0');
    tolak('1 / (porsi - porsi)');
  });
});
