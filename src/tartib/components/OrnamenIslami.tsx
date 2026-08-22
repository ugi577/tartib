// Ornamen islami untuk bilah header (sesi 15, arahan Ahmed): bintang 8
// "khatam" — dua bujur sangkar bersilang 45°, pola geometri islami klasik.
// SVG inline tanpa next/* (Gate A), mengikuti warna lewat currentColor agar
// selaras dengan token aksen aplikasi.

export function BintangDelapan({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect x="6.5" y="6.5" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <rect
        x="6.5"
        y="6.5"
        width="11"
        height="11"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        transform="rotate(45 12 12)"
      />
      <circle cx="12" cy="12" r="1.3" fill="currentColor" />
    </svg>
  );
}

// Pita pembatas: deretan bintang 8 — pemisah visual antara area identitas
// header dan baris tab di bawahnya. Ujung terpotong di layar sempit
// (overflow-hidden), deret tetap penuh di tengah.
export function PitaIslami({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-4 overflow-hidden ${className}`} aria-hidden="true">
      {Array.from({ length: 12 }, (_, i) => (
        <BintangDelapan key={i} className="h-3.5 w-3.5 shrink-0" />
      ))}
    </div>
  );
}
