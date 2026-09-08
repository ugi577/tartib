'use client';

// Kumpulan dialog & menu satu papan struktur (sesi 22): form jabatan, form
// tugas, konfirmasi hapus, dan ContextMenu — semuanya membaca state dari
// useAksiStruktur, sehingga mode daftar dan bagan merender set yang sama.
// Menu yang sama dibuka oleh klik kanan, tombol ⋯, maupun tekan lama.

import { KonfirmasiDialog } from '../AppDialog';
import { ContextMenu } from '../ContextMenu';
import type { LabelStruktur } from '../../lib/struktur/menuStruktur';
import type { AksiStruktur } from '../../lib/struktur/useAksiStruktur';
import { FormJabatan, type VariasiStruktur } from './FormJabatan';
import { FormSubTugas } from './FormSubTugas';

interface PropsDialogStruktur {
  aksi: AksiStruktur;
  label: LabelStruktur;
  variasi: VariasiStruktur;
}

export function DialogStruktur({ aksi, label, variasi }: PropsDialogStruktur) {
  const target = aksi.hapusTarget;
  const kecilItem = label.item.toLowerCase();
  const kecilSub = label.sub.toLowerCase();

  return (
    <>
      <FormJabatan
        terbuka={aksi.dialogJabatan !== null}
        mode={aksi.dialogJabatan?.item ? 'ubah' : 'tambah'}
        form={aksi.formJabatan}
        onUbah={aksi.setFormJabatan}
        onSimpan={() => void aksi.simpanJabatan()}
        onTutup={aksi.tutupDialogJabatan}
        error={aksi.errorJabatan}
        variasi={variasi}
        label={label}
      />

      <FormSubTugas
        terbuka={aksi.dialogSub !== null}
        mode={aksi.dialogSub?.sub ? 'ubah' : 'tambah'}
        induk={aksi.dialogSub?.induk.judul ?? null}
        form={aksi.formSub}
        onUbah={aksi.setFormSub}
        onSimpan={() => void aksi.simpanSub()}
        onTutup={aksi.tutupDialogSub}
        error={aksi.errorSub}
        variasi={variasi}
        label={label}
      />

      <KonfirmasiDialog
        terbuka={target !== null}
        judul={target?.jenis === 'sub' ? `Hapus ${kecilSub} ini?` : `Hapus ${kecilItem} ini?`}
        pesan={
          target
            ? `"${target.judul}" dihapus${target.jenis === 'item' ? ` beserta seluruh ${kecilSub}nya` : ''}. Tindakan ini tidak bisa dibatalkan.`
            : ''
        }
        onBatal={aksi.batalHapus}
        onYa={() => void aksi.jalankanHapus()}
      />

      <ContextMenu
        x={aksi.menu?.x ?? 0}
        y={aksi.menu?.y ?? 0}
        terbuka={aksi.menu !== null}
        onTutup={aksi.tutupMenu}
        judul={aksi.menu?.judul}
        items={aksi.menu?.items ?? []}
      />
    </>
  );
}
