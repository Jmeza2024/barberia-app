-- =====================================================================
-- Etapa 6: ventas y productos
-- Cómo usarlo: Supabase > SQL Editor > New query > pegar todo > Run.
--
-- Las tablas ya existen desde 0001 (ventas, detalle_venta, productos,
-- movimientos_inventario). Aquí agregamos funciones que hacen varios pasos
-- de una sola vez: si uno falla, no se guarda ninguno (es una "transacción").
-- =====================================================================

-- Si se corrige el precio de una línea (por ejemplo, un descuento),
-- el total de la venta se ajusta solo con la diferencia.
create function ajustar_total_venta() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update ventas
  set total = total + new.cantidad * new.precio_unitario - old.cantidad * old.precio_unitario
  where id = new.venta_id;
  return new;
end;
$$;

create trigger al_cambiar_precio_detalle
after update of precio_unitario on detalle_venta
for each row execute function ajustar_total_venta();

-- Agrega un producto a una venta, revisando que haya unidades.
-- "security invoker" (lo normal) significa que corre con los permisos de
-- quien la llama: las reglas RLS impiden agregar a una venta ajena.
create function agregar_producto_a_venta(p_venta uuid, p_producto uuid, p_cantidad int)
returns void
language plpgsql volatile set search_path = public as $$
declare
  v_producto productos;
begin
  if coalesce(p_cantidad, 0) < 1 then
    raise exception 'La cantidad debe ser al menos 1';
  end if;

  select * into v_producto from productos where id = p_producto and activo;
  if v_producto.id is null then
    raise exception 'Ese producto no existe o está desactivado';
  end if;
  if v_producto.existencias < p_cantidad then
    raise exception 'Solo quedan % unidad(es) de %', v_producto.existencias, v_producto.nombre;
  end if;

  -- El trigger de 0001 suma al total, baja las existencias y anota el movimiento.
  insert into detalle_venta (venta_id, tipo, producto_id, cantidad, precio_unitario)
  values (p_venta, 'producto', p_producto, p_cantidad, v_producto.precio_venta);
end;
$$;

-- Registra una venta sin cita (alguien que llegó y pagó, o que solo compró
-- un producto). Puede llevar un servicio, productos o las dos cosas.
-- p_productos es una lista así: [{"producto": "id", "cantidad": 2}, ...]
-- Devuelve el id de la venta nueva.
create function registrar_venta(
  p_estilista        uuid,
  p_forma_pago       text,
  p_servicio         uuid default null,
  p_precio_servicio  numeric default null,
  p_productos        jsonb default '[]'
) returns uuid
language plpgsql volatile set search_path = public as $$
declare
  v_venta  uuid;
  v_linea  jsonb;
begin
  if p_servicio is null and jsonb_array_length(coalesce(p_productos, '[]')) = 0 then
    raise exception 'Agrega un servicio o al menos un producto';
  end if;
  if p_servicio is not null and coalesce(p_precio_servicio, -1) < 0 then
    raise exception 'Escribe el precio del servicio';
  end if;

  -- RLS revisa que un barbero solo registre ventas a su nombre.
  insert into ventas (estilista_id, forma_pago)
  values (p_estilista, p_forma_pago)
  returning id into v_venta;

  if p_servicio is not null then
    insert into detalle_venta (venta_id, tipo, servicio_id, precio_unitario)
    values (v_venta, 'servicio', p_servicio, p_precio_servicio);
  end if;

  for v_linea in select * from jsonb_array_elements(coalesce(p_productos, '[]')) loop
    perform agregar_producto_a_venta(
      v_venta, (v_linea ->> 'producto')::uuid, (v_linea ->> 'cantidad')::int
    );
  end loop;

  return v_venta;
end;
$$;

-- Borra una venta hecha por error: devuelve los productos al inventario y,
-- si venía de una cita, la cita vuelve a "Confirmada".
-- El dueño puede anular cualquiera; un barbero solo las suyas de hoy.
-- Es "security definer" porque un barbero no puede tocar el inventario
-- directamente; por eso revisamos los permisos aquí mismo.
create function anular_venta(p_venta uuid) returns void
language plpgsql volatile security definer set search_path = public as $$
declare
  v_venta  ventas;
  v_linea  detalle_venta;
begin
  select * into v_venta from ventas where id = p_venta;
  if v_venta.id is null then
    raise exception 'Esa venta no existe';
  end if;

  if not soy_dueno() and not (
    v_venta.estilista_id = mi_estilista_id()
    and (v_venta.fecha_hora at time zone 'America/Bogota')::date
        = (now() at time zone 'America/Bogota')::date
  ) then
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

-- Llegó mercancía (o se corrige el conteo): suma unidades y anota el movimiento.
-- Solo el dueño: RLS no deja a los barberos cambiar productos.
create function sumar_existencias(p_producto uuid, p_cantidad int, p_motivo text default 'llegó mercancía')
returns void
language plpgsql volatile set search_path = public as $$
begin
  if coalesce(p_cantidad, 0) = 0 then
    raise exception 'Escribe cuántas unidades';
  end if;

  update productos set existencias = existencias + p_cantidad where id = p_producto;
  if not found then
    raise exception 'Solo el dueño puede cambiar el inventario';
  end if;

  insert into movimientos_inventario (producto_id, cantidad, motivo)
  values (p_producto, p_cantidad, p_motivo);
end;
$$;

-- Solo el equipo conectado puede usar estas funciones, no el público.
revoke execute on function agregar_producto_a_venta(uuid, uuid, int)            from public, anon;
revoke execute on function registrar_venta(uuid, text, uuid, numeric, jsonb)   from public, anon;
revoke execute on function anular_venta(uuid)                                  from public, anon;
revoke execute on function sumar_existencias(uuid, int, text)                  from public, anon;
grant  execute on function agregar_producto_a_venta(uuid, uuid, int)            to authenticated;
grant  execute on function registrar_venta(uuid, text, uuid, numeric, jsonb)   to authenticated;
grant  execute on function anular_venta(uuid)                                  to authenticated;
grant  execute on function sumar_existencias(uuid, int, text)                  to authenticated;
