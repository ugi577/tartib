'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import type { EntriJadwal, HariKbm, ModelJadwalKbm, SesiJam } from '../types/kbm';
import {
  bacaJadwalKbmLokal,
  simpanJadwalKbmLokal,
  bacaSemuaKatalogKbm,
  simpanTemplateKbmKustom,
  hapusTemplateKbmKustom,
  eksporJadwalJson,
  imporJadwalJson,
  DAFTAR_PRESET_KBM,
  PRESET_KBM_PESANTREN_2026_2027,
} from '../lib/presets';
import { unduhBerkas } from '../lib/unduh';
import { FormDialog } from './AppDialog';
import { ContextMenu, type ItemMenuKlikKanan } from './ContextMenu';
import { salinItem, potongItem, ambilKlipAktif, bersihkanKlip } from '../lib/clipboard/appClipboard';
import { ambilIkonMapel } from '../lib/ikonKontekstual';
import { KELAS } from '../ui/kelas';

const PILIHAN_WARNA = [
  { id: 'kuning', label: 'Emas / Sesi Utama', bg: 'bg-[#fef08a]', border: 'border-amber-400', teks: 'text-amber-950' },
  { id: 'hijau', label: 'Hijau (Shalat / Dzikir)', bg: 'bg-emerald-100', border: 'border-emerald-400', teks: 'text-emerald-950' },
  { id: 'biru', label: 'Biru (Taklim / Kajian)', bg: 'bg-sky-100', border: 'border-sky-400', teks: 'text-sky-950' },
  { id: 'oranye', label: 'Oranye (Khataman / Evaluasi)', bg: 'bg-orange-100', border: 'border-orange-400', teks: 'text-orange-950' },
  { id: 'abu', label: 'Abu (Tidur / Istirahat)', bg: 'bg-slate-100', border: 'border-slate-300', teks: 'text-slate-800' },
  { id: 'putih', label: 'Putih / Netral', bg: 'bg-white', border: 'border-slate-200', teks: 'text-slate-900' },
];

export function KbmMatriksView() {
  const [jadwal, setJadwal] = useState<ModelJadwalKbm>(() => bacaJadwalKbmLokal());
  const [katalog, setKatalog] = useState<ModelJadwalKbm[]>(() => bacaSemuaKatalogKbm());
  const [kelasTerpilih, setKelasTerpilih] = useState<string>('');
  const [guruFilter, setGuruFilter] = useState<string>('');
  const [notifikasi, setNotifikasi] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dialog Edit/Tambah Entri
  const [dialogBuka, setDialogBuka] = useState(false);
  const [formEntri, setFormEntri] = useState<{
    id?: string;
    hari: HariKbm;
    jamKe: number;
    kelas: string;
    mapel: string;
    guru: string;
    ruang: string;
    warna: string;
  }>({
    hari: 'Senin',
    jamKe: 1,
    kelas: '',
    mapel: '',
    guru: '',
    ruang: '',
    warna: 'kuning',
  });

  // Dialog Edit Kop & Baris Waktu
  const [dialogKopBuka, setDialogKopBuka] = useState(false);
  const [formKop, setFormKop] = useState<{
    judul: string;
    tahunAjaran: string;
    subJudul: string;
    daftarJam: SesiJam[];
  }>({
    judul: '',
    tahunAjaran: '',
    subJudul: '',
    daftarJam: [],
  });

  // Dialog Tambah Baris Jam Cepat
  const [dialogTambahJamBuka, setDialogTambahJamBuka] = useState(false);
  const [formTambahJam, setFormTambahJam] = useState<{
    label: string;
    nomorSesi: string;
    istirahat: boolean;
    warna: string;
  }>({
    label: '',
    nomorSesi: '',
    istirahat: false,
    warna: 'kuning',
  });

  // Dialog Simpan Template Kustom
  const [dialogSimpanKustomBuka, setDialogSimpanKustomBuka] = useState(false);
  const [namaTemplateBaru, setNamaTemplateBaru] = useState('');

  // Dialog Impor JSON
  const [dialogImporBuka, setDialogImporBuka] = useState(false);
  const [teksJsonImpor, setTeksJsonImpor] = useState('');

  const [menuKlikKanan, setMenuKlikKanan] = useState<{
    x: number;
    y: number;
    judul?: string;
    items: ItemMenuKlikKanan[];
  } | null>(null);

  useEffect(() => {
    if (!kelasTerpilih && jadwal.daftarKelas.length > 0) {
      setKelasTerpilih(jadwal.daftarKelas[0]);
    }
  }, [jadwal, kelasTerpilih]);

  useEffect(() => {
    if (notifikasi) {
      const timer = setTimeout(() => setNotifikasi(''), 3500);
      return () => clearTimeout(timer);
    }
  }, [notifikasi]);

  const daftarGuru = useMemo(() => {
    const s = new Set<string>();
    for (const e of jadwal.entri) {
      if (e.guru) s.add(e.guru);
    }
    return Array.from(s).sort();
  }, [jadwal.entri]);

  function getEntri(hari: HariKbm, jamKe: number): EntriJadwal | undefined {
    return jadwal.entri.find((e) => {
      const matchHari = e.hari === hari || (hari === "Jum'at" && e.hari === 'Jumat') || (hari === 'Jumat' && e.hari === "Jum'at");
      const matchJam = e.jamKe === jamKe;
      if (guruFilter) {
        return matchHari && matchJam && e.guru === guruFilter;
      }
      return matchHari && matchJam && (e.kelas === kelasTerpilih || !e.kelas || e.kelas === 'Semua Santri / Halaqah');
    });
  }

  function perbaruiJadwal(jadwalBaru: ModelJadwalKbm, pesanNotif?: string) {
    setJadwal(jadwalBaru);
    simpanJadwalKbmLokal(jadwalBaru);
    setKatalog(bacaSemuaKatalogKbm());
    if (pesanNotif) setNotifikasi(pesanNotif);
  }

  function handleContextMenuSel(e: React.MouseEvent, hari: HariKbm, jamKe: number) {
    e.preventDefault();
    const entri = getEntri(hari, jamKe);
    const klip = ambilKlipAktif();

    const items: ItemMenuKlikKanan[] = [];

    if (entri) {
      items.push({
        label: 'Salin Jam Ini',
        ikon: '📋',
        shortcut: 'Ctrl+C',
        onClick: () => {
          salinItem('kbm', entri, `${entri.mapel} ${entri.guru ? `- ${entri.guru}` : ''}`);
          setNotifikasi('Sesi jam berhasil disalin!');
        },
      });

      items.push({
        label: 'Duplikat ke Jam Berikutnya',
        ikon: '📑',
        shortcut: 'Ctrl+D',
        disabled: jamKe >= jadwal.daftarJam.length,
        onClick: () => {
          const jamBerikutnya = jamKe + 1;
          if (jamBerikutnya > jadwal.daftarJam.length) return;
          const kelasTujuan = kelasTerpilih || jadwal.daftarKelas[0] || 'Semua Santri / Halaqah';
          const updatedEntri = [...jadwal.entri];
          const adaIndex = updatedEntri.findIndex(
            (x) => (x.hari === hari || (hari === "Jum'at" && x.hari === 'Jumat')) && x.jamKe === jamBerikutnya
          );
          if (adaIndex !== -1) {
            updatedEntri[adaIndex] = {
              ...updatedEntri[adaIndex],
              mapel: entri.mapel,
              guru: entri.guru,
              ruang: entri.ruang,
              warna: entri.warna,
            };
          } else {
            updatedEntri.push({
              id: globalThis.crypto.randomUUID(),
              hari,
              jamKe: jamBerikutnya,
              kelas: kelasTujuan,
              mapel: entri.mapel,
              guru: entri.guru,
              ruang: entri.ruang,
              warna: entri.warna,
            });
          }
          perbaruiJadwal({ ...jadwal, entri: updatedEntri }, 'Duplikat ke jam berikutnya berhasil!');
        },
      });

      items.push({
        label: 'Potong Jam Ini',
        ikon: '✂️',
        shortcut: 'Ctrl+X',
        onClick: () => {
          potongItem('kbm', entri, `${entri.mapel} ${entri.guru ? `- ${entri.guru}` : ''}`, entri.id);
          setNotifikasi('Sesi dipotong (cut)!');
        },
      });
    }

    const bisaPaste = klip !== null;
    items.push({
      label: 'Tempel ke Jam Ini',
      ikon: '📥',
      shortcut: 'Ctrl+V',
      disabled: !bisaPaste,
      onClick: () => {
        if (!klip) return;
        let mapel = '';
        let guru = '';
        let ruang = '';
        let warna = 'kuning';
        if (klip.tipe === 'kbm' && klip.data) {
          mapel = klip.data.mapel || '';
          guru = klip.data.guru || '';
          ruang = klip.data.ruang || '';
          warna = klip.data.warna || 'kuning';
        } else if (klip.tipe === 'sub-tugas' && klip.data) {
          mapel = klip.data.judul || '';
          guru = klip.data.picNama || '';
        } else {
          mapel = klip.teks || '';
        }

        const kelasTujuan = kelasTerpilih || jadwal.daftarKelas[0] || 'Semua Santri / Halaqah';
        let updatedEntri = [...jadwal.entri];

        if (klip.isCut && klip.sumberId) {
          updatedEntri = updatedEntri.filter((x) => x.id !== klip.sumberId);
          bersihkanKlip();
        }

        const adaIndex = updatedEntri.findIndex(
          (x) => (x.hari === hari || (hari === "Jum'at" && x.hari === 'Jumat')) && x.jamKe === jamKe
        );

        if (adaIndex !== -1) {
          updatedEntri[adaIndex] = {
            ...updatedEntri[adaIndex],
            mapel,
            guru,
            ruang,
            warna,
          };
        } else {
          updatedEntri.push({
            id: globalThis.crypto.randomUUID(),
            hari,
            jamKe,
            kelas: kelasTujuan,
            mapel,
            guru,
            ruang,
            warna,
          });
        }

        perbaruiJadwal({ ...jadwal, entri: updatedEntri }, 'Berhasil ditempel!');
      },
    });

    items.push({ pemisah: true, label: '', onClick: () => {} });

    items.push({
      label: entri ? 'Ubah Jam Ini' : 'Isi Jam Ini',
      ikon: '✏️',
      onClick: () => {
        bukaTambah(hari, jamKe);
      },
    });

    if (entri) {
      items.push({
        label: 'Kosongkan / Hapus',
        ikon: '🗑️',
        bahaya: true,
        shortcut: 'Del',
        onClick: () => {
          hapusEntri(entri.id);
        },
      });
    }

    setMenuKlikKanan({
      x: e.clientX,
      y: e.clientY,
      judul: `${hari} • Jam ke-${jamKe}`,
      items,
    });
  }

  function bukaTambah(hari: HariKbm, jamKe: number) {
    const existing = getEntri(hari, jamKe);
    const sesiJam = jadwal.daftarJam.find((j) => j.ke === jamKe);
    if (existing) {
      setFormEntri({
        id: existing.id,
        hari: existing.hari,
        jamKe: existing.jamKe,
        kelas: existing.kelas || kelasTerpilih || jadwal.daftarKelas[0] || 'Semua Santri / Halaqah',
        mapel: existing.mapel,
        guru: existing.guru || '',
        ruang: existing.ruang || '',
        warna: existing.warna || sesiJam?.warna || 'kuning',
      });
    } else {
      setFormEntri({
        hari,
        jamKe,
        kelas: kelasTerpilih || jadwal.daftarKelas[0] || 'Semua Santri / Halaqah',
        mapel: '',
        guru: '',
        ruang: '',
        warna: sesiJam?.warna || 'kuning',
      });
    }
    setDialogBuka(true);
  }

  function simpanEntri() {
    let updatedEntri = [...jadwal.entri];
    if (formEntri.id) {
      updatedEntri = updatedEntri.map((e) =>
        e.id === formEntri.id
          ? {
              ...e,
              mapel: formEntri.mapel,
              guru: formEntri.guru,
              ruang: formEntri.ruang,
              warna: formEntri.warna,
            }
          : e
      );
    } else {
      const baru: EntriJadwal = {
        id: globalThis.crypto.randomUUID(),
        hari: formEntri.hari,
        jamKe: formEntri.jamKe,
        kelas: formEntri.kelas,
        mapel: formEntri.mapel,
        guru: formEntri.guru,
        ruang: formEntri.ruang,
        warna: formEntri.warna,
      };
      updatedEntri.push(baru);
    }

    perbaruiJadwal({ ...jadwal, entri: updatedEntri }, 'Perubahan entri jadwal berhasil disimpan');
    setDialogBuka(false);
  }

  function hapusEntri(id: string) {
    const updatedEntri = jadwal.entri.filter((e) => e.id !== id);
    perbaruiJadwal({ ...jadwal, entri: updatedEntri }, 'Entri jadwal dihapus');
    setDialogBuka(false);
  }

  function gantiModel(id: string) {
    const preset = katalog.find((p) => p.id === id) || DAFTAR_PRESET_KBM.find((p) => p.id === id);
    if (preset) {
      perbaruiJadwal(preset, `Template "${preset.judul}" dimuat`);
      setKelasTerpilih(preset.daftarKelas[0] || '');
      setGuruFilter('');
    }
  }

  function resetKeBawaan() {
    const asli = DAFTAR_PRESET_KBM.find((p) => p.id === jadwal.id) || PRESET_KBM_PESANTREN_2026_2027;
    if (confirm(`Reset jadwal ke versi awal template bawaan "${asli.judul}"? Semua modifikasi belum tersimpan sebagai template kustom akan direset.`)) {
      perbaruiJadwal(asli, `Jadwal berhasil direset ke template bawaan`);
    }
  }

  function bukaKustomisasiKop() {
    setFormKop({
      judul: jadwal.judul || 'Jadwal Harian Pesantren Tahfidz',
      tahunAjaran: jadwal.tahunAjaran || 'TAHUN AJARAN 2026-2027',
      subJudul: jadwal.subJudul || 'Hari/ Mata Pelajaran',
      daftarJam: JSON.parse(JSON.stringify(jadwal.daftarJam)),
    });
    setDialogKopBuka(true);
  }

  function simpanKopDanBarisJam() {
    const jadwalBaru: ModelJadwalKbm = {
      ...jadwal,
      judul: formKop.judul,
      tahunAjaran: formKop.tahunAjaran,
      subJudul: formKop.subJudul,
      daftarJam: formKop.daftarJam,
      diubahPada: new Date().toISOString(),
    };
    perbaruiJadwal(jadwalBaru, 'Kop dan baris jadwal berhasil diperbarui!');
    setDialogKopBuka(false);
  }

  function tambahBarisJamBaru() {
    const keBaru = jadwal.daftarJam.length + 1;
    const nomor = formTambahJam.nomorSesi.trim() ? Number.parseInt(formTambahJam.nomorSesi, 10) : null;
    const itemJam: SesiJam = {
      ke: keBaru,
      label: formTambahJam.label.trim() || `Jam Ke-${keBaru}`,
      nomorSesi: Number.isFinite(nomor) ? nomor : null,
      istirahat: formTambahJam.istirahat,
      warna: formTambahJam.warna,
    };

    const updatedDaftarJam = [...jadwal.daftarJam, itemJam];
    perbaruiJadwal({ ...jadwal, daftarJam: updatedDaftarJam }, `Baris jam "${itemJam.label}" berhasil ditambahkan!`);
    setDialogTambahJamBuka(false);
    setFormTambahJam({ label: '', nomorSesi: '', istirahat: false, warna: 'kuning' });
  }

  function bukaSimpanTemplateBaru() {
    setNamaTemplateBaru(`${jadwal.judul} (Kustom)`);
    setDialogSimpanKustomBuka(true);
  }

  function prosesSimpanTemplateKustom() {
    if (!namaTemplateBaru.trim()) return;
    const baru: ModelJadwalKbm = {
      ...jadwal,
      id: `kbm-kustom-${Date.now()}`,
      judul: namaTemplateBaru.trim(),
      kustom: true,
      dibuatPada: new Date().toISOString(),
      diubahPada: new Date().toISOString(),
    };
    simpanTemplateKbmKustom(baru);
    perbaruiJadwal(baru, `Template kustom "${baru.judul}" berhasil disimpan ke katalog!`);
    setDialogSimpanKustomBuka(false);
  }

  function prosesHapusTemplateKustom(id: string) {
    if (confirm('Hapus template kustom ini dari katalog?')) {
      hapusTemplateKbmKustom(id);
      const list = bacaSemuaKatalogKbm();
      setKatalog(list);
      perbaruiJadwal(list[0] || PRESET_KBM_PESANTREN_2026_2027, 'Template kustom berhasil dihapus');
    }
  }

  async function unduhJadwalJson() {
    const jsonStr = eksporJadwalJson(jadwal);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    const namaFile = `tartib-jadwal-${(jadwal.judul || 'jadwal').toLowerCase().replace(/[^a-z0-9]/g, '-')}.json`;
    await unduhBerkas(namaFile, blob);
    setNotifikasi('File JSON template jadwal berhasil diunduh!');
  }

  function handleFileImpor(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const hasil = imporJadwalJson(text);
        simpanTemplateKbmKustom(hasil);
        perbaruiJadwal(hasil, `Jadwal dari file "${file.name}" berhasil diimpor!`);
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Gagal mengimpor file JSON');
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  }

  function prosesImporTeksJson() {
    try {
      const hasil = imporJadwalJson(teksJsonImpor);
      simpanTemplateKbmKustom(hasil);
      perbaruiJadwal(hasil, 'Jadwal berhasil diimpor!');
      setDialogImporBuka(false);
      setTeksJsonImpor('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Format JSON tidak valid');
    }
  }

  // Tentukan apakah template saat ini adalah kustom
  const isKustom = katalog.some((k) => k.id === jadwal.id && k.kustom);

  return (
    <div className="space-y-4 font-sans text-slate-800">
      {/* Toast Notifikasi */}
      {notifikasi && (
        <div className="fixed bottom-20 right-6 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-xl animate-fade-in">
          <span>✨</span>
          <span>{notifikasi}</span>
        </div>
      )}

      {/* ── Toolbar Utama: Pilihan Template & Aksi Kustomisasi ─────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-2xl border border-emas-300/60 bg-white/95 p-3 shadow-sm print:hidden">
        {/* Sisi Kiri: Template Selector & Kelas */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-600">Template:</span>
            <select
              value={jadwal.id}
              onChange={(e) => gantiModel(e.target.value)}
              className="rounded-xl border border-emas-400 bg-amber-50/50 px-3 py-1.5 text-xs font-bold text-slate-900 shadow-sm transition hover:bg-amber-50 focus:border-aksen-600 focus:outline-none"
            >
              <optgroup label="Template Bawaan (Resmi)">
                {DAFTAR_PRESET_KBM.map((p) => (
                  <option key={p.id} value={p.id}>
                    ⭐ {p.judul} {p.tahunAjaran ? `(${p.tahunAjaran})` : ''}
                  </option>
                ))}
              </optgroup>
              {katalog.filter((k) => k.kustom).length > 0 && (
                <optgroup label="Template Kustom Anda">
                  {katalog
                    .filter((k) => k.kustom)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        ✏️ {p.judul}
                      </option>
                    ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* Filter / Pilihan Kelas */}
          {jadwal.daftarKelas.length > 1 && (
            <div className="flex items-center gap-1 text-xs">
              <span className="text-slate-500 font-medium">Halaqah:</span>
              <select
                value={kelasTerpilih}
                onChange={(e) => {
                  setKelasTerpilih(e.target.value);
                  setGuruFilter('');
                }}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700"
              >
                {jadwal.daftarKelas.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Filter Guru */}
          {daftarGuru.length > 0 && (
            <div className="flex items-center gap-1 text-xs">
              <span className="text-slate-500 font-medium">Musyrif:</span>
              <select
                value={guruFilter}
                onChange={(e) => setGuruFilter(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700"
              >
                <option value="">Semua (Tampil Penuh)</option>
                {daftarGuru.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Sisi Kanan: Tombol-tombol Aksi Kustomisasi */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {/* Tombol Simpan Perubahan Aktif */}
          <button
            type="button"
            onClick={() => perbaruiJadwal(jadwal, 'Perubahan jadwal berhasil disimpan!')}
            title="Simpan perubahan jadwal ini ke memori lokal"
            className="flex items-center gap-1 rounded-xl bg-aksen-700 px-3 py-1.5 font-bold text-white shadow-sm transition hover:bg-aksen-800 active:scale-95"
          >
            <span>💾 Simpan</span>
          </button>

          {/* Tombol Kustomisasi Kop & Baris Jam */}
          <button
            type="button"
            onClick={bukaKustomisasiKop}
            title="Ubah judul, tahun ajaran, dan kelola baris jam"
            className="flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95"
          >
            <span>✏️ Edit Kop &amp; Waktu</span>
          </button>

          {/* Tombol Tambah Baris Jam */}
          <button
            type="button"
            onClick={() => setDialogTambahJamBuka(true)}
            title="Tambah baris waktu baru ke jadwal"
            className="flex items-center gap-1 rounded-xl border border-emerald-300 bg-emerald-50 px-2.5 py-1.5 font-semibold text-emerald-800 shadow-sm transition hover:bg-emerald-100 active:scale-95"
          >
            <span>➕ Tambah Jam</span>
          </button>

          {/* Tombol Simpan Sebagai Template Baru */}
          <button
            type="button"
            onClick={bukaSimpanTemplateBaru}
            title="Simpan jadwal yang telah dimodifikasi sebagai template kustom baru"
            className="flex items-center gap-1 rounded-xl border border-amber-300 bg-amber-50 px-2.5 py-1.5 font-semibold text-amber-900 shadow-sm transition hover:bg-amber-100 active:scale-95"
          >
            <span>✨ Simpan sbg Template</span>
          </button>

          {/* Reset ke Bawaan */}
          <button
            type="button"
            onClick={resetKeBawaan}
            title="Kembalikan ke jadwal standar bawaan template"
            className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2 py-1.5 font-semibold text-slate-600 hover:bg-slate-50 active:scale-95"
          >
            <span>🔄 Reset</span>
          </button>

          {/* Ekspor JSON */}
          <button
            type="button"
            onClick={unduhJadwalJson}
            title="Unduh berkas JSON template jadwal"
            className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2 py-1.5 font-medium text-slate-600 hover:bg-slate-50 active:scale-95"
          >
            <span>📤 Ekspor</span>
          </button>

          {/* Impor JSON */}
          <button
            type="button"
            onClick={() => setDialogImporBuka(true)}
            title="Impor template dari JSON"
            className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2 py-1.5 font-medium text-slate-600 hover:bg-slate-50 active:scale-95"
          >
            <span>📥 Impor</span>
          </button>

          {/* Hapus Template Kustom (bila template ini kustom) */}
          {isKustom && (
            <button
              type="button"
              onClick={() => prosesHapusTemplateKustom(jadwal.id)}
              title="Hapus template kustom ini dari katalog"
              className="flex items-center gap-1 rounded-xl border border-red-200 bg-red-50 px-2 py-1.5 font-semibold text-red-600 hover:bg-red-100 active:scale-95"
            >
              <span>🗑️</span>
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileImpor}
            className="hidden"
          />
        </div>
      </div>

      {/* ── Kop Cetak Jadwal (Sesuai Format Otentik Gambar) ─────────── */}
      <div className="rounded-xl border border-emerald-300/40 bg-gradient-to-r from-emerald-50 via-white to-emerald-50 p-3 text-center shadow-sm">
        <h2 className="text-base font-black tracking-wide text-slate-900 sm:text-xl uppercase font-serif">
          {jadwal.tahunAjaran || 'TAHUN AJARAN 2026-2027'}
        </h2>
        <p className="mt-0.5 text-xs font-bold text-emerald-800 uppercase tracking-wider">
          {jadwal.judul || 'Jadwal Harian Pesantren Tahfidz'}
        </p>
        <p className="mt-0.5 text-[11px] text-slate-500">
          {guruFilter ? `Jadwal Khusus Musyrif: ${guruFilter}` : `Kelas / Halaqah: ${kelasTerpilih || 'Semua Santri'}`} • {jadwal.daftarJam.length} Sesi Waktu • {jadwal.daftarHari.length} Hari Penuh
        </p>
      </div>

      {/* ── Tabel Matriks Jadwal KBM (Grid Format Persis Rujukan) ─────── */}
      <div className="overflow-x-auto rounded-xl border-2 border-slate-700 bg-white shadow-sm">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            {/* Baris 1 Header: No, Waktu, Banner Hari / Mata Pelajaran */}
            <tr className="border-b-2 border-slate-700 bg-emerald-200/90 text-slate-900 font-extrabold text-center">
              <th rowSpan={2} className="w-12 border-r-2 border-slate-700 px-2 py-2 text-center text-xs tracking-wider">
                No
              </th>
              <th rowSpan={2} className="w-32 border-r-2 border-slate-700 px-2 py-2 text-center text-xs tracking-wider">
                Waktu
              </th>
              <th
                colSpan={jadwal.daftarHari.length}
                className="border-b border-emerald-300/70 bg-emerald-200/90 px-4 py-2 text-sm uppercase tracking-wide text-slate-900"
              >
                {jadwal.subJudul || 'Hari/ Mata Pelajaran'}
              </th>
            </tr>
            {/* Baris 2 Header: Daftar Kolom Hari (Senin s/d Ahad) */}
            <tr className="border-b-2 border-slate-700 bg-emerald-200 text-slate-900 font-bold text-center">
              {jadwal.daftarHari.map((hari) => (
                <th
                  key={hari}
                  className="border-r border-slate-500 px-3 py-2 text-center text-xs capitalize tracking-wide font-bold"
                >
                  {hari}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {jadwal.daftarJam.map((jam) => {
              const adaNomor = jam.nomorSesi !== undefined && jam.nomorSesi !== null;

              return (
                <tr
                  key={jam.ke}
                  className={`border-b border-slate-300 transition-colors ${
                    jam.istirahat ? 'bg-amber-50/30' : 'hover:bg-slate-50/60'
                  }`}
                >
                  {/* Kolom 1: No Sesi Resmi (1..8) */}
                  <td className="border-r-2 border-slate-700 bg-slate-50/80 px-1 py-1 text-center font-bold text-slate-900 select-none">
                    {adaNomor ? (
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-[#fef08a] border border-amber-400 font-black text-amber-950 shadow-sm text-xs">
                        {jam.nomorSesi}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-mono">-</span>
                    )}
                  </td>

                  {/* Kolom 2: Waktu (mis. 03.00 - 03.45) */}
                  <td className="border-r-2 border-slate-700 bg-slate-50 px-2.5 py-1.5 font-mono text-center select-none">
                    <div className="font-extrabold text-slate-800 text-[11px] leading-tight">
                      {jam.label}
                    </div>
                    <div className="mt-0.5 text-[9px] font-sans text-slate-500">
                      JP {jam.ke} {jam.istirahat ? '• Istirahat' : ''}
                    </div>
                  </td>

                  {/* Kolom 3 s/d 9: Kegiatan Per Hari */}
                  {jadwal.daftarHari.map((hari) => {
                    const entri = getEntri(hari, jam.ke);

                    // Tentukan warna latar sel
                    let bgWarna = 'bg-white hover:bg-slate-50 border-slate-200 text-slate-900';
                    const targetWarna = entri?.warna || (adaNomor && !entri?.warna ? 'kuning' : undefined);

                    if (targetWarna === 'kuning') {
                      bgWarna = 'bg-[#fef08a] hover:bg-[#fde047] border-amber-300 text-slate-950 font-medium shadow-sm';
                    } else if (targetWarna === 'hijau') {
                      bgWarna = 'bg-emerald-100 hover:bg-emerald-200 border-emerald-300 text-emerald-950 font-medium shadow-sm';
                    } else if (targetWarna === 'biru') {
                      bgWarna = 'bg-sky-100 hover:bg-sky-200 border-sky-300 text-sky-950 font-medium shadow-sm';
                    } else if (targetWarna === 'oranye') {
                      bgWarna = 'bg-orange-100 hover:bg-orange-200 border-orange-300 text-orange-950 font-medium shadow-sm';
                    } else if (targetWarna === 'abu') {
                      bgWarna = 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800 font-medium shadow-sm';
                    }

                    return (
                      <td
                        key={hari}
                        onClick={() => bukaTambah(hari, jam.ke)}
                        onContextMenu={(e) => handleContextMenuSel(e, hari, jam.ke)}
                        className="cursor-pointer border-r border-slate-300 p-1.5 align-top transition select-none"
                      >
                        {entri ? (
                          <div className={`h-full min-h-[48px] rounded-lg border p-1.5 text-xs transition ${bgWarna}`}>
                            <p className="font-bold leading-snug flex items-start gap-1">
                              <span className="text-xs shrink-0 select-none opacity-80 mt-0.5" aria-hidden="true">
                                {ambilIkonMapel(entri.mapel)}
                              </span>
                              <span className="min-w-0 flex-1 break-words">{entri.mapel}</span>
                            </p>
                            {entri.guru && (
                              <p className="mt-1 text-[10px] font-semibold opacity-90">
                                👤 {entri.guru}
                              </p>
                            )}
                            {entri.ruang && (
                              <p className="mt-0.5 text-[9px] opacity-75">
                                📍 {entri.ruang}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="flex h-10 items-center justify-center rounded border border-dashed border-slate-200 text-[10px] text-slate-300 hover:border-aksen-300 hover:text-aksen-600">
                            + Isi
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Petunjuk Interaksi & Keterangan ───────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between border-t border-slate-200 pt-2 text-[11px] text-slate-500">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded bg-[#fef08a] border border-amber-400"></span> Sesi Utama Sabqi &amp; Murojaah
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded bg-emerald-100 border border-emerald-400"></span> Shalat, Dzikir &amp; Sunnah
          </span>
          <span>• Klik sel untuk mengedit • Klik kanan untuk Salin/Tempel</span>
        </div>
        <div className="font-mono text-[10px]">
          Tartib Matriks KBM • Terakhir disesuaikan: {new Date().toLocaleDateString('id-ID')}
        </div>
      </div>

      {/* ── Dialog Form Edit / Tambah Entri Sel ────────────────────────── */}
      <FormDialog
        terbuka={dialogBuka}
        judul={formEntri.id ? 'Ubah Kegiatan Sesi' : 'Tambah Kegiatan Sesi'}
        onTutup={() => setDialogBuka(false)}
        onSimpan={simpanEntri}
      >
        <div className="space-y-3 text-xs">
          <div className="flex items-center gap-2.5 rounded-xl border border-emerald-400/40 bg-emerald-50/70 p-2.5">
            <span className="text-2xl select-none" aria-hidden="true">
              {ambilIkonMapel(formEntri.mapel)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-slate-900">{formEntri.hari} • Jam Ke-{formEntri.jamKe}</p>
              <p className="text-[10px] text-slate-500">
                Pilih atau ketik nama kegiatan, ustadz/guru, dan warna sorotan sel.
              </p>
            </div>
          </div>

          <div>
            <label className={KELAS.label} htmlFor="kbm-mapel">
              Nama Kegiatan / Mata Pelajaran / Sesi
            </label>
            <input
              id="kbm-mapel"
              value={formEntri.mapel}
              onChange={(e) => setFormEntri({ ...formEntri, mapel: e.target.value })}
              placeholder="mis. Qiyamullail berjamaah, Majelis SABQI PAGI, Fiqih"
              className={`mt-1 ${KELAS.input}`}
            />
          </div>

          <div>
            <label className={KELAS.label} htmlFor="kbm-guru">
              Pengampu / Musyrif / Pemateri (Opsional)
            </label>
            <input
              id="kbm-guru"
              value={formEntri.guru}
              onChange={(e) => setFormEntri({ ...formEntri, guru: e.target.value })}
              placeholder="mis. Ust. Farhan, Pembina Asrama, Musyrif Halaqah"
              className={`mt-1 ${KELAS.input}`}
            />
          </div>

          <div>
            <label className={KELAS.label} htmlFor="kbm-ruang">
              Ruang / Lokasi (Opsional)
            </label>
            <input
              id="kbm-ruang"
              value={formEntri.ruang}
              onChange={(e) => setFormEntri({ ...formEntri, ruang: e.target.value })}
              placeholder="mis. Masjid Utama, Aula Lt. 2, Gazebo Halaqah"
              className={`mt-1 ${KELAS.input}`}
            />
          </div>

          {/* Pemilih Warna Sorotan Sel */}
          <div>
            <label className={KELAS.label}>Warna Sorotan Kartu Sel</label>
            <div className="mt-1.5 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {PILIHAN_WARNA.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => setFormEntri({ ...formEntri, warna: w.id })}
                  className={`flex items-center gap-1.5 rounded-lg border p-1.5 text-left text-[11px] font-medium transition ${
                    formEntri.warna === w.id
                      ? `${w.bg} ${w.border} ${w.teks} ring-2 ring-aksen-600 font-bold`
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className={`h-3.5 w-3.5 shrink-0 rounded-full border ${w.bg} ${w.border}`} />
                  <span className="truncate">{w.label}</span>
                </button>
              ))}
            </div>
          </div>

          {formEntri.id && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => hapusEntri(formEntri.id!)}
                className="w-full rounded-lg border border-red-200 bg-red-50 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100"
              >
                Hapus Kegiatan Ini
              </button>
            </div>
          )}
        </div>
      </FormDialog>

      {/* ── Dialog Kustomisasi Kop & Daftar Baris Jam ─────────────────── */}
      <FormDialog
        terbuka={dialogKopBuka}
        judul="Kustomisasi Kop & Baris Jam"
        onTutup={() => setDialogKopBuka(false)}
        onSimpan={simpanKopDanBarisJam}
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className={KELAS.label} htmlFor="kop-tahun">
              Tahun Ajaran / Judul Atas
            </label>
            <input
              id="kop-tahun"
              value={formKop.tahunAjaran}
              onChange={(e) => setFormKop({ ...formKop, tahunAjaran: e.target.value })}
              placeholder="mis. TAHUN AJARAN 2026-2027"
              className={`mt-1 ${KELAS.input}`}
            />
          </div>

          <div>
            <label className={KELAS.label} htmlFor="kop-judul">
              Nama / Judul Jadwal
            </label>
            <input
              id="kop-judul"
              value={formKop.judul}
              onChange={(e) => setFormKop({ ...formKop, judul: e.target.value })}
              placeholder="mis. Jadwal Harian Pesantren Tahfidz"
              className={`mt-1 ${KELAS.input}`}
            />
          </div>

          <div>
            <label className={KELAS.label} htmlFor="kop-subjudul">
              Label Banner Kolom Hari
            </label>
            <input
              id="kop-subjudul"
              value={formKop.subJudul}
              onChange={(e) => setFormKop({ ...formKop, subJudul: e.target.value })}
              placeholder="mis. Hari/ Mata Pelajaran"
              className={`mt-1 ${KELAS.input}`}
            />
          </div>

          {/* Daftar Baris Jam yang Bisa Dikelola */}
          <div className="border-t border-slate-200 pt-3">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-800">Daftar Baris Jam ({formKop.daftarJam.length} Sesi)</span>
            </div>
            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
              {formKop.daftarJam.map((jam, idx) => (
                <div key={jam.ke} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
                  <span className="w-6 text-center font-bold text-slate-400">#{jam.ke}</span>
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={jam.label}
                      onChange={(e) => {
                        const copy = [...formKop.daftarJam];
                        copy[idx] = { ...copy[idx], label: e.target.value };
                        setFormKop({ ...formKop, daftarJam: copy });
                      }}
                      placeholder="mis. 03.00 - 03.45"
                      className="rounded border border-slate-300 bg-white px-2 py-1 text-xs"
                    />
                    <input
                      type="number"
                      value={jam.nomorSesi ?? ''}
                      onChange={(e) => {
                        const val = e.target.value ? Number.parseInt(e.target.value, 10) : null;
                        const copy = [...formKop.daftarJam];
                        copy[idx] = { ...copy[idx], nomorSesi: val };
                        setFormKop({ ...formKop, daftarJam: copy });
                      }}
                      placeholder="No Sesi (mis. 1..8)"
                      className="rounded border border-slate-300 bg-white px-2 py-1 text-xs"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const copy = formKop.daftarJam.filter((_, i) => i !== idx).map((j, i) => ({ ...j, ke: i + 1 }));
                      setFormKop({ ...formKop, daftarJam: copy });
                    }}
                    className="rounded p-1 text-red-500 hover:bg-red-50"
                    title="Hapus baris ini"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </FormDialog>

      {/* ── Dialog Tambah Baris Jam Cepat ─────────────────────────────── */}
      <FormDialog
        terbuka={dialogTambahJamBuka}
        judul="Tambah Baris Waktu / Jam Baru"
        onTutup={() => setDialogTambahJamBuka(false)}
        onSimpan={tambahBarisJamBaru}
      >
        <div className="space-y-3 text-xs">
          <div>
            <label className={KELAS.label} htmlFor="tambah-jam-label">
              Rentang Waktu (Label Jam)
            </label>
            <input
              id="tambah-jam-label"
              value={formTambahJam.label}
              onChange={(e) => setFormTambahJam({ ...formTambahJam, label: e.target.value })}
              placeholder="mis. 21.15 - 22.00 atau 07.00 - 07.45"
              className={`mt-1 ${KELAS.input}`}
            />
          </div>

          <div>
            <label className={KELAS.label} htmlFor="tambah-jam-nomor">
              Nomor Sesi Resmi (Opsional, misal 1, 2, 3.. 8)
            </label>
            <input
              id="tambah-jam-nomor"
              type="number"
              value={formTambahJam.nomorSesi}
              onChange={(e) => setFormTambahJam({ ...formTambahJam, nomorSesi: e.target.value })}
              placeholder="Kosongkan jika bukan sesi nomor utama"
              className={`mt-1 ${KELAS.input}`}
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="tambah-jam-istirahat"
              checked={formTambahJam.istirahat}
              onChange={(e) => setFormTambahJam({ ...formTambahJam, istirahat: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-aksen-600 focus:ring-aksen-500"
            />
            <label htmlFor="tambah-jam-istirahat" className="text-slate-700 font-medium">
              Ini adalah waktu istirahat / tidur / jeda santri
            </label>
          </div>
        </div>
      </FormDialog>

      {/* ── Dialog Simpan Sebagai Template Baru ───────────────────────── */}
      <FormDialog
        terbuka={dialogSimpanKustomBuka}
        judul="Simpan Sebagai Template Kustom"
        onTutup={() => setDialogSimpanKustomBuka(false)}
        onSimpan={prosesSimpanTemplateKustom}
      >
        <div className="space-y-3 text-xs">
          <p className="text-slate-600 leading-relaxed">
            Simpan susunan jadwal saat ini sebagai template baru yang tersimpan di katalog Anda, sehingga Anda dapat menggunakannya lagi kapan saja atau menduplikatnya.
          </p>
          <div>
            <label className={KELAS.label} htmlFor="simpan-kustom-nama">
              Nama Template Kustom
            </label>
            <input
              id="simpan-kustom-nama"
              value={namaTemplateBaru}
              onChange={(e) => setNamaTemplateBaru(e.target.value)}
              placeholder="mis. Jadwal Pesantren Tahfidz Santriwati 2026-2027"
              className={`mt-1 ${KELAS.input}`}
            />
          </div>
        </div>
      </FormDialog>

      {/* ── Dialog Impor JSON ─────────────────────────────────────────── */}
      <FormDialog
        terbuka={dialogImporBuka}
        judul="Impor Template Jadwal JSON"
        onTutup={() => setDialogImporBuka(false)}
        onSimpan={prosesImporTeksJson}
      >
        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-600">Pilih berkas .json atau tempel kode JSON:</span>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg bg-emerald-50 border border-emerald-300 px-2.5 py-1 text-emerald-800 font-bold hover:bg-emerald-100"
            >
              📁 Pilih Berkas JSON
            </button>
          </div>
          <textarea
            value={teksJsonImpor}
            onChange={(e) => setTeksJsonImpor(e.target.value)}
            rows={8}
            placeholder="Tempel teks JSON jadwal di sini..."
            className={`w-full font-mono text-[11px] ${KELAS.input}`}
          />
        </div>
      </FormDialog>

      {/* ── Context Menu (Klik Kanan) ─────────────────────────────────── */}
      {menuKlikKanan && (
        <ContextMenu
          x={menuKlikKanan.x}
          y={menuKlikKanan.y}
          judul={menuKlikKanan.judul}
          items={menuKlikKanan.items}
          terbuka={true}
          onTutup={() => setMenuKlikKanan(null)}
        />
      )}
    </div>
  );
}
