'use client';

// Halaman ?view=acara (Batch C): daftar acara + papan tugas per fase.
// Tanggal nyata tiap fase = tanggal acara digeser offsetHari (lib/tanggal);
// status tugas & acara digeser lewat service; PIC divisi lewat
// acaraDivisiService. Semua mutasi lewat service layer (PRD §3); pesan
// error dari service (mis. PicBelumLengkapError) hanya ditampilkan.

import { useCallback, useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { tartibDb } from '../db/schema';
import { usePagedList } from '../lib/usePagedList';
import { formatOffsetHari, formatTanggalIndonesia, geserTanggal, tanggalHariIni } from '../lib/tanggal';
import { faseBerikutnya, ikhtisarPerDivisi, ikhtisarTugas, statusWaktuFase } from '../lib/ikhtisar';
import { susunLembarTugas } from '../lib/cetak/lembarTugas';
import { susunBukuAcara } from '../lib/cetak/bukuAcara';
import { bukuAcaraKeMarkdown } from '../lib/ekspor/markdown';
import { daftarDivisi } from '../services/divisiService';
import * as acaraSvc from '../services/acaraService';
import * as picSvc from '../services/acaraDivisiService';
import * as ts from '../services/templateService';
import * as tugasSvc from '../services/tugasService';
import { standaloneHost } from '../host/standaloneHost';
import { FormDialog } from './AppDialog';
import type { Acara, AcaraDivisi, Divisi, Fase, JenisAcara, Template, Tugas } from '../types';
import { KELAS, badgeStatusAcara, badgeStatusTugas } from '../ui/kelas';

function pesanError(e: unknown): string {
  return e instanceof Error ? e.message : 'Terjadi kesalahan';
}

function formatWaktu(iso: string): string {
  return new Date(iso).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function AcaraView() {
  const daftar = usePagedList<Acara>(tartibDb.acara, { orderBy: 'dibuatPada', arah: 'desc' });
  const [terpilih, setTerpilih] = useState<Acara | null>(null);

  const [jenisAcara, setJenisAcara] = useState<JenisAcara[]>([]);
  const [divisiList, setDivisiList] = useState<Divisi[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);

  const [fases, setFases] = useState<Fase[]>([]);
  const [tugas, setTugas] = useState<Tugas[]>([]);
  const [acaraDivisi, setAcaraDivisi] = useState<AcaraDivisi[]>([]);
  const [memuatPapan, setMemuatPapan] = useState(false);

  const [errorUmum, setErrorUmum] = useState<string | null>(null);

  // Batch F: target cetak aktif menentukan bagian print yang ada di DOM,
  // sehingga window.print() hanya mencetak dokumen yang diminta. Bawaan
  // laporan eksekusi agar perilaku Batch T tidak berubah.
  const [cetakAktif, setCetakAktif] = useState<'lembarTugas' | 'bukuAcara' | 'ikhtisarEksekusi'>('ikhtisarEksekusi');

  const [dialogBuat, setDialogBuat] = useState(false);
  const [errorDialog, setErrorDialog] = useState<string | null>(null);
  const [formBuat, setFormBuat] = useState({
    templateId: '',
    nama: '',
    tanggal: '',
    jamMulai: '',
    jamSelesai: '',
    lokasi: '',
  });

  // Input PIC per baris acaraDivisi; disinkronkan tiap kali papan dimuat.
  const [formPic, setFormPic] = useState<Record<string, { picNama: string; picKontak: string }>>({});

  useEffect(() => {
    void Promise.all([ts.daftarJenisAcara(), daftarDivisi(), ts.daftarTemplate({ hanyaAktif: true })]).then(
      ([j, d, t]) => {
        setJenisAcara(j);
        setDivisiList(d);
        setTemplates(t);
      },
    );
  }, []);

  const muatPapan = useCallback(async () => {
    if (!terpilih) return;
    setMemuatPapan(true);
    try {
      const [f, t, ad] = await Promise.all([
        acaraSvc.ambilFaseAcara(terpilih.id),
        tugasSvc.daftarTugasAcara(terpilih.id),
        picSvc.daftarAcaraDivisi(terpilih.id),
      ]);
      setFases(f);
      setTugas(t);
      setAcaraDivisi(ad);
      setFormPic(Object.fromEntries(ad.map((r) => [r.id, { picNama: r.picNama, picKontak: r.picKontak }])));
      setErrorUmum(null);
    } catch (e) {
      setErrorUmum(pesanError(e));
    } finally {
      setMemuatPapan(false);
    }
  }, [terpilih]);

  useEffect(() => {
    void muatPapan();
  }, [muatPapan]);

  const jenisMap = new Map<string, JenisAcara>(jenisAcara.map((j) => [j.id, j]));
  const divisiMap = new Map<string, Divisi>(divisiList.map((d) => [d.id, d]));

  // ===== Aksi daftar =====

  function bukaDialogBuat() {
    setFormBuat({
      templateId: templates[0]?.id ?? '',
      nama: '',
      tanggal: tanggalHariIni(),
      jamMulai: '',
      jamSelesai: '',
      lokasi: '',
    });
    setErrorDialog(null);
    setDialogBuat(true);
  }

  async function simpanBuat() {
    if (!formBuat.templateId) {
      setErrorDialog('Belum ada template aktif. Susun template di tab Template terlebih dahulu.');
      return;
    }
    try {
      const a = await acaraSvc.buatDariTemplate({
        templateId: formBuat.templateId,
        nama: formBuat.nama,
        tanggal: formBuat.tanggal,
        jamMulai: formBuat.jamMulai || undefined,
        jamSelesai: formBuat.jamSelesai || undefined,
        lokasi: formBuat.lokasi || undefined,
      });
      setDialogBuat(false);
      daftar.muatUlang();
      setTerpilih(a);
    } catch (e) {
      setErrorDialog(pesanError(e));
    }
  }

  function kembaliKeDaftar() {
    setTerpilih(null);
    daftar.muatUlang();
  }

  // ===== Aksi papan =====

  async function geserStatusTugas(t: Tugas) {
    try {
      await tugasSvc.ubahStatusTugas(t.id, tugasSvc.statusBerikutnya(t.status));
      await muatPapan();
    } catch (e) {
      setErrorUmum(pesanError(e));
    }
  }

  async function lanjutkanStatusAcara() {
    if (!terpilih) return;
    const berikutnya = acaraSvc.statusBerikutnya(terpilih.status);
    if (!berikutnya) return;
    try {
      await acaraSvc.setStatus(terpilih.id, berikutnya);
      setTerpilih(await acaraSvc.ambilAcara(terpilih.id));
    } catch (e) {
      // Mis. PicBelumLengkapError dari A-01 — hanya ditampilkan (C-4).
      setErrorUmum(pesanError(e));
    }
  }

  async function simpanPic(r: AcaraDivisi) {
    const isi = formPic[r.id];
    if (!isi) return;
    try {
      await picSvc.tetapkanPic(r.id, { picNama: isi.picNama, picKontak: isi.picKontak });
      await muatPapan();
    } catch (e) {
      setErrorUmum(pesanError(e));
    }
  }

  async function kosongkanPic(r: AcaraDivisi) {
    try {
      await picSvc.kosongkanPic(r.id);
      await muatPapan();
    } catch (e) {
      setErrorUmum(pesanError(e));
    }
  }

  // ===== Cetak & ekspor (Batch F) =====
  // flushSync memastikan bagian print sudah ter-commit ke DOM sebelum
  // window.print() menangkap halaman (state update React bersifat async).

  function cetakJenis(jenis: 'lembarTugas' | 'bukuAcara' | 'ikhtisarEksekusi') {
    if (!terpilih) return;
    flushSync(() => setCetakAktif(jenis));
    if (jenis === 'lembarTugas') {
      // picNama kosong = cetak semua lembar, satu halaman per PIC.
      void standaloneHost.cetak({ jenis: 'lembarTugas', acaraId: terpilih.id, picNama: '' });
    } else {
      void standaloneHost.cetak({ jenis, acaraId: terpilih.id });
    }
  }

  function eksporMarkdown() {
    if (!terpilih) return;
    const teks = bukuAcaraKeMarkdown(bukuAcara, formatTanggalIndonesia(hariIni));
    const blob = new Blob([teks], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SOP-${terpilih.nama.replace(/\s+/g, '-')}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // ===== Render =====

  const klasAksi = KELAS.tombolSekunderKecil;
  const klasDanger = KELAS.tombolBahaya;

  if (!terpilih) {
    return (
      <div>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className={KELAS.judulHalaman}>Acara</h2>
            <p className="text-sm text-teks-halus">
              {daftar.total} acara — dibuat dari template; perubahan template tidak mengubah acara yang sudah dibuat.
            </p>
          </div>
          <button
            onClick={bukaDialogBuat}
            className={KELAS.tombolUtama}
          >
            Buat Acara
          </button>
        </div>

        {errorUmum && <p className={`mb-4 ${KELAS.error}`}>{errorUmum}</p>}

        {daftar.memuat && <p className="text-sm text-teks-halus">Memuat…</p>}
        {!daftar.memuat && daftar.items.length === 0 && (
          <div className={KELAS.kosong}>
            <p className="text-sm text-teks-halus">Belum ada acara. Buat acara pertama dari tombol di atas.</p>
          </div>
        )}

        <div className="space-y-3">
          {daftar.items.map((a) => {
            const jenis = jenisMap.get(a.jenisAcaraId);
            const jam = [a.jamMulai, a.jamSelesai].filter(Boolean).join('–');
            return (
              <div key={a.id} className={KELAS.kartuIsi}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-teks-utama">{a.nama}</span>
                      <span className={badgeStatusAcara(a.status)}>{a.status}</span>
                      <span className={KELAS.badgeNetral}>v{a.templateVersi}</span>
                    </div>
                    <p className="mt-1 text-sm text-teks-halus">
                      {jenis?.nama ?? 'Jenis tidak ditemukan'} · {formatTanggalIndonesia(a.tanggal)}
                      {jam ? ` · ${jam}` : ''}
                      {a.lokasi ? ` · ${a.lokasi}` : ''}
                    </p>
                  </div>
                  <button onClick={() => setTerpilih(a)} className={KELAS.tombolSekunderKecil}>
                    Buka
                  </button>
                </div>
              </div>
            );
          })}
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

        {/* Dialog buat acara dari template */}
        {dialogBuat && (
          <FormDialog
            terbuka
            judul="Buat Acara dari Template"
            onTutup={() => setDialogBuat(false)}
            onSimpan={simpanBuat}
            labelSimpan="Buat Acara"
            error={errorDialog}
          >
            {templates.length === 0 ? (
              <p className="text-sm text-amber-700">
                Belum ada template aktif. Susun template SOP di tab Template terlebih dahulu.
              </p>
            ) : (
              <>
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-teks-kuat">Template SOP</span>
                  <select
                    value={formBuat.templateId}
                    onChange={(e) => setFormBuat({ ...formBuat, templateId: e.target.value })}
                    className={KELAS.input}
                  >
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nama} (v{t.versi})
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-teks-kuat">Nama acara</span>
                  <input
                    value={formBuat.nama}
                    onChange={(e) => setFormBuat({ ...formBuat, nama: e.target.value })}
                    placeholder="mis. Tasyakuran Khatam 2026"
                    className={KELAS.input}
                    autoFocus
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-teks-kuat">Tanggal (hari-H)</span>
                  <input
                    type="date"
                    value={formBuat.tanggal}
                    onChange={(e) => setFormBuat({ ...formBuat, tanggal: e.target.value })}
                    className={KELAS.input}
                  />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-sm">
                    <span className="mb-1 block font-medium text-teks-kuat">Jam mulai (opsional)</span>
                    <input
                      type="time"
                      value={formBuat.jamMulai}
                      onChange={(e) => setFormBuat({ ...formBuat, jamMulai: e.target.value })}
                      className={KELAS.input}
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block font-medium text-teks-kuat">Jam selesai (opsional)</span>
                    <input
                      type="time"
                      value={formBuat.jamSelesai}
                      onChange={(e) => setFormBuat({ ...formBuat, jamSelesai: e.target.value })}
                      className={KELAS.input}
                    />
                  </label>
                </div>
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-teks-kuat">Lokasi (opsional)</span>
                  <input
                    value={formBuat.lokasi}
                    onChange={(e) => setFormBuat({ ...formBuat, lokasi: e.target.value })}
                    placeholder="mis. Aula Utama"
                    className={KELAS.input}
                  />
                </label>
              </>
            )}
          </FormDialog>
        )}
      </div>
    );
  }

  // ===== Papan acara terpilih =====

  const jenis = jenisMap.get(terpilih.jenisAcaraId);
  const statusBerikut = acaraSvc.statusBerikutnya(terpilih.status);
  const jam = [terpilih.jamMulai, terpilih.jamSelesai].filter(Boolean).join('–');
  // C-6: indikator kesiapan PIC — blokir naik ke SIAP selama ada divisi bertugas tanpa PIC (A-01).
  const jumlahTanpaPic = acaraDivisi.filter((r) => r.picNama.trim() === '').length;
  const picBelumLengkap = terpilih.status === 'DRAF' && jumlahTanpaPic > 0;
  // T-2: lapisan eksekusi real-time (K-13) — progres & posisi waktu fase.
  const hariIni = tanggalHariIni();
  const ikhtisar = ikhtisarTugas(tugas);
  const perDivisi = new Map(ikhtisarPerDivisi(tugas).map((i) => [i.divisiId, i]));
  const fBerikut = faseBerikutnya(fases, terpilih.tanggal, hariIni);
  // Batch F: dokumen cetak & ekspor disusun murni dari data papan yang sudah termuat.
  const bukuAcara = susunBukuAcara({
    acara: terpilih,
    jenisNama: jenis?.nama ?? 'Jenis tidak ditemukan',
    fases,
    divisi: divisiList,
    tugas,
  });
  const lembarTugasList = susunLembarTugas({ acara: terpilih, fases, divisi: divisiList, acaraDivisi, tugas });

  return (
    <div>
      {/* Batch F: lembar tugas per PIC — satu halaman per orang (break-before-page). */}
      {cetakAktif === 'lembarTugas' && (
        <div className="hidden print:block">
          <div className="mb-5 border-b border-slate-300 pb-2">
            <h2 className="text-lg font-bold text-slate-900">Lembar Tugas — {terpilih.nama}</h2>
            <p className="mt-1 text-xs text-teks-sedang">
              {jenis?.nama ?? 'Jenis tidak ditemukan'} · Hari-H {formatTanggalIndonesia(terpilih.tanggal)} · Template
              v{terpilih.templateVersi} · Dicetak {formatTanggalIndonesia(hariIni)}
            </p>
          </div>
          {lembarTugasList.map((l, i) => (
            <div key={l.divisiId} className={i > 0 ? 'break-before-page' : ''}>
              <div className="mb-3 border-b border-slate-300 pb-1">
                <p className="text-base font-bold text-slate-900">{l.divisiNama}</p>
                <p className="text-xs text-teks-sedang">
                  PIC: {l.picNama}
                  {l.picKontak ? ` · ${l.picKontak}` : ''} · {l.tugas.length} tugas
                </p>
              </div>
              {l.tugas.length === 0 ? (
                <p className="text-sm text-teks-halus">Tidak ada tugas untuk divisi ini.</p>
              ) : (
                <ul className="space-y-1.5">
                  {l.tugas.map((t) => (
                    <li key={`${t.faseUrutan}-${t.urutan}`} className="text-sm text-teks-kuat">
                      <span className="font-medium">{t.faseLabel}</span>{' '}
                      <span className="text-teks-redup">({formatOffsetHari(t.offsetHari)})</span> — {t.judul}
                      {t.wajib && <span className="text-amber-700"> (wajib)</span>}
                      <span className="ml-1 text-xs text-teks-halus">[{t.status}]</span>
                      {t.catatan ? <span className="text-teks-halus"> · {t.catatan}</span> : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Batch F: buku acara — SOP lengkap satu acara, A4, per fase lalu per divisi. */}
      {cetakAktif === 'bukuAcara' && (
        <div className="hidden print:block">
          <div className="mb-6 text-center">
            <h2 className="text-xl font-bold text-slate-900">SOP ACARA — {terpilih.nama}</h2>
            <p className="mt-1 text-xs text-teks-sedang">
              {bukuAcara.kop.jenisNama} · Hari-H {formatTanggalIndonesia(bukuAcara.kop.tanggal)}
              {bukuAcara.kop.jam ? ` · ${bukuAcara.kop.jam}` : ''}
              {bukuAcara.kop.lokasi ? ` · ${bukuAcara.kop.lokasi}` : ''}
            </p>
            <p className="text-xs text-teks-sedang">
              Template v{bukuAcara.kop.templateVersi} · Status {bukuAcara.kop.status} · Dicetak{' '}
              {formatTanggalIndonesia(hariIni)}
            </p>
          </div>
          {bukuAcara.bagian.map((bagian) => (
            <section key={bagian.faseUrutan} className="mb-6 break-inside-avoid">
              <h3 className="mb-2 border-b border-slate-300 pb-1 text-base font-bold text-slate-900">
                {bagian.faseUrutan}. {bagian.faseLabel}{' '}
                <span className="text-sm font-normal text-teks-halus">
                  ({formatOffsetHari(bagian.offsetHari)}, {formatTanggalIndonesia(bagian.tanggalFase)})
                </span>
              </h3>
              {bagian.kelompok.length === 0 && <p className="text-sm text-teks-halus">Tidak ada tugas pada fase ini.</p>}
              {bagian.kelompok.map((kel) => (
                <div key={kel.divisiId} className="mb-3 break-inside-avoid">
                  <p className="text-sm font-semibold text-teks-utama">{kel.divisiNama}</p>
                  <ul className="mt-1 space-y-1">
                    {kel.tugas.map((t) => (
                      <li key={t.urutan} className="text-sm text-teks-kuat">
                        {t.urutan}. {t.judul}
                        {t.wajib && <span className="text-amber-700"> (wajib)</span>}
                        <span className="ml-1 text-xs text-teks-halus">[{t.status}]</span>
                        {t.catatan ? <span className="text-teks-halus"> · {t.catatan}</span> : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          ))}
        </div>
      )}

      {/* T-3: kop laporan khusus cetak — hanya muncul di kertas (print), bukan layar. */}
      {cetakAktif === 'ikhtisarEksekusi' && (
        <div className="mb-4 hidden print:block">
          <h2 className="text-lg font-bold text-slate-900">Laporan Eksekusi — {terpilih.nama}</h2>
          <p className="mt-1 text-xs text-teks-sedang">
            {jenis?.nama ?? 'Jenis tidak ditemukan'} · Hari-H {formatTanggalIndonesia(terpilih.tanggal)} · Status{' '}
            {terpilih.status} · Template v{terpilih.templateVersi}
          </p>
          <p className="text-xs text-teks-sedang">
            Progres: {ikhtisar.selesai}/{ikhtisar.total} tugas selesai ({ikhtisar.persenSelesai}%)
            {ikhtisar.batal > 0 ? ` · ${ikhtisar.batal} batal` : ''} · Dicetak {formatTanggalIndonesia(hariIni)}
          </p>
        </div>
      )}

      <div className="mb-5">
        <button
          onClick={kembaliKeDaftar}
          className="mb-3 text-sm font-medium text-aksen-700 hover:underline print:hidden"
        >
          ← Kembali ke daftar acara
        </button>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className={KELAS.judulHalaman}>{terpilih.nama}</h2>
          <span className={badgeStatusAcara(terpilih.status)}>{terpilih.status}</span>
          <span className={KELAS.badgeNetral}>v{terpilih.templateVersi}</span>
        </div>
        <p className="mt-1 text-sm text-teks-halus">
          {jenis?.nama ?? 'Jenis tidak ditemukan'} · {formatTanggalIndonesia(terpilih.tanggal)}
          {jam ? ` · ${jam}` : ''}
          {terpilih.lokasi ? ` · ${terpilih.lokasi}` : ''} · {fases.length} fase · {tugas.length} tugas
        </p>
        {tugas.length > 0 && (
          <div className="mt-3 max-w-xl">
            <div className="flex items-center justify-between text-xs text-teks-halus">
              <span>
                {ikhtisar.selesai} dari {ikhtisar.total} tugas selesai
                {ikhtisar.batal > 0 ? ` · ${ikhtisar.batal} batal` : ''}
                {ikhtisar.jalan > 0 ? ` · ${ikhtisar.jalan} sedang berjalan` : ''}
              </span>
              <span className="font-medium text-teks-kuat">{ikhtisar.persenSelesai}%</span>
            </div>
            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-netral-200">
              <div
                className="h-full rounded-full bg-aksen-500 transition-all"
                style={{ width: `${ikhtisar.persenSelesai}%` }}
              />
            </div>
            {fBerikut && terpilih.status !== 'SELESAI' && terpilih.status !== 'DIEVALUASI' && (
              <p className="mt-2 text-xs text-teks-halus">
                Fase berikutnya:{' '}
                <span className="font-medium text-teks-kuat">{fBerikut.label}</span> ·{' '}
                {formatTanggalIndonesia(geserTanggal(terpilih.tanggal, fBerikut.offsetHari))} ·{' '}
                {formatOffsetHari(fBerikut.offsetHari)}
              </p>
            )}
          </div>
        )}
        {statusBerikut && (
          <div className="mt-3 flex flex-wrap items-center gap-3 print:hidden">
            <button
              onClick={lanjutkanStatusAcara}
              disabled={picBelumLengkap}
              title={picBelumLengkap ? 'Lengkapi PIC semua divisi bertugas terlebih dahulu' : undefined}
              className={KELAS.tombolUtama}
            >
              Lanjutkan ke {statusBerikut}
            </button>
            {picBelumLengkap && (
              <span className="text-sm text-red-600">
                {jumlahTanpaPic} divisi belum ber-PIC — wajib lengkap sebelum acara naik ke SIAP.
              </span>
            )}
          </div>
        )}
        {/* Batch F: cetak via host.cetak (standalone = window.print); ekspor
            Markdown diunduh sebagai berkas .md (window.print tidak bisa
            menghasilkan berkas, jadi tidak lewat host). */}
        {/* Batch U-4: empat tombol ini sebelumnya sebobot dengan aksi utama
            "Lanjutkan ke …". Dikelompokkan dalam panel tenang berlabel agar
            hierarki jelas: satu aksi utama, sisanya keluaran dokumen. */}
        <div className="mt-4 rounded-kontrol border border-garis bg-permukaan-halus p-3 print:hidden">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-teks-halus">Cetak &amp; ekspor</p>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => cetakJenis('ikhtisarEksekusi')} className={KELAS.tombolSekunderKecil}>
              Cetak Laporan Eksekusi
            </button>
            <button onClick={() => cetakJenis('lembarTugas')} className={KELAS.tombolSekunderKecil}>
              Cetak Lembar Tugas (per PIC)
            </button>
            <button onClick={() => cetakJenis('bukuAcara')} className={KELAS.tombolSekunderKecil}>
              Cetak Buku Acara (A4)
            </button>
            <button onClick={eksporMarkdown} className={KELAS.tombolSekunderKecil}>
              Ekspor Markdown
            </button>
          </div>
          <p className="mt-2 text-xs text-teks-halus">
            Lembar tugas: satu halaman per PIC berisi tugas divisinya. Buku acara: SOP lengkap acara ini dalam
            format A4. Ekspor Markdown mengunduh berkas .md yang dapat dibuka ulang di editor teks mana pun.
          </p>
        </div>
      </div>

      {errorUmum && (
        <p className={`mb-4 print:hidden ${KELAS.error}`}>{errorUmum}</p>
      )}

      {memuatPapan ? (
        <p className="text-sm text-teks-halus print:hidden">Memuat…</p>
      ) : (
        <div className="space-y-4">
          {fases.length === 0 && (
            <div className={KELAS.kosong}>
              <p className="text-sm text-teks-halus">
                Template ini tidak punya fase, jadi tidak ada tugas di acara ini.
              </p>
            </div>
          )}

          {fases.map((fase) => {
            const tugasFase = tugas.filter((t) => t.faseId === fase.id);
            const tanggalFase = geserTanggal(terpilih.tanggal, fase.offsetHari);
            const waktu = statusWaktuFase(terpilih.tanggal, fase.offsetHari, hariIni);
            const faseIkhtisar = ikhtisarTugas(tugasFase);
            return (
              <div
                key={fase.id}
                className={`rounded-kartu border bg-permukaan-kartu p-4 shadow-kartu ${
                  waktu === 'HARI_INI' ? 'border-aksen-300 ring-2 ring-aksen-200' : 'border-garis'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-teks-utama">
                      {fase.urutan}. {fase.label}
                    </span>
                    <span className={KELAS.badgeNetral}>
                      {formatOffsetHari(fase.offsetHari)}
                    </span>
                    <span className="text-xs text-teks-halus">{formatTanggalIndonesia(tanggalFase)}</span>
                    {waktu === 'HARI_INI' && (
                      <span className={KELAS.badgeAksenPekat}>
                        Hari ini
                      </span>
                    )}
                    {waktu === 'MENDATANG' && (
                      <span className={KELAS.badgeInfo}>Mendatang</span>
                    )}
                    <span className="text-xs text-teks-redup">
                      {faseIkhtisar.selesai}/{faseIkhtisar.total} selesai
                    </span>
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  {tugasFase.length === 0 && <p className="text-sm text-teks-redup">Tidak ada tugas di fase ini.</p>}
                  {tugasFase.map((t) => {
                    const divisi = divisiMap.get(t.divisiId);
                    return (
                      <div
                        key={t.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-kontrol bg-permukaan-halus px-3 py-2"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium text-teks-kuat">{t.judul}</span>
                            {t.wajib && (
                              <span className={KELAS.badgePeringatan}>wajib</span>
                            )}
                            <span className={badgeStatusTugas(t.status)}>
                              {t.status}
                            </span>
                          </div>
                          <p className="truncate text-xs text-teks-halus">
                            {divisi?.nama ?? 'Divisi tidak ditemukan'}
                            {t.catatan ? ` · ${t.catatan}` : ''}
                            {t.selesaiPada ? ` · selesai ${formatWaktu(t.selesaiPada)}` : ''}
                          </p>
                        </div>
                        <button
                          onClick={() => geserStatusTugas(t)}
                          className={`${klasAksi} print:hidden`}
                          title={`Ubah status ke ${tugasSvc.statusBerikutnya(t.status)}`}
                        >
                          → {tugasSvc.statusBerikutnya(t.status)}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* PIC divisi bertugas */}
          <div className={KELAS.kartuIsi}>
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-teks-utama">PIC Divisi</h3>
              <span className={KELAS.badgeNetral}>
                {acaraDivisi.length} divisi bertugas
              </span>
              {acaraDivisi.length > 0 &&
                (jumlahTanpaPic > 0 ? (
                  <span className={KELAS.badgeBahaya}>
                    {jumlahTanpaPic} belum ber-PIC
                  </span>
                ) : (
                  <span className={KELAS.badgeAksen}>
                    Semua PIC lengkap
                  </span>
                ))}
            </div>
            <p className="mt-1 text-sm text-teks-halus">
              Nama PIC wajib diisi untuk setiap divisi bertugas sebelum acara bisa dinaikkan ke SIAP.
            </p>
            {acaraDivisi.length === 0 && <p className="mt-3 text-sm text-teks-redup">Tidak ada divisi bertugas.</p>}
            <div className="mt-3 space-y-2">
              {acaraDivisi.map((r) => {
                const divisi = divisiMap.get(r.divisiId);
                const isi = formPic[r.id] ?? { picNama: '', picKontak: '' };
                const sudah = isi.picNama.trim() !== '';
                const prog = perDivisi.get(r.divisiId);
                return (
                  <div key={r.id} className="flex flex-wrap items-end gap-2 rounded-lg bg-permukaan-halus px-3 py-2">
                    <div className="w-36">
                      <p className="text-sm font-medium text-teks-kuat">{divisi?.nama ?? 'Divisi tidak ditemukan'}</p>
                      <p className={`text-xs ${sudah ? 'text-aksen-600' : 'text-red-500'}`}>
                        {sudah ? `PIC: ${isi.picNama}` : 'belum ada PIC'}
                        {sudah && isi.picKontak && (
                          <span className="hidden print:inline text-teks-halus"> · {isi.picKontak}</span>
                        )}
                      </p>
                      {prog && prog.total > 0 && (
                        <p className="text-xs text-teks-redup">
                          {prog.selesai}/{prog.total} tugas selesai
                        </p>
                      )}
                    </div>
                    <label className="min-w-36 flex-1 text-sm print:hidden">
                      <span className="sr-only">Nama PIC {divisi?.nama}</span>
                      <input
                        value={isi.picNama}
                        onChange={(e) => setFormPic({ ...formPic, [r.id]: { ...isi, picNama: e.target.value } })}
                        placeholder="Nama PIC"
                        className={KELAS.input}
                      />
                    </label>
                    <label className="min-w-36 flex-1 text-sm print:hidden">
                      <span className="sr-only">Kontak PIC {divisi?.nama}</span>
                      <input
                        value={isi.picKontak}
                        onChange={(e) => setFormPic({ ...formPic, [r.id]: { ...isi, picKontak: e.target.value } })}
                        placeholder="Kontak (opsional)"
                        className={KELAS.input}
                      />
                    </label>
                    <button onClick={() => simpanPic(r)} className={`${klasAksi} print:hidden`}>
                      Simpan
                    </button>
                    {sudah && (
                      <button onClick={() => kosongkanPic(r)} className={`${klasDanger} print:hidden`}>
                        Kosongkan
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
