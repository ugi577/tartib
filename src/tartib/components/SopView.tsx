'use client';

// Halaman ?view=sop (Batch X, arahan Ahmed: "tambahkan menu SOP untuk hal
// bersifat semi paten, misal SOP daftar tugas/amanah/khidmah santri dan
// PICnya yg mudah ceklist, dan menu SOP customable").
//
// Batch Y (arahan Ahmed): sub-tugas di dalam satu item ceklis ("mirip seperti
// anggota dan tugasnya"), kategori rutin (Harian/Mingguan/Bulanan/…),
// cetak PDF multi-ukuran (A4/F4/Letter/Legal/A5 lewat dialog cetak →
// "Save as PDF"), serta ekspor/impor .docx papan.
//
// Dua bagian dalam satu tab (pola sub-nav Pengaturan — aturan mobile K-21):
//   Amanah & Khidmah — papan baku SEMI-PATEN dari seed: struktur relatif
//     tetap (tidak dapat dihapus), isi & PIC bebas diubah, ceklis satu klik.
//   SOP Kustom — SOP berdiri sendiri buatan pengguna: buat, ubah, duplikat,
//     hapus, impor .docx. Tidak terikat acara maupun fase H-offset.

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { seedSopAmanah } from '../db/seed';
import { formatTanggalIndonesia, tanggalHariIni } from '../lib/tanggal';
import { bacaZip } from '../lib/impor/zip';
import { parseXmlLite } from '../lib/impor/xml';
import { dokumenXmlKeSopPapan, sopPapanDariJson, type HasilImporPapan } from '../lib/impor/dokumenSopPapan';
import { tulisDocxSop } from '../lib/ekspor/tulisDocxSop';
import { unduhBerkas } from '../lib/unduh';
import * as sopSvc from '../services/sopService';
import { standaloneHost } from '../host/standaloneHost';
import { KELAS } from '../ui/kelas';
import { AppDialog, FormDialog, KonfirmasiDialog } from './AppDialog';
import { KopCetak } from './KopCetak';
import { ContextMenu, type ItemMenuKlikKanan } from './ContextMenu';
import { salinItem, potongItem, ambilKlipAktif, bersihkanKlip } from '../lib/clipboard/appClipboard';
import { ambilIkonJabatan, ambilIkonTugas, saranIkonCepat } from '../lib/ikonKontekstual';
import { PemilihIkonManual } from './PemilihIkonManual';
import type { Sop, SopItem, SopSubItem } from '../types';

function pesanError(e: unknown): string {
  return e instanceof Error ? e.message : 'Terjadi kesalahan';
}

function formatWaktu(iso: string): string {
  return new Date(iso).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

// ── Ukuran kertas cetak (Batch Y: "pastikan bisa di print pdf a4 / f4 dan
// ukuran lainnya") — PDF dihasilkan lewat dialog cetak browser ("Save as
// PDF"), @page di-inject dinamis mengikuti pilihan.
type UkuranKertas = 'a4' | 'f4' | 'letter' | 'legal' | 'a5';

const UKURAN_KERTAS: ReadonlyArray<{ id: UkuranKertas; label: string; mm: string }> = [
  { id: 'a4', label: 'A4 (210 × 297 mm)', mm: '210mm 297mm' },
  { id: 'f4', label: 'F4 / Folio (210 × 330 mm)', mm: '210mm 330mm' },
  { id: 'letter', label: 'Letter (216 × 279 mm)', mm: '216mm 279mm' },
  { id: 'legal', label: 'Legal (216 × 356 mm)', mm: '216mm 356mm' },
  { id: 'a5', label: 'A5 (148 × 210 mm)', mm: '148mm 210mm' },
];

const KUNCI_KERTAS = 'tartib.sop.kertas';

function bacaUkuranKertas(): UkuranKertas {
  try {
    const v = localStorage.getItem(KUNCI_KERTAS);
    return UKURAN_KERTAS.some((u) => u.id === v) ? (v as UkuranKertas) : 'a4';
  } catch {
    return 'a4';
  }
}

// Saran kategori rutin (arahan Ahmed Batch Y: "pekerjaan rutin harian,
// mingguan, bulanan, part, insidential/saat dibutuhkan saja") — isian bebas
// teks, daftar ini hanya saran cepat.
const SARAN_RUTIN = ['Harian', 'Mingguan', 'Bulanan', 'Part', 'Tahunan', 'Insidental (saat dibutuhkan saja)'];

// ===== Panel item satu papan (dipakai papan baku & SOP kustom) =====

function PanelItemSop({ sop, aksiHeader }: { sop: Sop; aksiHeader?: ReactNode }) {
  const [items, setItems] = useState<SopItem[]>([]);
  const [subItems, setSubItems] = useState<SopSubItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pesan, setPesan] = useState<string | null>(null);
  const [dialogItem, setDialogItem] = useState<{ item?: SopItem } | null>(null);
  const [formItem, setFormItem] = useState({ judul: '', picNama: '', catatan: '', rutin: '' });
  const [errorDialog, setErrorDialog] = useState<string | null>(null);
  const [dialogSub, setDialogSub] = useState<{ itemId: string; induk: string; sub?: SopSubItem } | null>(null);
  const [formSub, setFormSub] = useState({ judul: '', picNama: '', catatan: '' });
  const [errorDialogSub, setErrorDialogSub] = useState<string | null>(null);
  const [hapusTarget, setHapusTarget] = useState<{ jenis: 'item' | 'sub'; id: string; judul: string } | null>(null);
  const [resetTerbuka, setResetTerbuka] = useState(false);
  const [cetakAktif, setCetakAktif] = useState(false);
  const [ukuranKertas, setUkuranKertas] = useState<UkuranKertas>('a4');
  const [sibukEkspor, setSibukEkspor] = useState(false);
  const [menuKlikKanan, setMenuKlikKanan] = useState<{
    x: number;
    y: number;
    judul?: string;
    items: ItemMenuKlikKanan[];
  } | null>(null);

  const muat = useCallback(async () => {
    try {
      const [it, sub] = await Promise.all([sopSvc.daftarItemSop(sop.id), sopSvc.daftarSubItemSop(sop.id)]);

      // Auto-sinkronisasi PIC Bendahara lama ke Yudi Nahyuddin jika masih ada data lama di IndexedDB
      for (const item of it) {
        if (item.judul.toUpperCase().includes('BENDAHARA') && item.picNama?.toLowerCase().includes('lutfi')) {
          item.picNama = 'Yudi Nahyuddin';
          void sopSvc.ubahItemSop(item.id, {
            judul: item.judul,
            picNama: 'Yudi Nahyuddin',
            catatan: item.catatan,
            rutin: item.rutin,
          });
        }
      }
      for (const s of sub) {
        if (s.picNama?.toLowerCase().includes('lutfi')) {
          s.picNama = 'Yudi';
          void sopSvc.ubahSubItemSop(s.id, {
            judul: s.judul,
            picNama: 'Yudi',
            catatan: s.catatan,
          });
        }
      }

      setItems(it);
      setSubItems(sub);
      setError(null);
    } catch (e) {
      setError(pesanError(e));
    }
  }, [sop.id]);

  useEffect(() => {
    void muat();
  }, [muat]);

  // Pilihan ukuran kertas milik perangkat (localStorage) — pola K-21.
  useEffect(() => {
    setUkuranKertas(bacaUkuranKertas());
  }, []);

  function pilihUkuranKertas(u: UkuranKertas) {
    setUkuranKertas(u);
    try {
      localStorage.setItem(KUNCI_KERTAS, u);
    } catch {
      /* penyimpanan penuh/dilarang — pilihan tetap berlaku untuk sesi ini */
    }
  }

  // Sub-tugas dikelompokkan per item induk, terurut dalam induknya.
  const subByItem = useMemo(() => {
    const peta = new Map<string, SopSubItem[]>();
    for (const s of subItems) {
      const daftar = peta.get(s.itemId) ?? [];
      daftar.push(s);
      peta.set(s.itemId, daftar);
    }
    peta.forEach((daftar) => daftar.sort((a, b) => a.urutan - b.urutan));
    return peta;
  }, [subItems]);

  // Progres menghitung SEMUA baris tercentang (item + sub) = jumlah kotak
  // ceklis yang tampak di layar.
  const ikhtisar = sopSvc.ikhtisarCeklis([...items, ...subItems]);

  function bukaTambah() {
    setFormItem({ judul: '', picNama: '', catatan: '', rutin: '' });
    setErrorDialog(null);
    setDialogItem({});
  }

  function bukaUbah(it: SopItem) {
    setFormItem({ judul: it.judul, picNama: it.picNama, catatan: it.catatan, rutin: it.rutin ?? '' });
    setErrorDialog(null);
    setDialogItem({ item: it });
  }

  async function simpanItem() {
    try {
      if (dialogItem?.item) {
        await sopSvc.ubahItemSop(dialogItem.item.id, formItem);
      } else {
        await sopSvc.tambahItemSop(sop.id, formItem);
      }
      setDialogItem(null);
      await muat();
    } catch (e) {
      setErrorDialog(pesanError(e));
    }
  }

  function bukaTambahSub(itemId: string, induk: string) {
    setFormSub({ judul: '', picNama: '', catatan: '' });
    setErrorDialogSub(null);
    setDialogSub({ itemId, induk });
  }

  function bukaUbahSub(itemId: string, induk: string, sub: SopSubItem) {
    setFormSub({ judul: sub.judul, picNama: sub.picNama, catatan: sub.catatan });
    setErrorDialogSub(null);
    setDialogSub({ itemId, induk, sub });
  }

  async function simpanSub() {
    if (!dialogSub) return;
    try {
      if (dialogSub.sub) {
        await sopSvc.ubahSubItemSop(dialogSub.sub.id, formSub);
      } else {
        await sopSvc.tambahSubItemSop(dialogSub.itemId, formSub);
      }
      setDialogSub(null);
      await muat();
    } catch (e) {
      setErrorDialogSub(pesanError(e));
    }
  }

  async function hapusBaris() {
    if (!hapusTarget) return;
    try {
      if (hapusTarget.jenis === 'item') await sopSvc.hapusItemSop(hapusTarget.id);
      else await sopSvc.hapusSubItemSop(hapusTarget.id);
      setHapusTarget(null);
      await muat();
    } catch (e) {
      setHapusTarget(null);
      setError(pesanError(e));
    }
  }

  async function pindah(it: SopItem, arah: 'atas' | 'bawah') {
    try {
      await sopSvc.pindahItemSop(it.id, arah);
      await muat();
    } catch (e) {
      setError(pesanError(e));
    }
  }

  async function pindahSub(sub: SopSubItem, arah: 'atas' | 'bawah') {
    try {
      await sopSvc.pindahSubItemSop(sub.id, arah);
      await muat();
    } catch (e) {
      setError(pesanError(e));
    }
  }

  function handleContextMenuListItem(e: React.MouseEvent, it: SopItem) {
    e.preventDefault();
    e.stopPropagation();

    const klip = ambilKlipAktif();
    const subs = subByItem.get(it.id) ?? [];

    const menuItems: ItemMenuKlikKanan[] = [
      {
        label: 'Salin Item',
        ikon: '📋',
        shortcut: 'Ctrl+C',
        onClick: () => {
          salinItem('jabatan', { ...it, subItems: subs }, `${it.judul} (PIC: ${it.picNama || '-'})`, it.id);
        },
      },
      {
        label: 'Duplikat Item',
        ikon: '📑',
        shortcut: 'Ctrl+D',
        onClick: async () => {
          try {
            const baru = await sopSvc.tambahItemSop(sop.id, {
              judul: `${it.judul} (Salinan)`,
              picNama: it.picNama || '',
              catatan: it.catatan || '',
              rutin: it.rutin || '',
            });
            if (subs.length > 0) {
              for (const s of subs) {
                await sopSvc.tambahSubItemSop(baru.id, {
                  judul: s.judul,
                  picNama: s.picNama,
                  catatan: s.catatan,
                });
              }
            }
            await muat();
          } catch (err) {
            setError(pesanError(err));
          }
        },
      },
      {
        label: 'Potong Item',
        ikon: '✂️',
        shortcut: 'Ctrl+X',
        onClick: () => {
          potongItem('jabatan', { ...it, subItems: subs }, `${it.judul} (PIC: ${it.picNama || '-'})`, it.id);
        },
      },
      {
        label: klip?.tipe === 'sub-tugas' ? 'Tempel Sub-tugas ke Sini' : 'Tempel',
        ikon: '📥',
        shortcut: 'Ctrl+V',
        disabled: !klip,
        onClick: async () => {
          if (!klip) return;
          try {
            if (klip.tipe === 'sub-tugas' && klip.data) {
              await sopSvc.tambahSubItemSop(it.id, {
                judul: klip.data.judul || 'Sub-tugas Baru',
                picNama: klip.data.picNama || '',
                catatan: klip.data.catatan || '',
              });
              if (klip.isCut && klip.sumberId) {
                await sopSvc.hapusSubItemSop(klip.sumberId);
                bersihkanKlip();
              }
            } else if (klip.tipe === 'jabatan' && klip.data) {
              const baru = await sopSvc.tambahItemSop(sop.id, {
                judul: `${klip.data.judul} (Salinan)`,
                picNama: klip.data.picNama || '',
                catatan: klip.data.catatan || '',
                rutin: klip.data.rutin || it.rutin || '',
              });
              if (Array.isArray(klip.data.subItems)) {
                for (const s of klip.data.subItems) {
                  await sopSvc.tambahSubItemSop(baru.id, {
                    judul: s.judul,
                    picNama: s.picNama,
                    catatan: s.catatan,
                  });
                }
              }
              if (klip.isCut && klip.sumberId) {
                await sopSvc.hapusItemSop(klip.sumberId);
                bersihkanKlip();
              }
            } else {
              await sopSvc.tambahSubItemSop(it.id, {
                judul: klip.teks || 'Sub-tugas Baru',
                picNama: '',
                catatan: '',
              });
            }
            await muat();
          } catch (err) {
            setError(pesanError(err));
          }
        },
      },
      { pemisah: true, label: '', onClick: () => {} },
      {
        label: '+ Tambah Sub-tugas',
        ikon: '➕',
        onClick: () => {
          bukaTambahSub(it.id, it.judul);
        },
      },
      {
        label: 'Ubah Item',
        ikon: '✏️',
        onClick: () => {
          bukaUbah(it);
        },
      },
      { pemisah: true, label: '', onClick: () => {} },
      {
        label: 'Hapus Item',
        ikon: '🗑️',
        bahaya: true,
        shortcut: 'Del',
        onClick: () => {
          setHapusTarget({ jenis: 'item', id: it.id, judul: it.judul });
        },
      },
    ];

    setMenuKlikKanan({
      x: e.clientX,
      y: e.clientY,
      judul: `Item: ${it.judul}`,
      items: menuItems,
    });
  }

  function handleContextMenuListSub(e: React.MouseEvent, it: SopItem, s: SopSubItem) {
    e.preventDefault();
    e.stopPropagation();

    const klip = ambilKlipAktif();

    const menuItems: ItemMenuKlikKanan[] = [
      {
        label: 'Salin Sub-tugas',
        ikon: '📋',
        shortcut: 'Ctrl+C',
        onClick: () => {
          salinItem('sub-tugas', s, `${s.judul} (PIC: ${s.picNama || '-'})`, s.id);
        },
      },
      {
        label: 'Duplikat Sub-tugas',
        ikon: '📑',
        shortcut: 'Ctrl+D',
        onClick: async () => {
          try {
            await sopSvc.tambahSubItemSop(it.id, {
              judul: `${s.judul} (Salinan)`,
              picNama: s.picNama || '',
              catatan: s.catatan || '',
            });
            await muat();
          } catch (err) {
            setError(pesanError(err));
          }
        },
      },
      {
        label: 'Potong Sub-tugas',
        ikon: '✂️',
        shortcut: 'Ctrl+X',
        onClick: () => {
          potongItem('sub-tugas', s, `${s.judul} (PIC: ${s.picNama || '-'})`, s.id);
        },
      },
      {
        label: 'Tempel Sub-tugas di Sini',
        ikon: '📥',
        shortcut: 'Ctrl+V',
        disabled: !klip,
        onClick: async () => {
          if (!klip) return;
          try {
            const judulTugas = klip.data?.judul || klip.teks || 'Sub-tugas Baru';
            const pic = klip.data?.picNama || '';
            const catatan = klip.data?.catatan || '';
            await sopSvc.tambahSubItemSop(it.id, { judul: judulTugas, picNama: pic, catatan });
            if (klip.isCut && klip.sumberId) {
              await sopSvc.hapusSubItemSop(klip.sumberId);
              bersihkanKlip();
            }
            await muat();
          } catch (err) {
            setError(pesanError(err));
          }
        },
      },
      { pemisah: true, label: '', onClick: () => {} },
      {
        label: s.selesai ? 'Tandai Belum Selesai' : 'Tandai Selesai (Ceklis)',
        ikon: s.selesai ? '↩️' : '✅',
        onClick: () => {
          void centangSub(s, !s.selesai);
        },
      },
      {
        label: 'Ubah Sub-tugas',
        ikon: '✏️',
        onClick: () => {
          bukaUbahSub(it.id, it.judul, s);
        },
      },
      { pemisah: true, label: '', onClick: () => {} },
      {
        label: 'Hapus Sub-tugas',
        ikon: '🗑️',
        bahaya: true,
        shortcut: 'Del',
        onClick: () => {
          setHapusTarget({ jenis: 'sub', id: s.id, judul: s.judul });
        },
      },
    ];

    setMenuKlikKanan({
      x: e.clientX,
      y: e.clientY,
      judul: `Sub-tugas: ${s.judul}`,
      items: menuItems,
    });
  }

  // Ceklis satu klik — alasan utama menu ini ada (arahan Ahmed Batch X).
  // Optimis: UI merespons seketika, lalu disinkronkan ulang dari DB.
  async function centangItem(it: SopItem, selesai: boolean) {
    setItems((lama) => lama.map((x) => (x.id === it.id ? { ...x, selesai } : x)));
    try {
      await sopSvc.tandaiCeklis(it.id, selesai);
      await muat();
    } catch (e) {
      setError(pesanError(e));
      await muat();
    }
  }

  async function centangSub(sub: SopSubItem, selesai: boolean) {
    setSubItems((lama) => lama.map((x) => (x.id === sub.id ? { ...x, selesai } : x)));
    try {
      await sopSvc.tandaiCeklisSub(sub.id, selesai);
      await muat();
    } catch (e) {
      setError(pesanError(e));
      await muat();
    }
  }

  async function resetCeklis() {
    setResetTerbuka(false);
    try {
      const n = await sopSvc.resetCeklis(sop.id);
      setPesan(n > 0 ? `${n} centang dikosongkan.` : 'Belum ada yang tercentang.');
      await muat();
    } catch (e) {
      setError(pesanError(e));
    }
  }

  // flushSync memastikan bagian print ter-commit ke DOM sebelum window.print()
  // (pola Batch F / sesi 15). PDF = pilih "Save as PDF" di dialog cetak.
  function cetakA4() {
    flushSync(() => setCetakAktif(true));
    void standaloneHost
      .cetak({ jenis: 'papanSop', sopId: sop.id })
      .finally(() => setCetakAktif(false));
  }

  async function unduhDocx() {
    setSibukEkspor(true);
    try {
      const data = {
        judul: sop.judul,
        catatan: sop.catatan,
        items: items.map((it) => ({
          judul: it.judul,
          picNama: it.picNama,
          catatan: it.catatan,
          rutin: it.rutin,
          sub: (subByItem.get(it.id) ?? []).map((s) => ({
            judul: s.judul,
            picNama: s.picNama,
            catatan: s.catatan,
          })),
        })),
      };
      const bytes = await tulisDocxSop(data);
      const nama = `SOP-${sop.judul}.docx`;
      const hasil = await unduhBerkas(nama, new Blob([bytes as unknown as BlobPart], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }));
      if (!hasil.dibatalkan) setPesan(`Berkas ${nama} siap — bisa diimpor kembali ke tab SOP.`);
    } catch (e) {
      setError(pesanError(e));
    } finally {
      setSibukEkspor(false);
    }
  }

  const mm = UKURAN_KERTAS.find((u) => u.id === ukuranKertas)?.mm ?? '210mm 297mm';

  return (
    <>
      {/* Seluruh layar dibungkus print:hidden — blok cetak ada di luar kartu
          kaca agar tidak mewarisi latar & blur saat dicetak (jebakan CSS
          print K-22 poin 3). */}
      <div className="print:hidden space-y-4">
        <section className={KELAS.kartuIsi}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className={KELAS.judulKartu}>{sop.judul}</h3>
                {sop.baku && <span className={KELAS.badgeUngu}>Semi-paten</span>}
              </div>
              {sop.catatan && <p className={`mt-1 ${KELAS.keterangan}`}>{sop.catatan}</p>}
            </div>
            {aksiHeader && <div className="flex flex-wrap gap-1.5">{aksiHeader}</div>}
          </div>
        </section>

        <section className={`${KELAS.kartuIsi}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className={KELAS.judulKartu}>Ceklis</p>
              <p className={KELAS.keteranganKecil}>
                {ikhtisar.selesai} dari {ikhtisar.total} item dicentang ({ikhtisar.persen}%)
                {subItems.length > 0 ? ` · termasuk ${subItems.length} sub-tugas` : ''}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={bukaTambah} className={KELAS.tombolUtamaKecil}>
                Tambah Item
              </button>
              <button
                onClick={() => setResetTerbuka(true)}
                disabled={ikhtisar.selesai === 0}
                className={KELAS.tombolSekunderKecil}
              >
                Reset Ceklis
              </button>
              <button onClick={() => void unduhDocx()} disabled={sibukEkspor || items.length === 0} className={KELAS.tombolSekunderKecil}>
                {sibukEkspor ? 'Menyiapkan…' : 'Unduh .docx'}
              </button>
              <button onClick={cetakA4} disabled={items.length === 0} className={KELAS.tombolSekunderKecil}>
                Cetak
              </button>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <label htmlFor={`kertas-${sop.id}`} className={KELAS.keteranganKecil}>
              Ukuran kertas:
            </label>
            <select
              id={`kertas-${sop.id}`}
              value={ukuranKertas}
              onChange={(e) => pilihUkuranKertas(e.target.value as UkuranKertas)}
              className={`${KELAS.inputKecil} w-auto`}
            >
              {UKURAN_KERTAS.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.label}
                </option>
              ))}
            </select>
            <span className={KELAS.keteranganKecil}>
              Untuk PDF: pilih &quot;Save as PDF&quot; di dialog cetak.
            </span>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-netral-200">
            <div className="h-full rounded-full bg-aksen-500 transition-all" style={{ width: `${ikhtisar.persen}%` }} />
          </div>
        </section>

        {error && <p className={KELAS.error}>{error}</p>}
        {pesan && (
          <p className="rounded-kontrol bg-aksen-100/70 px-3 py-2 text-sm text-aksen-700 ring-1 ring-inset ring-aksen-200/70">
            {pesan}
          </p>
        )}

        {items.length === 0 ? (
          <p className={KELAS.kosong}>
            Belum ada item di papan ini — tekan &quot;Tambah Item&quot; untuk mengisi amanah/tugas pertama.
          </p>
        ) : (
          <ul className="space-y-2">
            {items.map((it, i) => {
              const subs = subByItem.get(it.id) ?? [];
              return (
                <li key={it.id} className={KELAS.kartuIsi} onContextMenu={(e) => handleContextMenuListItem(e, it)}>
                  {/* flex-wrap: di layar sempit tombol aksi turun ke baris
                      sendiri sehingga badge PIC tidak patah di dalam pil. */}
                  <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
                    <input
                      type="checkbox"
                      checked={it.selesai}
                      onChange={() => void centangItem(it, !it.selesai)}
                      aria-label={`Centang ${it.judul}`}
                      className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer"
                    />
                    <div className="min-w-44 flex-1">
                      <p className={`text-sm font-medium flex items-center gap-1.5 ${it.selesai ? 'text-teks-halus line-through' : 'text-teks-utama'}`}>
                        <span className="text-base select-none" aria-hidden="true">
                          {ambilIkonJabatan(it.judul, it.catatan, it.rutin)}
                        </span>
                        <span>{it.judul}</span>
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <span className={`${it.picNama ? KELAS.badgeInfo : KELAS.badgeNetral} whitespace-nowrap`}>
                          {it.picNama
                            ? `PIC: ${it.judul.toUpperCase().includes('BENDAHARA') && it.picNama.toLowerCase().includes('lutfi') ? 'Yudi Nahyuddin' : it.picNama}`
                            : 'PIC: belum diisi'}
                        </span>
                        {it.rutin && (
                          <span className={`${KELAS.badgePeringatan} whitespace-nowrap`}>Rutin: {it.rutin}</span>
                        )}
                        {it.selesai && it.selesaiPada && (
                          <span className={`${KELAS.badgeAksen} whitespace-nowrap`}>
                            Selesai {formatWaktu(it.selesaiPada)}
                          </span>
                        )}
                        {it.catatan && <span className={KELAS.keteranganKecil}>{it.catatan}</span>}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-0.5">
                      <button
                        onClick={() => void pindah(it, 'atas')}
                        disabled={i === 0}
                        aria-label={`Naikkan ${it.judul}`}
                        className={KELAS.tombolIkon}
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => void pindah(it, 'bawah')}
                        disabled={i === items.length - 1}
                        aria-label={`Turunkan ${it.judul}`}
                        className={KELAS.tombolIkon}
                      >
                        ↓
                      </button>
                      <button onClick={() => bukaTambahSub(it.id, it.judul)} className={KELAS.tombolHalus}>
                        + Sub
                      </button>
                      <button onClick={() => bukaUbah(it)} className={KELAS.tombolHalus}>
                        Ubah
                      </button>
                      <button onClick={() => setHapusTarget({ jenis: 'item', id: it.id, judul: it.judul })} className={KELAS.tombolBahayaHalus}>
                        Hapus
                      </button>
                    </div>
                  </div>

                  {/* Sub-tugas — rincian di bawah amanah, tiap sub punya PIC
                      dan ceklis sendiri (Batch Y). */}
                  {subs.length > 0 && (
                    <ul className="ml-8 mt-2 space-y-1.5 border-l-2 border-white/70 pl-3">
                      {subs.map((s, j) => (
                        <li key={s.id} onContextMenu={(e) => handleContextMenuListSub(e, it, s)} className="flex flex-wrap items-start gap-x-2 gap-y-1">
                          <input
                            type="checkbox"
                            checked={s.selesai}
                            onChange={() => void centangSub(s, !s.selesai)}
                            aria-label={`Centang sub ${s.judul}`}
                            className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer"
                          />
                          <div className="min-w-36 flex-1">
                            <p className={`text-sm flex items-center gap-1.5 ${s.selesai ? 'text-teks-halus line-through' : 'text-teks-kuat'}`}>
                              <span className="text-xs select-none opacity-85" aria-hidden="true">
                                {ambilIkonTugas(s.judul, s.catatan)}
                              </span>
                              <span>{s.judul}</span>
                            </p>
                            <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                              <span className={`${s.picNama ? KELAS.badgeInfo : KELAS.badgeNetral} whitespace-nowrap`}>
                                {s.picNama ? `PIC: ${s.picNama}` : 'PIC: belum diisi'}
                              </span>
                              {s.selesai && s.selesaiPada && (
                                <span className={`${KELAS.badgeAksen} whitespace-nowrap`}>
                                  Selesai {formatWaktu(s.selesaiPada)}
                                </span>
                              )}
                              {s.catatan && <span className={KELAS.keteranganKecil}>{s.catatan}</span>}
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-0.5">
                            <button
                              onClick={() => void pindahSub(s, 'atas')}
                              disabled={j === 0}
                              aria-label={`Naikkan sub ${s.judul}`}
                              className={KELAS.tombolIkon}
                            >
                              ↑
                            </button>
                            <button
                              onClick={() => void pindahSub(s, 'bawah')}
                              disabled={j === subs.length - 1}
                              aria-label={`Turunkan sub ${s.judul}`}
                              className={KELAS.tombolIkon}
                            >
                              ↓
                            </button>
                            <button onClick={() => bukaUbahSub(it.id, it.judul, s)} className={KELAS.tombolHalus}>
                              Ubah
                            </button>
                            <button
                              onClick={() => setHapusTarget({ jenis: 'sub', id: s.id, judul: s.judul })}
                              className={KELAS.tombolBahayaHalus}
                            >
                              Hapus
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Cetak: @page di-inject mengikuti pilihan ukuran kertas — A4/F4/
          Letter/Legal/A5. PDF lewat "Save as PDF" pada dialog cetak. */}
      {cetakAktif && (
        <div className="hidden print:block">
          <style>{`@page { size: ${mm}; margin: 12mm; }`}</style>
          <KopCetak />
          <div className="mb-4 border-b border-slate-400 pb-2">
            <h1 className="text-lg font-bold">{sop.judul}</h1>
            {sop.catatan && <p className="mt-1 text-xs">{sop.catatan}</p>}
            <p className="mt-1 text-xs">
              Dicetak {formatTanggalIndonesia(tanggalHariIni())} · {UKURAN_KERTAS.find((u) => u.id === ukuranKertas)?.label}
            </p>
          </div>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="w-10 border border-slate-400 px-2 py-1 text-center">✓</th>
                <th className="border border-slate-400 px-2 py-1 text-left">Amanah / Tugas</th>
                <th className="w-32 border border-slate-400 px-2 py-1 text-left">PIC</th>
                <th className="w-24 border border-slate-400 px-2 py-1 text-left">Rutin</th>
                <th className="border border-slate-400 px-2 py-1 text-left">Catatan</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <FragmentCetak key={it.id} item={it} subs={subByItem.get(it.id) ?? []} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <FormDialog
        terbuka={dialogItem !== null}
        judul={dialogItem?.item ? 'Ubah Item' : 'Tambah Item'}
        onTutup={() => setDialogItem(null)}
        onSimpan={() => void simpanItem()}
        error={errorDialog}
      >
        <PemilihIkonManual
          judul={formItem.judul}
          catatan={formItem.catatan}
          rutin={formItem.rutin}
          jenis="jabatan"
          label="Ikon Item / Amanah"
          onUbahCatatan={(catatanBaru) => setFormItem({ ...formItem, catatan: catatanBaru })}
        />

        <div>
          <label className={KELAS.label} htmlFor="sop-item-judul">
            Amanah / tugas
          </label>
          <input
            id="sop-item-judul"
            value={formItem.judul}
            onChange={(e) => setFormItem({ ...formItem, judul: e.target.value })}
            placeholder="mis. Imam shalat Maghrib"
            className={`mt-1 ${KELAS.input}`}
          />
        </div>
        <div>
          <label className={KELAS.label} htmlFor="sop-item-pic">
            Nama PIC (santri / pengurus)
          </label>
          <input
            id="sop-item-pic"
            value={formItem.picNama}
            onChange={(e) => setFormItem({ ...formItem, picNama: e.target.value })}
            placeholder="Boleh dikosongkan dulu"
            className={`mt-1 ${KELAS.input}`}
          />
        </div>
        <div>
          <label className={KELAS.label} htmlFor="sop-item-rutin">
            Kategori rutin
          </label>
          <input
            id="sop-item-rutin"
            list="sop-saran-rutin"
            value={formItem.rutin}
            onChange={(e) => setFormItem({ ...formItem, rutin: e.target.value })}
            placeholder="mis. Harian — boleh dikosongkan"
            className={`mt-1 ${KELAS.input}`}
          />
          <datalist id="sop-saran-rutin">
            {SARAN_RUTIN.map((r) => (
              <option key={r} value={r} />
            ))}
          </datalist>
        </div>
        <div>
          <label className={KELAS.label} htmlFor="sop-item-catatan">
            Catatan
          </label>
          <input
            id="sop-item-catatan"
            value={formItem.catatan}
            onChange={(e) => setFormItem({ ...formItem, catatan: e.target.value })}
            placeholder="mis. giliran per pekan"
            className={`mt-1 ${KELAS.input}`}
          />
        </div>
      </FormDialog>

      <FormDialog
        terbuka={dialogSub !== null}
        judul={dialogSub?.sub ? 'Ubah Sub-tugas' : 'Tambah Sub-tugas'}
        onTutup={() => setDialogSub(null)}
        onSimpan={() => void simpanSub()}
        error={errorDialogSub}
      >
        {dialogSub && (
          <p className={KELAS.keteranganKecil}>Di bawah item: {dialogSub.induk}</p>
        )}
        <PemilihIkonManual
          judul={formSub.judul}
          catatan={formSub.catatan}
          jenis="tugas"
          label="Ikon Sub-Tugas"
          onUbahCatatan={(catatanBaru) => setFormSub({ ...formSub, catatan: catatanBaru })}
        />
        <div>
          <label className={KELAS.label} htmlFor="sop-sub-judul">
            Sub-tugas
          </label>
          <input
            id="sop-sub-judul"
            value={formSub.judul}
            onChange={(e) => setFormSub({ ...formSub, judul: e.target.value })}
            placeholder="mis. Set azan Maghrib"
            className={`mt-1 ${KELAS.input}`}
          />
        </div>
        <div>
          <label className={KELAS.label} htmlFor="sop-sub-pic">
            Nama PIC (santri / pengurus)
          </label>
          <input
            id="sop-sub-pic"
            value={formSub.picNama}
            onChange={(e) => setFormSub({ ...formSub, picNama: e.target.value })}
            placeholder="Boleh dikosongkan dulu"
            className={`mt-1 ${KELAS.input}`}
          />
        </div>
        <div>
          <label className={KELAS.label} htmlFor="sop-sub-catatan">
            Catatan
          </label>
          <input
            id="sop-sub-catatan"
            value={formSub.catatan}
            onChange={(e) => setFormSub({ ...formSub, catatan: e.target.value })}
            placeholder="mis. pukul 17.45"
            className={`mt-1 ${KELAS.input}`}
          />
        </div>
      </FormDialog>

      <KonfirmasiDialog
        terbuka={hapusTarget !== null}
        judul={hapusTarget?.jenis === 'sub' ? 'Hapus sub-tugas ini?' : 'Hapus item ini?'}
        pesan={
          hapusTarget
            ? `"${hapusTarget.judul}" dihapus dari papan${hapusTarget.jenis === 'item' ? ' beserta seluruh sub-tugasnya' : ''}. Tindakan ini tidak bisa dibatalkan.`
            : ''
        }
        onBatal={() => setHapusTarget(null)}
        onYa={() => void hapusBaris()}
      />

      <KonfirmasiDialog
        terbuka={resetTerbuka}
        judul="Kosongkan seluruh centang?"
        pesan={`Semua centang (item dan sub-tugas) di "${sop.judul}" dikembalikan ke belum selesai (${ikhtisar.selesai} centang). Nama PIC dan daftar item tidak berubah.`}
        labelYa="Reset Ceklis"
        bahaya={false}
        onBatal={() => setResetTerbuka(false)}
        onYa={() => void resetCeklis()}
      />

      <ContextMenu
        x={menuKlikKanan?.x ?? 0}
        y={menuKlikKanan?.y ?? 0}
        terbuka={menuKlikKanan !== null}
        onTutup={() => setMenuKlikKanan(null)}
        judul={menuKlikKanan?.judul}
        items={menuKlikKanan?.items ?? []}
      />
    </>
  );
}

/** Baris cetak satu item + sub-tugasnya (sub menjorok dengan ↳). */
function FragmentCetak({ item, subs }: { item: SopItem; subs: SopSubItem[] }) {
  return (
    <>
      <tr className="break-inside-avoid">
        <td className="border border-slate-400 px-2 py-1 text-center">☐</td>
        <td className="border border-slate-400 px-2 py-1 font-medium">
          <span className="mr-1.5 inline-block">{ambilIkonJabatan(item.judul, item.catatan, item.rutin)}</span>
          {item.judul}
        </td>
        <td className="border border-slate-400 px-2 py-1">{item.picNama}</td>
        <td className="border border-slate-400 px-2 py-1">{item.rutin}</td>
        <td className="border border-slate-400 px-2 py-1">{item.catatan}</td>
      </tr>
      {subs.map((s) => (
        <tr key={s.id} className="break-inside-avoid">
          <td className="border border-slate-400 px-2 py-1 text-center">☐</td>
          <td className="border border-slate-400 px-2 py-1">
            ↳ <span className="mr-1 inline-block">{ambilIkonTugas(s.judul, s.catatan)}</span>
            {s.judul}
          </td>
          <td className="border border-slate-400 px-2 py-1">{s.picNama}</td>
          <td className="border border-slate-400 px-2 py-1" />
          <td className="border border-slate-400 px-2 py-1">{s.catatan}</td>
        </tr>
      ))}
    </>
  );
}

// ===== Tampilan Bagan Organisasi (PIC Amanah, Batch Z) =====
// Menampilkan jabatan dalam hierarki visual mirip struktur OSIS santri.
// Setiap jabatan adalah SopItem, tiap tugas detail di bawahnya SopSubItem.
// Tier dikendalikan oleh field `rutin`: Pimpinan → Pengurus Inti → Divisi.

function ikonUntuk(judul: string, catatan: string, rutin?: string): string {
  return ambilIkonJabatan(judul, catatan, rutin);
}

function BaganOrganisasi({ sop }: { sop: Sop }) {
  const [items, setItems] = useState<SopItem[]>([]);
  const [subItems, setSubItems] = useState<SopSubItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [modeTampilan, setModeTampilan] = useState<'bagan' | 'daftar'>('bagan');
  const [dialogItem, setDialogItem] = useState<{ item?: SopItem } | null>(null);
  const [formItem, setFormItem] = useState({ judul: '', picNama: '', catatan: '', rutin: '' });
  const [errorDialog, setErrorDialog] = useState<string | null>(null);
  const [dialogSub, setDialogSub] = useState<{ itemId: string; induk: string; sub?: SopSubItem } | null>(null);
  const [formSub, setFormSub] = useState({ judul: '', picNama: '', catatan: '' });
  const [errorDialogSub, setErrorDialogSub] = useState<string | null>(null);
  const [hapusTarget, setHapusTarget] = useState<{ jenis: 'item' | 'sub'; id: string; judul: string } | null>(null);
  const [menuKlikKanan, setMenuKlikKanan] = useState<{
    x: number;
    y: number;
    judul?: string;
    items: ItemMenuKlikKanan[];
  } | null>(null);

  const muat = useCallback(async () => {
    try {
      const [it, sub] = await Promise.all([sopSvc.daftarItemSop(sop.id), sopSvc.daftarSubItemSop(sop.id)]);
      for (const item of it) {
        if (item.judul.toUpperCase().includes('BENDAHARA') && item.picNama?.toLowerCase().includes('lutfi')) {
          item.picNama = 'Yudi Nahyuddin';
        }
      }
      for (const s of sub) {
        if (s.picNama?.toLowerCase().includes('lutfi')) {
          s.picNama = 'Yudi';
        }
      }
      setItems(it);
      setSubItems(sub);
      setError(null);
    } catch (e) { setError(pesanError(e)); }
  }, [sop.id]);

  useEffect(() => { void muat(); }, [muat]);

  const subByItem = useMemo(() => {
    const peta = new Map<string, SopSubItem[]>();
    for (const s of subItems) { const d = peta.get(s.itemId) ?? []; d.push(s); peta.set(s.itemId, d); }
    peta.forEach((d) => d.sort((a, b) => a.urutan - b.urutan));
    return peta;
  }, [subItems]);

  const tiers = useMemo(() => {
    const g: Record<string, SopItem[]> = {};
    for (const it of items) { const t = it.rutin || 'Lainnya'; (g[t] ??= []).push(it); }
    return g;
  }, [items]);

  const tierOrder = ['Pimpinan', 'Pengurus Inti', 'Divisi', 'Lainnya'];
  const sortedTiers = tierOrder.filter((t) => tiers[t]?.length);

  const ikhtisar = useMemo(() => {
    const total = subItems.length;
    const selesai = subItems.filter((s) => s.selesai).length;
    const persen = total > 0 ? Math.round((selesai / total) * 100) : 0;
    return { total, selesai, persen };
  }, [subItems]);

  function toggleExpand(id: string) {
    setExpanded((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  }

  function expandSemua() {
    if (expanded.size === items.length) {
      setExpanded(new Set());
    } else {
      setExpanded(new Set(items.map((it) => it.id)));
    }
  }

  async function centangSub(sub: SopSubItem, selesai: boolean) {
    setSubItems((lama) => lama.map((x) => (x.id === sub.id ? { ...x, selesai } : x)));
    try {
      await sopSvc.tandaiCeklisSub(sub.id, selesai);
      await muat();
    } catch (e) {
      setError(pesanError(e));
      await muat();
    }
  }

  function bukaTambah() {
    setFormItem({ judul: '', picNama: '', catatan: '', rutin: 'Divisi' });
    setErrorDialog(null);
    setDialogItem({});
  }

  function bukaUbah(it: SopItem) {
    const pic = it.judul.toUpperCase().includes('BENDAHARA') && it.picNama?.toLowerCase().includes('lutfi')
      ? 'Yudi Nahyuddin'
      : it.picNama;
    setFormItem({ judul: it.judul, picNama: pic, catatan: it.catatan, rutin: it.rutin ?? '' });
    setErrorDialog(null);
    setDialogItem({ item: it });
  }

  async function simpanItem() {
    try {
      if (dialogItem?.item) await sopSvc.ubahItemSop(dialogItem.item.id, formItem);
      else await sopSvc.tambahItemSop(sop.id, formItem);
      setDialogItem(null);
      await muat();
    } catch (e) { setErrorDialog(pesanError(e)); }
  }

  function bukaTambahSub(itemId: string, induk: string) {
    setFormSub({ judul: '', picNama: '', catatan: '' });
    setErrorDialogSub(null);
    setDialogSub({ itemId, induk });
  }

  function bukaUbahSub(itemId: string, induk: string, sub: SopSubItem) {
    setFormSub({ judul: sub.judul, picNama: sub.picNama, catatan: sub.catatan });
    setErrorDialogSub(null);
    setDialogSub({ itemId, induk, sub });
  }

  async function simpanSub() {
    if (!dialogSub) return;
    try {
      if (dialogSub.sub) await sopSvc.ubahSubItemSop(dialogSub.sub.id, formSub);
      else await sopSvc.tambahSubItemSop(dialogSub.itemId, formSub);
      setDialogSub(null);
      await muat();
    } catch (e) { setErrorDialogSub(pesanError(e)); }
  }

  async function hapusBaris() {
    if (!hapusTarget) return;
    try {
      if (hapusTarget.jenis === 'item') await sopSvc.hapusItemSop(hapusTarget.id);
      else await sopSvc.hapusSubItemSop(hapusTarget.id);
      setHapusTarget(null);
      await muat();
    } catch (e) { setHapusTarget(null); setError(pesanError(e)); }
  }

  function handleContextMenuJabatan(e: React.MouseEvent, it: SopItem) {
    e.preventDefault();
    e.stopPropagation();

    const klip = ambilKlipAktif();
    const subs = subByItem.get(it.id) ?? [];

    const menuItems: ItemMenuKlikKanan[] = [
      {
        label: 'Salin Jabatan',
        ikon: '📋',
        shortcut: 'Ctrl+C',
        onClick: () => {
          salinItem('jabatan', { ...it, subItems: subs }, `Jabatan: ${it.judul} (PIC: ${it.picNama || '-'})`, it.id);
        },
      },
      {
        label: 'Duplikat Jabatan',
        ikon: '📑',
        shortcut: 'Ctrl+D',
        onClick: async () => {
          try {
            const baru = await sopSvc.tambahItemSop(sop.id, {
              judul: `${it.judul} (Salinan)`,
              picNama: it.picNama || '',
              catatan: it.catatan || '',
              rutin: it.rutin || 'Divisi',
            });
            if (subs.length > 0) {
              for (const s of subs) {
                await sopSvc.tambahSubItemSop(baru.id, {
                  judul: s.judul,
                  picNama: s.picNama,
                  catatan: s.catatan,
                });
              }
            }
            await muat();
          } catch (err) {
            setError(pesanError(err));
          }
        },
      },
      {
        label: 'Potong Jabatan',
        ikon: '✂️',
        shortcut: 'Ctrl+X',
        onClick: () => {
          potongItem('jabatan', { ...it, subItems: subs }, `Jabatan: ${it.judul} (PIC: ${it.picNama || '-'})`, it.id);
        },
      },
      {
        label: klip?.tipe === 'sub-tugas' ? 'Tempel Tugas ke Sini' : 'Tempel (Paste)',
        ikon: '📥',
        shortcut: 'Ctrl+V',
        disabled: !klip,
        onClick: async () => {
          if (!klip) return;
          try {
            if (klip.tipe === 'sub-tugas' && klip.data) {
              await sopSvc.tambahSubItemSop(it.id, {
                judul: klip.data.judul || 'Tugas Baru',
                picNama: klip.data.picNama || '',
                catatan: klip.data.catatan || '',
              });
              if (klip.isCut && klip.sumberId) {
                await sopSvc.hapusSubItemSop(klip.sumberId);
                bersihkanKlip();
              }
            } else if (klip.tipe === 'jabatan' && klip.data) {
              const baru = await sopSvc.tambahItemSop(sop.id, {
                judul: `${klip.data.judul} (Salinan)`,
                picNama: klip.data.picNama || '',
                catatan: klip.data.catatan || '',
                rutin: klip.data.rutin || it.rutin || 'Divisi',
              });
              if (Array.isArray(klip.data.subItems)) {
                for (const s of klip.data.subItems) {
                  await sopSvc.tambahSubItemSop(baru.id, {
                    judul: s.judul,
                    picNama: s.picNama,
                    catatan: s.catatan,
                  });
                }
              }
              if (klip.isCut && klip.sumberId) {
                await sopSvc.hapusItemSop(klip.sumberId);
                bersihkanKlip();
              }
            } else {
              await sopSvc.tambahSubItemSop(it.id, {
                judul: klip.teks || 'Tugas Baru',
                picNama: '',
                catatan: '',
              });
            }
            await muat();
          } catch (err) {
            setError(pesanError(err));
          }
        },
      },
      { pemisah: true, label: '', onClick: () => {} },
      {
        label: '+ Tambah Tugas Detail',
        ikon: '➕',
        onClick: () => {
          bukaTambahSub(it.id, it.judul);
        },
      },
      {
        label: 'Ubah Jabatan',
        ikon: '✏️',
        onClick: () => {
          bukaUbah(it);
        },
      },
      { pemisah: true, label: '', onClick: () => {} },
      {
        label: 'Hapus Jabatan',
        ikon: '🗑️',
        bahaya: true,
        shortcut: 'Del',
        onClick: () => {
          setHapusTarget({ jenis: 'item', id: it.id, judul: it.judul });
        },
      },
    ];

    setMenuKlikKanan({
      x: e.clientX,
      y: e.clientY,
      judul: `Jabatan: ${it.judul}`,
      items: menuItems,
    });
  }

  function handleContextMenuSub(e: React.MouseEvent, it: SopItem, s: SopSubItem) {
    e.preventDefault();
    e.stopPropagation();

    const klip = ambilKlipAktif();

    const menuItems: ItemMenuKlikKanan[] = [
      {
        label: 'Salin Tugas',
        ikon: '📋',
        shortcut: 'Ctrl+C',
        onClick: () => {
          salinItem('sub-tugas', s, `Tugas: ${s.judul} (PIC: ${s.picNama || '-'})`, s.id);
        },
      },
      {
        label: 'Duplikat Tugas',
        ikon: '📑',
        shortcut: 'Ctrl+D',
        onClick: async () => {
          try {
            await sopSvc.tambahSubItemSop(it.id, {
              judul: `${s.judul} (Salinan)`,
              picNama: s.picNama || '',
              catatan: s.catatan || '',
            });
            await muat();
          } catch (err) {
            setError(pesanError(err));
          }
        },
      },
      {
        label: 'Potong Tugas',
        ikon: '✂️',
        shortcut: 'Ctrl+X',
        onClick: () => {
          potongItem('sub-tugas', s, `Tugas: ${s.judul} (PIC: ${s.picNama || '-'})`, s.id);
        },
      },
      {
        label: 'Tempel Tugas di Sini',
        ikon: '📥',
        shortcut: 'Ctrl+V',
        disabled: !klip,
        onClick: async () => {
          if (!klip) return;
          try {
            const judulTugas = klip.data?.judul || klip.teks || 'Tugas Baru';
            const pic = klip.data?.picNama || '';
            const catatan = klip.data?.catatan || '';
            await sopSvc.tambahSubItemSop(it.id, { judul: judulTugas, picNama: pic, catatan });
            if (klip.isCut && klip.sumberId) {
              await sopSvc.hapusSubItemSop(klip.sumberId);
              bersihkanKlip();
            }
            await muat();
          } catch (err) {
            setError(pesanError(err));
          }
        },
      },
      { pemisah: true, label: '', onClick: () => {} },
      {
        label: s.selesai ? 'Tandai Belum Selesai' : 'Tandai Selesai (Ceklis)',
        ikon: s.selesai ? '↩️' : '✅',
        onClick: () => {
          void centangSub(s, !s.selesai);
        },
      },
      {
        label: 'Ubah Tugas',
        ikon: '✏️',
        onClick: () => {
          bukaUbahSub(it.id, it.judul, s);
        },
      },
      { pemisah: true, label: '', onClick: () => {} },
      {
        label: 'Hapus Tugas',
        ikon: '🗑️',
        bahaya: true,
        shortcut: 'Del',
        onClick: () => {
          setHapusTarget({ jenis: 'sub', id: s.id, judul: s.judul });
        },
      },
    ];

    setMenuKlikKanan({
      x: e.clientX,
      y: e.clientY,
      judul: `Tugas: ${s.judul}`,
      items: menuItems,
    });
  }

  function handleContextMenuArea(e: React.MouseEvent) {
    const target = e.target as HTMLElement;
    if (target.closest('input') || target.closest('textarea') || target.closest('button')) {
      return;
    }
    e.preventDefault();
    const klip = ambilKlipAktif();

    const menuItems: ItemMenuKlikKanan[] = [
      {
        label: '+ Tambah Jabatan Baru',
        ikon: '➕',
        onClick: () => {
          bukaTambah();
        },
      },
    ];

    if (klip) {
      menuItems.push({
        label: klip.tipe === 'jabatan' ? 'Tempel Jabatan (Paste)' : 'Tempel sebagai Jabatan Baru',
        ikon: '📥',
        shortcut: 'Ctrl+V',
        onClick: async () => {
          try {
            if (klip.tipe === 'jabatan' && klip.data) {
              const baru = await sopSvc.tambahItemSop(sop.id, {
                judul: klip.data.judul ? `${klip.data.judul} (Salinan)` : 'Jabatan Baru',
                picNama: klip.data.picNama || '',
                catatan: klip.data.catatan || '',
                rutin: klip.data.rutin || 'Divisi',
              });
              if (Array.isArray(klip.data.subItems)) {
                for (const s of klip.data.subItems) {
                  await sopSvc.tambahSubItemSop(baru.id, {
                    judul: s.judul,
                    picNama: s.picNama,
                    catatan: s.catatan,
                  });
                }
              }
              if (klip.isCut && klip.sumberId) {
                await sopSvc.hapusItemSop(klip.sumberId);
                bersihkanKlip();
              }
            } else {
              const judul = klip.data?.judul || klip.teks || 'Jabatan Baru';
              await sopSvc.tambahItemSop(sop.id, {
                judul,
                picNama: klip.data?.picNama || '',
                catatan: klip.data?.catatan || '',
                rutin: 'Divisi',
              });
            }
            await muat();
          } catch (err) {
            setError(pesanError(err));
          }
        },
      });
    }

    menuItems.push(
      { pemisah: true, label: '', onClick: () => {} },
      {
        label: expanded.size === items.length ? 'Tutup Semua Tugas' : 'Buka Semua Tugas',
        ikon: '👁️',
        onClick: () => {
          expandSemua();
        },
      }
    );

    setMenuKlikKanan({
      x: e.clientX,
      y: e.clientY,
      judul: 'Papan Bagan Organisasi',
      items: menuItems,
    });
  }

  if (items.length === 0) {
    return (
      <div className={KELAS.kosong}>
        <p>Belum ada jabatan di struktur ini.</p>
        <button onClick={bukaTambah} className={`mt-3 ${KELAS.tombolUtama}`}>Tambah Jabatan</button>
      </div>
    );
  }

  if (modeTampilan === 'daftar') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setModeTampilan('bagan')}
            className={KELAS.tombolSekunderKecil}
          >
            ← Kembali ke Bagan Visual
          </button>
        </div>
        <PanelItemSop sop={sop} />
      </div>
    );
  }

  return (
    <>
      <div className="print:hidden space-y-6" onContextMenu={handleContextMenuArea}>
        {/* Bilah Ringkasan & Aksi Atas */}
        <div className={`${KELAS.kartuIsi} flex flex-wrap items-center justify-between gap-3`}>
          <div>
            <p className={KELAS.judulKartu}>{sop.judul}</p>
            <p className={KELAS.keteranganKecil}>
              {items.length} jabatan · {subItems.length} tugas detail · {ikhtisar.selesai}/{ikhtisar.total} tugas selesai ({ikhtisar.persen}%)
            </p>
            {subItems.length > 0 && (
              <div className="mt-2 h-1.5 w-48 overflow-hidden rounded-full bg-netral-200 sm:w-64">
                <div
                  className="h-full rounded-full bg-aksen-500 transition-all duration-300"
                  style={{ width: `${ikhtisar.persen}%` }}
                />
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={expandSemua}
              className={KELAS.tombolHalus}
            >
              {expanded.size === items.length ? 'Tutup Semua' : 'Buka Semua Tugas'}
            </button>
            <button
              onClick={() => setModeTampilan('daftar')}
              className={KELAS.tombolSekunderKecil}
            >
              Mode Daftar / Cetak
            </button>
            <button onClick={bukaTambah} className={KELAS.tombolUtamaKecil}>
              + Tambah Jabatan
            </button>
          </div>
        </div>

        {error && <p className={KELAS.error}>{error}</p>}

        {/* Bagan organisasi hierarki visual */}
        <div className="space-y-6">
          {sortedTiers.map((tierName, tierIdx) => {
            const tierItems = tiers[tierName]!;
            const isPimpinan = tierName === 'Pimpinan';
            const isPengurus = tierName === 'Pengurus Inti';

            return (
              <div key={tierName} className="relative space-y-3">
                {/* Garis penghubung hierarki antar tingkat */}
                {tierIdx > 0 && (
                  <div className="flex flex-col items-center">
                    <div className="h-6 w-0.5 bg-gradient-to-b from-emas-400/80 to-aksen-400/80" />
                    <div className="h-1.5 w-1.5 rounded-full bg-aksen-500" />
                  </div>
                )}

                {/* Header label tingkat */}
                <div className="flex items-center justify-center gap-2">
                  <span className="h-px w-8 bg-emas-300/40" />
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-teks-halus">
                    {tierName}
                  </span>
                  <span className="h-px w-8 bg-emas-300/40" />
                </div>

                {/* Grid kartu jabatan */}
                <div
                  className={`flex flex-wrap justify-center gap-3 ${
                    isPimpinan
                      ? ''
                      : isPengurus
                        ? 'max-w-2xl mx-auto'
                        : 'max-w-3xl mx-auto'
                  }`}
                >
                  {tierItems.map((it) => {
                    const subs = subByItem.get(it.id) ?? [];
                    const isOpen = expanded.has(it.id);
                    const ikon = ambilIkonJabatan(it.judul, it.catatan, it.rutin);
                    const subsSelesai = subs.filter((s) => s.selesai).length;

                    return (
                      <div
                        key={it.id}
                        className={`transition-all duration-200 ${
                          isPimpinan
                            ? 'w-full max-w-xs'
                            : 'w-[calc(50%-0.375rem)] sm:w-44'
                        }`}
                      >
                        {/* Kartu Jabatan */}
                        <div
                          onContextMenu={(e) => handleContextMenuJabatan(e, it)}
                          className={`group relative overflow-hidden rounded-kartu border text-center transition-all duration-200 hover:-translate-y-0.5 ${
                            isPimpinan
                              ? 'border-emas-400/60 bg-gradient-to-b from-aksen-800 via-aksen-700 to-aksen-600 p-4 text-white shadow-glowAksen'
                              : 'border-emas-300/60 bg-permukaan-kartu p-3 shadow-kartu backdrop-blur-xl hover:border-emas-400/80 hover:shadow-angkat'
                          }`}
                        >
                          {/* Ikon & Judul Jabatan */}
                          <div
                            onClick={() => toggleExpand(it.id)}
                            className="cursor-pointer select-none"
                          >
                            <span
                              className={`block ${isPimpinan ? 'text-3xl' : 'text-2xl'} transition-transform duration-200 group-hover:scale-110`}
                              aria-hidden="true"
                            >
                              {ikon}
                            </span>
                            <p
                              className={`mt-1 font-bold uppercase tracking-wider ${
                                isPimpinan ? 'text-sm text-white' : 'text-xs text-teks-utama'
                              }`}
                            >
                              {it.judul}
                            </p>
                            {it.picNama && (
                              <p
                                className={`mt-0.5 text-xs font-medium ${
                                  isPimpinan ? 'text-emas-200' : 'text-aksen-700'
                                }`}
                              >
                                {it.judul.toUpperCase().includes('BENDAHARA') && it.picNama.toLowerCase().includes('lutfi')
                                  ? 'Yudi Nahyuddin'
                                  : it.picNama}
                              </p>
                            )}
                            {subs.length > 0 && (
                              <div className="mt-1 flex items-center justify-center gap-1">
                                <span
                                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                    isPimpinan
                                      ? 'bg-white/20 text-white'
                                      : subsSelesai === subs.length
                                        ? 'bg-aksen-100/80 text-aksen-700 ring-1 ring-aksen-300/60'
                                        : 'bg-white/70 text-teks-sedang ring-1 ring-white/80'
                                  }`}
                                >
                                  {subsSelesai}/{subs.length} tugas {isOpen ? '▲' : '▼'}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Tombol aksi cepat Ubah/Hapus jabatan */}
                          <div className="mt-2 flex items-center justify-center gap-1 border-t border-emas-200/30 pt-1.5 opacity-60 transition-opacity group-hover:opacity-100">
                            <button
                              onClick={() => bukaUbah(it)}
                              className={`text-[10px] ${isPimpinan ? 'text-emas-100 hover:text-white' : 'text-teks-halus hover:text-aksen-600'}`}
                            >
                              Ubah
                            </button>
                            <span className={isPimpinan ? 'text-white/40' : 'text-teks-redup'}>·</span>
                            <button
                              onClick={() => bukaTambahSub(it.id, it.judul)}
                              className={`text-[10px] font-medium ${isPimpinan ? 'text-emas-200 hover:text-white' : 'text-aksen-700 hover:text-aksen-900'}`}
                            >
                              + Tugas
                            </button>
                            <span className={isPimpinan ? 'text-white/40' : 'text-teks-redup'}>·</span>
                            <button
                              onClick={() => setHapusTarget({ jenis: 'item', id: it.id, judul: it.judul })}
                              className={`text-[10px] ${isPimpinan ? 'text-red-300 hover:text-red-100' : 'text-teks-halus hover:text-red-500'}`}
                            >
                              Hapus
                            </button>
                          </div>
                        </div>

                        {/* Dropdown / Expanded: Sub-tugas & Detail PIC */}
                        {isOpen && (
                          <div className="mt-1.5 space-y-1.5 rounded-kontrol border border-emas-200/60 bg-white/85 p-2.5 shadow-md backdrop-blur-md">
                            {subs.length === 0 ? (
                              <p className="py-1 text-center text-[10px] text-teks-halus">
                                Belum ada rincian tugas.
                              </p>
                            ) : (
                              subs.map((s) => (
                                <div
                                  key={s.id}
                                  onContextMenu={(e) => handleContextMenuSub(e, it, s)}
                                  className={`flex items-start gap-2 rounded-lg p-1.5 transition-colors ${
                                    s.selesai ? 'bg-aksen-50/50' : 'bg-white/70 hover:bg-white'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={s.selesai}
                                    onChange={() => void centangSub(s, !s.selesai)}
                                    aria-label={`Centang ${s.judul}`}
                                    className="mt-0.5 h-3.5 w-3.5 shrink-0 cursor-pointer accent-aksen-600"
                                  />
                                  <div className="min-w-0 flex-1 text-left">
                                    <p
                                      className={`text-xs font-medium leading-snug flex items-center gap-1.5 ${
                                        s.selesai ? 'text-teks-halus line-through' : 'text-teks-utama'
                                      }`}
                                    >
                                      <span className="text-xs shrink-0 select-none opacity-85" aria-hidden="true">
                                        {ambilIkonTugas(s.judul, s.catatan)}
                                      </span>
                                      <span className="min-w-0 flex-1">{s.judul}</span>
                                    </p>
                                    {s.picNama && (
                                      <span className="mt-0.5 inline-block rounded bg-emas-100/70 px-1.5 py-0.2 text-[10px] font-semibold text-emas-800 ring-1 ring-emas-300/40">
                                        PIC: {s.picNama}
                                      </span>
                                    )}
                                    {s.catatan && (
                                      <p className="text-[10px] text-teks-halus">{s.catatan}</p>
                                    )}
                                  </div>
                                  <div className="flex shrink-0 items-center gap-0.5">
                                    <button
                                      onClick={() => bukaUbahSub(it.id, it.judul, s)}
                                      className="text-teks-redup hover:text-aksen-600"
                                      title="Ubah tugas"
                                    >
                                      ✎
                                    </button>
                                    <button
                                      onClick={() => setHapusTarget({ jenis: 'sub', id: s.id, judul: s.judul })}
                                      className="text-teks-redup hover:text-red-500"
                                      title="Hapus tugas"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                </div>
                              ))
                            )}
                            <button
                              onClick={() => bukaTambahSub(it.id, it.judul)}
                              className="mt-1 w-full rounded-full border border-dashed border-emas-300 py-1 text-center text-[10px] font-medium text-aksen-700 transition-colors hover:border-aksen-400 hover:bg-aksen-50/50"
                            >
                              + Tambah Tugas Detail
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dialog tambah/ubah jabatan */}
      <FormDialog
        terbuka={dialogItem !== null}
        judul={dialogItem?.item ? 'Ubah Jabatan' : 'Tambah Jabatan'}
        onTutup={() => setDialogItem(null)}
        onSimpan={() => void simpanItem()}
        error={errorDialog}
      >
        <PemilihIkonManual
          judul={formItem.judul}
          catatan={formItem.catatan}
          rutin={formItem.rutin}
          jenis="jabatan"
          label="Ikon Jabatan / Posisi"
          onUbahCatatan={(catatanBaru) => setFormItem({ ...formItem, catatan: catatanBaru })}
        />

        <div>
          <label className={KELAS.label} htmlFor="org-judul">Nama jabatan</label>
          <input
            id="org-judul"
            value={formItem.judul}
            onChange={(e) => setFormItem({ ...formItem, judul: e.target.value })}
            placeholder="mis. BENDAHARA"
            className={`mt-1 ${KELAS.input}`}
          />
        </div>
        <div>
          <label className={KELAS.label} htmlFor="org-pic">Nama PIC</label>
          <input
            id="org-pic"
            value={formItem.picNama}
            onChange={(e) => setFormItem({ ...formItem, picNama: e.target.value })}
            placeholder="mis. Yudi Nahyuddin"
            className={`mt-1 ${KELAS.input}`}
          />
        </div>
        <div>
          <label className={KELAS.label} htmlFor="org-tier">Tingkat</label>
          <select
            id="org-tier"
            value={formItem.rutin}
            onChange={(e) => setFormItem({ ...formItem, rutin: e.target.value })}
            className={`mt-1 ${KELAS.input}`}
          >
            <option value="Pimpinan">Pimpinan (paling atas)</option>
            <option value="Pengurus Inti">Pengurus Inti</option>
            <option value="Divisi">Divisi</option>
          </select>
        </div>
      </FormDialog>

      {/* Dialog tambah/ubah tugas */}
      <FormDialog
        terbuka={dialogSub !== null}
        judul={dialogSub?.sub ? 'Ubah Tugas' : 'Tambah Tugas'}
        onTutup={() => setDialogSub(null)}
        onSimpan={() => void simpanSub()}
        error={errorDialogSub}
      >
        {dialogSub && <p className={KELAS.keteranganKecil}>Di bawah jabatan: {dialogSub.induk}</p>}

        <PemilihIkonManual
          judul={formSub.judul}
          catatan={formSub.catatan}
          jenis="tugas"
          label="Ikon Tugas / Perlengkapan"
          onUbahCatatan={(catatanBaru) => setFormSub({ ...formSub, catatan: catatanBaru })}
        />

        <div>
          <label className={KELAS.label} htmlFor="org-sub-judul">Deskripsi tugas</label>
          <input
            id="org-sub-judul"
            value={formSub.judul}
            onChange={(e) => setFormSub({ ...formSub, judul: e.target.value })}
            placeholder="mis. Catat barang masuk-keluar"
            className={`mt-1 ${KELAS.input}`}
          />
        </div>
        <div>
          <label className={KELAS.label} htmlFor="org-sub-pic">PIC tugas</label>
          <input
            id="org-sub-pic"
            value={formSub.picNama}
            onChange={(e) => setFormSub({ ...formSub, picNama: e.target.value })}
            placeholder="Boleh dikosongkan"
            className={`mt-1 ${KELAS.input}`}
          />
        </div>
        <div>
          <label className={KELAS.label} htmlFor="org-sub-catatan">Keterangan / Jadwal (opsional)</label>
          <input
            id="org-sub-catatan"
            value={formSub.catatan}
            onChange={(e) => setFormSub({ ...formSub, catatan: e.target.value })}
            placeholder="mis. setiap hari Senin"
            className={`mt-1 ${KELAS.input}`}
          />
        </div>
      </FormDialog>

      <KonfirmasiDialog
        terbuka={hapusTarget !== null}
        judul={hapusTarget?.jenis === 'sub' ? 'Hapus tugas ini?' : 'Hapus jabatan ini?'}
        pesan={
          hapusTarget
            ? `"${hapusTarget.judul}" dihapus${hapusTarget.jenis === 'item' ? ' beserta seluruh tugasnya' : ''}. Tindakan ini tidak bisa dibatalkan.`
            : ''
        }
        onBatal={() => setHapusTarget(null)}
        onYa={() => void hapusBaris()}
      />

      <ContextMenu
        x={menuKlikKanan?.x ?? 0}
        y={menuKlikKanan?.y ?? 0}
        terbuka={menuKlikKanan !== null}
        onTutup={() => setMenuKlikKanan(null)}
        judul={menuKlikKanan?.judul}
        items={menuKlikKanan?.items ?? []}
      />
    </>
  );
}

// ===== Impor .docx (Batch Y) — hasil pratinjau sebelum disimpan =====

interface PratinjauImpor {
  namaFile: string;
  hasil: HasilImporPapan;
  judul: string;
}

// ===== Halaman utama =====

type Bagian = 'amanah' | 'kustom';

const BAGIAN: ReadonlyArray<{ id: Bagian; label: string }> = [
  { id: 'amanah', label: 'Struktur PIC' },
  { id: 'kustom', label: 'SOP Kustom' },
];

export function SopView() {
  const [bagian, setBagian] = useState<Bagian>('amanah');

  // Papan baku semi-paten (harusnya tepat satu — dari seed).
  const [papanBaku, setPapanBaku] = useState<Sop | null>(null);
  const [memuatBaku, setMemuatBaku] = useState(true);

  // SOP kustom: daftar + yang sedang dibuka.
  const [kustom, setKustom] = useState<Sop[]>([]);
  const [memuatKustom, setMemuatKustom] = useState(true);
  const [terbuka, setTerbuka] = useState<Sop | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [pesan, setPesan] = useState<string | null>(null);
  const [dialogSop, setDialogSop] = useState<{ mode: 'baru' | 'ubah'; sop?: Sop } | null>(null);
  const [formSop, setFormSop] = useState({ judul: '', catatan: '' });
  const [errorDialog, setErrorDialog] = useState<string | null>(null);
  const [hapusTarget, setHapusTarget] = useState<Sop | null>(null);

  // Impor .docx papan (Batch Y).
  const [impor, setImpor] = useState<PratinjauImpor | null>(null);
  const [errorImpor, setErrorImpor] = useState<string | null>(null);
  const [sibukImpor, setSibukImpor] = useState(false);

  const muatBaku = useCallback(async () => {
    setMemuatBaku(true);
    try {
      let semua = await sopSvc.daftarSop({ baku: true });
      if (semua.length === 0) {
        // Race seed-vs-load pada data yang baru dibuat & kondisi pasca-
        // pemulihan cadangan lama: tanam sendiri (idempoten per tanda baku),
        // lalu baca ulang — papan baku tidak boleh sekadar hilang.
        await seedSopAmanah();
        semua = await sopSvc.daftarSop({ baku: true });
      }
      setPapanBaku(semua[0] ?? null);
      setError(null);
    } catch (e) {
      setError(pesanError(e));
    }
    setMemuatBaku(false);
  }, []);

  const muatKustom = useCallback(async () => {
    setMemuatKustom(true);
    try {
      setKustom(await sopSvc.daftarSop({ baku: false }));
      setError(null);
    } catch (e) {
      setError(pesanError(e));
    }
    setMemuatKustom(false);
  }, []);

  useEffect(() => {
    void muatBaku();
    void muatKustom();
  }, [muatBaku, muatKustom]);

  // Ikhtisar tiap kartu kustom: jumlah baris tercentang (item + sub).
  const [ikhtisarKustom, setIkhtisarKustom] = useState<Record<string, sopSvc.IkhtisarCeklis>>({});
  useEffect(() => {
    let batal = false;
    void (async () => {
      const hasil: Record<string, sopSvc.IkhtisarCeklis> = {};
      for (const s of kustom) {
        try {
          const [it, sub] = await Promise.all([sopSvc.daftarItemSop(s.id), sopSvc.daftarSubItemSop(s.id)]);
          hasil[s.id] = sopSvc.ikhtisarCeklis([...it, ...sub]);
        } catch {
          hasil[s.id] = { total: 0, selesai: 0, persen: 0 };
        }
      }
      if (!batal) setIkhtisarKustom(hasil);
    })();
    return () => {
      batal = true;
    };
  }, [kustom]);

  function bukaBaru() {
    setFormSop({ judul: '', catatan: '' });
    setErrorDialog(null);
    setDialogSop({ mode: 'baru' });
  }

  function bukaUbahInfo(s: Sop) {
    setFormSop({ judul: s.judul, catatan: s.catatan });
    setErrorDialog(null);
    setDialogSop({ mode: 'ubah', sop: s });
  }

  async function simpanSop() {
    if (!dialogSop) return;
    try {
      if (dialogSop.mode === 'ubah' && dialogSop.sop) {
        await sopSvc.ubahSop(dialogSop.sop.id, formSop);
        setTerbuka((lama) => (lama && dialogSop.sop && lama.id === dialogSop.sop.id ? { ...lama, ...formSop } : lama));
      } else {
        const baru = await sopSvc.tambahSop(formSop);
        await muatKustom();
        setBagian('kustom');
        setTerbuka(baru);
      }
      setDialogSop(null);
    } catch (e) {
      setErrorDialog(pesanError(e));
    }
  }

  async function duplikat(s: Sop) {
    try {
      const salinan = await sopSvc.duplikatSop(s.id);
      setPesan(`"${s.judul}" diduplikat menjadi "${salinan.judul}" — ceklisnya dikosongkan.`);
      await muatKustom();
      setBagian('kustom');
      setTerbuka(salinan);
    } catch (e) {
      setError(pesanError(e));
    }
  }

  async function hapusSopTerpilih() {
    if (!hapusTarget) return;
    const target = hapusTarget;
    setHapusTarget(null);
    try {
      await sopSvc.hapusSop(target.id);
      setPesan(`"${target.judul}" dihapus.`);
      if (terbuka?.id === target.id) setTerbuka(null);
      await muatKustom();
    } catch (e) {
      setError(pesanError(e));
    }
  }

  // Impor .docx → pratinjau (pola panel impor template, K-18/K-24): berkas
  // ekspor Tartib membawa tartib/sop.json (round-trip penuh); berkas Word
  // biasa jatuh ke heuristik ☐ / ↳.
  async function pilihBerkasImpor(berkas: File) {
    setErrorImpor(null);
    setError(null);
    try {
      const zip = await bacaZip(await berkas.arrayBuffer());
      const jsonEntry = zip.get('tartib/sop.json');
      let hasil: HasilImporPapan;
      if (jsonEntry) {
        hasil = sopPapanDariJson(new TextDecoder().decode(jsonEntry));
      } else {
        const xmlBytes = zip.get('word/document.xml');
        if (!xmlBytes) throw new Error('Bukan dokumen Word — tidak ada word/document.xml di dalamnya');
        hasil = dokumenXmlKeSopPapan(parseXmlLite(new TextDecoder().decode(xmlBytes)));
      }
      if (hasil.items.length === 0) {
        throw new Error('Tidak ditemukan item ceklis (baris berawalan ☐) di dokumen ini');
      }
      setImpor({
        namaFile: berkas.name,
        hasil,
        judul: hasil.judulDokumen || berkas.name.replace(/\.docx$/i, '') || 'SOP hasil impor',
      });
    } catch (e) {
      setErrorImpor(pesanError(e));
    }
  }

  async function jalankanImpor() {
    if (!impor) return;
    setSibukImpor(true);
    try {
      const baru = await sopSvc.imporSopPapan({
        judul: impor.judul,
        catatan: impor.hasil.catatan ?? undefined,
        items: impor.hasil.items,
      });
      setImpor(null);
      setPesan(
        `SOP "${baru.judul}" diimpor (${impor.hasil.items.length} item` +
          `${impor.hasil.dariJsonTartib ? '' : ' — PIC & rutin hasil uraian baris'}) — ceklisnya kosong, siap dipakai.`,
      );
      await muatKustom();
      setBagian('kustom');
      setTerbuka(baru);
    } catch (e) {
      setErrorImpor(pesanError(e));
    } finally {
      setSibukImpor(false);
    }
  }

  const judulBagian =
    bagian === 'amanah'
      ? 'Struktur organisasi santri — jabatan, PIC, dan daftar tugas di bawahnya.'
      : 'SOP berdiri sendiri buatan Anda — bebas bentuk, lengkap dengan PIC & ceklis.';

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className={KELAS.judulHalaman}>PIC Amanah</h2>
          <p className={`mt-1 ${KELAS.keterangan}`}>{judulBagian}</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/?view=preset"
            className="flex items-center gap-1.5 rounded-xl border border-emas-400/80 bg-white/80 px-3 py-1.5 text-xs font-semibold text-aksen-900 shadow-sm transition hover:bg-white active:scale-95"
          >
            <span>⚡ Preset</span>
          </a>
          <a
            href="/?view=canvas"
            className="flex items-center gap-1.5 rounded-xl bg-aksen-700 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-aksen-800 active:scale-95"
          >
            <span>🖨️ Kanvas Cetak</span>
          </a>
        </div>
      </div>

      {/* Sub-navigasi bagian — pil yang membungkus sendiri di layar sempit. */}
      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        {BAGIAN.map((b) => (
          <button
            key={b.id}
            onClick={() => setBagian(b.id)}
            aria-current={bagian === b.id ? 'true' : undefined}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-center text-sm font-medium sm:px-4 ${
              bagian === b.id
                ? 'bg-gradient-to-b from-aksen-500 to-aksen-600 text-white shadow-glowAksen ring-1 ring-inset ring-white/30'
                : 'bg-white/60 text-teks-sedang ring-1 ring-inset ring-white/70 backdrop-blur-sm hover:bg-white/80 hover:text-teks-utama'
            }`}
          >
            {b.label}
          </button>
        ))}
      </div>

      {error && <p className={KELAS.error}>{error}</p>}
      {pesan && (
        <p className="rounded-kontrol bg-aksen-100/70 px-3 py-2 text-sm text-aksen-700 ring-1 ring-inset ring-aksen-200/70">
          {pesan}
        </p>
      )}

      {bagian === 'amanah' && (
        <>
          {memuatBaku ? (
            <p className="text-sm text-teks-halus">Memuat…</p>
          ) : papanBaku ? (
            <BaganOrganisasi sop={papanBaku} />
          ) : (
            <div className={KELAS.kosong}>
              <p>Struktur PIC tidak dapat dimuat dari penyimpanan lokal.</p>
              <button onClick={() => void muatBaku()} className={`mt-3 ${KELAS.tombolSekunder}`}>
                Coba muat ulang
              </button>
            </div>
          )}
        </>
      )}

      {bagian === 'kustom' && !terbuka && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className={KELAS.keterangan}>{kustom.length} SOP kustom</p>
            <div className="flex flex-wrap gap-2">
              <label>
                <span className={KELAS.tombolSekunder}>Impor .docx</span>
                <input
                  type="file"
                  accept=".docx"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void pilihBerkasImpor(f);
                    e.target.value = '';
                  }}
                  className="sr-only"
                />
              </label>
              <button onClick={bukaBaru} className={KELAS.tombolUtama}>
                Buat SOP
              </button>
            </div>
          </div>

          {errorImpor && <p className={`mb-3 ${KELAS.error}`}>{errorImpor}</p>}

          {memuatKustom ? (
            <p className="text-sm text-teks-halus">Memuat…</p>
          ) : kustom.length === 0 ? (
            <p className={KELAS.kosong}>
              Belum ada SOP kustom — buat sendiri daftar tugas yang berulang di lembaga Anda (mis.
              &quot;SOP Jaga Malam&quot;, &quot;SOP Koperasi&quot;), atau impor dari berkas .docx.
            </p>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {kustom.map((s) => {
                const ik = ikhtisarKustom[s.id] ?? { total: 0, selesai: 0, persen: 0 };
                return (
                  <li key={s.id} className={`${KELAS.kartuIsi} flex flex-col`}>
                    <h3 className={KELAS.judulKartu}>{s.judul}</h3>
                    {s.catatan && (
                      <p className={`mt-1 line-clamp-2 ${KELAS.keteranganKecil}`}>{s.catatan}</p>
                    )}
                    <p className={`mt-2 ${KELAS.keteranganKecil}`}>
                      {ik.selesai}/{ik.total} item dicentang ({ik.persen}%)
                    </p>
                    <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-netral-200">
                      <div
                        className="h-full rounded-full bg-aksen-500 transition-all"
                        style={{ width: `${ik.persen}%` }}
                      />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <button onClick={() => setTerbuka(s)} className={KELAS.tombolUtamaKecil}>
                        Buka
                      </button>
                      <button onClick={() => void duplikat(s)} className={KELAS.tombolSekunderKecil}>
                        Duplikat
                      </button>
                      <button onClick={() => setHapusTarget(s)} className={KELAS.tombolBahayaHalus}>
                        Hapus
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}

      {bagian === 'kustom' && terbuka && (
        <>
          <button onClick={() => setTerbuka(null)} className="text-sm font-medium text-aksen-700 hover:underline">
            ← Kembali ke daftar SOP kustom
          </button>
          <PanelItemSop
            sop={terbuka}
            aksiHeader={
              <>
                <button onClick={() => bukaUbahInfo(terbuka)} className={KELAS.tombolSekunderKecil}>
                  Ubah Info
                </button>
                <button onClick={() => void duplikat(terbuka)} className={KELAS.tombolSekunderKecil}>
                  Duplikat
                </button>
                <button onClick={() => setHapusTarget(terbuka)} className={KELAS.tombolBahaya}>
                  Hapus
                </button>
              </>
            }
          />
        </>
      )}

      <FormDialog
        terbuka={dialogSop !== null}
        judul={dialogSop?.mode === 'ubah' ? 'Ubah SOP' : 'Buat SOP Kustom'}
        onTutup={() => setDialogSop(null)}
        onSimpan={() => void simpanSop()}
        error={errorDialog}
      >
        <div>
          <label className={KELAS.label} htmlFor="sop-judul">
            Judul SOP
          </label>
          <input
            id="sop-judul"
            value={formSop.judul}
            onChange={(e) => setFormSop({ ...formSop, judul: e.target.value })}
            placeholder="mis. SOP Jaga Malam"
            className={`mt-1 ${KELAS.input}`}
          />
        </div>
        <div>
          <label className={KELAS.label} htmlFor="sop-catatan">
            Keterangan
          </label>
          <input
            id="sop-catatan"
            value={formSop.catatan}
            onChange={(e) => setFormSop({ ...formSop, catatan: e.target.value })}
            placeholder="mis. prosedur malam minggu, giliran santri"
            className={`mt-1 ${KELAS.input}`}
          />
        </div>
      </FormDialog>

      {/* Pratinjau impor (pola pratinjau template K-19: pengguna menghakimi
          hasil sebelum menyimpan). */}
      <AppDialog terbuka={impor !== null} judul="Pratinjau Impor SOP" onTutup={() => setImpor(null)} lebar="lg">
        {impor && (
          <div className="space-y-3">
            <p className={KELAS.keteranganKecil}>
              Berkas: {impor.namaFile} ·{' '}
              {impor.hasil.dariJsonTartib
                ? 'berkas ekspor Tartib — seluruh data (PIC, rutin, sub-tugas) ikut'
                : 'dokumen biasa — item dari baris ☐, atribut diurai dari teks'}
            </p>
            <div>
              <label className={KELAS.label} htmlFor="sop-impor-judul">
                Judul SOP
              </label>
              <input
                id="sop-impor-judul"
                value={impor.judul}
                onChange={(e) => setImpor({ ...impor, judul: e.target.value })}
                className={`mt-1 ${KELAS.input}`}
              />
            </div>
            <p className={KELAS.keterangan}>
              {impor.hasil.items.length} item ·{' '}
              {impor.hasil.items.reduce((n, i) => n + (i.sub?.length ?? 0), 0)} sub-tugas · PIC terisi{' '}
              {impor.hasil.items.filter((i) => i.picNama).length}
            </p>
            {impor.hasil.subTanpaInduk.length > 0 && (
              <p className={KELAS.error}>
                {impor.hasil.subTanpaInduk.length} sub-tugas tanpa item induk dilewati:{' '}
                {impor.hasil.subTanpaInduk.join(', ')}
              </p>
            )}
            {impor.hasil.paragrafDiabaikan > 0 && (
              <p className={KELAS.keteranganKecil}>
                {impor.hasil.paragrafDiabaikan} paragraf bukan ceklis diabaikan.
              </p>
            )}
            <div className={`max-h-56 space-y-1 overflow-y-auto ${KELAS.blok}`}>
              {impor.hasil.items.map((it, i) => (
                <div key={i} className="text-sm text-teks-kuat">
                  ☐ {it.judul}
                  {it.picNama ? ` — PIC: ${it.picNama}` : ''}
                  {it.rutin ? ` — Rutin: ${it.rutin}` : ''}
                  {(it.sub ?? []).map((s, j) => (
                    <div key={j} className="pl-5 text-teks-sedang">
                      ↳ {s.judul}
                      {s.picNama ? ` — PIC: ${s.picNama}` : ''}
                    </div>
                  ))}
                </div>
              ))}
            </div>
            {errorImpor && <p className={KELAS.error}>{errorImpor}</p>}
            <div className="flex justify-end gap-2">
              <button onClick={() => setImpor(null)} className={KELAS.tombolSekunder}>
                Batal
              </button>
              <button onClick={() => void jalankanImpor()} disabled={sibukImpor} className={KELAS.tombolUtama}>
                {sibukImpor ? 'Menyimpan…' : 'Simpan sebagai SOP'}
              </button>
            </div>
          </div>
        )}
      </AppDialog>

      <KonfirmasiDialog
        terbuka={hapusTarget !== null}
        judul="Hapus SOP ini?"
        pesan={
          hapusTarget
            ? `"${hapusTarget.judul}" beserta seluruh item dan sub-tugasnya dihapus. Tindakan ini tidak bisa dibatalkan.`
            : ''
        }
        onBatal={() => setHapusTarget(null)}
        onYa={() => void hapusSopTerpilih()}
      />
    </div>
  );
}
