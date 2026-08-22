// Logo Tartib — squircle candy glass berisi checklist SOP dengan progres:
// dua baris tercentang, satu menunggu. Menceritakan produk dalam satu gambar:
// dokumen SOP menjadi eksekusi acara yang tertib, fase demi fase.
//
// SVG inline (tanpa impor next/*) agar aman dipakai di src/tartib (Gate A)
// dan ikut skema warna aksen aplikasi. Artwork identik dengan src/app/icon.svg
// (favicon) — bila mengubah bentuk, ubah keduanya.

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
        <linearGradient id="logo-tartib-kaca" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#34d399" />
          <stop offset="1" stopColor="#059669" />
        </linearGradient>
      </defs>
      {/* Squircle candy glass */}
      <rect x="2" y="2" width="60" height="60" rx="15" fill="url(#logo-tartib-kaca)" />
      <rect
        x="3.75"
        y="3.75"
        width="56.5"
        height="56.5"
        rx="13.5"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.4"
        strokeWidth="1.5"
      />
      <path
        d="M 2 24 C 22 32 42 32 62 24 V 17 C 62 8.7 55.3 2 47 2 H 17 C 8.7 2 2 8.7 2 17 Z"
        fill="#ffffff"
        opacity="0.18"
      />
      {/* Baris 1: selesai */}
      <circle cx="17" cy="20" r="5" fill="#ffffff" opacity="0.95" />
      <path
        d="M 14.7 20.2 L 16.5 22 L 19.8 18.2"
        fill="none"
        stroke="#047857"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="26" y="17" width="24" height="6" rx="3" fill="#ffffff" opacity="0.95" />
      {/* Baris 2: selesai */}
      <circle cx="17" cy="32" r="5" fill="#ffffff" opacity="0.78" />
      <path
        d="M 14.7 32.2 L 16.5 34 L 19.8 30.2"
        fill="none"
        stroke="#047857"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="26" y="29" width="18" height="6" rx="3" fill="#ffffff" opacity="0.78" />
      {/* Baris 3: menunggu */}
      <circle cx="17" cy="44" r="4.5" fill="none" stroke="#ffffff" strokeOpacity="0.85" strokeWidth="2" />
      <rect x="26" y="41" width="21" height="6" rx="3" fill="#ffffff" opacity="0.62" />
    </svg>
  );
}
