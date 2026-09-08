// Pustaka Utama Katalog Preset Siap Pakai Tartib
import { DAFTAR_PRESET_STRUKTUR, type PresetStruktur } from './presetStruktur';
import { DAFTAR_PRESET_SOP, type PresetSop } from './presetSop';
import { DAFTAR_PRESET_KBM } from './presetKbm';
import type { ModelJadwalKbm } from '../../types/kbm';
import { tartibDb, buatId } from '../../db/schema';
import { normalisasiJadwal } from '../kbm/hari';

export * from './presetStruktur';
export * from './presetSop';
export * from './presetKbm';

export type KategoriPreset = 'semua' | 'struktur' | 'sop' | 'kbm';

export interface MetadataPreset {
  id: string;
  nama: string;
  kategori: 'struktur' | 'sop' | 'kbm';
  deskripsi: string;
  ikon: string;
  jumlahItem: number;
}

export function ambilSemuaMetadataPreset(): MetadataPreset[] {
  const list: MetadataPreset[] = [];

  for (const s of DAFTAR_PRESET_STRUKTUR) {
    list.push({
      id: s.id,
      nama: s.nama,
      kategori: 'struktur',
      deskripsi: s.deskripsi,
      ikon: s.ikon,
      jumlahItem: s.items.length,
    });
  }

  for (const sop of DAFTAR_PRESET_SOP) {
    list.push({
      id: sop.id,
      nama: sop.nama,
      kategori: 'sop',
      deskripsi: sop.deskripsi,
      ikon: sop.ikon,
      jumlahItem: sop.items.length,
    });
  }

  const semuaKbm = bacaSemuaKatalogKbm();
  for (const kbm of semuaKbm) {
    list.push({
      id: kbm.id,
      nama: kbm.judul,
      kategori: 'kbm',
      deskripsi: kbm.deskripsi,
      ikon: kbm.kustom ? '⭐' : '📅',
      jumlahItem: kbm.entri.length,
    });
  }

  return list;
}

// Menerapkan preset struktur ke database Dexie Tartib
export async function terapkanPresetStruktur(preset: PresetStruktur): Promise<string> {
  return tartibDb.transaction('rw', tartibDb.sop, tartibDb.sopItem, tartibDb.sopSubItem, async () => {
    // Cari papan baku atau buat papan baru
    let sop = await tartibDb.sop.filter((s) => s.baku).first();
    let sopId: string;

    if (sop) {
      sopId = sop.id;
      await tartibDb.sop.update(sopId, {
        judul: preset.nama,
        catatan: preset.deskripsi,
      });
      // Bersihkan item lama — sub-tugas dihapus per sopId LEBIH DULU (sesi 22,
      // temuan [27]: sebelumnya hanya per itemId sehingga sub yang sopId-nya
      // cocok tapi itemId-nya sudah tidak ada tertinggal sebagai yatim).
      const itemLama = await tartibDb.sopItem.where('sopId').equals(sopId).toArray();
      await tartibDb.sopSubItem.where('sopId').equals(sopId).delete();
      for (const it of itemLama) {
        await tartibDb.sopSubItem.where('itemId').equals(it.id).delete();
      }
      await tartibDb.sopItem.where('sopId').equals(sopId).delete();
    } else {
      sopId = buatId();
      await tartibDb.sop.add({
        id: sopId,
        judul: preset.nama,
        catatan: preset.deskripsi,
        baku: true,
        urutan: 1,
        dibuatPada: new Date().toISOString(),
      });
    }

    for (let i = 0; i < preset.items.length; i++) {
      const it = preset.items[i];
      const itemId = buatId();
      await tartibDb.sopItem.add({
        id: itemId,
        sopId,
        judul: it.judul,
        picNama: it.picNama ?? '',
        catatan: it.catatan,
        rutin: it.rutin,
        selesai: false,
        urutan: i + 1,
      });

      if (it.sub && it.sub.length > 0) {
        await tartibDb.sopSubItem.bulkAdd(
          it.sub.map((s, j) => ({
            id: buatId(),
            sopId,
            itemId,
            judul: s.judul,
            picNama: s.picNama ?? '',
            catatan: s.catatan ?? '',
            selesai: false,
            urutan: j + 1,
          })),
        );
      }
    }

    return sopId;
  });
}

// Kunci penyimpanan lokal untuk Jadwal KBM aktif & Template Kustom
export const KUNCI_STORAGE_KBM = 'tartib_jadwal_kbm_aktif';
export const KUNCI_STORAGE_TEMPLATE_KBM_KUSTOM = 'tartib_daftar_template_kbm_kustom';

const memoryStore: Record<string, string> = {};

function ambilStorage(): { getItem(k: string): string | null; setItem(k: string, v: string): void; removeItem(k: string): void } {
  if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
  if (typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function') return localStorage;
  return {
    getItem: (k) => (k in memoryStore ? memoryStore[k] : null),
    setItem: (k, v) => {
      memoryStore[k] = v;
    },
    removeItem: (k) => {
      delete memoryStore[k];
    },
  };
}

export function simpanJadwalKbmLokal(jadwal: ModelJadwalKbm): void {
  const store = ambilStorage();
  store.setItem(KUNCI_STORAGE_KBM, JSON.stringify(jadwal));
}

/** Bentuk minimal yang harus ada agar objek dianggap jadwal KBM. */
function apakahBentukJadwal(v: unknown): v is ModelJadwalKbm {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  return Array.isArray(o.daftarHari) && Array.isArray(o.daftarJam) && Array.isArray(o.entri);
}

// Setiap titik baca menormalkan nama hari (lib/kbm/hari.ts) supaya data lama
// di localStorage yang masih memuat "Jum'at" langsung cocok dengan kanonik
// 'Jumat' — komponen tidak perlu menambal lagi.
export function bacaJadwalKbmLokal(): ModelJadwalKbm {
  const store = ambilStorage();
  const raw = store.getItem(KUNCI_STORAGE_KBM);
  if (raw) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (apakahBentukJadwal(parsed)) return normalisasiJadwal(parsed);
    } catch {
      // fallback bawaan
    }
  }
  return DAFTAR_PRESET_KBM[0];
}

export function bacaDaftarTemplateKbmKustom(): ModelJadwalKbm[] {
  const store = ambilStorage();
  const raw = store.getItem(KUNCI_STORAGE_TEMPLATE_KBM_KUSTOM);
  if (raw) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter(apakahBentukJadwal).map(normalisasiJadwal);
    } catch {
      // abaikan
    }
  }
  return [];
}

export function simpanTemplateKbmKustom(template: ModelJadwalKbm): void {
  const store = ambilStorage();
  const list = bacaDaftarTemplateKbmKustom();
  const idx = list.findIndex((t) => t.id === template.id);
  const dataSimpan: ModelJadwalKbm = {
    ...template,
    kustom: true,
    diubahPada: new Date().toISOString(),
  };

  if (idx !== -1) {
    list[idx] = dataSimpan;
  } else {
    list.push(dataSimpan);
  }
  store.setItem(KUNCI_STORAGE_TEMPLATE_KBM_KUSTOM, JSON.stringify(list));
}

export function hapusTemplateKbmKustom(id: string): void {
  const store = ambilStorage();
  const list = bacaDaftarTemplateKbmKustom().filter((t) => t.id !== id);
  store.setItem(KUNCI_STORAGE_TEMPLATE_KBM_KUSTOM, JSON.stringify(list));
}

export function bacaSemuaKatalogKbm(): ModelJadwalKbm[] {
  const kustom = bacaDaftarTemplateKbmKustom();
  return [...DAFTAR_PRESET_KBM, ...kustom];
}

export function eksporJadwalJson(jadwal: ModelJadwalKbm): string {
  return JSON.stringify(jadwal, null, 2);
}

export function imporJadwalJson(teksJson: string): ModelJadwalKbm {
  let parsed: unknown;
  try {
    parsed = JSON.parse(teksJson);
  } catch {
    throw new Error('Teks bukan JSON yang sah — periksa tanda kurung/koma, atau pilih berkas .json hasil Ekspor.');
  }
  if (!apakahBentukJadwal(parsed)) {
    throw new Error('Format template jadwal tidak valid — perlu bidang daftarHari, daftarJam, dan entri.');
  }
  const jadwal = normalisasiJadwal(parsed);
  if (jadwal.daftarHari.length === 0) {
    throw new Error('Tidak ada nama hari yang dikenali (Senin … Ahad) di daftarHari.');
  }
  // Id yang sama dengan preset bawaan (mis. hasil Ekspor preset) diberi id
  // baru agar katalog tidak memuat dua template ber-id sama; asalnya dicatat
  // di asalId supaya "Reset ke bawaan" tetap tahu preset sumbernya.
  const bentrokPreset = DAFTAR_PRESET_KBM.some((p) => p.id === jadwal.id);
  return {
    ...jadwal,
    id: jadwal.id && !bentrokPreset ? jadwal.id : `kbm-impor-${Date.now()}`,
    judul: jadwal.judul || 'Jadwal Impor Kustom',
    kustom: true,
    asalId: jadwal.asalId ?? (bentrokPreset ? jadwal.id : undefined),
    dibuatPada: jadwal.dibuatPada || new Date().toISOString(),
  };
}

