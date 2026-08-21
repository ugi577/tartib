// Service acara (Batch C) — snapshot template sekali ke acara (K-03, K-11),
// status acara menegakkan aturan PIC-wajib (A-01). Akses Dexie dari UI wajib
// lewat service layer (PRD §3); fungsi murni diuji tanpa IndexedDB.
import { buatId, tartibDb } from '../db/schema';
import type { Acara, AcaraDivisi, Fase, StatusAcara, TemplateItem, Tugas } from '../types';
import { ambilFaseTemplate, ambilItemTemplate, ambilTemplate } from './templateService';

export class AcaraError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AcaraError';
  }
}

// A-01 (inti aplikasi): status tidak boleh naik ke SIAP bila ada divisi
// bertugas tanpa PIC. Diangkat dari setStatus; UI hanya menampilkan pesan.
export class PicBelumLengkapError extends AcaraError {
  constructor(namaDivisi: string[]) {
    super(`PIC belum ditetapkan untuk divisi: ${namaDivisi.join(', ')}`);
    this.name = 'PicBelumLengkapError';
  }
}

// ===== Fungsi murni (diuji di acaraService.test.ts) =====

export interface SnapshotAcara {
  fase: Fase[]; // salinan fase milik acara (templateId = id acara, K-11)
  tugas: Tugas[]; // salinan item, status BELUM (K-03)
  divisiBertugas: string[]; // divisi unik, urutan kemunculan pertama item
}

// Snapshot bersifat sekali (A-02): item tersalin ke tugas DAN fase ikut
// tersalin ke baris milik acara, sehingga edit template apa pun (termasuk
// hapus fase / ubah offsetHari) tidak pernah mengubah acara yang berjalan.
export function siapkanSnapshotAcara(
  faseLama: readonly Fase[],
  itemLama: readonly TemplateItem[],
  acaraId: string,
): SnapshotAcara {
  const idFaseBaru = new Map<string, string>();
  const fase = faseLama.map((f) => {
    const id = buatId();
    idFaseBaru.set(f.id, id);
    return { ...f, id, templateId: acaraId };
  });
  const divisiBertugas: string[] = [];
  const tugas = itemLama.map((i) => {
    const faseId = idFaseBaru.get(i.faseId);
    if (!faseId) {
      throw new AcaraError(`Item "${i.judul}" merujuk fase yang tidak ikut disnapshot (${i.faseId})`);
    }
    if (!divisiBertugas.includes(i.divisiId)) divisiBertugas.push(i.divisiId);
    return {
      id: buatId(),
      acaraId,
      faseId,
      divisiId: i.divisiId,
      judul: i.judul,
      catatan: i.catatan,
      wajib: i.wajib,
      status: 'BELUM' as const,
      urutan: i.urutan,
    };
  });
  return { fase, tugas, divisiBertugas };
}

// ===== Akses data (io) =====

export interface InputBuatAcara {
  templateId: string;
  nama: string;
  tanggal: string; // YYYY-MM-DD
  jamMulai?: string; // HH:mm
  jamSelesai?: string; // HH:mm
  lokasi?: string;
  cabangId?: string;
}

export async function buatDariTemplate(input: InputBuatAcara): Promise<Acara> {
  const template = await ambilTemplate(input.templateId);
  const nama = input.nama.trim();
  if (!nama) throw new AcaraError('Nama acara wajib diisi');
  if (!input.tanggal) throw new AcaraError('Tanggal acara wajib diisi');
  const [faseLama, itemLama] = await Promise.all([
    ambilFaseTemplate(template.id),
    ambilItemTemplate(template.id),
  ]);
  const acara: Acara = {
    id: buatId(),
    nama,
    jenisAcaraId: template.jenisAcaraId,
    templateId: template.id,
    templateVersi: template.versi, // snapshot versi template (K-03)
    tanggal: input.tanggal,
    jamMulai: input.jamMulai ?? '',
    jamSelesai: input.jamSelesai ?? '',
    lokasi: input.lokasi ?? '',
    cabangId: input.cabangId,
    status: 'DRAF',
    dibuatPada: new Date().toISOString(),
  };
  const snapshot = siapkanSnapshotAcara(faseLama, itemLama, acara.id);
  const acaraDivisi: AcaraDivisi[] = snapshot.divisiBertugas.map((divisiId) => ({
    id: buatId(),
    acaraId: acara.id,
    divisiId,
    picNama: '',
    picKontak: '',
    catatan: '',
  }));
  await tartibDb.transaction(
    'rw',
    tartibDb.acara,
    tartibDb.fase,
    tartibDb.tugas,
    tartibDb.acaraDivisi,
    async () => {
      await tartibDb.acara.add(acara);
      if (snapshot.fase.length > 0) await tartibDb.fase.bulkAdd(snapshot.fase);
      if (snapshot.tugas.length > 0) await tartibDb.tugas.bulkAdd(snapshot.tugas);
      if (acaraDivisi.length > 0) await tartibDb.acaraDivisi.bulkAdd(acaraDivisi);
    },
  );
  return acara;
}

// A-01: daftar id divisi yang belum ber-PIC. Baris tartib_acaraDivisi hanya
// dibuat untuk divisi yang punya minimal satu tugas (lihat buatDariTemplate),
// jadi tidak perlu cek ulang jumlah tugas di sini.
export function daftarDivisiTanpaPic(acaraDivisi: readonly AcaraDivisi[]): string[] {
  return acaraDivisi.filter((d) => d.picNama.trim() === '').map((d) => d.divisiId);
}

export async function ambilAcara(id: string): Promise<Acara> {
  const acara = await tartibDb.acara.get(id);
  if (!acara) throw new AcaraError('Acara tidak ditemukan');
  return acara;
}

export async function daftarAcara(): Promise<Acara[]> {
  return tartibDb.acara.orderBy('dibuatPada').reverse().toArray();
}

// Transisi status acara (PRD 5.2). Menuju SIAP diblokir A-01: bila ada
// divisi bertugas tanpa PIC, setStatus melempar PicBelumLengkapError dan
// status tidak berubah.
export async function setStatus(acaraId: string, status: StatusAcara): Promise<void> {
  await ambilAcara(acaraId);
  if (status === 'SIAP') {
    const baris = await tartibDb.acaraDivisi.where('acaraId').equals(acaraId).toArray();
    const tanpaPic = daftarDivisiTanpaPic(baris);
    if (tanpaPic.length > 0) {
      const divisi = await tartibDb.divisi.toArray();
      const nama = tanpaPic.map((id) => divisi.find((d) => d.id === id)?.nama ?? id);
      throw new PicBelumLengkapError(nama);
    }
  }
  await tartibDb.acara.update(acaraId, { status });
}
