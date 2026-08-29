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

  const muat = useCallback(async () => {
    try {
      const [it, sub] = await Promise.all([sopSvc.daftarItemSop(sop.id), sopSvc.daftarSubItemSop(sop.id)]);
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
                <li key={it.id} className={KELAS.kartuIsi}>
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
                      <p className={`text-sm font-medium ${it.selesai ? 'text-teks-halus line-through' : 'text-teks-utama'}`}>
                        {it.judul}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <span className={`${it.picNama ? KELAS.badgeInfo : KELAS.badgeNetral} whitespace-nowrap`}>
                          {it.picNama ? `PIC: ${it.picNama}` : 'PIC: belum diisi'}
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
                        <li key={s.id} className="flex flex-wrap items-start gap-x-2 gap-y-1">
                          <input
                            type="checkbox"
                            checked={s.selesai}
                            onChange={() => void centangSub(s, !s.selesai)}
                            aria-label={`Centang sub ${s.judul}`}
                            className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer"
                          />
                          <div className="min-w-36 flex-1">
                            <p className={`text-sm ${s.selesai ? 'text-teks-halus line-through' : 'text-teks-kuat'}`}>
                              {s.judul}
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
    </>
  );
}

/** Baris cetak satu item + sub-tugasnya (sub menjorok dengan ↳). */
function FragmentCetak({ item, subs }: { item: SopItem; subs: SopSubItem[] }) {
  return (
    <>
      <tr className="break-inside-avoid">
        <td className="border border-slate-400 px-2 py-1 text-center">☐</td>
        <td className="border border-slate-400 px-2 py-1 font-medium">{item.judul}</td>
        <td className="border border-slate-400 px-2 py-1">{item.picNama}</td>
        <td className="border border-slate-400 px-2 py-1">{item.rutin}</td>
        <td className="border border-slate-400 px-2 py-1">{item.catatan}</td>
      </tr>
      {subs.map((s) => (
        <tr key={s.id} className="break-inside-avoid">
          <td className="border border-slate-400 px-2 py-1 text-center">☐</td>
          <td className="border border-slate-400 px-2 py-1">↳ {s.judul}</td>
          <td className="border border-slate-400 px-2 py-1">{s.picNama}</td>
          <td className="border border-slate-400 px-2 py-1" />
          <td className="border border-slate-400 px-2 py-1">{s.catatan}</td>
        </tr>
      ))}
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
  { id: 'amanah', label: 'Amanah & Khidmah' },
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
      ? 'Papan amanah baku — struktur semi-paten, isi & PIC berubah sesuai keadaan.'
      : 'SOP berdiri sendiri buatan Anda — bebas bentuk, lengkap dengan PIC & ceklis.';

  return (
    <div className="space-y-5">
      <div>
        <h2 className={KELAS.judulHalaman}>SOP &amp; Amanah</h2>
        <p className={`mt-1 ${KELAS.judulKartu}`}>{judulBagian}</p>
        <p className={`mt-1 ${KELAS.keterangan}`}>
          Daftar tugas yang berdiri sendiri — tidak terikat acara. Isi nama PIC tiap item, beri
          sub-tugas bila perlu rincian, centang saat dikerjakan, dan cetak/unduh lembar ceklisnya.
        </p>
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
            <PanelItemSop sop={papanBaku} />
          ) : (
            <div className={KELAS.kosong}>
              <p>Papan baku amanah tidak dapat dimuat dari penyimpanan lokal.</p>
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
