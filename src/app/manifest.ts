// El "manifest" le dice al celular cómo mostrar la app cuando alguien la
// agrega a la pantalla de inicio: nombre, ícono y colores. Así se abre
// como una app, sin la barra del navegador.
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Barbería",
    short_name: "Barbería",
    description: "Reserva tu cita en la barbería",
    start_url: "/",
    display: "standalone",
    background_color: "#0b0b0c",
    theme_color: "#0b0b0c",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
