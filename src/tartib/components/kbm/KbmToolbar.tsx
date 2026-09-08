'use client';

// Toolbar layar Matriks KBM (sesi 22, temuan audit [3/44]). Dirender di LUAR
// lembar kertas lewat createPortal ke slot `#kanvas-toolbar-slot` milik
// PrintReadyCanvas (fallback: inline di atas kop bila slot tidak ada).
// Sebelumnya select Template + 8 tombol berjejer duduk DI DALAM lembar A4
// landscape yang diskalakan, sehingga di HP tombolnya keluar layar.
//
// Isinya satu baris kontrol kecil: Template, Halaqah, Musyrif (bila relevan),
// Simpan, dan "⋯" yang membuka menu aksi lain. Pesan umpan balik dan pil
// "Klip: …" ikut di sini (baris penuh di bawah kontrol) — bukan toast `fixed`,
// karena `fixed` di dalam lembar ber-transform terjebak relatif ke kertas.
// Komponen ini murni tampilan: semua aksi lewat props.

import type { ModelJadwalKbm } from '../../types/kbm';
import { labelKlip, type ItemKlip } from '../../lib/clipboard/appClipboard';
import { KELAS } from '../../ui/kelas';

export interface PropsKbmToolbar {
  jadwal: ModelJadwalKbm;
  presetBawaan: readonly ModelJadwalKbm[];
  templateKustom: readonly ModelJadwalKbm[];
  kelasTerpilih: string;
  guruFilter: string;
  daftarGuru: readonly string[];
  pesan: string | null;
  klip: ItemKlip | null;
  onGantiTemplate: (id: string) => void;
  onGantiKelas: (kelas: string) => void;
  onGantiGuru: (guru: string) => void;
  onSimpan: () => void;
  /** Buka menu aksi jadwal; x/y + kotak tombol ⋯ (jangkar penempatan menu). */
  onBukaMenu: (x: number, y: number, anchor: DOMRect) => void;
  onBatalKlip: () => void;
}

// Target sentuh ≥ 40px: select/tombol kecil (34px) ditambah min-h-10;
// KELAS.tombolIkon sudah 40px.
const KONTROL = 'min-h-10';

export function KbmToolbar({
  jadwal,
  presetBawaan,
  templateKustom,
  kelasTerpilih,
  guruFilter,
  daftarGuru,
  pesan,
  klip,
  onGantiTemplate,
  onGantiKelas,
  onGantiGuru,
  onSimpan,
  onBukaMenu,
  onBatalKlip,
}: PropsKbmToolbar) {
  const klipKbm = klip?.tipe === 'kbm' ? klip : null;

  return (
    <>
      <label htmlFor="kbm-pilih-template" className="sr-only">
        Template jadwal
      </label>
      <select
        id="kbm-pilih-template"
        value={jadwal.id}
        onChange={(e) => onGantiTemplate(e.target.value)}
        className={`${KELAS.inputKecil} ${KONTROL} max-w-56 text-xs font-semibold`}
      >
        <optgroup label="Template bawaan">
          {presetBawaan.map((p) => (
            <option key={p.id} value={p.id}>
              {p.judul}
              {p.tahunAjaran ? ` (${p.tahunAjaran})` : ''}
            </option>
          ))}
        </optgroup>
        {templateKustom.length > 0 && (
          <optgroup label="Template kustom Anda">
            {templateKustom.map((p) => (
              <option key={p.id} value={p.id}>
                {p.judul}
              </option>
            ))}
          </optgroup>
        )}
      </select>

      {jadwal.daftarKelas.length > 1 && (
        <>
          <label htmlFor="kbm-pilih-kelas" className="sr-only">
            Kelas / Halaqah
          </label>
          <select
            id="kbm-pilih-kelas"
            value={kelasTerpilih}
            onChange={(e) => onGantiKelas(e.target.value)}
            className={`${KELAS.inputKecil} ${KONTROL} max-w-40 text-xs`}
          >
            {jadwal.daftarKelas.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </>
      )}

      {daftarGuru.length > 0 && (
        <>
          <label htmlFor="kbm-pilih-guru" className="sr-only">
            Musyrif / Pengampu
          </label>
          <select
            id="kbm-pilih-guru"
            value={guruFilter}
            onChange={(e) => onGantiGuru(e.target.value)}
            className={`${KELAS.inputKecil} ${KONTROL} max-w-40 text-xs`}
          >
            <option value="">Semua musyrif</option>
            {daftarGuru.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </>
      )}

      <button type="button" onClick={onSimpan} className={`${KELAS.tombolUtamaKecil} ${KONTROL}`}>
        Simpan
      </button>

      <button
        type="button"
        aria-label="Menu jadwal"
        aria-haspopup="menu"
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          onBukaMenu(r.left, r.bottom, r);
        }}
        className={`${KELAS.tombolIkon} text-lg leading-none`}
      >
        ⋯
      </button>

      {(pesan || klipKbm) && (
        <div className="flex basis-full flex-wrap items-center gap-1.5">
          {pesan && (
            <p role="status" className="rounded-kontrol bg-aksen-100/70 px-3 py-1.5 text-xs text-aksen-700 ring-1 ring-inset ring-aksen-200/70">
              {pesan}
            </p>
          )}
          {klipKbm && (
            <span className={`${KELAS.badgeAksen} gap-1.5`}>
              {labelKlip(klipKbm)}
              <button
                type="button"
                onClick={onBatalKlip}
                aria-label="Kosongkan papan klip"
                className="rounded-full px-1 text-aksen-700 hover:bg-white/60"
              >
                ×
              </button>
            </span>
          )}
        </div>
      )}
    </>
  );
}
