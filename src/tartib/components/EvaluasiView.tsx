'use client';

// Halaman ?view=evaluasi (Batch E): lembar evaluasi per divisi (berjalan
// baik / kurang / usulan) + promosi usulan menjadi versi template baru
// (A-03). Semua mutasi lewat evaluasiService; pesan error hanya ditampilkan.

import { useCallback, useEffect, useState } from 'react';
import { tartibDb } from '../db/schema';
import { usePagedList } from '../lib/usePagedList';
import { formatTanggalIndonesia } from '../lib/tanggal';
import { daftarDivisi } from '../services/divisiService';
import * as evaluasiSvc from '../services/evaluasiService';
import * as ts from '../services/templateService';
import type { Acara, Divisi, Evaluasi, Template } from '../types';
import { KELAS } from '../ui/kelas';

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

  useEffect(() => {
    void Promise.all([daftarDivisi(), ts.daftarTemplate({ hanyaAktif: true })]).then(([d, t]) => {
      setDivisiList(d);
      setTemplates(t);
    });
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
        className="mb-3 text-sm font-medium text-emerald-700 hover:underline"
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
        <p className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{pesanPromosi}</p>
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
      <div className="mt-6 ${KELAS.kartuIsi}">
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
