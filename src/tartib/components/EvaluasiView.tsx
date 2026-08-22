'use client';

// Halaman ?view=evaluasi (Batch E): lembar evaluasi per divisi (berjalan
// baik / kurang / usulan) + promosi usulan menjadi versi template baru
// (A-03). Sejak Batch V juga menjadi pintu masuk IMPOR SOP: dokumen .docx
// (mis. buku panduan SOP) diparse menjadi template baru yang bisa dibaca,
// diduplikasi, dan dimodifikasi di tab Template. Semua mutasi lewat
// service layer; pesan error hanya ditampilkan.

import { useCallback, useEffect, useState } from 'react';
import { tartibDb } from '../db/schema';
import { usePagedList } from '../lib/usePagedList';
import { formatOffsetHari, formatTanggalIndonesia } from '../lib/tanggal';
import { bacaZip } from '../lib/impor/zip';
import { parseXmlLite } from '../lib/impor/xml';
import { dokumenXmlKeSop, type HasilImporDokumen } from '../lib/impor/dokumenSop';
import { daftarDivisi } from '../services/divisiService';
import * as evaluasiSvc from '../services/evaluasiService';
import * as ts from '../services/templateService';
import type { Acara, Divisi, Evaluasi, JenisAcara, Template } from '../types';
import { KELAS } from '../ui/kelas';
import { AppDialog } from './AppDialog';

function pesanError(e: unknown): string {
  return e instanceof Error ? e.message : 'Terjadi kesalahan';
}

const klasInput = KELAS.input;

export function EvaluasiView() {
  const daftar = usePagedList<Acara>(tartibDb.acara, { orderBy: 'dibuatPada', arah: 'desc' });
  const [terpilih, setTerpilih] = useState<Acara | null>(null);

  const [divisiList, setDivisiList] = useState<Divisi[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [evaluasi, setEvaluasi] = useState<Evaluasi[]>([]);

  // Form per divisi: tiga kolom lembar evaluasi (BRIEF §5.6).
  const [form, setForm] = useState<Record<string, { baik: string; kurang: string; usulan: string }>>({});
  const [errorUmum, setErrorUmum] = useState<string | null>(null);
  const [pesanPromosi, setPesanPromosi] = useState<string | null>(null);
  const [templatePromosi, setTemplatePromosi] = useState('');

  // Impor SOP dari dokumen (Batch V).
  const [jenisAcaraList, setJenisAcaraList] = useState<JenisAcara[]>([]);
  const [impor, setImpor] = useState<{ namaFile: string; hasil: HasilImporDokumen } | null>(null);
  const [formImpor, setFormImpor] = useState({ nama: '', jenisAcaraId: '' });
  const [errorImpor, setErrorImpor] = useState<string | null>(null);
  const [menyimpanImpor, setMenyimpanImpor] = useState(false);
  const [pesanImpor, setPesanImpor] = useState<string | null>(null);

  useEffect(() => {
    void Promise.all([daftarDivisi(), ts.daftarTemplate({ hanyaAktif: true }), ts.daftarJenisAcara()]).then(
      ([d, t, j]) => {
        setDivisiList(d);
        setTemplates(t);
        setJenisAcaraList(j);
      },
    );
  }, []);

  const muat = useCallback(async () => {
    if (!terpilih) return;
    try {
      const e = await evaluasiSvc.daftarEvaluasi(terpilih.id);
      setEvaluasi(e);
      setForm(
        Object.fromEntries(
          e.map((r) => [r.divisiId, { baik: r.berjalanBaik, kurang: r.kurang, usulan: r.usulan }]),
        ),
      );
      setErrorUmum(null);
    } catch (e) {
      setErrorUmum(pesanError(e));
    }
  }, [terpilih]);

  useEffect(() => {
    void muat();
  }, [muat]);

  // Default target promosi: template aktif versi tertinggi dengan jenis
  // acara yang sama — silakan diganti lewat dropdown.
  useEffect(() => {
    if (!terpilih || templates.length === 0) return;
    const sejenis = templates.filter((t) => t.jenisAcaraId === terpilih.jenisAcaraId);
    const kandidat = (sejenis.length > 0 ? sejenis : templates).sort((a, b) => b.versi - a.versi);
    setTemplatePromosi((s) => s || kandidat[0]?.id || '');
  }, [terpilih, templates]);

  async function simpan(divisiId: string) {
    if (!terpilih) return;
    const isi = form[divisiId] ?? { baik: '', kurang: '', usulan: '' };
    try {
      await evaluasiSvc.simpanEvaluasi(terpilih.id, {
        divisiId,
        berjalanBaik: isi.baik,
        kurang: isi.kurang,
        usulan: isi.usulan,
      });
      await muat();
    } catch (e) {
      setErrorUmum(pesanError(e));
    }
  }

  async function promosikan(e: Evaluasi) {
    try {
      const baru = await evaluasiSvc.promosikanUsulan(e.id, templatePromosi);
      setPesanPromosi(
        `Usulan dipromosikan → template "${baru.nama}" naik ke versi ${baru.versi}. Acara berikutnya dari template ini memuat item usulan tersebut.`,
      );
      await muat();
      const t = await ts.daftarTemplate({ hanyaAktif: true });
      setTemplates(t);
    } catch (e) {
      setPesanPromosi(null);
      setErrorUmum(pesanError(e));
    }
  }

  // ===== Impor SOP dari dokumen (Batch V) =====

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
      setFormImpor((s) => ({ nama: hasil.judulDokumen || 'SOP hasil impor', jenisAcaraId: s.jenisAcaraId || jenisAcaraList[0]?.id || '' }));
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
      const tanpaDivisi = impor.hasil.fases.some((f) => f.items.some((i) => idDivisiUntukItem(i.divisiTebakan) === null));
      if (tanpaDivisi) throw new Error('Divisi bawaan tidak ditemukan — periksa data divisi aplikasi');

      const baru = await ts.imporTemplate({
        jenisAcaraId: formImpor.jenisAcaraId,
        nama: formImpor.nama,
        catatan: `Diimpor dari "${impor.namaFile}" — ${impor.hasil.judulDokumen}${impor.hasil.subJudul ? ` (${impor.hasil.subJudul})` : ''}`,
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
        `Template "${baru.nama}" dibuat: ${impor.hasil.fases.length} fase · ${totalItem} item (${denganTebakan} divisi ditebak dari kata kunci, ${fallback} memakai Ketua Panitia). Buka tab Template untuk melihat, menduplikasi, atau mengubahnya.`,
      );
    } catch (e) {
      setErrorImpor(pesanError(e));
    } finally {
      setMenyimpanImpor(false);
    }
  }

  const klasAksi = KELAS.tombolSekunderKecil;

  if (!terpilih) {
    return (
      <div>
        <div className="mb-5">
          <h2 className={KELAS.judulHalaman}>Evaluasi</h2>
          <p className="text-sm text-teks-halus">
            {daftar.total} acara — pilih acara untuk mengisi lembar evaluasi per divisi dan mempromosikan usulan.
          </p>
        </div>
        {daftar.memuat && <p className="text-sm text-teks-halus">Memuat…</p>}
        {!daftar.memuat && daftar.items.length === 0 && (
          <div className={KELAS.kosong}>
            <p className="text-sm text-teks-halus">Belum ada acara untuk dievaluasi. Buat acara dulu di tab Acara.</p>
          </div>
        )}
        <div className="space-y-3">
          {daftar.items.map((a) => (
            <div key={a.id} className={KELAS.kartuIsi}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-medium text-teks-utama">{a.nama}</span>
                  <p className="mt-1 text-sm text-teks-halus">
                    {formatTanggalIndonesia(a.tanggal)} · status {a.status}
                  </p>
                </div>
                <button
                  onClick={() => setTerpilih(a)}
                  className={KELAS.tombolSekunderKecil}
                >
                  Buka
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Impor SOP dari dokumen (Batch V) */}
        <div className={`mt-6 ${KELAS.kartuIsi}`}>
          <h3 className="font-medium text-teks-utama">Impor SOP dari Dokumen (.docx)</h3>
          <p className="mt-1 text-sm text-teks-halus">
            Pilih berkas dokumen Word (mis. buku panduan SOP). Fase berpola H-30 / Hari-H / H+1 dan item
            ceklisnya menjadi template baru yang bisa dibaca, diduplikasi, dan diubah di tab Template.
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

        {/* Dialog pratinjau impor (Batch V) */}
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
              {impor.hasil.itemTanpaFase > 0 &&
                ` ${impor.hasil.itemTanpaFase} item di luar linimasa (mis. ceklis perlengkapan) tidak diimpor.`}
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
            <p className="mt-3 text-sm text-teks-halus">
              Divisi tiap item adalah perkiraan dari kata kunci; item tanpa kecocokan memakai Ketua
              Panitia. Periksa dan ubah di editor template setelah impor.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-teks-kuat">Nama template</span>
                <input
                  value={formImpor.nama}
                  onChange={(e) => setFormImpor({ ...formImpor, nama: e.target.value })}
                  className={klasInput}
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-teks-kuat">Jenis acara</span>
                <select
                  value={formImpor.jenisAcaraId}
                  onChange={(e) => setFormImpor({ ...formImpor, jenisAcaraId: e.target.value })}
                  className={klasInput}
                >
                  {jenisAcaraList.map((j) => (
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
      </div>
    );
  }

  const evaluasiMap = new Map(evaluasi.map((e) => [e.divisiId, e]));
  const usulanTersedia = evaluasi.filter((e) => e.usulan.trim() !== '');

  return (
    <div>
      <button
        onClick={() => {
          setTerpilih(null);
          setPesanPromosi(null);
          daftar.muatUlang();
        }}
        className="mb-3 text-sm font-medium text-aksen-700 hover:underline"
      >
        ← Kembali ke daftar acara
      </button>
      <div className="mb-5">
        <h2 className={KELAS.judulHalaman}>Evaluasi — {terpilih.nama}</h2>
        <p className="mt-1 text-sm text-teks-halus">
          {formatTanggalIndonesia(terpilih.tanggal)} · isi per divisi: satu yang berjalan baik, satu yang kurang,
          satu usulan perbaikan.
        </p>
      </div>

      {errorUmum && <p className={`mb-4 ${KELAS.error}`}>{errorUmum}</p>}
      {pesanPromosi && (
        <p className="mb-4 rounded-lg bg-aksen-50 px-3 py-2 text-sm text-aksen-700">{pesanPromosi}</p>
      )}

      <div className="space-y-3">
        {divisiList.map((d) => {
          const isi = form[d.id] ?? { baik: '', kurang: '', usulan: '' };
          const tersimpan = evaluasiMap.get(d.id);
          return (
            <div key={d.id} className={KELAS.kartuIsi}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium text-teks-utama">{d.nama}</span>
                {tersimpan && (
                  <span className={KELAS.badgeAksen}>
                    tersimpan
                    {tersimpan.sudahDipromosikan ? ' · usulan sudah dipromosikan' : ''}
                  </span>
                )}
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <label className="text-sm">
                  <span className="mb-1 block font-medium text-teks-kuat">Berjalan baik</span>
                  <textarea
                    rows={2}
                    aria-label={`Berjalan baik ${d.nama}`}
                    value={isi.baik}
                    onChange={(e) => setForm({ ...form, [d.id]: { ...isi, baik: e.target.value } })}
                    className={klasInput}
                  />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block font-medium text-teks-kuat">Kurang</span>
                  <textarea
                    rows={2}
                    aria-label={`Kurang ${d.nama}`}
                    value={isi.kurang}
                    onChange={(e) => setForm({ ...form, [d.id]: { ...isi, kurang: e.target.value } })}
                    className={klasInput}
                  />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block font-medium text-teks-kuat">Usulan perbaikan</span>
                  <textarea
                    rows={2}
                    aria-label={`Usulan perbaikan ${d.nama}`}
                    value={isi.usulan}
                    onChange={(e) => setForm({ ...form, [d.id]: { ...isi, usulan: e.target.value } })}
                    className={klasInput}
                  />
                </label>
              </div>
              <button onClick={() => simpan(d.id)} className={`${klasAksi} mt-3`}>
                Simpan {d.nama}
              </button>
            </div>
          );
        })}
      </div>

      {/* Promosi usulan (A-03) */}
      <div className={`mt-6 ${KELAS.kartuIsi}`}>
        <h3 className="font-medium text-teks-utama">Promosikan Usulan ke Template</h3>
        <p className="mt-1 text-sm text-teks-halus">
          Promosi membuat <strong>versi template baru</strong> berisi seluruh SOP lama + item usulan di fase
          terakhir. Versi lama tetap terbaca; satu usulan hanya bisa dipromosikan sekali.
        </p>
        {templates.length === 0 && (
          <p className="mt-3 text-sm text-amber-700">Tidak ada template aktif — tidak ada target promosi.</p>
        )}
        {usulanTersedia.length === 0 && (
          <p className="mt-3 text-sm text-teks-redup">Belum ada evaluasi berisi usulan.</p>
        )}
        {templates.length > 0 && usulanTersedia.length > 0 && (
          <>
            <label className="mt-3 block text-sm">
              <span className="mb-1 block font-medium text-teks-kuat">Template target</span>
              <select
                value={templatePromosi}
                onChange={(e) => setTemplatePromosi(e.target.value)}
                className={KELAS.input}
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nama} (v{t.versi})
                  </option>
                ))}
              </select>
            </label>
            <div className="mt-3 space-y-2">
              {usulanTersedia.map((e) => {
                const divisi = divisiList.find((d) => d.id === e.divisiId);
                return (
                  <div
                    key={e.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-kontrol bg-permukaan-halus px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-teks-kuat">{e.usulan}</p>
                      <p className="text-xs text-teks-halus">
                        {divisi?.nama ?? 'Divisi tidak ditemukan'}
                        {e.kurang ? ` · catatan kurang: ${e.kurang}` : ''}
                      </p>
                    </div>
                    {e.sudahDipromosikan ? (
                      <span className={KELAS.badgeUngu}>
                        sudah dipromosikan
                      </span>
                    ) : (
                      <button
                        onClick={() => promosikan(e)}
                        className={KELAS.tombolUtamaKecil}
                      >
                        Promosikan
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
