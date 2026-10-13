# Lo que aprendimos en la etapa 6: ventas y productos

## Cómo activarlo en tu Supabase
1. En la terminal de VS Code: `git pull origin main`.
2. En VS Code abre `supabase/migrations/0004_ventas.sql`, selecciona todo (**Ctrl + A**) y cópialo (**Ctrl + C**).
3. En Supabase > SQL Editor > **+ New query**, pega el contenido y dale **Run**. Debe decir *Success. No rows returned*.
4. `npm run dev` y entra al panel. Arriba verás **Ventas** y **Productos**.

## Qué hay de nuevo

| Pantalla | Dirección | Qué hace |
|---|---|---|
| Ventas del día | `/panel/ventas` | Cortes, plata de servicios, plata de productos y total del día. Cuánto entró en efectivo, transferencia y tarjeta. El dueño ve además una tabla por barbero. |
| Registrar venta | `/panel/ventas/nueva` | Para quien llega sin cita o solo compra un producto: servicio (con precio editable si hay descuento), productos con botones + y −, y forma de pago. |
| Detalle de venta | `/panel/ventas/[id]` | Corregir el precio o la forma de pago, agregar un producto (la cera que compró después del corte) o **anular** la venta si fue un error. |
| Productos | `/panel/productos` | Precio y unidades de cada producto, con aviso cuando quedan pocos. El dueño crea productos, cambia precios, suma unidades cuando llega mercancía y desactiva los que ya no vende. |

Las citas que se marcan **Atendida** siguen creando su venta solas. En la cita aparece el botón **Ver venta · agregar productos**.

## Ideas importantes

### Transacciones: todo o nada
Registrar una venta son varios pasos: crear la venta, su servicio y cada producto. Si el tercer producto no tiene unidades, no queremos que quede guardada media venta. Por eso `registrar_venta` (en `0004_ventas.sql`) es **una sola función de Postgres**: si algo falla adentro, se deshace todo.
```sql
select registrar_venta(barbero, 'efectivo', servicio, 18000,
  '[{"producto": "id-de-la-cera", "cantidad": 2}]');
```
Desde Next.js se llama con `supabase.rpc("registrar_venta", {...})`.

### Triggers que hacen las cuentas
No sumamos el total en la página. Cada vez que se agrega una línea, el trigger de la etapa 1 suma al total, baja las unidades del producto y anota el movimiento. En esta etapa agregamos otro trigger: si corriges un precio, el total cambia solo con la diferencia.

### security invoker vs security definer
- `registrar_venta` corre con los permisos de quien la llama (*invoker*). Así RLS impide que un barbero registre ventas a nombre de otro, sin escribir esa regla otra vez.
- `anular_venta` corre como administrador (*definer*) porque tiene que devolver productos al inventario, y un barbero no puede tocar el inventario. Por eso revisa ella misma los permisos: el dueño anula cualquiera; un barbero, solo las suyas de hoy.

### Formularios controlados
`FormularioVenta.tsx` es un componente de cliente: al elegir un servicio pone su precio, y el total del botón se recalcula con cada + y −. Cada campo guarda su valor en `useState`:
```tsx
const [precio, setPrecio] = useState("");
<input value={precio} onChange={(e) => setPrecio(e.target.value)} />
```
Como el valor vive en React, si el servidor responde con un error nada de lo escrito se borra.

### Cálculos en un solo lugar
Las sumas por día, por barbero y por forma de pago están en `src/lib/ventas.ts`. En la etapa 7 los reportes semanales y mensuales usarán esas mismas funciones.

## Probado
Con el login de Supabase corriendo localmente y un navegador de tamaño celular:
- El dueño registró un corte con descuento ($18.000) más 2 ceras por transferencia: $68.000.
- Le agregó un shampoo y bajó el corte a $16.000; el total quedó en $88.000 solo.
- Ventas del día mostró 2 cortes, $28.000 en servicios, $72.000 en productos, $100.000 en total, y la tabla por barbero.
- Creó el producto "Cera mate" con 5 unidades y sumó 4 shampoos.
- Al anular la venta, las ceras y el shampoo volvieron al inventario.
- Pedir más unidades de las que hay es rechazado con "Solo quedan 6 unidad(es) de Aceite para barba".
- Carlos (barbero) solo ve sus ventas, no elige barbero al registrar, no puede cambiar productos, y no puede registrar ventas a nombre de otro.

## Mini reto
En `src/app/panel/ventas/page.tsx`, la tarjeta del total usa `bg-black`. Cámbiala por `bg-green-700` y mira cómo se ve en el celular.
