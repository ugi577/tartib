'use client';

// Dialog tambah/ubah tugas (bagan) atau sub-tugas (daftar) di bawah satu
// jabatan/item — sesi 22, dulu ditulis dua kali di SopView.

import { FormDialog } from '../AppDialog';
import { PemilihIkonManual } from '../PemilihIkonManual';
import { KELAS } from '../../ui/kelas';
import type { LabelStruktur } from '../../lib/struktur/menuStruktur';
import type { FormSubNilai } from '../../lib/struktur/useAksiStruktur';
import type { VariasiStruktur } from './FormJabatan';

interface PropsFormSubTugas {
  terbuka: boolean;
  mode: 'tambah' | 'ubah';
  /** Judul jabatan/item induk — ditampilkan sebagai konteks. */
  induk: string | null;
  form: FormSubNilai;
  onUbah: (form: FormSubNilai) => void;
  onSimpan: () => void;
  onTutup: () => void;
  error: string | null;
  variasi: VariasiStruktur;
  label: LabelStruktur;
}

export function FormSubTugas({ terbuka, mode, induk, form, onUbah, onSimpan, onTutup, error, variasi, label }: PropsFormSubTugas) {
  const p = `struktur-${variasi}-sub`;
  const bagan = variasi === 'bagan';

  return (
    <FormDialog
      terbuka={terbuka}
      judul={`${mode === 'ubah' ? 'Ubah' : 'Tambah'} ${label.sub}`}
      onTutup={onTutup}
      onSimpan={onSimpan}
      error={error}
    >
      {induk && (
        <p className={KELAS.keteranganKecil}>
          Di bawah {label.item.toLowerCase()}: {induk}
        </p>
      )}
      <PemilihIkonManual
        judul={form.judul}
        catatan={form.catatan}
        jenis="tugas"
        label={bagan ? 'Ikon Tugas / Perlengkapan' : 'Ikon Sub-Tugas'}
        onUbahCatatan={(catatan) => onUbah({ ...form, catatan })}
      />
      <div>
        <label className={KELAS.label} htmlFor={`${p}-judul`}>
          {bagan ? 'Deskripsi tugas' : 'Sub-tugas'}
        </label>
        <input
          id={`${p}-judul`}
          value={form.judul}
          onChange={(e) => onUbah({ ...form, judul: e.target.value })}
          placeholder={bagan ? 'mis. Catat barang masuk-keluar' : 'mis. Set azan Maghrib'}
          className={`mt-1 ${KELAS.input}`}
        />
      </div>
      <div>
        <label className={KELAS.label} htmlFor={`${p}-pic`}>
          {bagan ? 'PIC tugas' : 'Nama PIC (santri / pengurus)'}
        </label>
        <input
          id={`${p}-pic`}
          value={form.picNama}
          onChange={(e) => onUbah({ ...form, picNama: e.target.value })}
          placeholder="Boleh dikosongkan"
          className={`mt-1 ${KELAS.input}`}
        />
      </div>
      <div>
        <label className={KELAS.label} htmlFor={`${p}-catatan`}>
          {bagan ? 'Keterangan / jadwal (opsional)' : 'Catatan'}
        </label>
        <input
          id={`${p}-catatan`}
          value={form.catatan}
          onChange={(e) => onUbah({ ...form, catatan: e.target.value })}
          placeholder={bagan ? 'mis. setiap hari Senin' : 'mis. pukul 17.45'}
          className={`mt-1 ${KELAS.input}`}
        />
      </div>
    </FormDialog>
  );
}
