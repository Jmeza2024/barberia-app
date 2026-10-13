# Lo que aprendimos en la etapa 5: la agenda

## Cómo activarlo en tu Supabase
1. En la terminal de VS Code: `git pull origin main`.
2. En Supabase > SQL Editor > **+ New query**, pega `supabase/migrations/0003_agenda.sql` y dale **Run**.
3. `npm run dev` y entra al panel.

## Qué hay de nuevo

| Pantalla | Dirección | Qué hace |
|---|---|---|
| Agenda | `/panel` | Citas de un día con botones de día anterior y siguiente. El dueño puede filtrar por barbero. |
| Detalle de cita | `/panel/cita/[id]` | Marcar **Atendida** o **No vino**, **cambiar la hora** (y el barbero, si eres el dueño) o **cancelar** con un motivo. |
| Nueva cita | `/panel/nueva-cita` | Agendar a quien llama o llega al local. |

Después de cancelar o cambiar una cita aparece el botón **Enviar aviso por WhatsApp**, con el mensaje ya escrito para el cliente. En la etapa 8 esos avisos saldrán solos.

## Ideas importantes

### Guardar el estado en la dirección (searchParams)
En vez de usar `useState`, el día y el barbero elegidos van en la dirección:
```
/panel?fecha=2026-10-14&barbero=abc
```
Ventajas: los botones "Anterior" y "Siguiente" son simples enlaces, puedes recargar la página sin perder lo elegido, y puedes compartir el enlace. La página lo lee así:
```tsx
export default async function PanelAgenda({ searchParams }) {
  const { fecha } = await searchParams;
```

### Formularios GET
El filtro de barbero es un `<form>` sin `action`. Al enviarlo, el navegador pone sus campos en la dirección (`?fecha=...&barbero=...`). No necesita nada de JavaScript.

### Muchos botones, cada uno con su acción
Para cambiar la hora, cada hora libre es un pequeño formulario con su acción ya preparada:
```tsx
<form action={cambiarHora.bind(null, cita.id, barbero, hora, duracion)}>
```
`.bind()` deja "pegados" los datos de esa hora, así el botón no necesita campos ocultos.

### La base de datos protege, otra vez
- El barbero no ve el selector de barbero, pero aunque alguien lo intente, la regla RLS de `citas` no le deja asignar una cita a otro barbero ni abrir citas ajenas (le sale 404).
- La restricción `exclude using gist` de la etapa 1 impide que dos citas se crucen. Cuando pasa, Postgres responde con el código `23P01` y mostramos "Ese barbero ya tiene una cita a esa hora".
- Marcar **Atendida** dispara el trigger de la etapa 1 que crea la venta. Ese registro lo usaremos en la etapa 6.

### Una función solo para el equipo
`horas_libres_equipo` (en `0003_agenda.sql`) es como `horas_disponibles`, pero ignora la cita que se está moviendo y no exige la hora de anticipación. Con `revoke ... from anon` y `grant ... to authenticated`, solo la pueden usar usuarios conectados.

## Probado
Con el login de Supabase corriendo localmente y un navegador de tamaño celular:
- La agenda de hoy sale vacía. "Siguiente" muestra las 2 citas de mañana y el filtro por barbero deja solo la suya.
- La cita de Luis pasó a las 10:00 del miércoles, con el mensaje de WhatsApp listo.
- La cita de Ana se canceló con motivo y su hora quedó libre.
- Se creó una cita a mano en ese hueco. Una segunda a la misma hora fue rechazada y el formulario conservó lo escrito.
- Al marcarla Atendida se registró su venta.
- Carlos (barbero) solo ve sus citas, no ve el selector de barbero, y si abre la cita del dueño le sale 404.

## Mini reto
En `src/lib/estados.ts` cambia los colores de los estados (por ejemplo `bg-blue-100` por `bg-purple-100`) y mira la agenda.
