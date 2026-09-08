// Uji fungsi murni penempatan context menu (sesi 22): jepit ke viewport
// dengan margin 10px, sisakan ruang kapsul nav bawah 88px, dan penempatan
// relatif jangkar (bawah → atas → jepit).

import { describe, expect, it } from 'vitest';
import { hitungPosisiMenu } from './ContextMenu';

const HP = { lebar: 375, tinggi: 667 }; // viewport HP umum
const MENU = { lebar: 224, tinggi: 200 };

describe('hitungPosisiMenu', () => {
  it('memakai titik x,y apa adanya bila muat di viewport', () => {
    expect(hitungPosisiMenu(MENU, HP, { x: 40, y: 60 })).toEqual({ left: 40, top: 60 });
  });

  it('menjepit ke kanan & bawah: margin 10px dan ruang nav 88px', () => {
    const p = hitungPosisiMenu(MENU, HP, { x: 370, y: 660 });
    expect(p.left).toBe(375 - 224 - 10);
    expect(p.top).toBe(667 - 88 - 200);
  });

  it('menjepit ke kiri & atas dengan margin 10px', () => {
    expect(hitungPosisiMenu(MENU, HP, { x: -30, y: 0 })).toEqual({ left: 10, top: 10 });
  });

  it('menu lebih tinggi dari ruang tersedia tetap mulai dari margin atas', () => {
    const tinggiSekali = { lebar: 224, tinggi: 900 };
    expect(hitungPosisiMenu(tinggiSekali, HP, { x: 100, y: 300 }).top).toBe(10);
  });

  it('jangkar: diletakkan di bawah jangkar bila muat', () => {
    const anchor = { left: 20, top: 100, bottom: 140, right: 200, width: 180, height: 40 };
    expect(hitungPosisiMenu(MENU, HP, { x: 0, y: 0, anchor })).toEqual({ left: 20, top: 146 });
  });

  it('jangkar: pindah ke atas jangkar bila di bawah tidak muat', () => {
    const anchor = { left: 20, top: 500, bottom: 540, right: 200, width: 180, height: 40 };
    // Di bawah: 546 + 200 > 579 → di atas: 500 - 6 - 200 = 294
    expect(hitungPosisiMenu(MENU, HP, { x: 0, y: 0, anchor })).toEqual({ left: 20, top: 294 });
  });

  it('jangkar: bila atas maupun bawah tidak muat, dijepit ke batas bawah', () => {
    const anchor = { left: 300, top: 150, bottom: 190, right: 340, width: 40, height: 40 };
    const p = hitungPosisiMenu({ lebar: 224, tinggi: 420 }, HP, { x: 0, y: 0, anchor });
    // Di bawah: 196 + 420 > 579; di atas: 150 - 6 - 420 < 10 → jepit
    expect(p).toEqual({ left: 375 - 224 - 10, top: 667 - 88 - 420 });
  });

  it('menerima DOMRect-like dengan properti tambahan (x, y)', () => {
    const rect = { x: 5, y: 5, left: 5, top: 5, bottom: 45, right: 105, width: 100, height: 40 };
    expect(hitungPosisiMenu(MENU, HP, { x: 0, y: 0, anchor: rect })).toEqual({ left: 10, top: 51 });
  });
});
