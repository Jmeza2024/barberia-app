-- =====================================================================
-- Etapa 1: esquema de la base de datos de la barbería
-- Cómo usarlo: Supabase > SQL Editor > New query > pegar todo > Run.
-- =====================================================================

-- Extensión para impedir que un barbero tenga dos citas a la misma hora.
create extension if not exists btree_gist;

-- ---------------------------------------------------------------------
-- 1. Tablas
-- ---------------------------------------------------------------------

-- Datos del negocio. Solo existe una fila (id = 1).
create table negocio (
  id                      int primary key default 1 check (id = 1),
  nombre                  text not null default 'Mi Barbería',
  direccion               text,
  telefono_whatsapp       text,
  hora_apertura           time not null default '08:00',
  hora_cierre             time not null default '19:00',
  minutos_anticipacion    int  not null default 60,   -- reservar con al menos 1 hora
  dias_para_reservar      int  not null default 14    -- hasta 14 días adelante
);

-- Barberos. Cada uno se conecta a un usuario de Supabase (auth.users).
-- rol = 'dueno' puede hacer todo; rol = 'barbero' solo lo suyo.
create table estilistas (
  id                    uuid primary key default gen_random_uuid(),
  usuario_id            uuid unique references auth.users (id) on delete set null,
  nombre                text not null,
  foto_url              text,
  rol                   text not null default 'barbero' check (rol in ('dueno', 'barbero')),
  porcentaje_comision   numeric(5, 2) not null default 0 check (porcentaje_comision between 0 and 100),
  activo                boolean not null default true,
  creado_en             timestamptz not null default now()
);

create table servicios (
  id            uuid primary key default gen_random_uuid(),
  nombre        text not null,
  categoria     text not null default 'Cortes',
  precio        numeric(12, 2) not null check (precio >= 0),
  duracion_min  int not null check (duracion_min > 0),
  activo        boolean not null default true
);

-- Qué servicios hace cada barbero (relación "muchos a muchos").
create table estilista_servicios (
  estilista_id  uuid references estilistas (id) on delete cascade,
  servicio_id   uuid references servicios (id) on delete cascade,
  primary key (estilista_id, servicio_id)
);

-- Horario semanal. dia_semana: 0 = domingo ... 6 = sábado.
create table horarios (
  id            uuid primary key default gen_random_uuid(),
  estilista_id  uuid not null references estilistas (id) on delete cascade,
  dia_semana    int  not null check (dia_semana between 0 and 6),
  hora_inicio   time not null,
  hora_fin      time not null check (hora_fin > hora_inicio)
);

-- Horas bloqueadas: almuerzo, vacaciones, festivos.
create table bloqueos (
  id            uuid primary key default gen_random_uuid(),
  estilista_id  uuid not null references estilistas (id) on delete cascade,
  inicio        timestamptz not null,
  fin           timestamptz not null check (fin > inicio),
  motivo        text
);

create table clientes (
  id         uuid primary key default gen_random_uuid(),
  nombre     text not null,
  telefono   text not null unique,
  correo     text,
  creado_en  timestamptz not null default now()
);

create table citas (
  id                    uuid primary key default gen_random_uuid(),
  cliente_id            uuid not null references clientes (id),
  estilista_id          uuid not null references estilistas (id),
  servicio_id           uuid not null references servicios (id),
  inicio                timestamptz not null,
  fin                   timestamptz not null check (fin > inicio),
  estado                text not null default 'confirmada'
                          check (estado in ('confirmada', 'atendida', 'cancelada', 'no_vino')),
  nota                  text,
  motivo_cancelacion    text,
  codigo_cancelacion    text not null default substr(md5(random()::text), 1, 12),
  recordatorio_enviado  boolean not null default false,
  creada_en             timestamptz not null default now(),

  -- La regla más importante: un barbero no puede tener dos citas activas
  -- que se crucen en el tiempo. La base de datos lo rechaza sola.
  exclude using gist (
    estilista_id with =,
    tstzrange(inicio, fin) with &&
  ) where (estado in ('confirmada', 'atendida'))
);

create table productos (
  id             uuid primary key default gen_random_uuid(),
  nombre         text not null,
  precio_venta   numeric(12, 2) not null check (precio_venta >= 0),
  costo          numeric(12, 2),
  existencias    int not null default 0,
  minimo_aviso   int not null default 3,
  activo         boolean not null default true
);

create table ventas (
  id            uuid primary key default gen_random_uuid(),
  fecha_hora    timestamptz not null default now(),
  estilista_id  uuid not null references estilistas (id),
  cita_id       uuid unique references citas (id),
  cliente_id    uuid references clientes (id),
  forma_pago    text not null default 'efectivo'
                  check (forma_pago in ('efectivo', 'transferencia', 'tarjeta')),
  total         numeric(12, 2) not null default 0
);

-- Cada línea de una venta: un servicio o un producto.
create table detalle_venta (
  id               uuid primary key default gen_random_uuid(),
  venta_id         uuid not null references ventas (id) on delete cascade,
  tipo             text not null check (tipo in ('servicio', 'producto')),
  servicio_id      uuid references servicios (id),
  producto_id      uuid references productos (id),
  cantidad         int not null default 1 check (cantidad > 0),
  precio_unitario  numeric(12, 2) not null,
  check (
    (tipo = 'servicio' and servicio_id is not null and producto_id is null) or
    (tipo = 'producto' and producto_id is not null and servicio_id is null)
  )
);

-- Historial de entradas y salidas de productos.
create table movimientos_inventario (
  id           uuid primary key default gen_random_uuid(),
  producto_id  uuid not null references productos (id) on delete cascade,
  fecha        timestamptz not null default now(),
  cantidad     int not null,              -- positivo = entrada, negativo = venta
  motivo       text not null
);

create index on citas (estilista_id, inicio);
create index on ventas (fecha_hora);
create index on ventas (estilista_id, fecha_hora);

-- ---------------------------------------------------------------------
-- 2. Reglas automáticas (triggers)
-- ---------------------------------------------------------------------

-- Al marcar una cita como "atendida", se crea su venta automáticamente.
create function crear_venta_de_cita() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_venta_id uuid;
  v_precio   numeric(12, 2);
begin
  if new.estado = 'atendida' and old.estado is distinct from 'atendida'
     and not exists (select 1 from ventas where cita_id = new.id) then
    select precio into v_precio from servicios where id = new.servicio_id;

    -- El total empieza en 0; lo suma el trigger de detalle_venta.
    insert into ventas (estilista_id, cita_id, cliente_id)
    values (new.estilista_id, new.id, new.cliente_id)
    returning id into v_venta_id;

    insert into detalle_venta (venta_id, tipo, servicio_id, precio_unitario)
    values (v_venta_id, 'servicio', new.servicio_id, v_precio);
  end if;
  return new;
end;
$$;

create trigger al_atender_cita
after update of estado on citas
for each row execute function crear_venta_de_cita();

-- Cada línea nueva suma al total de la venta. Si es un producto,
-- además baja el inventario y queda el movimiento.
create function procesar_detalle_venta() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update ventas set total = total + new.cantidad * new.precio_unitario
  where id = new.venta_id;

  if new.tipo = 'producto' then
    update productos set existencias = existencias - new.cantidad
    where id = new.producto_id;

    insert into movimientos_inventario (producto_id, cantidad, motivo)
    values (new.producto_id, -new.cantidad, 'venta');
  end if;
  return new;
end;
$$;

create trigger al_agregar_detalle
after insert on detalle_venta
for each row execute function procesar_detalle_venta();

-- ---------------------------------------------------------------------
-- 3. Seguridad: quién puede ver y cambiar qué (Row Level Security)
-- ---------------------------------------------------------------------

-- Funciones de ayuda: ¿quién está conectado?
create function mi_estilista_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from estilistas where usuario_id = auth.uid() and activo
$$;

create function soy_dueno() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from estilistas where usuario_id = auth.uid() and rol = 'dueno' and activo
  )
$$;

alter table negocio                 enable row level security;
alter table estilistas              enable row level security;
alter table servicios               enable row level security;
alter table estilista_servicios     enable row level security;
alter table horarios                enable row level security;
alter table bloqueos                enable row level security;
alter table clientes                enable row level security;
alter table citas                   enable row level security;
alter table productos               enable row level security;
alter table ventas                  enable row level security;
alter table detalle_venta           enable row level security;
alter table movimientos_inventario  enable row level security;

-- Público (clientes sin cuenta): ver negocio, servicios activos y qué hace cada barbero.
create policy "publico ve negocio"    on negocio             for select using (true);
create policy "publico ve servicios"  on servicios           for select using (activo or soy_dueno());
create policy "publico ve relacion"   on estilista_servicios for select using (true);
create policy "publico ve horarios"   on horarios            for select using (true);

-- Datos públicos de los barberos SIN la comisión (vista separada).
create view estilistas_publicos as
  select id, nombre, foto_url from estilistas where activo;
grant select on estilistas_publicos to anon, authenticated;

-- Barberos: cada uno ve su ficha; el dueño ve y edita todas.
create policy "ver estilistas" on estilistas for select
  using (usuario_id = auth.uid() or soy_dueno());
create policy "dueno edita estilistas" on estilistas for all
  using (soy_dueno()) with check (soy_dueno());

-- Catálogo: solo el dueño lo cambia.
create policy "dueno edita negocio"   on negocio             for update using (soy_dueno());
create policy "dueno edita servicios" on servicios           for all using (soy_dueno()) with check (soy_dueno());
create policy "dueno edita relacion"  on estilista_servicios for all using (soy_dueno()) with check (soy_dueno());
create policy "dueno edita horarios"  on horarios            for all using (soy_dueno()) with check (soy_dueno());

-- Bloqueos: el barbero maneja los suyos, el dueño todos.
create policy "bloqueos propios" on bloqueos for all
  using (estilista_id = mi_estilista_id() or soy_dueno())
  with check (estilista_id = mi_estilista_id() or soy_dueno());

-- Citas: el barbero ve y cambia las suyas, el dueño todas.
-- (Los clientes reservan por una función segura que haremos en la etapa 3.)
create policy "citas propias" on citas for all
  using (estilista_id = mi_estilista_id() or soy_dueno())
  with check (estilista_id = mi_estilista_id() or soy_dueno());

-- Clientes: cualquier persona del equipo conectada los ve y los crea.
create policy "equipo ve clientes" on clientes for all
  using (mi_estilista_id() is not null)
  with check (mi_estilista_id() is not null);

-- Productos: el equipo los ve, solo el dueño los edita.
create policy "equipo ve productos"  on productos for select using (mi_estilista_id() is not null);
create policy "dueno edita productos" on productos for all using (soy_dueno()) with check (soy_dueno());

-- Ventas: cada barbero ve y registra las suyas; el dueño todas.
create policy "ventas propias" on ventas for all
  using (estilista_id = mi_estilista_id() or soy_dueno())
  with check (estilista_id = mi_estilista_id() or soy_dueno());
create policy "detalle de ventas propias" on detalle_venta for all
  using (exists (select 1 from ventas v where v.id = venta_id
                 and (v.estilista_id = mi_estilista_id() or soy_dueno())))
  with check (exists (select 1 from ventas v where v.id = venta_id
                      and (v.estilista_id = mi_estilista_id() or soy_dueno())));

create policy "dueno ve inventario" on movimientos_inventario for all
  using (soy_dueno()) with check (soy_dueno());
