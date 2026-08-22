// Round-trip ekspor → impor: DOCX hasil tulisDocx harus terbaca ulang oleh
// dokumenXmlKeSop tanpa kehilangan fase, offset, dan item (Gate W).

import { describe, expect, it } from 'vitest';
import { tulisDocx, type DataTulisDocx } from './tulisDocx';
import { bacaZip } from '../impor/zip';
import { parseXmlLite } from '../impor/xml';
import { dokumenXmlKeSop, sopDariJson } from '../impor/dokumenSop';

async function imporUlang(data: DataTulisDocx) {
  const zip = await tulisDocx(data);
  const isi = await bacaZip(zip.buffer as ArrayBuffer);
  const xml = new TextDecoder().decode(isi.get('word/document.xml'));
  return dokumenXmlKeSop(parseXmlLite(xml));
}

describe('tulisDocx', () => {
  it('membangun arsip ZIP berisi entry inti + data lengkap Tartib', async () => {
    const zip = await tulisDocx({ nama: 'SOP Contoh', jenisNama: 'Maulid', fases: [] });
    const isi = await bacaZip(zip.buffer as ArrayBuffer);
    expect(Array.from(isi.keys()).sort()).toEqual([
      '[Content_Types].xml',
      '_rels/.rels',
      'tartib/template.json',
      'word/document.xml',
    ]);
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

  it('round-trip LENGKAP: data tersimpan di tartib/template.json tanpa kehilangan apa pun', async () => {
    const data: DataTulisDocx = {
      nama: 'SOP Maulid Akbar',
      jenisNama: 'Maulid',
      catatan: 'Catatan template asli',
      versi: 3,
      fases: [
        {
          label: 'Penetapan',
          offsetHari: -30,
          urutan: 1,
          items: [
            { judul: 'Bentuk panitia', divisi: 'Ketua Panitia', catatan: 'Pilih ketua', wajib: true, rumusQty: 'porsi' },
            { judul: 'Susun anggaran', divisi: 'Bendahara', catatan: 'Rincian', wajib: false },
          ],
        },
        {
          label: 'Evaluasi',
          offsetHari: 1,
          urutan: 2,
          items: [{ judul: 'Rapat evaluasi', divisi: 'Sekretaris', catatan: '', wajib: true }],
        },
      ],
    };

    const zip = await tulisDocx(data);
    const isi = await bacaZip(zip.buffer as ArrayBuffer);
    const json = isi.get('tartib/template.json');
    expect(json).toBeDefined();
    const hasil = sopDariJson(new TextDecoder().decode(json));

    expect(hasil.judulDokumen).toBe('SOP Maulid Akbar');
    expect(hasil.jenisAcaraNama).toBe('Maulid');
    expect(hasil.catatan).toBe('Catatan template asli');
    expect(hasil.fases).toHaveLength(2);
    expect(hasil.fases[0]).toMatchObject({ label: 'Penetapan', offsetHari: -30, urutan: 1 });
    expect(hasil.fases[1]).toMatchObject({ label: 'Evaluasi', offsetHari: 1, urutan: 2 });
    expect(hasil.fases[0].items).toEqual([
      { judul: 'Bentuk panitia', divisiTebakan: 'Ketua Panitia', catatan: 'Pilih ketua', wajib: true, rumusQty: 'porsi' },
      { judul: 'Susun anggaran', divisiTebakan: 'Bendahara', catatan: 'Rincian', wajib: false, rumusQty: undefined },
    ]);
    expect(hasil.fases[1].items).toEqual([
      { judul: 'Rapat evaluasi', divisiTebakan: 'Sekretaris', catatan: '', wajib: true, rumusQty: undefined },
    ]);
    expect(hasil.itemLuarLinimasa).toEqual([]);
  });
});
