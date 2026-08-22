// Integrasi Google Drive (Batch W) — ekspor template ke Drive tiap pengguna
// melalui OAuth 2.0 implicit flow (response_type=token, scope drive.file) dan
// upload dua langkah: POST uploadType=media lalu PATCH files/{id}.
// Tanpa library tambahan; fungsi penyimpanan murni (parameter tersimpan) agar
// bisa diuji tanpa localStorage. Client ID didaftarkan pemilik aplikasi di
// Google Cloud Console (JavaScript origins: origin aplikasi).

export class DriveError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DriveError';
  }
}

export interface TokenDrive {
  accessToken: string;
  /** Epoch ms saat token dianggap kedaluwarsa (dengan buffer 60 detik). */
  expiresAt: number;
}

export interface HasilUnggahDrive {
  id: string;
  nama: string;
  webViewLink: string;
  mimeType: string;
}

export interface Penyimpanan {
  getItem(kunci: string): string | null;
  setItem(kunci: string, nilai: string): void;
  removeItem(kunci: string): void;
}

const URL_OTORISASI = 'https://accounts.google.com/o/oauth2/v2/auth';
const SCOPE = 'https://www.googleapis.com/auth/drive.file';
const URL_UNGGAH = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=media';
const KUNCI_TOKEN = 'tartib.gdrive.token';
const KUNCI_CLIENT_ID = 'tartib.gdrive.clientId';
const BUFFER_KEDALUWARSA = 60_000;

/** URL halaman otorisasi Google dengan parameter implicit flow lengkap. */
export function bangunUrlOtorisasi(clientId: string, redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'token',
    scope: SCOPE,
    state,
  });
  return `${URL_OTORISASI}?${params.toString()}`;
}

/** Nonce acak 32 karakter heksadesimal untuk keamanan state OAuth. */
export function buatState(): string {
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  let hex = '';
  for (let i = 0; i < b.length; i += 1) hex += b[i].toString(16).padStart(2, '0');
  return hex;
}

/**
 * Ambil token dari hash URL hasil redirect OAuth (mis. "#access_token=…&state=…").
 * Lempar DriveError bila ada error Google, state tidak cocok, atau token tak ada.
 */
export function bacaTokenDariHash(hash: string, state: string): TokenDrive {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  if (params.get('error')) {
    throw new DriveError('Akses Google Drive dibatalkan atau ditolak.');
  }
  if (params.get('state') !== state) {
    throw new DriveError('Status otorisasi tidak cocok — coba lagi dari awal.');
  }
  const accessToken = params.get('access_token');
  const expiresIn = Number(params.get('expires_in') ?? '');
  if (!accessToken || !Number.isFinite(expiresIn) || expiresIn <= 0) {
    throw new DriveError('Respons otorisasi Google tidak berisi token akses.');
  }
  return { accessToken, expiresAt: Date.now() + expiresIn * 1000 - BUFFER_KEDALUWARSA };
}

export function simpanToken(token: TokenDrive, tersimpan: Penyimpanan): void {
  tersimpan.setItem(KUNCI_TOKEN, JSON.stringify(token));
}

/** Token tersimpan; null bila belum ada atau sudah kedaluwarsa (yang dihapus). */
export function bacaToken(tersimpan: Penyimpanan): TokenDrive | null {
  const mentah = tersimpan.getItem(KUNCI_TOKEN);
  if (!mentah) return null;
  let obj: unknown;
  try {
    obj = JSON.parse(mentah);
  } catch {
    return null;
  }
  if (typeof obj !== 'object' || obj === null) return null;
  const t = obj as { accessToken?: unknown; expiresAt?: unknown };
  if (typeof t.accessToken !== 'string' || typeof t.expiresAt !== 'number') return null;
  if (t.expiresAt <= Date.now()) {
    tersimpan.removeItem(KUNCI_TOKEN);
    return null;
  }
  return { accessToken: t.accessToken, expiresAt: t.expiresAt };
}

export function hapusToken(tersimpan: Penyimpanan): void {
  tersimpan.removeItem(KUNCI_TOKEN);
}

export function simpanClientId(clientId: string, tersimpan: Penyimpanan): void {
  tersimpan.setItem(KUNCI_CLIENT_ID, clientId);
}

export function bacaClientId(tersimpan: Penyimpanan): string {
  return tersimpan.getItem(KUNCI_CLIENT_ID) ?? '';
}

function pastikanOtorisasi(status: number): void {
  if (status === 401 || status === 403) {
    throw new DriveError('Sesi Google Drive kedaluwarsa — masuk ulang lalu coba lagi.');
  }
}

/** Unggah berkas ke Drive pribadi pemilik token; dua langkah (unggah + metadata). */
export async function unggahKeDrive(
  blob: Blob,
  nama: string,
  token: TokenDrive,
  fetchImpl: typeof fetch = fetch,
): Promise<HasilUnggahDrive> {
  const balasan = await fetchImpl(URL_UNGGAH, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token.accessToken}`, 'Content-Type': 'application/octet-stream' },
    body: blob,
  });
  pastikanOtorisasi(balasan.status);
  if (!balasan.ok) throw new DriveError(`Google Drive menolak unggahan (HTTP ${balasan.status}).`);
  const buat = (await balasan.json()) as { id?: unknown };
  if (typeof buat.id !== 'string' || buat.id === '') {
    throw new DriveError('Respons unggahan Google Drive tidak berisi id berkas.');
  }

  const perbarui = await fetchImpl(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(buat.id)}?fields=id,name,webViewLink,mimeType`,
    {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token.accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: nama }),
    },
  );
  pastikanOtorisasi(perbarui.status);
  if (!perbarui.ok) throw new DriveError(`Google Drive menolak metadata (HTTP ${perbarui.status}).`);
  const meta = (await perbarui.json()) as {
    id?: unknown;
    name?: unknown;
    webViewLink?: unknown;
    mimeType?: unknown;
  };
  if (typeof meta.id !== 'string' || meta.id === '') {
    throw new DriveError('Respons metadata Google Drive tidak berisi id berkas.');
  }
  return {
    id: meta.id,
    nama: typeof meta.name === 'string' ? meta.name : nama,
    webViewLink: typeof meta.webViewLink === 'string' ? meta.webViewLink : '',
    mimeType: typeof meta.mimeType === 'string' ? meta.mimeType : 'application/octet-stream',
  };
}
