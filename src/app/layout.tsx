import type { Metadata, Viewport } from "next";
import { Cinzel, Inter, Oswald } from "next/font/google";
import "./globals.css";

// Las fuentes se descargan una vez al construir la app y se sirven desde
// nuestro propio servidor: el celular no tiene que ir a buscarlas a Google.
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const oswald = Oswald({ variable: "--font-oswald", subsets: ["latin"] });
// Cinzel: la letra del texto alrededor del logo.
const cinzel = Cinzel({ variable: "--font-cinzel", subsets: ["latin"], weight: "700" });

export const metadata: Metadata = {
  title: "Navia Barber Studio",
  description: "Reserva tu cita en Navia Barber Studio",
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
      <body className={`${inter.variable} ${oswald.variable} ${cinzel.variable} antialiased`}>{children}</body>
    </html>
  );
}
