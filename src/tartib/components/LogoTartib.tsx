// Logo Tartib — kalender acara berisi ceklis SOP (sesi 16, arahan Ahmed:
// "isyarat acara dan kotak centang cek list"). Dua isyarat digabung dalam
// satu gambar: kalender = acara bertanggal, kotak centang = item SOP yang
// dikerjakan satu per satu (dua tercentang, satu masih menunggu).
//
// SVG inline (tanpa impor next/*) agar aman dipakai di src/tartib (Gate A).
// Artwork identik dengan src/app/icon.svg (favicon) — bila mengubah bentuk,
// ubah keduanya.

interface PropsLogoTartib {
  className?: string;
  /** Label aksesibel; kosongkan bila ikon murni dekoratif di samping teks. */
  judul?: string;
}

export function LogoTartib({ className = 'h-8 w-8', judul }: PropsLogoTartib) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      role={judul ? 'img' : 'presentation'}
      aria-hidden={judul ? undefined : true}
      aria-label={judul}
    >
      {judul ? <title>{judul}</title> : null}
      <defs>
        <linearGradient id="logo-tartib-kertas" x1="6" y1="8" x2="58" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#eef2f7" />
        </linearGradient>
        <linearGradient id="logo-tartib-kepala" x1="6" y1="8" x2="58" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#518e7f" />
          <stop offset="1" stopColor="#246b5a" />
        </linearGradient>
      </defs>
      {/* Badan kalender */}
      <rect
        x="6"
        y="8"
        width="52"
        height="52"
        rx="9"
        fill="url(#logo-tartib-kertas)"
        stroke="#cbd5e1"
        strokeWidth="1.6"
      />
      {/* Kepala kalender: sudut atas membulat, sisi bawah rata */}
      <rect x="6" y="8" width="52" height="14" rx="9" fill="url(#logo-tartib-kepala)" />
      <rect x="6" y="15" width="52" height="7" fill="#246b5a" />
      {/* Dua gantungan */}
      <rect x="17" y="2" width="5" height="13" rx="2.5" fill="#ffffff" opacity="0.92" />
      <rect x="42" y="2" width="5" height="13" rx="2.5" fill="#ffffff" opacity="0.92" />
      {/* Baris 1 — tercentang */}
      <rect x="13" y="27" width="9" height="9" rx="2.5" fill="#246b5a" />
      <path
        d="M 15.3 31.6 L 17.2 33.6 L 20.7 29.6"
        fill="none"
        stroke="#ffffff"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="26" y="29.8" width="22" height="4.5" rx="2.25" fill="#cbd5e1" />
      {/* Baris 2 — tercentang */}
      <rect x="13" y="38.5" width="9" height="9" rx="2.5" fill="#246b5a" />
      <path
        d="M 15.3 43.1 L 17.2 45.1 L 20.7 41.1"
        fill="none"
        stroke="#ffffff"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="26" y="41.3" width="17" height="4.5" rx="2.25" fill="#cbd5e1" />
      {/* Baris 3 — masih menunggu */}
      <rect
        x="13"
        y="50"
        width="9"
        height="9"
        rx="2.5"
        fill="none"
        stroke="#94a3b8"
        strokeWidth="1.8"
      />
      <rect x="26" y="52.8" width="13" height="4.5" rx="2.25" fill="#e2e8f0" />
    </svg>
  );
}
