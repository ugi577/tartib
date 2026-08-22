// e-Konfirmasi Kehadiran — generator halaman konfirmasi (sesi 16, arahan
// Ahmed). Dari judul/tanggal acara + bidang khusus kategori, disusun SATU
// berkas HTML mandiri bergaya kartu emas (acuan "Berkenan Konfirmasi
// Kehadiran.html") dengan <title>e-Konfirmasi Kehadiran - Ma'had Askar
// Qur'an</title>, yang mengirim konfirmasi ke WhatsApp panitia.
// Fungsi murni & teruji — tanpa next/* (Gate A).

export interface BidangKonfirmasi {
  label: string;
  placeholder?: string;
  /** Bawaan 'teks' bila tidak diisi. */
  tipe?: 'teks' | 'pilihan';
  opsi?: string[];
}

export interface DataKonfirmasi {
  judulAcara: string;
  /** Baris tanggal yang tampil, mis. "Jum'at, 21 Agustus 2026 M / 8 Rabi'ul Awwal 1448 H". */
  tanggal: string;
  waktu?: string;
  tempat?: string;
  mapsUrl?: string;
  /** Nomor WhatsApp panitia tujuan (internasional tanpa +, mis. 62852...). */
  noWhatsApp?: string;
  /** Bidang khusus sesuai kategori acara — tampil setelah bidang dasar. */
  bidang: BidangKonfirmasi[];
  /** Kop Arab — kosongkan untuk memakai bawaan. */
  kopArab?: string;
  /** Kop Latin — kosongkan untuk memakai bawaan. */
  kopLatin?: string;
  /** Tag di atas judul — kosongkan untuk memakai bawaan. */
  tag?: string;
}

export const KOP_ARAB_BAKU = 'مَعْهَدُ عَسْكَرِ الْقُرْآنِ';
export const KOP_LATIN_BAKU = 'Mahad Askar Cijulang • Cansebu';
export const TAG_BAKU = 'e-Konfirmasi Kehadiran';

// Preset bidang khusus per kategori acara (JENIS_ACARA_BAKU). Kategori yang
// tidak terdaftar (mis. Custom) tidak punya preset — pengguna mengisi sendiri.
export const PRESET_KATEGORI: Readonly<Record<string, ReadonlyArray<BidangKonfirmasi>>> = {
  'Tasyakuran Khatam': [
    { label: 'Nama santri yang khatam', placeholder: 'mis. Ahmad Fauzan' },
    { label: 'Jumlah santri yang khatam', tipe: 'pilihan', opsi: ['1', '2', '3', '4', '5'] },
  ],
  Maulid: [
    { label: 'Pembacaan maulid oleh', placeholder: 'nama / rombongan' },
    { label: 'Ikut serta dalam rombongan', tipe: 'pilihan', opsi: ['Ya', 'Tidak'] },
  ],
  Haflah: [
    { label: 'Pentas ananda', placeholder: 'nama ananda' },
    { label: 'Jenis pentas', placeholder: 'mis. tahfidz, nasyid, pidato' },
  ],
  Wisuda: [
    { label: 'Nama wisudawan/wisudawati', placeholder: 'nama ananda' },
    { label: 'Jumlah tamu', tipe: 'pilihan', opsi: ['1-2', '3-4', '5-6', '>6'] },
  ],
  Dauroh: [
    { label: 'Nama peserta dauroh', placeholder: 'nama peserta' },
    { label: 'Ikut durasi penuh', tipe: 'pilihan', opsi: ['Penuh', 'Sebagian'] },
  ],
  'Rapat Wali Santri': [
    { label: 'Nama wali santri', placeholder: 'nama bapak/ibu' },
    { label: 'Ananda yang diwakili', placeholder: 'nama santri' },
  ],
  PHBI: [
    { label: 'Nama rombongan/jamaah', placeholder: 'nama rombongan' },
    { label: 'Jumlah rombongan', tipe: 'pilihan', opsi: ['1-5', '6-10', '11-20', '>20'] },
  ],
};

export const JUDUL_TITLE = 'e-Konfirmasi Kehadiran - Ma\'had Askar Qur\'an';

const BIDANG_DASAR: ReadonlyArray<{ id: string; label: string; tipe: 'teks' | 'pilihan'; wajib?: boolean }> = [
  { id: 'nama', label: 'Nama Lengkap (Bapak / Ibu / Ustadz)', tipe: 'teks', wajib: true },
  { id: 'domisili', label: 'Domisili (kota/kabupaten)', tipe: 'teks' },
  { id: 'kategori', label: 'Kategori Kedatangan', tipe: 'pilihan', wajib: true },
  { id: 'wa', label: 'Nomor WhatsApp (opsional)', tipe: 'teks' },
  { id: 'jumlah', label: 'Jumlah Orang (termasuk Anda)', tipe: 'pilihan', wajib: true },
  { id: 'catatan', label: 'Catatan (opsional)', tipe: 'teks' },
];

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function inputBidang(b: BidangKonfirmasi, id: string): string {
  const label = esc(b.label);
  const opsional = b.tipe === 'pilihan' ? '' : '';
  const judulLabel = `<label>${label} <span class="opsional">${opsional}</span></label>`;
  if ((b.tipe ?? 'teks') === 'pilihan') {
    const opsi = (b.opsi ?? [])
      .map((o) => `<option value="${esc(o)}">${esc(o)}</option>`)
      .join('');
    return `<div class="form-group">${judulLabel}<select id="${id}"><option value="">Pilih</option>${opsi}</select></div>`;
  }
  const ph = b.placeholder ? ` placeholder="${esc(b.placeholder)}"` : '';
  return `<div class="form-group">${judulLabel}<input type="text" id="${id}"${ph}></div>`;
}

function inputDasar(f: { id: string; label: string; tipe: 'teks' | 'pilihan'; wajib?: boolean }): string {
  const label = `<label>${esc(f.label)} <span class="opsional">${f.wajib ? '' : '(opsional)'}</span></label>`;
  if (f.tipe === 'pilihan') {
    const opsi =
      f.id === 'kategori'
        ? ['Wali Santri', 'Undangan Khusus', 'Umum']
        : f.id === 'jumlah'
          ? ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10+']
          : [];
    const opsiHtml = opsi.map((o) => `<option value="${esc(o)}">${esc(o)}${f.id === 'jumlah' ? ' orang' : ''}</option>`).join('');
    return `<div class="form-group">${label}<select id="${f.id}" required><option value="">Pilih</option>${opsiHtml}</select></div>`;
  }
  const ph =
    f.id === 'nama'
      ? ' placeholder="Contoh: Ustadz Muhammad"'
      : f.id === 'domisili'
        ? ' placeholder="Contoh: Bogor, Jakarta, Bandung"'
        : f.id === 'wa'
          ? ' placeholder="0812-3456-7890"'
          : f.id === 'catatan'
            ? ' placeholder="Misal: datang bersama rombongan, atau kebutuhan khusus"'
            : '';
  return `<div class="form-group">${label}<input type="${f.id === 'wa' ? 'tel' : 'text'}" id="${f.id}"${ph}${f.wajib ? ' required' : ''}></div>`;
}

const CSS = `:root{--kertas:#FBF8F1;--tinta:#2E241A;--lembut:#5C4A34;--emas:#A98436;--emas-terang:#D8C48A;--bronze:#6E5433;--merah:#8C2E22;--serif:'Palatino Linotype','Book Antiqua',Palatino,Georgia,serif;--arab:'Amiri','Scheherazade New','Traditional Arabic','Noto Naskh Arabic',serif;--data:'Arial Narrow','Helvetica Neue',Arial,sans-serif}
*{box-sizing:border-box;margin:0;padding:0}
body{background:#8a8578;font-family:var(--serif);color:var(--tinta);-webkit-print-color-adjust:exact;print-color-adjust:exact;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
.kartu{width:100%;max-width:720px;background:var(--kertas);border:1.6mm solid var(--emas);outline:0.3mm solid var(--emas);outline-offset:1.4mm;padding:40px 45px 45px;position:relative;box-shadow:0 8px 30px rgba(0,0,0,.3);margin:10px auto}
.kop{display:flex;align-items:center;gap:6mm;padding-bottom:3mm;border-bottom:.9mm solid var(--emas);margin-bottom:4mm}
.kop .spacer{width:22mm;flex:none}
.kop .tengah{flex:1;text-align:center}
.kop .ar{font-family:var(--arab);font-size:16pt;color:var(--bronze);line-height:1.4}
.kop .latin{font-family:var(--data);font-size:7.8pt;letter-spacing:.3em;text-transform:uppercase;color:var(--bronze);margin-top:.8mm}
.judul{text-align:center;margin-bottom:4mm}
.judul .tag{font-family:var(--data);font-size:6.8pt;letter-spacing:.3em;text-transform:uppercase;color:var(--merah);margin-bottom:1mm}
.judul h1{font-size:18pt;font-weight:400;line-height:1.25;color:var(--tinta);letter-spacing:.04em}
.judul .sub{font-size:9.2pt;font-style:italic;color:var(--lembut);margin-top:.8mm}
.info-acara{border:.25mm solid var(--emas-terang);background:#FAF6EA;padding:3.5mm 5mm;margin-bottom:4.5mm}
.info-acara .baris{display:flex;font-size:9.2pt;line-height:1.5;padding:.8mm 0;border-bottom:.15mm solid rgba(168,132,54,.2)}
.info-acara .baris:last-child{border-bottom:none}
.info-acara .label{width:30mm;flex:none;color:var(--bronze);font-family:var(--data);font-size:8.2pt;letter-spacing:.06em;text-transform:uppercase}
.info-acara .nilai{flex:1;font-weight:500}
.info-acara .nilai a{color:var(--merah);text-decoration:none;font-size:8.4pt}
.form-konfirmasi{margin-top:2mm}
.form-konfirmasi .form-group{margin-bottom:3.5mm}
.form-konfirmasi label{display:block;font-size:8.8pt;font-weight:500;color:var(--tinta);margin-bottom:.8mm;letter-spacing:.02em}
.form-konfirmasi label .opsional{font-weight:400;font-style:italic;color:var(--lembut);font-size:7.6pt}
.form-konfirmasi input,.form-konfirmasi select{width:100%;padding:2.6mm 3.5mm;border:.3mm solid var(--emas-terang);background:#FFFCF5;font-family:var(--serif);font-size:9.8pt;color:var(--tinta);outline:none}
.form-konfirmasi input:focus,.form-konfirmasi select:focus{border-color:var(--emas)}
.tombol-wa{display:inline-block;width:100%;padding:3.2mm;background:#25D366;color:#fff;border:none;font-family:var(--data);font-size:10.2pt;letter-spacing:.2em;text-transform:uppercase;cursor:pointer;text-align:center;font-weight:600;border-radius:2px;text-decoration:none}
.tombol-wa:hover{background:#1da851}
.catatan{font-size:7.6pt;color:var(--lembut);text-align:center;margin-top:2.8mm;line-height:1.5;font-style:italic;border-top:.2mm solid var(--emas-terang);padding-top:2.8mm}
@media(max-width:640px){.kartu{padding:20px 16px 24px}.kop{gap:3mm;justify-content:center}.kop .spacer{display:none}.kop .ar{font-size:13pt}.judul h1{font-size:14pt}.info-acara .baris{font-size:8.4pt;flex-wrap:wrap}.info-acara .label{width:100%}.tombol-wa{font-size:9pt;padding:2.8mm}}`;

/** Susun satu berkas HTML mandiri e-Konfirmasi (title tetap, kirim via WA). */
export function susunHtmlKonfirmasi(data: DataKonfirmasi): string {
  const bidangCustom = data.bidang.map((b, i) => ({ ...b, id: `f${i}` }));

  // Konfigurasi yang dibaca skrip: semua bidang (dasar + custom) + tujuan.
  const konfig = {
    judul: data.judulAcara,
    noWA: data.noWhatsApp ?? '',
    bidang: [
      ...BIDANG_DASAR.map((f) => ({ id: f.id, label: f.label, tipe: f.tipe, wajib: !!f.wajib })),
      ...bidangCustom.map((b) => ({ id: b.id, label: b.label, tipe: b.tipe, wajib: false })),
    ],
  };

  const infoBaris = [
    { label: 'Hari & Tanggal', nilai: `<b>${esc(data.tanggal)}</b>` },
    ...(data.waktu ? [{ label: 'Waktu', nilai: esc(data.waktu) }] : []),
    ...(data.tempat ? [{ label: 'Tempat', nilai: esc(data.tempat) }] : []),
    ...(data.mapsUrl
      ? [{ label: 'Maps', nilai: `<a href="${esc(data.mapsUrl)}" target="_blank">${esc(data.mapsUrl)}</a>` }]
      : []),
  ].map((b) => `<div class="baris"><span class="label">${esc(b.label)}</span><span class="nilai">${b.nilai}</span></div>`).join('');

  // JSON di dalam <script> di-escape < > & agar teks pengguna tak bisa
  // menembus keluar blok skrip (mis. judul berisi "</script>").
  const jsonAman = JSON.stringify(konfig)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');

  const catatanWA =
    data.noWhatsApp !== '' && data.noWhatsApp !== undefined
      ? `<b>Konfirmasi ini membantu kami menyiapkan tempat dan hidangan.</b><br>Jika ada perubahan, silakan hubungi panitia via WA <b>${esc(data.noWhatsApp)}</b>`
      : '<b>Konfirmasi ini membantu kami menyiapkan tempat dan hidangan.</b>';

  return `<!DOCTYPE html>
<html lang="id">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(JUDUL_TITLE)}</title>
<style>${CSS}</style>
</head>
<body>
  <div class="kartu">
    <div class="kop">
      <div class="spacer"></div>
      <div class="tengah">
        <div class="ar">${esc(data.kopArab?.trim() || KOP_ARAB_BAKU)}</div>
        <div class="latin">${esc(data.kopLatin?.trim() || KOP_LATIN_BAKU)}</div>
      </div>
      <div class="spacer"></div>
    </div>
    <div class="judul">
      <div class="tag">${esc(data.tag?.trim() || TAG_BAKU)}</div>
      <h1>${esc(data.judulAcara)}</h1>
      <div class="sub">${esc(data.tanggal)}</div>
    </div>
    <div class="info-acara">${infoBaris}</div>
    <form class="form-konfirmasi" id="formKonfirmasi" onsubmit="return kirimKeWA(event)">
      ${BIDANG_DASAR.map(inputDasar).join('')}
      ${bidangCustom.map((b) => inputBidang(b, b.id)).join('')}
      <button type="submit" class="tombol-wa"><span class="wa-icon">&#128172;</span> Berkenan Konfirmasi Kehadiran via WhatsApp</button>
      <div class="catatan">${catatanWA}</div>
    </form>
  </div>
  <script>
    var KONFIG = ${jsonAman};
    function kirimKeWA(e) {
      e.preventDefault();
      var b = {};
      KONFIG.bidang.forEach(function (f) {
        var el = document.getElementById(f.id);
        b[f.id] = el ? el.value.trim() : '';
      });
      if (!b.nama) { alert('Silakan isi nama lengkap Anda.'); return false; }
      if (!b.kategori) { alert('Silakan pilih kategori kedatangan.'); return false; }
      if (!b.jumlah) { alert('Silakan pilih jumlah orang yang akan hadir.'); return false; }
      var pesan = encodeURIComponent('e-Konfirmasi Kehadiran - ' + KONFIG.judul + '\\n\\n');
      KONFIG.bidang.forEach(function (f) {
        if (b[f.id]) pesan += encodeURIComponent(f.label + ': ' + b[f.id] + '\\n');
      });
      pesan += encodeURIComponent('\\n-- Dikirim dari e-Konfirmasi Kehadiran Ma\\'had Askar Qur\\'an');
      var tujuan = KONFIG.noWA ? 'https://wa.me/' + KONFIG.noWA + '?text=' : 'https://wa.me/?text=';
      window.open(tujuan + pesan, '_blank');
      var btn = document.querySelector('.tombol-wa');
      btn.textContent = '\\u2713 Konfirmasi Terkirim';
      btn.style.background = '#1da851';
      btn.disabled = true;
      document.querySelectorAll('#formKonfirmasi input, #formKonfirmasi select').forEach(function (el) { el.disabled = true; el.style.opacity = '0.6'; });
      return false;
    }
  </script>
</body>
</html>`;
}
