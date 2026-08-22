// Unduh berkas lintas platform (sesi 16, bug Ahmed: unduhan HTML tidak jalan
// di Android WebView — anchor `download` diabaikan WebView). Strategi:
//   1. Bila aplikasi native (Capacitor) — handler dipasang oleh shell aplikasi
//      (src/app/unduhNative.ts, lewat aturBagikanNative) yang menulis berkas
//      ke cache lalu membuka lembar berbagi Android via plugin Share.
//   2. Web dengan Web Share API (desktop modern / PWA): bagikan berkas.
//   3. Fallback anchor download (desktop browser).
// Modul ini bebas impor luar (Gate A) — Capacitor hanya dikenal oleh shell.

export interface HasilUnduh {
  cara: 'share' | 'unduh';
  /** true bila pengguna membatalkan lembar berbagi. */
  dibatalkan: boolean;
}

type BagikanNative = (nama: string, isi: Blob) => Promise<HasilUnduh | null>;

let bagikanNative: BagikanNative | null = null;

/** Pasang handler unduhan native (dipanggil shell aplikasi di titik masuk). */
export function aturBagikanNative(fn: BagikanNative): void {
  bagikanNative = fn;
}

/** Coba bagikan berkas: native (Capacitor) → Web Share API → anchor. */
export async function unduhBerkas(nama: string, isi: Blob): Promise<HasilUnduh> {
  if (bagikanNative) {
    const hasil = await bagikanNative(nama, isi);
    if (hasil) return hasil;
  }

  if (typeof navigator.canShare === 'function') {
    const file = new File([isi], nama, { type: isi.type || 'application/octet-stream' });
    if (navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: nama });
        return { cara: 'share', dibatalkan: false };
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') {
          return { cara: 'share', dibatalkan: true };
        }
        // Share gagal (mis. ditolak) — jatuh ke unduhan anchor.
      }
    }
  }

  const url = URL.createObjectURL(isi);
  const a = document.createElement('a');
  a.href = url;
  a.download = nama;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return { cara: 'unduh', dibatalkan: false };
}
