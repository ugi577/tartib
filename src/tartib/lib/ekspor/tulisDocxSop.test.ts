// Round-trip ekspor → impor papan SOP (Batch Y): DOCX hasil tulisDocxSop
// harus terbaca ulang oleh dokumenSopPapan tanpa kehilangan judul, PIC,
// rutin, catatan, dan sub-tugas — lewat jalur JSON (penuh) maupun heuristik
// document.xml.

import { describe, expect, it } from 'vitest';
import { tulisDocxSop, barisItemPapan, barisSubPapan, type DataTulisDocxSop } from './tulisDocxSop';
import { bacaZip } from '../impor/zip';
import { parseXmlLite } from '../impor/xml';
import { dokumenXmlKeSopPapan, sopPapanDariJson, uraiBarisPapan } from '../impor/dokumenSopPapan';

const CONTOH: DataTulisDocxSop = {
  judul: 'Amanah & Khidmah Santri',
  catatan: 'papan semi-paten',
  items: [
    {
      judul: 'Imam shalat fardhu',
      picNama: 'Ahmad',
      rutin: 'Harian',
      catatan: 'giliran per pekan',
      sub: [{ judul: 'Set azan Maghrib', picNama: 'Fauzan', catatan: 'pukul 17.45' }],
    },
    { judul: 'Jaga malam (ronda)', rutin: 'Mingguan' },
  ],
};

async function imporUlang(data: DataTulisDocxSop) {
  const zip = await tulisDocxSop(data);
  const isi = await bacaZip(zip.buffer as ArrayBuffer);
  return isi;
}

describe('tulisDocxSop', () => {
  it('membangun arsip ZIP berisi entry inti + data papan Tartib', async () => {
    const isi = await imporUlang(CONTOH);
    expect(Array.from(isi.keys()).sort()).toEqual([
      '[Content_Types].xml',
      '_rels/.rels',
      'tartib/sop.json',
      'word/document.xml',
    ]);
  });

  it('baris dokumen memuat PIC, rutin, dan catatan; bagian kosong dilewati', () => {
    expect(barisItemPapan(CONTOH.items[0])).toBe(
      '☐ Imam shalat fardhu — PIC: Ahmad — Rutin: Harian — Catatan: giliran per pekan',
    );
    expect(barisItemPapan(CONTOH.items[1])).toBe('☐ Jaga malam (ronda) — Rutin: Mingguan');
    expect(barisSubPapan(CONTOH.items[0].sub![0])).toBe(
      '☐ ↳ Set azan Maghrib — PIC: Fauzan — Catatan: pukul 17.45',
    );
  });
});

describe('round-trip ekspor → impor papan SOP', () => {
  it('jalur JSON (tartib/sop.json): seluruh data kembali tanpa kehilangan', async () => {
    const isi = await imporUlang(CONTOH);
    const hasil = sopPapanDariJson(new TextDecoder().decode(isi.get('tartib/sop.json')));
    expect(hasil.dariJsonTartib).toBe(true);
    expect(hasil.judulDokumen).toBe('Amanah & Khidmah Santri');
    expect(hasil.catatan).toBe('papan semi-paten');
    expect(hasil.items).toHaveLength(2);
    expect(hasil.items[0]).toEqual({
      judul: 'Imam shalat fardhu',
      picNama: 'Ahmad',
      rutin: 'Harian',
      catatan: 'giliran per pekan',
      sub: [{ judul: 'Set azan Maghrib', picNama: 'Fauzan', catatan: 'pukul 17.45' }],
    });
    expect(hasil.items[1].sub).toBeUndefined();
  });

  it('jalur heuristik document.xml: item, sub ↳, PIC, rutin, catatan terurai benar', async () => {
    const isi = await imporUlang(CONTOH);
    const hasil = dokumenXmlKeSopPapan(parseXmlLite(new TextDecoder().decode(isi.get('word/document.xml'))));
    expect(hasil.judulDokumen).toBe('Amanah & Khidmah Santri');
    expect(hasil.dariJsonTartib).toBe(false);
    expect(hasil.items).toHaveLength(2);
    expect(hasil.items[0].judul).toBe('Imam shalat fardhu');
    expect(hasil.items[0].picNama).toBe('Ahmad');
    expect(hasil.items[0].rutin).toBe('Harian');
    expect(hasil.items[0].catatan).toBe('giliran per pekan');
    expect(hasil.items[0].sub).toEqual([{ judul: 'Set azan Maghrib', picNama: 'Fauzan', catatan: 'pukul 17.45' }]);
    expect(hasil.items[1].sub).toBeUndefined();
    expect(hasil.subTanpaInduk).toEqual([]);
    // Sub-judul "SOP Tartib — papan semi-paten" diabaikan.
    expect(hasil.paragrafDiabaikan).toBe(1);
  });

  it('menolak JSON asing / rusak', () => {
    expect(() => sopPapanDariJson('bukan json')).toThrow(/bukan JSON sah/);
    expect(() => sopPapanDariJson(JSON.stringify({ format: 'lain', judul: 'x', items: [] }))).toThrow(
      /tidak dikenal/,
    );
  });
});

describe('uraiBarisPapan', () => {
  it('mengurai atribut berlabel dan menjaga urutan catatan', () => {
    expect(uraiBarisPapan('Imam shalat — PIC: Ahmad — Rutin: Harian')).toEqual({
      judul: 'Imam shalat',
      picNama: 'Ahmad',
      rutin: 'Harian',
      catatan: undefined,
    });
    expect(uraiBarisPapan('Sapu keliling — area masjid')).toEqual({
      judul: 'Sapu keliling',
      picNama: undefined,
      rutin: undefined,
      catatan: 'area masjid',
    });
    expect(uraiBarisPapan('Piket')).toEqual({ judul: 'Piket', picNama: undefined, rutin: undefined, catatan: undefined });
  });
});
