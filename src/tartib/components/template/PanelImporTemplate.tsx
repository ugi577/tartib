'use client';

// Panel impor SOP dari dokumen (Batch W): berkas .docx biasa diparse dengan
// heuristik fase/item; berkas hasil ekspor Tartib membawa tartib/template.json
// (data lengkap, round-trip tanpa kehilangan). Pratinjau menampilkan daftar
// item yang TIDAK diimpor (K-19) sebelum pengguna memutuskan menyimpan.

import { useState } from 'react';
import { bacaZip } from '../../lib/impor/zip';
import { parseXmlLite } from '../../lib/impor/xml';
import { dokumenXmlKeSop, sopDariJson, type HasilImporDokumen } from '../../lib/impor/dokumenSop';
import { formatOffsetHari } from '../../lib/tanggal';
import * as ts from '../../services/templateService';
import type { Divisi, JenisAcara } from '../../types';
import { AppDialog } from '../AppDialog';
import { KELAS } from '../../ui/kelas';
import { pesanError } from './bersama';

type Props = {
  jenisAcara: JenisAcara[];
  divisiList: Divisi[];
  tersimpan: () => void;
};

export function PanelImporTemplate({ jenisAcara, divisiList, tersimpan }: Props) {
  const [impor, setImpor] = useState<{ namaFile: string; hasil: HasilImporDokumen } | null>(null);
  const [formImpor, setFormImpor] = useState({ nama: '', jenisAcaraId: '' });
  const [errorImpor, setErrorImpor] = useState<string | null>(null);
  const [menyimpanImpor, setMenyimpanImpor] = useState(false);
  const [pesanImpor, setPesanImpor] = useState<string | null>(null);

  async function pilihBerkasImpor(f: File) {
    setPesanImpor(null);
    setErrorImpor(null);
    try {
      const zip = await bacaZip(await f.arrayBuffer());
      // Berkas ekspor Tartib membawa data LENGKAP (tartib/template.json) —
      // dipakai dulu agar round-trip ekspor→impor tanpa kehilangan; berkas
      // biasa jatuh ke heuristik document.xml.
      const jsonEntry = zip.get('tartib/template.json');
      let hasil: HasilImporDokumen;
      if (jsonEntry) {
        hasil = sopDariJson(new TextDecoder().decode(jsonEntry));
      } else {
        const xmlBytes = zip.get('word/document.xml');
        if (!xmlBytes) throw new Error('Bukan dokumen Word — tidak ada word/document.xml di dalamnya');
        hasil = dokumenXmlKeSop(parseXmlLite(new TextDecoder().decode(xmlBytes)));
      }
      if (hasil.fases.length === 0) {
        throw new Error('Tidak ditemukan fase SOP (heading berpola H-30 / Hari-H / H+1) di dokumen ini');
      }
      setFormImpor((s) => {
        const namaJenis = hasil.jenisAcaraNama;
        const jenisDariBerkas = namaJenis
          ? jenisAcara.find((j) => j.nama.toLowerCase() === namaJenis.toLowerCase())
          : undefined;
        return {
          nama: hasil.judulDokumen || 'SOP hasil impor',
          jenisAcaraId: jenisDariBerkas?.id ?? s.jenisAcaraId ?? jenisAcara[0]?.id ?? '',
        };
      });
      setImpor({ namaFile: f.name, hasil });
    } catch (e) {
      setErrorImpor(pesanError(e));
    }
  }

  // Peta nama divisi → id; item tanpa tebakan atau dengan divisi tak dikenal
  // jatuh ke Ketua Panitia (perkiraan — bisa diubah di editor template).
  function idDivisiUntukItem(tebakan: string | null): string | null {
    const nama = tebakan ?? 'Ketua Panitia';
    const d = divisiList.find((x) => x.nama.toLowerCase() === nama.toLowerCase());
    return d?.id ?? null;
  }

  async function simpanImpor() {
    if (!impor) return;
    setMenyimpanImpor(true);
    try {
      const totalItem = impor.hasil.fases.reduce((s, f) => s + f.items.length, 0);
      const denganTebakan = impor.hasil.fases.reduce(
        (s, f) => s + f.items.filter((i) => i.divisiTebakan !== null).length,
        0,
      );
      const fallback = totalItem - denganTebakan;
      const tanpaDivisi = impor.hasil.fases.some((f) =>
        f.items.some((i) => idDivisiUntukItem(i.divisiTebakan) === null),
      );
      if (tanpaDivisi) throw new Error('Divisi bawaan tidak ditemukan — periksa data divisi aplikasi');

      // Catatan asli dipertahankan untuk berkas ekspor Tartib (JSON); berkas
      // biasa diberi keterangan asal impor.
      const catatanImpor =
        impor.hasil.catatan ??
        `Diimpor dari "${impor.namaFile}" — ${impor.hasil.judulDokumen}${
          impor.hasil.subJudul ? ` (${impor.hasil.subJudul})` : ''
        }`;
      const baru = await ts.imporTemplate({
        jenisAcaraId: formImpor.jenisAcaraId,
        nama: formImpor.nama,
        catatan: catatanImpor,
        fases: impor.hasil.fases.map((f) => ({
          label: f.label,
          offsetHari: f.offsetHari,
          items: f.items.map((i) => ({
            judul: i.judul,
            divisiId: idDivisiUntukItem(i.divisiTebakan) as string,
            wajib: i.wajib ?? true,
            catatan: i.catatan ?? '',
            rumusQty: i.rumusQty ?? undefined,
          })),
        })),
      });
      setImpor(null);
      setPesanImpor(
        `Template "${baru.nama}" dibuat: ${impor.hasil.fases.length} fase · ${totalItem} item (${denganTebakan} divisi ditebak dari kata kunci, ${fallback} memakai Ketua Panitia). Template baru muncul di daftar ini — buka untuk menduplikasi atau mengubahnya.`,
      );
      tersimpan();
    } catch (e) {
      setErrorImpor(pesanError(e));
    } finally {
      setMenyimpanImpor(false);
    }
  }

  return (
    <>
      <div className={`mt-6 ${KELAS.kartuIsi}`}>
        <h3 className="font-medium text-teks-utama">Import SOP Dokumen</h3>
        <p className="mt-1 text-sm text-teks-halus">
          Pilih berkas dokumen (mis. buku panduan SOP). Fase berpola H-30 / Hari-H / H+1 dan item
          ceklisnya menjadi template baru yang bisa dibaca, diduplikasi, dan diubah.
        </p>
        {pesanImpor && (
          <p className="mt-3 rounded-lg bg-aksen-50 px-3 py-2 text-sm text-aksen-700">{pesanImpor}</p>
        )}
        {errorImpor && <p className={`mt-3 ${KELAS.error}`}>{errorImpor}</p>}
        {/* Tombol pilih berkas memakai tombol aplikasi (bukan ::file-selector-
            button bawaan browser — di WebView teksnya tak tampil dan ukurannya
            membengkak; sesi 15, laporan Ahmed). Input asli disembunyikan dan
            dipicu lewat label; tanpa batasan jenis berkas. */}
        <label className="mt-3 block">
          <span className={KELAS.tombolUtama}>Pilih File</span>
          <input
            type="file"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void pilihBerkasImpor(f);
              // Reset agar berkas yang sama bisa dipilih ulang
              e.target.value = '';
            }}
            className="sr-only"
          />
        </label>
      </div>

      {/* Dialog pratinjau impor (Batch W) */}
      {impor && (
        <AppDialog
          terbuka
          judul={`Pratinjau Impor — ${impor.namaFile}`}
          onTutup={() => setImpor(null)}
          lebar="lg"
        >
          <p className="text-sm text-teks-sedang">
            Ditemukan <strong>{impor.hasil.fases.length} fase</strong> dan{' '}
            <strong>{impor.hasil.fases.reduce((s, f) => s + f.items.length, 0)} item</strong> dari{' '}
            &ldquo;{impor.hasil.judulDokumen}&rdquo;
            {impor.hasil.subJudul ? ` (${impor.hasil.subJudul})` : ''}.
            {impor.hasil.itemLuarLinimasa.length > 0 &&
              ` ${impor.hasil.itemLuarLinimasa.length} item ☐ di luar linimasa tidak diimpor — periksa daftarnya di bawah.`}
          </p>
          <div className="mt-3 space-y-2">
            {impor.hasil.fases.map((f) => (
              <div
                key={f.label}
                className="flex flex-wrap items-center justify-between gap-2 rounded-kontrol bg-permukaan-halus px-3 py-2 text-sm"
              >
                <span className="font-medium text-teks-kuat">{f.label}</span>
                <span className="text-xs text-teks-halus">
                  {formatOffsetHari(f.offsetHari)} · {f.items.length} item
                </span>
              </div>
            ))}
          </div>
          {impor.hasil.itemLuarLinimasa.length > 0 && (
            <details className="mt-2 rounded-kontrol border border-garis bg-permukaan-halus px-3 py-2 text-sm">
              <summary className="cursor-pointer font-medium text-teks-kuat">
                {impor.hasil.itemLuarLinimasa.length} item di luar linimasa yang TIDAK diimpor —
                periksa sebelum menyimpan
              </summary>
              <p className="mt-2 text-xs text-teks-halus">
                Item ☐ yang berada di luar fase (setelah heading BAGIAN) tidak menjadi tugas.
                Pastikan tidak ada item berjadwal yang terbuang.
              </p>
              <ul className="mt-2 max-h-56 space-y-2 overflow-y-auto text-xs text-teks-sedang">
                {Object.entries(
                  impor.hasil.itemLuarLinimasa.reduce<Record<string, string[]>>((acc, it) => {
                    const k = it.bagian ?? 'Tanpa heading bagian';
                    (acc[k] ??= []).push(it.teks);
                    return acc;
                  }, {}),
                ).map(([bagian, items]) => (
                  <li key={bagian}>
                    <span className="font-medium text-teks-kuat">
                      {bagian} · {items.length} item
                    </span>
                    <ul className="mt-1 list-disc space-y-0.5 pl-4">
                      {items.map((teks, idx) => (
                        <li key={idx}>{teks}</li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </details>
          )}
          {(() => {
            const total = impor.hasil.fases.reduce((s, f) => s + f.items.length, 0);
            const fallback = impor.hasil.fases.reduce(
              (s, f) => s + f.items.filter((i) => i.divisiTebakan === null).length,
              0,
            );
            return (
              <p className="mt-3 text-sm text-teks-halus">
                Divisi tiap item adalah perkiraan dari kata kunci judulnya:{' '}
                {total - fallback} item tertebak, {fallback} tanpa kecocokan dan memakai Ketua
                Panitia. Periksa dan ubah di editor template setelah impor.
              </p>
            );
          })()}
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-teks-kuat">Nama template</span>
              <input
                value={formImpor.nama}
                onChange={(e) => setFormImpor({ ...formImpor, nama: e.target.value })}
                className={KELAS.input}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-teks-kuat">Jenis acara</span>
              <select
                value={formImpor.jenisAcaraId}
                onChange={(e) => setFormImpor({ ...formImpor, jenisAcaraId: e.target.value })}
                className={KELAS.input}
              >
                {jenisAcara.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.nama}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {errorImpor && <p className={`mt-3 ${KELAS.error}`}>{errorImpor}</p>}
          <div className="mt-5 flex justify-end gap-2">
            <button onClick={() => setImpor(null)} className={KELAS.tombolSekunder}>
              Batal
            </button>
            <button
              onClick={() => void simpanImpor()}
              disabled={menyimpanImpor || formImpor.nama.trim() === '' || !formImpor.jenisAcaraId}
              className={KELAS.tombolUtama}
            >
              {menyimpanImpor ? 'Menyimpan…' : 'Simpan sebagai Template'}
            </button>
          </div>
        </AppDialog>
      )}
    </>
  );
}
