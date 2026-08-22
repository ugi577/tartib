import { describe, expect, it } from 'vitest';
import { parseXmlLite } from './xml';
import { dokumenXmlKeSop, labelFaseBersih, offsetDariLabel, tebakDivisi } from './dokumenSop';

// Pembangun document.xml sintetik yang meniru struktur asli
// "BUKU PANDUAN SOP ACARA — Ma'had Askar Qur'an": fase = paragraf tebal
// berawalan H-offset, item = paragraf berawalan ☐, "BAGIAN n —" memutus fase.

function p(teks: string, tebal = false): string {
  const run = `<w:r>${tebal ? '<w:rPr><w:b/></w:rPr>' : ''}<w:t xml:space="preserve">${teks}</w:t></w:r>`;
  return `<w:p><w:pPr>${tebal ? '<w:rPr><w:b/></w:rPr>' : ''}</w:pPr>${run}</w:p>`;
}

const XML = `<?xml version="1.0" encoding="UTF-8"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${p('BUKU PANDUAN SOP ACARA')}
    ${p("Ma'had Askar Qur'an")}
    ${p('BAGIAN 0 — UCAPAN TERIMA KASIH', true)}
    ${p('Kirim ke grup panitia hari ini juga.')}
    ${p('BAGIAN 1 — INSIGHT DARI EVALUASI', true)}
    ${p('Yang gagal bukan tenaganya, melainkan kepemilikannya.')}
    ${p('BAGIAN 2 — STRUKTUR PANITIA BAKU', true)}
    <w:tbl><w:tr><w:tc><w:p><w:r><w:t>No</w:t></w:r></w:p></w:tc></w:tr></w:tbl>
    ${p('BAGIAN 3 — LINIMASA PERSIAPAN', true)}
    ${p('H-30 — Penetapan', true)}
    ${p('☐  Tetapkan tanggal, jam mulai, dan jam selesai')}
    ${p('☐  Bentuk panitia — isi seluruh kolom PIC pada Bagian 2')}
    ${p('☐  Tetapkan anggaran kasar')}
    ${p('Hari-H', true)}
    ${p('Pagi sebelum tamu datang', true)}
    ${p('☐  Petugas sandal ⚠️ di pintu')}
    ${p('☐  Buku tamu terisi — jangan sampai terlewat')}
    ${p('H+1 — Evaluasi', true)}
    ${p('☐  Kembalikan seluruh sisa barang pinjaman — batas mutlak sebelum maghrib')}
    ${p('Kerjakan dalam 24 jam.')}
    ${p('BAGIAN 4 — CEKLIS PERLENGKAPAN', true)}
    ${p('☐  Piring, gelas, sendok, garpu (hitung dengan rumus di atas)')}
  </w:body>
</w:document>`;

describe('offsetDariLabel & labelFaseBersih', () => {
  it('mem-parse offset H-30, Hari-H, H+1', () => {
    expect(offsetDariLabel('H-30 — Penetapan')).toBe(-30);
    expect(offsetDariLabel('H-7 — Kunci angka')).toBe(-7);
    expect(offsetDariLabel('Hari-H')).toBe(0);
    expect(offsetDariLabel('Hari H — Acara')).toBe(0);
    expect(offsetDariLabel('H+1 — Evaluasi')).toBe(1);
    expect(offsetDariLabel('Prosa biasa')).toBeNull();
    expect(offsetDariLabel('BAGIAN 3 — LINIMASA')).toBeNull();
  });

  it('membersihkan awalan offset dari label fase', () => {
    expect(labelFaseBersih('H-30 — Penetapan')).toBe('Penetapan');
    expect(labelFaseBersih('H-21 — Kunci pengisi acara ⚠️')).toBe('Kunci pengisi acara');
    expect(labelFaseBersih('H-21 — Kunci pengisi acara ⚠')).toBe('Kunci pengisi acara');
    expect(labelFaseBersih('Hari-H')).toBe('Hari-H');
    expect(labelFaseBersih('Hari H — Acara')).toBe('Acara');
    expect(labelFaseBersih('H+1 — Evaluasi')).toBe('Evaluasi');
  });
});

describe('tebakDivisi', () => {
  it('mengenali kata kunci divisi baku', () => {
    expect(tebakDivisi('Petugas sandal di pintu')).toBe('Parkir & Sandal');
    expect(tebakDivisi('Bentuk panitia')).toBe('Ketua Panitia');
    expect(tebakDivisi('Buku tamu terisi')).toBe('Penerima Tamu');
    expect(tebakDivisi('Jalankan rundown dari awal sampai akhir, tanpa tamu')).toBe('Acara & MC');
    expect(tebakDivisi('Kembalikan barang pinjaman')).toBe('Perlengkapan & Sound');
    expect(tebakDivisi('Uji sound di setiap sudut')).toBe('Perlengkapan & Sound');
    expect(tebakDivisi('Bukhur dinyalakan sebelum tamu masuk')).toBe('Aroma & Suasana');
    expect(tebakDivisi('Rekap konfirmasi masuk')).toBe('Sekretaris');
    expect(tebakDivisi('Satu orang khusus mengawasi ketenangan area putri')).toBe('Koordinator Jamaah Putri');
  });

  it('mengembalikan null bila tidak ada kata kunci', () => {
    expect(tebakDivisi('Tetapkan tanggal, jam mulai, dan jam selesai')).toBeNull();
  });
});

describe('dokumenXmlKeSop', () => {
  it('memetakan linimasa menjadi fase + item, mengabaikan bagian lain', () => {
    const hasil = dokumenXmlKeSop(parseXmlLite(XML));
    expect(hasil.judulDokumen).toBe('BUKU PANDUAN SOP ACARA');
    expect(hasil.subJudul).toBe("Ma'had Askar Qur'an");
    expect(hasil.fases.map((f) => [f.label, f.offsetHari])).toEqual([
      ['Penetapan', -30],
      ['Hari-H', 0],
      ['Evaluasi', 1],
    ]);
    expect(hasil.fases[0].items.map((i) => i.judul)).toEqual([
      'Tetapkan tanggal, jam mulai, dan jam selesai',
      'Bentuk panitia — isi seluruh kolom PIC pada Bagian 2',
      'Tetapkan anggaran kasar',
    ]);
    expect(hasil.fases[0].items[0].divisiTebakan).toBeNull();
    expect(hasil.fases[0].items[1].divisiTebakan).toBe('Ketua Panitia');
    expect(hasil.fases[1].items.map((i) => [i.judul, i.divisiTebakan])).toEqual([
      ['Petugas sandal di pintu', 'Parkir & Sandal'],
      ['Buku tamu terisi — jangan sampai terlewat', 'Penerima Tamu'],
    ]);    expect(hasil.fases[2].items).toHaveLength(1);
    // Item ceklis perlengkapan di Bagian 4 tidak menempel ke fase H+1 —
    // teksnya dipertahankan (dengan konteks bagian) untuk diaudit di pratinjau.
    expect(hasil.itemLuarLinimasa).toEqual([
      {
        teks: 'Piring, gelas, sendok, garpu (hitung dengan rumus di atas)',
        bagian: 'BAGIAN 4 — CEKLIS PERLENGKAPAN',
      },
    ]);
    // Prosa Bagian 0/1 + sub-judul "Pagi sebelum tamu datang" + catatan H+1.
    expect(hasil.paragrafDiabaikan).toBe(4);
  });

  it('menolak dokumen tanpa w:body', () => {
    expect(() => dokumenXmlKeSop(parseXmlLite('<w:document/>'))).toThrow(/bukan .docx/);
  });
});
