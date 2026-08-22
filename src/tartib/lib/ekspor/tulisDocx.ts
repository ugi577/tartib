// Penulis DOCX untuk ekspor template SOP (Batch W) — kebalikan dari importer
// dokumen (lib/impor/dokumenSop): paragraf pertama = judul template, paragraf
// kedua = jenis acara (sub-judul), fase = paragraf tebal berawalan offset H
// (H-30, Hari H, H+1), item = paragraf berawalan ☐. Hasilnya bisa dibuka di
// Word/LibreOffice dan diimpor ulang tanpa kehilangan struktur.
// Fungsi murni — tidak menyentuh IndexedDB; unduhan dilakukan lapisan UI.

import { formatOffsetHari } from '../tanggal';
import { buatZip } from '../impor/zip';

export interface FaseDocx {
  label: string;
  offsetHari: number;
  items: Array<{ judul: string }>;
}

export interface DataTulisDocx {
  nama: string;
  jenisNama: string;
  catatan?: string;
  fases: FaseDocx[];
}

const NS_W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const DEKLARASI = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';

const KONTEN_TYPES = `${DEKLARASI}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`;

const RELS = `${DEKLARASI}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`;

function escapeXml(teks: string): string {
  return teks.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function paragrafBiasa(teks: string): string {
  return `<w:p><w:r><w:t xml:space="preserve">${escapeXml(teks)}</w:t></w:r></w:p>`;
}

// Fase: seluruh run tebal (w:b) dan teks diawali offset H agar importer
// mengenalinya sebagai fase, bukan sub-judul.
function paragrafFase(fase: FaseDocx): string {
  const teks = `${formatOffsetHari(fase.offsetHari)} — ${fase.label}`;
  return `<w:p><w:pPr><w:rPr><w:b/></w:rPr></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">${escapeXml(teks)}</w:t></w:r></w:p>`;
}

function paragrafItem(judul: string): string {
  return `<w:p><w:r><w:t xml:space="preserve">${escapeXml(`☐ ${judul}`)}</w:t></w:r></w:p>`;
}

function teksBytes(teks: string): Uint8Array {
  return new TextEncoder().encode(teks);
}

/** Bangun berkas .docx (ZIP berisi [Content_Types].xml, _rels/.rels, document.xml). */
export async function tulisDocx(data: DataTulisDocx): Promise<Uint8Array<ArrayBuffer>> {
  const paragraf: string[] = [paragrafBiasa(data.nama)];
  const subJudul =
    data.catatan && data.catatan.trim() !== '' ? `${data.jenisNama} — ${data.catatan}` : data.jenisNama;
  paragraf.push(paragrafBiasa(subJudul));

  for (const fase of data.fases) {
    paragraf.push(paragrafFase(fase));
    for (const item of fase.items) paragraf.push(paragrafItem(item.judul));
  }

  const documentXml = `${DEKLARASI}<w:document xmlns:w="${NS_W}"><w:body>${paragraf.join('')}<w:sectPr/></w:body></w:document>`;

  return buatZip([
    { nama: '[Content_Types].xml', isi: teksBytes(KONTEN_TYPES) },
    { nama: '_rels/.rels', isi: teksBytes(RELS) },
    { nama: 'word/document.xml', isi: teksBytes(documentXml) },
  ]);
}
