'use client';

// Matriks Jadwal KBM — editor jadwal mingguan yang dirender sebagai isi lembar
// PrintReadyCanvas (sesi 22, ditulis ulang dari versi sesi 21).
//
// Susunan:
//   - KbmToolbar (components/kbm/KbmToolbar.tsx): kontrol layar — di-portal ke
//     slot `#kanvas-toolbar-slot` milik PrintReadyCanvas (DI LUAR lembar);
//     fallback inline di atas kop bila slot tidak ada.
//   - KbmLembar (components/kbm/KbmLembar.tsx): kop + tabel + legenda, isi
//     kertas bergaya dokumen.
//   - Berkas ini: state, aturan bisnis (filter kelas/musyrif, salin/potong/
//     tempel lewat papan klip bertipe, template kustom, impor/ekspor JSON),
//     dialog (FormDialog/KonfirmasiDialog — nol window.alert/confirm), dan
//     ContextMenu (klik kanan atau tombol ⋯ per sel, karena HP tidak punya
//     klik kanan).
//
// Aturan data:
//   - nama hari kanonik ('Jumat', 'Ahad') — data dari storage/impor sudah
//     dinormalisasi oleh lib/presets (lib/kbm/hari.ts), tampilan memakai
//     labelHari();
//   - `ke` pada daftarJam = nomor baris (kunci sel), `nomorSesi` = JP resmi;
//   - jadwal aktif disimpan di localStorage pada setiap perubahan; bila jadwal
//     aktif adalah template kustom, salinannya di katalog ikut diperbarui
//     (sebelumnya berpindah template lalu kembali = suntingan hilang);
//   - template kustom menyimpan `asalId` (preset bawaan sumbernya) agar
//     "Reset ke bawaan" mengembalikan ke preset yang benar.
//
// Tidak ada elemen `position: fixed` di sini: lembar diskalakan dengan
// transform, jadi `fixed` di dalamnya terjebak relatif ke kertas. Umpan balik
// = pesan inline di toolbar; dialog & ContextMenu menjadi tanggung jawab
// komponennya sendiri.

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { EntriJadwal, HariKbm, ModelJadwalKbm, SesiJam } from '../types/kbm';
import {
  bacaJadwalKbmLokal,
  simpanJadwalKbmLokal,
  bacaSemuaKatalogKbm,
  simpanTemplateKbmKustom,
  hapusTemplateKbmKustom,
  eksporJadwalJson,
  imporJadwalJson,
  DAFTAR_PRESET_KBM,
} from '../lib/presets';
import { buatId } from '../db/schema';
import { unduhBerkas } from '../lib/unduh';
import { FormDialog, KonfirmasiDialog } from './AppDialog';
import { ContextMenu, type ItemMenuKlikKanan } from './ContextMenu';
import { simpanKlip, ambilKlipTipe, bersihkanKlip } from '../lib/clipboard/appClipboard';
import { useKlip } from '../lib/clipboard/useKlip';
import { labelHari } from '../lib/kbm/hari';
import { ambilIkonMapel } from '../lib/ikonKontekstual';
import { KELAS } from '../ui/kelas';
import { KbmToolbar } from './kbm/KbmToolbar';
import { KbmLembar, PILIHAN_WARNA } from './kbm/KbmLembar';

/** Kontrak dengan PrintReadyCanvas: id elemen slot toolbar di luar lembar. */
const ID_SLOT_TOOLBAR = 'kanvas-toolbar-slot';
/** Nilai `kelas` untuk entri yang berlaku bagi semua kelas/halaqah. */
const KELAS_SEMUA = 'Semua Santri / Halaqah';
const PEMISAH: ItemMenuKlikKanan = { pemisah: true, label: '', onClick: () => {} };

type IsiSel = Pick<EntriJadwal, 'mapel' | 'guru' | 'ruang' | 'warna'>;

interface FormEntri extends IsiSel {
  id?: string;
  hari: HariKbm;
  jamKe: number;
  kelas: string;
  mapel: string;
  guru: string;
  ruang: string;
  warna: string;
}

interface FormKop {
  judul: string;
  tahunAjaran: string;
  subJudul: string;
  /** `ke` di sini = nomor baris ASAL (tidak diubah selama menyunting) —
   *  dipakai memetakan ulang entri saat baris dihapus/berpindah. */
  daftarJam: SesiJam[];
}

type Konfirmasi = { jenis: 'reset' } | { jenis: 'hapus'; id: string; nama: string };

interface MenuTerbuka {
  x: number;
  y: number;
  /** Kotak tombol ⋯ pemicu — menu ditempatkan di bawahnya (klik kanan: tanpa jangkar). */
  anchor?: DOMRect;
  judul?: string;
  items: ItemMenuKlikKanan[];
}

const FORM_ENTRI_KOSONG: FormEntri = { hari: 'Senin', jamKe: 1, kelas: '', mapel: '', guru: '', ruang: '', warna: 'kuning' };
const FORM_TAMBAH_JAM_KOSONG = { label: '', nomorSesi: '', istirahat: false, warna: 'kuning' };

export function KbmMatriksView() {
  const [jadwal, setJadwal] = useState<ModelJadwalKbm>(() => bacaJadwalKbmLokal());
  const [katalog, setKatalog] = useState<ModelJadwalKbm[]>(() => bacaSemuaKatalogKbm());
  const [kelasTerpilih, setKelasTerpilih] = useState('');
  const [guruFilter, setGuruFilter] = useState('');
  const [pesan, setPesan] = useState<string | null>(null);
  // undefined = slot belum dicari (toolbar belum dirender, agar tidak berkedip
  // sesaat di dalam lembar); null = tidak ada slot → fallback inline.
  const [slotToolbar, setSlotToolbar] = useState<HTMLElement | null | undefined>(undefined);
  const klip = useKlip();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dialogEntriBuka, setDialogEntriBuka] = useState(false);
  const [formEntri, setFormEntri] = useState<FormEntri>(FORM_ENTRI_KOSONG);
  const [galatEntri, setGalatEntri] = useState<string | null>(null);
  const [dialogKopBuka, setDialogKopBuka] = useState(false);
  const [formKop, setFormKop] = useState<FormKop>({ judul: '', tahunAjaran: '', subJudul: '', daftarJam: [] });
  const [dialogTambahJamBuka, setDialogTambahJamBuka] = useState(false);
  const [formTambahJam, setFormTambahJam] = useState(FORM_TAMBAH_JAM_KOSONG);
  const [dialogSimpanKustomBuka, setDialogSimpanKustomBuka] = useState(false);
  const [namaTemplateBaru, setNamaTemplateBaru] = useState('');
  const [dialogImporBuka, setDialogImporBuka] = useState(false);
  const [teksJsonImpor, setTeksJsonImpor] = useState('');
  const [galatImpor, setGalatImpor] = useState<string | null>(null);
  const [konfirmasi, setKonfirmasi] = useState<Konfirmasi | null>(null);
  const [menu, setMenu] = useState<MenuTerbuka | null>(null);

  // Slot toolbar dicari sekali setelah mount: PrintReadyCanvas merender slot
  // dalam commit yang sama dengan anak-anaknya, dan elemennya tidak dibuat
  // ulang selama komponen ini hidup (berganti dokumen = komponen ini unmount).
  useEffect(() => {
    setSlotToolbar(document.getElementById(ID_SLOT_TOOLBAR));
  }, []);

  useEffect(() => {
    if (!kelasTerpilih && jadwal.daftarKelas.length > 0) setKelasTerpilih(jadwal.daftarKelas[0]);
  }, [jadwal, kelasTerpilih]);

  useEffect(() => {
    if (!pesan) return;
    const timer = setTimeout(() => setPesan(null), 4000);
    return () => clearTimeout(timer);
  }, [pesan]);

  const daftarGuru = useMemo(() => {
    const s = new Set<string>();
    for (const e of jadwal.entri) if (e.guru) s.add(e.guru);
    return Array.from(s).sort();
  }, [jadwal.entri]);

  const templateKustom = useMemo(() => katalog.filter((k) => k.kustom), [katalog]);
  const isKustom = templateKustom.some((k) => k.id === jadwal.id);
  /** Preset bawaan yang menjadi asal jadwal ini (untuk Reset). */
  const presetAsal =
    DAFTAR_PRESET_KBM.find((p) => p.id === jadwal.asalId) ?? DAFTAR_PRESET_KBM.find((p) => p.id === jadwal.id) ?? null;
  const idEntriDipotong = klip?.tipe === 'kbm' && klip.isCut ? klip.entri.id : null;

  // ── Pembacaan sel ──────────────────────────────────────────────────────
  function cocokFilter(e: EntriJadwal): boolean {
    if (guruFilter) return e.guru === guruFilter;
    return !e.kelas || e.kelas === kelasTerpilih || e.kelas === KELAS_SEMUA;
  }

  function ambilEntriDari(daftar: EntriJadwal[], hari: HariKbm, jamKe: number): EntriJadwal | undefined {
    return daftar.find((e) => e.hari === hari && e.jamKe === jamKe && cocokFilter(e));
  }

  function ambilEntri(hari: HariKbm, jamKe: number): EntriJadwal | undefined {
    return ambilEntriDari(jadwal.entri, hari, jamKe);
  }

  function kelasTujuan(): string {
    return kelasTerpilih || jadwal.daftarKelas[0] || KELAS_SEMUA;
  }

  /** Tulis isi ke sel: timpa entri yang tampil di sel itu, atau buat baru. */
  function tulisSel(daftar: EntriJadwal[], hari: HariKbm, jamKe: number, isi: IsiSel): EntriJadwal[] {
    const ada = ambilEntriDari(daftar, hari, jamKe);
    if (ada) return daftar.map((x) => (x.id === ada.id ? { ...x, ...isi } : x));
    return [...daftar, { id: buatId(), hari, jamKe, kelas: kelasTujuan(), ...isi }];
  }

  // ── Penyimpanan ────────────────────────────────────────────────────────
  /** Muat jadwal lain (ganti template / reset) — tanpa cap perubahan. */
  function muatJadwal(baru: ModelJadwalKbm, teks?: string) {
    setJadwal(baru);
    simpanJadwalKbmLokal(baru);
    setKatalog(bacaSemuaKatalogKbm());
    if (teks) setPesan(teks);
  }

  /** Terapkan perubahan isi: cap diubahPada; template kustom ikut diperbarui di katalog. */
  function perbaruiJadwal(baru: ModelJadwalKbm, teks?: string) {
    const bercap: ModelJadwalKbm = { ...baru, diubahPada: new Date().toISOString() };
    if (bercap.kustom && templateKustom.some((k) => k.id === bercap.id)) simpanTemplateKbmKustom(bercap);
    muatJadwal(bercap, teks);
  }

  function gantiTemplate(id: string) {
    const pilihan = katalog.find((p) => p.id === id);
    if (!pilihan) return;
    muatJadwal(pilihan, `Template "${pilihan.judul}" dimuat.`);
    setKelasTerpilih(pilihan.daftarKelas[0] || '');
    setGuruFilter('');
  }

  // ── Menu sel (klik kanan / tombol ⋯) ───────────────────────────────────
  function bangunMenuSel(hari: HariKbm, jamKe: number): ItemMenuKlikKanan[] {
    const entri = ambilEntri(hari, jamKe);
    const klipKbm = ambilKlipTipe('kbm');
    const idxJam = jadwal.daftarJam.findIndex((j) => j.ke === jamKe);
    const jamBerikut = idxJam === -1 ? undefined : jadwal.daftarJam[idxJam + 1];
    const items: ItemMenuKlikKanan[] = [];

    if (entri) {
      items.push({
        label: 'Salin sesi',
        ikon: '📋',
        onClick: () => {
          simpanKlip({ tipe: 'kbm', entri });
          setPesan(`Sesi "${entri.mapel}" disalin — buka menu sel tujuan lalu pilih Tempel.`);
        },
      });
      items.push({
        label: 'Potong sesi',
        ikon: '✂️',
        onClick: () => {
          simpanKlip({ tipe: 'kbm', entri, isCut: true });
          setPesan(`Sesi "${entri.mapel}" dipotong — Tempel di sel tujuan untuk memindahkannya.`);
        },
      });
      items.push({
        label: 'Duplikat ke jam berikutnya',
        ikon: '📑',
        disabled: !jamBerikut,
        onClick: () => {
          if (!jamBerikut) return;
          const isi: IsiSel = { mapel: entri.mapel, guru: entri.guru, ruang: entri.ruang, warna: entri.warna };
          perbaruiJadwal({ ...jadwal, entri: tulisSel(jadwal.entri, hari, jamBerikut.ke, isi) }, 'Sesi diduplikat ke jam berikutnya.');
        },
      });
    }

    items.push({
      label: 'Tempel ke sel ini',
      ikon: '📥',
      disabled: !klipKbm,
      onClick: () => {
        if (!klipKbm) return;
        const { entri: sumber, isCut } = klipKbm;
        const isi: IsiSel = { mapel: sumber.mapel, guru: sumber.guru, ruang: sumber.ruang, warna: sumber.warna };
        const dasar = isCut ? jadwal.entri.filter((x) => x.id !== sumber.id) : jadwal.entri;
        if (isCut) bersihkanKlip();
        perbaruiJadwal({ ...jadwal, entri: tulisSel(dasar, hari, jamKe, isi) }, isCut ? 'Sesi dipindahkan.' : 'Sesi ditempel.');
      },
    });

    items.push(PEMISAH);
    items.push({ label: entri ? 'Ubah sesi' : 'Isi sesi', ikon: '✏️', onClick: () => bukaFormEntri(hari, jamKe) });
    if (entri) {
      items.push({ label: 'Kosongkan sel', ikon: '🗑️', bahaya: true, onClick: () => hapusEntri(entri.id) });
    }
    return items;
  }

  function bukaMenuSel(hari: HariKbm, jamKe: number, x: number, y: number, anchor?: DOMRect) {
    const jam = jadwal.daftarJam.find((j) => j.ke === jamKe);
    setMenu({ x, y, anchor, judul: `${labelHari(hari)} • ${jam?.label ?? `Jam ke-${jamKe}`}`, items: bangunMenuSel(hari, jamKe) });
  }

  // ── Menu jadwal (tombol ⋯ di toolbar) ──────────────────────────────────
  function bukaMenuJadwal(x: number, y: number, anchor?: DOMRect) {
    const items: ItemMenuKlikKanan[] = [
      { label: 'Edit kop & waktu', ikon: '✏️', onClick: bukaKustomisasiKop },
      { label: 'Tambah jam', ikon: '➕', onClick: () => setDialogTambahJamBuka(true) },
      { label: 'Simpan sbg template', ikon: '✨', onClick: bukaSimpanTemplateBaru },
      PEMISAH,
      { label: 'Reset ke bawaan', ikon: '🔄', disabled: !presetAsal, onClick: () => setKonfirmasi({ jenis: 'reset' }) },
      { label: 'Ekspor JSON', ikon: '📤', onClick: () => void unduhJadwalJson() },
      {
        label: 'Impor JSON',
        ikon: '📥',
        onClick: () => {
          setGalatImpor(null);
          setDialogImporBuka(true);
        },
      },
    ];
    if (isKustom) {
      items.push(PEMISAH, {
        label: 'Hapus template kustom',
        ikon: '🗑️',
        bahaya: true,
        onClick: () => setKonfirmasi({ jenis: 'hapus', id: jadwal.id, nama: jadwal.judul }),
      });
    }
    setMenu({ x, y, anchor, judul: jadwal.judul, items });
  }

  // ── Entri sel ──────────────────────────────────────────────────────────
  function bukaFormEntri(hari: HariKbm, jamKe: number) {
    const ada = ambilEntri(hari, jamKe);
    const sesiJam = jadwal.daftarJam.find((j) => j.ke === jamKe);
    setFormEntri(
      ada
        ? {
            id: ada.id,
            hari: ada.hari,
            jamKe: ada.jamKe,
            kelas: ada.kelas || kelasTujuan(),
            mapel: ada.mapel,
            guru: ada.guru || '',
            ruang: ada.ruang || '',
            warna: ada.warna || sesiJam?.warna || 'kuning',
          }
        : { hari, jamKe, kelas: kelasTujuan(), mapel: '', guru: '', ruang: '', warna: sesiJam?.warna || 'kuning' },
    );
    setGalatEntri(null);
    setDialogEntriBuka(true);
  }

  function simpanEntri() {
    const isi: IsiSel = { mapel: formEntri.mapel.trim(), guru: formEntri.guru.trim(), ruang: formEntri.ruang.trim(), warna: formEntri.warna };
    if (!isi.mapel) {
      setGalatEntri('Nama kegiatan wajib diisi.');
      return;
    }
    const entri = formEntri.id
      ? jadwal.entri.map((e) => (e.id === formEntri.id ? { ...e, ...isi } : e))
      : [...jadwal.entri, { id: buatId(), hari: formEntri.hari, jamKe: formEntri.jamKe, kelas: formEntri.kelas, ...isi }];
    perbaruiJadwal({ ...jadwal, entri }, 'Sesi disimpan.');
    setDialogEntriBuka(false);
  }

  function hapusEntri(id: string) {
    perbaruiJadwal({ ...jadwal, entri: jadwal.entri.filter((e) => e.id !== id) }, 'Sesi dikosongkan.');
    setDialogEntriBuka(false);
  }

  // ── Kop & baris jam ────────────────────────────────────────────────────
  function bukaKustomisasiKop() {
    setFormKop({
      judul: jadwal.judul,
      tahunAjaran: jadwal.tahunAjaran || '',
      subJudul: jadwal.subJudul || '',
      daftarJam: jadwal.daftarJam.map((j) => ({ ...j })),
    });
    setDialogKopBuka(true);
  }

  function simpanKopDanBarisJam() {
    // Baris dinomori ulang; entri dipetakan dari `ke` asal ke `ke` baru, entri
    // pada baris yang dihapus ikut dibuang (sebelumnya entri bergeser ke baris
    // lain setelah satu baris dihapus).
    const petaKe = new Map<number, number>();
    const daftarJam = formKop.daftarJam.map((j, i) => {
      petaKe.set(j.ke, i + 1);
      return { ...j, ke: i + 1 };
    });
    const entri = jadwal.entri.flatMap((e) => {
      const ke = petaKe.get(e.jamKe);
      if (ke === undefined) return [];
      return [ke === e.jamKe ? e : { ...e, jamKe: ke }];
    });
    perbaruiJadwal(
      {
        ...jadwal,
        judul: formKop.judul.trim() || jadwal.judul,
        tahunAjaran: formKop.tahunAjaran.trim(),
        subJudul: formKop.subJudul.trim(),
        daftarJam,
        entri,
      },
      'Kop dan baris jam diperbarui.',
    );
    setDialogKopBuka(false);
  }

  function tambahBarisJamBaru() {
    const keBaru = jadwal.daftarJam.reduce((maks, j) => Math.max(maks, j.ke), 0) + 1;
    const nomor = formTambahJam.nomorSesi.trim() ? Number.parseInt(formTambahJam.nomorSesi, 10) : Number.NaN;
    const baru: SesiJam = {
      ke: keBaru,
      label: formTambahJam.label.trim() || `Jam ke-${keBaru}`,
      nomorSesi: Number.isFinite(nomor) ? nomor : null,
      istirahat: formTambahJam.istirahat,
      warna: formTambahJam.warna,
    };
    perbaruiJadwal({ ...jadwal, daftarJam: [...jadwal.daftarJam, baru] }, `Baris jam "${baru.label}" ditambahkan.`);
    setDialogTambahJamBuka(false);
    setFormTambahJam(FORM_TAMBAH_JAM_KOSONG);
  }

  // ── Template kustom ────────────────────────────────────────────────────
  function bukaSimpanTemplateBaru() {
    setNamaTemplateBaru(`${jadwal.judul} (Kustom)`);
    setDialogSimpanKustomBuka(true);
  }

  function prosesSimpanTemplateKustom() {
    const nama = namaTemplateBaru.trim();
    if (!nama) return;
    const kini = new Date().toISOString();
    const baru: ModelJadwalKbm = {
      ...jadwal,
      id: `kbm-kustom-${Date.now()}`,
      judul: nama,
      kustom: true,
      asalId: jadwal.asalId ?? (DAFTAR_PRESET_KBM.some((p) => p.id === jadwal.id) ? jadwal.id : undefined),
      dibuatPada: kini,
      diubahPada: kini,
    };
    simpanTemplateKbmKustom(baru);
    muatJadwal(baru, `Template kustom "${baru.judul}" disimpan ke katalog.`);
    setDialogSimpanKustomBuka(false);
  }

  function jalankanReset() {
    if (!presetAsal) return;
    if (isKustom) {
      // Template kustom turunan preset: isinya dikembalikan, identitasnya
      // (id, nama, asal, tanggal buat) dipertahankan.
      perbaruiJadwal(
        { ...presetAsal, id: jadwal.id, judul: jadwal.judul, kustom: true, asalId: presetAsal.id, dibuatPada: jadwal.dibuatPada },
        `Isi "${jadwal.judul}" dikembalikan ke bawaan "${presetAsal.judul}".`,
      );
    } else {
      muatJadwal(presetAsal, `Jadwal dikembalikan ke bawaan "${presetAsal.judul}".`);
    }
    setKonfirmasi(null);
  }

  function jalankanHapusTemplate(id: string, nama: string) {
    hapusTemplateKbmKustom(id);
    setKatalog(bacaSemuaKatalogKbm());
    if (id === jadwal.id) {
      // Hanya bila yang dihapus memang jadwal aktif — pindah ke preset asalnya.
      const pengganti = presetAsal ?? DAFTAR_PRESET_KBM[0];
      muatJadwal(pengganti, `Template "${nama}" dihapus; kembali ke "${pengganti.judul}".`);
      setKelasTerpilih(pengganti.daftarKelas[0] || '');
      setGuruFilter('');
    } else {
      setPesan(`Template "${nama}" dihapus.`);
    }
    setKonfirmasi(null);
  }

  // ── Ekspor / impor JSON ────────────────────────────────────────────────
  async function unduhJadwalJson() {
    const blob = new Blob([eksporJadwalJson(jadwal)], { type: 'application/json;charset=utf-8' });
    const nama = `tartib-jadwal-${(jadwal.judul || 'jadwal').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.json`;
    const hasil = await unduhBerkas(nama, blob);
    if (!hasil.dibatalkan) setPesan(`Berkas ${nama} siap — bisa diimpor kembali lewat menu Impor JSON.`);
  }

  function terapkanImpor(teks: string, sumber: string) {
    try {
      const hasil = imporJadwalJson(teks);
      simpanTemplateKbmKustom(hasil);
      muatJadwal(hasil, `Jadwal "${hasil.judul}" dari ${sumber} diimpor sebagai template kustom.`);
      setKelasTerpilih(hasil.daftarKelas[0] || '');
      setGuruFilter('');
      setDialogImporBuka(false);
      setTeksJsonImpor('');
      setGalatImpor(null);
    } catch (err) {
      setGalatImpor(err instanceof Error ? err.message : 'Gagal mengimpor JSON.');
    }
  }

  function handleFileImpor(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => terapkanImpor(typeof ev.target?.result === 'string' ? ev.target.result : '', `berkas "${file.name}"`);
    reader.onerror = () => setGalatImpor(`Berkas "${file.name}" tidak dapat dibaca.`);
    reader.readAsText(file);
  }

  // ── Render ─────────────────────────────────────────────────────────────
  const toolbar = (
    <KbmToolbar
      jadwal={jadwal}
      presetBawaan={DAFTAR_PRESET_KBM}
      templateKustom={templateKustom}
      kelasTerpilih={kelasTerpilih}
      guruFilter={guruFilter}
      daftarGuru={daftarGuru}
      pesan={pesan}
      klip={klip}
      onGantiTemplate={gantiTemplate}
      onGantiKelas={(k) => {
        setKelasTerpilih(k);
        setGuruFilter('');
      }}
      onGantiGuru={setGuruFilter}
      onSimpan={() => perbaruiJadwal(jadwal, 'Jadwal disimpan di perangkat ini.')}
      onBukaMenu={bukaMenuJadwal}
      onBatalKlip={bersihkanKlip}
    />
  );

  const keteranganKop = guruFilter
    ? `Jadwal khusus Musyrif: ${guruFilter}`
    : `Kelas / Halaqah: ${kelasTerpilih || 'Semua santri'}`;

  return (
    <>
      {slotToolbar === undefined
        ? null
        : slotToolbar
          ? createPortal(toolbar, slotToolbar)
          : <div className="mb-3 flex flex-wrap items-center gap-1.5 print:hidden">{toolbar}</div>}

      <KbmLembar
        jadwal={jadwal}
        keterangan={keteranganKop}
        ambilEntri={ambilEntri}
        idEntriDipotong={idEntriDipotong}
        onKlikSel={bukaFormEntri}
        onMenuSel={bukaMenuSel}
      />

      {/* ── Dialog entri sel ─────────────────────────────────────────── */}
      <FormDialog
        terbuka={dialogEntriBuka}
        judul={formEntri.id ? 'Ubah sesi' : 'Isi sesi'}
        onTutup={() => setDialogEntriBuka(false)}
        onSimpan={simpanEntri}
        error={galatEntri}
      >
        <div className="space-y-3 text-xs">
          <div className={`flex items-center gap-2.5 ${KELAS.blok}`}>
            <span className="select-none text-2xl" aria-hidden="true">
              {ambilIkonMapel(formEntri.mapel)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-teks-utama">
                {labelHari(formEntri.hari)} • {jadwal.daftarJam.find((j) => j.ke === formEntri.jamKe)?.label ?? `Jam ke-${formEntri.jamKe}`}
              </p>
              <p className={KELAS.keteranganKecil}>Kelas / halaqah: {formEntri.kelas}</p>
            </div>
          </div>

          <div>
            <label className={KELAS.label} htmlFor="kbm-mapel">
              Nama kegiatan / mata pelajaran
            </label>
            <input
              id="kbm-mapel"
              value={formEntri.mapel}
              onChange={(e) => {
                setFormEntri({ ...formEntri, mapel: e.target.value });
                if (galatEntri) setGalatEntri(null);
              }}
              placeholder="mis. Qiyamullail berjamaah, Majelis Sabqi Pagi, Fiqih"
              className={`mt-1 ${KELAS.input}`}
              autoFocus
            />
          </div>

          <div>
            <label className={KELAS.label} htmlFor="kbm-guru">
              Pengampu / musyrif (opsional)
            </label>
            <input
              id="kbm-guru"
              value={formEntri.guru}
              onChange={(e) => setFormEntri({ ...formEntri, guru: e.target.value })}
              placeholder="mis. Ust. Farhan, Pembina Asrama"
              className={`mt-1 ${KELAS.input}`}
            />
          </div>

          <div>
            <label className={KELAS.label} htmlFor="kbm-ruang">
              Ruang / lokasi (opsional)
            </label>
            <input
              id="kbm-ruang"
              value={formEntri.ruang}
              onChange={(e) => setFormEntri({ ...formEntri, ruang: e.target.value })}
              placeholder="mis. Masjid utama, Aula lt. 2"
              className={`mt-1 ${KELAS.input}`}
            />
          </div>

          <div>
            <span className={KELAS.label}>Warna sorotan sel</span>
            <div className="mt-1.5 grid grid-cols-2 gap-1.5">
              {PILIHAN_WARNA.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  aria-pressed={formEntri.warna === w.id}
                  onClick={() => setFormEntri({ ...formEntri, warna: w.id })}
                  className={`flex min-h-10 items-center gap-1.5 rounded-kontrol border p-1.5 text-left text-[11px] font-medium ${
                    formEntri.warna === w.id
                      ? `${w.bg} ${w.border} ${w.teks} font-semibold ring-2 ring-aksen-600`
                      : 'border-white/80 bg-permukaan-kartu text-teks-sedang hover:bg-white/75'
                  }`}
                >
                  <span className={`h-3.5 w-3.5 shrink-0 rounded-full border ${w.bg} ${w.border}`} />
                  <span className="truncate">{w.label}</span>
                </button>
              ))}
            </div>
          </div>

          {formEntri.id && (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => formEntri.id && hapusEntri(formEntri.id)}
                className={`${KELAS.tombolBahaya} w-full`}
              >
                Kosongkan sel ini
              </button>
            </div>
          )}
        </div>
      </FormDialog>

      {/* ── Dialog kop & baris jam ───────────────────────────────────── */}
      <FormDialog
        terbuka={dialogKopBuka}
        judul="Edit kop & baris jam"
        onTutup={() => setDialogKopBuka(false)}
        onSimpan={simpanKopDanBarisJam}
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className={KELAS.label} htmlFor="kop-judul">
              Judul jadwal
            </label>
            <input
              id="kop-judul"
              value={formKop.judul}
              onChange={(e) => setFormKop({ ...formKop, judul: e.target.value })}
              placeholder="mis. Jadwal Harian Pesantren Tahfidz"
              className={`mt-1 ${KELAS.input}`}
            />
          </div>

          <div>
            <label className={KELAS.label} htmlFor="kop-tahun">
              Tahun ajaran (baris kedua kop)
            </label>
            <input
              id="kop-tahun"
              value={formKop.tahunAjaran}
              onChange={(e) => setFormKop({ ...formKop, tahunAjaran: e.target.value })}
              placeholder="mis. TAHUN AJARAN 2026-2027"
              className={`mt-1 ${KELAS.input}`}
            />
          </div>

          <div>
            <label className={KELAS.label} htmlFor="kop-subjudul">
              Label kepala kolom hari
            </label>
            <input
              id="kop-subjudul"
              value={formKop.subJudul}
              onChange={(e) => setFormKop({ ...formKop, subJudul: e.target.value })}
              placeholder="mis. Hari / Mata Pelajaran"
              className={`mt-1 ${KELAS.input}`}
            />
          </div>

          <div className="border-t border-garis pt-3">
            <p className="mb-2 font-semibold text-teks-utama">Baris jam ({formKop.daftarJam.length} sesi)</p>
            <div className="max-h-60 space-y-1.5 overflow-y-auto pr-1">
              {formKop.daftarJam.map((jam, idx) => (
                <div key={jam.ke} className={`flex items-center gap-2 ${KELAS.blok}`}>
                  <span className="w-6 text-center font-semibold text-teks-halus">#{idx + 1}</span>
                  <div className="grid flex-1 grid-cols-2 gap-2">
                    <input
                      type="text"
                      aria-label={`Rentang waktu baris ${idx + 1}`}
                      value={jam.label}
                      onChange={(e) => {
                        const copy = [...formKop.daftarJam];
                        copy[idx] = { ...copy[idx], label: e.target.value };
                        setFormKop({ ...formKop, daftarJam: copy });
                      }}
                      placeholder="mis. 03.00 - 03.45"
                      className={`${KELAS.inputKecil} w-full text-xs`}
                    />
                    <input
                      type="number"
                      aria-label={`Nomor sesi resmi baris ${idx + 1}`}
                      value={jam.nomorSesi ?? ''}
                      onChange={(e) => {
                        const val = e.target.value ? Number.parseInt(e.target.value, 10) : null;
                        const copy = [...formKop.daftarJam];
                        copy[idx] = { ...copy[idx], nomorSesi: val };
                        setFormKop({ ...formKop, daftarJam: copy });
                      }}
                      placeholder="No. sesi (1..8)"
                      className={`${KELAS.inputKecil} w-full text-xs`}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormKop({ ...formKop, daftarJam: formKop.daftarJam.filter((_, i) => i !== idx) })}
                    className={`${KELAS.tombolBahayaHalus} min-h-10 px-2`}
                    aria-label={`Hapus baris ${idx + 1}`}
                    title="Hapus baris ini (sesi di baris ini ikut dihapus)"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </FormDialog>

      {/* ── Dialog tambah baris jam ──────────────────────────────────── */}
      <FormDialog
        terbuka={dialogTambahJamBuka}
        judul="Tambah baris jam"
        onTutup={() => setDialogTambahJamBuka(false)}
        onSimpan={tambahBarisJamBaru}
        labelSimpan="Tambah"
      >
        <div className="space-y-3 text-xs">
          <div>
            <label className={KELAS.label} htmlFor="tambah-jam-label">
              Rentang waktu
            </label>
            <input
              id="tambah-jam-label"
              value={formTambahJam.label}
              onChange={(e) => setFormTambahJam({ ...formTambahJam, label: e.target.value })}
              placeholder="mis. 21.15 - 22.00"
              className={`mt-1 ${KELAS.input}`}
              autoFocus
            />
          </div>

          <div>
            <label className={KELAS.label} htmlFor="tambah-jam-nomor">
              Nomor sesi resmi (opsional, mis. 1 … 8)
            </label>
            <input
              id="tambah-jam-nomor"
              type="number"
              value={formTambahJam.nomorSesi}
              onChange={(e) => setFormTambahJam({ ...formTambahJam, nomorSesi: e.target.value })}
              placeholder="Kosongkan bila bukan sesi bernomor"
              className={`mt-1 ${KELAS.input}`}
            />
          </div>

          <label htmlFor="tambah-jam-istirahat" className="flex min-h-10 items-center gap-2 text-teks-sedang">
            <input
              type="checkbox"
              id="tambah-jam-istirahat"
              checked={formTambahJam.istirahat}
              onChange={(e) => setFormTambahJam({ ...formTambahJam, istirahat: e.target.checked })}
              className="h-5 w-5 rounded border-garis text-aksen-600 focus:ring-aksen-500"
            />
            Waktu istirahat / tidur / jeda
          </label>
        </div>
      </FormDialog>

      {/* ── Dialog simpan sebagai template ───────────────────────────── */}
      <FormDialog
        terbuka={dialogSimpanKustomBuka}
        judul="Simpan sebagai template kustom"
        onTutup={() => setDialogSimpanKustomBuka(false)}
        onSimpan={prosesSimpanTemplateKustom}
      >
        <div className="space-y-3 text-xs">
          <p className={KELAS.keterangan}>
            Susunan jadwal saat ini disimpan ke katalog sebagai template baru, bisa dipakai lagi atau diduplikat kapan saja.
          </p>
          <div>
            <label className={KELAS.label} htmlFor="simpan-kustom-nama">
              Nama template
            </label>
            <input
              id="simpan-kustom-nama"
              value={namaTemplateBaru}
              onChange={(e) => setNamaTemplateBaru(e.target.value)}
              placeholder="mis. Jadwal Santriwati 2026-2027"
              className={`mt-1 ${KELAS.input}`}
              autoFocus
            />
          </div>
        </div>
      </FormDialog>

      {/* ── Dialog impor JSON ────────────────────────────────────────── */}
      <FormDialog
        terbuka={dialogImporBuka}
        judul="Impor template jadwal (JSON)"
        onTutup={() => setDialogImporBuka(false)}
        onSimpan={() => terapkanImpor(teksJsonImpor, 'teks')}
        labelSimpan="Impor"
        error={galatImpor}
      >
        <div className="space-y-3 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className={KELAS.keterangan}>Pilih berkas .json hasil Ekspor, atau tempel teksnya:</span>
            <button type="button" onClick={() => fileInputRef.current?.click()} className={KELAS.tombolSekunderKecil}>
              Pilih berkas JSON
            </button>
            <input ref={fileInputRef} type="file" accept=".json,application/json" onChange={handleFileImpor} className="hidden" />
          </div>
          <textarea
            aria-label="Teks JSON jadwal"
            value={teksJsonImpor}
            onChange={(e) => {
              setTeksJsonImpor(e.target.value);
              if (galatImpor) setGalatImpor(null);
            }}
            rows={8}
            placeholder="Tempel teks JSON jadwal di sini…"
            className={`font-mono text-[11px] ${KELAS.input}`}
          />
        </div>
      </FormDialog>

      {/* ── Konfirmasi reset / hapus template ────────────────────────── */}
      <KonfirmasiDialog
        terbuka={konfirmasi?.jenis === 'reset'}
        judul="Reset ke bawaan?"
        pesan={
          presetAsal
            ? isKustom
              ? `Isi template "${jadwal.judul}" akan dikembalikan ke versi awal preset bawaan "${presetAsal.judul}". Semua suntingan pada template ini hilang.`
              : `Jadwal akan dikembalikan ke versi awal preset bawaan "${presetAsal.judul}". Suntingan yang belum disimpan sebagai template kustom hilang.`
            : ''
        }
        labelYa="Reset"
        onBatal={() => setKonfirmasi(null)}
        onYa={jalankanReset}
      />
      <KonfirmasiDialog
        terbuka={konfirmasi?.jenis === 'hapus'}
        judul="Hapus template kustom?"
        pesan={
          konfirmasi?.jenis === 'hapus'
            ? `Template "${konfirmasi.nama}" dihapus dari katalog perangkat ini dan tidak bisa dikembalikan.`
            : ''
        }
        onBatal={() => setKonfirmasi(null)}
        onYa={() => konfirmasi?.jenis === 'hapus' && jalankanHapusTemplate(konfirmasi.id, konfirmasi.nama)}
      />

      {/* ── Menu (klik kanan / tombol ⋯) ─────────────────────────────── */}
      {menu && (
        <ContextMenu x={menu.x} y={menu.y} anchor={menu.anchor} judul={menu.judul} items={menu.items} terbuka onTutup={() => setMenu(null)} />
      )}
    </>
  );
}
