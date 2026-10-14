# Aprende: el diseño nuevo (negro, gris y blanco)

Este cambio no toca la base de datos. Solo cambia cómo se ve la app.

## 1. Los colores viven en un solo lugar

Abre `src/app/globals.css`. Dentro de `@theme` están los colores con nombre propio:

| Nombre   | Para qué                        | Clase de Tailwind |
| -------- | ------------------------------- | ----------------- |
| `fondo`  | el fondo negro de toda la app   | `bg-fondo`        |
| `tarjeta`| las cajas (citas, ventas)       | `bg-tarjeta`      |
| `borde`  | las líneas grises               | `border-borde`    |
| `suave`  | texto secundario, gris claro    | `text-suave`      |
| `boton`  | botones secundarios, grises     | `bg-boton`        |

Si mañana el dueño quiere el negro un poco más claro, cambias **un** número en
`globals.css` y cambia en todas las pantallas. Ese es el truco de `@theme`:
Tailwind crea las clases `bg-fondo`, `text-suave`, etc. a partir de esos nombres.

El blanco se usa solo para lo importante: el texto, los precios y el botón
principal de cada pantalla (`bg-white text-black`).

La app siempre está en modo oscuro: `color-scheme: dark` le dice al navegador
que también pinte oscuros los campos de fecha, las barras de desplazamiento, etc.

## 2. Las letras

En `src/app/layout.tsx` se cargan dos fuentes de Google con `next/font/google`:

- **Oswald** para los títulos (`h1`, `h2`): alta y angosta, estilo barbería.
- **Inter** para todo lo demás: fácil de leer en el celular.

`next/font` las descarga al compilar y las sirve desde tu propia app, así que
no dependen de Google cuando el cliente abre la página.

## 3. Los íconos

Usamos `lucide-react` (se instala con `npm install`). Cada ícono es un componente:

```tsx
import { Scissors } from "lucide-react";
<Scissors size={18} />
```

Toma el color del texto que lo rodea, así que no hay que pintarlo aparte.
Todos los íconos están en https://lucide.dev/icons.

## 4. El menú de abajo en el celular

`src/app/panel/NavPanel.tsx` dibuja dos menús:

- En el **celular**: una barra fija abajo con Agenda, Ventas, Recordar y Más.
- En el **computador** (`md:` = pantallas de 768 px o más): la fila completa arriba.

Usa `usePathname()` para saber en qué página estás y pintar esa opción en
blanco. Por eso tiene `"use client"`: necesita leer la dirección en el navegador.

"Más" (`src/app/panel/mas/page.tsx`) agrupa lo que se usa menos: Productos,
Reportes, Barberos y Salir.

## 5. Detalles pequeños

- **Chips de barbero** en la agenda: cada chip es un `<Link>` que cambia
  `?barbero=` en la dirección. No hace falta botón "Ver".
- **Barra de progreso** al reservar: 4 rayitas que se ponen blancas según el paso.
- **`loading.tsx`**: mientras el servidor trae los datos, Next.js muestra este
  esqueleto gris que parpadea (`animate-pulse`) en vez de una pantalla en blanco.
- **`manifest.ts` + `icon.svg`**: permiten "Agregar a pantalla de inicio" en el
  celular. La app abre sin la barra del navegador, con el ícono de tijeras.

## Por qué no usamos shadcn/ui

shadcn/ui agrega muchos archivos y conceptos nuevos. Con tus propios colores en
`@theme` más los íconos de lucide se logra el mismo estilo y cada pantalla se
sigue leyendo de arriba a abajo sin saltar entre archivos.
