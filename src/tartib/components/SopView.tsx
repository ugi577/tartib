'use client';

// Halaman ?view=sop — "Struktur & PIC" (Batch X, arahan Ahmed: "tambahkan
// menu SOP untuk hal bersifat semi paten, misal SOP daftar tugas/amanah/
// khidmah santri dan PICnya yg mudah ceklist, dan menu SOP customable").
//
// Batch Y: sub-tugas di dalam satu item, kategori rutin, cetak PDF multi-
// ukuran, ekspor/impor .docx. Batch Z: bagan organisasi visual.
//
// Sesi 22 — berkas ini tinggal halaman utama (dulu 2.360 baris):
//   - kepala halaman lewat HeaderView + SubNav [Struktur | SOP Kustom], tanpa
//     keterangan panjang dan tanpa tautan anchor mentah ke ?view=… yang
//     merusak basePath GitHub Pages — navigasi ke Kanvas lewat prop `onBuka`;
//   - bagan, panel daftar/cetak, form, kartu, dan menu dipecah ke
//     components/struktur/* dengan satu sumber data (lib/struktur/usePapanSop)
//     dan satu sumber aksi (lib/struktur/useAksiStruktur);
//   - perilaku SOP kustom (buat/ubah/duplikat/hapus/impor .docx) TIDAK berubah.
//
// Dua bagian dalam satu tab (aturan mobile K-21):
//   Struktur — papan baku SEMI-PATEN dari seed: struktur relatif tetap (tidak
//     dapat dihapus), isi & PIC bebas diubah, ceklis satu klik.
//   SOP Kustom — SOP berdiri sendiri buatan pengguna: buat, ubah, duplikat,
//     hapus, impor .docx. Tidak terikat acara maupun fase H-offset.

import { useCallback, useEffect, useState } from 'react';
import { seedSopAmanah } from '../db/seed';
import { bacaZip } from '../lib/impor/zip';
import { parseXmlLite } from '../lib/impor/xml';
import { dokumenXmlKeSopPapan, sopPapanDariJson, type HasilImporPapan } from '../lib/impor/dokumenSopPapan';
import { pesanError } from '../lib/struktur/usePapanSop';
import * as sopSvc from '../services/sopService';
import type { Sop } from '../types';
import { KELAS } from '../ui/kelas';
import { AppDialog, FormDialog, KonfirmasiDialog } from './AppDialog';
import { HeaderView, SubNav } from './HeaderView';
import { BaganOrganisasi } from './struktur/BaganOrganisasi';
import { PanelSopMandiri } from './struktur/PanelItemSop';
import { BarisPesan } from './struktur/UmpanBalik';

// ===== Impor .docx (Batch Y) — hasil pratinjau sebelum disimpan =====

interface PratinjauImpor {
  namaFile: string;
  hasil: HasilImporPapan;
  judul: string;
}

type Bagian = 'struktur' | 'kustom';

const BAGIAN: ReadonlyArray<{ id: Bagian; label: string }> = [
  { id: 'struktur', label: 'Struktur' },
  { id: 'kustom', label: 'SOP Kustom' },
];

export type TujuanBukaSop = 'preset' | 'canvas' | 'sop';

interface PropsSopView {
  /** Navigasi ke view lain (dari shell page.tsx) — tanpa <a href> mentah. */
  onBuka?: (view: TujuanBukaSop) => void;
}

export function SopView({ onBuka }: PropsSopView = {}) {
  const [bagian, setBagian] = useState<Bagian>('struktur');

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

  // Impor .docx papan (Batch Y).
  const [impor, setImpor] = useState<PratinjauImpor | null>(null);
  const [errorImpor, setErrorImpor] = useState<string | null>(null);
  const [sibukImpor, setSibukImpor] = useState(false);

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

  // Ikhtisar tiap kartu kustom: jumlah baris tercentang (item + sub).
  const [ikhtisarKustom, setIkhtisarKustom] = useState<Record<string, sopSvc.IkhtisarCeklis>>({});
  useEffect(() => {
    let batal = false;
    void (async () => {
      const hasil: Record<string, sopSvc.IkhtisarCeklis> = {};
      for (const s of kustom) {
        try {
          const [it, sub] = await Promise.all([sopSvc.daftarItemSop(s.id), sopSvc.daftarSubItemSop(s.id)]);
          hasil[s.id] = sopSvc.ikhtisarCeklis([...it, ...sub]);
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
        await muatKustom();
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

  // Impor .docx → pratinjau (pola panel impor template, K-18/K-24): berkas
  // ekspor Tartib membawa tartib/sop.json (round-trip penuh); berkas Word
  // biasa jatuh ke heuristik ☐ / ↳.
  async function pilihBerkasImpor(berkas: File) {
    setErrorImpor(null);
    setError(null);
    try {
      const zip = await bacaZip(await berkas.arrayBuffer());
      const jsonEntry = zip.get('tartib/sop.json');
      let hasil: HasilImporPapan;
      if (jsonEntry) {
        hasil = sopPapanDariJson(new TextDecoder().decode(jsonEntry));
      } else {
        const xmlBytes = zip.get('word/document.xml');
        if (!xmlBytes) throw new Error('Bukan dokumen Word — tidak ada word/document.xml di dalamnya');
        hasil = dokumenXmlKeSopPapan(parseXmlLite(new TextDecoder().decode(xmlBytes)));
      }
      if (hasil.items.length === 0) {
        throw new Error('Tidak ditemukan item ceklis (baris berawalan ☐) di dokumen ini');
      }
      setImpor({
        namaFile: berkas.name,
        hasil,
        judul: hasil.judulDokumen || berkas.name.replace(/\.docx$/i, '') || 'SOP hasil impor',
      });
    } catch (e) {
      setErrorImpor(pesanError(e));
    }
  }

  async function jalankanImpor() {
    if (!impor) return;
    setSibukImpor(true);
    try {
      const baru = await sopSvc.imporSopPapan({
        judul: impor.judul,
        catatan: impor.hasil.catatan ?? undefined,
        items: impor.hasil.items,
      });
      setImpor(null);
      setPesan(
        `SOP "${baru.judul}" diimpor (${impor.hasil.items.length} item` +
          `${impor.hasil.dariJsonTartib ? '' : ' — PIC & rutin hasil uraian baris'}) — ceklisnya kosong, siap dipakai.`,
      );
      await muatKustom();
      setBagian('kustom');
      setTerbuka(baru);
    } catch (e) {
      setErrorImpor(pesanError(e));
    } finally {
      setSibukImpor(false);
    }
  }

  return (
    <div className="space-y-4">
      <HeaderView
        judul="Struktur & PIC"
        subNav={<SubNav daftar={BAGIAN} aktif={bagian} onPilih={setBagian} />}
        aksi={
          onBuka ? (
            <button
              type="button"
              onClick={() => onBuka('canvas')}
              aria-label="Buka Kanvas Cetak"
              title="Kanvas Cetak"
              className={KELAS.tombolIkon}
            >
              🖨️
            </button>
          ) : undefined
        }
      />

      {error && <p className={KELAS.error}>{error}</p>}
      {pesan && <BarisPesan pesan={pesan} onTutup={() => setPesan(null)} />}

      {bagian === 'struktur' &&
        (memuatBaku ? (
          <p className="text-sm text-teks-halus">Memuat…</p>
        ) : papanBaku ? (
          <BaganOrganisasi sop={papanBaku} />
        ) : (
          <div className={KELAS.kosong}>
            <p>Struktur PIC tidak dapat dimuat dari penyimpanan lokal.</p>
            <button type="button" onClick={() => void muatBaku()} className={`mt-3 ${KELAS.tombolSekunder}`}>
              Coba muat ulang
            </button>
          </div>
        ))}

      {bagian === 'kustom' && !terbuka && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className={KELAS.keterangan}>{kustom.length} SOP kustom</p>
            <div className="flex flex-wrap gap-1.5">
              <label>
                <span className={KELAS.tombolSekunderKecil}>Impor .docx</span>
                <input
                  type="file"
                  accept=".docx"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void pilihBerkasImpor(f);
                    e.target.value = '';
                  }}
                  className="sr-only"
                />
              </label>
              <button type="button" onClick={bukaBaru} className={KELAS.tombolUtamaKecil}>
                Buat SOP
              </button>
            </div>
          </div>

          {errorImpor && <p className={KELAS.error}>{errorImpor}</p>}

          {memuatKustom ? (
            <p className="text-sm text-teks-halus">Memuat…</p>
          ) : kustom.length === 0 ? (
            <p className={KELAS.kosong}>
              Belum ada SOP kustom — buat sendiri daftar tugas yang berulang di lembaga Anda (mis.
              &quot;SOP Jaga Malam&quot;, &quot;SOP Koperasi&quot;), atau impor dari berkas .docx.
            </p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {kustom.map((s) => {
                const ik = ikhtisarKustom[s.id] ?? { total: 0, selesai: 0, persen: 0 };
                return (
                  <li key={s.id} className={`${KELAS.kartuIsi} flex flex-col`}>
                    <h3 className={KELAS.judulKartu}>{s.judul}</h3>
                    {s.catatan && <p className={`mt-1 line-clamp-2 ${KELAS.keteranganKecil}`}>{s.catatan}</p>}
                    <p className={`mt-2 ${KELAS.keteranganKecil}`}>
                      {ik.selesai}/{ik.total} item dicentang ({ik.persen}%)
                    </p>
                    <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-netral-200">
                      <div className="h-full rounded-full bg-aksen-500 transition-all" style={{ width: `${ik.persen}%` }} />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <button type="button" onClick={() => setTerbuka(s)} className={KELAS.tombolUtamaKecil}>
                        Buka
                      </button>
                      <button type="button" onClick={() => void duplikat(s)} className={KELAS.tombolSekunderKecil}>
                        Duplikat
                      </button>
                      <button type="button" onClick={() => setHapusTarget(s)} className={KELAS.tombolBahayaHalus}>
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
          <button
            type="button"
            onClick={() => setTerbuka(null)}
            className="text-sm font-medium text-aksen-700 hover:underline"
          >
            ← Kembali ke daftar SOP kustom
          </button>
          <PanelSopMandiri
            sop={terbuka}
            aksiHeader={
              <>
                <button type="button" onClick={() => bukaUbahInfo(terbuka)} className={KELAS.tombolSekunderKecil}>
                  Ubah Info
                </button>
                <button type="button" onClick={() => void duplikat(terbuka)} className={KELAS.tombolSekunderKecil}>
                  Duplikat
                </button>
                <button type="button" onClick={() => setHapusTarget(terbuka)} className={KELAS.tombolBahaya}>
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

      {/* Pratinjau impor (pola pratinjau template K-19: pengguna menghakimi
          hasil sebelum menyimpan). */}
      <AppDialog terbuka={impor !== null} judul="Pratinjau Impor SOP" onTutup={() => setImpor(null)} lebar="lg">
        {impor && (
          <div className="space-y-3">
            <p className={KELAS.keteranganKecil}>
              Berkas: {impor.namaFile} ·{' '}
              {impor.hasil.dariJsonTartib
                ? 'berkas ekspor Tartib — seluruh data (PIC, rutin, sub-tugas) ikut'
                : 'dokumen biasa — item dari baris ☐, atribut diurai dari teks'}
            </p>
            <div>
              <label className={KELAS.label} htmlFor="sop-impor-judul">
                Judul SOP
              </label>
              <input
                id="sop-impor-judul"
                value={impor.judul}
                onChange={(e) => setImpor({ ...impor, judul: e.target.value })}
                className={`mt-1 ${KELAS.input}`}
              />
            </div>
            <p className={KELAS.keterangan}>
              {impor.hasil.items.length} item ·{' '}
              {impor.hasil.items.reduce((n, i) => n + (i.sub?.length ?? 0), 0)} sub-tugas · PIC terisi{' '}
              {impor.hasil.items.filter((i) => i.picNama).length}
            </p>
            {impor.hasil.subTanpaInduk.length > 0 && (
              <p className={KELAS.error}>
                {impor.hasil.subTanpaInduk.length} sub-tugas tanpa item induk dilewati:{' '}
                {impor.hasil.subTanpaInduk.join(', ')}
              </p>
            )}
            {impor.hasil.paragrafDiabaikan > 0 && (
              <p className={KELAS.keteranganKecil}>{impor.hasil.paragrafDiabaikan} paragraf bukan ceklis diabaikan.</p>
            )}
            <div className={`max-h-56 space-y-1 overflow-y-auto ${KELAS.blok}`}>
              {impor.hasil.items.map((it, i) => (
                <div key={i} className="text-sm text-teks-kuat">
                  ☐ {it.judul}
                  {it.picNama ? ` — PIC: ${it.picNama}` : ''}
                  {it.rutin ? ` — Rutin: ${it.rutin}` : ''}
                  {(it.sub ?? []).map((s, j) => (
                    <div key={j} className="pl-5 text-teks-sedang">
                      ↳ {s.judul}
                      {s.picNama ? ` — PIC: ${s.picNama}` : ''}
                    </div>
                  ))}
                </div>
              ))}
            </div>
            {errorImpor && <p className={KELAS.error}>{errorImpor}</p>}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setImpor(null)} className={KELAS.tombolSekunder}>
                Batal
              </button>
              <button type="button" onClick={() => void jalankanImpor()} disabled={sibukImpor} className={KELAS.tombolUtama}>
                {sibukImpor ? 'Menyimpan…' : 'Simpan sebagai SOP'}
              </button>
            </div>
          </div>
        )}
      </AppDialog>

      <KonfirmasiDialog
        terbuka={hapusTarget !== null}
        judul="Hapus SOP ini?"
        pesan={
          hapusTarget
            ? `"${hapusTarget.judul}" beserta seluruh item dan sub-tugasnya dihapus. Tindakan ini tidak bisa dibatalkan.`
            : ''
        }
        onBatal={() => setHapusTarget(null)}
        onYa={() => void hapusSopTerpilih()}
      />
    </div>
  );
}
