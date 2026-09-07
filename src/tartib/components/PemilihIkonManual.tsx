import { useState, useMemo } from 'react';
import {
  ambilIkonJabatan,
  ambilIkonTugas,
  saranIkonCepat,
  KATALOG_EMOJI_MANUAL,
  ekstrakEmojiKustom,
  pasangEmojiKustom,
} from '../lib/ikonKontekstual';

export interface PemilihIkonManualProps {
  judul: string;
  catatan: string;
  rutin?: string;
  jenis?: 'jabatan' | 'tugas';
  label?: string;
  onUbahCatatan: (catatanBaru: string) => void;
}

export function PemilihIkonManual({
  judul,
  catatan,
  rutin,
  jenis = 'jabatan',
  label = 'Ikon Tampilan',
  onUbahCatatan,
}: PemilihIkonManualProps) {
  const [panelTerbuka, setPanelTerbuka] = useState(false);
  const [tabAktif, setTabAktif] = useState<string>('perabotan');
  const [kataCari, setKataCari] = useState('');
  const [inputBebas, setInputBebas] = useState('');

  // Ikon yang sedang aktif dipakai (bisa manual atau otomatis kontekstual)
  const ikonAktif = useMemo(() => {
    return jenis === 'jabatan'
      ? ambilIkonJabatan(judul, catatan, rutin)
      : ambilIkonTugas(judul, catatan);
  }, [jenis, judul, catatan, rutin]);

  // Apakah saat ini sedang memakai pilihan manual kustom
  const emojiManual = useMemo(() => {
    return ekstrakEmojiKustom(catatan);
  }, [catatan]);

  // Saran cepat kontekstual berdasarkan input teks saat ini
  const saranCepat = useMemo(() => {
    return saranIkonCepat(judul, jenis);
  }, [judul, jenis]);

  function pilihEmoji(emoji: string) {
    const hasil = pasangEmojiKustom(emoji, catatan);
    onUbahCatatan(hasil);
  }

  function resetOtomatis() {
    const hasil = pasangEmojiKustom(null, catatan);
    onUbahCatatan(hasil);
  }

  function terapkanInputBebas() {
    if (!inputBebas.trim()) return;
    const em = inputBebas.trim().split(/\s+/)[0];
    if (em) {
      pilihEmoji(em);
      setInputBebas('');
    }
  }

  // Semua item gabungan dari seluruh kategori untuk fitur pencarian
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

  // Filter pencarian jika ada kata kunci pencarian
  const hasilFilter = useMemo(() => {
    const q = kataCari.trim().toLowerCase();
    if (!q) return null;
    return semuaItem.filter(
      (item) => item.label.toLowerCase().includes(q) || item.kategori.toLowerCase().includes(q) || item.ikon.includes(q),
    );
  }, [kataCari, semuaItem]);

  const kategoriTerpilih = useMemo(() => {
    return KATALOG_EMOJI_MANUAL.find((k) => k.id === tabAktif) ?? KATALOG_EMOJI_MANUAL[0];
  }, [tabAktif]);

  return (
    <div className="space-y-2 rounded-2xl border border-emerald-500/30 bg-emerald-950/10 p-3 shadow-sm">
      {/* Header: Label & Status Mode */}
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
          {label}
        </label>
        {emojiManual ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-900 ring-1 ring-amber-300 dark:bg-amber-950/70 dark:text-amber-200 dark:ring-amber-700/50">
            <span>🎨 Ikon Manual:</span>
            <span className="text-xs">{emojiManual}</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-900 ring-1 ring-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-200 dark:ring-emerald-700/50">
            <span>✨ Otomatis Kontekstual</span>
          </span>
        )}
      </div>

      {/* Baris Pratinjau Ikon Besar & Tombol Aksi */}
      <div className="flex items-center gap-3 rounded-xl border border-emerald-400/40 bg-white/90 p-2.5 shadow-sm dark:bg-neutral-900/90">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-100 to-amber-100 text-3xl shadow-sm ring-1 ring-emerald-300/60 dark:from-emerald-900/60 dark:to-neutral-800 dark:ring-emerald-500/40">
          <span className="select-none" aria-hidden="true">
            {ikonAktif}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
            {emojiManual ? 'Pilihan Manual Terkunci' : 'Ikon Cerdas Sesuai Teks'}
          </p>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
            {emojiManual
              ? 'Ikon ini akan tetap dipakai pada kartu.'
              : `Otomatis mendeteksi kata "${judul || 'judul'}"`}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {emojiManual && (
            <button
              type="button"
              onClick={resetOtomatis}
              title="Kembali ke deteksi otomatis cerdas"
              className="rounded-lg border border-emerald-300/70 bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-800 transition hover:bg-emerald-100 active:scale-95 dark:border-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-200"
            >
              🔄 Otomatis
            </button>
          )}

          <button
            type="button"
            onClick={() => setPanelTerbuka(!panelTerbuka)}
            className="rounded-lg border border-neutral-300 bg-neutral-100 px-2.5 py-1 text-[11px] font-semibold text-neutral-800 shadow-sm transition hover:bg-neutral-200 active:scale-95 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
          >
            {panelTerbuka ? 'Tutup ▲' : 'Katalog Ikon ▼'}
          </button>
        </div>
      </div>

      {/* Saran Cepat 1-Klik */}
      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
        <span className="text-[11px] text-neutral-500 dark:text-neutral-400">Saran Cepat:</span>
        {saranCepat.map((em) => (
          <button
            key={em}
            type="button"
            onClick={() => pilihEmoji(em)}
            className={`flex h-7 w-7 items-center justify-center rounded-lg text-sm transition active:scale-95 ${
              ikonAktif === em
                ? 'border-2 border-emerald-600 bg-emerald-100 shadow-sm ring-1 ring-emerald-500 dark:bg-emerald-900/60'
                : 'border border-neutral-200 bg-white hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800'
            }`}
          >
            {em}
          </button>
        ))}
      </div>

      {/* Panel Katalog Pilihan Manual Lengkap */}
      {panelTerbuka && (
        <div className="mt-2 space-y-2.5 rounded-xl border border-emerald-300/60 bg-white p-3 shadow-md dark:border-neutral-700 dark:bg-neutral-900 animate-in fade-in zoom-in-95 duration-150">
          {/* Kotak Pencarian Ikon Instan */}
          <div className="relative">
            <input
              type="text"
              value={kataCari}
              onChange={(e) => setKataCari(e.target.value)}
              placeholder="🔍 Cari ikon... mis. motor, toren, kursi, piring, kasur, alat"
              className="w-full rounded-lg border border-neutral-300 bg-neutral-50/70 px-3 py-1.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:focus:border-emerald-500"
            />
            {kataCari && (
              <button
                type="button"
                onClick={() => setKataCari('')}
                className="absolute right-2.5 top-1.5 text-xs text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
              >
                ✕
              </button>
            )}
          </div>

          {/* Mode Hasil Pencarian */}
          {hasilFilter !== null ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
                <span>Hasil pencarian: {hasilFilter.length} ikon</span>
                <button
                  type="button"
                  onClick={() => setKataCari('')}
                  className="text-emerald-600 hover:underline dark:text-emerald-400"
                >
                  Lihat Kategori
                </button>
              </div>

              {hasilFilter.length === 0 ? (
                <div className="py-6 text-center text-xs text-neutral-400">
                  Tidak ditemukan ikon yang cocok. Silakan tempel emoji bebas di bawah.
                </div>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 max-h-56 overflow-y-auto p-1">
                  {hasilFilter.map((item) => {
                    const isSelected = ikonAktif === item.ikon;
                    return (
                      <button
                        key={item.ikon + item.label}
                        type="button"
                        onClick={() => pilihEmoji(item.ikon)}
                        title={`${item.label} (${item.kategori})`}
                        className={`flex flex-col items-center justify-center rounded-xl p-1.5 transition active:scale-95 ${
                          isSelected
                            ? 'border-2 border-emerald-600 bg-emerald-100 shadow-sm ring-1 ring-emerald-500 dark:bg-emerald-900/60'
                            : 'border border-neutral-200/80 bg-neutral-50/70 hover:border-emerald-400 hover:bg-emerald-50/50 dark:border-neutral-800 dark:bg-neutral-800/60'
                        }`}
                      >
                        <span className="text-2xl select-none" aria-hidden="true">
                          {item.ikon}
                        </span>
                        <span className="mt-1 line-clamp-1 w-full text-center text-[9px] text-neutral-600 dark:text-neutral-300">
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Mode Navigasi 8 Tab Kategori */
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1 border-b border-neutral-200 pb-2 dark:border-neutral-800">
                {KATALOG_EMOJI_MANUAL.map((kat) => (
                  <button
                    key={kat.id}
                    type="button"
                    onClick={() => setTabAktif(kat.id)}
                    className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold transition ${
                      tabAktif === kat.id
                        ? 'bg-emerald-700 text-white shadow-sm'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300'
                    }`}
                  >
                    <span>{kat.ikon}</span>
                    <span>{kat.nama}</span>
                  </button>
                ))}
              </div>

              {/* Grid Emoji Kategori Aktif */}
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 max-h-52 overflow-y-auto p-1">
                {kategoriTerpilih.daftar.map((item) => {
                  const isSelected = ikonAktif === item.ikon;
                  return (
                    <button
                      key={item.ikon + item.label}
                      type="button"
                      onClick={() => pilihEmoji(item.ikon)}
                      title={item.label}
                      className={`flex flex-col items-center justify-center rounded-xl p-1.5 transition active:scale-95 ${
                        isSelected
                          ? 'border-2 border-emerald-600 bg-emerald-100 shadow-sm ring-1 ring-emerald-500 dark:bg-emerald-900/60'
                          : 'border border-neutral-200/80 bg-neutral-50/70 hover:border-emerald-400 hover:bg-emerald-50/50 dark:border-neutral-800 dark:bg-neutral-800/60'
                      }`}
                    >
                      <span className="text-2xl select-none" aria-hidden="true">
                        {item.ikon}
                      </span>
                      <span className="mt-1 line-clamp-1 w-full text-center text-[9px] text-neutral-600 dark:text-neutral-300">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Input Emoji Bebas */}
          <div className="flex items-center gap-2 border-t border-neutral-200 pt-2 dark:border-neutral-800">
            <span className="text-[11px] text-neutral-500 shrink-0 dark:text-neutral-400">
              Tempel Emoji Apapun:
            </span>
            <input
              type="text"
              value={inputBebas}
              onChange={(e) => setInputBebas(e.target.value)}
              placeholder="mis. 🛢️ atau 🚀"
              className="w-24 rounded-lg border border-neutral-300 bg-white px-2 py-1 text-center text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
            />
            <button
              type="button"
              onClick={terapkanInputBebas}
              className="rounded-lg bg-emerald-700 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-emerald-800 active:scale-95"
            >
              Gunakan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
