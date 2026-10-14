// El logo de Navia Barber Club, dibujado con SVG (líneas y texto), así se ve
// nítido en cualquier tamaño y no hay que cargar una imagen.
//
// <Logo>: el sello completo, con el texto alrededor. Para la portada y el ingreso.
// <MarcaLogo>: solo el círculo con la N. Para lugares pequeños como el panel.

// Las tijeras de lucide, para usarlas dentro del SVG.
function Tijeras({ x, y, escala, color }: { x: number; y: number; escala: number; color: string }) {
  return (
    <g
      transform={`translate(${x},${y}) rotate(-90) scale(${escala}) translate(-12,-12)`}
      fill="none"
      stroke={color}
      strokeWidth={1.6}
      strokeLinecap="round"
    >
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <line x1="20" y1="4" x2="8.12" y2="15.88" />
      <line x1="14.47" y1="14.48" x2="20" y2="20" />
      <line x1="8.12" y1="8.12" x2="12" y2="12" />
    </g>
  );
}

const titulo = { fontFamily: "var(--font-oswald), sans-serif" };

export default function Logo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 400" className={className} role="img" aria-label="Navia Barber Club">
      <defs>
        {/* El camino circular por donde va el texto de alrededor. */}
        <path id="arco-logo" d="M 200 200 m -132 0 a 132 132 0 1 1 264 0 a 132 132 0 1 1 -264 0" />
      </defs>
      <circle cx="200" cy="200" r="190" fill="rgb(0 0 0 / 0.55)" />
      <circle cx="200" cy="200" r="168" fill="none" stroke="#fff" strokeWidth="3" />
      <circle cx="200" cy="200" r="110" fill="none" stroke="#71717a" strokeWidth="1" />
      <text style={titulo} fontWeight="500" fontSize="24" letterSpacing="8" fill="#d4d4d8">
        <textPath href="#arco-logo">NAVIA · BARBER CLUB · NAVIA · BARBER CLUB ·</textPath>
      </text>
      <Tijeras x={200} y={132} escala={1.4} color="#a1a1aa" />
      <text x="200" y="208" textAnchor="middle" style={titulo} fontWeight="700" fontSize="64" letterSpacing="2" fill="#fff">
        NAVIA
      </text>
      {/* El bigote */}
      <path
        transform="translate(160,222) scale(2)"
        d="M0 6 C4 -1 12 -1 20 5 C28 -1 36 -1 40 6 C36 3 32 7 26 8 C23 8.5 21 7.5 20 6.5 C19 7.5 17 8.5 14 8 C8 7 4 3 0 6 Z"
        fill="#fff"
      />
    </svg>
  );
}

export function MarcaLogo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <circle cx="32" cy="32" r="30" fill="#0b0b0c" stroke="#fff" strokeWidth="2.5" />
      <circle cx="32" cy="32" r="24" fill="none" stroke="#71717a" strokeWidth="1" />
      <text x="32" y="41" textAnchor="middle" style={titulo} fontWeight="700" fontSize="26" fill="#fff">
        N
      </text>
    </svg>
  );
}
