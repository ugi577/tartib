'use client';

// Preset — katalog template siap pakai: Struktur PIC, SOP acara, jadwal KBM.
//
// Sesi 22 (audit halaman Preset):
// - Kepala halaman lewat HeaderView + SubNav. Dulu: h2 text-xl + keterangan
//   3 baris yang mengulang label tab + kotak segmented 4 tombol inline-flex
//   (≈379px) → 157px sebelum konten dan overflow mendatar di HP 375px.
// - Tanpa alert(): error tampil inline (KELAS.error).
// - Preset STRUKTUR mengganti seluruh papan baku (jabatan, tugas, ceklis) —
//   kini dikonfirmasi dulu dengan angka nyata dari sopService. Preset KBM
//   menimpa jadwal aktif — dikonfirmasi bila jadwal aktif sudah diubah atau
//   berbeda dari preset yang dipilih.
// - Preset SOP benar-benar menjadi Template (terapkanPresetSop), bukan lagi
//   notifikasi kosong yang lalu melempar ke Acara.
// - Pesan sukses inline dengan tombol "Buka …": navigasi menunggu klik
//   pengguna, bukan setTimeout 600 ms yang tak sempat dibaca.
// - Data hanya lewat service / lib/presets; katalog KBM dibaca sekali saat
//   mount, bukan setiap render.

import { useState } from 'react';
import {
  DAFTAR_PRESET_SOP,
  DAFTAR_PRESET_STRUKTUR,
  bacaJadwalKbmLokal,
  bacaSemuaKatalogKbm,
  simpanJadwalKbmLokal,
  terapkanPresetStruktur,
  type PresetSop,
  type PresetStruktur,
} from '../lib/presets';
import { terapkanPresetSop } from '../lib/presets/terapkanPresetSop';
import * as sopSvc from '../services/sopService';
import type { ModelJadwalKbm } from '../types/kbm';
import { KELAS } from '../ui/kelas';
import { KonfirmasiDialog } from './AppDialog';
import { HeaderView, SubNav } from './HeaderView';

type KategoriTab = 'semua' | 'struktur' | 'sop' | 'kbm';
/** Dokumen yang dibuka di Kanvas setelah preset diterapkan (kontrak page.tsx). */
type DokumenKanvas = 'struktur' | 'kbm' | 'tiket';

const TAB: ReadonlyArray<{ id: KategoriTab; label: string }> = [
  { id: 'semua', label: 'Semua' },
  { id: 'struktur', label: 'Struktur' },
  { id: 'sop', label: 'SOP Acara' },
  { id: 'kbm', label: 'Jadwal KBM' },
];

const ID_PRESET_KBM_UNGGULAN = 'kbm-pesantren-2026-2027';

const KELAS_SUKSES =
  'rounded-kontrol bg-aksen-100/70 px-3 py-2 text-sm text-aksen-700 ring-1 ring-inset ring-aksen-200/70';

interface PresetLibraryViewProps {
  /** Dipanggil saat pengguna menekan "Buka …" pada pesan sukses — tidak otomatis. */
  onPilihPresetSelesai?: (view: string, dok?: DokumenKanvas) => void;
}

interface PesanSukses {
  teks: string;
  labelBuka: string;
  view: string;
  dok?: DokumenKanvas;
}

type Konfirmasi =
  | { jenis: 'struktur'; preset: PresetStruktur; pesan: string }
  | { jenis: 'kbm'; preset: ModelJadwalKbm; pesan: string };

function pesanError(e: unknown): string {
  return e instanceof Error ? e.message : 'Terjadi kesalahan';
}

function jumlahSubTugas(p: PresetStruktur): number {
  return p.items.reduce((n, it) => n + (it.sub?.length ?? 0), 0);
}

function jumlahFaseSop(p: PresetSop): number {
  return new Set(p.items.map((it) => it.fase.trim())).size;
}

interface PropsKartuPreset {
  ikon: string;
  badge: string;
  kelasBadge: string;
  judul: string;
  deskripsi: string;
  meta: string;
  labelTombol: string;
  memuat: boolean;
  nonaktif: boolean;
  onGunakan: () => void;
}

function KartuPreset({ ikon, badge, kelasBadge, judul, deskripsi, meta, labelTombol, memuat, nonaktif, onGunakan }: PropsKartuPreset) {
  return (
    <div className={`${KELAS.kartuIsi} flex flex-col justify-between`}>
      <div className="min-w-0">
        <div className="flex items-start justify-between gap-2">
          <span
            aria-hidden="true"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-kontrol bg-white/70 text-lg ring-1 ring-inset ring-white/80"
          >
            {ikon}
          </span>
          <span className={kelasBadge}>{badge}</span>
        </div>
        <h3 className={`mt-3 ${KELAS.judulKartu}`}>{judul}</h3>
        <p className={`mt-1 leading-relaxed ${KELAS.keteranganKecil}`}>{deskripsi}</p>
        <p className={`mt-2 ${KELAS.keteranganKecil}`}>{meta}</p>
      </div>
      <button type="button" disabled={nonaktif} onClick={onGunakan} className={`${KELAS.tombolUtamaKecil} mt-4 w-full`}>
        {memuat ? 'Menerapkan…' : labelTombol}
      </button>
    </div>
  );
}

export function PresetLibraryView({ onPilihPresetSelesai }: PresetLibraryViewProps) {
  const [tab, setTab] = useState<KategoriTab>('semua');
  // Dibaca sekali saat mount (localStorage) — komponen dipasang ulang tiap
  // kali view Preset dibuka, jadi template kustom baru tetap terlihat.
  const [katalogKbm] = useState<ModelJadwalKbm[]>(() => bacaSemuaKatalogKbm());
  const [memuatId, setMemuatId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sukses, setSukses] = useState<PesanSukses | null>(null);
  const [konfirmasi, setKonfirmasi] = useState<Konfirmasi | null>(null);

  function mulai(id: string) {
    setMemuatId(id);
    setError(null);
    setSukses(null);
  }

  // ── Struktur PIC ──────────────────────────────────────────────────────────
  async function terapkanStruktur(p: PresetStruktur) {
    mulai(p.id);
    try {
      await terapkanPresetStruktur(p);
      setSukses({
        teks: `Preset "${p.nama}" diterapkan ke Struktur PIC (${p.items.length} jabatan, ${jumlahSubTugas(p)} sub-tugas). Isi nama PIC di sana.`,
        labelBuka: 'Buka Struktur PIC →',
        view: 'sop',
      });
    } catch (e) {
      setError(pesanError(e));
    } finally {
      setMemuatId(null);
    }
  }

  async function mintaKonfirmasiStruktur(p: PresetStruktur) {
    mulai(p.id);
    try {
      const [papan] = await sopSvc.daftarSop({ baku: true });
      let jabatan = 0;
      let tugas = 0;
      if (papan) {
        const [items, subs] = await Promise.all([sopSvc.daftarItemSop(papan.id), sopSvc.daftarSubItemSop(papan.id)]);
        jabatan = items.length;
        tugas = subs.length;
      }
      if (jabatan === 0 && tugas === 0) {
        // Papan masih kosong — tidak ada yang hilang, langsung terapkan.
        await terapkanStruktur(p);
        return;
      }
      setKonfirmasi({
        jenis: 'struktur',
        preset: p,
        pesan: `Struktur PIC sekarang berisi ${jabatan} jabatan dan ${tugas} tugas. Menerapkan preset "${p.nama}" akan MENGGANTI seluruhnya. Ceklis ikut hilang.`,
      });
    } catch (e) {
      setError(pesanError(e));
    } finally {
      setMemuatId(null);
    }
  }

  // ── Jadwal KBM ────────────────────────────────────────────────────────────
  function terapkanKbm(p: ModelJadwalKbm) {
    mulai(p.id);
    try {
      simpanJadwalKbmLokal(p);
      setSukses({
        teks: `Jadwal "${p.judul}" kini aktif di Matriks KBM.`,
        labelBuka: 'Buka Kanvas KBM →',
        view: 'canvas',
        dok: 'kbm',
      });
    } catch (e) {
      setError(pesanError(e));
    } finally {
      setMemuatId(null);
    }
  }

  function mintaKonfirmasiKbm(p: ModelJadwalKbm) {
    setError(null);
    setSukses(null);
    let aktif: ModelJadwalKbm;
    try {
      aktif = bacaJadwalKbmLokal();
    } catch (e) {
      setError(pesanError(e));
      return;
    }
    const sama = aktif.id === p.id && !aktif.diubahPada && JSON.stringify(aktif) === JSON.stringify(p);
    if (sama) {
      terapkanKbm(p);
      return;
    }
    setKonfirmasi({
      jenis: 'kbm',
      preset: p,
      pesan: `Jadwal KBM aktif "${aktif.judul}" akan diganti dengan "${p.judul}". Perubahan yang belum disimpan sebagai template kustom hilang.`,
    });
  }

  // ── SOP acara → Template ──────────────────────────────────────────────────
  async function terapkanSop(p: PresetSop) {
    mulai(p.id);
    try {
      const hasil = await terapkanPresetSop(p);
      const divisiBaru = hasil.divisiBaru.length > 0 ? ` Divisi baru dibuat: ${hasil.divisiBaru.join(', ')}.` : '';
      setSukses({
        teks: `Template "${hasil.template.nama}" dibuat (${hasil.jumlahFase} fase, ${hasil.jumlahItem} item) — buka tab Template untuk mengubah / membuat acara.${divisiBaru}`,
        labelBuka: 'Buka Template →',
        view: 'template',
      });
    } catch (e) {
      setError(pesanError(e));
    } finally {
      setMemuatId(null);
    }
  }

  function jalankanKonfirmasi() {
    if (!konfirmasi) return;
    const k = konfirmasi;
    setKonfirmasi(null);
    if (k.jenis === 'struktur') void terapkanStruktur(k.preset);
    else terapkanKbm(k.preset);
  }

  const sibuk = memuatId !== null;
  const tampilStruktur = tab === 'semua' || tab === 'struktur';
  const tampilSop = tab === 'semua' || tab === 'sop';
  const tampilKbm = tab === 'semua' || tab === 'kbm';

  return (
    <div className="space-y-4">
      <HeaderView
        judul="Preset"
        keterangan="Mulai dari template siap pakai"
        subNav={<SubNav daftar={TAB} aktif={tab} onPilih={setTab} />}
      />

      {error && (
        <p role="alert" className={KELAS.error}>
          {error}
        </p>
      )}

      {sukses && (
        <div role="status" className={`flex flex-wrap items-center justify-between gap-2 ${KELAS_SUKSES}`}>
          <span className="min-w-0 flex-1">{sukses.teks}</span>
          <div className="flex items-center gap-1.5">
            {onPilihPresetSelesai && (
              <button
                type="button"
                className={KELAS.tombolUtamaKecil}
                onClick={() => onPilihPresetSelesai(sukses.view, sukses.dok)}
              >
                {sukses.labelBuka}
              </button>
            )}
            <button type="button" className={KELAS.tombolHalus} onClick={() => setSukses(null)}>
              Tutup
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {tampilStruktur &&
          DAFTAR_PRESET_STRUKTUR.map((p) => (
            <KartuPreset
              key={p.id}
              ikon={p.ikon}
              badge="Struktur"
              kelasBadge={KELAS.badgeInfo}
              judul={p.nama}
              deskripsi={p.deskripsi}
              meta={`${p.items.length} jabatan/seksi · ${jumlahSubTugas(p)} sub-tugas · PIC diisi sendiri`}
              labelTombol="Gunakan struktur ini"
              memuat={memuatId === p.id}
              nonaktif={sibuk}
              onGunakan={() => void mintaKonfirmasiStruktur(p)}
            />
          ))}

        {tampilSop &&
          DAFTAR_PRESET_SOP.map((p) => (
            <KartuPreset
              key={p.id}
              ikon={p.ikon}
              badge="SOP Acara"
              kelasBadge={KELAS.badgeNetral}
              judul={p.nama}
              deskripsi={p.deskripsi}
              meta={`${jumlahFaseSop(p)} fase · ${p.items.length} langkah · menjadi Template baru`}
              labelTombol="Buat template dari SOP ini"
              memuat={memuatId === p.id}
              nonaktif={sibuk}
              onGunakan={() => void terapkanSop(p)}
            />
          ))}

        {tampilKbm &&
          katalogKbm.map((p) => {
            const unggulan = p.id === ID_PRESET_KBM_UNGGULAN;
            return (
              <KartuPreset
                key={p.id}
                ikon={p.kustom ? '⭐' : '📅'}
                badge={unggulan ? 'Jadwal Pesantren' : p.kustom ? 'Template kustom' : 'Jadwal KBM'}
                kelasBadge={unggulan ? KELAS.badgeAksen : p.kustom ? KELAS.badgeUngu : KELAS.badgeNetral}
                judul={p.tahunAjaran ? `${p.judul} (${p.tahunAjaran})` : p.judul}
                deskripsi={p.deskripsi}
                meta={`${p.daftarHari.length} hari · ${p.daftarJam.length} sesi · ${p.entri.length} entri`}
                labelTombol="Gunakan & sesuaikan"
                memuat={memuatId === p.id}
                nonaktif={sibuk}
                onGunakan={() => mintaKonfirmasiKbm(p)}
              />
            );
          })}
      </div>

      <KonfirmasiDialog
        terbuka={konfirmasi !== null}
        judul={konfirmasi?.jenis === 'kbm' ? 'Ganti jadwal KBM aktif?' : 'Ganti struktur PIC?'}
        pesan={konfirmasi?.pesan ?? ''}
        labelYa={konfirmasi?.jenis === 'kbm' ? 'Ganti jadwal' : 'Ganti struktur'}
        bahaya
        onBatal={() => setKonfirmasi(null)}
        onYa={jalankanKonfirmasi}
      />
    </div>
  );
}
