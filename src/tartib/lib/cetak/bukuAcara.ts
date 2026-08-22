// Buku acara (Batch F) — fungsi murni untuk cetak SOP lengkap satu acara
// di kertas A4. Struktur mengikuti dokumen contoh "SOP ACARA": kop acara,
// lalu satu bagian per fase (urutan template) berisi tugas yang dikelompokkan
// per divisi. Semua hitungan deterministik dari data yang sudah termuat;
// tidak menyentuh IndexedDB.

import { geserTanggal } from '../tanggal';
import type { Acara, Divisi, Fase, StatusAcara, StatusTugas, Tugas } from '../../types';

export interface TugasBuku {
  urutan: number;
  judul: string;
  catatan: string;
  wajib: boolean;
  status: StatusTugas;
}

export interface KelompokBuku {
  divisiId: string;
  divisiNama: string;
  tugas: TugasBuku[];
}

export interface BagianBuku {
  faseUrutan: number;
  faseLabel: string;
  offsetHari: number;
  tanggalFase: string; // YYYY-MM-DD hasil geser offsetHari dari tanggal acara
  kelompok: KelompokBuku[];
}

export interface KopBuku {
  nama: string;
  jenisNama: string;
  tanggal: string; // YYYY-MM-DD
  jam: string; // "08:00–12:00" atau kosong
  lokasi: string;
  templateVersi: number;
  status: StatusAcara;
}

export interface BukuAcara {
  kop: KopBuku;
  bagian: BagianBuku[];
}

export interface SusunBukuParams {
  acara: Acara;
  jenisNama: string;
  fases: Fase[];
  divisi: Divisi[];
  tugas: Tugas[];
}

export function susunBukuAcara({ acara, jenisNama, fases, divisi, tugas }: SusunBukuParams): BukuAcara {
  const urutanDivisi = new Map(divisi.map((d) => [d.id, d.urutan]));
  const namaDivisi = new Map(divisi.map((d) => [d.id, d.nama]));

  const bagian = [...fases]
    .sort((a, b) => a.urutan - b.urutan)
    .map((fase) => {
      const tugasFase = tugas
        .filter((t) => t.acaraId === acara.id && t.faseId === fase.id)
        .sort((a, b) => a.urutan - b.urutan);

      // Kelompok per divisi, urut mengikuti urutan divisi baku.
      const perDivisi = new Map<string, Tugas[]>();
      for (const t of tugasFase) {
        const ada = perDivisi.get(t.divisiId);
        if (ada) ada.push(t);
        else perDivisi.set(t.divisiId, [t]);
      }
      const kelompok: KelompokBuku[] = Array.from(perDivisi.entries())
        .sort(([a], [b]) => {
          const ua = urutanDivisi.get(a) ?? Number.MAX_SAFE_INTEGER;
          const ub = urutanDivisi.get(b) ?? Number.MAX_SAFE_INTEGER;
          return ua - ub || a.localeCompare(b);
        })
        .map(([divisiId, daftar]) => ({
          divisiId,
          divisiNama: namaDivisi.get(divisiId) ?? 'Divisi tidak ditemukan',
          tugas: daftar.map((t) => ({
            urutan: t.urutan,
            judul: t.judul,
            catatan: t.catatan,
            wajib: t.wajib,
            status: t.status,
          })),
        }));

      return {
        faseUrutan: fase.urutan,
        faseLabel: fase.label,
        offsetHari: fase.offsetHari,
        tanggalFase: geserTanggal(acara.tanggal, fase.offsetHari),
        kelompok,
      };
    });

  const jam = [acara.jamMulai, acara.jamSelesai].filter(Boolean).join('–');

  return {
    kop: {
      nama: acara.nama,
      jenisNama,
      tanggal: acara.tanggal,
      jam,
      lokasi: acara.lokasi,
      templateVersi: acara.templateVersi,
      status: acara.status,
    },
    bagian,
  };
}
