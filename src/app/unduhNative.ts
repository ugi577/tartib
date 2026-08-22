'use client';

// Handler unduhan native untuk shell aplikasi (sesi 16, bug Ahmed: unduhan
// HTML tidak jalan di Android WebView — anchor `download` diabaikan). Berada
// di src/app (bukan src/tartib) karena memakai plugin Capacitor — Gate A:
// src/tartib bebas impor luar. Alur: tulis berkas ke cache aplikasi via
// Filesystem, lalu buka lembar berbagi Android (Share + FileProvider).

import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { aturBagikanNative, type HasilUnduh } from '../tartib/lib/unduh';

function blobKeBase64(isi: Blob): Promise<string> {
  return new Promise((selesai, gagal) => {
    const r = new FileReader();
    r.onload = () => {
      const hasil = typeof r.result === 'string' ? r.result.split(',')[1] ?? '' : '';
      selesai(hasil);
    };
    r.onerror = () => gagal(new Error('Gagal membaca berkas untuk dibagikan'));
    r.readAsDataURL(isi);
  });
}

/** Pasang unduhan native bila aplikasi berjalan di Capacitor (Android/iOS). */
export function pasangUnduhanNative(): void {
  if (!Capacitor.isNativePlatform()) return;

  aturBagikanNative(async (nama, isi): Promise<HasilUnduh | null> => {
    const namaAman = nama.replace(/[^a-zA-Z0-9._-]/g, '_');
    const base64 = await blobKeBase64(isi);
    const tulis = await Filesystem.writeFile({
      path: namaAman,
      data: base64,
      directory: Directory.Cache,
    });
    try {
      await Share.share({ title: nama, files: [tulis.uri] });
      return { cara: 'share', dibatalkan: false };
    } catch (e) {
      if (e instanceof Error && /cancel/i.test(e.message)) {
        return { cara: 'share', dibatalkan: true };
      }
      throw e;
    }
  });
}
