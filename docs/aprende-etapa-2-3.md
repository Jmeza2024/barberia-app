# Lo que aprendimos en las etapas 2 y 3

## Cómo usarlo
En Supabase > SQL Editor ejecuta, en orden:
1. `supabase/migrations/0002_reservas.sql` (las funciones de reserva)
2. `supabase/seed_barberos.sql` (dos barberos de ejemplo con horario de lunes a sábado)

Luego `npm run dev` y entra a http://localhost:3000 > **Reservar cita**.

## Las pantallas nuevas

| Archivo | Dirección | Qué hace |
|---|---|---|
| `src/app/page.tsx` | `/` | Inicio con datos del negocio, botón "Reservar cita" y servicios. |
| `src/app/reservar/page.tsx` | `/reservar` | Trae servicios y barberos desde el servidor. |
| `src/app/reservar/Reserva.tsx` | (componente) | Los 4 pasos: servicio, barbero, día y hora, datos. |
| `src/app/cita/[codigo]/page.tsx` | `/cita/abc123` | Muestra la cita y permite cancelarla. |
| `src/lib/formato.ts` | (ayudantes) | Precios en pesos y horas de Bogotá. |

## Ideas importantes

### Componentes de servidor y de cliente
- **De servidor** (`page.tsx`): corren en el servidor, piden datos y mandan el HTML listo. No pueden reaccionar a toques.
- **De cliente** (`Reserva.tsx`, empieza con `"use client"`): corren en el celular y reaccionan a lo que el usuario toca.

Lo normal es que la página de servidor traiga los datos y se los pase al componente de cliente como **props** (`servicios`, `estilistas`...).

### Estado (`useState`)
En `Reserva.tsx`, cada cosa que el cliente elige se guarda en un estado:
```tsx
const [paso, setPaso] = useState(1);
```
`paso` es el valor actual y `setPaso` lo cambia. Cuando cambia, React vuelve a dibujar la pantalla. Así pasamos del paso 1 al 2 sin recargar.

### Efectos (`useEffect`)
Cuando cambia el día o el barbero, hay que pedir las horas libres otra vez. `useEffect` ejecuta código cada vez que cambian los valores de su lista: `[paso, servicio, estilistaId, fecha]`.

### Funciones de la base de datos (RPC)
El cliente no tiene permiso de escribir directo en la tabla `citas`. En cambio llama funciones de `0002_reservas.sql`:

| Función | Qué hace |
|---|---|
| `horas_disponibles` | Arma horas cada 15 min dentro del horario del barbero y quita las pasadas, las que chocan con otras citas y las bloqueadas. |
| `reservar_cita` | Revisa los datos, vuelve a comprobar que la hora siga libre y guarda la cita. Devuelve un código. |
| `ver_cita` | Muestra una cita a partir de su código. |
| `cancelar_cita` | Cancela si la cita sigue confirmada y no ha pasado. |

Desde la app se llaman así:
```ts
supabase.rpc("horas_disponibles", { p_servicio: ..., p_fecha: ... })
```

### Zona horaria
La base de datos guarda las horas en formato universal (UTC). Para mostrarlas usamos siempre `America/Bogota`, así un cliente con el celular en otra zona ve la hora correcta.

### Server Actions
El botón "Cancelar cita" llama a `cancelarCita` en `acciones.ts`, que empieza con `"use server"`. Esa función corre en el servidor aunque se llame desde un formulario.

## Probado
Se probó en un PostgreSQL local y en un navegador con tamaño de celular:
- Con 2 barberos, a las 10:00 caben 2 citas; la tercera recibe "Esa hora ya no está disponible".
- Después de reservar, esas horas desaparecen de la lista; al cancelar, vuelven.
- Los domingos y las fechas a más de 14 días no muestran horas.
- La reserva completa en el navegador: servicio, "Me da igual", lunes 10:00, datos, confirmación y cancelación.

## Mini reto
En `src/app/reservar/Reserva.tsx` cambia `"Me da igual"` por otro texto, o en `0002_reservas.sql` cambia `interval '15 minutes'` por `'30 minutes'` y mira cómo cambian las horas.
