// Foto de la barbería de fondo, fija: al bajar la página la foto no se mueve
// y el contenido pasa por encima (efecto "parallax").
// Usamos position: fixed en vez de background-attachment: fixed porque
// este último no funciona en los iPhone.
import Image from "next/image";

export default function FondoFoto() {
  return (
    <div aria-hidden className="fixed inset-0 -z-10">
      {/* La foto está en public/fondo-barberia.jpg, a todo color. */}
      <Image src="/fondo-barberia.jpg" alt="" fill priority sizes="100vw" className="object-cover" />
      {/* Capa negra encima para que el texto blanco se lea bien. */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/60 to-black/80" />
    </div>
  );
}
