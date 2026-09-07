'use client';

import { useEffect, useState, useMemo } from 'react';
import type { EntriJadwal, HariKbm, ModelJadwalKbm } from '../types/kbm';
import { bacaJadwalKbmLokal, simpanJadwalKbmLokal, DAFTAR_PRESET_KBM } from '../lib/presets';
import { FormDialog } from './AppDialog';
import { ContextMenu, type ItemMenuKlikKanan } from './ContextMenu';
import { salinItem, potongItem, ambilKlipAktif, bersihkanKlip } from '../lib/clipboard/appClipboard';
import { ambilIkonMapel } from '../lib/ikonKontekstual';
import { KELAS } from '../ui/kelas';

export function KbmMatriksView() {
  const [jadwal, setJadwal] = useState<ModelJadwalKbm>(() => bacaJadwalKbmLokal());
  const [kelasTerpilih, setKelasTerpilih] = useState<string>('');
  const [guruFilter, setGuruFilter] = useState<string>('');

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
  }>({
    hari: 'Senin',
    jamKe: 1,
    kelas: '',
    mapel: '',
    guru: '',
    ruang: '',
  });

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

  const daftarGuru = useMemo(() => {
    const s = new Set<string>();
    for (const e of jadwal.entri) {
      if (e.guru) s.add(e.guru);
    }
    return Array.from(s).sort();
  }, [jadwal.entri]);

  function getEntri(hari: HariKbm, jamKe: number): EntriJadwal | undefined {
    return jadwal.entri.find((e) => {
      const matchHari = e.hari === hari;
      const matchJam = e.jamKe === jamKe;
      if (guruFilter) {
        return matchHari && matchJam && e.guru === guruFilter;
      }
      return matchHari && matchJam && e.kelas === kelasTerpilih;
    });
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
          salinItem('kbm', entri, `${entri.mapel} - ${entri.guru} (${entri.kelas})`);
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
          const kelasTujuan = kelasTerpilih || jadwal.daftarKelas[0] || 'VII-A';
          const updatedEntri = [...jadwal.entri];
          const adaIndex = updatedEntri.findIndex(
            (x) => x.hari === hari && x.jamKe === jamBerikutnya && x.kelas === kelasTujuan
          );
          if (adaIndex !== -1) {
            updatedEntri[adaIndex] = {
              ...updatedEntri[adaIndex],
              mapel: entri.mapel,
              guru: entri.guru,
              ruang: entri.ruang,
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
            });
          }
          const updatedJadwal = { ...jadwal, entri: updatedEntri };
          setJadwal(updatedJadwal);
          simpanJadwalKbmLokal(updatedJadwal);
        },
      });

      items.push({
        label: 'Potong Jam Ini',
        ikon: '✂️',
        shortcut: 'Ctrl+X',
        onClick: () => {
          potongItem('kbm', entri, `${entri.mapel} - ${entri.guru} (${entri.kelas})`, entri.id);
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
        if (klip.tipe === 'kbm' && klip.data) {
          mapel = klip.data.mapel || '';
          guru = klip.data.guru || '';
          ruang = klip.data.ruang || '';
        } else if (klip.tipe === 'sub-tugas' && klip.data) {
          mapel = klip.data.judul || '';
          guru = klip.data.picNama || '';
        } else {
          mapel = klip.teks || '';
        }

        const kelasTujuan = kelasTerpilih || jadwal.daftarKelas[0] || 'VII-A';
        let updatedEntri = [...jadwal.entri];

        if (klip.isCut && klip.sumberId) {
          updatedEntri = updatedEntri.filter((x) => x.id !== klip.sumberId);
          bersihkanKlip();
        }

        const adaIndex = updatedEntri.findIndex(
          (x) => x.hari === hari && x.jamKe === jamKe && x.kelas === kelasTujuan
        );

        if (adaIndex !== -1) {
          updatedEntri[adaIndex] = {
            ...updatedEntri[adaIndex],
            mapel,
            guru,
            ruang,
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
          });
        }

        const updatedJadwal = { ...jadwal, entri: updatedEntri };
        setJadwal(updatedJadwal);
        simpanJadwalKbmLokal(updatedJadwal);
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
      judul: `${hari} • JP ${jamKe}`,
      items,
    });
  }

  function bukaTambah(hari: HariKbm, jamKe: number) {
    const existing = getEntri(hari, jamKe);
    if (existing) {
      setFormEntri({
        id: existing.id,
        hari: existing.hari,
        jamKe: existing.jamKe,
        kelas: existing.kelas,
        mapel: existing.mapel,
        guru: existing.guru,
        ruang: existing.ruang || '',
      });
    } else {
      setFormEntri({
        hari,
        jamKe,
        kelas: kelasTerpilih || jadwal.daftarKelas[0] || 'VII-A',
        mapel: '',
        guru: '',
        ruang: '',
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
      };
      updatedEntri.push(baru);
    }

    const updatedJadwal: ModelJadwalKbm = {
      ...jadwal,
      entri: updatedEntri,
    };

    setJadwal(updatedJadwal);
    simpanJadwalKbmLokal(updatedJadwal);
    setDialogBuka(false);
  }

  function hapusEntri(id: string) {
    const updatedEntri = jadwal.entri.filter((e) => e.id !== id);
    const updatedJadwal: ModelJadwalKbm = {
      ...jadwal,
      entri: updatedEntri,
    };
    setJadwal(updatedJadwal);
    simpanJadwalKbmLokal(updatedJadwal);
    setDialogBuka(false);
  }

  function gantiModel(id: string) {
    const preset = DAFTAR_PRESET_KBM.find((p) => p.id === id);
    if (preset) {
      setJadwal(preset);
      simpanJadwalKbmLokal(preset);
      setKelasTerpilih(preset.daftarKelas[0] || '');
      setGuruFilter('');
    }
  }

  return (
    <div className="space-y-4">
      {/* Kontrol Filter & Preset */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3 print:hidden">
        <div className="flex flex-wrap items-center gap-2">
          {/* Switcher Tipe Preset KBM */}
          <select
            value={jadwal.id}
            onChange={(e) => gantiModel(e.target.value)}
            className="rounded-xl border border-emas-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm"
          >
            {DAFTAR_PRESET_KBM.map((p) => (
              <option key={p.id} value={p.id}>
                {p.judul}
              </option>
            ))}
          </select>

          {/* Filter Kelas */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-medium">Kelas:</span>
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5">
              {jadwal.daftarKelas.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => {
                    setKelasTerpilih(k);
                    setGuruFilter('');
                  }}
                  className={`rounded px-2 py-1 transition text-xs ${
                    kelasTerpilih === k && !guruFilter
                      ? 'bg-white font-semibold text-aksen-800 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>

          {/* Filter Guru */}
          {daftarGuru.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-500 font-medium">Jadwal Guru:</span>
              <select
                value={guruFilter}
                onChange={(e) => setGuruFilter(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700"
              >
                <option value="">Semua Guru (Per Kelas)</option>
                {daftarGuru.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <p className="text-xs text-slate-500">
          {guruFilter ? `Jadwal Khusus: ${guruFilter}` : `Jadwal Kelas: ${kelasTerpilih}`}
        </p>
      </div>

      {/* Kop Cetak Jadwal */}
      <div className="mb-2 text-center">
        <h3 className="text-base font-bold uppercase tracking-wide text-slate-900 sm:text-lg">
          {jadwal.judul}
        </h3>
        <p className="text-xs font-semibold text-aksen-800">
          {guruFilter ? `JADWAL MENGAJAR GURU: ${guruFilter}` : `KELAS / HALAQAH: ${kelasTerpilih}`}
        </p>
        <p className="text-[10px] text-slate-500">Tahun Ajaran Aktif • Dicetak via Tartib App</p>
      </div>

      {/* Tabel Matriks Jadwal KBM */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b-2 border-slate-800 bg-slate-100 text-slate-900">
              <th className="border border-slate-300 px-2.5 py-2 text-center font-bold">Waktu / Jam</th>
              {jadwal.daftarHari.map((h) => (
                <th key={h} className="border border-slate-300 px-3 py-2 text-center font-bold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {jadwal.daftarJam.map((jam, idx) => {
              if (jam.istirahat) {
                return (
                  <tr key={idx} className="bg-amber-50/70 text-center font-semibold text-amber-900">
                    <td
                      colSpan={jadwal.daftarHari.length + 1}
                      className="border border-amber-200 px-2 py-1 text-[11px]"
                    >
                      ☕ {jam.label}
                    </td>
                  </tr>
                );
              }

              return (
                <tr key={idx} className="hover:bg-slate-50">
                  {/* Kolom Jam */}
                  <td className="whitespace-nowrap border border-slate-300 bg-slate-50 px-2.5 py-2 text-center font-mono text-[11px] text-slate-700">
                    <div className="font-bold">JP {jam.ke}</div>
                    <div className="text-[10px] text-slate-500">{jam.label}</div>
                  </td>

                  {/* Kolom Hari */}
                  {jadwal.daftarHari.map((hari) => {
                    const entri = getEntri(hari, jam.ke);
                    return (
                      <td
                        key={hari}
                        onClick={() => bukaTambah(hari, jam.ke)}
                        onContextMenu={(e) => handleContextMenuSel(e, hari, jam.ke)}
                        className="cursor-pointer border border-slate-300 p-2 align-top transition hover:bg-aksen-50/40 select-none"
                      >
                        {entri ? (
                          <div className="rounded-lg border border-slate-200 bg-white p-1.5 shadow-sm">
                            <p className="font-bold text-slate-900 leading-tight flex items-center gap-1">
                              <span className="text-xs shrink-0 select-none opacity-85" aria-hidden="true">
                                {ambilIkonMapel(entri.mapel)}
                              </span>
                              <span className="min-w-0 flex-1">{entri.mapel}</span>
                            </p>
                            <p className="mt-0.5 text-[10px] text-aksen-800 font-medium">{entri.guru}</p>
                            {guruFilter && (
                              <p className="text-[9px] text-slate-500">Kelas: {entri.kelas}</p>
                            )}
                            {entri.ruang && (
                              <p className="text-[9px] text-slate-400">R: {entri.ruang}</p>
                            )}
                          </div>
                        ) : (
                          <div className="flex h-12 items-center justify-center text-[11px] text-slate-300 hover:text-slate-400">
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

      {/* Catatan / Legenda Cetak */}
      <div className="mt-4 flex flex-wrap items-center justify-between border-t border-slate-200 pt-2 text-[10px] text-slate-500">
        <span>* Klik kiri untuk mengisi/ubah. <strong>Klik kanan</strong> untuk Salin (Copy), Potong (Cut), Tempel (Paste), &amp; Hapus.</span>
        <span>Dicetak pada: {new Date().toLocaleDateString('id-ID')}</span>
      </div>

      {/* Dialog Form Tambah/Ubah Entri KBM */}
      <FormDialog
        terbuka={dialogBuka}
        judul={formEntri.id ? 'Ubah Jam Pelajaran' : 'Tambah Jam Pelajaran'}
        onTutup={() => setDialogBuka(false)}
        onSimpan={simpanEntri}
      >
        <div className="space-y-3">
          <div className="flex items-center gap-2.5 rounded-xl border border-emerald-400/40 bg-emerald-50/60 p-2.5">
            <span className="text-2xl select-none" aria-hidden="true">
              {ambilIkonMapel(formEntri.mapel)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-aksen-900">Ikon Mapel Otomatis</p>
              <p className="text-[10px] text-teks-halus">
                {formEntri.hari} • Jam Ke-{formEntri.jamKe} • Kelas: {formEntri.kelas}
              </p>
            </div>
          </div>

          <div>
            <label className={KELAS.label} htmlFor="kbm-mapel">
              Mata Pelajaran / Sesi
            </label>
            <input
              id="kbm-mapel"
              value={formEntri.mapel}
              onChange={(e) => setFormEntri({ ...formEntri, mapel: e.target.value })}
              placeholder="mis. Matematika, Fiqih, Tahfidz"
              className={`mt-1 ${KELAS.input}`}
            />
          </div>

          <div>
            <label className={KELAS.label} htmlFor="kbm-guru">
              Guru Pengampu / Musyrif
            </label>
            <input
              id="kbm-guru"
              value={formEntri.guru}
              onChange={(e) => setFormEntri({ ...formEntri, guru: e.target.value })}
              placeholder="mis. Ust. Farhan, Bu Siti, S.Pd"
              className={`mt-1 ${KELAS.input}`}
            />
          </div>

          <div>
            <label className={KELAS.label} htmlFor="kbm-ruang">
              Ruang / Tempat (Opsional)
            </label>
            <input
              id="kbm-ruang"
              value={formEntri.ruang}
              onChange={(e) => setFormEntri({ ...formEntri, ruang: e.target.value })}
              placeholder="mis. Lab IPA, Masjid Lt. 2, Gazebo"
              className={`mt-1 ${KELAS.input}`}
            />
          </div>

          {formEntri.id && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => hapusEntri(formEntri.id!)}
                className="w-full rounded-lg border border-red-200 bg-red-50 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100"
              >
                Hapus Jadwal Ini
              </button>
            </div>
          )}
        </div>
      </FormDialog>

      {/* Menu Klik Kanan KBM */}
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
