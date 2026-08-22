'use client';

// Halaman ?view=template (Batch B): daftar template + editor fase & item.
// Sejak Batch W juga pintu masuk IMPOR SOP (dokumen .docx → template baru
// yang bisa dibaca, diduplikasi, dan diubah; pindahan dari tab Evaluasi)
// dan EKSPOR template (unduh .docx / simpan ke Google Drive). Semua mutasi
// lewat templateService/divisiService; konfirmasi lewat AppDialog (tanpa
// window.confirm).

import { useCallback, useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { tartibDb } from '../db/schema';
import { standaloneHost } from '../host/standaloneHost';
import { usePagedList } from '../lib/usePagedList';
import { formatOffsetHari, formatTanggalIndonesia, tanggalHariIni } from '../lib/tanggal';
import { bacaZip } from '../lib/impor/zip';
import { parseXmlLite } from '../lib/impor/xml';
import { dokumenXmlKeSop, type HasilImporDokumen } from '../lib/impor/dokumenSop';
import { tulisDocx, type DataTulisDocx } from '../lib/ekspor/tulisDocx';
import {
  bacaClientId,
  bacaToken,
  bacaTokenDariHash,
  bangunUrlOtorisasi,
  buatState,
  simpanClientId,
  simpanToken,
  unggahKeDrive,
  type TokenDrive,
} from '../lib/gdrive';
import { daftarDivisi } from '../services/divisiService';
import * as ts from '../services/templateService';
import { AppDialog, FormDialog, KonfirmasiDialog } from './AppDialog';
import type { Divisi, Fase, JenisAcara, Template, TemplateItem } from '../types';
import { KELAS } from '../ui/kelas';
type DialogT =
  | { jenis: 'baru' }
  | { jenis: 'duplikat'; template: Template }
  | { jenis: 'versiBaru'; template: Template }
  | { jenis: 'arsip'; template: Template }
  | { jenis: 'hapusTemplate'; template: Template }
  | { jenis: 'fase'; templateId: string; fase?: Fase }
  | { jenis: 'item'; faseId: string; item?: TemplateItem }
  | { jenis: 'hapusFase'; fase: Fase }
  | { jenis: 'hapusItem'; item: TemplateItem }
  | null;

function pesanError(e: unknown): string {
  return e instanceof Error ? e.message : 'Terjadi kesalahan';
}

// Offset relatif hari-H: 0 → "Hari H", -30 → "H-30", +1 → "H+1".
function formatOffset(offsetHari: number): string {
  if (offsetHari === 0) return 'Hari H';
  return offsetHari < 0 ? `H${offsetHari}` : `H+${offsetHari}`;
}

function formatTanggal(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function TemplateView() {
  const daftar = usePagedList<Template>(tartibDb.template, { orderBy: 'dibuatPada', arah: 'desc' });
  const [terpilih, setTerpilih] = useState<Template | null>(null);

  const [jenisAcara, setJenisAcara] = useState<JenisAcara[]>([]);
  const [divisiList, setDivisiList] = useState<Divisi[]>([]);

  const [fases, setFases] = useState<Fase[]>([]);
  const [items, setItems] = useState<TemplateItem[]>([]);
  const [memuatEditor, setMemuatEditor] = useState(false);
  const [cetakPanduan, setCetakPanduan] = useState(false);

  const [dialogT, setDialogT] = useState<DialogT>(null);
  const [errorDialog, setErrorDialog] = useState<string | null>(null);
  const [errorUmum, setErrorUmum] = useState<string | null>(null);

  // Impor SOP dari dokumen (Batch W): .docx diparse menjadi template baru.
  const [impor, setImpor] = useState<{ namaFile: string; hasil: HasilImporDokumen } | null>(null);
  const [formImpor, setFormImpor] = useState({ nama: '', jenisAcaraId: '' });
  const [errorImpor, setErrorImpor] = useState<string | null>(null);
  const [menyimpanImpor, setMenyimpanImpor] = useState(false);
  const [pesanImpor, setPesanImpor] = useState<string | null>(null);

  // Ekspor template: unduh .docx (lokal) atau unggah ke Google Drive (Batch W).
  const [tampilkanFormClientId, setTampilkanFormClientId] = useState(false);
  const [clientIdDrive, setClientIdDrive] = useState('');
  const [mengunggahDrive, setMengunggahDrive] = useState(false);
  const [pesanEkspor, setPesanEkspor] = useState<string | null>(null);
  const [errorEkspor, setErrorEkspor] = useState<string | null>(null);

  // Form state diinisialisasi saat dialog dibuka.
  const [formBaru, setFormBaru] = useState({ jenisAcaraId: '', nama: '', catatan: '' });
  const [formDuplikat, setFormDuplikat] = useState({ nama: '' });
  const [formFase, setFormFase] = useState({ label: '', offsetHari: '0' });
  const [formItem, setFormItem] = useState({
    judul: '',
    divisiId: '',
    wajib: false,
    rumusQty: '',
    catatan: '',
  });

  useEffect(() => {
    void Promise.all([ts.daftarJenisAcara(), daftarDivisi()]).then(([j, d]) => {
      setJenisAcara(j);
      setDivisiList(d);
    });
  }, []);

  const muatEditor = useCallback(async () => {
    if (!terpilih) return;
    setMemuatEditor(true);
    try {
      const [f, i] = await Promise.all([
        ts.ambilFaseTemplate(terpilih.id),
        ts.ambilItemTemplate(terpilih.id),
      ]);
      setFases(f);
      setItems(i);
      setErrorUmum(null);
    } catch (e) {
      setErrorUmum(pesanError(e));
    } finally {
      setMemuatEditor(false);
    }
  }, [terpilih]);

  useEffect(() => {
    void muatEditor();
  }, [muatEditor]);

  const jenisMap = new Map<string, JenisAcara>(jenisAcara.map((j) => [j.id, j]));
  const divisiMap = new Map<string, Divisi>(divisiList.map((d) => [d.id, d]));
  const dialog = dialogT;

  // ===== Aksi daftar & header =====

  function bukaBaru() {
    setFormBaru({ jenisAcaraId: jenisAcara[0]?.id ?? '', nama: '', catatan: '' });
    setErrorDialog(null);
    setDialogT({ jenis: 'baru' });
  }

  function bukaDuplikat(t: Template) {
    setFormDuplikat({ nama: '' });
    setErrorDialog(null);
    setDialogT({ jenis: 'duplikat', template: t });
  }

  function bukaVersiBaru(t: Template) {
    setErrorDialog(null);
    setDialogT({ jenis: 'versiBaru', template: t });
  }

  function bukaArsip(t: Template) {
    setErrorDialog(null);
    setDialogT({ jenis: 'arsip', template: t });
  }

  function bukaHapus(t: Template) {
    setErrorDialog(null);
    setDialogT({ jenis: 'hapusTemplate', template: t });
  }

  function bukaFase(templateId: string, fase?: Fase) {
    setFormFase(fase ? { label: fase.label, offsetHari: String(fase.offsetHari) } : { label: '', offsetHari: '0' });
    setErrorDialog(null);
    setDialogT({ jenis: 'fase', templateId, fase });
  }

  function bukaItem(faseId: string, item?: TemplateItem) {
    setFormItem(
      item
        ? {
            judul: item.judul,
            divisiId: item.divisiId,
            wajib: item.wajib,
            rumusQty: item.rumusQty ?? '',
            catatan: item.catatan,
          }
        : { judul: '', divisiId: divisiList[0]?.id ?? '', wajib: false, rumusQty: '', catatan: '' },
    );
    setErrorDialog(null);
    setDialogT({ jenis: 'item', faseId, item });
  }

  function tutupDialog() {
    setDialogT(null);
    setErrorDialog(null);
  }

  async function simpanBaru() {
    try {
      const t = await ts.buatTemplate({
        jenisAcaraId: formBaru.jenisAcaraId,
        nama: formBaru.nama,
        catatan: formBaru.catatan,
      });
      tutupDialog();
      daftar.muatUlang();
      setTerpilih(t);
    } catch (e) {
      setErrorDialog(pesanError(e));
    }
  }

  async function simpanDuplikat() {
    if (!dialog || dialog.jenis !== 'duplikat') return;
    try {
      const t = await ts.duplikatTemplate(dialog.template.id, formDuplikat.nama || undefined);
      tutupDialog();
      daftar.muatUlang();
      setTerpilih(t);
    } catch (e) {
      setErrorDialog(pesanError(e));
    }
  }

  async function simpanVersiBaru() {
    if (!dialog || dialog.jenis !== 'versiBaru') return;
    try {
      const t = await ts.versiBaruTemplate(dialog.template.id);
      tutupDialog();
      daftar.muatUlang();
      setTerpilih(t);
    } catch (e) {
      setErrorDialog(pesanError(e));
    }
  }

  async function simpanArsip() {
    if (!dialog || dialog.jenis !== 'arsip') return;
    try {
      await ts.arsipTemplate(dialog.template.id);
      if (terpilih?.id === dialog.template.id) setTerpilih(null);
      tutupDialog();
      daftar.muatUlang();
    } catch (e) {
      setErrorDialog(pesanError(e));
    }
  }

  async function simpanHapus() {
    if (!dialog || dialog.jenis !== 'hapusTemplate') return;
    try {
      await ts.hapusTemplate(dialog.template.id);
      if (terpilih?.id === dialog.template.id) setTerpilih(null);
      tutupDialog();
      daftar.muatUlang();
    } catch (e) {
      setErrorDialog(pesanError(e));
    }
  }

  // ===== Aksi fase & item =====

  async function simpanFase() {
    if (!dialog || dialog.jenis !== 'fase') return;
    const offsetHari = Number(formFase.offsetHari);
    if (!Number.isFinite(offsetHari)) {
      setErrorDialog('Offset hari harus berupa angka');
      return;
    }
    try {
      if (dialog.fase) {
        await ts.ubahFase(dialog.fase.id, { label: formFase.label, offsetHari });
      } else {
        await ts.tambahFase(dialog.templateId, { label: formFase.label, offsetHari });
      }
      tutupDialog();
      await muatEditor();
    } catch (e) {
      setErrorDialog(pesanError(e));
    }
  }

  async function simpanItem() {
    if (!dialog || dialog.jenis !== 'item') return;
    try {
      const input = {
        judul: formItem.judul,
        divisiId: formItem.divisiId,
        wajib: formItem.wajib,
        rumusQty: formItem.rumusQty,
        catatan: formItem.catatan,
      };
      if (dialog.item) {
        await ts.ubahItem(dialog.item.id, input);
      } else {
        await ts.tambahItem(dialog.faseId, input);
      }
      tutupDialog();
      await muatEditor();
    } catch (e) {
      setErrorDialog(pesanError(e));
    }
  }

  async function hapusFase(faseId: string) {
    try {
      await ts.hapusFase(faseId);
      tutupDialog();
      await muatEditor();
    } catch (e) {
      tutupDialog();
      setErrorUmum(pesanError(e));
    }
  }

  async function hapusItem(itemId: string) {
    try {
      await ts.hapusItem(itemId);
      tutupDialog();
      await muatEditor();
    } catch (e) {
      tutupDialog();
      setErrorUmum(pesanError(e));
    }
  }

  async function pindahFase(faseId: string, arah: 'atas' | 'bawah') {
    try {
      await ts.pindahFase(faseId, arah);
      await muatEditor();
    } catch (e) {
      setErrorUmum(pesanError(e));
    }
  }

  async function pindahItem(itemId: string, arah: 'atas' | 'bawah') {
    try {
      await ts.pindahItem(itemId, arah);
      await muatEditor();
    } catch (e) {
      setErrorUmum(pesanError(e));
    }
  }

  function kembaliKeDaftar() {
    setTerpilih(null);
    daftar.muatUlang();
  }

  // ===== Impor & ekspor template (Batch W) =====

  async function pilihBerkasImpor(f: File) {
    setPesanImpor(null);
    setErrorImpor(null);
    try {
      const zip = await bacaZip(await f.arrayBuffer());
      const xmlBytes = zip.get('word/document.xml');
      if (!xmlBytes) throw new Error('Bukan dokumen Word — tidak ada word/document.xml di dalamnya');
      const hasil = dokumenXmlKeSop(parseXmlLite(new TextDecoder().decode(xmlBytes)));
      if (hasil.fases.length === 0) {
        throw new Error('Tidak ditemukan fase SOP (heading berpola H-30 / Hari-H / H+1) di dokumen ini');
      }
      setFormImpor((s) => ({
        nama: hasil.judulDokumen || 'SOP hasil impor',
        jenisAcaraId: s.jenisAcaraId || jenisAcara[0]?.id || '',
      }));
      setImpor({ namaFile: f.name, hasil });
    } catch (e) {
      setErrorImpor(pesanError(e));
    }
  }

  // Peta nama divisi → id; item tanpa tebakan atau dengan divisi tak dikenal
  // jatuh ke Ketua Panitia (perkiraan — bisa diubah di editor template).
  function idDivisiUntukItem(tebakan: string | null): string | null {
    const nama = tebakan ?? 'Ketua Panitia';
    const d = divisiList.find((x) => x.nama.toLowerCase() === nama.toLowerCase());
    return d?.id ?? null;
  }

  async function simpanImpor() {
    if (!impor) return;
    setMenyimpanImpor(true);
    try {
      const totalItem = impor.hasil.fases.reduce((s, f) => s + f.items.length, 0);
      const denganTebakan = impor.hasil.fases.reduce(
        (s, f) => s + f.items.filter((i) => i.divisiTebakan !== null).length,
        0,
      );
      const fallback = totalItem - denganTebakan;
      const tanpaDivisi = impor.hasil.fases.some((f) =>
        f.items.some((i) => idDivisiUntukItem(i.divisiTebakan) === null),
      );
      if (tanpaDivisi) throw new Error('Divisi bawaan tidak ditemukan — periksa data divisi aplikasi');

      const baru = await ts.imporTemplate({
        jenisAcaraId: formImpor.jenisAcaraId,
        nama: formImpor.nama,
        catatan: `Diimpor dari "${impor.namaFile}" — ${impor.hasil.judulDokumen}${
          impor.hasil.subJudul ? ` (${impor.hasil.subJudul})` : ''
        }`,
        fases: impor.hasil.fases.map((f) => ({
          label: f.label,
          offsetHari: f.offsetHari,
          items: f.items.map((i) => ({
            judul: i.judul,
            divisiId: idDivisiUntukItem(i.divisiTebakan) as string,
            wajib: true,
          })),
        })),
      });
      setImpor(null);
      setPesanImpor(
        `Template "${baru.nama}" dibuat: ${impor.hasil.fases.length} fase · ${totalItem} item (${denganTebakan} divisi ditebak dari kata kunci, ${fallback} memakai Ketua Panitia). Template baru muncul di daftar ini — buka untuk menduplikasi atau mengubahnya.`,
      );
      daftar.muatUlang();
    } catch (e) {
      setErrorImpor(pesanError(e));
    } finally {
      setMenyimpanImpor(false);
    }
  }

  // Cetak panduan manual pengisian (sesi 15): flushSync memastikan bagian
  // print ter-commit ke DOM sebelum window.print() (pola Batch F di AcaraView).
  function cetakPanduanA4() {
    if (!terpilih) return;
    flushSync(() => setCetakPanduan(true));
    void standaloneHost
      .cetak({ jenis: 'panduanTemplate', templateId: terpilih.id })
      .finally(() => setCetakPanduan(false));
  }

  // Struktur fase & item diambil ulang dari penyimpanan agar ekspor tidak
  // bergantung pada state editor yang sedang dimuat.
  async function dataDocxUntukEkspor(): Promise<DataTulisDocx> {
    if (!terpilih) throw new Error('Tidak ada template terpilih');
    const [faseList, itemList] = await Promise.all([
      ts.ambilFaseTemplate(terpilih.id),
      ts.ambilItemTemplate(terpilih.id),
    ]);
    return {
      nama: terpilih.nama,
      jenisNama: jenisMap.get(terpilih.jenisAcaraId)?.nama ?? 'SOP Acara',
      catatan: terpilih.catatan || undefined,
      fases: faseList.map((f) => ({
        label: f.label,
        offsetHari: f.offsetHari,
        items: itemList.filter((i) => i.faseId === f.id).map((i) => ({ judul: i.judul })),
      })),
    };
  }

  function namaBerkasDocx(): string {
    return `SOP-${terpilih?.nama.replace(/\s+/g, '-') ?? 'template'}.docx`;
  }

  async function unduhDocx() {
    if (!terpilih) return;
    setPesanEkspor(null);
    setErrorEkspor(null);
    try {
      const data = await dataDocxUntukEkspor();
      const berkas = await tulisDocx(data);
      const blob = new Blob([berkas], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = namaBerkasDocx();
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setPesanEkspor(
        `Berkas ${namaBerkasDocx()} diunduh — bisa dibuka di Word/LibreOffice dan diimpor ulang di tab Template.`,
      );
    } catch (e) {
      setErrorEkspor(pesanError(e));
    }
  }

  // Polling popup OAuth: saat popup masih di accounts.google.com (cross-origin)
  // pembacaan location melempar — ditangkap dan polling dilanjutkan; setelah
  // redirect balik ke origin aplikasi, hash berisi access_token.
  function tungguTokenPopup(w: Window, state: string): Promise<TokenDrive> {
    return new Promise((resolve, reject) => {
      let upaya = 0;
      const interval = window.setInterval(() => {
        upaya += 1;
        if (w.closed) {
          window.clearInterval(interval);
          reject(new Error('Jendela otorisasi Google ditutup sebelum selesai — coba lagi.'));
          return;
        }
        let hash = '';
        try {
          hash = w.location.hash;
        } catch {
          return; // masih di domain Google — lanjut menunggu
        }
        if (hash.includes('access_token') || hash.includes('error')) {
          window.clearInterval(interval);
          try {
            resolve(bacaTokenDariHash(hash, state));
          } catch (e) {
            reject(e);
          }
          return;
        }
        if (upaya >= 240) {
          window.clearInterval(interval);
          reject(new Error('Waktu otorisasi Google habis — coba lagi.'));
        }
      }, 500);
    });
  }

  async function alurDrive(clientId: string) {
    setMengunggahDrive(true);
    setErrorEkspor(null);
    try {
      let token = bacaToken(localStorage);
      if (!token) {
        const state = buatState();
        const w = window.open('', 'tartib-gdrive', 'popup,width=520,height=620');
        if (!w) throw new Error('Popup diblokir browser — izinkan popup untuk aplikasi ini lalu coba lagi.');
        w.location.replace(bangunUrlOtorisasi(clientId, `${window.location.origin}/`, state));
        token = await tungguTokenPopup(w, state);
        simpanToken(token, localStorage);
      }
      const data = await dataDocxUntukEkspor();
      const berkas = await tulisDocx(data);
      const blob = new Blob([berkas], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      const hasil = await unggahKeDrive(blob, namaBerkasDocx(), token);
      setPesanEkspor(
        hasil.webViewLink
          ? `Tersimpan di Google Drive: ${hasil.nama} — buka: ${hasil.webViewLink}`
          : `Tersimpan di Google Drive: ${hasil.nama}.`,
      );
    } catch (e) {
      setErrorEkspor(pesanError(e));
    } finally {
      setMengunggahDrive(false);
    }
  }

  async function eksporKeDrive() {
    setPesanEkspor(null);
    setErrorEkspor(null);
    const tersimpan = bacaClientId(localStorage);
    if (tersimpan === '') {
      setClientIdDrive('');
      setTampilkanFormClientId(true);
      return;
    }
    await alurDrive(tersimpan);
  }

  async function simpanClientIdDrive() {
    const clientId = clientIdDrive.trim();
    if (clientId === '') {
      setErrorEkspor('Client ID tidak boleh kosong');
      return;
    }
    simpanClientId(clientId, localStorage);
    setTampilkanFormClientId(false);
    await alurDrive(clientId);
  }

  // ===== Render =====

  const klasAksi = KELAS.tombolSekunderKecil;
  const klasDanger = KELAS.tombolBahaya;

  if (!terpilih) {
    return (
      <div>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className={KELAS.judulHalaman}>Template SOP Acara</h2>
            <p className="text-sm text-teks-halus">
              {daftar.total} template — duplikat, versi baru, dan arsip tanpa menimpa data.
            </p>
          </div>
          <button onClick={bukaBaru} className={KELAS.tombolUtama}>
            Buat Template
          </button>
        </div>

        {errorUmum && (
          <p className={`mb-4 ${KELAS.error}`}>{errorUmum}</p>
        )}

        {daftar.memuat && <p className="text-sm text-teks-halus">Memuat…</p>}
        {!daftar.memuat && daftar.items.length === 0 && (
          <div className={KELAS.kosong}>
            <p className="text-sm text-teks-halus">Belum ada template. Buat template pertama dari tombol di atas.</p>
          </div>
        )}

        <div className="space-y-3">
          {daftar.items.map((t) => {
            const jenis = jenisMap.get(t.jenisAcaraId);
            return (
              <div key={t.id} className={KELAS.kartuIsi}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-teks-utama">{t.nama}</span>
                      <span className={`${t.aktif ? KELAS.badgeAksen : KELAS.badgeNetral}`}>
                        {t.aktif ? 'Aktif' : 'Diarsipkan'}
                      </span>
                      <span className={KELAS.badgeNetral}>v{t.versi}</span>
                    </div>
                    <p className="mt-1 text-sm text-teks-halus">
                      {jenis?.nama ?? 'Jenis tidak ditemukan'} · dibuat {formatTanggal(t.dibuatPada)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setTerpilih(t)} className={KELAS.tombolSekunderKecil}>
                      Buka
                    </button>
                    <button onClick={() => bukaDuplikat(t)} className={klasAksi}>
                      Duplikat
                    </button>
                    <button onClick={() => bukaVersiBaru(t)} className={klasAksi}>
                      Versi Baru
                    </button>
                    {t.aktif && (
                      <button onClick={() => bukaArsip(t)} className={KELAS.tombolHalus}>
                        Arsip
                      </button>
                    )}
                    <button onClick={() => bukaHapus(t)} className={KELAS.tombolBahayaHalus}>
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Impor SOP dari dokumen (Batch W) */}
        <div className={`mt-6 ${KELAS.kartuIsi}`}>
          <h3 className="font-medium text-teks-utama">Impor SOP dari Dokumen (.docx)</h3>
          <p className="mt-1 text-sm text-teks-halus">
            Pilih berkas dokumen Word (mis. buku panduan SOP). Fase berpola H-30 / Hari-H / H+1 dan item
            ceklisnya menjadi template baru yang bisa dibaca, diduplikasi, dan diubah.
          </p>
          {pesanImpor && (
            <p className="mt-3 rounded-lg bg-aksen-50 px-3 py-2 text-sm text-aksen-700">{pesanImpor}</p>
          )}
          {errorImpor && <p className={`mt-3 ${KELAS.error}`}>{errorImpor}</p>}
          <label className="mt-3 block">
            <span className="sr-only">Pilih berkas .docx</span>
            <input
              type="file"
              accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void pilihBerkasImpor(f);
              }}
              className="block w-full text-sm text-teks-sedang file:mr-3 file:cursor-pointer file:rounded-kontrol file:border-0 file:bg-aksen-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-aksen-700"
            />
          </label>
        </div>

        {daftar.totalHalaman > 1 && (
          <div className="mt-5 flex items-center justify-center gap-3 text-sm text-teks-sedang">
            <button
              onClick={() => daftar.setHalaman(daftar.halaman - 1)}
              disabled={daftar.halaman <= 1}
              className={`${klasAksi} disabled:cursor-not-allowed disabled:opacity-40`}
            >
              ← Sebelumnya
            </button>
            <span>
              Halaman {daftar.halaman} dari {daftar.totalHalaman}
            </span>
            <button
              onClick={() => daftar.setHalaman(daftar.halaman + 1)}
              disabled={daftar.halaman >= daftar.totalHalaman}
              className={`${klasAksi} disabled:cursor-not-allowed disabled:opacity-40`}
            >
              Berikutnya →
            </button>
          </div>
        )}

        {/* Dialog pratinjau impor (Batch W) */}
        {impor && (
          <AppDialog
            terbuka
            judul={`Pratinjau Impor — ${impor.namaFile}`}
            onTutup={() => setImpor(null)}
            lebar="lg"
          >
            <p className="text-sm text-teks-sedang">
              Ditemukan <strong>{impor.hasil.fases.length} fase</strong> dan{' '}
              <strong>{impor.hasil.fases.reduce((s, f) => s + f.items.length, 0)} item</strong> dari{' '}
              &ldquo;{impor.hasil.judulDokumen}&rdquo;
              {impor.hasil.subJudul ? ` (${impor.hasil.subJudul})` : ''}.
              {impor.hasil.itemLuarLinimasa.length > 0 &&
                ` ${impor.hasil.itemLuarLinimasa.length} item ☐ di luar linimasa tidak diimpor — periksa daftarnya di bawah.`}
            </p>
            <div className="mt-3 space-y-2">
              {impor.hasil.fases.map((f) => (
                <div
                  key={f.label}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-kontrol bg-permukaan-halus px-3 py-2 text-sm"
                >
                  <span className="font-medium text-teks-kuat">{f.label}</span>
                  <span className="text-xs text-teks-halus">
                    {formatOffsetHari(f.offsetHari)} · {f.items.length} item
                  </span>
                </div>
              ))}
            </div>
            {impor.hasil.itemLuarLinimasa.length > 0 && (
              <details className="mt-2 rounded-kontrol border border-garis bg-permukaan-halus px-3 py-2 text-sm">
                <summary className="cursor-pointer font-medium text-teks-kuat">
                  {impor.hasil.itemLuarLinimasa.length} item di luar linimasa yang TIDAK diimpor —
                  periksa sebelum menyimpan
                </summary>
                <p className="mt-2 text-xs text-teks-halus">
                  Item ☐ yang berada di luar fase (setelah heading BAGIAN) tidak menjadi tugas.
                  Pastikan tidak ada item berjadwal yang terbuang.
                </p>
                <ul className="mt-2 max-h-56 space-y-2 overflow-y-auto text-xs text-teks-sedang">
                  {Object.entries(
                    impor.hasil.itemLuarLinimasa.reduce<Record<string, string[]>>((acc, it) => {
                      const k = it.bagian ?? 'Tanpa heading bagian';
                      (acc[k] ??= []).push(it.teks);
                      return acc;
                    }, {}),
                  ).map(([bagian, items]) => (
                    <li key={bagian}>
                      <span className="font-medium text-teks-kuat">
                        {bagian} · {items.length} item
                      </span>
                      <ul className="mt-1 list-disc space-y-0.5 pl-4">
                        {items.map((teks, idx) => (
                          <li key={idx}>{teks}</li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              </details>
            )}
            {(() => {
              const total = impor.hasil.fases.reduce((s, f) => s + f.items.length, 0);
              const fallback = impor.hasil.fases.reduce(
                (s, f) => s + f.items.filter((i) => i.divisiTebakan === null).length,
                0,
              );
              return (
                <p className="mt-3 text-sm text-teks-halus">
                  Divisi tiap item adalah perkiraan dari kata kunci judulnya:{' '}
                  {total - fallback} item tertebak, {fallback} tanpa kecocokan dan memakai Ketua
                  Panitia. Periksa dan ubah di editor template setelah impor.
                </p>
              );
            })()}
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-teks-kuat">Nama template</span>
                <input
                  value={formImpor.nama}
                  onChange={(e) => setFormImpor({ ...formImpor, nama: e.target.value })}
                  className={KELAS.input}
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-teks-kuat">Jenis acara</span>
                <select
                  value={formImpor.jenisAcaraId}
                  onChange={(e) => setFormImpor({ ...formImpor, jenisAcaraId: e.target.value })}
                  className={KELAS.input}
                >
                  {jenisAcara.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.nama}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {errorImpor && <p className={`mt-3 ${KELAS.error}`}>{errorImpor}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setImpor(null)} className={KELAS.tombolSekunder}>
                Batal
              </button>
              <button
                onClick={() => void simpanImpor()}
                disabled={menyimpanImpor || formImpor.nama.trim() === '' || !formImpor.jenisAcaraId}
                className={KELAS.tombolUtama}
              >
                {menyimpanImpor ? 'Menyimpan…' : 'Simpan sebagai Template'}
              </button>
            </div>
          </AppDialog>
        )}

        {/* Dialog buat template */}
        {dialog?.jenis === 'baru' && (
          <FormDialog terbuka judul="Buat Template" onTutup={tutupDialog} onSimpan={simpanBaru} labelSimpan="Buat" error={errorDialog}>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-teks-kuat">Jenis acara</span>
              <select
                value={formBaru.jenisAcaraId}
                onChange={(e) => setFormBaru({ ...formBaru, jenisAcaraId: e.target.value })}
                className={KELAS.input}
              >
                {jenisAcara.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.nama}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-teks-kuat">Nama template</span>
              <input
                value={formBaru.nama}
                onChange={(e) => setFormBaru({ ...formBaru, nama: e.target.value })}
                placeholder="mis. Tasyakuran Khatam"
                className={KELAS.input}
                autoFocus
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-teks-kuat">Catatan (opsional)</span>
              <textarea
                value={formBaru.catatan}
                onChange={(e) => setFormBaru({ ...formBaru, catatan: e.target.value })}
                rows={3}
                className={KELAS.input}
              />
            </label>
          </FormDialog>
        )}

        {/* Dialog duplikat */}
        {dialog?.jenis === 'duplikat' && (
          <FormDialog
            terbuka
            judul={`Duplikat "${dialog.template.nama}"`}
            onTutup={tutupDialog}
            onSimpan={simpanDuplikat}
            labelSimpan="Duplikat"
            error={errorDialog}
          >
            <p className="text-sm text-teks-sedang">
              Salinan baru berisi struktur fase & item yang sama, versi 1, dan tetap aktif.
            </p>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-teks-kuat">Nama salinan (opsional)</span>
              <input
                value={formDuplikat.nama}
                onChange={(e) => setFormDuplikat({ ...formDuplikat, nama: e.target.value })}
                placeholder={`${dialog.template.nama} (Salinan)`}
                className={KELAS.input}
                autoFocus
              />
            </label>
          </FormDialog>
        )}

        {/* Dialog versi baru */}
        {dialog?.jenis === 'versiBaru' && (
          <KonfirmasiDialog
            terbuka
            judul="Buat Versi Baru"
            pesan={`Versi v${dialog.template.versi + 1} dibuat dari "${dialog.template.nama}" dengan struktur fase & item yang sama. Versi lama diarsipkan otomatis tetapi tetap terbaca.`}
            labelYa="Buat Versi Baru"
            bahaya={false}
            onBatal={tutupDialog}
            onYa={simpanVersiBaru}
          />
        )}

        {/* Dialog arsip */}
        {dialog?.jenis === 'arsip' && (
          <KonfirmasiDialog
            terbuka
            judul="Arsipkan Template"
            pesan={`"${dialog.template.nama}" tidak lagi muncul sebagai template aktif. Isinya tetap tersimpan dan terbaca.`}
            labelYa="Arsipkan"
            onBatal={tutupDialog}
            onYa={simpanArsip}
          />
        )}

        {/* Dialog hapus template */}
        {dialog?.jenis === 'hapusTemplate' && (
          <KonfirmasiDialog
            terbuka
            judul="Hapus Template"
            pesan={`"${dialog.template.nama}" beserta seluruh fase dan itemnya akan dihapus permanen. Acara yang sudah dibuat dari template ini tidak terpengaruh karena memakai salinan snapshot.`}
            labelYa="Hapus Permanen"
            onBatal={tutupDialog}
            onYa={simpanHapus}
          />
        )}
      </div>
    );
  }

  // ===== Editor template terpilih =====

  const jenis = jenisMap.get(terpilih.jenisAcaraId);

  return (
    <>
      {/* Saat mencetak panduan, seluruh editor disembunyikan dari kertas —
          yang tercetak hanya formulir panduan di bawah. */}
      <div className={cetakPanduan ? 'print:hidden' : undefined}>
        <div className="mb-5">
        <button onClick={kembaliKeDaftar} className="mb-3 text-sm font-medium text-aksen-700 hover:underline">
          ← Kembali ke daftar template
        </button>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className={KELAS.judulHalaman}>{terpilih.nama}</h2>
          <span className={`${terpilih.aktif ? KELAS.badgeAksen : KELAS.badgeNetral}`}>
            {terpilih.aktif ? 'Aktif' : 'Diarsipkan'}
          </span>
          <span className={KELAS.badgeNetral}>v{terpilih.versi}</span>
        </div>
        <p className="mt-1 text-sm text-teks-halus">
          {jenis?.nama ?? 'Jenis tidak ditemukan'} · {fases.length} fase · {items.length} item · dibuat{' '}
          {formatTanggal(terpilih.dibuatPada)}
        </p>
        {terpilih.catatan && <p className="mt-1 text-sm text-teks-sedang">{terpilih.catatan}</p>}
        <div className="mt-3 flex gap-2">
          <button onClick={() => bukaDuplikat(terpilih)} className={klasAksi}>
            Duplikat
          </button>
          <button onClick={() => bukaVersiBaru(terpilih)} className={klasAksi}>
            Versi Baru
          </button>
          {terpilih.aktif && (
            <button onClick={() => bukaArsip(terpilih)} className={KELAS.tombolHalus}>
              Arsip
            </button>
          )}
          <button onClick={() => bukaHapus(terpilih)} className={KELAS.tombolBahaya}>
            Hapus
          </button>
        </div>
      </div>

      {/* Ekspor & cetak template (Batch W; cetak panduan sesi 15) */}
      <div className={`mb-4 ${KELAS.kartuIsi}`}>
        <h3 className="font-medium text-teks-utama">Ekspor &amp; Cetak Template</h3>
        <p className="mt-1 text-sm text-teks-halus">
          Unduh sebagai dokumen Word (.docx) untuk dibagikan atau dicadangkan, simpan ke Google Drive,
          atau cetak panduan pengisian A4 — formulir kertas berisi fase &amp; item dengan kolom
          tanggal dan PIC untuk diisi manual. Berkas .docx bisa diimpor ulang di tab Template tanpa
          kehilangan struktur fase &amp; item.
        </p>
        {pesanEkspor && (
          <p className="mt-3 rounded-lg bg-aksen-50 px-3 py-2 text-sm text-aksen-700">{pesanEkspor}</p>
        )}
        {errorEkspor && <p className={`mt-3 ${KELAS.error}`}>{errorEkspor}</p>}
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={() => void unduhDocx()}
            disabled={memuatEditor}
            className={`${KELAS.tombolUtama} disabled:cursor-not-allowed disabled:opacity-40`}
          >
            Unduh .docx
          </button>
          <button
            onClick={() => void eksporKeDrive()}
            disabled={memuatEditor || mengunggahDrive}
            className={`${KELAS.tombolSekunder} disabled:cursor-not-allowed disabled:opacity-40`}
          >
            {mengunggahDrive ? 'Mengunggah…' : 'Simpan ke Google Drive'}
          </button>
          <button
            onClick={cetakPanduanA4}
            disabled={memuatEditor}
            className={`${KELAS.tombolSekunder} disabled:cursor-not-allowed disabled:opacity-40`}
          >
            Cetak Panduan (A4)
          </button>
        </div>
        {tampilkanFormClientId && (
          <div className="mt-3 rounded-kontrol bg-permukaan-halus p-3">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-teks-kuat">
                Client ID Google (dari Google Cloud Console)
              </span>
              <input
                value={clientIdDrive}
                onChange={(e) => setClientIdDrive(e.target.value)}
                placeholder="mis. 1234567890-abcd.apps.googleusercontent.com"
                className={KELAS.input}
              />
              <span className="mt-1 block text-xs text-teks-redup">
                OAuth perlu client ID untuk aplikasi ini: daftarkan di Google Cloud Console (Authorized
                JavaScript origins & redirect URIs diisi origin aplikasi ini) lalu tempel di sini. Client ID
                hanya disimpan di browser ini.
              </span>
            </label>
            <div className="mt-3 flex justify-end gap-2">
              <button onClick={() => setTampilkanFormClientId(false)} className={KELAS.tombolSekunderKecil}>
                Batal
              </button>
              <button
                onClick={() => void simpanClientIdDrive()}
                disabled={mengunggahDrive}
                className={KELAS.tombolUtamaKecil}
              >
                {mengunggahDrive ? 'Mengunggah…' : 'Simpan & Lanjut'}
              </button>
            </div>
          </div>
        )}
      </div>

      {errorUmum && (
        <p className={`mb-4 ${KELAS.error}`}>{errorUmum}</p>
      )}

      {memuatEditor ? (
        <p className="text-sm text-teks-halus">Memuat…</p>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => bukaFase(terpilih.id)} className={KELAS.tombolUtama}>
              + Tambah Fase
            </button>
          </div>

          {fases.length === 0 && (
            <div className={KELAS.kosong}>
              <p className="text-sm text-teks-halus">
                Belum ada fase. Tambahkan fase pertama, misalnya "Persiapan Awal" (H-30).
              </p>
            </div>
          )}

          {fases.map((fase, idxFase) => {
            const itemsFase = items.filter((i) => i.faseId === fase.id);
            return (
              <div key={fase.id} className={KELAS.kartuIsi}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-teks-utama">
                      {fase.urutan}. {fase.label}
                    </span>
                    <span className={KELAS.badgeNetral}>
                      {formatOffset(fase.offsetHari)}
                    </span>
                    <span className="text-xs text-teks-redup">{itemsFase.length} item</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => pindahFase(fase.id, 'atas')}
                      disabled={idxFase === 0}
                      aria-label={`Pindahkan fase "${fase.label}" ke atas`}
                      className={`${KELAS.tombolIkon} disabled:opacity-30`}
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => pindahFase(fase.id, 'bawah')}
                      disabled={idxFase === fases.length - 1}
                      aria-label={`Pindahkan fase "${fase.label}" ke bawah`}
                      className={`${KELAS.tombolIkon} disabled:opacity-30`}
                    >
                      ↓
                    </button>
                    <button onClick={() => bukaFase(terpilih.id, fase)} className={klasAksi}>
                      Ubah
                    </button>
                    <button
                      onClick={() => setDialogT({ jenis: 'hapusFase', fase })}
                      className={klasDanger}
                    >
                      Hapus
                    </button>
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  {itemsFase.length === 0 && (
                    <p className="text-sm text-teks-redup">Belum ada item SOP.</p>
                  )}
                  {itemsFase.map((item, idxItem) => {
                    const divisi = divisiMap.get(item.divisiId);
                    return (
                      <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-kontrol bg-permukaan-halus px-3 py-2">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium text-teks-kuat">{item.judul}</span>
                            {item.wajib && (
                              <span className={KELAS.badgePeringatan}>wajib</span>
                            )}
                            {item.rumusQty && (
                              <span className={KELAS.badgeInfo}>
                                qty: {item.rumusQty}
                              </span>
                            )}
                          </div>
                          <p className="truncate text-xs text-teks-halus">
                            {divisi?.nama ?? 'Divisi tidak ditemukan'}
                            {item.catatan ? ` · ${item.catatan}` : ''}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => pindahItem(item.id, 'atas')}
                            disabled={idxItem === 0}
                            aria-label={`Pindahkan "${item.judul}" ke atas`}
                            className={`${KELAS.tombolIkon} disabled:opacity-30`}
                          >
                            ↑
                          </button>
                          <button
                            onClick={() => pindahItem(item.id, 'bawah')}
                            disabled={idxItem === itemsFase.length - 1}
                            aria-label={`Pindahkan "${item.judul}" ke bawah`}
                            className={`${KELAS.tombolIkon} disabled:opacity-30`}
                          >
                            ↓
                          </button>
                          <button onClick={() => bukaItem(fase.id, item)} className={KELAS.tombolHalus}>
                            Ubah
                          </button>
                          <button
                            onClick={() => setDialogT({ jenis: 'hapusItem', item })}
                            className={KELAS.tombolBahayaHalus}
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button onClick={() => bukaItem(fase.id)} className="mt-3 text-sm font-medium text-aksen-700 hover:underline">
                  + Tambah Item
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Dialog fase */}
      {dialog?.jenis === 'fase' && (
        <FormDialog
          terbuka
          judul={dialog.fase ? 'Ubah Fase' : 'Tambah Fase'}
          onTutup={tutupDialog}
          onSimpan={simpanFase}
          error={errorDialog}
        >
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-teks-kuat">Label fase</span>
            <input
              value={formFase.label}
              onChange={(e) => setFormFase({ ...formFase, label: e.target.value })}
              placeholder="mis. Persiapan Awal"
              className={KELAS.input}
              autoFocus
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-teks-kuat">
              Offset hari (relatif hari-H, mis. -30, -7, 0, 1)
            </span>
            <input
              type="number"
              value={formFase.offsetHari}
              onChange={(e) => setFormFase({ ...formFase, offsetHari: e.target.value })}
              className={KELAS.input}
            />
          </label>
        </FormDialog>
      )}

      {/* Dialog item */}
      {dialog?.jenis === 'item' && (
        <FormDialog
          terbuka
          judul={dialog.item ? 'Ubah Item' : 'Tambah Item'}
          onTutup={tutupDialog}
          onSimpan={simpanItem}
          error={errorDialog}
        >
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-teks-kuat">Judul item SOP</span>
            <input
              value={formItem.judul}
              onChange={(e) => setFormItem({ ...formItem, judul: e.target.value })}
              placeholder="mis. Konfirmasi jumlah tamu ke pengurus"
              className={KELAS.input}
              autoFocus
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-teks-kuat">Divisi penanggung jawab</span>
            <select
              value={formItem.divisiId}
              onChange={(e) => setFormItem({ ...formItem, divisiId: e.target.value })}
              className={KELAS.input}
            >
              {divisiList.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nama}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={formItem.wajib}
              onChange={(e) => setFormItem({ ...formItem, wajib: e.target.checked })}
              className="h-4 w-4"
            />
            <span className="font-medium text-teks-kuat">Wajib dilaksanakan</span>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-teks-kuat">Rumus kuantitas (opsional)</span>
            <input
              value={formItem.rumusQty}
              onChange={(e) => setFormItem({ ...formItem, rumusQty: e.target.value })}
              placeholder='mis. porsi / 8 atau santri * 1.5'
              className={KELAS.input}
            />
            <span className="mt-1 block text-xs text-teks-redup">
              Variabel: porsi, santri, panitia, rsvp. Fungsi: min, max, ceil, floor.
            </span>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-teks-kuat">Catatan (opsional)</span>
            <textarea
              value={formItem.catatan}
              onChange={(e) => setFormItem({ ...formItem, catatan: e.target.value })}
              rows={2}
              className={KELAS.input}
            />
          </label>
        </FormDialog>
      )}

      {/* Konfirmasi hapus */}
      {dialog?.jenis === 'hapusFase' && (
        <KonfirmasiDialog
          terbuka
          judul="Hapus Fase"
          pesan={`Fase "${dialog.fase.label}" dan seluruh item di dalamnya akan dihapus dari template ini. Acara yang sudah dibuat tidak terpengaruh (menggunakan salinan snapshot).`}
          onBatal={tutupDialog}
          onYa={() => hapusFase(dialog.fase.id)}
        />
      )}
      {dialog?.jenis === 'hapusItem' && (
        <KonfirmasiDialog
          terbuka
          judul="Hapus Item"
          pesan={`Item "${dialog.item.judul}" akan dihapus dari template ini.`}
          onBatal={tutupDialog}
          onYa={() => hapusItem(dialog.item.id)}
        />
      )}

      {/* Dialog duplikat/versiBaru/arsip dari editor */}
      {dialog?.jenis === 'duplikat' && (
        <FormDialog
          terbuka
          judul={`Duplikat "${dialog.template.nama}"`}
          onTutup={tutupDialog}
          onSimpan={simpanDuplikat}
          labelSimpan="Duplikat"
          error={errorDialog}
        >
          <p className="text-sm text-teks-sedang">Salinan baru berisi struktur fase & item yang sama, versi 1, dan tetap aktif.</p>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-teks-kuat">Nama salinan (opsional)</span>
            <input
              value={formDuplikat.nama}
              onChange={(e) => setFormDuplikat({ ...formDuplikat, nama: e.target.value })}
              placeholder={`${dialog.template.nama} (Salinan)`}
              className={KELAS.input}
              autoFocus
            />
          </label>
        </FormDialog>
      )}
      {dialog?.jenis === 'versiBaru' && (
        <KonfirmasiDialog
          terbuka
          judul="Buat Versi Baru"
          pesan={`Versi v${dialog.template.versi + 1} dibuat dari "${dialog.template.nama}" dengan struktur fase & item yang sama. Versi lama diarsipkan otomatis tetapi tetap terbaca.`}
          labelYa="Buat Versi Baru"
          bahaya={false}
          onBatal={tutupDialog}
          onYa={simpanVersiBaru}
        />
      )}
      {dialog?.jenis === 'arsip' && (
        <KonfirmasiDialog
          terbuka
          judul="Arsipkan Template"
          pesan={`"${dialog.template.nama}" tidak lagi muncul sebagai template aktif. Isinya tetap tersimpan dan terbaca.`}
          labelYa="Arsipkan"
          onBatal={tutupDialog}
          onYa={simpanArsip}
        />
      )}
      {dialog?.jenis === 'hapusTemplate' && (
        <KonfirmasiDialog
          terbuka
          judul="Hapus Template"
          pesan={`"${dialog.template.nama}" beserta seluruh fase dan itemnya akan dihapus permanen. Acara yang sudah dibuat dari template ini tidak terpengaruh karena memakai salinan snapshot.`}
          labelYa="Hapus Permanen"
          onBatal={tutupDialog}
          onYa={simpanHapus}
        />
      )}
      </div>

      {/* Formulir panduan manual pengisian — hanya muncul di kertas (sesi 15).
          Kolom tanggal & PIC sengaja kosong untuk diisi tulisan tangan. */}
      {cetakPanduan && (
        <div className="hidden print:block">
          <div className="mb-4 border-b border-slate-400 pb-2">
            <h1 className="text-lg font-bold">Panduan Manual Pengisian SOP</h1>
            <p className="text-sm">
              {terpilih.nama} · {jenis?.nama ?? 'SOP Acara'} · v{terpilih.versi}
            </p>
            {terpilih.catatan && <p className="mt-1 text-xs">{terpilih.catatan}</p>}
            <p className="mt-1 text-xs">Dicetak {formatTanggalIndonesia(tanggalHariIni())}</p>
          </div>
          <div className="mb-4 space-y-1 text-sm">
            <p>Nama acara: ............................................................................</p>
            <p>
              Tanggal Hari-H: .................................... Lokasi:{' '}
              ....................................................
            </p>
          </div>
          {fases.map((fase) => (
            <div key={fase.id} className="mb-3 break-inside-avoid">
              <p className="font-semibold">
                {formatOffsetHari(fase.offsetHari)} — {fase.label} · tanggal:{' '}
                ......................................
              </p>
              <ul className="mt-1 space-y-1 text-sm">
                {items
                  .filter((i) => i.faseId === fase.id)
                  .map((item) => (
                    <li key={item.id} className="flex gap-2">
                      <span>☐</span>
                      <span className="flex-1">
                        {item.judul}
                        {divisiMap.get(item.divisiId) && (
                          <span className="text-slate-500"> · {divisiMap.get(item.divisiId)?.nama}</span>
                        )}
                        {item.catatan && <span className="text-slate-500"> — {item.catatan}</span>}
                      </span>
                      <span>PIC: .......................</span>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
