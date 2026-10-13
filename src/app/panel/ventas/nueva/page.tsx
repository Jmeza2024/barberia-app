// Página /panel/ventas/nueva: registrar una venta sin cita, por ejemplo
// alguien que llegó sin reservar o que solo compró un producto.
import Link from "next/link";
import { obtenerPerfil } from "@/lib/sesion";
import FormularioVenta from "./FormularioVenta";

export default async function PaginaNuevaVenta() {
  const { supabase, perfil } = await obtenerPerfil();
  const esDueno = perfil?.rol === "dueno";

  const [{ data: servicios }, { data: productos }, { data: barberos }] = await Promise.all([
    supabase.from("servicios").select("id, nombre, precio").eq("activo", true).order("nombre"),
    supabase
      .from("productos")
      .select("id, nombre, precio_venta, existencias")
      .eq("activo", true)
      .order("nombre"),
    esDueno
      ? supabase.from("estilistas").select("id, nombre").eq("activo", true).order("nombre")
      : Promise.resolve({ data: null }),
  ]);

  return (
    <section className="max-w-md">
      <Link href="/panel/ventas" className="text-sm underline">
        ← Volver a ventas
      </Link>
      <h1 className="mt-3 text-2xl font-bold">Registrar venta</h1>
      <p className="mt-1 text-sm opacity-70">
        Las citas atendidas se registran solas. Usa esto para quien llegó sin cita o solo compró un
        producto.
      </p>
      <FormularioVenta
        servicios={servicios ?? []}
        productos={productos ?? []}
        barberos={barberos}
        miId={perfil?.id ?? ""}
      />
    </section>
  );
}
