'use client';

// Halaman ?view=sop (Batch X, arahan Ahmed: "tambahkan menu SOP untuk hal
// bersifat semi paten, misal SOP daftar tugas/amanah/khidmah santri dan
// PICnya yg mudah ceklist, dan menu SOP customable").
//
// Dua bagian dalam satu tab (pola sub-nav Pengaturan — jumlah tab utama
// tetap enam, aturan mobile K-21):
//   Amanah & Khidmah — papan baku SEMI-PATEN dari seed: struktur relatif
//     tetap (tidak dapat dihapus), isi & PIC bebas diubah, ceklis satu klik.
//   SOP Kustom — SOP berdiri sendiri buatan pengguna: buat, ubah, duplikat,
//     hapus. Tidak terikat acara maupun fase H-offset.
// Tiap papan bisa dicetak A4 sebagai lembar ceklis (tabel ☐ / tugas / PIC).

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { seedSopAmanah } from '../db/seed';
import { formatTanggalIndonesia, tanggalHariIni } from '../lib/tanggal';
import * as sopSvc from '../services/sopService';
import { standaloneHost } from '../host/standaloneHost';
import { KELAS } from '../ui/kelas';
import { FormDialog, KonfirmasiDialog } from './AppDialog';
import { KopCetak } from './KopCetak';
import type { Sop, SopItem } from '../types';

function pesanError(e: unknown): string {
  return e instanceof Error ? e.message : 'Terjadi kesalahan';
}

function formatWaktu(iso: string): string {
  return new Date(iso).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

// ===== Panel item satu papan (dipakai papan baku & SOP kustom) =====

function PanelItemSop({ sop, aksiHeader }: { sop: Sop; aksiHeader?: ReactNode }) {
  const [items, setItems] = useState<SopItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pesan, setPesan] = useState<string | null>(null);
  const [dialogItem, setDialogItem] = useState<{ item?: SopItem } | null>(null);
  const [formItem, setFormItem] = useState({ judul: '', picNama: '', catatan: '' });
  const [errorDialog, setErrorDialog] = useState<string | null>(null);
  const [hapusTarget, setHapusTarget] = useState<SopItem | null>(null);
  const [resetTerbuka, setResetTerbuka] = useState(false);
  const [cetakAktif, setCetakAktif] = useState(false);

  const muat = useCallback(async () => {
    try {
      setItems(await sopSvc.daftarItemSop(sop.id));
      setError(null);
    } catch (e) {
      setError(pesanError(e));
    }
  }, [sop.id]);

  useEffect(() => {
    void muat();
  }, [muat]);

  function bukaTambah() {
    setFormItem({ judul: '', picNama: '', catatan: '' });
    setErrorDialog(null);
    setDialogItem({});
  }

  function bukaUbah(it: SopItem) {
    setFormItem({ judul: it.judul, picNama: it.picNama, catatan: it.catatan });
    setErrorDialog(null);
    setDialogItem({ item: it });
  }

  async function simpanItem() {
    try {
      if (dialogItem?.item) {
        await sopSvc.ubahItemSop(dialogItem.item.id, formItem);
      } else {
        await sopSvc.tambahItemSop(sop.id, formItem);
      }
      setDialogItem(null);
      await muat();
    } catch (e) {
      setErrorDialog(pesanError(e));
    }
  }

  async function hapusItem() {
    if (!hapusTarget) return;
    try {
      await sopSvc.hapusItemSop(hapusTarget.id);
      setHapusTarget(null);
      await muat();
    } catch (e) {
      setHapusTarget(null);
      setError(pesanError(e));
    }
  }

  async function pindah(it: SopItem, arah: 'atas' | 'bawah') {
    try {
      await sopSvc.pindahItemSop(it.id, arah);
      await muat();
    } catch (e) {
      setError(pesanError(e));
    }
  }

  // Ceklis satu klik — alasan utama menu ini ada (arahan Ahmed Batch X).
  async function centang(it: SopItem, selesai: boolean) {
    // Optimis: UI merespons seketika, lalu disinkronkan ulang dari DB.
    setItems((lama) => lama.map((x) => (x.id === it.id ? { ...x, selesai } : x)));
    try {
      await sopSvc.tandaiCeklis(it.id, selesai);
      await muat();
    } catch (e) {
      setError(pesanError(e));
      await muat();
    }
  }

  async function resetCeklis() {
    setResetTerbuka(false);
    try {
      const n = await sopSvc.resetCeklis(sop.id);
      setPesan(n > 0 ? `${n} centang dikosongkan.` : 'Belum ada yang tercentang.');
      await muat();
    } catch (e) {
      setError(pesanError(e));
    }
  }

  // flushSync memastikan bagian print ter-commit ke DOM sebelum window.print()
  // (pola Batch F / sesi 15).
  function cetakA4() {
    flushSync(() => setCetakAktif(true));
    void standaloneHost
      .cetak({ jenis: 'papanSop', sopId: sop.id })
      .finally(() => setCetakAktif(false));
  }

  const ikhtisar = sopSvc.ikhtisarCeklis(items);

  return (
    <>
      {/* Seluruh layar dibungkus print:hidden — blok cetak ada di luar kartu
          kaca agar tidak mewarisi latar & blur saat dicetak (jebakan CSS
          print K-22 poin 3). */}
      <div className="print:hidden space-y-4">
        <section className={KELAS.kartuIsi}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className={KELAS.judulKartu}>{sop.judul}</h3>
                {sop.baku && <span className={KELAS.badgeUngu}>Semi-paten</span>}
              </div>
              {sop.catatan && <p className={`mt-1 ${KELAS.keterangan}`}>{sop.catatan}</p>}
            </div>
            {aksiHeader && <div className="flex flex-wrap gap-1.5">{aksiHeader}</div>}
          </div>
        </section>

        <section className={`${KELAS.kartuIsi}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className={KELAS.judulKartu}>Ceklis</p>
              <p className={KELAS.keteranganKecil}>
                {ikhtisar.selesai} dari {ikhtisar.total} item dicentang ({ikhtisar.persen}%)
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={bukaTambah} className={KELAS.tombolUtamaKecil}>
                Tambah Item
              </button>
              <button
                onClick={() => setResetTerbuka(true)}
                disabled={ikhtisar.selesai === 0}
                className={KELAS.tombolSekunderKecil}
              >
                Reset Ceklis
              </button>
              <button onClick={cetakA4} disabled={items.length === 0} className={KELAS.tombolSekunderKecil}>
                Cetak (A4)
              </button>
            </div>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-netral-200">
            <div className="h-full rounded-full bg-aksen-500 transition-all" style={{ width: `${ikhtisar.persen}%` }} />
          </div>
        </section>

        {error && <p className={KELAS.error}>{error}</p>}
        {pesan && (
          <p className="rounded-kontrol bg-aksen-100/70 px-3 py-2 text-sm text-aksen-700 ring-1 ring-inset ring-aksen-200/70">
            {pesan}
          </p>
        )}

        {items.length === 0 ? (
          <p className={KELAS.kosong}>
            Belum ada item di papan ini — tekan &quot;Tambah Item&quot; untuk mengisi amanah/tugas pertama.
          </p>
        ) : (
          <ul className="space-y-2">
            {items.map((it, i) => (
              <li key={it.id} className={KELAS.kartuIsi}>
                {/* flex-wrap: di layar sempit tombol aksi turun ke baris
                    sendiri sehingga badge PIC tidak patah di dalam pil. */}
                <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
                  <input
                    type="checkbox"
                    checked={it.selesai}
                    onChange={() => void centang(it, !it.selesai)}
                    aria-label={`Centang ${it.judul}`}
                    className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer"
                  />
                  <div className="min-w-44 flex-1">
                    <p className={`text-sm font-medium ${it.selesai ? 'text-teks-halus line-through' : 'text-teks-utama'}`}>
                      {it.judul}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span className={`${it.picNama ? KELAS.badgeInfo : KELAS.badgeNetral} whitespace-nowrap`}>
                        {it.picNama ? `PIC: ${it.picNama}` : 'PIC: belum diisi'}
                      </span>
                      {it.selesai && it.selesaiPada && (
                        <span className={`${KELAS.badgeAksen} whitespace-nowrap`}>
                          Selesai {formatWaktu(it.selesaiPada)}
                        </span>
                      )}
                      {it.catatan && <span className={KELAS.keteranganKecil}>{it.catatan}</span>}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5">
                    <button
                      onClick={() => void pindah(it, 'atas')}
                      disabled={i === 0}
                      aria-label={`Naikkan ${it.judul}`}
                      className={KELAS.tombolIkon}
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => void pindah(it, 'bawah')}
                      disabled={i === items.length - 1}
                      aria-label={`Turunkan ${it.judul}`}
                      className={KELAS.tombolIkon}
                    >
                      ↓
                    </button>
                    <button onClick={() => bukaUbah(it)} className={KELAS.tombolHalus}>
                      Ubah
                    </button>
                    <button onClick={() => setHapusTarget(it)} className={KELAS.tombolBahayaHalus}>
                      Hapus
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {cetakAktif && (
        <div className="hidden print:block">
          <KopCetak />
          <div className="mb-4 border-b border-slate-400 pb-2">
            <h1 className="text-lg font-bold">{sop.judul}</h1>
            {sop.catatan && <p className="mt-1 text-xs">{sop.catatan}</p>}
            <p className="mt-1 text-xs">Dicetak {formatTanggalIndonesia(tanggalHariIni())}</p>
          </div>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="w-10 border border-slate-400 px-2 py-1 text-center">✓</th>
                <th className="border border-slate-400 px-2 py-1 text-left">Amanah / Tugas</th>
                <th className="w-36 border border-slate-400 px-2 py-1 text-left">PIC</th>
                <th className="border border-slate-400 px-2 py-1 text-left">Catatan</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id} className="break-inside-avoid">
                  <td className="border border-slate-400 px-2 py-1 text-center">☐</td>
                  <td className="border border-slate-400 px-2 py-1">{it.judul}</td>
                  <td className="border border-slate-400 px-2 py-1">{it.picNama}</td>
                  <td className="border border-slate-400 px-2 py-1">{it.catatan}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <FormDialog
        terbuka={dialogItem !== null}
        judul={dialogItem?.item ? 'Ubah Item' : 'Tambah Item'}
        onTutup={() => setDialogItem(null)}
        onSimpan={() => void simpanItem()}
        error={errorDialog}
      >
        <div>
          <label className={KELAS.label} htmlFor="sop-item-judul">
            Amanah / tugas
          </label>
          <input
            id="sop-item-judul"
            value={formItem.judul}
            onChange={(e) => setFormItem({ ...formItem, judul: e.target.value })}
            placeholder="mis. Imam shalat Maghrib"
            className={`mt-1 ${KELAS.input}`}
          />
        </div>
        <div>
          <label className={KELAS.label} htmlFor="sop-item-pic">
            Nama PIC (santri / pengurus)
          </label>
          <input
            id="sop-item-pic"
            value={formItem.picNama}
            onChange={(e) => setFormItem({ ...formItem, picNama: e.target.value })}
            placeholder="Boleh dikosongkan dulu"
            className={`mt-1 ${KELAS.input}`}
          />
        </div>
        <div>
          <label className={KELAS.label} htmlFor="sop-item-catatan">
            Catatan
          </label>
          <input
            id="sop-item-catatan"
            value={formItem.catatan}
            onChange={(e) => setFormItem({ ...formItem, catatan: e.target.value })}
            placeholder="mis. giliran per pekan"
            className={`mt-1 ${KELAS.input}`}
          />
        </div>
      </FormDialog>

      <KonfirmasiDialog
        terbuka={hapusTarget !== null}
        judul="Hapus item ini?"
        pesan={hapusTarget ? `"${hapusTarget.judul}" dihapus dari papan. Tindakan ini tidak bisa dibatalkan.` : ''}
        onBatal={() => setHapusTarget(null)}
        onYa={() => void hapusItem()}
      />

      <KonfirmasiDialog
        terbuka={resetTerbuka}
        judul="Kosongkan seluruh centang?"
        pesan={`Semua centang di "${sop.judul}" dikembalikan ke belum selesai (${ikhtisar.selesai} centang). Nama PIC dan daftar item tidak berubah.`}
        labelYa="Reset Ceklis"
        bahaya={false}
        onBatal={() => setResetTerbuka(false)}
        onYa={() => void resetCeklis()}
      />
    </>
  );
}

// ===== Halaman utama =====

type Bagian = 'amanah' | 'kustom';

const BAGIAN: ReadonlyArray<{ id: Bagian; label: string }> = [
  { id: 'amanah', label: 'Amanah & Khidmah' },
  { id: 'kustom', label: 'SOP Kustom' },
];

export function SopView() {
  const [bagian, setBagian] = useState<Bagian>('amanah');

  // Papan baku semi-paten (harusnya tepat satu — dari seed).
  const [papanBaku, setPapanBaku] = useState<Sop | null>(null);
  const [memuatBaku, setMemuatBaku] = useState(true);

  // SOP kustom: daftar + yang sedang dibuka.
  const [kustom, setKustom] = useState<Sop[]>([]);
  const [memuatKustom, setMemuatKustom] = useState(true);
  const [terbuka, setTerbuka] = useState<Sop | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [pesan, setPesan] = useState<string | null>(null);
  const [dialogSop, setDialogSop] = useState<{ mode: 'baru' | 'ubah'; sop?: Sop } | null>(null);
  const [formSop, setFormSop] = useState({ judul: '', catatan: '' });
  const [errorDialog, setErrorDialog] = useState<string | null>(null);
  const [hapusTarget, setHapusTarget] = useState<Sop | null>(null);

  const muatBaku = useCallback(async () => {
    setMemuatBaku(true);
    try {
      let semua = await sopSvc.daftarSop({ baku: true });
      if (semua.length === 0) {
        // Race seed-vs-load pada data yang baru dibuat & kondisi pasca-
        // pemulihan cadangan lama: tanam sendiri (idempoten per tanda baku),
        // lalu baca ulang — papan baku tidak boleh sekadar hilang.
        await seedSopAmanah();
        semua = await sopSvc.daftarSop({ baku: true });
      }
      setPapanBaku(semua[0] ?? null);
      setError(null);
    } catch (e) {
      setError(pesanError(e));
    }
    setMemuatBaku(false);
  }, []);

  const muatKustom = useCallback(async () => {
    setMemuatKustom(true);
    try {
      setKustom(await sopSvc.daftarSop({ baku: false }));
      setError(null);
    } catch (e) {
      setError(pesanError(e));
    }
    setMemuatKustom(false);
  }, []);

  useEffect(() => {
    void muatBaku();
    void muatKustom();
  }, [muatBaku, muatKustom]);

  // Ikhtisar tiap kartu kustom: jumlah item + yang selesai.
  // Dibaca ringkas per papan saat daftar dimuat.
  const [ikhtisarKustom, setIkhtisarKustom] = useState<Record<string, sopSvc.IkhtisarCeklis>>({});
  useEffect(() => {
    let batal = false;
    void (async () => {
      const hasil: Record<string, sopSvc.IkhtisarCeklis> = {};
      for (const s of kustom) {
        try {
          hasil[s.id] = sopSvc.ikhtisarCeklis(await sopSvc.daftarItemSop(s.id));
        } catch {
          hasil[s.id] = { total: 0, selesai: 0, persen: 0 };
        }
      }
      if (!batal) setIkhtisarKustom(hasil);
    })();
    return () => {
      batal = true;
    };
  }, [kustom]);

  function bukaBaru() {
    setFormSop({ judul: '', catatan: '' });
    setErrorDialog(null);
    setDialogSop({ mode: 'baru' });
  }

  function bukaUbahInfo(s: Sop) {
    setFormSop({ judul: s.judul, catatan: s.catatan });
    setErrorDialog(null);
    setDialogSop({ mode: 'ubah', sop: s });
  }

  async function simpanSop() {
    if (!dialogSop) return;
    try {
      if (dialogSop.mode === 'ubah' && dialogSop.sop) {
        await sopSvc.ubahSop(dialogSop.sop.id, formSop);
        setTerbuka((lama) => (lama && dialogSop.sop && lama.id === dialogSop.sop.id ? { ...lama, ...formSop } : lama));
      } else {
        const baru = await sopSvc.tambahSop(formSop);
        await muatKustom();
        setBagian('kustom');
        setTerbuka(baru);
      }
      setDialogSop(null);
    } catch (e) {
      setErrorDialog(pesanError(e));
    }
  }

  async function duplikat(s: Sop) {
    try {
      const salinan = await sopSvc.duplikatSop(s.id);
      setPesan(`"${s.judul}" diduplikat menjadi "${salinan.judul}" — ceklisnya dikosongkan.`);
      await muatKustom();
      setBagian('kustom');
      setTerbuka(salinan);
    } catch (e) {
      setError(pesanError(e));
    }
  }

  async function hapusSopTerpilih() {
    if (!hapusTarget) return;
    const target = hapusTarget;
    setHapusTarget(null);
    try {
      await sopSvc.hapusSop(target.id);
      setPesan(`"${target.judul}" dihapus.`);
      if (terbuka?.id === target.id) setTerbuka(null);
      await muatKustom();
    } catch (e) {
      setError(pesanError(e));
    }
  }

  const judulBagian =
    bagian === 'amanah'
      ? 'Papan amanah baku — struktur semi-paten, isi & PIC berubah sesuai keadaan.'
      : 'SOP berdiri sendiri buatan Anda — bebas bentuk, lengkap dengan PIC & ceklis.';

  return (
    <div className="space-y-5">
      <div>
        <h2 className={KELAS.judulHalaman}>SOP &amp; Amanah</h2>
        <p className={`mt-1 ${KELAS.judulKartu}`}>{judulBagian}</p>
        <p className={`mt-1 ${KELAS.keterangan}`}>
          Daftar tugas yang berdiri sendiri — tidak terikat acara. Isi nama PIC tiap item, centang
          saat dikerjakan, dan cetak lembar ceklisnya bila perlu.
        </p>
      </div>

      {/* Sub-navigasi bagian — pil yang membungkus sendiri di layar sempit. */}
      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        {BAGIAN.map((b) => (
          <button
            key={b.id}
            onClick={() => setBagian(b.id)}
            aria-current={bagian === b.id ? 'true' : undefined}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-center text-sm font-medium sm:px-4 ${
              bagian === b.id
                ? 'bg-gradient-to-b from-aksen-500 to-aksen-600 text-white shadow-glowAksen ring-1 ring-inset ring-white/30'
                : 'bg-white/60 text-teks-sedang ring-1 ring-inset ring-white/70 backdrop-blur-sm hover:bg-white/80 hover:text-teks-utama'
            }`}
          >
            {b.label}
          </button>
        ))}
      </div>

      {error && <p className={KELAS.error}>{error}</p>}
      {pesan && (
        <p className="rounded-kontrol bg-aksen-100/70 px-3 py-2 text-sm text-aksen-700 ring-1 ring-inset ring-aksen-200/70">
          {pesan}
        </p>
      )}

      {bagian === 'amanah' && (
        <>
          {memuatBaku ? (
            <p className="text-sm text-teks-halus">Memuat…</p>
          ) : papanBaku ? (
            <PanelItemSop sop={papanBaku} />
          ) : (
            <div className={KELAS.kosong}>
              <p>Papan baku amanah tidak dapat dimuat dari penyimpanan lokal.</p>
              <button onClick={() => void muatBaku()} className={`mt-3 ${KELAS.tombolSekunder}`}>
                Coba muat ulang
              </button>
            </div>
          )}
        </>
      )}

      {bagian === 'kustom' && !terbuka && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className={KELAS.keterangan}>{kustom.length} SOP kustom</p>
            <button onClick={bukaBaru} className={KELAS.tombolUtama}>
              Buat SOP
            </button>
          </div>

          {memuatKustom ? (
            <p className="text-sm text-teks-halus">Memuat…</p>
          ) : kustom.length === 0 ? (
            <p className={KELAS.kosong}>
              Belum ada SOP kustom — buat sendiri daftar tugas yang berulang di lembaga Anda (mis.
              &quot;SOP Jaga Malam&quot;, &quot;SOP Koperasi&quot;).
            </p>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {kustom.map((s) => {
                const ik = ikhtisarKustom[s.id] ?? { total: 0, selesai: 0, persen: 0 };
                return (
                  <li key={s.id} className={`${KELAS.kartuIsi} flex flex-col`}>
                    <h3 className={KELAS.judulKartu}>{s.judul}</h3>
                    {s.catatan && (
                      <p className={`mt-1 line-clamp-2 ${KELAS.keteranganKecil}`}>{s.catatan}</p>
                    )}
                    <p className={`mt-2 ${KELAS.keteranganKecil}`}>
                      {ik.selesai}/{ik.total} item dicentang ({ik.persen}%)
                    </p>
                    <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-netral-200">
                      <div
                        className="h-full rounded-full bg-aksen-500 transition-all"
                        style={{ width: `${ik.persen}%` }}
                      />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <button onClick={() => setTerbuka(s)} className={KELAS.tombolUtamaKecil}>
                        Buka
                      </button>
                      <button onClick={() => void duplikat(s)} className={KELAS.tombolSekunderKecil}>
                        Duplikat
                      </button>
                      <button onClick={() => setHapusTarget(s)} className={KELAS.tombolBahayaHalus}>
                        Hapus
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}

      {bagian === 'kustom' && terbuka && (
        <>
          <button onClick={() => setTerbuka(null)} className="text-sm font-medium text-aksen-700 hover:underline">
            ← Kembali ke daftar SOP kustom
          </button>
          <PanelItemSop
            sop={terbuka}
            aksiHeader={
              <>
                <button onClick={() => bukaUbahInfo(terbuka)} className={KELAS.tombolSekunderKecil}>
                  Ubah Info
                </button>
                <button onClick={() => void duplikat(terbuka)} className={KELAS.tombolSekunderKecil}>
                  Duplikat
                </button>
                <button onClick={() => setHapusTarget(terbuka)} className={KELAS.tombolBahaya}>
                  Hapus
                </button>
              </>
            }
          />
        </>
      )}

      <FormDialog
        terbuka={dialogSop !== null}
        judul={dialogSop?.mode === 'ubah' ? 'Ubah SOP' : 'Buat SOP Kustom'}
        onTutup={() => setDialogSop(null)}
        onSimpan={() => void simpanSop()}
        error={errorDialog}
      >
        <div>
          <label className={KELAS.label} htmlFor="sop-judul">
            Judul SOP
          </label>
          <input
            id="sop-judul"
            value={formSop.judul}
            onChange={(e) => setFormSop({ ...formSop, judul: e.target.value })}
            placeholder="mis. SOP Jaga Malam"
            className={`mt-1 ${KELAS.input}`}
          />
        </div>
        <div>
          <label className={KELAS.label} htmlFor="sop-catatan">
            Keterangan
          </label>
          <input
            id="sop-catatan"
            value={formSop.catatan}
            onChange={(e) => setFormSop({ ...formSop, catatan: e.target.value })}
            placeholder="mis. prosedur malam minggu, giliran santri"
            className={`mt-1 ${KELAS.input}`}
          />
        </div>
      </FormDialog>

      <KonfirmasiDialog
        terbuka={hapusTarget !== null}
        judul="Hapus SOP ini?"
        pesan={
          hapusTarget
            ? `"${hapusTarget.judul}" beserta seluruh itemnya dihapus. Tindakan ini tidak bisa dibatalkan.`
            : ''
        }
        onBatal={() => setHapusTarget(null)}
        onYa={() => void hapusSopTerpilih()}
      />
    </div>
  );
}
