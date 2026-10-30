import type { NextConfig } from "next";

// Encabezados de seguridad que el navegador recibe con cada página.
const seguridad = [
  // Ninguna otra página puede meter la app dentro de un marco (evita engaños de "clic falso").
  { key: "X-Frame-Options", value: "DENY" },
  // El navegador no adivina el tipo de archivo: usa el que dice el servidor.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Al abrir un enlace externo no se manda la dirección completa (con el código de la cita).
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // La app no usa cámara, micrófono ni ubicación: los dejamos apagados.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // Siempre por https (con candado).
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  // No anunciar que la app está hecha con Next.js.
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: seguridad }];
  },
};

export default nextConfig;
