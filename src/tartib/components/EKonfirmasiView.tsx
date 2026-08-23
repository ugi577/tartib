'use client';

// Generator e-Konfirmasi Kehadiran (sesi 16, arahan Ahmed): menu dari beranda
// membuka halaman ini — SEMUA isian manual (judul, tanggal, waktu, tempat,
// maps, WhatsApp; arahan Ahmed: "kosongkan yg perlu dikosongkan, dan ganti
// dgn input manual"), kategori acara dipilih manual untuk preset bidang
// khusus (bisa ditambah/diubah/dihapus), lalu hasilnya dipratinjau dan
// diunduh sebagai satu berkas HTML mandiri dengan judul "e-Konfirmasi
// Kehadiran - Ma'had Askar Qur'an" (lihat lib/konfirmasi/eKonfirmasi).

import { useMemo, useState } from 'react';
import { JENIS_ACARA_BAKU } from '../db/seed';
import {
  JUDUL_TITLE,
  KOP_ARAB_BAKU,
  KOP_LATIN_BAKU,
  PRESET_KATEGORI,
  TAG_BAKU,
  susunHtmlKonfirmasi,
  type BidangKonfirmasi,
} from '../lib/konfirmasi/eKonfirmasi';
import { KELAS } from '../ui/kelas';
import { unduhBerkas } from '../lib/unduh';

export function EKonfirmasiView() {
  const [kategori, setKategori] = useState('');
  const [judulAcara, setJudulAcara] = useState('');
  const [tanggal, setTanggal] = useState('');
  const [waktu, setWaktu] = useState('');
  const [tempat, setTempat] = useState('');
  const [mapsUrl, setMapsUrl] = useState('');
  const [noWhatsApp, setNoWhatsApp] = useState('');
  // Kop/header bisa diganti (arahan Ahmed) — bawaan sama seperti semula.
  const [kopArab, setKopArab] = useState(KOP_ARAB_BAKU);
  const [kopLatin, setKopLatin] = useState(KOP_LATIN_BAKU);
  const [tag, setTag] = useState(TAG_BAKU);
  const [bidang, setBidang] = useState<BidangKonfirmasi[]>([]);
  const [pesan, setPesan] = useState<string | null>(null);

  function isiSesuaiKategori() {
    const preset = PRESET_KATEGORI[kategori] ?? [];
    setBidang(preset.map((b) => ({ ...b, opsi: b.opsi ? [...b.opsi] : undefined })));
    setPesan(
      preset.length > 0
        ? `Bidang khusus untuk kategori "${kategori}" sudah diisi (${preset.length} bidang) — bisa diubah atau dihapus.`
        : `Kategori "${kategori || '(belum dipilih)'}" tidak punya preset — tambahkan bidang khusus manual.`,
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
        kopArab,
        kopLatin,
        tag,
      }),
    [judulAcara, tanggal, waktu, tempat, mapsUrl, noWhatsApp, bidang, kopArab, kopLatin, tag],
  );

  async function unduhHtml() {
    const nama = `e-Konfirmasi-${(judulAcara || 'acara').replace(/\s+/g, '-')}.html`;
    const hasil = await unduhBerkas(nama, new Blob([html], { type: 'text/html;charset=utf-8' }));
    if (hasil.dibatalkan) return;
    setPesan(
      hasil.cara === 'share'
        ? 'Berkas e-Konfirmasi dibagikan — bagikan ke wali santri/undangan.'
        : 'Berkas HTML e-Konfirmasi diunduh — bagikan ke wali santri/undangan.',
    );
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

      {pesan && <p className="rounded-lg bg-aksen-50 px-3 py-2 text-sm text-aksen-700">{pesan}</p>}

      {/* Identitas acara — SEMUA manual (arahan Ahmed) */}
      <div className={KELAS.kartuIsi}>
        <h3 className="font-medium text-teks-utama">Acara &amp; kop</h3>
        <p className="mt-1 text-sm text-teks-halus">
          Isi manual — tidak diambil dari data acara yang tersimpan. Kop/header bisa diganti
          (kosongkan untuk memakai teks bawaan).
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-teks-kuat">Kategori acara (untuk bidang khusus)</span>
            <select value={kategori} onChange={(e) => setKategori(e.target.value)} className={KELAS.input}>
              <option value="">— pilih kategori —</option>
              {JENIS_ACARA_BAKU.map((j) => (
                <option key={j.nama} value={j.nama}>
                  {j.nama}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-teks-kuat">Judul acara</span>
            <input
              value={judulAcara}
              onChange={(e) => setJudulAcara(e.target.value)}
              placeholder="mis. Khataman Tasmi' 30 Juz & Maulid Nabi"
              className={KELAS.input}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-teks-kuat">Hari & tanggal</span>
            <input
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              placeholder="mis. Jum'at, 21 Agustus 2026 M / 8 Rabi'ul Awwal 1448 H"
              className={KELAS.input}
            />
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

        {/* Kop/header — bisa diganti (arahan Ahmed) */}
        <h3 className="mt-4 font-medium text-teks-utama">Kop / header</h3>
        <div className="mt-2 grid gap-3 sm:grid-cols-3">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-teks-kuat">Teks Arab</span>
            <input value={kopArab} onChange={(e) => setKopArab(e.target.value)} className={KELAS.input} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-teks-kuat">Teks Latin</span>
            <input value={kopLatin} onChange={(e) => setKopLatin(e.target.value)} className={KELAS.input} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-teks-kuat">Tag di atas judul</span>
            <input value={tag} onChange={(e) => setTag(e.target.value)} className={KELAS.input} />
          </label>
        </div>
      </div>

      {/* Bidang khusus sesuai kategori */}
      <div className={KELAS.kartuIsi}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-medium text-teks-utama">Bidang khusus sesuai kategori acara</h3>
          <button onClick={isiSesuaiKategori} className={KELAS.tombolSekunderKecil}>
            Isi sesuai kategori{kategori ? ` (${kategori})` : ''}
          </button>
        </div>
        <p className="mt-1 text-sm text-teks-halus">
          Bidang di bawah tampil di formulir setelah bidang dasar (nama, domisili, kategori kedatangan,
          WhatsApp, jumlah orang, catatan). Bidang pilihan memakai daftar opsi dipisah koma.
        </p>
        <div className="mt-3 space-y-2">
          {bidang.length === 0 && (
            <p className="text-sm text-teks-redup">
              Belum ada bidang khusus — klik &quot;Isi sesuai kategori&quot; atau tambah manual.
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
