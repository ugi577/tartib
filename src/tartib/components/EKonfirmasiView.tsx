'use client';

// Generator e-Konfirmasi Kehadiran (sesi 16, arahan Ahmed): menu dari beranda
// membuka halaman ini — pilih acara, bidang khusus disesuaikan kategori acara
// (preset per jenis, bisa ditambah/diubah/dihapus), lalu hasilnya dipratinjau
// dan diunduh sebagai satu berkas HTML mandiri dengan judul "e-Konfirmasi
// Kehadiran - Ma'had Askar Qur'an" (lihat lib/konfirmasi/eKonfirmasi).

import { useEffect, useMemo, useState } from 'react';
import { tartibDb } from '../db/schema';
import { formatTanggalIndonesia } from '../lib/tanggal';
import {
  JUDUL_TITLE,
  PRESET_KATEGORI,
  susunHtmlKonfirmasi,
  type BidangKonfirmasi,
} from '../lib/konfirmasi/eKonfirmasi';
import { KELAS } from '../ui/kelas';
import type { Acara, JenisAcara } from '../types';

function pesanError(e: unknown): string {
  return e instanceof Error ? e.message : 'Terjadi kesalahan';
}

export function EKonfirmasiView() {
  const [acaraList, setAcaraList] = useState<Acara[]>([]);
  const [jenisMap, setJenisMap] = useState<Map<string, JenisAcara>>(new Map());
  const [error, setError] = useState<string | null>(null);

  const [pilihAcaraId, setPilihAcaraId] = useState('');
  const [judulAcara, setJudulAcara] = useState('');
  const [tanggal, setTanggal] = useState('');
  const [waktu, setWaktu] = useState('');
  const [tempat, setTempat] = useState('');
  const [mapsUrl, setMapsUrl] = useState('');
  const [noWhatsApp, setNoWhatsApp] = useState('');
  const [bidang, setBidang] = useState<BidangKonfirmasi[]>([]);
  const [pesan, setPesan] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const [acaras, jenis] = await Promise.all([
          tartibDb.acara.toArray(),
          tartibDb.jenisAcara.toArray(),
        ]);
        acaras.sort((a, b) => (a.tanggal < b.tanggal ? 1 : a.tanggal > b.tanggal ? -1 : 0));
        setAcaraList(acaras);
        setJenisMap(new Map(jenis.map((j) => [j.id, j])));
      } catch (e) {
        setError(pesanError(e));
      }
    })();
  }, []);

  const kategoriTerpilih = pilihAcaraId
    ? jenisMap.get(acaraList.find((a) => a.id === pilihAcaraId)?.jenisAcaraId ?? '')?.nama ?? ''
    : '';

  function pilihAcara(id: string) {
    setPilihAcaraId(id);
    const a = acaraList.find((x) => x.id === id);
    if (!a) return;
    setJudulAcara(a.nama);
    setTanggal(formatTanggalIndonesia(a.tanggal));
  }

  function isiSesuaiKategori() {
    const preset = PRESET_KATEGORI[kategoriTerpilih] ?? [];
    setBidang(preset.map((b) => ({ ...b, opsi: b.opsi ? [...b.opsi] : undefined })));
    setPesan(
      preset.length > 0
        ? `Bidang khusus untuk kategori "${kategoriTerpilih}" sudah diisi (${preset.length} bidang) — bisa diubah atau dihapus.`
        : `Kategori "${kategoriTerpilih || '(belum dipilih)'}" tidak punya preset — tambahkan bidang khusus manual.`,
    );
  }

  function ubahBidang(i: number, sebagian: Partial<BidangKonfirmasi>) {
    setBidang((s) => s.map((b, idx) => (idx === i ? { ...b, ...sebagian } : b)));
  }

  const html = useMemo(
    () =>
      susunHtmlKonfirmasi({
        judulAcara: judulAcara || 'Nama Acara',
        tanggal: tanggal || 'Tanggal acara',
        waktu: waktu || undefined,
        tempat: tempat || undefined,
        mapsUrl: mapsUrl || undefined,
        noWhatsApp: noWhatsApp || undefined,
        bidang,
      }),
    [judulAcara, tanggal, waktu, tempat, mapsUrl, noWhatsApp, bidang],
  );

  function unduhHtml() {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `e-Konfirmasi-${(judulAcara || 'acara').replace(/\s+/g, '-')}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setPesan('Berkas HTML e-Konfirmasi diunduh — bagikan ke wali santri/undangan.');
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className={KELAS.judulHalaman}>Buat e-Konfirmasi Kehadiran</h2>
        <p className="mt-1 text-sm text-teks-halus">
          Susun halaman konfirmasi untuk acara Anda — judul{' '}
          <span className="font-medium text-teks-sedang">{JUDUL_TITLE}</span> — lalu unduh sebagai
          berkas HTML yang siap dibagikan. Bidang khusus menyesuaikan kategori acara.
        </p>
      </div>

      {error && <p className={`${KELAS.error}`}>{error}</p>}
      {pesan && <p className="rounded-lg bg-aksen-50 px-3 py-2 text-sm text-aksen-700">{pesan}</p>}

      {/* Pilih acara + identitas */}
      <div className={KELAS.kartuIsi}>
        <h3 className="font-medium text-teks-utama">Acara</h3>
        <label className="mt-2 block text-sm">
          <span className="mb-1 block font-medium text-teks-kuat">Pilih acara</span>
          <select value={pilihAcaraId} onChange={(e) => pilihAcara(e.target.value)} className={KELAS.input}>
            <option value="">— pilih acara —</option>
            {acaraList.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nama} · {formatTanggalIndonesia(a.tanggal)}
              </option>
            ))}
          </select>
        </label>
        {kategoriTerpilih && (
          <p className="mt-1 text-xs text-teks-halus">
            Kategori: <span className="font-medium text-aksen-700">{kategoriTerpilih}</span>
          </p>
        )}
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-teks-kuat">Judul acara</span>
            <input value={judulAcara} onChange={(e) => setJudulAcara(e.target.value)} className={KELAS.input} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-teks-kuat">Hari & tanggal</span>
            <input value={tanggal} onChange={(e) => setTanggal(e.target.value)} className={KELAS.input} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-teks-kuat">Waktu (opsional)</span>
            <input
              value={waktu}
              onChange={(e) => setWaktu(e.target.value)}
              placeholder="mis. 07.00 WIB – selesai"
              className={KELAS.input}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-teks-kuat">Tempat (opsional)</span>
            <input
              value={tempat}
              onChange={(e) => setTempat(e.target.value)}
              placeholder="mis. Aula Ma'had Askar Cansebu"
              className={KELAS.input}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-teks-kuat">Tautan Maps (opsional)</span>
            <input
              value={mapsUrl}
              onChange={(e) => setMapsUrl(e.target.value)}
              placeholder="https://maps.app.goo.gl/…"
              className={KELAS.input}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-teks-kuat">
              No. WhatsApp panitia tujuan (opsional, format internasional tanpa +)
            </span>
            <input
              value={noWhatsApp}
              onChange={(e) => setNoWhatsApp(e.target.value)}
              placeholder="mis. 6285223452257"
              className={KELAS.input}
            />
          </label>
        </div>
      </div>

      {/* Bidang khusus sesuai kategori */}
      <div className={KELAS.kartuIsi}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-medium text-teks-utama">Bidang khusus sesuai kategori acara</h3>
          <button onClick={isiSesuaiKategori} className={KELAS.tombolSekunderKecil}>
            Isi sesuai kategori{kategoriTerpilih ? ` (${kategoriTerpilih})` : ''}
          </button>
        </div>
        <p className="mt-1 text-sm text-teks-halus">
          Bidang di bawah tampil di formulir setelah bidang dasar (nama, domisili, kategori kedatangan,
          WhatsApp, jumlah orang, catatan). Bidang pilihan memakai daftar opsi dipisah koma.
        </p>
        <div className="mt-3 space-y-2">
          {bidang.length === 0 && (
            <p className="text-sm text-teks-redup">
              Belum ada bidang khusus — klik "Isi sesuai kategori" atau tambah manual.
            </p>
          )}
          {bidang.map((b, i) => (
            <div key={i} className="rounded-kontrol bg-permukaan-halus p-2 ring-1 ring-inset ring-white/50">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  value={b.label}
                  onChange={(e) => ubahBidang(i, { label: e.target.value })}
                  placeholder="Label bidang"
                  className={`${KELAS.inputKecil} min-w-40 flex-1`}
                />
                <select
                  value={b.tipe}
                  onChange={(e) => ubahBidang(i, { tipe: e.target.value as 'teks' | 'pilihan' })}
                  className={`${KELAS.inputKecil} w-32`}
                >
                  <option value="teks">Teks</option>
                  <option value="pilihan">Pilihan</option>
                </select>
                {b.tipe === 'teks' ? (
                  <input
                    value={b.placeholder ?? ''}
                    onChange={(e) => ubahBidang(i, { placeholder: e.target.value })}
                    placeholder="Placeholder (contoh)"
                    className={`${KELAS.inputKecil} min-w-40 flex-1`}
                  />
                ) : (
                  <input
                    value={(b.opsi ?? []).join(', ')}
                    onChange={(e) =>
                      ubahBidang(i, { opsi: e.target.value.split(',').map((o) => o.trim()).filter(Boolean) })
                    }
                    placeholder="Opsi dipisah koma"
                    className={`${KELAS.inputKecil} min-w-40 flex-1`}
                  />
                )}
                <button
                  onClick={() => setBidang((s) => s.filter((_, idx) => idx !== i))}
                  className={KELAS.tombolBahayaHalus}
                >
                  Hapus
                </button>
              </div>
            </div>
          ))}
          <button
            onClick={() => setBidang((s) => [...s, { label: '', tipe: 'teks' }])}
            className="text-sm font-medium text-aksen-700 hover:underline"
          >
            + Tambah bidang
          </button>
        </div>
      </div>

      {/* Pratinjau + unduh */}
      <div className={KELAS.kartuIsi}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-medium text-teks-utama">Pratinjau & unduh</h3>
          <div className="flex gap-2">
            <button onClick={unduhHtml} className={KELAS.tombolUtama}>
              Unduh HTML
            </button>
          </div>
        </div>
        <p className="mt-1 text-sm text-teks-halus">
          Pratinjau halaman e-Konfirmasi — persis seperti yang akan dibuka penerima.
        </p>
        <iframe
          title="Pratinjau e-Konfirmasi Kehadiran"
          srcDoc={html}
          className="mt-3 h-[480px] w-full rounded-kontrol border border-garis bg-white"
          sandbox="allow-scripts allow-popups"
        />
      </div>
    </div>
  );
}
