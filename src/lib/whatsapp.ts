// Envío automático por WhatsApp Business (la "Cloud API" de Meta).
//
// Solo funciona si en las claves (.env.local o Vercel) están
// WHATSAPP_TOKEN y WHATSAPP_PHONE_ID. Si no están, la app sigue igual,
// con los botones para enviar a mano. Ver docs/aprende-etapa-8.md.
import "server-only";
import { numeroInternacional } from "./formato";
import type { Plantilla } from "./mensajes";

export function whatsappConfigurado() {
  return !!process.env.WHATSAPP_TOKEN && !!process.env.WHATSAPP_PHONE_ID;
}

// Envía una plantilla aprobada en Meta. Devuelve true si Meta la recibió.
export async function enviarPlantilla(telefono: string, plantilla: Plantilla): Promise<boolean> {
  if (!whatsappConfigurado()) return false;

  const api = process.env.WHATSAPP_API_URL ?? "https://graph.facebook.com/v21.0";
  try {
    const respuesta = await fetch(`${api}/${process.env.WHATSAPP_PHONE_ID}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: numeroInternacional(telefono),
        type: "template",
        template: {
          name: plantilla.nombre,
          language: { code: "es" },
          components: [
            {
              type: "body",
              parameters: plantilla.datos.map((texto) => ({ type: "text", text: texto })),
            },
          ],
        },
      }),
    });
    if (!respuesta.ok) {
      console.error("WhatsApp no aceptó el mensaje:", respuesta.status, await respuesta.text());
    }
    return respuesta.ok;
  } catch (error) {
    console.error("No se pudo conectar con WhatsApp:", error);
    return false;
  }
}

// La dirección pública de la app, para los enlaces de los mensajes.
// En Vercel se pone SITIO_URL=https://tu-app.vercel.app
export function direccionSitio(encabezados?: Headers) {
  if (process.env.SITIO_URL) return process.env.SITIO_URL.replace(/\/$/, "");
  if (encabezados) {
    return `${encabezados.get("x-forwarded-proto") ?? "http"}://${encabezados.get("host")}`;
  }
  return "http://localhost:3000";
}
