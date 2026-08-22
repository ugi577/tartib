'use client';

// Halaman ?view=pengaturan (sesi 16, arahan Ahmed: "buat tab baru pengaturan
// … termasuk masukkan tab tentang ke dalam tab pengaturan ini").
//
// Tiga bagian, dipilih lewat sub-navigasi di dalam halaman agar tab utama
// tidak bertambah panjang di ponsel:
//   Umum   — identitas & kop cetak, nilai baku kalkulator porsi.
//   Data   — statistik isi basis data, cadangan/pemulihan, seed, hapus data,
//            dan client ID Google Drive (dipakai ekspor template).
//   Tentang— isi tab "Tentang" yang lama, dipindah ke sini.
//
// Pengaturan disimpan di localStorage (lib/pengaturan.ts) dan disiarkan lewat
// event agar kop cetak & kalkulator porsi langsung ikut berubah.

import { useCallback, useEffect, useState } from 'react';
import { jalankanSeed } from '../db/seed';
import {
  bacaClientId,
  bacaToken,
  hapusToken,
  simpanClientId,
  type Penyimpanan,
} from '../lib/gdrive';
import {
  bacaPengaturan,
  barisKop,
  BATAS_BUFFER,
  BATAS_CADANGAN,
  hapusPengaturan,
  PENGATURAN_BAKU,
  simpanPengaturan,
  type Pengaturan,
} from '../lib/pengaturan';
import { hitungPeralatan, hitungPorsi } from '../lib/porsi';
import { siarkanPengaturan } from '../lib/usePengaturan';
import * as cadanganSvc from '../services/cadanganService';
import { KELAS } from '../ui/kelas';
import { KonfirmasiDialog } from './AppDialog';
import { TentangView } from './TentangView';

function pesanError(e: unknown): string {
  return e instanceof Error ? e.message : 'Terjadi kesalahan';
}

type Bagian = 'umum' | 'data' | 'tentang';

const BAGIAN: ReadonlyArray<{ id: Bagian; label: string }> = [
  { id: 'umum', label: 'Umum' },
  { id: 'data', label: 'Data & Cadangan' },
  { id: 'tentang', label: 'Tentang' },
];

const LABEL_TABEL: Record<keyof cadanganSvc.IsiCadangan, string> = {
  jenisAcara: 'Jenis acara',
  template: 'Template',
  fase: 'Fase',
  templateItem: 'Item template',
  divisi: 'Divisi',
  acara: 'Acara',
  acaraDivisi: 'PIC divisi acara',
  tugas: 'Tugas',
  kelompokTamu: 'Kelompok tamu',
  rsvp: 'RSVP tamu',
  perlengkapan: 'Perlengkapan',
  evaluasi: 'Evaluasi',
};

/** Contoh hidup untuk nilai baku porsi: 100 tamu hadir, 50 santri, 20 panitia. */
const CONTOH_PORSI = { rsvpHadir: 100, jumlahSantri: 50, jumlahPanitia: 20 };

interface PropsPengaturanView {
  bagianAwal?: Bagian;
}

export function PengaturanView({ bagianAwal = 'umum' }: PropsPengaturanView) {
  const [bagian, setBagian] = useState<Bagian>(bagianAwal);

  // ── Umum ────────────────────────────────────────────────────────────────
  const [form, setForm] = useState<Pengaturan>(PENGATURAN_BAKU);
  const [pesanUmum, setPesanUmum] = useState<string | null>(null);
  const [resetPengaturanTerbuka, setResetPengaturanTerbuka] = useState(false);

  // ── Data ────────────────────────────────────────────────────────────────
  const [statistik, setStatistik] = useState<cadanganSvc.StatistikData | null>(null);
  const [pesanData, setPesanData] = useState<string | null>(null);
  const [errorData, setErrorData] = useState<string | null>(null);
  const [sibuk, setSibuk] = useState(false);
  const [pulihkanTarget, setPulihkanTarget] = useState<cadanganSvc.Cadangan | null>(null);
  const [hapusTerbuka, setHapusTerbuka] = useState(false);

  // ── Google Drive ────────────────────────────────────────────────────────
  const [clientId, setClientId] = useState('');
  const [driveTerhubung, setDriveTerhubung] = useState(false);
  const [pesanDrive, setPesanDrive] = useState<string | null>(null);

  const muatStatistik = useCallback(async () => {
    try {
      setStatistik(await cadanganSvc.hitungStatistik());
      setErrorData(null);
    } catch (e) {
      setErrorData(pesanError(e));
    }
  }, []);

  // localStorage & IndexedDB hanya ada setelah mount (prerender statis).
  useEffect(() => {
    const penyimpanan = localStorage as Penyimpanan;
    setForm(bacaPengaturan(penyimpanan));
    setClientId(bacaClientId(penyimpanan));
    setDriveTerhubung(bacaToken(penyimpanan) !== null);
    void muatStatistik();
  }, [muatStatistik]);

  // ── Aksi: pengaturan umum ───────────────────────────────────────────────

  function simpanUmum() {
    const bersih = simpanPengaturan(form, localStorage);
    setForm(bersih);
    siarkanPengaturan();
    setPesanUmum('Pengaturan tersimpan di perangkat ini.');
  }

  function kembalikanBaku() {
    hapusPengaturan(localStorage);
    setForm({ ...PENGATURAN_BAKU });
    siarkanPengaturan();
    setResetPengaturanTerbuka(false);
    setPesanUmum('Pengaturan dikembalikan ke nilai baku.');
  }

  // ── Aksi: data & cadangan ───────────────────────────────────────────────

  async function unduhCadangan() {
    setPesanData(null);
    setErrorData(null);
    setSibuk(true);
    try {
      const isi = await cadanganSvc.ambilIsiCadangan();
      const cadangan = cadanganSvc.susunCadangan(isi, new Date().toISOString());
      const nama = cadanganSvc.namaBerkasCadangan(cadangan.dibuatPada);
      const blob = new Blob([JSON.stringify(cadangan)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = nama;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setPesanData(
        `Berkas ${nama} diunduh — ${cadanganSvc.hitungBaris(isi)} baris data. Simpan di luar perangkat ini (Drive, email, atau flashdisk).`,
      );
    } catch (e) {
      setErrorData(pesanError(e));
    } finally {
      setSibuk(false);
    }
  }

  async function pilihBerkasCadangan(berkas: File) {
    setPesanData(null);
    setErrorData(null);
    try {
      setPulihkanTarget(cadanganSvc.bacaCadangan(await berkas.text()));
    } catch (e) {
      setErrorData(pesanError(e));
    }
  }

  async function jalankanPemulihan() {
    if (!pulihkanTarget) return;
    const cadangan = pulihkanTarget;
    setPulihkanTarget(null);
    setSibuk(true);
    try {
      const baris = await cadanganSvc.pulihkanCadangan(cadangan);
      await muatStatistik();
      setPesanData(`Data dipulihkan — ${baris} baris menggantikan seluruh isi aplikasi.`);
    } catch (e) {
      setErrorData(pesanError(e));
    } finally {
      setSibuk(false);
    }
  }

  async function muatUlangContoh() {
    setPesanData(null);
    setErrorData(null);
    setSibuk(true);
    try {
      await jalankanSeed();
      await muatStatistik();
      setPesanData(
        'Data baku diperiksa ulang: divisi, jenis acara, template contoh, dan template panduan ditambahkan bila hilang. Data Anda tidak diubah.',
      );
    } catch (e) {
      setErrorData(pesanError(e));
    } finally {
      setSibuk(false);
    }
  }

  async function hapusSemua() {
    setHapusTerbuka(false);
    setPesanData(null);
    setErrorData(null);
    setSibuk(true);
    try {
      await cadanganSvc.hapusSemuaData();
      await muatStatistik();
      setPesanData('Semua data dihapus. Muat ulang halaman untuk memulai dari data contoh.');
    } catch (e) {
      setErrorData(pesanError(e));
    } finally {
      setSibuk(false);
    }
  }

  // ── Aksi: Google Drive ──────────────────────────────────────────────────

  function simpanClientIdDrive() {
    simpanClientId(clientId.trim(), localStorage);
    setPesanDrive(
      clientId.trim() === ''
        ? 'Client ID dikosongkan — tombol "Simpan ke Google Drive" akan meminta client ID lagi.'
        : 'Client ID tersimpan di perangkat ini.',
    );
  }

  function putuskanDrive() {
    hapusToken(localStorage);
    setDriveTerhubung(false);
    setPesanDrive('Sesi Google Drive diputus. Unggahan berikutnya akan meminta izin lagi.');
  }

  const totalBaris = statistik
    ? cadanganSvc.TABEL_CADANGAN.reduce((jml, t) => jml + statistik[t], 0)
    : 0;

  const contohPorsi = hitungPorsi({
    ...CONTOH_PORSI,
    cadangan: form.porsiCadangan,
    bufferPersen: form.porsiBufferPersen,
  });
  const contohPeralatan = hitungPeralatan(contohPorsi, form.adaTimPencuci);
  const kop = barisKop(form);

  return (
    <div className="space-y-6">
      <div>
        <h2 className={KELAS.judulHalaman}>Pengaturan</h2>
        <p className={`mt-1 ${KELAS.keterangan}`}>
          Preferensi tersimpan di perangkat ini saja — tidak ikut terkirim ke mana pun.
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

      {bagian === 'umum' && (
        <>
          <section className={`${KELAS.kartu} p-6`}>
            <h3 className={KELAS.judulKartu}>Identitas & kop cetak</h3>
            <p className={`mt-1 ${KELAS.keterangan}`}>
              Nama lembaga ini dicetak sebagai kop di semua lembar A4: buku acara, laporan
              eksekusi, lembar tugas divisi, dan panduan template. Kosongkan bila lembar cetak
              tidak perlu berkop.
            </p>
            <div className="mt-4 space-y-3">
              <div>
                <label className={KELAS.label} htmlFor="set-organisasi">
                  Nama lembaga / panitia
                </label>
                <input
                  id="set-organisasi"
                  value={form.organisasi}
                  onChange={(e) => setForm({ ...form, organisasi: e.target.value })}
                  placeholder="mis. Ma'had Askar Qur'an"
                  className={`mt-1 ${KELAS.input}`}
                />
              </div>
              <div>
                <label className={KELAS.label} htmlFor="set-keterangan-kop">
                  Baris kedua kop (alamat / kontak)
                </label>
                <input
                  id="set-keterangan-kop"
                  value={form.keteranganKop}
                  onChange={(e) => setForm({ ...form, keteranganKop: e.target.value })}
                  placeholder="mis. Jl. Contoh No. 1 · 0812-0000-0000"
                  className={`mt-1 ${KELAS.input}`}
                />
              </div>
            </div>
            <div className={`mt-4 ${KELAS.blok} text-center`}>
              {kop.length === 0 ? (
                <p className={KELAS.keteranganKecil}>Lembar cetak tidak berkop.</p>
              ) : (
                <>
                  <p className="text-sm font-bold uppercase tracking-wide text-teks-utama">{kop[0]}</p>
                  {kop[1] ? <p className={KELAS.keteranganKecil}>{kop[1]}</p> : null}
                  <p className="mt-1 text-[11px] text-teks-redup">Pratinjau kop di kertas</p>
                </>
              )}
            </div>
          </section>

          <section className={`${KELAS.kartu} p-6`}>
            <h3 className={KELAS.judulKartu}>Nilai baku kalkulator porsi</h3>
            <p className={`mt-1 ${KELAS.keterangan}`}>
              Dipakai sebagai nilai awal kalkulator di tab Tamu &amp; Porsi. Angka di layar itu
              tetap bisa diubah per acara tanpa mengubah pengaturan ini.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <label className={KELAS.label} htmlFor="set-cadangan">
                  Porsi cadangan
                </label>
                <input
                  id="set-cadangan"
                  type="number"
                  min={BATAS_CADANGAN.min}
                  max={BATAS_CADANGAN.maks}
                  value={form.porsiCadangan}
                  onChange={(e) => setForm({ ...form, porsiCadangan: Number(e.target.value) })}
                  className={`mt-1 ${KELAS.input}`}
                />
              </div>
              <div>
                <label className={KELAS.label} htmlFor="set-buffer">
                  Buffer RSVP (%)
                </label>
                <input
                  id="set-buffer"
                  type="number"
                  min={BATAS_BUFFER.min}
                  max={BATAS_BUFFER.maks}
                  value={form.porsiBufferPersen}
                  onChange={(e) => setForm({ ...form, porsiBufferPersen: Number(e.target.value) })}
                  className={`mt-1 ${KELAS.input}`}
                />
              </div>
            </div>
            <label className="mt-3 flex items-center gap-2 text-sm text-teks-sedang">
              <input
                type="checkbox"
                checked={form.adaTimPencuci}
                onChange={(e) => setForm({ ...form, adaTimPencuci: e.target.checked })}
              />
              Ada tim pencuci (peralatan 0,6× porsi; tanpa tim pencuci 1,1× porsi)
            </label>
            <div className={`mt-4 ${KELAS.blok} ${KELAS.keterangan}`}>
              <p className="font-medium text-teks-kuat">Contoh dengan nilai di atas</p>
              <p className="mt-1">
                {CONTOH_PORSI.rsvpHadir} tamu hadir + {CONTOH_PORSI.jumlahSantri} santri +{' '}
                {CONTOH_PORSI.jumlahPanitia} panitia →{' '}
                <span className="font-semibold text-teks-utama">{contohPorsi} porsi</span> dan{' '}
                <span className="font-semibold text-teks-utama">{contohPeralatan} set peralatan</span>.
              </p>
            </div>
          </section>

          {pesanUmum && (
            <p className="rounded-kontrol bg-aksen-100/70 px-3 py-2 text-sm text-aksen-700 ring-1 ring-inset ring-aksen-200/70">
              {pesanUmum}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <button onClick={simpanUmum} className={KELAS.tombolUtama}>
              Simpan pengaturan
            </button>
            <button onClick={() => setResetPengaturanTerbuka(true)} className={KELAS.tombolSekunder}>
              Kembalikan ke nilai baku
            </button>
          </div>
        </>
      )}

      {bagian === 'data' && (
        <>
          <section className={`${KELAS.kartu} p-6`}>
            <h3 className={KELAS.judulKartu}>Isi data di perangkat ini</h3>
            <p className={`mt-1 ${KELAS.keterangan}`}>
              Total {totalBaris} baris tersimpan di penyimpanan lokal peramban (IndexedDB).
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {cadanganSvc.TABEL_CADANGAN.map((t) => (
                <div key={t} className={KELAS.blok}>
                  <p className="text-lg font-semibold text-teks-utama">{statistik ? statistik[t] : '—'}</p>
                  <p className={KELAS.keteranganKecil}>{LABEL_TABEL[t]}</p>
                </div>
              ))}
            </div>
          </section>

          <section className={`${KELAS.kartu} p-6`}>
            <h3 className={KELAS.judulKartu}>Cadangan & pemulihan</h3>
            <p className={`mt-1 ${KELAS.keterangan}`}>
              Tartib tidak punya server: menghapus data peramban atau berganti perangkat berarti
              data acara hilang. Unduh cadangan secara berkala — satu berkas .json berisi seluruh
              template, acara, tugas, tamu, dan evaluasi.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button onClick={() => void unduhCadangan()} disabled={sibuk} className={KELAS.tombolUtama}>
                Unduh cadangan (.json)
              </button>
              <label>
                <span className={KELAS.tombolSekunder}>Pulihkan dari berkas</span>
                <input
                  type="file"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void pilihBerkasCadangan(f);
                    e.target.value = '';
                  }}
                  className="sr-only"
                />
              </label>
            </div>
            <p className={`mt-2 ${KELAS.keteranganKecil}`}>
              Memulihkan akan <strong>mengganti seluruh data</strong> yang ada sekarang — sediakan
              cadangan terbaru sebelum melakukannya.
            </p>
          </section>

          <section className={`${KELAS.kartu} p-6`}>
            <h3 className={KELAS.judulKartu}>Data baku & pembersihan</h3>
            <div className="mt-3 space-y-4">
              <div>
                <p className="text-sm font-medium text-teks-kuat">Muat ulang data contoh</p>
                <p className={`mt-0.5 ${KELAS.keterangan}`}>
                  Mengembalikan divisi baku, jenis acara, template contoh, dan template panduan
                  bila terhapus. Aman diulang — data Anda tidak ditimpa.
                </p>
                <button
                  onClick={() => void muatUlangContoh()}
                  disabled={sibuk}
                  className={`mt-2 ${KELAS.tombolSekunder}`}
                >
                  Muat ulang data contoh
                </button>
              </div>
              <div>
                <p className="text-sm font-medium text-teks-kuat">Hapus semua data</p>
                <p className={`mt-0.5 ${KELAS.keterangan}`}>
                  Mengosongkan seluruh tabel di perangkat ini. Tidak bisa dibatalkan kecuali Anda
                  punya berkas cadangan.
                </p>
                <button
                  onClick={() => setHapusTerbuka(true)}
                  disabled={sibuk}
                  className={`mt-2 ${KELAS.tombolBahaya}`}
                >
                  Hapus semua data
                </button>
              </div>
            </div>
          </section>

          <section className={`${KELAS.kartu} p-6`}>
            <h3 className={KELAS.judulKartu}>Google Drive</h3>
            <p className={`mt-1 ${KELAS.keterangan}`}>
              Dipakai tombol &quot;Simpan ke Google Drive&quot; saat mengekspor template. Client ID
              dibuat sendiri di Google Cloud Console (OAuth Web, JavaScript origin = alamat
              aplikasi ini) dan hanya tersimpan di perangkat ini.
            </p>
            <div className="mt-3">
              <label className={KELAS.label} htmlFor="set-client-id">
                Client ID OAuth
              </label>
              <input
                id="set-client-id"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="xxxxx.apps.googleusercontent.com"
                className={`mt-1 ${KELAS.input}`}
              />
            </div>
            <p className={`mt-2 ${KELAS.keteranganKecil}`}>
              Status sesi: {driveTerhubung ? 'terhubung (token masih berlaku)' : 'belum terhubung'}.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={simpanClientIdDrive} className={KELAS.tombolSekunder}>
                Simpan client ID
              </button>
              <button onClick={putuskanDrive} disabled={!driveTerhubung} className={KELAS.tombolBahaya}>
                Putuskan koneksi
              </button>
            </div>
            {pesanDrive && (
              <p className="mt-3 rounded-kontrol bg-aksen-100/70 px-3 py-2 text-sm text-aksen-700 ring-1 ring-inset ring-aksen-200/70">
                {pesanDrive}
              </p>
            )}
          </section>

          {pesanData && (
            <p className="rounded-kontrol bg-aksen-100/70 px-3 py-2 text-sm text-aksen-700 ring-1 ring-inset ring-aksen-200/70">
              {pesanData}
            </p>
          )}
          {errorData && <p className={KELAS.error}>{errorData}</p>}
        </>
      )}

      {bagian === 'tentang' && <TentangView />}

      <KonfirmasiDialog
        terbuka={resetPengaturanTerbuka}
        judul="Kembalikan pengaturan ke nilai baku?"
        pesan="Kop cetak dikosongkan dan nilai baku porsi kembali ke 10 porsi cadangan, buffer 25%, dengan tim pencuci. Data acara tidak tersentuh."
        labelYa="Kembalikan"
        bahaya={false}
        onBatal={() => setResetPengaturanTerbuka(false)}
        onYa={kembalikanBaku}
      />

      <KonfirmasiDialog
        terbuka={pulihkanTarget !== null}
        judul="Ganti seluruh data dengan cadangan ini?"
        pesan={
          pulihkanTarget
            ? `Cadangan ${pulihkanTarget.dibuatPada.slice(0, 10) || 'tanpa tanggal'} berisi ${cadanganSvc.hitungBaris(pulihkanTarget.isi)} baris. Seluruh data yang ada sekarang (${totalBaris} baris) akan dihapus dan diganti. Tindakan ini tidak bisa dibatalkan.`
            : ''
        }
        labelYa="Pulihkan"
        onBatal={() => setPulihkanTarget(null)}
        onYa={() => void jalankanPemulihan()}
      />

      <KonfirmasiDialog
        terbuka={hapusTerbuka}
        judul="Hapus semua data?"
        pesan={`Seluruh ${totalBaris} baris data di perangkat ini akan dihapus — template, acara, tugas, tamu, dan evaluasi. Tidak bisa dibatalkan kecuali Anda punya berkas cadangan.`}
        labelYa="Hapus semua"
        onBatal={() => setHapusTerbuka(false)}
        onYa={() => void hapusSemua()}
      />
    </div>
  );
}
