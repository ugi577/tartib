'use client';

// Halaman ?view=template (Batch B): daftar template + editor fase & item.
// Semua mutasi lewat templateService/divisiService; konfirmasi lewat
// AppDialog (tanpa window.confirm).

import { useCallback, useEffect, useState } from 'react';
import { tartibDb } from '../db/schema';
import { usePagedList } from '../lib/usePagedList';
import { daftarDivisi } from '../services/divisiService';
import * as ts from '../services/templateService';
import { FormDialog, KonfirmasiDialog } from './AppDialog';
import type { Divisi, Fase, JenisAcara, Template, TemplateItem } from '../types';
type DialogT =
  | { jenis: 'baru' }
  | { jenis: 'duplikat'; template: Template }
  | { jenis: 'versiBaru'; template: Template }
  | { jenis: 'arsip'; template: Template }
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

  const [dialogT, setDialogT] = useState<DialogT>(null);
  const [errorDialog, setErrorDialog] = useState<string | null>(null);
  const [errorUmum, setErrorUmum] = useState<string | null>(null);

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

  // ===== Render =====

  const klasAksi =
    'rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50';
  const klasDanger = 'rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50';

  if (!terpilih) {
    return (
      <div>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">Template SOP Acara</h2>
            <p className="text-sm text-slate-500">
              {daftar.total} template — duplikat, versi baru, dan arsip tanpa menimpa data.
            </p>
          </div>
          <button onClick={bukaBaru} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
            Buat Template
          </button>
        </div>

        {errorUmum && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errorUmum}</p>
        )}

        {daftar.memuat && <p className="text-sm text-slate-500">Memuat…</p>}
        {!daftar.memuat && daftar.items.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
            <p className="text-sm text-slate-500">Belum ada template. Buat template pertama dari tombol di atas.</p>
          </div>
        )}

        <div className="space-y-3">
          {daftar.items.map((t) => {
            const jenis = jenisMap.get(t.jenisAcaraId);
            return (
              <div key={t.id} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-800">{t.nama}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          t.aktif ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {t.aktif ? 'Aktif' : 'Diarsipkan'}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">v{t.versi}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {jenis?.nama ?? 'Jenis tidak ditemukan'} · dibuat {formatTanggal(t.dibuatPada)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setTerpilih(t)} className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700">
                      Buka
                    </button>
                    <button onClick={() => bukaDuplikat(t)} className={klasAksi}>
                      Duplikat
                    </button>
                    <button onClick={() => bukaVersiBaru(t)} className={klasAksi}>
                      Versi Baru
                    </button>
                    {t.aktif && (
                      <button onClick={() => bukaArsip(t)} className={klasDanger}>
                        Arsip
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {daftar.totalHalaman > 1 && (
          <div className="mt-5 flex items-center justify-center gap-3 text-sm text-slate-600">
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

        {/* Dialog buat template */}
        {dialog?.jenis === 'baru' && (
          <FormDialog terbuka judul="Buat Template" onTutup={tutupDialog} onSimpan={simpanBaru} labelSimpan="Buat" error={errorDialog}>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Jenis acara</span>
              <select
                value={formBaru.jenisAcaraId}
                onChange={(e) => setFormBaru({ ...formBaru, jenisAcaraId: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                {jenisAcara.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.nama}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Nama template</span>
              <input
                value={formBaru.nama}
                onChange={(e) => setFormBaru({ ...formBaru, nama: e.target.value })}
                placeholder="mis. Tasyakuran Khatam"
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                autoFocus
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Catatan (opsional)</span>
              <textarea
                value={formBaru.catatan}
                onChange={(e) => setFormBaru({ ...formBaru, catatan: e.target.value })}
                rows={3}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
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
            <p className="text-sm text-slate-600">
              Salinan baru berisi struktur fase & item yang sama, versi 1, dan tetap aktif.
            </p>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Nama salinan (opsional)</span>
              <input
                value={formDuplikat.nama}
                onChange={(e) => setFormDuplikat({ ...formDuplikat, nama: e.target.value })}
                placeholder={`${dialog.template.nama} (Salinan)`}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
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
      </div>
    );
  }

  // ===== Editor template terpilih =====

  const jenis = jenisMap.get(terpilih.jenisAcaraId);

  return (
    <div>
      <div className="mb-5">
        <button onClick={kembaliKeDaftar} className="mb-3 text-sm font-medium text-emerald-700 hover:underline">
          ← Kembali ke daftar template
        </button>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-semibold text-slate-800">{terpilih.nama}</h2>
          <span
            className={`rounded-full px-2 py-0.5 text-xs ${
              terpilih.aktif ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
            }`}
          >
            {terpilih.aktif ? 'Aktif' : 'Diarsipkan'}
          </span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">v{terpilih.versi}</span>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          {jenis?.nama ?? 'Jenis tidak ditemukan'} · {fases.length} fase · {items.length} item · dibuat{' '}
          {formatTanggal(terpilih.dibuatPada)}
        </p>
        {terpilih.catatan && <p className="mt-1 text-sm text-slate-600">{terpilih.catatan}</p>}
        <div className="mt-3 flex gap-2">
          <button onClick={() => bukaDuplikat(terpilih)} className={klasAksi}>
            Duplikat
          </button>
          <button onClick={() => bukaVersiBaru(terpilih)} className={klasAksi}>
            Versi Baru
          </button>
          {terpilih.aktif && (
            <button onClick={() => bukaArsip(terpilih)} className={klasDanger}>
              Arsip
            </button>
          )}
        </div>
      </div>

      {errorUmum && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errorUmum}</p>
      )}

      {memuatEditor ? (
        <p className="text-sm text-slate-500">Memuat…</p>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => bukaFase(terpilih.id)} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
              + Tambah Fase
            </button>
          </div>

          {fases.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
              <p className="text-sm text-slate-500">
                Belum ada fase. Tambahkan fase pertama, misalnya "Persiapan Awal" (H-30).
              </p>
            </div>
          )}

          {fases.map((fase, idxFase) => {
            const itemsFase = items.filter((i) => i.faseId === fase.id);
            return (
              <div key={fase.id} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-800">
                      {fase.urutan}. {fase.label}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                      {formatOffset(fase.offsetHari)}
                    </span>
                    <span className="text-xs text-slate-400">{itemsFase.length} item</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => pindahFase(fase.id, 'atas')}
                      disabled={idxFase === 0}
                      className={`${klasAksi} disabled:cursor-not-allowed disabled:opacity-40`}
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => pindahFase(fase.id, 'bawah')}
                      disabled={idxFase === fases.length - 1}
                      className={`${klasAksi} disabled:cursor-not-allowed disabled:opacity-40`}
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
                    <p className="text-sm text-slate-400">Belum ada item SOP.</p>
                  )}
                  {itemsFase.map((item, idxItem) => {
                    const divisi = divisiMap.get(item.divisiId);
                    return (
                      <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium text-slate-700">{item.judul}</span>
                            {item.wajib && (
                              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">wajib</span>
                            )}
                            {item.rumusQty && (
                              <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs text-sky-700">
                                qty: {item.rumusQty}
                              </span>
                            )}
                          </div>
                          <p className="truncate text-xs text-slate-500">
                            {divisi?.nama ?? 'Divisi tidak ditemukan'}
                            {item.catatan ? ` · ${item.catatan}` : ''}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => pindahItem(item.id, 'atas')}
                            disabled={idxItem === 0}
                            className={`${klasAksi} px-2 disabled:cursor-not-allowed disabled:opacity-40`}
                          >
                            ↑
                          </button>
                          <button
                            onClick={() => pindahItem(item.id, 'bawah')}
                            disabled={idxItem === itemsFase.length - 1}
                            className={`${klasAksi} px-2 disabled:cursor-not-allowed disabled:opacity-40`}
                          >
                            ↓
                          </button>
                          <button onClick={() => bukaItem(fase.id, item)} className={`${klasAksi} px-2`}>
                            Ubah
                          </button>
                          <button
                            onClick={() => setDialogT({ jenis: 'hapusItem', item })}
                            className={`${klasDanger} px-2`}
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button onClick={() => bukaItem(fase.id)} className="mt-3 text-sm font-medium text-emerald-700 hover:underline">
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
            <span className="mb-1 block font-medium text-slate-700">Label fase</span>
            <input
              value={formFase.label}
              onChange={(e) => setFormFase({ ...formFase, label: e.target.value })}
              placeholder="mis. Persiapan Awal"
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              autoFocus
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">
              Offset hari (relatif hari-H, mis. -30, -7, 0, 1)
            </span>
            <input
              type="number"
              value={formFase.offsetHari}
              onChange={(e) => setFormFase({ ...formFase, offsetHari: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
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
            <span className="mb-1 block font-medium text-slate-700">Judul item SOP</span>
            <input
              value={formItem.judul}
              onChange={(e) => setFormItem({ ...formItem, judul: e.target.value })}
              placeholder="mis. Konfirmasi jumlah tamu ke pengurus"
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              autoFocus
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Divisi penanggung jawab</span>
            <select
              value={formItem.divisiId}
              onChange={(e) => setFormItem({ ...formItem, divisiId: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
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
            <span className="font-medium text-slate-700">Wajib dilaksanakan</span>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Rumus kuantitas (opsional)</span>
            <input
              value={formItem.rumusQty}
              onChange={(e) => setFormItem({ ...formItem, rumusQty: e.target.value })}
              placeholder='mis. porsi / 8 atau santri * 1.5'
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
            <span className="mt-1 block text-xs text-slate-400">
              Variabel: porsi, santri, panitia, rsvp. Fungsi: min, max, ceil, floor.
            </span>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Catatan (opsional)</span>
            <textarea
              value={formItem.catatan}
              onChange={(e) => setFormItem({ ...formItem, catatan: e.target.value })}
              rows={2}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
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
          <p className="text-sm text-slate-600">Salinan baru berisi struktur fase & item yang sama, versi 1, dan tetap aktif.</p>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Nama salinan (opsional)</span>
            <input
              value={formDuplikat.nama}
              onChange={(e) => setFormDuplikat({ ...formDuplikat, nama: e.target.value })}
              placeholder={`${dialog.template.nama} (Salinan)`}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
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
    </div>
  );
}
