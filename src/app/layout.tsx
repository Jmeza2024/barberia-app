import type { Metadata, Viewport } from "next";
import { Inter, Oswald } from "next/font/google";
import "./globals.css";

// Las fuentes se descargan una vez al construir la app y se sirven desde
// nuestro propio servidor: el celular no tiene que ir a buscarlas a Google.
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const oswald = Oswald({ variable: "--font-oswald", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Barbería",
  description: "Reserva tu cita en la barbería",
};

// El color de la barra del navegador en el celular.
export const viewport: Viewport = {
  themeColor: "#0b0b0c",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.variable} ${oswald.variable} antialiased`}>{children}</body>
    </html>
  );
}
