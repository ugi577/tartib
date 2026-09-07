// Tes fungsi murni integrasi Google Drive (Batch W) — URL otorisasi, parsing
// token dari hash, penyimpanan (dengan storage tiruan), dan unggahan dua
// langkah (fetch tiruan). Jaringan dan OAuth sungguhan tidak diuji di sini.

import { describe, expect, it, vi } from 'vitest';
import {
  bacaClientId,
  bacaToken,
  bacaTokenDariHash,
  bangunUrlOtorisasi,
  buatState,
  DriveError,
  hapusToken,
  simpanClientId,
  simpanToken,
  unggahKeDrive,
  type Penyimpanan,
} from './gdrive';

function penyimpananTiruan(): Penyimpanan & { kunci: Map<string, string> } {
  const kunci = new Map<string, string>();
  return {
    kunci,
    getItem(k) {
      return kunci.get(k) ?? null;
    },
    setItem(k, v) {
      kunci.set(k, v);
    },
    removeItem(k) {
      kunci.delete(k);
    },
  };
}

describe('bangunUrlOtorisasi', () => {
  it('memuat parameter implicit flow yang diperlukan', () => {
    const url = new URL(bangunUrlOtorisasi('cid-123', 'https://aplikasi.test/tartib/', 'nonce-abc'));
    expect(url.origin).toBe('https://accounts.google.com');
    expect(url.searchParams.get('client_id')).toBe('cid-123');
    expect(url.searchParams.get('redirect_uri')).toBe('https://aplikasi.test/tartib/');
    expect(url.searchParams.get('response_type')).toBe('token');
    expect(url.searchParams.get('scope')).toBe('https://www.googleapis.com/auth/drive.file');
    expect(url.searchParams.get('state')).toBe('nonce-abc');
  });
});

describe('buatState', () => {
  it('menghasilkan nonce heksadesimal 32 karakter', () => {
    expect(buatState()).toMatch(/^[0-9a-f]{32}$/);
    expect(buatState()).not.toBe(buatState());
  });
});

describe('bacaTokenDariHash', () => {
  it('mengambil access_token dan menghitung kedaluwarsa dengan buffer', () => {
    const sebelum = Date.now();
    const token = bacaTokenDariHash('#access_token=abc123&expires_in=3600&state=nonce', 'nonce');
    expect(token.accessToken).toBe('abc123');
    expect(token.expiresAt).toBeGreaterThan(sebelum + 3600 * 1000 - 120_000);
    expect(token.expiresAt).toBeLessThanOrEqual(sebelum + 3600 * 1000 - 60_000 + 1000);
  });

  it('menolak saat state tidak cocok', () => {
    expect(() => bacaTokenDariHash('#access_token=x&expires_in=3600&state=lain', 'nonce')).toThrow(DriveError);
  });

  it('menolak saat Google mengembalikan error', () => {
    expect(() => bacaTokenDariHash('#error=access_denied&state=nonce', 'nonce')).toThrow(DriveError);
  });

  it('menolak saat tidak ada token', () => {
    expect(() => bacaTokenDariHash('#state=nonce', 'nonce')).toThrow(DriveError);
  });
});

describe('penyimpanan token', () => {
  it('menyimpan dan membaca token yang belum kedaluwarsa', () => {
    const tersimpan = penyimpananTiruan();
    const token = { accessToken: 't', expiresAt: Date.now() + 60_000 };
    simpanToken(token, tersimpan);
    expect(bacaToken(tersimpan)).toEqual(token);
  });

  it('mengembalikan null dan menghapus token yang kedaluwarsa', () => {
    const tersimpan = penyimpananTiruan();
    simpanToken({ accessToken: 't', expiresAt: Date.now() - 1 }, tersimpan);
    expect(bacaToken(tersimpan)).toBeNull();
    expect(tersimpan.kunci.size).toBe(0);
  });

  it('mengembalikan null untuk data rusak', () => {
    const tersimpan = penyimpananTiruan();
    tersimpan.setItem('tartib.gdrive.token', 'bukan-json');
    expect(bacaToken(tersimpan)).toBeNull();
  });

  it('menghapus dan menyimpan client id', () => {
    const tersimpan = penyimpananTiruan();
    expect(bacaClientId(tersimpan)).toBe('');
    simpanClientId('cid-9', tersimpan);
    expect(bacaClientId(tersimpan)).toBe('cid-9');
    hapusToken(tersimpan); // memastikan kunci token dan client id berbeda
    expect(bacaClientId(tersimpan)).toBe('cid-9');
  });
});

describe('unggahKeDrive', () => {
  function responJson(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
  }

  it('mengunggah dua langkah dan mengembalikan metadata', async () => {
    const fetchTiruan = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(responJson({ id: 'file-1' }))
      .mockResolvedValueOnce(
        responJson({ id: 'file-1', name: 'SOP Maulid.docx', webViewLink: 'https://drive.google.com/f', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }),
      );

    const hasil = await unggahKeDrive(new Blob(['x']), 'SOP Maulid.docx', { accessToken: 'tok', expiresAt: 0 }, fetchTiruan);

    expect(hasil).toEqual({
      id: 'file-1',
      nama: 'SOP Maulid.docx',
      webViewLink: 'https://drive.google.com/f',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    expect(fetchTiruan).toHaveBeenCalledTimes(2);
    expect(String(fetchTiruan.mock.calls[0][0])).toContain('uploadType=media');
    expect(fetchTiruan.mock.calls[0][1]?.headers).toMatchObject({ Authorization: 'Bearer tok' });
    expect(String(fetchTiruan.mock.calls[1][0])).toContain('drive/v3/files/file-1?fields=');
    expect(JSON.parse(String(fetchTiruan.mock.calls[1][1]?.body))).toEqual({ name: 'SOP Maulid.docx' });
  });

  it('melaporkan sesi kedaluwarsa pada 401', async () => {
    const fetchTiruan = vi.fn<typeof fetch>().mockResolvedValue(new Response('{}', { status: 401 }));
    await expect(unggahKeDrive(new Blob(['x']), 'a.docx', { accessToken: 't', expiresAt: 0 }, fetchTiruan)).rejects.toThrow(
      'Sesi Google Drive kedaluwarsa',
    );
  });

  it('melaporkan respons tanpa id', async () => {
    const fetchTiruan = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(responJson({}))
      .mockResolvedValueOnce(responJson({ id: 'file-1', name: 'a.docx' }));
    await expect(unggahKeDrive(new Blob(['x']), 'a.docx', { accessToken: 't', expiresAt: 0 }, fetchTiruan)).rejects.toThrow(
      DriveError,
    );
  });
});
