// Penulis DOCX untuk ekspor PAPAN SOP berdiri sendiri (Batch Y) — Amanah &
// Khidmah / SOP kustom. Kebalikan dari importer (lib/impor/dokumenSopPapan).
//
// Mengikuti pola tulisDocx (Batch W/sesi 15): document.xml terbaca manusia
// (☐ item, ↳ sub-tugas,PIC/rutin/catatan ikut tertulis), plus entry
// `tartib/sop.json` berisi SELURUH data papan agar ekspor → impor ulang
// round-trip tanpa kehilangan. Berkas tetap .docx sah — Word mengabaikan
// entry tambahan. Fungsi murni; unduhan dilakukan lapisan UI.

import { buatZip } from '../impor/zip';
import { DEKLARASI, KONTEN_TYPES, NS_W, RELS, paragrafBiasa } from './tulisDocx';

export interface SubItemDocxSop {
  judul: string;
  picNama?: string;
  catatan?: string;
}

export interface ItemDocxSop {
  judul: string;
  picNama?: string;
  catatan?: string;
  rutin?: string;
  sub?: SubItemDocxSop[];
}

export interface DataTulisDocxSop {
  judul: string;
  catatan?: string;
  items: ItemDocxSop[];
}

/** Data lengkap papan dalam entry tartib/sop.json (round-trip penuh). */
export interface JsonSopPapanTartib {
  format: 'tartib-sop';
  versiFormat: number;
  judul: string;
  catatan?: string;
  items: Array<{
    urutan?: number;
    judul: string;
    picNama?: string;
    catatan?: string;
    rutin?: string;
    sub?: Array<{ urutan?: number; judul: string; picNama?: string; catatan?: string }>;
  }>;
}

export function susunJsonSopPapan(data: DataTulisDocxSop): JsonSopPapanTartib {
  return {
    format: 'tartib-sop',
    versiFormat: 1,
    judul: data.judul,
    catatan: data.catatan,
    items: data.items.map((it, i) => ({
      urutan: i + 1,
      judul: it.judul,
      picNama: it.picNama,
      catatan: it.catatan,
      rutin: it.rutin,
      sub: (it.sub ?? []).map((s, j) => ({
        urutan: j + 1,
        judul: s.judul,
        picNama: s.picNama,
        catatan: s.catatan,
      })),
    })),
  };
}

/** Satu baris "— " atribut: bagian kosong dilewati supaya dokumen tetap bersih. */
export function atributBaris(bagian: Array<[string, string | undefined]>): string {
  return bagian
    .filter(([, nilai]) => nilai !== undefined && nilai !== null && String(nilai).trim() !== '')
    .map(([label, nilai]) => ` — ${label}: ${String(nilai).trim()}`)
    .join('');
}

/** Baris item untuk dokumen: "☐ {judul} — PIC: … — Rutin: … — Catatan: …". */
export function barisItemPapan(item: ItemDocxSop): string {
  const tambahan = atributBaris([
    ['PIC', item.picNama],
    ['Rutin', item.rutin],
    ['Catatan', item.catatan],
  ]);
  return `☐ ${item.judul}${tambahan}`;
}

/** Baris sub-tugas: "☐ ↳ {judul} — …" (tetap berawalan ☐ agar importer mengenalinya). */
export function barisSubPapan(sub: SubItemDocxSop): string {
  const tambahan = atributBaris([
    ['PIC', sub.picNama],
    ['Catatan', sub.catatan],
  ]);
  return `☐ ↳ ${sub.judul}${tambahan}`;
}

/** Bangun berkas .docx (ZIP: inti + word/document.xml + data penuh papan). */
export async function tulisDocxSop(data: DataTulisDocxSop): Promise<Uint8Array<ArrayBuffer>> {
  const paragraf: string[] = [paragrafBiasa(data.judul)];
  const subJudul =
    data.catatan && data.catatan.trim() !== '' ? `SOP Tartib — ${data.catatan}` : 'SOP Tartib';
  paragraf.push(paragrafBiasa(subJudul));
  for (const item of data.items) {
    paragraf.push(paragrafBiasa(barisItemPapan(item)));
    for (const sub of item.sub ?? []) paragraf.push(paragrafBiasa(barisSubPapan(sub)));
  }
  const documentXml = `${DEKLARASI}<w:document xmlns:w="${NS_W}"><w:body>${paragraf.join('')}<w:sectPr/></w:body></w:document>`;

  return buatZip([
    { nama: '[Content_Types].xml', isi: new TextEncoder().encode(KONTEN_TYPES) },
    { nama: '_rels/.rels', isi: new TextEncoder().encode(RELS) },
    { nama: 'word/document.xml', isi: new TextEncoder().encode(documentXml) },
    {
      nama: 'tartib/sop.json',
      isi: new TextEncoder().encode(JSON.stringify(susunJsonSopPapan(data))),
    },
  ]);
}
