'use client';

// Bagan organisasi (PIC Amanah, Batch Z) — hierarki visual mirip struktur
// OSIS santri: setiap jabatan adalah SopItem, tiap tugas rinci SopSubItem;
// tier dikendalikan field `rutin` (Pimpinan → Pengurus Inti → Divisi).
// Dipecah dari SopView pada sesi 22.
//
// Sesi 22:
//   - satu `usePapanSop` dipegang di sini dan diteruskan ke mode daftar
//     (PanelItemSop) → kembali ke bagan selalu segar (temuan [16]);
//   - salin/potong/tempel/duplikat lewat `useAksiStruktur` + builder menu
//     murni; Tempel jabatan di kartu = tier kartu itu, di area = 'Divisi';
//   - `rutin` di luar tiga tier (mis. 'Harian') dirender di grup "Lainnya",
//     bukan hilang (temuan [17]);
//   - bar ringkasan satu baris tipis (+ Tambah, ⋯) supaya kartu pertama
//     muncul ≤ 230px dari atas di HP 375px (temuan [2][53][95]);
//   - tombol ⋯ / tekan lama di kartu & baris tugas untuk layar sentuh.

import { useMemo, useState } from 'react';
import { LABEL_BAGAN } from '../../lib/struktur/menuStruktur';
import { useAksiStruktur } from '../../lib/struktur/useAksiStruktur';
import { usePapanSop } from '../../lib/struktur/usePapanSop';
import type { Sop, SopItem } from '../../types';
import { KELAS } from '../../ui/kelas';
import { DialogStruktur } from './DialogStruktur';
import { KartuJabatan } from './KartuJabatan';
import { PanelItemSop } from './PanelItemSop';
import { BarisPesan, PilKlip } from './UmpanBalik';
import { posisiDariElemen, posisiDariEvent, tierDari, TIER_LAINNYA, TOMBOL_MENU, URUTAN_TIER } from './bersama';

export function BaganOrganisasi({ sop }: { sop: Sop }) {
  const papan = usePapanSop(sop.id);
  const { items, subByItem, ikhtisarSub } = papan;
  const [terbuka, setTerbuka] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<'bagan' | 'daftar'>('bagan');
  const semuaTerbuka = items.length > 0 && terbuka.size === items.length;

  function toggleSemua() {
    setTerbuka(semuaTerbuka ? new Set() : new Set(items.map((it) => it.id)));
  }

  function toggleKartu(id: string) {
    setTerbuka((lama) => {
      const baru = new Set(lama);
      if (baru.has(id)) baru.delete(id);
      else baru.add(id);
      return baru;
    });
  }

  const aksi = useAksiStruktur({
    sop,
    papan,
    label: LABEL_BAGAN,
    rutinBaru: 'Divisi',
    // Tempel di kartu → tier kartu itu; di area papan → Divisi.
    rutinTempel: (target) => target?.rutin || 'Divisi',
    menuArea: () => ({ semuaTerbuka, bukaSemua: toggleSemua, modeDaftar: () => setMode('daftar') }),
  });

  const tiers = useMemo(() => {
    const g = new Map<string, SopItem[]>();
    for (const it of items) {
      const t = tierDari(it.rutin);
      g.set(t, [...(g.get(t) ?? []), it]);
    }
    return URUTAN_TIER.filter((t) => g.has(t)).map((t) => ({ nama: t, items: g.get(t) ?? [] }));
  }, [items]);

  if (mode === 'daftar') {
    return (
      <PanelItemSop
        sop={sop}
        papan={papan}
        aksiHeader={
          <button type="button" onClick={() => setMode('bagan')} className={KELAS.tombolSekunderKecil}>
            ← Bagan visual
          </button>
        }
      />
    );
  }

  function menuArea(e: React.MouseEvent<HTMLElement>) {
    const target = e.target as HTMLElement;
    if (target.closest('input, textarea, button, select, a, label')) return;
    e.preventDefault();
    aksi.bukaMenuArea(posisiDariEvent(e));
  }

  const tombolMenuArea = (
    <button
      type="button"
      aria-label={`Menu papan ${sop.judul}`}
      aria-haspopup="menu"
      onClick={(e) => aksi.bukaMenuArea(posisiDariElemen(e.currentTarget))}
      className={TOMBOL_MENU}
    >
      ⋯
    </button>
  );

  return (
    <>
      <div className="space-y-4 print:hidden" onContextMenu={menuArea}>
        {/* Bar ringkasan: SATU baris tipis (sesi 22, dulu kartu judul + statistik
            + progress + 3 tombol menumpuk vertikal di HP). */}
        <div className={`${KELAS.kartu} flex items-center justify-between gap-2 p-2.5`}>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-teks-sedang">
              {items.length} jabatan · {ikhtisarSub.selesai}/{ikhtisarSub.total} tugas · {ikhtisarSub.persen}%
            </p>
            <div className="mt-1 h-1 w-full max-w-[12rem] overflow-hidden rounded-full bg-netral-200">
              <div
                className="h-full rounded-full bg-aksen-500 transition-all duration-300"
                style={{ width: `${ikhtisarSub.persen}%` }}
              />
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <button type="button" onClick={aksi.bukaTambahJabatan} className={KELAS.tombolUtamaKecil}>
              + Tambah
            </button>
            {tombolMenuArea}
          </div>
        </div>

        {aksi.klip && <PilKlip klip={aksi.klip} onBatal={aksi.batalKlip} />}
        {papan.error && <p className={KELAS.error}>{papan.error}</p>}
        {aksi.pesan && <BarisPesan pesan={aksi.pesan} onTutup={aksi.tutupPesan} />}

        {papan.memuat ? (
          <p className="text-sm text-teks-halus">Memuat…</p>
        ) : items.length === 0 ? (
          <div className={KELAS.kosong}>
            <p>Belum ada jabatan di struktur ini.</p>
            <p className="mt-1 text-xs">Tambah jabatan baru, atau tempel jabatan dari klip lewat menu ⋯.</p>
            <button type="button" onClick={aksi.bukaTambahJabatan} className={`mt-3 ${KELAS.tombolUtama}`}>
              Tambah Jabatan
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {tiers.map((tier, tierIdx) => {
              const pimpinan = tier.nama === 'Pimpinan';
              const pengurus = tier.nama === 'Pengurus Inti';
              return (
                <div key={tier.nama} className="space-y-1.5">
                  {/* Garis penghubung hierarki antar tingkat */}
                  {tierIdx > 0 && (
                    <div className="flex flex-col items-center">
                      <div className="h-5 w-0.5 bg-gradient-to-b from-emas-400/80 to-aksen-400/80" />
                      <div className="h-1.5 w-1.5 rounded-full bg-aksen-500" />
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-2">
                    <span className="h-px w-8 bg-emas-300/40" />
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-teks-halus">{tier.nama}</span>
                    <span className="h-px w-8 bg-emas-300/40" />
                  </div>

                  <div
                    className={`flex flex-wrap justify-center gap-3 ${
                      pimpinan ? '' : pengurus ? 'mx-auto max-w-2xl' : 'mx-auto max-w-3xl'
                    }`}
                  >
                    {tier.items.map((it) => (
                      <KartuJabatan
                        key={it.id}
                        item={it}
                        subs={subByItem.get(it.id) ?? []}
                        pimpinan={pimpinan}
                        terbuka={terbuka.has(it.id)}
                        tampilkanRutin={tier.nama === TIER_LAINNYA}
                        aksi={aksi}
                        papan={papan}
                        onToggle={() => toggleKartu(it.id)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <DialogStruktur aksi={aksi} label={LABEL_BAGAN} variasi="bagan" />
    </>
  );
}
