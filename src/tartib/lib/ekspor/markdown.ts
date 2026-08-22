// Ekspor Markdown (Batch F) — fungsi murni yang menulis BukuAcara (hasil
// susunBukuAcara) menjadi dokumen Markdown valid yang bisa dibuka ulang di
// editor/penampil mana pun (Gate F: "Ekspor Markdown dapat dibuka ulang").
// Tidak menyentuh IndexedDB; unduhan berkas dilakukan lapisan UI.

import { formatOffsetHari, formatTanggalIndonesia } from '../tanggal';
import type { BukuAcara } from '../cetak/bukuAcara';

// Baris opsional (waktu/lokasi) dipangkas, bagian tetap digabung " · ".
function barisKop(parts: Array<string | undefined>): string {
  return parts.filter((p) => p && p.trim() !== '').join(' · ');
}

export function bukuAcaraKeMarkdown(buku: BukuAcara, dicetakPada: string): string {
  const k = buku.kop;
  const baris: string[] = [];

  baris.push(`# SOP ACARA — ${k.nama}`, '');
  baris.push(
    barisKop([
      k.jenisNama,
      `Hari-H ${formatTanggalIndonesia(k.tanggal)}`,
      k.jam ? `Waktu ${k.jam}` : undefined,
      k.lokasi ? `Lokasi ${k.lokasi}` : undefined,
    ]),
  );
  baris.push(barisKop([`Template v${k.templateVersi}`, `Status ${k.status}`, `Dicetak ${dicetakPada}`]), '');
  baris.push('---', '');

  for (const bagian of buku.bagian) {
    baris.push(
      `## ${bagian.faseUrutan}. ${bagian.faseLabel} (${formatOffsetHari(bagian.offsetHari)}, ${formatTanggalIndonesia(bagian.tanggalFase)})`,
      '',
    );
    if (bagian.kelompok.length === 0) {
      baris.push('_Tidak ada tugas pada fase ini._', '');
      continue;
    }
    for (const kelompok of bagian.kelompok) {
      baris.push(`### ${kelompok.divisiNama}`, '');
      for (const t of kelompok.tugas) {
        const keterangan = [
          t.catatan ? `— ${t.catatan}` : undefined,
          t.wajib ? '_(wajib)_' : undefined,
          `Status: ${t.status}`,
        ].filter(Boolean);
        baris.push(`- ${t.judul} ${keterangan.join(' ')}`.trimEnd());
      }
      baris.push('');
    }
  }

  return `${baris.join('\n')}\n`;
}
