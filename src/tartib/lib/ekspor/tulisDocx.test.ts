// Round-trip ekspor → impor: DOCX hasil tulisDocx harus terbaca ulang oleh
// dokumenXmlKeSop tanpa kehilangan fase, offset, dan item (Gate W).

import { describe, expect, it } from 'vitest';
import { tulisDocx, type DataTulisDocx } from './tulisDocx';
import { bacaZip } from '../impor/zip';
import { parseXmlLite } from '../impor/xml';
import { dokumenXmlKeSop } from '../impor/dokumenSop';

async function imporUlang(data: DataTulisDocx) {
  const zip = await tulisDocx(data);
  const isi = await bacaZip(zip.buffer as ArrayBuffer);
  const xml = new TextDecoder().decode(isi.get('word/document.xml'));
  return dokumenXmlKeSop(parseXmlLite(xml));
}

describe('tulisDocx', () => {
  it('membangun arsip ZIP berisi tiga entry inti', async () => {
    const zip = await tulisDocx({ nama: 'SOP Contoh', jenisNama: 'Maulid', fases: [] });
    const isi = await bacaZip(zip.buffer as ArrayBuffer);
    expect(Array.from(isi.keys()).sort()).toEqual(['[Content_Types].xml', '_rels/.rels', 'word/document.xml']);
  });

  it('round-trip: impor ulang menghasilkan judul, fase, dan item yang sama', async () => {
    const data: DataTulisDocx = {
      nama: 'SOP Acara Maulid',
      jenisNama: 'Maulid Nabi',
      catatan: 'Versi 1',
      fases: [
        {
          label: 'Penetapan',
          offsetHari: -30,
          items: [
            { judul: 'Bentuk panitia' },
            { judul: 'Siapkan anggaran kegiatan' },
          ],
        },
        {
          label: 'Persiapan',
          offsetHari: 0,
          items: [{ judul: 'Jalankan rundown acara' }],
        },
        {
          label: 'Evaluasi',
          offsetHari: 1,
          items: [{ judul: 'Rapat evaluasi bersama panitia' }],
        },
      ],
    };

    const hasil = await imporUlang(data);
    expect(hasil.judulDokumen).toBe('SOP Acara Maulid');
    expect(hasil.subJudul).toBe('Maulid Nabi — Versi 1');
    expect(hasil.fases.map((f) => [f.label, f.offsetHari])).toEqual([
      ['Penetapan', -30],
      ['Persiapan', 0],
      ['Evaluasi', 1],
    ]);
    expect(hasil.fases.map((f) => f.items.map((i) => i.judul))).toEqual([
      ['Bentuk panitia', 'Siapkan anggaran kegiatan'],
      ['Jalankan rundown acara'],
      ['Rapat evaluasi bersama panitia'],
    ]);
  });

  it('meloloskan karakter khusus XML pada judul, fase, dan item', async () => {
    const data: DataTulisDocx = {
      nama: 'SOP & <panduan>',
      jenisNama: 'Acara "Bersih"',
      fases: [
        {
          label: 'Rapat & evaluasi <internal>',
          offsetHari: -7,
          items: [{ judul: 'Siapkan mic & sound > 2 unit' }],
        },
      ],
    };

    const hasil = await imporUlang(data);
    expect(hasil.judulDokumen).toBe('SOP & <panduan>');
    expect(hasil.fases[0].label).toBe('Rapat & evaluasi <internal>');
    expect(hasil.fases[0].items[0].judul).toBe('Siapkan mic & sound > 2 unit');
  });

  it('tetap menghasilkan dokumen valid tanpa fase', async () => {
    const hasil = await imporUlang({ nama: 'SOP Kosong', jenisNama: 'Kajian', fases: [] });
    expect(hasil.judulDokumen).toBe('SOP Kosong');
    expect(hasil.subJudul).toBe('Kajian');
    expect(hasil.fases).toEqual([]);
  });
});
