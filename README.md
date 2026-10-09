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
   - `supabase/seed.sql` (datos de ejemplo)
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
| `src/lib/supabase/` | La conexión con Supabase, una para el navegador y otra para el servidor. |
| `supabase/migrations/` | El SQL que crea la base de datos: tablas, reglas automáticas y permisos. |
| `supabase/seed.sql` | Datos de ejemplo para probar. |
| `.env.example` | Plantilla de las claves. Las reales van en `.env.local`, que **nunca** se sube a GitHub. |

## Etapas

- [x] 0. Preparar el proyecto
- [x] 1. Base de datos
- [ ] 2. Páginas públicas
- [ ] 3. Reservar cita
- [ ] 4. Login y roles
- [ ] 5. Agenda
- [ ] 6. Ventas y productos
- [ ] 7. Reportes y comisión
- [ ] 8. WhatsApp
- [ ] 9. Lanzar
