# Aprende: la tarjeta de cortes (10 cortes y el siguiente gratis)

## Cómo funciona para el cliente

- **No tiene que crear cuenta.** Su número de celular es su tarjeta: es el mismo que escribe al reservar.
- Cada cita que el barbero marca como **Atendida** le suma un sello. Las citas canceladas o donde no vino no cuentan.
- En **/tarjeta** escribe su celular y ve sus sellos. También los ve en la página de cada cita.
- Al completar los 10, su **próxima reserva queda gratis sola**. No tiene que hacer nada.

## Cómo funciona para el equipo

- En el detalle de cada cita se ve la tarjeta del cliente.
- Cuando el barbero marca **Atendida** el corte número 10, sale un aviso verde con el botón
  **Enviar aviso por WhatsApp**: "¡Felicitaciones! Tu próximo corte es GRATIS".
- La cita gratis sale en la agenda con la etiqueta **🎁 Gratis**. Al atenderla, la venta queda en $0
  (por eso no suma comisión al barbero).

## Dónde está en el código

| Qué | Dónde |
|---|---|
| Las reglas (sellos, gratis, venta en $0) | `supabase/migrations/0007_tarjeta_cortes.sql` |
| El dibujo de la tarjeta | `src/components/TarjetaSellos.tsx` |
| La página del cliente | `src/app/tarjeta/page.tsx` |
| El aviso al completar | `marcarEstado` en `src/app/panel/cita/[id]/acciones.ts` |
| El texto del WhatsApp | `mensajePremio` en `src/lib/mensajes.ts` |

**La cuenta se hace en la base de datos** (`tarjeta_de`): cuenta las citas atendidas que no fueron
gratis, divide entre 10 y le resta los cortes gratis ya usados o reservados. Así no hay un contador
que se pueda desordenar: si se anula una cita, la cuenta se corrige sola.

**Un trigger** (`aplicar_corte_gratis`) revisa cada cita nueva: si el cliente tiene un corte gratis
ganado, la marca `gratis = true`. Funciona igual si la reserva la hace el cliente o un barbero desde el panel.

## Cambiar el número de cortes

En Supabase → **Table Editor → negocio**, columna `cortes_para_premio` (por defecto 10).
