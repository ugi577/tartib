'use client';

// Pemilih ikon (emoji) untuk item SOP — di dalam FormDialog. Pratinjau ikon
// aktif (otomatis kontekstual atau manual), saran cepat, katalog berkategori
// dengan pencarian, dan input emoji bebas.
//
// Sesi 22: semua varian `dark:` dihapus (Tailwind tanpa `darkMode` = mode
// media → panel jadi hitam di HP bermode gelap padahal aplikasi wajib terang)
// dan warna mentah neutral/emerald diganti token `KELAS`. Tata letak HP:
// baris pratinjau `flex-wrap` (tombol aksi turun ke baris kedua), tombol
// saran 36px, tab 36px, tombol grid ≥ 44px, label ikon 10px.

import { useId, useMemo, useState, type KeyboardEvent } from 'react';
import {
  ambilIkonJabatan,
  ambilIkonTugas,
  saranIkonCepat,
  KATALOG_EMOJI_MANUAL,
  ekstrakEmojiKustom,
  pasangEmojiKustom,
} from '../lib/ikonKontekstual';
import { KELAS } from '../ui/kelas';

export interface PemilihIkonManualProps {
  judul: string;
  catatan: string;
  rutin?: string;
  jenis?: 'jabatan' | 'tugas';
  label?: string;
  onUbahCatatan: (catatanBaru: string) => void;
}

const KELAS_TERPILIH = 'bg-aksen-100/70 ring-aksen-500';
const KELAS_BELUM = 'bg-permukaan-kartu ring-white/80 hover:bg-white/75 hover:ring-aksen-300';

/** Tombol emoji di grid katalog / hasil pencarian. */
function TombolEmoji({
  ikon,
  label,
  keterangan,
  terpilih,
  onPilih,
}: {
  ikon: string;
  label: string;
  keterangan?: string;
  terpilih: boolean;
  onPilih: (ikon: string) => void;
}) {
  const judulTombol = keterangan ? `${label} (${keterangan})` : label;
  return (
    <button
      type="button"
      onClick={() => onPilih(ikon)}
      title={judulTombol}
      aria-pressed={terpilih}
      className={`flex min-h-[44px] flex-col items-center justify-center rounded-kontrol p-1.5 ring-1 ring-inset transition-colors ${
        terpilih ? KELAS_TERPILIH : KELAS_BELUM
      }`}
    >
      <span className="select-none text-2xl leading-none" aria-hidden="true">
        {ikon}
      </span>
      <span className="mt-1 line-clamp-1 w-full text-center text-[10px] text-teks-sedang" title={judulTombol}>
        {label}
      </span>
    </button>
  );
}

export function PemilihIkonManual({
  judul,
  catatan,
  rutin,
  jenis = 'jabatan',
  label = 'Ikon Tampilan',
  onUbahCatatan,
}: PemilihIkonManualProps) {
  const idLabel = useId();
  const [panelTerbuka, setPanelTerbuka] = useState(false);
  const [tabAktif, setTabAktif] = useState<string>('perabotan');
  const [kataCari, setKataCari] = useState('');
  const [inputBebas, setInputBebas] = useState('');

  // Ikon yang sedang aktif dipakai (manual kustom atau otomatis kontekstual)
  const ikonAktif = useMemo(() => {
    return jenis === 'jabatan'
      ? ambilIkonJabatan(judul, catatan, rutin)
      : ambilIkonTugas(judul, catatan);
  }, [jenis, judul, catatan, rutin]);

  // Emoji pilihan manual yang tersimpan di catatan (null = otomatis)
  const emojiManual = useMemo(() => ekstrakEmojiKustom(catatan), [catatan]);

  // Saran cepat kontekstual berdasarkan teks judul saat ini
  const saranCepat = useMemo(() => saranIkonCepat(judul, jenis), [judul, jenis]);

  function pilihEmoji(emoji: string) {
    onUbahCatatan(pasangEmojiKustom(emoji, catatan));
  }

  function resetOtomatis() {
    onUbahCatatan(pasangEmojiKustom(null, catatan));
  }

  function terapkanInputBebas() {
    if (!inputBebas.trim()) return;
    const em = inputBebas.trim().split(/\s+/)[0];
    if (em) {
      pilihEmoji(em);
      setInputBebas('');
    }
  }

  // Enter di dalam input komponen ini tidak boleh men-submit FormDialog induk.
  function cegahSubmit(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') e.preventDefault();
  }

  // Semua item gabungan dari seluruh kategori untuk pencarian
  const semuaItem = useMemo(() => {
    const peta = new Map<string, { ikon: string; label: string; kategori: string }>();
    for (const kat of KATALOG_EMOJI_MANUAL) {
      for (const item of kat.daftar) {
        if (!peta.has(item.ikon)) {
          peta.set(item.ikon, { ...item, kategori: kat.nama });
        }
      }
    }
    return Array.from(peta.values());
  }, []);

  // Hasil pencarian (null = tidak sedang mencari → tampilkan tab kategori)
  const hasilFilter = useMemo(() => {
    const q = kataCari.trim().toLowerCase();
    if (!q) return null;
    return semuaItem.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.kategori.toLowerCase().includes(q) ||
        item.ikon.includes(q),
    );
  }, [kataCari, semuaItem]);

  const kategoriTerpilih = useMemo(() => {
    return KATALOG_EMOJI_MANUAL.find((k) => k.id === tabAktif) ?? KATALOG_EMOJI_MANUAL[0];
  }, [tabAktif]);

  return (
    <div role="group" aria-labelledby={idLabel} className={`${KELAS.blok} space-y-2 py-3`}>
      {/* Kepala: label & status mode */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span id={idLabel} className="text-[11px] font-semibold uppercase tracking-wider text-teks-halus">
          {label}
        </span>
        {emojiManual ? (
          <span className={`${KELAS.badgePeringatan} gap-1`}>
            <span>Ikon manual</span>
            <span aria-hidden="true">{emojiManual}</span>
          </span>
        ) : (
          <span className={KELAS.badgeAksen}>Otomatis kontekstual</span>
        )}
      </div>

      {/* Baris pratinjau: ikon + teks di baris 1, tombol aksi turun ke baris 2 di HP */}
      <div className="flex flex-wrap items-center gap-3 rounded-kontrol border border-white/80 bg-permukaan-kartu p-2.5 shadow-glosAtas">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-kontrol bg-aksen-100/70 text-3xl ring-1 ring-inset ring-emas-300/60">
          <span className="select-none" aria-hidden="true">
            {ikonAktif}
          </span>
        </div>

        <div className="min-w-0 flex-1 basis-40">
          <p className="text-sm font-semibold text-teks-utama">
            {emojiManual ? 'Pilihan manual terkunci' : 'Ikon cerdas sesuai teks'}
          </p>
          <p className="line-clamp-2 text-xs text-teks-halus">
            {emojiManual
              ? 'Ikon ini akan tetap dipakai pada kartu.'
              : `Otomatis mendeteksi kata "${judul || 'judul'}"`}
          </p>
        </div>

        <div className="flex basis-full items-center justify-end gap-1.5 sm:basis-auto">
          {emojiManual && (
            <button
              type="button"
              onClick={resetOtomatis}
              title="Kembali ke deteksi otomatis"
              className={`${KELAS.tombolHalus} min-h-[40px]`}
            >
              🔄 Otomatis
            </button>
          )}

          <button
            type="button"
            onClick={() => setPanelTerbuka(!panelTerbuka)}
            aria-expanded={panelTerbuka}
            className={`${KELAS.tombolSekunderKecil} min-h-[40px]`}
          >
            {panelTerbuka ? 'Tutup ▲' : 'Katalog Ikon ▼'}
          </button>
        </div>
      </div>

      {/* Saran cepat 1-ketuk */}
      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
        <span className="text-xs text-teks-halus">Saran cepat:</span>
        {saranCepat.map((em) => (
          <button
            key={em}
            type="button"
            onClick={() => pilihEmoji(em)}
            aria-pressed={ikonAktif === em}
            aria-label={`Pakai ikon ${em}`}
            className={`flex h-9 w-9 items-center justify-center rounded-kontrol text-base ring-1 ring-inset transition-colors ${
              ikonAktif === em ? KELAS_TERPILIH : KELAS_BELUM
            }`}
          >
            {em}
          </button>
        ))}
      </div>

      {/* Panel katalog lengkap */}
      {panelTerbuka && (
        <div className={`${KELAS.kartu} mt-2 space-y-2.5 p-3`}>
          {/* Kotak pencarian */}
          <div className="relative">
            <input
              type="text"
              value={kataCari}
              onChange={(e) => setKataCari(e.target.value)}
              onKeyDown={cegahSubmit}
              placeholder="Cari ikon…"
              aria-label="Cari ikon"
              className={`${KELAS.input} pr-11`}
            />
            {kataCari && (
              <button
                type="button"
                onClick={() => setKataCari('')}
                aria-label="Hapus kata pencarian"
                className={`${KELAS.tombolIkon} absolute inset-y-0 right-1 my-auto min-h-[40px] min-w-[40px]`}
              >
                ✕
              </button>
            )}
          </div>

          {hasilFilter !== null ? (
            /* Mode hasil pencarian */
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-teks-halus">Hasil pencarian: {hasilFilter.length} ikon</span>
                <button
                  type="button"
                  onClick={() => setKataCari('')}
                  className={`${KELAS.tombolHalus} min-h-[36px]`}
                >
                  Lihat kategori
                </button>
              </div>

              {hasilFilter.length === 0 ? (
                <p className="py-6 text-center text-xs text-teks-halus">
                  Tidak ada ikon yang cocok. Tempel emoji bebas di bawah.
                </p>
              ) : (
                <div className="grid max-h-56 grid-cols-4 gap-1.5 overflow-y-auto p-1 sm:grid-cols-5">
                  {hasilFilter.map((item) => (
                    <TombolEmoji
                      key={item.ikon + item.label}
                      ikon={item.ikon}
                      label={item.label}
                      keterangan={item.kategori}
                      terpilih={ikonAktif === item.ikon}
                      onPilih={pilihEmoji}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Mode tab kategori */
            <div className="space-y-2">
              <div role="tablist" aria-label="Kategori ikon" className={`${KELAS.subNav} border-b border-garis pb-2`}>
                {KATALOG_EMOJI_MANUAL.map((kat) => {
                  const aktif = tabAktif === kat.id;
                  return (
                    <button
                      key={kat.id}
                      type="button"
                      role="tab"
                      aria-selected={aktif}
                      onClick={() => setTabAktif(kat.id)}
                      className={`${aktif ? KELAS.subNavPilAktif : KELAS.subNavPil} inline-flex min-h-[36px] items-center gap-1`}
                    >
                      <span aria-hidden="true">{kat.ikon}</span>
                      <span>{kat.nama}</span>
                    </button>
                  );
                })}
              </div>

              <div className="grid max-h-52 grid-cols-4 gap-1.5 overflow-y-auto p-1 sm:grid-cols-5">
                {kategoriTerpilih.daftar.map((item) => (
                  <TombolEmoji
                    key={item.ikon + item.label}
                    ikon={item.ikon}
                    label={item.label}
                    terpilih={ikonAktif === item.ikon}
                    onPilih={pilihEmoji}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Input emoji bebas */}
          <div className="flex flex-wrap items-center gap-2 border-t border-garis pt-2">
            <span className="text-xs text-teks-halus">Tempel emoji apa pun:</span>
            <input
              type="text"
              value={inputBebas}
              onChange={(e) => setInputBebas(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  terapkanInputBebas();
                }
              }}
              placeholder="mis. 🛢️ atau 🚀"
              aria-label="Emoji bebas"
              className={`${KELAS.inputKecil} w-28 text-center`}
            />
            <button
              type="button"
              onClick={terapkanInputBebas}
              disabled={!inputBebas.trim()}
              className={`${KELAS.tombolSekunderKecil} min-h-[40px]`}
            >
              Gunakan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
