'use client';

// Dialog tambah/ubah jabatan (bagan) atau item (daftar) — sesi 22, dulu
// ditulis dua kali di SopView. Variasi 'bagan' memakai pilihan Tingkat
// (tier), variasi 'daftar' memakai kategori rutin bebas + catatan.
//
// Tingkat di bagan: bila item punya `rutin` di luar tiga tier utama (mis.
// 'Harian' yang diisi dari mode daftar), nilai itu ditampilkan sebagai opsi
// ke-4 "Lainnya (rutin: …)" supaya tidak ditimpa diam-diam saat disimpan
// (temuan [17]). Tidak ada placeholder nama pribadi (temuan [12]).

import { FormDialog } from '../AppDialog';
import { PemilihIkonManual } from '../PemilihIkonManual';
import { KELAS } from '../../ui/kelas';
import type { LabelStruktur } from '../../lib/struktur/menuStruktur';
import type { FormJabatanNilai } from '../../lib/struktur/useAksiStruktur';
import { SARAN_RUTIN, TIER_UTAMA } from './bersama';

export type VariasiStruktur = 'bagan' | 'daftar';

interface PropsFormJabatan {
  terbuka: boolean;
  mode: 'tambah' | 'ubah';
  form: FormJabatanNilai;
  onUbah: (form: FormJabatanNilai) => void;
  onSimpan: () => void;
  onTutup: () => void;
  error: string | null;
  variasi: VariasiStruktur;
  label: LabelStruktur;
}

export function FormJabatan({ terbuka, mode, form, onUbah, onSimpan, onTutup, error, variasi, label }: PropsFormJabatan) {
  const p = `struktur-${variasi}-jabatan`;
  const bagan = variasi === 'bagan';
  const rutinDiLuarTier = bagan && !TIER_UTAMA.includes(form.rutin);

  return (
    <FormDialog
      terbuka={terbuka}
      judul={`${mode === 'ubah' ? 'Ubah' : 'Tambah'} ${label.item}`}
      onTutup={onTutup}
      onSimpan={onSimpan}
      error={error}
    >
      <PemilihIkonManual
        judul={form.judul}
        catatan={form.catatan}
        rutin={form.rutin}
        jenis="jabatan"
        label={bagan ? 'Ikon Jabatan / Posisi' : 'Ikon Item / Amanah'}
        onUbahCatatan={(catatan) => onUbah({ ...form, catatan })}
      />

      <div>
        <label className={KELAS.label} htmlFor={`${p}-judul`}>
          {bagan ? 'Nama jabatan' : 'Amanah / tugas'}
        </label>
        <input
          id={`${p}-judul`}
          value={form.judul}
          onChange={(e) => onUbah({ ...form, judul: e.target.value })}
          placeholder={bagan ? 'mis. BENDAHARA' : 'mis. Imam shalat Maghrib'}
          className={`mt-1 ${KELAS.input}`}
        />
      </div>
      <div>
        <label className={KELAS.label} htmlFor={`${p}-pic`}>
          Nama PIC (santri / pengurus)
        </label>
        <input
          id={`${p}-pic`}
          value={form.picNama}
          onChange={(e) => onUbah({ ...form, picNama: e.target.value })}
          placeholder="Boleh dikosongkan dulu"
          className={`mt-1 ${KELAS.input}`}
        />
      </div>

      {bagan ? (
        <div>
          <label className={KELAS.label} htmlFor={`${p}-tier`}>
            Tingkat
          </label>
          <select
            id={`${p}-tier`}
            value={form.rutin}
            onChange={(e) => onUbah({ ...form, rutin: e.target.value })}
            className={`mt-1 ${KELAS.input}`}
          >
            <option value="Pimpinan">Pimpinan (paling atas)</option>
            <option value="Pengurus Inti">Pengurus Inti</option>
            <option value="Divisi">Divisi</option>
            {rutinDiLuarTier && (
              <option value={form.rutin}>
                {form.rutin ? `Lainnya (rutin: ${form.rutin})` : 'Lainnya (tanpa tingkat)'}
              </option>
            )}
          </select>
          {rutinDiLuarTier && (
            <p className={`mt-1 ${KELAS.keteranganKecil}`}>
              Nilai ini dipertahankan apa adanya dan tampil di grup &quot;Lainnya&quot;. Pilih Pimpinan / Pengurus Inti /
              Divisi bila ingin memasukkannya ke bagan utama.
            </p>
          )}
        </div>
      ) : (
        <>
          <div>
            <label className={KELAS.label} htmlFor={`${p}-rutin`}>
              Kategori rutin
            </label>
            <input
              id={`${p}-rutin`}
              list={`${p}-saran-rutin`}
              value={form.rutin}
              onChange={(e) => onUbah({ ...form, rutin: e.target.value })}
              placeholder="mis. Harian — boleh dikosongkan"
              className={`mt-1 ${KELAS.input}`}
            />
            <datalist id={`${p}-saran-rutin`}>
              {SARAN_RUTIN.map((r) => (
                <option key={r} value={r} />
              ))}
            </datalist>
          </div>
          <div>
            <label className={KELAS.label} htmlFor={`${p}-catatan`}>
              Catatan
            </label>
            <input
              id={`${p}-catatan`}
              value={form.catatan}
              onChange={(e) => onUbah({ ...form, catatan: e.target.value })}
              placeholder="mis. giliran per pekan"
              className={`mt-1 ${KELAS.input}`}
            />
          </div>
        </>
      )}
    </FormDialog>
  );
}
