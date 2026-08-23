'use client';

// Panel ekspor & cetak template (Batch W / sesi 15): unduh .docx lokal,
// simpan ke Google Drive (OAuth implicit via popup), dan picu cetak panduan
// A4. Struktur fase & item selalu diambil ulang dari penyimpanan agar tidak
// bergantung pada state editor yang sedang dimuat.

import { useState } from 'react';
import { unduhBerkas } from '../../lib/unduh';
import { tulisDocx, type DataTulisDocx } from '../../lib/ekspor/tulisDocx';
import {
  bacaClientId,
  bacaToken,
  bacaTokenDariHash,
  bangunUrlOtorisasi,
  buatState,
  simpanClientId,
  simpanToken,
  unggahKeDrive,
  type TokenDrive,
} from '../../lib/gdrive';
import * as ts from '../../services/templateService';
import { daftarDivisi } from '../../services/divisiService';
import type { Template } from '../../types';
import { KELAS } from '../../ui/kelas';
import { pesanError } from './bersama';

type Props = {
  template: Template;
  jenisNama: string;
  memuatEditor: boolean;
  onCetakPanduan: () => void;
};

export function PanelEksporTemplate({ template, jenisNama, memuatEditor, onCetakPanduan }: Props) {
  const [tampilkanFormClientId, setTampilkanFormClientId] = useState(false);
  const [clientIdDrive, setClientIdDrive] = useState('');
  const [mengunggahDrive, setMengunggahDrive] = useState(false);
  const [pesanEkspor, setPesanEkspor] = useState<string | null>(null);
  const [errorEkspor, setErrorEkspor] = useState<string | null>(null);

  function namaBerkasDocx(): string {
    return `SOP-${template.nama.replace(/\s+/g, '-') ?? 'template'}.docx`;
  }

  async function dataDocxUntukEkspor(): Promise<DataTulisDocx> {
    const [faseList, itemList, divisiList] = await Promise.all([
      ts.ambilFaseTemplate(template.id),
      ts.ambilItemTemplate(template.id),
      daftarDivisi(),
    ]);
    const divisiMap = new Map(divisiList.map((d) => [d.id, d.nama]));
    return {
      nama: template.nama,
      jenisNama,
      catatan: template.catatan || undefined,
      versi: template.versi,
      fases: faseList.map((f) => ({
        label: f.label,
        offsetHari: f.offsetHari,
        urutan: f.urutan,
        items: itemList
          .filter((i) => i.faseId === f.id)
          .map((i) => ({
            judul: i.judul,
            divisi: divisiMap.get(i.divisiId),
            catatan: i.catatan || undefined,
            wajib: i.wajib,
            rumusQty: i.rumusQty,
          })),
      })),
    };
  }

  async function unduhDocx() {
    setPesanEkspor(null);
    setErrorEkspor(null);
    try {
      const data = await dataDocxUntukEkspor();
      const berkas = await tulisDocx(data);
      const nama = namaBerkasDocx();
      const hasil = await unduhBerkas(
        nama,
        new Blob([berkas], {
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        }),
      );
      if (hasil.dibatalkan) return;
      setPesanEkspor(
        hasil.cara === 'share'
          ? `Berkas ${nama} dibagikan — bisa dibuka di Word/LibreOffice dan diimpor ulang di tab Template.`
          : `Berkas ${nama} diunduh — bisa dibuka di Word/LibreOffice dan diimpor ulang di tab Template.`,
      );
    } catch (e) {
      setErrorEkspor(pesanError(e));
    }
  }

  // Polling popup OAuth: saat popup masih di accounts.google.com (cross-origin)
  // pembacaan location melempar — ditangkap dan polling dilanjutkan; setelah
  // redirect balik ke origin aplikasi, hash berisi access_token.
  function tungguTokenPopup(w: Window, state: string): Promise<TokenDrive> {
    return new Promise((resolve, reject) => {
      let upaya = 0;
      const interval = window.setInterval(() => {
        upaya += 1;
        if (w.closed) {
          window.clearInterval(interval);
          reject(new Error('Jendela otorisasi Google ditutup sebelum selesai — coba lagi.'));
          return;
        }
        let hash = '';
        try {
          hash = w.location.hash;
        } catch {
          return; // masih di domain Google — lanjut menunggu
        }
        if (hash.includes('access_token') || hash.includes('error')) {
          window.clearInterval(interval);
          try {
            resolve(bacaTokenDariHash(hash, state));
          } catch (e) {
            reject(e);
          }
          return;
        }
        if (upaya >= 240) {
          window.clearInterval(interval);
          reject(new Error('Waktu otorisasi Google habis — coba lagi.'));
        }
      }, 500);
    });
  }

  async function alurDrive(clientId: string) {
    setMengunggahDrive(true);
    setErrorEkspor(null);
    try {
      let token = bacaToken(localStorage);
      if (!token) {
        const state = buatState();
        const w = window.open('', 'tartib-gdrive', 'popup,width=520,height=620');
        if (!w) throw new Error('Popup diblokir browser — izinkan popup untuk aplikasi ini lalu coba lagi.');
        w.location.replace(bangunUrlOtorisasi(clientId, `${window.location.origin}/`, state));
        token = await tungguTokenPopup(w, state);
        simpanToken(token, localStorage);
      }
      const data = await dataDocxUntukEkspor();
      const berkas = await tulisDocx(data);
      const blob = new Blob([berkas], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      const hasil = await unggahKeDrive(blob, namaBerkasDocx(), token);
      setPesanEkspor(
        hasil.webViewLink
          ? `Tersimpan di Google Drive: ${hasil.nama} — buka: ${hasil.webViewLink}`
          : `Tersimpan di Google Drive: ${hasil.nama}.`,
      );
    } catch (e) {
      setErrorEkspor(pesanError(e));
    } finally {
      setMengunggahDrive(false);
    }
  }

  async function eksporKeDrive() {
    setPesanEkspor(null);
    setErrorEkspor(null);
    const tersimpan = bacaClientId(localStorage);
    if (tersimpan === '') {
      setClientIdDrive('');
      setTampilkanFormClientId(true);
      return;
    }
    await alurDrive(tersimpan);
  }

  async function simpanClientIdDrive() {
    const clientId = clientIdDrive.trim();
    if (clientId === '') {
      setErrorEkspor('Client ID tidak boleh kosong');
      return;
    }
    simpanClientId(clientId, localStorage);
    setTampilkanFormClientId(false);
    await alurDrive(clientId);
  }

  return (
    <div className={`mb-4 ${KELAS.kartuIsi}`}>
      <h3 className="font-medium text-teks-utama">Ekspor &amp; Cetak Template</h3>
      <p className="mt-1 text-sm text-teks-halus">
        Unduh sebagai dokumen Word (.docx) untuk dibagikan atau dicadangkan, simpan ke Google Drive,
        atau cetak panduan pengisian A4 — formulir kertas berisi fase &amp; item dengan kolom
        tanggal dan PIC untuk diisi manual. Berkas .docx bisa diimpor ulang di tab Template tanpa
        kehilangan struktur fase &amp; item.
      </p>
      {pesanEkspor && (
        <p className="mt-3 rounded-lg bg-aksen-50 px-3 py-2 text-sm text-aksen-700">{pesanEkspor}</p>
      )}
      {errorEkspor && <p className={`mt-3 ${KELAS.error}`}>{errorEkspor}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={() => void unduhDocx()}
          disabled={memuatEditor}
          className={`${KELAS.tombolUtama} disabled:cursor-not-allowed disabled:opacity-40`}
        >
          Unduh .docx
        </button>
        <button
          onClick={() => void eksporKeDrive()}
          disabled={memuatEditor || mengunggahDrive}
          className={`${KELAS.tombolSekunder} disabled:cursor-not-allowed disabled:opacity-40`}
        >
          {mengunggahDrive ? 'Mengunggah…' : 'Simpan ke Google Drive'}
        </button>
        <button
          onClick={onCetakPanduan}
          disabled={memuatEditor}
          className={`${KELAS.tombolSekunder} disabled:cursor-not-allowed disabled:opacity-40`}
        >
          Cetak Panduan (A4)
        </button>
      </div>
      {tampilkanFormClientId && (
        <div className="mt-3 rounded-kontrol bg-permukaan-halus p-3">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-teks-kuat">
              Client ID Google (dari Google Cloud Console)
            </span>
            <input
              value={clientIdDrive}
              onChange={(e) => setClientIdDrive(e.target.value)}
              placeholder="mis. 1234567890-abcd.apps.googleusercontent.com"
              className={KELAS.input}
            />
            <span className="mt-1 block text-xs text-teks-redup">
              OAuth perlu client ID untuk aplikasi ini: daftarkan di Google Cloud Console (Authorized
              JavaScript origins & redirect URIs diisi origin aplikasi ini) lalu tempel di sini. Client ID
              hanya disimpan di browser ini.
            </span>
          </label>
          <div className="mt-3 flex justify-end gap-2">
            <button onClick={() => setTampilkanFormClientId(false)} className={KELAS.tombolSekunderKecil}>
              Batal
            </button>
            <button
              onClick={() => void simpanClientIdDrive()}
              disabled={mengunggahDrive}
              className={KELAS.tombolUtamaKecil}
            >
              {mengunggahDrive ? 'Mengunggah…' : 'Simpan & Lanjut'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
