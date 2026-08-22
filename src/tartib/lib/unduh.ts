// Unduh berkas lintas platform (sesi 16, bug yang dilaporkan Ahmed: unduhan
// HTML tidak jalan di Android — anchor `download` diabaikan WebView Android
// karena tidak ada pengunduh bawaan). Strategi: Web Share API dengan berkas
// dulu (tersedia di WebView Android/iOS modern — membuka lembar berbagi:
// Simpan, WhatsApp, Drive, dll.), lalu fallback anchor (desktop browser).

export interface HasilUnduh {
  cara: 'share' | 'unduh';
  /** true bila pengguna membatalkan lembar berbagi. */
  dibatalkan: boolean;
}

/** Coba bagikan berkas via Web Share API; bila tak tersedia, unduh lewat anchor. */
export async function unduhBerkas(nama: string, isi: Blob): Promise<HasilUnduh> {
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
