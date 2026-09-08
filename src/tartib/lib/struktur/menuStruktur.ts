// Builder menu struktur organisasi — MURNI, tanpa React (sesi 22).
//
// Sebelumnya PanelItemSop (mode daftar) dan BaganOrganisasi (bagan) masing-
// masing menulis 200+ baris logika menu klik-kanan yang nyaris identik, dan
// keduanya memamerkan label shortcut Ctrl+C/X/V tanpa handler keyboard.
// Kini satu builder dipakai keduanya (klik kanan, tombol ⋯, tekan lama) —
// yang berbeda hanya kosakata (Jabatan/Tugas vs Item/Sub-tugas) dan aksi
// yang disuntikkan. Tidak ada properti `shortcut`.
//
// Aturan Tempel: hanya aktif bila tipe klip cocok dengan tujuan —
//   - kartu/baris jabatan menerima klip 'jabatan' (jadi jabatan di papan ini,
//     tier mengikuti jabatan target) dan klip 'sub-tugas' (jadi tugas di
//     bawah jabatan itu);
//   - baris tugas hanya menerima klip 'sub-tugas' (masuk ke jabatan induknya);
//   - area/papan hanya menerima klip 'jabatan'.
// Label Tempel selalu menyebut isi klip, dan berubah menjadi "Pindahkan …"
// bila klip hasil Potong.

import type { ItemMenuKlikKanan } from '../../components/ContextMenu';
import type { ItemKlip } from '../clipboard/appClipboard';
import type { SopItem, SopSubItem } from '../../types';

export interface LabelStruktur {
  /** Kata untuk baris induk: "Jabatan" (bagan) atau "Item" (daftar). */
  item: string;
  /** Kata untuk baris anak: "Tugas" (bagan) atau "Sub-tugas" (daftar). */
  sub: string;
}

export const LABEL_BAGAN: LabelStruktur = { item: 'Jabatan', sub: 'Tugas' };
export const LABEL_DAFTAR: LabelStruktur = { item: 'Item', sub: 'Sub-tugas' };

function pemisah(): ItemMenuKlikKanan {
  return { pemisah: true, label: '', onClick: () => {} };
}

function kecil(kata: string): string {
  return kata.toLowerCase();
}

export interface KeadaanTempel {
  label: string;
  disabled: boolean;
}

/** Tempel pada kartu/baris jabatan: klip jabatan → ke papan ini; klip tugas → ke bawah jabatan ini. */
export function keadaanTempelKeJabatan(klip: ItemKlip | null, target: SopItem, label: LabelStruktur): KeadaanTempel {
  if (!klip) return { label: 'Tempel', disabled: true };
  switch (klip.tipe) {
    case 'jabatan': {
      if (klip.isCut) {
        return {
          label: `Pindahkan ${kecil(label.item)} "${klip.judul}" ke sini`,
          disabled: klip.id === target.id, // sumber = tujuan: tidak ada yang dipindah
        };
      }
      return { label: `Tempel ${kecil(label.item)} "${klip.judul}"`, disabled: false };
    }
    case 'sub-tugas': {
      if (klip.isCut) {
        return {
          label: `Pindahkan ${kecil(label.sub)} "${klip.judul}" ke sini`,
          disabled: klip.itemId === target.id, // sudah di bawah jabatan ini
        };
      }
      return { label: `Tempel ${kecil(label.sub)} "${klip.judul}" ke sini`, disabled: false };
    }
    default:
      return { label: `Tempel — klip bukan ${kecil(label.item)}/${kecil(label.sub)}`, disabled: true };
  }
}

/** Tempel pada baris tugas: hanya klip tugas, masuk ke jabatan induk baris itu. */
export function keadaanTempelKeSub(klip: ItemKlip | null, indukId: string, label: LabelStruktur): KeadaanTempel {
  if (!klip) return { label: 'Tempel', disabled: true };
  if (klip.tipe !== 'sub-tugas') {
    return { label: `Tempel — klip bukan ${kecil(label.sub)}`, disabled: true };
  }
  if (klip.isCut) {
    return {
      label: `Pindahkan ${kecil(label.sub)} "${klip.judul}" ke sini`,
      disabled: klip.itemId === indukId,
    };
  }
  return { label: `Tempel ${kecil(label.sub)} "${klip.judul}" di sini`, disabled: false };
}

/** Tempel pada area/papan: hanya klip jabatan. */
export function keadaanTempelKeArea(klip: ItemKlip | null, label: LabelStruktur): KeadaanTempel {
  if (!klip) return { label: 'Tempel', disabled: true };
  if (klip.tipe !== 'jabatan') {
    return { label: `Tempel — pilih ${kecil(label.item)} tujuan untuk ${kecil(label.sub)}`, disabled: true };
  }
  return {
    label: klip.isCut
      ? `Pindahkan ${kecil(label.item)} "${klip.judul}" ke papan ini`
      : `Tempel ${kecil(label.item)} "${klip.judul}" di papan ini`,
    disabled: false,
  };
}

// ── Menu jabatan / item ────────────────────────────────────────────────────

export interface AksiMenuJabatan {
  salin: () => void;
  potong: () => void;
  tempel: () => void;
  duplikat: () => void;
  tambahSub: () => void;
  ubah: () => void;
  hapus: () => void;
}

export interface ParamMenuJabatan {
  item: SopItem;
  subs: readonly SopSubItem[];
  klip: ItemKlip | null;
  label: LabelStruktur;
  aksi: AksiMenuJabatan;
}

export function bangunMenuJabatan({ item, klip, label, aksi }: ParamMenuJabatan): ItemMenuKlikKanan[] {
  const tempel = keadaanTempelKeJabatan(klip, item, label);
  return [
    { label: `Salin ${label.item}`, ikon: '📋', onClick: aksi.salin },
    { label: `Potong ${label.item}`, ikon: '✂️', onClick: aksi.potong },
    { label: `Duplikat ${label.item}`, ikon: '📑', onClick: aksi.duplikat },
    { label: tempel.label, ikon: '📥', disabled: tempel.disabled, onClick: aksi.tempel },
    pemisah(),
    { label: `+ Tambah ${label.sub}`, ikon: '➕', onClick: aksi.tambahSub },
    { label: `Ubah ${label.item}`, ikon: '✏️', onClick: aksi.ubah },
    pemisah(),
    { label: `Hapus ${label.item}`, ikon: '🗑️', bahaya: true, onClick: aksi.hapus },
  ];
}

// ── Menu tugas / sub-tugas ─────────────────────────────────────────────────

export interface AksiMenuSub {
  salin: () => void;
  potong: () => void;
  tempel: () => void;
  duplikat: () => void;
  ubah: () => void;
  hapus: () => void;
  /** Centang/uncentang — opsional (mode daftar punya kotak centang besar sendiri). */
  centang?: () => void;
}

export interface ParamMenuSub {
  induk: SopItem;
  sub: SopSubItem;
  klip: ItemKlip | null;
  label: LabelStruktur;
  aksi: AksiMenuSub;
}

export function bangunMenuSub({ induk, sub, klip, label, aksi }: ParamMenuSub): ItemMenuKlikKanan[] {
  const tempel = keadaanTempelKeSub(klip, induk.id, label);
  const menu: ItemMenuKlikKanan[] = [
    { label: `Salin ${label.sub}`, ikon: '📋', onClick: aksi.salin },
    { label: `Potong ${label.sub}`, ikon: '✂️', onClick: aksi.potong },
    { label: `Duplikat ${label.sub}`, ikon: '📑', onClick: aksi.duplikat },
    { label: tempel.label, ikon: '📥', disabled: tempel.disabled, onClick: aksi.tempel },
    pemisah(),
  ];
  if (aksi.centang) {
    menu.push({
      label: sub.selesai ? 'Tandai belum selesai' : 'Tandai selesai',
      ikon: sub.selesai ? '↩️' : '✅',
      onClick: aksi.centang,
    });
  }
  menu.push(
    { label: `Ubah ${label.sub}`, ikon: '✏️', onClick: aksi.ubah },
    pemisah(),
    { label: `Hapus ${label.sub}`, ikon: '🗑️', bahaya: true, onClick: aksi.hapus },
  );
  return menu;
}

// ── Menu area / papan ──────────────────────────────────────────────────────

export interface AksiMenuArea {
  tambah: () => void;
  tempel: () => void;
  /** Buka/tutup semua rincian tugas (bagan). */
  bukaSemua?: () => void;
  /** Pindah ke mode daftar & cetak (bagan). */
  modeDaftar?: () => void;
}

export interface ParamMenuArea {
  klip: ItemKlip | null;
  label: LabelStruktur;
  /** true bila seluruh kartu sedang terbuka → label "Tutup semua". */
  semuaTerbuka?: boolean;
  aksi: AksiMenuArea;
}

export function bangunMenuArea({ klip, label, semuaTerbuka = false, aksi }: ParamMenuArea): ItemMenuKlikKanan[] {
  const tempel = keadaanTempelKeArea(klip, label);
  const menu: ItemMenuKlikKanan[] = [
    { label: `+ Tambah ${label.item}`, ikon: '➕', onClick: aksi.tambah },
    { label: tempel.label, ikon: '📥', disabled: tempel.disabled, onClick: aksi.tempel },
  ];
  const lanjutan: ItemMenuKlikKanan[] = [];
  if (aksi.bukaSemua) {
    lanjutan.push({
      label: semuaTerbuka ? `Tutup semua ${kecil(label.sub)}` : `Buka semua ${kecil(label.sub)}`,
      ikon: '👁️',
      onClick: aksi.bukaSemua,
    });
  }
  if (aksi.modeDaftar) {
    lanjutan.push({ label: 'Mode daftar & cetak', ikon: '📄', onClick: aksi.modeDaftar });
  }
  if (lanjutan.length > 0) menu.push(pemisah(), ...lanjutan);
  return menu;
}
