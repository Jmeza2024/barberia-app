-- Etapa: cerrar dos huecos encontrados en la prueba de seguridad.
--
-- 1. La vista "estilistas_publicos" (la lista de barberos que ve el cliente)
--    se podía modificar desde afuera: cualquiera podía cambiarle el nombre
--    a un barbero o borrarlo. Ahora solo se puede leer.
-- 2. "anular_venta" dejaba anular una venta del día a alguien sin cuenta de
--    barbero, por cómo se comparaban los valores vacíos. Ahora la revisión
--    es estricta: solo el dueño, o el barbero de esa venta el mismo día.
-- 3. Las funciones del panel quedan cerradas para visitantes sin sesión.
--
-- Se puede correr más de una vez sin problema.

begin;

-- 1. La vista de barberos: solo lectura.
revoke all on estilistas_publicos from anon, authenticated;
grant select on estilistas_publicos to anon, authenticated;

-- 2. Anular venta con la revisión estricta.
create or replace function anular_venta(p_venta uuid) returns void
language plpgsql volatile security definer set search_path = public as $$
declare
  v_venta  ventas;
  v_linea  detalle_venta;
  v_puede  boolean;
begin
  select * into v_venta from ventas where id = p_venta;
  if v_venta.id is null then
    raise exception 'Esa venta no existe';
  end if;

  -- coalesce: si algo viene vacío (alguien sin ficha de barbero), cuenta como "no".
  v_puede := coalesce(soy_dueno(), false) or coalesce(
    v_venta.estilista_id = mi_estilista_id()
    and (v_venta.fecha_hora at time zone 'America/Bogota')::date
        = (now() at time zone 'America/Bogota')::date,
    false);

  if not v_puede then
    raise exception 'Solo el dueño puede anular esta venta';
  end if;

  for v_linea in select * from detalle_venta where venta_id = p_venta and tipo = 'producto' loop
    update productos set existencias = existencias + v_linea.cantidad where id = v_linea.producto_id;
    insert into movimientos_inventario (producto_id, cantidad, motivo)
    values (v_linea.producto_id, v_linea.cantidad, 'venta anulada');
  end loop;

  delete from ventas where id = p_venta;  -- borra también sus líneas (on delete cascade)

  if v_venta.cita_id is not null then
    update citas set estado = 'confirmada' where id = v_venta.cita_id;
  end if;
end;
$$;

-- 3. Funciones del panel: solo para el equipo con sesión.
do $$
declare f regprocedure;
begin
  for f in
    select p.oid::regprocedure from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('anular_venta', 'horas_libres_equipo', 'registrar_venta',
                        'agregar_producto_a_venta', 'sumar_existencias',
                        'reporte_por_barbero', 'reporte_por_dia', 'tarjeta_de')
  loop
    execute format('revoke execute on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;

commit;
