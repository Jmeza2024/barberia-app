// El logo de Navia Barber Studio, dibujado con SVG (líneas y texto), así se ve
// nítido en cualquier tamaño y no hay que cargar una imagen.
//
// <Logo>: el sello completo, con el texto alrededor. Para la portada y el ingreso.
// <MarcaLogo>: solo el círculo con la NV. Para lugares pequeños como el panel.

// La NV del dueño: dos piezas inclinadas. Las medidas vienen de su imagen
// original, por eso son números grandes; se achica con "scale" donde se use.
// Ocupa de x=402 a x=830 y de y=452 a y=925 (centro en 616, 688.5).
function MarcaNV({ cx, cy, alto, color }: { cx: number; cy: number; alto: number; color: string }) {
  const k = alto / 473;
  return (
    <g fill={color} transform={`translate(${cx - 616 * k} ${cy - 688.5 * k}) scale(${k})`}>
      <polygon points="439,584 493,568 709,833 632,856 497,680 480,901 402,925" />
      <polygon points="517,548 596,524 735,703 752,476 830,452 795,800 740,817" />
    </g>
  );
}

const anillo = { fontFamily: "var(--font-cinzel), serif" };

export default function Logo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} role="img" aria-label="Navia Barber Studio">
      <defs>
        {/* Los arcos por donde va el texto: arriba "NAVIA BARBER", abajo "STUDIO". */}
        <path id="arco-arriba" d="M27 100 A73 73 0 0 1 173 100" />
        <path id="arco-abajo" d="M20 100 A80 80 0 0 0 180 100" />
      </defs>
      <circle cx="100" cy="100" r="95" fill="rgb(0 0 0 / 0.55)" stroke="#e5e5e5" strokeWidth="2.5" />
      <circle cx="100" cy="100" r="60" fill="none" stroke="#52525b" strokeWidth="1" />
      <text style={anillo} fontWeight="700" fontSize="17" letterSpacing="6" textAnchor="middle" fill="#d4d4d8">
        <textPath href="#arco-arriba" startOffset="50%">NAVIA BARBER</textPath>
      </text>
      <text style={anillo} fontWeight="700" fontSize="15" letterSpacing="6" textAnchor="middle" fill="#d4d4d8">
        <textPath href="#arco-abajo" startOffset="50%">STUDIO</textPath>
      </text>
      <circle cx="22" cy="100" r="2" fill="#d4d4d8" />
      <circle cx="178" cy="100" r="2" fill="#d4d4d8" />
      <MarcaNV cx={100} cy={93} alto={70} color="#fff" />
      {/* Las tijeras, debajo de la NV */}
      <g transform="translate(100 150) scale(0.9)" fill="none" stroke="#a1a1aa" strokeWidth="1.6">
        <circle cx="-5" cy="4" r="3" />
        <circle cx="5" cy="4" r="3" />
        <path d="M-3 2 L6 -8 M3 2 L-6 -8" />
      </g>
    </svg>
  );
}

export function MarcaLogo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <circle cx="32" cy="32" r="30" fill="#0b0b0c" stroke="#fff" strokeWidth="2.5" />
      <circle cx="32" cy="32" r="24" fill="none" stroke="#71717a" strokeWidth="1" />
      <MarcaNV cx={32} cy={32} alto={30} color="#fff" />
    </svg>
  );
}
