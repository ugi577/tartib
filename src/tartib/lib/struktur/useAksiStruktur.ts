'use client';

// Aksi bersama satu papan struktur — sesi 22.
//
// Mode daftar (PanelItemSop) dan bagan (BaganOrganisasi) dulu masing-masing
// menulis ulang: dialog tambah/ubah jabatan & tugas, konfirmasi hapus, tiga
// handler menu klik-kanan berisi salin/potong/tempel/duplikat yang merangkai
// tambah+hapus tanpa transaksi. Kini semuanya di satu hook:
//   - Salin/Potong → simpanKlip (hanya ID; data dibaca dari DB saat tempel)
//     + pesan umpan balik;
//   - Tempel → pindahkan… (bila klip hasil Potong) atau salin… (service
//     transaksional), klip dibersihkan HANYA bila berhasil, papan dimuat ulang
//     selalu;
//   - Duplikat → duplikatItemSop (sisip tepat di bawah aslinya);
//   - menu dibangun oleh builder murni menuStruktur — dipanggil dari klik
//     kanan, tombol ⋯, maupun tekan lama, dengan posisi yang diberikan pemanggil.
// Yang berbeda antar mode hanya kosakata (label) dan aturan `rutin` saat
// menempel jabatan (bagan: tier target/'Divisi'; daftar: rutin asal).

import { useState } from 'react';
import type { ItemMenuKlikKanan } from '../../components/ContextMenu';
import * as sopSvc from '../../services/sopService';
import type { Sop, SopItem, SopSubItem } from '../../types';
import { ambilKlip, bersihkanKlip, labelKlip, simpanKlip, type ItemKlip } from '../clipboard/appClipboard';
import { useKlip } from '../clipboard/useKlip';
import { bangunMenuArea, bangunMenuJabatan, bangunMenuSub, type LabelStruktur } from './menuStruktur';
import { pesanError, type PapanSop } from './usePapanSop';

export interface Posisi {
  x: number;
  y: number;
}

export interface FormJabatanNilai {
  judul: string;
  picNama: string;
  catatan: string;
  rutin: string;
}

export interface FormSubNilai {
  judul: string;
  picNama: string;
  catatan: string;
}

export interface MenuTerbuka extends Posisi {
  judul: string;
  items: ItemMenuKlikKanan[];
}

export interface TargetHapus {
  jenis: 'item' | 'sub';
  id: string;
  judul: string;
}

export interface EkstraMenuArea {
  semuaTerbuka?: boolean;
  bukaSemua?: () => void;
  modeDaftar?: () => void;
}

export interface OpsiAksiStruktur {
  sop: Sop;
  papan: PapanSop;
  label: LabelStruktur;
  /** Nilai `rutin` awal untuk jabatan baru: 'Divisi' di bagan, '' di daftar. */
  rutinBaru: string;
  /**
   * `rutin` untuk jabatan hasil tempel: bagan → tier jabatan target atau
   * 'Divisi' (area); daftar → undefined (rutin asal dipertahankan).
   */
  rutinTempel: (target?: SopItem) => string | undefined;
  /** Item menu area tambahan (bagan: buka/tutup semua, mode daftar). */
  menuArea?: () => EkstraMenuArea;
}

export interface AksiStruktur {
  klip: ItemKlip | null;
  pesan: string | null;
  tutupPesan: () => void;
  batalKlip: () => void;
  /** true bila baris ini sedang "dipotong" (ditandai putus-putus di layar). */
  dipotong: (tipe: 'jabatan' | 'sub-tugas', id: string) => boolean;

  menu: MenuTerbuka | null;
  tutupMenu: () => void;
  bukaMenuJabatan: (item: SopItem, posisi: Posisi) => void;
  bukaMenuSub: (induk: SopItem, sub: SopSubItem, posisi: Posisi) => void;
  bukaMenuArea: (posisi: Posisi) => void;

  dialogJabatan: { item: SopItem | null } | null;
  formJabatan: FormJabatanNilai;
  setFormJabatan: (f: FormJabatanNilai) => void;
  errorJabatan: string | null;
  bukaTambahJabatan: () => void;
  bukaUbahJabatan: (item: SopItem) => void;
  simpanJabatan: () => Promise<void>;
  tutupDialogJabatan: () => void;

  dialogSub: { induk: SopItem; sub: SopSubItem | null } | null;
  formSub: FormSubNilai;
  setFormSub: (f: FormSubNilai) => void;
  errorSub: string | null;
  bukaTambahSub: (induk: SopItem) => void;
  bukaUbahSub: (induk: SopItem, sub: SopSubItem) => void;
  simpanSub: () => Promise<void>;
  tutupDialogSub: () => void;

  hapusTarget: TargetHapus | null;
  mintaHapusJabatan: (item: SopItem) => void;
  mintaHapusSub: (sub: SopSubItem) => void;
  batalHapus: () => void;
  jalankanHapus: () => Promise<void>;

  salinJabatan: (item: SopItem) => void;
  potongJabatan: (item: SopItem) => void;
  duplikatJabatan: (item: SopItem) => Promise<void>;
  tempelKeJabatan: (target: SopItem) => Promise<void>;
  tempelKeArea: () => Promise<void>;
  salinSub: (sub: SopSubItem) => void;
  potongSub: (sub: SopSubItem) => void;
  duplikatSub: (sub: SopSubItem) => Promise<void>;
  pindahJabatan: (item: SopItem, arah: 'atas' | 'bawah') => Promise<void>;
  pindahSub: (sub: SopSubItem, arah: 'atas' | 'bawah') => Promise<void>;
}

const FORM_JABATAN_KOSONG: FormJabatanNilai = { judul: '', picNama: '', catatan: '', rutin: '' };
const FORM_SUB_KOSONG: FormSubNilai = { judul: '', picNama: '', catatan: '' };

export function useAksiStruktur(opsi: OpsiAksiStruktur): AksiStruktur {
  const { sop, papan, label } = opsi;
  const klip = useKlip();
  const [pesan, setPesan] = useState<string | null>(null);
  const [menu, setMenu] = useState<MenuTerbuka | null>(null);
  const [dialogJabatan, setDialogJabatan] = useState<{ item: SopItem | null } | null>(null);
  const [formJabatan, setFormJabatan] = useState<FormJabatanNilai>(FORM_JABATAN_KOSONG);
  const [errorJabatan, setErrorJabatan] = useState<string | null>(null);
  const [dialogSub, setDialogSub] = useState<{ induk: SopItem; sub: SopSubItem | null } | null>(null);
  const [formSub, setFormSub] = useState<FormSubNilai>(FORM_SUB_KOSONG);
  const [errorSub, setErrorSub] = useState<string | null>(null);
  const [hapusTarget, setHapusTarget] = useState<TargetHapus | null>(null);

  const kecilItem = label.item.toLowerCase();
  const kecilSub = label.sub.toLowerCase();

  // ── Jalankan mutasi: error ditampilkan SETELAH muat ulang (muat yang
  //    berhasil menghapus error lama), papan selalu dimuat ulang. ──
  async function jalankan(kerja: () => Promise<unknown>, pesanSukses: string | null): Promise<boolean> {
    let gagal: string | null = null;
    try {
      await kerja();
    } catch (e) {
      gagal = pesanError(e);
    } finally {
      await papan.muat();
    }
    if (gagal) {
      papan.setError(gagal);
      setPesan(null);
      return false;
    }
    if (pesanSukses) setPesan(pesanSukses);
    return true;
  }

  // Tempel: klip dibersihkan HANYA bila operasi berhasil.
  async function tempel(kerja: () => Promise<unknown>, pesanSukses: string): Promise<void> {
    let berhasil = false;
    let gagal: string | null = null;
    try {
      await kerja();
      berhasil = true;
    } catch (e) {
      gagal = pesanError(e);
    } finally {
      if (berhasil) bersihkanKlip();
      await papan.muat();
    }
    if (gagal) {
      papan.setError(gagal);
      setPesan(null);
    } else {
      setPesan(pesanSukses);
    }
  }

  // ── Klip ──
  function salinJabatan(item: SopItem) {
    const k = simpanKlip({ tipe: 'jabatan', id: item.id, sopId: item.sopId, judul: item.judul });
    setPesan(`${labelKlip(k)} — buka menu ⋯ di ${kecilItem} tujuan lalu pilih Tempel.`);
  }

  function potongJabatan(item: SopItem) {
    const k = simpanKlip({ tipe: 'jabatan', id: item.id, sopId: item.sopId, judul: item.judul, isCut: true });
    setPesan(`${labelKlip(k)} — buka menu ⋯ di tujuan lalu pilih "Pindahkan … ke sini". Ceklis & tugasnya ikut utuh.`);
  }

  function salinSub(sub: SopSubItem) {
    const k = simpanKlip({ tipe: 'sub-tugas', id: sub.id, itemId: sub.itemId, sopId: sub.sopId, judul: sub.judul });
    setPesan(`${labelKlip(k)} — buka menu ⋯ di ${kecilItem} tujuan lalu pilih Tempel.`);
  }

  function potongSub(sub: SopSubItem) {
    const k = simpanKlip({ tipe: 'sub-tugas', id: sub.id, itemId: sub.itemId, sopId: sub.sopId, judul: sub.judul, isCut: true });
    setPesan(`${labelKlip(k)} — buka menu ⋯ di ${kecilItem} tujuan lalu pilih "Pindahkan … ke sini".`);
  }

  function batalKlip() {
    bersihkanKlip();
    setPesan(null);
  }

  function dipotong(tipe: 'jabatan' | 'sub-tugas', id: string): boolean {
    return klip !== null && klip.isCut && klip.tipe === tipe && klip.id === id;
  }

  async function tempelSubKe(induk: SopItem, k: Extract<ItemKlip, { tipe: 'sub-tugas' }>) {
    await tempel(
      () => (k.isCut ? sopSvc.pindahkanSubItem(k.id, induk.id) : sopSvc.salinSubItem(k.id, induk.id)),
      k.isCut
        ? `${label.sub} "${k.judul}" dipindahkan ke "${induk.judul}".`
        : `Salinan ${kecilSub} "${k.judul}" ditambahkan di "${induk.judul}".`,
    );
  }

  async function tempelJabatanKe(k: Extract<ItemKlip, { tipe: 'jabatan' }>, rutin: string | undefined) {
    await tempel(
      () =>
        k.isCut
          ? sopSvc.pindahkanItem(k.id, { sopIdTujuan: sop.id, rutin })
          : sopSvc.salinItemKePapan(k.id, sop.id, { rutin }),
      k.isCut
        ? `${label.item} "${k.judul}" dipindahkan ke papan ini — ceklis & ${kecilSub}nya utuh.`
        : `Salinan ${kecilItem} "${k.judul}" ditambahkan di papan ini.`,
    );
  }

  async function tempelKeJabatan(target: SopItem) {
    const k = ambilKlip();
    if (!k) return;
    if (k.tipe === 'sub-tugas') await tempelSubKe(target, k);
    else if (k.tipe === 'jabatan') await tempelJabatanKe(k, opsi.rutinTempel(target));
  }

  async function tempelKeArea() {
    const k = ambilKlip();
    if (!k || k.tipe !== 'jabatan') return;
    await tempelJabatanKe(k, opsi.rutinTempel(undefined));
  }

  async function duplikatJabatan(item: SopItem) {
    await jalankan(
      () => sopSvc.duplikatItemSop(item.id),
      `"${item.judul}" diduplikat tepat di bawah aslinya — ceklis salinan kosong.`,
    );
  }

  async function duplikatSub(sub: SopSubItem) {
    await jalankan(() => sopSvc.salinSubItem(sub.id, sub.itemId), `"${sub.judul}" diduplikat — ceklis salinan kosong.`);
  }

  async function pindahJabatan(item: SopItem, arah: 'atas' | 'bawah') {
    await jalankan(() => sopSvc.pindahItemSop(item.id, arah), null);
  }

  async function pindahSub(sub: SopSubItem, arah: 'atas' | 'bawah') {
    await jalankan(() => sopSvc.pindahSubItemSop(sub.id, arah), null);
  }

  // ── Dialog jabatan ──
  function bukaTambahJabatan() {
    setFormJabatan({ ...FORM_JABATAN_KOSONG, rutin: opsi.rutinBaru });
    setErrorJabatan(null);
    setDialogJabatan({ item: null });
  }

  function bukaUbahJabatan(item: SopItem) {
    setFormJabatan({ judul: item.judul, picNama: item.picNama, catatan: item.catatan, rutin: item.rutin ?? '' });
    setErrorJabatan(null);
    setDialogJabatan({ item });
  }

  async function simpanJabatan() {
    if (!dialogJabatan) return;
    try {
      if (dialogJabatan.item) await sopSvc.ubahItemSop(dialogJabatan.item.id, formJabatan);
      else await sopSvc.tambahItemSop(sop.id, formJabatan);
      setDialogJabatan(null);
      await papan.muat();
    } catch (e) {
      setErrorJabatan(pesanError(e));
    }
  }

  // ── Dialog sub-tugas ──
  function bukaTambahSub(induk: SopItem) {
    setFormSub(FORM_SUB_KOSONG);
    setErrorSub(null);
    setDialogSub({ induk, sub: null });
  }

  function bukaUbahSub(induk: SopItem, sub: SopSubItem) {
    setFormSub({ judul: sub.judul, picNama: sub.picNama, catatan: sub.catatan });
    setErrorSub(null);
    setDialogSub({ induk, sub });
  }

  async function simpanSub() {
    if (!dialogSub) return;
    try {
      if (dialogSub.sub) await sopSvc.ubahSubItemSop(dialogSub.sub.id, formSub);
      else await sopSvc.tambahSubItemSop(dialogSub.induk.id, formSub);
      setDialogSub(null);
      await papan.muat();
    } catch (e) {
      setErrorSub(pesanError(e));
    }
  }

  // ── Hapus ──
  async function jalankanHapus() {
    if (!hapusTarget) return;
    const target = hapusTarget;
    setHapusTarget(null);
    await jalankan(
      () => (target.jenis === 'item' ? sopSvc.hapusItemSop(target.id) : sopSvc.hapusSubItemSop(target.id)),
      null,
    );
  }

  // ── Menu (dibangun saat dibuka, dari klip terkini) ──
  function bukaMenuJabatan(item: SopItem, posisi: Posisi) {
    setMenu({
      ...posisi,
      judul: `${label.item}: ${item.judul}`,
      items: bangunMenuJabatan({
        item,
        subs: papan.subByItem.get(item.id) ?? [],
        klip: ambilKlip(),
        label,
        aksi: {
          salin: () => salinJabatan(item),
          potong: () => potongJabatan(item),
          tempel: () => void tempelKeJabatan(item),
          duplikat: () => void duplikatJabatan(item),
          tambahSub: () => bukaTambahSub(item),
          ubah: () => bukaUbahJabatan(item),
          hapus: () => setHapusTarget({ jenis: 'item', id: item.id, judul: item.judul }),
        },
      }),
    });
  }

  function bukaMenuSub(induk: SopItem, sub: SopSubItem, posisi: Posisi) {
    setMenu({
      ...posisi,
      judul: `${label.sub}: ${sub.judul}`,
      items: bangunMenuSub({
        induk,
        sub,
        klip: ambilKlip(),
        label,
        aksi: {
          salin: () => salinSub(sub),
          potong: () => potongSub(sub),
          tempel: () => {
            const k = ambilKlip();
            if (k?.tipe === 'sub-tugas') void tempelSubKe(induk, k);
          },
          duplikat: () => void duplikatSub(sub),
          centang: () => void papan.centangSub(sub, !sub.selesai),
          ubah: () => bukaUbahSub(induk, sub),
          hapus: () => setHapusTarget({ jenis: 'sub', id: sub.id, judul: sub.judul }),
        },
      }),
    });
  }

  function bukaMenuArea(posisi: Posisi) {
    const ekstra = opsi.menuArea?.() ?? {};
    setMenu({
      ...posisi,
      judul: sop.judul,
      items: bangunMenuArea({
        klip: ambilKlip(),
        label,
        semuaTerbuka: ekstra.semuaTerbuka,
        aksi: {
          tambah: bukaTambahJabatan,
          tempel: () => void tempelKeArea(),
          bukaSemua: ekstra.bukaSemua,
          modeDaftar: ekstra.modeDaftar,
        },
      }),
    });
  }

  return {
    klip,
    pesan,
    tutupPesan: () => setPesan(null),
    batalKlip,
    dipotong,
    menu,
    tutupMenu: () => setMenu(null),
    bukaMenuJabatan,
    bukaMenuSub,
    bukaMenuArea,
    dialogJabatan,
    formJabatan,
    setFormJabatan,
    errorJabatan,
    bukaTambahJabatan,
    bukaUbahJabatan,
    simpanJabatan,
    tutupDialogJabatan: () => setDialogJabatan(null),
    dialogSub,
    formSub,
    setFormSub,
    errorSub,
    bukaTambahSub,
    bukaUbahSub,
    simpanSub,
    tutupDialogSub: () => setDialogSub(null),
    hapusTarget,
    mintaHapusJabatan: (item) => setHapusTarget({ jenis: 'item', id: item.id, judul: item.judul }),
    mintaHapusSub: (sub) => setHapusTarget({ jenis: 'sub', id: sub.id, judul: sub.judul }),
    batalHapus: () => setHapusTarget(null),
    jalankanHapus,
    salinJabatan,
    potongJabatan,
    duplikatJabatan,
    tempelKeJabatan,
    tempelKeArea,
    salinSub,
    potongSub,
    duplikatSub,
    pindahJabatan,
    pindahSub,
  };
}
