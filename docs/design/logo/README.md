# Logo de WillyTank

`willytank-logo-400.jpg` — 400×400 px, una "V" estilizada en verde, azul y plata.

**Origen:** estaba incrustado (en base64) dentro de los mockups originales
(`docs/design/mockups/WellTesting_Mockup_v10.html` y `v11.html`), usado en la pantalla de login,
las cabeceras y una miniatura. En el código real se había perdido porque nunca se extrajo como
archivo: el repositorio no tenía ninguna imagen. Se recuperó el 2026-10-19 y se copió a
`apps/web-supervisor/public/logo.jpg` y `apps/mobile-operator/public/logo.jpg`.

**Nota de diseño:** el JPG trae franjas azul marino arriba y abajo (el fondo ya viene "horneado").
En las pantallas se muestra dentro de un marco redondeado con `object-fit: cover`, como en el
mockup, que recorta esas franjas. Una versión con fondo transparente (SVG/PNG) sería ideal si el
cliente la tiene; este es el único archivo original disponible.
