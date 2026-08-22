'use client';

// Halaman ?view=tamu (Batch D): kelompok tamu & RSVP berombongan per acara,
// rekap per kelompok, panel porsi (komponen perhitungan + toggle tim
// pencuci), dan ceklis perlengkapan dihitung dari rumusQty tugas. Semua
// mutasi lewat service layer (PRD §3); santri dari TartibHost (K-04).

import { useEffect, useState } from 'react';
import { tartibDb } from '../db/schema';
import { usePagedList } from '../lib/usePagedList';
import { formatTanggalIndonesia } from '../lib/tanggal';
import { hitungPeralatan, hitungPorsi } from '../lib/porsi';
import { standaloneHost } from '../host/standaloneHost';
import { daftarDivisi } from '../services/divisiService';
import * as tamuSvc from '../services/tamuService';
import * as perlengkapanSvc from '../services/perlengkapanService';
import { FormDialog, KonfirmasiDialog } from './AppDialog';
import type { Acara, Divisi, KelompokTamu, Perlengkapan, Rsvp, StatusRsvp } from '../types';
import { KELAS, badgeStatusRsvp } from '../ui/kelas';

function pesanError(e: unknown): string {
  return e instanceof Error ? e.message : 'Terjadi kesalahan';
}

const klasInput = KELAS.input;
const klasAksi = KELAS.tombolSekunderKecil;
const klasDanger = KELAS.tombolBahaya;

export function TamuView() {
  const daftar = usePagedList<Acara>(tartibDb.acara, { orderBy: 'dibuatPada', arah: 'desc' });
  const [terpilih, setTerpilih] = useState<Acara | null>(null);

  const [divisiList, setDivisiList] = useState<Divisi[]>([]);
  const [kelompok, setKelompok] = useState<KelompokTamu[]>([]);
  const [rsvp, setRsvp] = useState<Rsvp[]>([]);
  const [perlengkapan, setPerlengkapan] = useState<Perlengkapan[]>([]);
  const [memuat, setMemuat] = useState(false);
  const [errorUmum, setErrorUmum] = useState<string | null>(null);

  const [kelompokTerbuka, setKelompokTerbuka] = useState<string | null>(null);

  const [dialogKelompok, setDialogKelompok] = useState<{ mode: 'baru' | 'ubah'; data: KelompokTamu | null } | null>(null);
  const [formKelompok, setFormKelompok] = useState({ nama: '', targetUndangan: 0, catatan: '' });
  const [errorDialog, setErrorDialog] = useState<string | null>(null);
  const [hapusKelompokTarget, setHapusKelompokTarget] = useState<KelompokTamu | null>(null);

  const [dialogRsvp, setDialogRsvp] = useState<{ mode: 'baru' | 'ubah'; kelompokId: string; data: Rsvp | null } | null>(null);
  const [formRsvp, setFormRsvp] = useState<{ namaTamu: string; kontak: string; status: StatusRsvp; jumlahRombongan: number; catatan: string }>({
    namaTamu: '',
    kontak: '',
    status: 'BELUM',
    jumlahRombongan: 1,
    catatan: '',
  });
  const [hapusRsvpTarget, setHapusRsvpTarget] = useState<Rsvp | null>(null);

  const [konteks, setKonteks] = useState({ santri: 0, panitia: 0, cadangan: 10, bufferPersen: 25, adaTimPencuci: true });
  const [memuatPerlengkapan, setMemuatPerlengkapan] = useState(false);

  useEffect(() => {
    void daftarDivisi().then(setDivisiList);
  }, []);

  async function muatDetail(acara: Acara) {
    setMemuat(true);
    try {
      const [k, r, p, santri] = await Promise.all([
        tamuSvc.daftarKelompokTamu(acara.id),
        tartibDb.rsvp.where('acaraId').equals(acara.id).toArray(),
        perlengkapanSvc.daftarPerlengkapan(acara.id),
        standaloneHost.getJumlahSantri(acara.cabangId),
      ]);
      setKelompok(k);
      setRsvp(r);
      setPerlengkapan(p);
      setKonteks((s) => ({ ...s, santri }));
      setErrorUmum(null);
    } catch (e) {
      setErrorUmum(pesanError(e));
    } finally {
      setMemuat(false);
    }
  }

  function bukaAcara(acara: Acara) {
    setTerpilih(acara);
    setKelompokTerbuka(null);
    void muatDetail(acara);
  }

  function kembaliKeDaftar() {
    setTerpilih(null);
    daftar.muatUlang();
  }

  const divisiMap = new Map<string, Divisi>(divisiList.map((d) => [d.id, d]));
  const rekap = tamuSvc.hitungRekapKelompok(kelompok, rsvp);
  const rekapMap = new Map(rekap.map((r) => [r.kelompok.id, r]));
  const rsvpHadirTotal = tamuSvc.totalRombonganHadir(rekap);

  const porsiRsvp = Math.ceil((rsvpHadirTotal * (100 + konteks.bufferPersen)) / 100);
  const porsi = hitungPorsi({
    rsvpHadir: rsvpHadirTotal,
    jumlahSantri: konteks.santri,
    jumlahPanitia: konteks.panitia,
    cadangan: konteks.cadangan,
    bufferPersen: konteks.bufferPersen,
  });
  const peralatan = hitungPeralatan(porsi, konteks.adaTimPencuci);

  // ===== Aksi kelompok =====

  function bukaDialogKelompokBaru() {
    setFormKelompok({ nama: '', targetUndangan: 0, catatan: '' });
    setErrorDialog(null);
    setDialogKelompok({ mode: 'baru', data: null });
  }

  function bukaDialogKelompokUbah(k: KelompokTamu) {
    setFormKelompok({ nama: k.nama, targetUndangan: k.targetUndangan, catatan: k.catatan });
    setErrorDialog(null);
    setDialogKelompok({ mode: 'ubah', data: k });
  }

  async function simpanKelompok() {
    if (!terpilih) return;
    try {
      if (dialogKelompok?.mode === 'ubah' && dialogKelompok.data) {
        await tamuSvc.ubahKelompok(dialogKelompok.data.id, formKelompok);
      } else {
        await tamuSvc.tambahKelompok(terpilih.id, formKelompok);
      }
      setDialogKelompok(null);
      await muatDetail(terpilih);
    } catch (e) {
      setErrorDialog(pesanError(e));
    }
  }

  async function konfirmasiHapusKelompok() {
    if (!hapusKelompokTarget || !terpilih) return;
    try {
      await tamuSvc.hapusKelompok(hapusKelompokTarget.id);
      setHapusKelompokTarget(null);
      await muatDetail(terpilih);
    } catch (e) {
      setErrorUmum(pesanError(e));
    }
  }

  // ===== Aksi RSVP =====

  function bukaDialogRsvpBaru(kelompokId: string) {
    setFormRsvp({ namaTamu: '', kontak: '', status: 'BELUM', jumlahRombongan: 1, catatan: '' });
    setErrorDialog(null);
    setDialogRsvp({ mode: 'baru', kelompokId, data: null });
  }

  function bukaDialogRsvpUbah(r: Rsvp) {
    setFormRsvp({ namaTamu: r.namaTamu, kontak: r.kontak, status: r.status, jumlahRombongan: r.jumlahRombongan, catatan: r.catatan });
    setErrorDialog(null);
    setDialogRsvp({ mode: 'ubah', kelompokId: r.kelompokId, data: r });
  }

  async function simpanRsvp() {
    if (!terpilih || !dialogRsvp) return;
    try {
      if (dialogRsvp.mode === 'ubah' && dialogRsvp.data) {
        await tamuSvc.ubahRsvp(dialogRsvp.data.id, formRsvp);
      } else {
        await tamuSvc.catatRsvp(terpilih.id, dialogRsvp.kelompokId, formRsvp);
      }
      setDialogRsvp(null);
      await muatDetail(terpilih);
    } catch (e) {
      setErrorDialog(pesanError(e));
    }
  }

  async function konfirmasiHapusRsvp() {
    if (!hapusRsvpTarget || !terpilih) return;
    try {
      await tamuSvc.hapusRsvp(hapusRsvpTarget.id);
      setHapusRsvpTarget(null);
      await muatDetail(terpilih);
    } catch (e) {
      setErrorUmum(pesanError(e));
    }
  }

  // ===== Aksi perlengkapan =====

  async function generateUlangPerlengkapan() {
    if (!terpilih) return;
    setMemuatPerlengkapan(true);
    try {
      await perlengkapanSvc.generatePerlengkapan(terpilih.id, {
        porsi,
        santri: konteks.santri,
        panitia: konteks.panitia,
        rsvp: rsvpHadirTotal,
      });
      setPerlengkapan(await perlengkapanSvc.daftarPerlengkapan(terpilih.id));
      setErrorUmum(null);
    } catch (e) {
      setErrorUmum(pesanError(e));
    } finally {
      setMemuatPerlengkapan(false);
    }
  }

  async function ubahQtyFinal(p: Perlengkapan, qtyFinal: number) {
    try {
      await perlengkapanSvc.ubahPerlengkapan(p.id, { qtyFinal });
      if (terpilih) setPerlengkapan(await perlengkapanSvc.daftarPerlengkapan(terpilih.id));
    } catch (e) {
      setErrorUmum(pesanError(e));
    }
  }

  async function ubahSatuan(p: Perlengkapan, satuan: string) {
    try {
      await perlengkapanSvc.ubahPerlengkapan(p.id, { satuan });
      if (terpilih) setPerlengkapan(await perlengkapanSvc.daftarPerlengkapan(terpilih.id));
    } catch (e) {
      setErrorUmum(pesanError(e));
    }
  }

  async function togglePerlengkapanSelesai(p: Perlengkapan) {
    try {
      await perlengkapanSvc.ubahPerlengkapan(p.id, { status: p.status === 'SELESAI' ? 'BELUM' : 'SELESAI' });
      if (terpilih) setPerlengkapan(await perlengkapanSvc.daftarPerlengkapan(terpilih.id));
    } catch (e) {
      setErrorUmum(pesanError(e));
    }
  }

  // ===== Render: daftar acara =====

  if (!terpilih) {
    return (
      <div>
        <div className="mb-5">
          <h2 className={KELAS.judulHalaman}>Tamu & Porsi</h2>
          <p className="text-sm text-teks-halus">Pilih acara untuk kelola kelompok tamu, RSVP, dan ceklis perlengkapan.</p>
        </div>

        {daftar.memuat && <p className="text-sm text-teks-halus">Memuat…</p>}
        {!daftar.memuat && daftar.items.length === 0 && (
          <div className={KELAS.kosong}>
            <p className="text-sm text-teks-halus">Belum ada acara. Buat acara di tab Acara terlebih dahulu.</p>
          </div>
        )}

        <div className="space-y-3">
          {daftar.items.map((a) => (
            <div key={a.id} className={`flex flex-wrap items-center justify-between gap-2 ${KELAS.kartuIsi}`}>
              <div>
                <span className="font-medium text-teks-utama">{a.nama}</span>
                <p className="mt-1 text-sm text-teks-halus">{formatTanggalIndonesia(a.tanggal)}</p>
              </div>
              <button onClick={() => bukaAcara(a)} className={KELAS.tombolSekunderKecil}>
                Buka
              </button>
            </div>
          ))}
        </div>

        {daftar.totalHalaman > 1 && (
          <div className="mt-5 flex items-center justify-center gap-3 text-sm text-teks-sedang">
            <button onClick={() => daftar.setHalaman(daftar.halaman - 1)} disabled={daftar.halaman <= 1} className={`${klasAksi} disabled:cursor-not-allowed disabled:opacity-40`}>
              ← Sebelumnya
            </button>
            <span>Halaman {daftar.halaman} dari {daftar.totalHalaman}</span>
            <button onClick={() => daftar.setHalaman(daftar.halaman + 1)} disabled={daftar.halaman >= daftar.totalHalaman} className={`${klasAksi} disabled:cursor-not-allowed disabled:opacity-40`}>
              Berikutnya →
            </button>
          </div>
        )}
      </div>
    );
  }

  // ===== Render: detail acara terpilih =====

  return (
    <div>
      <button onClick={kembaliKeDaftar} className="mb-3 text-sm font-medium text-aksen-700 hover:underline">
        ← Kembali ke daftar acara
      </button>
      <div className="mb-5">
        <h2 className={KELAS.judulHalaman}>{terpilih.nama}</h2>
        <p className="mt-1 text-sm text-teks-halus">{formatTanggalIndonesia(terpilih.tanggal)}</p>
      </div>

      {errorUmum && <p className={`mb-4 ${KELAS.error}`}>{errorUmum}</p>}

      {memuat ? (
        <p className="text-sm text-teks-halus">Memuat…</p>
      ) : (
        <div className="space-y-6">
          {/* Kelompok tamu */}
          <div className={KELAS.kartuIsi}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-medium text-teks-utama">Kelompok Tamu</h3>
              <button onClick={bukaDialogKelompokBaru} className={KELAS.tombolUtamaKecil}>
                Tambah Kelompok
              </button>
            </div>

            {kelompok.length === 0 && <p className="text-sm text-teks-redup">Belum ada kelompok tamu.</p>}

            <div className="space-y-2">
              {kelompok.map((k) => {
                const r = rekapMap.get(k.id);
                const terbuka = kelompokTerbuka === k.id;
                const rsvpKelompok = rsvp.filter((x) => x.kelompokId === k.id);
                return (
                  <div key={k.id} className="rounded-lg border border-slate-200">
                    <div className="flex flex-wrap items-center justify-between gap-2 bg-permukaan-halus px-3 py-2">
                      <button onClick={() => setKelompokTerbuka(terbuka ? null : k.id)} className="text-left">
                        <span className="text-sm font-medium text-teks-kuat">{terbuka ? '▾' : '▸'} {k.nama}</span>
                        <p className="text-xs text-teks-halus">
                          diundang {r?.diundang ?? 0} · RSVP {r?.jumlahRsvp ?? 0} · konfirmasi {r?.terkonfirmasi ?? 0} · total orang {r?.totalRombongan ?? 0}
                        </p>
                      </button>
                      <div className="flex gap-2">
                        <button onClick={() => bukaDialogKelompokUbah(k)} className={klasAksi}>Ubah</button>
                        <button onClick={() => setHapusKelompokTarget(k)} className={klasDanger}>Hapus</button>
                      </div>
                    </div>

                    {terbuka && (
                      <div className="space-y-2 p-3">
                        <button onClick={() => bukaDialogRsvpBaru(k.id)} className={klasAksi}>+ Catat RSVP</button>
                        {rsvpKelompok.length === 0 && <p className="text-sm text-teks-redup">Belum ada RSVP.</p>}
                        {rsvpKelompok.map((r) => (
                          <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-kontrol bg-permukaan-halus px-3 py-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-teks-kuat">{r.namaTamu}</span>
                                <span className={badgeStatusRsvp(r.status)}>{r.status}</span>
                                <span className="text-xs text-teks-halus">{r.jumlahRombongan} rombongan</span>
                              </div>
                              {r.kontak && <p className="text-xs text-teks-redup">{r.kontak}</p>}
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => bukaDialogRsvpUbah(r)} className={klasAksi}>Ubah</button>
                              <button onClick={() => setHapusRsvpTarget(r)} className={klasDanger}>Hapus</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Panel porsi */}
          <div className={KELAS.kartuIsi}>
            <h3 className="mb-3 font-medium text-teks-utama">Kalkulator Porsi</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <label className="text-sm">
                <span className="mb-1 block text-teks-sedang">Santri</span>
                <input type="number" min={0} value={konteks.santri} onChange={(e) => setKonteks({ ...konteks, santri: Number(e.target.value) })} className={klasInput} />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-teks-sedang">Panitia</span>
                <input type="number" min={0} value={konteks.panitia} onChange={(e) => setKonteks({ ...konteks, panitia: Number(e.target.value) })} className={klasInput} />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-teks-sedang">Cadangan</span>
                <input type="number" min={0} value={konteks.cadangan} onChange={(e) => setKonteks({ ...konteks, cadangan: Number(e.target.value) })} className={klasInput} />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-teks-sedang">Buffer %</span>
                <input type="number" min={0} value={konteks.bufferPersen} onChange={(e) => setKonteks({ ...konteks, bufferPersen: Number(e.target.value) })} className={klasInput} />
              </label>
            </div>

            <div className="mt-4 rounded-lg bg-permukaan-halus p-3 text-sm text-teks-kuat">
              <p>RSVP hadir {rsvpHadirTotal} × {100 + konteks.bufferPersen}% = {porsiRsvp}</p>
              <p>+ santri {konteks.santri} + panitia {konteks.panitia} + cadangan {konteks.cadangan}</p>
              <p className="mt-1 text-base font-semibold text-teks-utama">= {porsi} porsi</p>
            </div>

            <label className="mt-4 flex items-center gap-2 text-sm text-teks-kuat">
              <input type="checkbox" checked={konteks.adaTimPencuci} onChange={(e) => setKonteks({ ...konteks, adaTimPencuci: e.target.checked })} />
              Ada tim pencuci piring
            </label>
            <p className="mt-1 text-sm text-teks-sedang">
              Peralatan makan: <span className="font-semibold text-teks-utama">{peralatan}</span> ({konteks.adaTimPencuci ? '0,6× porsi' : '1,1× porsi'})
            </p>

            <button onClick={generateUlangPerlengkapan} disabled={memuatPerlengkapan} className={`mt-4 ${KELAS.tombolUtama}`}>
              {memuatPerlengkapan ? 'Menghitung…' : 'Hitung Ulang Perlengkapan'}
            </button>
          </div>

          {/* Ceklis perlengkapan */}
          <div className={KELAS.kartuIsi}>
            <h3 className="mb-3 font-medium text-teks-utama">Ceklis Perlengkapan</h3>
            {perlengkapan.length === 0 && (
              <p className="text-sm text-teks-redup">
                Belum ada perlengkapan. Isi rumus qty pada item template (tab Template), lalu tekan &ldquo;Hitung Ulang Perlengkapan&rdquo; di atas.
              </p>
            )}
            <div className="space-y-2">
              {perlengkapan.map((p) => (
                <div key={p.id} className="flex flex-wrap items-center gap-3 rounded-lg bg-permukaan-halus px-3 py-2">
                  <div className="min-w-32 flex-1">
                    <p className="text-sm font-medium text-teks-kuat">{p.nama}</p>
                    <p className="text-xs text-teks-halus">{divisiMap.get(p.divisiId)?.nama ?? 'Divisi tidak ditemukan'} · hitung otomatis: {p.qtyHitung}</p>
                  </div>
                  <label className="text-sm">
                    <span className="sr-only">Satuan {p.nama}</span>
                    <input value={p.satuan} onChange={(e) => ubahSatuan(p, e.target.value)} placeholder="satuan" className={`w-24 ${KELAS.inputKecil}`} />
                  </label>
                  <label className="text-sm">
                    <span className="sr-only">Qty final {p.nama}</span>
                    <input
                      type="number"
                      min={0}
                      value={p.qtyFinal}
                      onChange={(e) => ubahQtyFinal(p, Number(e.target.value))}
                      className={`w-24 ${KELAS.inputKecil}`}
                    />
                  </label>
                  <button
                    onClick={() => togglePerlengkapanSelesai(p)}
                    className={`rounded-full px-3 py-1 text-xs font-medium ${p.status === 'SELESAI' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-teks-sedang'}`}
                  >
                    {p.status}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Dialog kelompok */}
      {dialogKelompok && (
        <FormDialog
          terbuka
          judul={dialogKelompok.mode === 'ubah' ? 'Ubah Kelompok Tamu' : 'Tambah Kelompok Tamu'}
          onTutup={() => setDialogKelompok(null)}
          onSimpan={simpanKelompok}
          labelSimpan="Simpan"
          error={errorDialog}
        >
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-teks-kuat">Nama kelompok</span>
            <input value={formKelompok.nama} onChange={(e) => setFormKelompok({ ...formKelompok, nama: e.target.value })} placeholder="mis. Wali Santri" className={klasInput} autoFocus />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-teks-kuat">Target undangan</span>
            <input type="number" min={0} value={formKelompok.targetUndangan} onChange={(e) => setFormKelompok({ ...formKelompok, targetUndangan: Number(e.target.value) })} className={klasInput} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-teks-kuat">Catatan (opsional)</span>
            <input value={formKelompok.catatan} onChange={(e) => setFormKelompok({ ...formKelompok, catatan: e.target.value })} className={klasInput} />
          </label>
        </FormDialog>
      )}

      {/* Dialog RSVP */}
      {dialogRsvp && (
        <FormDialog
          terbuka
          judul={dialogRsvp.mode === 'ubah' ? 'Ubah RSVP' : 'Catat RSVP'}
          onTutup={() => setDialogRsvp(null)}
          onSimpan={simpanRsvp}
          labelSimpan="Simpan"
          error={errorDialog}
        >
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-teks-kuat">Nama tamu</span>
            <input value={formRsvp.namaTamu} onChange={(e) => setFormRsvp({ ...formRsvp, namaTamu: e.target.value })} className={klasInput} autoFocus />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-teks-kuat">Kontak (opsional)</span>
            <input value={formRsvp.kontak} onChange={(e) => setFormRsvp({ ...formRsvp, kontak: e.target.value })} className={klasInput} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-teks-kuat">Status</span>
              <select value={formRsvp.status} onChange={(e) => setFormRsvp({ ...formRsvp, status: e.target.value as StatusRsvp })} className={klasInput}>
                <option value="BELUM">BELUM</option>
                <option value="HADIR">HADIR</option>
                <option value="TIDAK_HADIR">TIDAK_HADIR</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-teks-kuat">Jumlah rombongan</span>
              <input type="number" min={1} value={formRsvp.jumlahRombongan} onChange={(e) => setFormRsvp({ ...formRsvp, jumlahRombongan: Number(e.target.value) })} className={klasInput} />
            </label>
          </div>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-teks-kuat">Catatan (opsional)</span>
            <input value={formRsvp.catatan} onChange={(e) => setFormRsvp({ ...formRsvp, catatan: e.target.value })} className={klasInput} />
          </label>
        </FormDialog>
      )}

      <KonfirmasiDialog
        terbuka={!!hapusKelompokTarget}
        judul="Hapus Kelompok Tamu"
        pesan={`Hapus kelompok "${hapusKelompokTarget?.nama}"? Seluruh RSVP di dalamnya ikut terhapus.`}
        onBatal={() => setHapusKelompokTarget(null)}
        onYa={konfirmasiHapusKelompok}
      />
      <KonfirmasiDialog
        terbuka={!!hapusRsvpTarget}
        judul="Hapus RSVP"
        pesan={`Hapus RSVP "${hapusRsvpTarget?.namaTamu}"?`}
        onBatal={() => setHapusRsvpTarget(null)}
        onYa={konfirmasiHapusRsvp}
      />
    </div>
  );
}
