import { tartibDb } from '../db/schema';
import { aturanPage } from '../lib/cetak/kertas';
import type { CetakPayload, TartibHost } from './TartibHost';

// Host mandiri: database tartib-db sendiri. Cabang, jumlah santri, dan
// petugas diisi manual (belum ada formulirnya di Batch A — hasil placeholder
// yang aman); cetak memakai window.print().

const ID_STYLE_PAGE = 'tartib-page';
const KELAS_BODY = 'cetak-lembar';
const KELAS_JALUR = 'cetak-jalur';

/**
 * Cetak lembar Kanvas (sesi 22). Tiga hal yang dulu tidak pernah berlaku:
 *  1. @page ditulis bersarang di globals.css (tidak valid → dibuang browser),
 *     kini disuntik sebagai <style> tepat sebelum window.print() — satu-satunya
 *     cara membuat ukuran/orientasi kertas dinamis.
 *  2. Kerangka layar (padding main, meja kerja abu, toolbar) ikut tercetak;
 *     kini body diberi kelas `cetak-lembar` dan setiap LELUHUR lembar diberi
 *     `cetak-jalur` sehingga CSS cetak bisa menyembunyikan saudara-saudaranya
 *     dan mereset margin/padding/transform di sepanjang jalur — tanpa
 *     merender ulang dokumen.
 *  3. Semua penanda dicabut pada `afterprint` (atau setelah tenggat bila
 *     WebView tidak memancarkannya), jadi tidak mencemari cetakan lain.
 */
function cetakLembarKanvas(payload: Extract<CetakPayload, { jenis: 'kanvas' }>): Promise<void> {
  return new Promise((selesai) => {
    const lembar = document.getElementById('print-ready-sheet');
    const style = document.createElement('style');
    style.id = ID_STYLE_PAGE;
    style.textContent = aturanPage(payload.kertas, payload.orientasi);
    document.head.appendChild(style);

    const jalur: HTMLElement[] = [];
    let el = lembar?.parentElement ?? null;
    while (el && el !== document.body) {
      el.classList.add(KELAS_JALUR);
      jalur.push(el);
      el = el.parentElement;
    }
    document.body.classList.add(KELAS_BODY);

    let sudah = false;
    const bersihkan = () => {
      if (sudah) return;
      sudah = true;
      style.remove();
      jalur.forEach((e) => e.classList.remove(KELAS_JALUR));
      document.body.classList.remove(KELAS_BODY);
      selesai();
    };
    window.addEventListener('afterprint', bersihkan, { once: true });
    window.print();
    // window.print() memblokir sampai dialog ditutup di browser desktop; di
    // WebView yang tidak membuka dialog, tenggat ini yang memulihkan layar.
    window.setTimeout(bersihkan, 1500);
  });
}

export const standaloneHost: TartibHost = {
  db: tartibDb,
  getCabangList: async () => [],
  getJumlahSantri: async () => 0,
  cariPetugas: async () => [],
  cetak: async (payload) => {
    if (payload.jenis === 'kanvas') {
      await cetakLembarKanvas(payload);
      return;
    }
    window.print();
  },
};
