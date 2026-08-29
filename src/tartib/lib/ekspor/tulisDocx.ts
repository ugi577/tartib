// Penulis DOCX untuk ekspor template SOP (Batch W) — kebalikan dari importer
// dokumen (lib/impor/dokumenSop): paragraf pertama = judul template, paragraf
// kedua = jenis acara (sub-judul), fase = paragraf tebal berawalan offset H
// (H-30, Hari H, H+1), item = paragraf berawalan ☐. Hasilnya bisa dibuka di
// Word/LibreOffice.
//
// Round-trip LENGKAP (sesi 15, arahan Ahmed "pastikan tdk ada bagian yg tidak
// di export-import"): selain document.xml yang terbaca manusia, arsip membawa
// entry `tartib/template.json` berisi SELURUH data template — nama, jenis,
// catatan, versi, urutan, fase, dan per item: divisi, catatan, wajib, rumusQty.
// Importer memakai entry ini bila ada, sehingga ekspor → impor ulang tidak
// kehilangan apa pun. Berkas tetap .docx sah: Word mengabaikan entry tambahan.
// Fungsi murni — tidak menyentuh IndexedDB; unduhan dilakukan lapisan UI.

import { formatOffsetHari } from '../tanggal';
import { buatZip } from '../impor/zip';
import type { JsonTemplateTartib } from '../impor/dokumenSop';

export interface ItemDocx {
  judul: string;
  divisi?: string;
  catatan?: string;
  wajib?: boolean;
  rumusQty?: string;
}

export interface FaseDocx {
  label: string;
  offsetHari: number;
  urutan?: number;
  items: ItemDocx[];
}

export interface DataTulisDocx {
  nama: string;
  jenisNama: string;
  catatan?: string;
  versi?: number;
  fases: FaseDocx[];
}

const NS_W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const DEKLARASI = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';

// Diekspor untuk penulis DOCX lain (tulisDocxSop — Batch Y) agar bentuk arsip
// tidak terduplikasi dan tidak saling meleset.
export { NS_W, DEKLARASI };

export const KONTEN_TYPES = `${DEKLARASI}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`;

export const RELS = `${DEKLARASI}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`;

export function escapeXml(teks: string): string {
  return teks.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function paragrafBiasa(teks: string): string {
  return `<w:p><w:r><w:t xml:space="preserve">${escapeXml(teks)}</w:t></w:r></w:p>`;
}

// Fase: seluruh run tebal (w:b) dan teks diawali offset H agar importer
// mengenalinya sebagai fase, bukan sub-judul.
function paragrafFase(fase: FaseDocx): string {
  const teks = `${formatOffsetHari(fase.offsetHari)} — ${fase.label}`;
  return `<w:p><w:pPr><w:rPr><w:b/></w:rPr></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">${escapeXml(teks)}</w:t></w:r></w:p>`;
}

// Item: judul + catatan + divisi, supaya berkas Word-nya juga terbaca lengkap.
function paragrafItem(item: ItemDocx): string {
  const tambahan = `${item.catatan ? ` — ${item.catatan}` : ''}${item.divisi ? ` (${item.divisi})` : ''}`;
  return `<w:p><w:r><w:t xml:space="preserve">${escapeXml(`☐ ${item.judul}${tambahan}`)}</w:t></w:r></w:p>`;
}

function teksBytes(teks: string): Uint8Array {
  return new TextEncoder().encode(teks);
}

/** Susun data lengkap template sebagai JSON (entry tartib/template.json). */
export function susunJsonTartib(data: DataTulisDocx): JsonTemplateTartib {
  return {
    format: 'tartib-template',
    versiFormat: 1,
    nama: data.nama,
    jenisAcara: data.jenisNama,
    catatan: data.catatan,
    versi: data.versi,
    fases: data.fases.map((f, iFase) => ({
      urutan: f.urutan ?? iFase + 1,
      label: f.label,
      offsetHari: f.offsetHari,
      items: f.items.map((it, iItem) => ({
        urutan: iItem + 1,
        judul: it.judul,
        divisi: it.divisi,
        catatan: it.catatan,
        wajib: it.wajib,
        rumusQty: it.rumusQty,
      })),
    })),
  };
}

/** Bangun berkas .docx (ZIP: inti + word/document.xml + data penuh Tartib). */
export async function tulisDocx(data: DataTulisDocx): Promise<Uint8Array<ArrayBuffer>> {
  const paragraf: string[] = [paragrafBiasa(data.nama)];
  const subJudul =
    data.catatan && data.catatan.trim() !== '' ? `${data.jenisNama} — ${data.catatan}` : data.jenisNama;
  paragraf.push(paragrafBiasa(subJudul));

  for (const fase of data.fases) {
    paragraf.push(paragrafFase(fase));
    for (const item of fase.items) paragraf.push(paragrafItem(item));
  }

  const documentXml = `${DEKLARASI}<w:document xmlns:w="${NS_W}"><w:body>${paragraf.join('')}<w:sectPr/></w:body></w:document>`;

  return buatZip([
    { nama: '[Content_Types].xml', isi: teksBytes(KONTEN_TYPES) },
    { nama: '_rels/.rels', isi: teksBytes(RELS) },
    { nama: 'word/document.xml', isi: teksBytes(documentXml) },
    { nama: 'tartib/template.json', isi: teksBytes(JSON.stringify(susunJsonTartib(data))) },
  ]);
}
