// Ikhtisar eksekusi acara (Batch T, K-13) — fungsi murni untuk lapisan
// eksekusi real-time: progres tugas, ringkasan per divisi, dan posisi
// waktu fase relatif hari ini. Semua hitungan deterministik dari data
// tugas/fase yang sudah termuat; tidak menyentuh IndexedDB.

import { geserTanggal } from './tanggal';
import type { Fase, StatusTugas, Tugas } from '../types';

export interface IkhtisarTugas {
  total: number;
  belum: number;
  jalan: number;
  selesai: number;
  batal: number;
  // Tugas BATAL dikecualikan dari penyebut — bukan lagi pekerjaan yang
  // diharapkan selesai, sehingga membatalkan tugas tidak menurunkan persen.
  persenSelesai: number;
}

export function ikhtisarTugas(tugas: Tugas[]): IkhtisarTugas {
  const hitung = (s: StatusTugas) => tugas.filter((t) => t.status === s).length;
  const belum = hitung('BELUM');
  const jalan = hitung('JALAN');
  const selesai = hitung('SELESAI');
  const batal = hitung('BATAL');
  const total = tugas.length;
  const penyebut = total - batal;
  const persenSelesai = penyebut === 0 ? 0 : Math.floor((selesai / penyebut) * 100);
  return { total, belum, jalan, selesai, batal, persenSelesai };
}

export interface IkhtisarDivisi {
  divisiId: string;
  total: number;
  selesai: number;
  persenSelesai: number;
}

export function ikhtisarPerDivisi(tugas: Tugas[]): IkhtisarDivisi[] {
  const per = new Map<string, Tugas[]>();
  for (const t of tugas) {
    const ada = per.get(t.divisiId);
    if (ada) ada.push(t);
    else per.set(t.divisiId, [t]);
  }
  return Array.from(per.entries())
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([divisiId, daftar]) => {
      const i = ikhtisarTugas(daftar);
      return { divisiId, total: i.total, selesai: i.selesai, persenSelesai: i.persenSelesai };
    });
}

export type WaktuFase = 'LALU' | 'HARI_INI' | 'MENDATANG';

// YYYY-MM-DD dibandingkan sebagai string: urutan leksikografis sama dengan
// urutan kalender, jadi tidak perlu objek Date tambahan di sini.
export function statusWaktuFase(tanggalAcara: string, offsetHari: number, hariIni: string): WaktuFase {
  const tanggalFase = geserTanggal(tanggalAcara, offsetHari);
  if (tanggalFase < hariIni) return 'LALU';
  if (tanggalFase === hariIni) return 'HARI_INI';
  return 'MENDATANG';
}

// Fase pertama (urutan terkecil) yang tanggalnya hari ini — fokus "sedang
// berjalan sekarang". Null bila tidak ada fase hari ini.
export function faseHariIni(fases: Fase[], tanggalAcara: string, hariIni: string): Fase | null {
  const kandidat = fases
    .filter((f) => statusWaktuFase(tanggalAcara, f.offsetHari, hariIni) === 'HARI_INI')
    .sort((a, b) => a.urutan - b.urutan);
  return kandidat[0] ?? null;
}

// Fase pertama yang belum lewat — fokus "berikutnya disiapkan". Null bila
// semua fase sudah lewat (acara menjelang selesai).
export function faseBerikutnya(fases: Fase[], tanggalAcara: string, hariIni: string): Fase | null {
  const kandidat = fases
    .filter((f) => statusWaktuFase(tanggalAcara, f.offsetHari, hariIni) !== 'LALU')
    .sort((a, b) => a.urutan - b.urutan);
  return kandidat[0] ?? null;
}
