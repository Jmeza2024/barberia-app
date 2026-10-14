// /api/recordatorios: el envío automático de los recordatorios de mañana.
// Vercel lo llama solo una vez al día (ver vercel.json) y manda la clave
// CRON_SECRET para que nadie más pueda dispararlo.
import { crearClienteAdmin } from "@/lib/supabase/admin";
import { hoyEnBogota, sumarDias } from "@/lib/formato";
import { enviarRecordatoriosDelDia } from "@/lib/recordatorios";
import { direccionSitio, whatsappConfigurado } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secreto = process.env.CRON_SECRET;
  if (!secreto || request.headers.get("authorization") !== `Bearer ${secreto}`) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!whatsappConfigurado()) {
    return Response.json({ modo: "manual", mensaje: "WhatsApp Business no está configurado" });
  }

  // Sin sesión de usuario: usamos el cliente admin para ver las citas de todos.
  const manana = sumarDias(hoyEnBogota(), 1);
  const resultado = await enviarRecordatoriosDelDia(crearClienteAdmin(), manana, direccionSitio());
  return Response.json({ fecha: manana, ...resultado });
}
