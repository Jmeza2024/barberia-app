# Barbería App

App web para reservar citas en una barbería, con panel para el dueño y los barberos:
agenda, ventas, productos, comisiones y reportes.

Hecha con **Next.js** (pantallas y lógica), **Supabase** (base de datos y login),
**Tailwind CSS** (estilos) y se publica en **Vercel**.

## Cómo correrla en tu computador

1. Instala las dependencias (solo la primera vez):
   ```bash
   npm install
   ```
2. Crea tu archivo de claves copiando el ejemplo y llénalo con los datos de
   Supabase (Project Settings > API):
   ```bash
   cp .env.example .env.local
   ```
3. En Supabase > SQL Editor, ejecuta en orden:
   - `supabase/migrations/0001_esquema.sql` (crea las tablas y las reglas)
   - `supabase/seed.sql` (servicios y productos de ejemplo)
   - `supabase/migrations/0002_reservas.sql` (funciones para reservar)
   - `supabase/seed_barberos.sql` (dos barberos de ejemplo)
   - `supabase/conectar_dueno.sql` (conecta la cuenta del dueño; ver `docs/aprende-etapa-4.md`)
   - `supabase/migrations/0003_agenda.sql` (horas libres para cambiar citas)
   - `supabase/migrations/0004_ventas.sql` (registrar y anular ventas, inventario)
   - `supabase/migrations/0005_reportes.sql` (sumas para los reportes)
4. Arranca la app:
   ```bash
   npm run dev
   ```
   y abre http://localhost:3000. Deberías ver la lista de servicios.

## Qué hay en cada carpeta

| Ruta | Qué es |
|---|---|
| `src/app/` | Las pantallas. Cada carpeta es una dirección de la app (`page.tsx` es la página). |
| `src/app/page.tsx` | La página de inicio con los servicios y precios. |
| `src/app/reservar/` | La reserva de citas en 4 pasos. |
| `src/app/cita/[codigo]/` | La página de cada cita, para verla o cancelarla. |
| `src/app/ingresar/` | El login del equipo. |
| `src/app/panel/` | El panel del dueño y los barberos: agenda, citas, recordatorios, ventas, productos, reportes y barberos. |
| `src/app/panel/NavPanel.tsx` | El menú del panel: barra abajo en el celular, fila arriba en el computador. |
| `src/app/panel/servicios/` | Solo el dueño: cambiar nombre, precio y duración de los servicios, crear, ocultar o borrar. |
| `src/components/` | Piezas que se repiten: el logo, la foto de fondo, el aviso y el botón que pide confirmar. |
| `src/app/panel/mas/` | La pantalla "Más" del celular: Productos, Reportes, Barberos y Salir. |
| `src/app/globals.css` | Los colores de la app (negro, gris, blanco) en un solo lugar. |
| `src/app/manifest.ts` y `src/app/icon.svg` | Nombre e ícono para "Agregar a pantalla de inicio". |
| `src/lib/ventas.ts` | Sumas de ventas por día, por barbero y por forma de pago. |
| `src/lib/periodos.ts` y `src/lib/reportes.ts` | Periodos (día, semana, mes) y el cálculo de la comisión. |
| `src/lib/mensajes.ts` | Los textos de WhatsApp para los clientes (recordatorio, cancelación, cambio). |
| `src/lib/estados.ts` | Nombres y colores de los estados de una cita. |
| `src/middleware.ts` | Protege el panel: sin sesión manda a `/ingresar`. |
| `src/lib/sesion.ts` | Quién está conectado y si es dueño. |
| `src/lib/formato.ts` | Precios en pesos y horas de Bogotá. |
| `docs/` | Explicaciones de cada etapa para aprender. |
| `src/lib/supabase/` | La conexión con Supabase, una para el navegador y otra para el servidor. |
| `supabase/migrations/` | El SQL que crea la base de datos: tablas, reglas automáticas y permisos. |
| `supabase/seed.sql` | Datos de ejemplo para probar. |
| `.env.example` | Plantilla de las claves. Las reales van en `.env.local`, que **nunca** se sube a GitHub. |

## Etapas

- [x] 0. Preparar el proyecto
- [x] 1. Base de datos
- [x] 2. Páginas públicas
- [x] 3. Reservar cita
- [x] 4. Login y roles
- [x] 5. Agenda
- [x] 6. Ventas y productos
- [x] 7. Reportes y comisión
- [x] 8. WhatsApp
- [x] Diseño negro y gris ([explicación](docs/aprende-diseno.md))
- [ ] 9. Lanzar
