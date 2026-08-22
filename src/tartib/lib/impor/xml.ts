// Parser XML minimal untuk impor dokumen (Batch V).
//
// Tidak ada library XML (BRIEF Bagian 4) dan Node tanpa jsdom tidak punya
// DOMParser, jadi dibuat parser non-validating yang cukup untuk document.xml
// DOCX: elemen (dengan prefiks namespace), atribut, teks, CDATA, komentar,
// dan deklarasi. Yang tidak didukung (entity custom, DTD internal, PI) tidak
// dipakai oleh document.xml buatan Word/LibreOffice.

/** Elemen hasil parse — teks adalah gabungan seluruh node teks langsung. */
export interface ElXml {
  nama: string;
  atribut: Record<string, string>;
  teks: string;
  anak: ElXml[];
}

export class XmlError extends Error {
  constructor(pesan: string) {
    super(pesan);
    this.name = 'XmlError';
  }
}

const ENTITAS: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
};

function dekodeTeks(s: string): string {
  return s.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (m, e: string) => {
    if (e[0] === '#') {
      const kode = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      if (Number.isFinite(kode)) return String.fromCodePoint(kode);
    }
    return ENTITAS[e] ?? m;
  });
}

/** Parse dokumen XML menjadi pohon elemen akar. */
export function parseXmlLite(xml: string): ElXml {
  const s = xml.trim();
  let i = 0;
  const n = s.length;

  function lewatiSpasi(): void {
    while (i < n && /\s/.test(s[i])) i += 1;
  }

  function namaTag(): string {
    const mulai = i;
    while (i < n && /[^\s/=>]/.test(s[i])) i += 1;
    return s.slice(mulai, i);
  }

  function atribut(): Record<string, string> {
    const hasil: Record<string, string> = {};
    for (;;) {
      lewatiSpasi();
      if (i >= n || s[i] === '>' || s[i] === '/') return hasil;
      const nama = namaTag();
      lewatiSpasi();
      if (s[i] !== '=') throw new XmlError(`Atribut "${nama}" tanpa nilai`);
      i += 1;
      lewatiSpasi();
      const kutip = s[i];
      if (kutip !== '"' && kutip !== "'") throw new XmlError('Nilai atribut harus dikutip');
      i += 1;
      const akhir = s.indexOf(kutip, i);
      if (akhir < 0) throw new XmlError('Kutipan atribut tidak ditutup');
      hasil[nama] = dekodeTeks(s.slice(i, akhir));
      i = akhir + 1;
    }
  }

  function elemen(): ElXml {
    // Asumsikan s[i] === '<' dan bukan komentar/deklarasi (dipanggil setelah cek).
    i += 1;
    const nama = namaTag();
    const atr = atribut();
    const el: ElXml = { nama, atribut: atr, teks: '', anak: [] };
    lewatiSpasi();
    if (s[i] === '/') {
      // Self-closing.
      i += 1;
      if (s[i] !== '>') throw new XmlError('Penutup self-closing tidak valid');
      i += 1;
      return el;
    }
    if (s[i] !== '>') throw new XmlError(`Tag <${nama}> tidak ditutup dengan benar`);
    i += 1;

    for (;;) {
      if (i >= n) throw new XmlError(`Elemen <${nama}> tidak ditutup`);
      if (s[i] === '<') {
        if (s.startsWith('<!--', i)) {
          const akhir = s.indexOf('-->', i + 4);
          if (akhir < 0) throw new XmlError('Komentar tidak ditutup');
          i = akhir + 3;
          continue;
        }
        if (s.startsWith('<![CDATA[', i)) {
          const akhir = s.indexOf(']]>', i + 9);
          if (akhir < 0) throw new XmlError('CDATA tidak ditutup');
          el.teks += s.slice(i + 9, akhir);
          i = akhir + 3;
          continue;
        }
        if (s.startsWith('</', i)) {
          i += 2;
          const tutup = namaTag();
          lewatiSpasi();
          if (s[i] !== '>') throw new XmlError(`Penutup </${tutup}> tidak valid`);
          i += 1;
          if (tutup !== nama) throw new XmlError(`</${tutup}> tidak cocok dengan <${nama}>`);
          return el;
        }
        el.anak.push(elemen());
        continue;
      }
      const akhir = s.indexOf('<', i);
      el.teks += dekodeTeks(s.slice(i, akhir < 0 ? n : akhir));
      i = akhir < 0 ? n : akhir;
    }
  }

  // Lewati deklarasi XML dan prolog lain di awal.
  for (;;) {
    lewatiSpasi();
    if (s.startsWith('<?', i)) {
      const akhir = s.indexOf('?>', i + 2);
      if (akhir < 0) throw new XmlError('Deklarasi XML tidak ditutup');
      i = akhir + 2;
      continue;
    }
    if (s.startsWith('<!--', i)) {
      const akhir = s.indexOf('-->', i + 4);
      if (akhir < 0) throw new XmlError('Komentar tidak ditutup');
      i = akhir + 3;
      continue;
    }
    break;
  }
  if (s[i] !== '<') throw new XmlError('Akar XML tidak ditemukan');
  const akar = elemen();
  lewatiSpasi();
  if (i < n) throw new XmlError(`Ada konten di luar akar (posisi ${i})`);
  return akar;
}
