'use client';

// Kartu jabatan di bagan organisasi + baris tugas rincinya (sesi 22, dipecah
// dari BaganOrganisasi di SopView).
//
// Akses sentuh (temuan [21][48][49][60][92]): setiap kartu dan baris tugas
// punya tombol ⋯ (≥ 40px) yang membuka menu yang SAMA dengan klik kanan dan
// tekan lama; baris tombol teks Ubah/+Tugas/Hapus 10px (≈25×15px, hanya
// pulih saat hover) dihapus — semuanya ada di menu. Toggle buka/tutup tugas
// adalah <button aria-expanded aria-controls>, kotak centang h-5 w-5, teks
// yang dibaca ≥ 11px. Kartu/baris yang sedang dipotong ditandai putus-putus.

import { ambilIkonJabatan, ambilIkonTugas } from '../../lib/ikonKontekstual';
import type { AksiStruktur } from '../../lib/struktur/useAksiStruktur';
import type { PapanSop } from '../../lib/struktur/usePapanSop';
import { useTekanLama } from '../../lib/struktur/useTekanLama';
import type { SopItem, SopSubItem } from '../../types';
import { KELAS_DIPOTONG, posisiDariElemen, posisiDariEvent, TOMBOL_MENU } from './bersama';

interface PropsKartuJabatan {
  item: SopItem;
  subs: SopSubItem[];
  pimpinan: boolean;
  terbuka: boolean;
  /** Tampilkan nilai rutin di kartu (grup "Lainnya"). */
  tampilkanRutin: boolean;
  aksi: AksiStruktur;
  papan: PapanSop;
  onToggle: () => void;
}

export function KartuJabatan({ item, subs, pimpinan, terbuka, tampilkanRutin, aksi, papan, onToggle }: PropsKartuJabatan) {
  const ikon = ambilIkonJabatan(item.judul, item.catatan, item.rutin);
  const selesai = subs.filter((s) => s.selesai).length;
  const dipotong = aksi.dipotong('jabatan', item.id);
  const tekanLama = useTekanLama((el) => aksi.bukaMenuJabatan(item, posisiDariElemen(el)));
  const idPanel = `tugas-${item.id}`;

  return (
    <div className={pimpinan ? 'w-full max-w-xs' : 'w-[calc(50%-0.375rem)] sm:w-44'}>
      <div
        {...tekanLama}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          aksi.bukaMenuJabatan(item, posisiDariEvent(e));
        }}
        className={`relative select-none rounded-kartu border text-center transition-all duration-200 ${
          pimpinan
            ? 'border-emas-400/60 bg-gradient-to-b from-aksen-800 via-aksen-700 to-aksen-600 text-white shadow-glowAksen'
            : 'border-emas-300/60 bg-permukaan-kartu shadow-kartu backdrop-blur-xl hover:border-emas-400/80 hover:shadow-angkat'
        } ${dipotong ? KELAS_DIPOTONG : ''}`}
      >
        <button
          type="button"
          aria-label={`Menu jabatan ${item.judul}`}
          aria-haspopup="menu"
          onClick={(e) => aksi.bukaMenuJabatan(item, posisiDariElemen(e.currentTarget))}
          className={`${TOMBOL_MENU} absolute right-0.5 top-0.5 ${
            pimpinan ? 'text-white/80 hover:bg-white/15 hover:text-white' : ''
          }`}
        >
          ⋯
        </button>

        <button
          type="button"
          aria-expanded={terbuka}
          aria-controls={idPanel}
          onClick={onToggle}
          className={`w-full ${pimpinan ? 'px-4 pb-3 pt-4' : 'px-3 pb-2.5 pt-3'}`}
        >
          <span className={`block ${pimpinan ? 'text-3xl' : 'text-2xl'}`} aria-hidden="true">
            {ikon}
          </span>
          <span
            className={`mt-1 block font-bold uppercase tracking-wider ${
              pimpinan ? 'text-sm text-white' : 'text-xs text-teks-utama'
            }`}
          >
            {item.judul}
          </span>
          {item.picNama && (
            <span className={`mt-0.5 block text-xs font-medium ${pimpinan ? 'text-emas-200' : 'text-aksen-700'}`}>
              {item.picNama}
            </span>
          )}
          {tampilkanRutin && item.rutin && (
            <span className={`mt-0.5 block text-[11px] ${pimpinan ? 'text-white/70' : 'text-teks-halus'}`}>
              Rutin: {item.rutin}
            </span>
          )}
          <span
            className={`mt-1.5 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
              pimpinan
                ? 'bg-white/20 text-white'
                : subs.length > 0 && selesai === subs.length
                  ? 'bg-aksen-100/80 text-aksen-700 ring-1 ring-aksen-300/60'
                  : 'bg-white/70 text-teks-sedang ring-1 ring-white/80'
            }`}
          >
            {subs.length > 0 ? `${selesai}/${subs.length} tugas` : 'Belum ada tugas'} {terbuka ? '▲' : '▼'}
          </span>
        </button>
      </div>

      {terbuka && (
        <div id={idPanel} className="mt-1.5 space-y-1 rounded-kontrol border border-emas-200/60 bg-white/85 p-2 shadow-md backdrop-blur-md">
          {subs.length === 0 ? (
            <p className="py-1 text-center text-[11px] text-teks-halus">Belum ada rincian tugas.</p>
          ) : (
            subs.map((s) => <BarisTugasBagan key={s.id} induk={item} sub={s} aksi={aksi} papan={papan} />)
          )}
          <button
            type="button"
            onClick={() => aksi.bukaTambahSub(item)}
            className="min-h-9 w-full rounded-full border border-dashed border-emas-300 px-2 py-1.5 text-center text-[11px] font-medium text-aksen-700 transition-colors hover:border-aksen-400 hover:bg-aksen-50/50"
          >
            + Tambah tugas
          </button>
        </div>
      )}
    </div>
  );
}

function BarisTugasBagan({ induk, sub, aksi, papan }: { induk: SopItem; sub: SopSubItem; aksi: AksiStruktur; papan: PapanSop }) {
  const dipotong = aksi.dipotong('sub-tugas', sub.id);
  const tekanLama = useTekanLama((el) => aksi.bukaMenuSub(induk, sub, posisiDariElemen(el)));

  return (
    <div
      {...tekanLama}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        aksi.bukaMenuSub(induk, sub, posisiDariEvent(e));
      }}
      className={`flex select-none items-center gap-2 rounded-lg border p-1 pl-1.5 transition-colors ${
        sub.selesai ? 'bg-aksen-50/50' : 'bg-white/70 hover:bg-white'
      } ${dipotong ? KELAS_DIPOTONG : 'border-transparent'}`}
    >
      <input
        type="checkbox"
        checked={sub.selesai}
        onChange={() => void papan.centangSub(sub, !sub.selesai)}
        aria-label={`Centang ${sub.judul}`}
        className="h-5 w-5 shrink-0 cursor-pointer accent-aksen-600"
      />
      <div className="min-w-0 flex-1 text-left">
        <p
          className={`flex items-center gap-1.5 text-xs font-medium leading-snug ${
            sub.selesai ? 'text-teks-halus line-through' : 'text-teks-utama'
          }`}
        >
          <span className="shrink-0 select-none opacity-85" aria-hidden="true">
            {ambilIkonTugas(sub.judul, sub.catatan)}
          </span>
          <span className="min-w-0 flex-1">{sub.judul}</span>
        </p>
        {sub.picNama && (
          <span className="mt-0.5 inline-block rounded bg-emas-100/70 px-1.5 text-[11px] font-semibold text-emas-800 ring-1 ring-emas-300/40">
            PIC: {sub.picNama}
          </span>
        )}
        {sub.catatan && <p className="text-[11px] text-teks-halus">{sub.catatan}</p>}
      </div>
      <button
        type="button"
        aria-label={`Menu tugas ${sub.judul}`}
        aria-haspopup="menu"
        onClick={(e) => aksi.bukaMenuSub(induk, sub, posisiDariElemen(e.currentTarget))}
        className={`${TOMBOL_MENU} shrink-0`}
      >
        ⋯
      </button>
    </div>
  );
}
