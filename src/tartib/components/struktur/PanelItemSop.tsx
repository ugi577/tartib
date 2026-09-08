'use client';

// Panel daftar & cetak satu papan (papan baku dalam "mode daftar" maupun SOP
// kustom) — Batch X/Y, dipecah dari SopView pada sesi 22.
//
// Sesi 22:
//   - data dari `usePapanSop` yang dipegang induk (BaganOrganisasi meneruskan
//     hook yang sama → kembali ke bagan selalu segar; SOP kustom memakai
//     PanelSopMandiri yang membuat hook sendiri);
//   - salin/potong/tempel/duplikat lewat `useAksiStruktur` (service
//     transaksional) + menu dari builder murni; tombol ⋯ di tiap baris untuk
//     sentuh; kotak centang sub h-5 w-5;
//   - kertas cetak memakai modul bersama `lib/cetak/kertas` (F4 = 215 × 330,
//     preferensi `tartib.kertas` dipakai bersama Kanvas Cetak) — menggantikan
//     UKURAN_KERTAS/tartib.sop.kertas lokal yang F4-nya salah (210 × 330);
//   - hack penggantian nama PIC tertentu di muat()/render dihapus.
// Perilaku ceklis, ekspor .docx, reset ceklis, dan blok cetak TIDAK berubah.

import { useEffect, useState, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import {
  aturanPage,
  bacaPilihanKertas,
  KERTAS_BAKU,
  KERTAS_LEMBAR,
  labelDimensi,
  simpananPerangkat,
  simpanPilihanKertas,
  type IdKertas,
} from '../../lib/cetak/kertas';
import { tulisDocxSop } from '../../lib/ekspor/tulisDocxSop';
import { ambilIkonJabatan, ambilIkonTugas } from '../../lib/ikonKontekstual';
import { LABEL_DAFTAR } from '../../lib/struktur/menuStruktur';
import { useAksiStruktur, type AksiStruktur } from '../../lib/struktur/useAksiStruktur';
import { pesanError, usePapanSop, type PapanSop } from '../../lib/struktur/usePapanSop';
import { useTekanLama } from '../../lib/struktur/useTekanLama';
import { formatTanggalIndonesia, tanggalHariIni } from '../../lib/tanggal';
import { unduhBerkas } from '../../lib/unduh';
import { standaloneHost } from '../../host/standaloneHost';
import * as sopSvc from '../../services/sopService';
import type { Sop, SopItem, SopSubItem } from '../../types';
import { KELAS } from '../../ui/kelas';
import { KonfirmasiDialog } from '../AppDialog';
import { KopCetak } from '../KopCetak';
import { DialogStruktur } from './DialogStruktur';
import { FragmentCetak } from './FragmentCetak';
import { BarisPesan, PilKlip } from './UmpanBalik';
import { formatWaktu, KELAS_DIPOTONG, posisiDariElemen, posisiDariEvent, TOMBOL_MENU } from './bersama';

/** Id kertas tersimpan bisa berupa kertas gulung (dari Kanvas) — SOP hanya lembaran. */
function kertasLembarSah(id: IdKertas): IdKertas {
  return KERTAS_LEMBAR.some((k) => k.id === id) ? id : KERTAS_BAKU;
}

interface PropsPanelItemSop {
  sop: Sop;
  papan: PapanSop;
  aksiHeader?: ReactNode;
}

export function PanelItemSop({ sop, papan, aksiHeader }: PropsPanelItemSop) {
  const aksi = useAksiStruktur({
    sop,
    papan,
    label: LABEL_DAFTAR,
    rutinBaru: '',
    // Mode daftar: rutin asal dipertahankan saat menempel jabatan.
    rutinTempel: () => undefined,
  });
  const { items, subItems, subByItem, ikhtisar } = papan;
  const [resetTerbuka, setResetTerbuka] = useState(false);
  const [cetakAktif, setCetakAktif] = useState(false);
  const [kertas, setKertas] = useState<IdKertas>(KERTAS_BAKU);
  const [sibukEkspor, setSibukEkspor] = useState(false);
  const [pesanPanel, setPesanPanel] = useState<string | null>(null);

  // Preferensi kertas milik perangkat — dibaca setelah mount (SSR aman).
  useEffect(() => {
    setKertas(kertasLembarSah(bacaPilihanKertas(simpananPerangkat()).id));
  }, []);

  function pilihKertas(id: IdKertas) {
    setKertas(id);
    const simpanan = simpananPerangkat();
    simpanPilihanKertas(simpanan, { ...bacaPilihanKertas(simpanan), id });
  }

  async function resetCeklis() {
    setResetTerbuka(false);
    try {
      const n = await sopSvc.resetCeklis(sop.id);
      setPesanPanel(n > 0 ? `${n} centang dikosongkan.` : 'Belum ada yang tercentang.');
      await papan.muat();
    } catch (e) {
      papan.setError(pesanError(e));
    }
  }

  // flushSync memastikan bagian print ter-commit ke DOM sebelum window.print()
  // (pola Batch F / sesi 15). PDF = pilih "Save as PDF" di dialog cetak.
  function cetak() {
    flushSync(() => setCetakAktif(true));
    void standaloneHost.cetak({ jenis: 'papanSop', sopId: sop.id }).finally(() => setCetakAktif(false));
  }

  async function unduhDocx() {
    setSibukEkspor(true);
    try {
      const data = {
        judul: sop.judul,
        catatan: sop.catatan,
        items: items.map((it) => ({
          judul: it.judul,
          picNama: it.picNama,
          catatan: it.catatan,
          rutin: it.rutin,
          sub: (subByItem.get(it.id) ?? []).map((s) => ({ judul: s.judul, picNama: s.picNama, catatan: s.catatan })),
        })),
      };
      const bytes = await tulisDocxSop(data);
      const nama = `SOP-${sop.judul}.docx`;
      const hasil = await unduhBerkas(
        nama,
        new Blob([bytes as unknown as BlobPart], {
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        }),
      );
      if (!hasil.dibatalkan) setPesanPanel(`Berkas ${nama} siap — bisa diimpor kembali ke tab SOP.`);
    } catch (e) {
      papan.setError(pesanError(e));
    } finally {
      setSibukEkspor(false);
    }
  }

  function menuArea(e: React.MouseEvent<HTMLElement>) {
    const target = e.target as HTMLElement;
    if (target.closest('input, textarea, button, select, a, label')) return;
    e.preventDefault();
    aksi.bukaMenuArea(posisiDariEvent(e));
  }

  return (
    <>
      {/* Seluruh layar dibungkus print:hidden — blok cetak ada di luar kartu
          kaca agar tidak mewarisi latar & blur saat dicetak (jebakan CSS
          print K-22 poin 3). */}
      <div className="space-y-3 print:hidden" onContextMenu={menuArea}>
        <section className={`${KELAS.kartu} p-3`}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className={KELAS.judulKartu}>{sop.judul}</h3>
                {sop.baku && <span className={KELAS.badgeUngu}>Semi-paten</span>}
              </div>
              {sop.catatan && <p className={`mt-0.5 ${KELAS.keteranganKecil}`}>{sop.catatan}</p>}
            </div>
            {aksiHeader && <div className="flex flex-wrap gap-1.5">{aksiHeader}</div>}
          </div>
        </section>

        {/* Bar ringkasan satu baris tipis + aksi (sesi 22, header kompak). */}
        <section className={`${KELAS.kartu} space-y-2 p-2.5`}>
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-teks-sedang">
                Ceklis {ikhtisar.selesai}/{ikhtisar.total} · {ikhtisar.persen}%
                {subItems.length > 0 ? ` · ${subItems.length} sub-tugas` : ''}
              </p>
              <div className="mt-1 h-1 w-full max-w-[12rem] overflow-hidden rounded-full bg-netral-200">
                <div className="h-full rounded-full bg-aksen-500 transition-all" style={{ width: `${ikhtisar.persen}%` }} />
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <button type="button" onClick={aksi.bukaTambahJabatan} className={KELAS.tombolUtamaKecil}>
                + Tambah
              </button>
              <button
                type="button"
                aria-label={`Menu papan ${sop.judul}`}
                aria-haspopup="menu"
                onClick={(e) => aksi.bukaMenuArea(posisiDariElemen(e.currentTarget))}
                className={TOMBOL_MENU}
              >
                ⋯
              </button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setResetTerbuka(true)}
              disabled={ikhtisar.selesai === 0}
              className={KELAS.tombolSekunderKecil}
            >
              Reset Ceklis
            </button>
            <button
              type="button"
              onClick={() => void unduhDocx()}
              disabled={sibukEkspor || items.length === 0}
              className={KELAS.tombolSekunderKecil}
            >
              {sibukEkspor ? 'Menyiapkan…' : 'Unduh .docx'}
            </button>
            <button type="button" onClick={cetak} disabled={items.length === 0} className={KELAS.tombolSekunderKecil}>
              Cetak
            </button>
            <label htmlFor={`kertas-${sop.id}`} className="sr-only">
              Ukuran kertas
            </label>
            <select
              id={`kertas-${sop.id}`}
              value={kertas}
              onChange={(e) => pilihKertas(e.target.value as IdKertas)}
              title="Ukuran kertas — untuk PDF pilih Save as PDF di dialog cetak"
              className={`${KELAS.inputKecil} w-auto`}
            >
              {KERTAS_LEMBAR.map((k) => (
                <option key={k.id} value={k.id}>
                  {labelDimensi(k.id)}
                </option>
              ))}
            </select>
          </div>
        </section>

        {aksi.klip && <PilKlip klip={aksi.klip} onBatal={aksi.batalKlip} />}
        {papan.error && <p className={KELAS.error}>{papan.error}</p>}
        {aksi.pesan && <BarisPesan pesan={aksi.pesan} onTutup={aksi.tutupPesan} />}
        {pesanPanel && <BarisPesan pesan={pesanPanel} onTutup={() => setPesanPanel(null)} />}

        {papan.memuat ? (
          <p className="text-sm text-teks-halus">Memuat…</p>
        ) : items.length === 0 ? (
          <p className={KELAS.kosong}>
            Belum ada item di papan ini — tekan &quot;+ Tambah&quot; untuk mengisi amanah/tugas pertama, atau
            tempel item dari klip lewat menu ⋯.
          </p>
        ) : (
          <ul className="space-y-2">
            {items.map((it, i) => (
              <BarisItemDaftar
                key={it.id}
                item={it}
                subs={subByItem.get(it.id) ?? []}
                pertama={i === 0}
                terakhir={i === items.length - 1}
                aksi={aksi}
                papan={papan}
              />
            ))}
          </ul>
        )}
      </div>

      {/* Cetak: @page dari modul kertas bersama mengikuti pilihan (A4/F4 215×330/
          Letter/Legal/A5). PDF lewat "Save as PDF" pada dialog cetak. */}
      {cetakAktif && (
        <div className="hidden print:block">
          <style>{aturanPage(kertas, 'portrait')}</style>
          <KopCetak />
          <div className="mb-4 border-b border-slate-400 pb-2">
            <h1 className="text-lg font-bold">{sop.judul}</h1>
            {sop.catatan && <p className="mt-1 text-xs">{sop.catatan}</p>}
            <p className="mt-1 text-xs">
              Dicetak {formatTanggalIndonesia(tanggalHariIni())} · {labelDimensi(kertas)}
            </p>
          </div>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="w-10 border border-slate-400 px-2 py-1 text-center">✓</th>
                <th className="border border-slate-400 px-2 py-1 text-left">Amanah / Tugas</th>
                <th className="w-32 border border-slate-400 px-2 py-1 text-left">PIC</th>
                <th className="w-24 border border-slate-400 px-2 py-1 text-left">Rutin</th>
                <th className="border border-slate-400 px-2 py-1 text-left">Catatan</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <FragmentCetak key={it.id} item={it} subs={subByItem.get(it.id) ?? []} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <DialogStruktur aksi={aksi} label={LABEL_DAFTAR} variasi="daftar" />

      <KonfirmasiDialog
        terbuka={resetTerbuka}
        judul="Kosongkan seluruh centang?"
        pesan={`Semua centang (item dan sub-tugas) di "${sop.judul}" dikembalikan ke belum selesai (${ikhtisar.selesai} centang). Nama PIC dan daftar item tidak berubah.`}
        labelYa="Reset Ceklis"
        bahaya={false}
        onBatal={() => setResetTerbuka(false)}
        onYa={() => void resetCeklis()}
      />
    </>
  );
}

/** Panel untuk SOP kustom yang berdiri sendiri — membuat hook datanya sendiri. */
export function PanelSopMandiri({ sop, aksiHeader }: { sop: Sop; aksiHeader?: ReactNode }) {
  const papan = usePapanSop(sop.id);
  return <PanelItemSop sop={sop} papan={papan} aksiHeader={aksiHeader} />;
}

// ── Baris item & sub-tugas (mode daftar) ───────────────────────────────────

interface PropsBarisItem {
  item: SopItem;
  subs: SopSubItem[];
  pertama: boolean;
  terakhir: boolean;
  aksi: AksiStruktur;
  papan: PapanSop;
}

function BarisItemDaftar({ item, subs, pertama, terakhir, aksi, papan }: PropsBarisItem) {
  const dipotong = aksi.dipotong('jabatan', item.id);
  const tekanLama = useTekanLama((el) => aksi.bukaMenuJabatan(item, posisiDariElemen(el)));

  return (
    <li
      {...tekanLama}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        aksi.bukaMenuJabatan(item, posisiDariEvent(e));
      }}
      className={`${KELAS.kartu} p-3 ${dipotong ? KELAS_DIPOTONG : ''}`}
    >
      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          checked={item.selesai}
          onChange={() => void papan.centangItem(item, !item.selesai)}
          aria-label={`Centang ${item.judul}`}
          className="mt-2 h-5 w-5 shrink-0 cursor-pointer"
        />
        <div className="min-w-0 flex-1 pt-1">
          <p
            className={`flex items-center gap-1.5 text-sm font-medium ${
              item.selesai ? 'text-teks-halus line-through' : 'text-teks-utama'
            }`}
          >
            <span className="select-none text-base" aria-hidden="true">
              {ambilIkonJabatan(item.judul, item.catatan, item.rutin)}
            </span>
            <span className="min-w-0">{item.judul}</span>
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span className={`${item.picNama ? KELAS.badgeInfo : KELAS.badgeNetral} whitespace-nowrap`}>
              {item.picNama ? `PIC: ${item.picNama}` : 'PIC: belum diisi'}
            </span>
            {item.rutin && <span className={`${KELAS.badgePeringatan} whitespace-nowrap`}>Rutin: {item.rutin}</span>}
            {item.selesai && item.selesaiPada && (
              <span className={`${KELAS.badgeAksen} whitespace-nowrap`}>Selesai {formatWaktu(item.selesaiPada)}</span>
            )}
            {item.catatan && <span className={KELAS.keteranganKecil}>{item.catatan}</span>}
          </div>
        </div>
        <div className="flex shrink-0 items-center">
          <button
            type="button"
            onClick={() => void aksi.pindahJabatan(item, 'atas')}
            disabled={pertama}
            aria-label={`Naikkan ${item.judul}`}
            className={KELAS.tombolIkon}
          >
            ↑
          </button>
          <button
            type="button"
            onClick={() => void aksi.pindahJabatan(item, 'bawah')}
            disabled={terakhir}
            aria-label={`Turunkan ${item.judul}`}
            className={KELAS.tombolIkon}
          >
            ↓
          </button>
          <button
            type="button"
            aria-label={`Menu item ${item.judul}`}
            aria-haspopup="menu"
            onClick={(e) => aksi.bukaMenuJabatan(item, posisiDariElemen(e.currentTarget))}
            className={TOMBOL_MENU}
          >
            ⋯
          </button>
        </div>
      </div>

      {/* Sub-tugas — rincian di bawah amanah, tiap sub punya PIC dan ceklis
          sendiri (Batch Y). */}
      {subs.length > 0 && (
        <ul className="ml-7 mt-2 space-y-1 border-l-2 border-white/70 pl-2">
          {subs.map((s, j) => (
            <BarisSubDaftar
              key={s.id}
              induk={item}
              sub={s}
              pertama={j === 0}
              terakhir={j === subs.length - 1}
              aksi={aksi}
              papan={papan}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

interface PropsBarisSub {
  induk: SopItem;
  sub: SopSubItem;
  pertama: boolean;
  terakhir: boolean;
  aksi: AksiStruktur;
  papan: PapanSop;
}

function BarisSubDaftar({ induk, sub, pertama, terakhir, aksi, papan }: PropsBarisSub) {
  const dipotong = aksi.dipotong('sub-tugas', sub.id);
  const tekanLama = useTekanLama((el) => aksi.bukaMenuSub(induk, sub, posisiDariElemen(el)));

  return (
    <li
      {...tekanLama}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        aksi.bukaMenuSub(induk, sub, posisiDariEvent(e));
      }}
      className={`flex items-start gap-2 rounded-lg border p-1 ${dipotong ? KELAS_DIPOTONG : 'border-transparent'}`}
    >
      <input
        type="checkbox"
        checked={sub.selesai}
        onChange={() => void papan.centangSub(sub, !sub.selesai)}
        aria-label={`Centang sub ${sub.judul}`}
        className="mt-2 h-5 w-5 shrink-0 cursor-pointer"
      />
      <div className="min-w-0 flex-1 pt-1">
        <p className={`flex items-center gap-1.5 text-sm ${sub.selesai ? 'text-teks-halus line-through' : 'text-teks-kuat'}`}>
          <span className="select-none text-xs opacity-85" aria-hidden="true">
            {ambilIkonTugas(sub.judul, sub.catatan)}
          </span>
          <span className="min-w-0">{sub.judul}</span>
        </p>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
          <span className={`${sub.picNama ? KELAS.badgeInfo : KELAS.badgeNetral} whitespace-nowrap`}>
            {sub.picNama ? `PIC: ${sub.picNama}` : 'PIC: belum diisi'}
          </span>
          {sub.selesai && sub.selesaiPada && (
            <span className={`${KELAS.badgeAksen} whitespace-nowrap`}>Selesai {formatWaktu(sub.selesaiPada)}</span>
          )}
          {sub.catatan && <span className={KELAS.keteranganKecil}>{sub.catatan}</span>}
        </div>
      </div>
      <div className="flex shrink-0 items-center">
        <button
          type="button"
          onClick={() => void aksi.pindahSub(sub, 'atas')}
          disabled={pertama}
          aria-label={`Naikkan sub ${sub.judul}`}
          className={KELAS.tombolIkon}
        >
          ↑
        </button>
        <button
          type="button"
          onClick={() => void aksi.pindahSub(sub, 'bawah')}
          disabled={terakhir}
          aria-label={`Turunkan sub ${sub.judul}`}
          className={KELAS.tombolIkon}
        >
          ↓
        </button>
        <button
          type="button"
          aria-label={`Menu sub-tugas ${sub.judul}`}
          aria-haspopup="menu"
          onClick={(e) => aksi.bukaMenuSub(induk, sub, posisiDariElemen(e.currentTarget))}
          className={TOMBOL_MENU}
        >
          ⋯
        </button>
      </div>
    </li>
  );
}
