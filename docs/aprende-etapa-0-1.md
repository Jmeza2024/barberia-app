# Lo que aprendimos en las etapas 0 y 1

## Etapa 0: el proyecto

Creamos el proyecto con `create-next-app`, que arma la estructura básica de Next.js.

- **`package.json`**: la lista de librerías que usa la app y los comandos (`npm run dev`, `npm run build`).
- **`node_modules/`**: donde se descargan esas librerías. No se sube a GitHub (está en `.gitignore`), cada quien lo genera con `npm install`.
- **`src/app/page.tsx`**: la página de inicio. En Next.js, **cada carpeta dentro de `src/app` es una dirección** de la app. Por ejemplo, `src/app/reservar/page.tsx` será `tuapp.com/reservar`.
- **`.env.local`**: las claves secretas. Nunca se suben a GitHub porque el repositorio es público.

### Componentes de servidor
`page.tsx` es un **componente de servidor**: corre en el servidor, pide los datos a Supabase y le manda al celular el HTML ya armado. Así la página carga rápido y las consultas no se ven desde el navegador.

## Etapa 1: la base de datos

Todo está en `supabase/migrations/0001_esquema.sql`. Tiene tres partes:

### 1. Tablas
Una tabla es como una hoja de Excel con columnas fijas. Las principales:

| Tabla | Guarda |
|---|---|
| `estilistas` | Barberos, su rol (`dueno` o `barbero`) y su % de comisión. |
| `servicios` | Cortes y demás, con precio y duración. |
| `citas` | Quién, con qué barbero, qué servicio, a qué hora y su estado. |
| `ventas` + `detalle_venta` | Cada venta y sus líneas (servicios o productos). |
| `productos` + `movimientos_inventario` | Productos con precio y existencias, y su historial. |

Las columnas con `references` son **relaciones**: `citas.estilista_id` apunta a un barbero de `estilistas`. Así no repetimos datos.

### 2. Reglas automáticas (triggers)
Un trigger es código que la base de datos ejecuta sola cuando pasa algo:

- Cuando una cita pasa a **atendida**, se crea su venta.
- Cuando se agrega una línea a una venta, se **suma al total**. Si es un producto, **baja el inventario**.

Y una restricción especial (`exclude using gist`) impide que un barbero tenga **dos citas que se crucen**. Aunque dos clientes reserven al mismo tiempo, la base de datos rechaza la segunda.

### 3. Permisos (Row Level Security)
Cada tabla tiene reglas (`policy`) que dicen quién ve o cambia cada fila:

- `soy_dueno()` y `mi_estilista_id()` averiguan quién está conectado.
- El público solo ve servicios, horarios y nombre y foto de los barberos (la vista `estilistas_publicos` esconde la comisión).
- Cada barbero ve sus citas y ventas. El dueño ve todo y es el único que edita precios, productos y barberos.

Esto protege los datos aunque alguien intente saltarse las pantallas.

## Probado
Antes de subirlo, el SQL se probó en un PostgreSQL local:
- Una cita que se cruza con otra es rechazada.
- Marcar una cita de $20.000 como atendida y vender 2 shampoos de $22.000 da una venta de $64.000, y el inventario de shampoo baja de 8 a 6.
- Un visitante sin cuenta ve los 4 servicios, pero 0 ventas y 0 comisiones.

## Mini reto
Abre `src/app/page.tsx` y cambia el texto "Servicios y precios" por otro, o el color del botón (`bg-black` por `bg-amber-600`). Corre `npm run dev` y mira el cambio en http://localhost:3000.
