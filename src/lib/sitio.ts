// La dirección de la app (ej. https://mibarberia.vercel.app), para armar
// los enlaces que van en los mensajes de WhatsApp.
export function direccionSitio(encabezados: Headers) {
  return `${encabezados.get("x-forwarded-proto") ?? "http"}://${encabezados.get("host")}`;
}
