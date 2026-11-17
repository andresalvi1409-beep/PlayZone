# PlayZone

Portal de juegos de navegador hecho con HTML, CSS y JavaScript.

## Cómo abrirlo
1. Descomprime la carpeta.
2. Abre `index.html` con tu navegador.

## Panel de administración
- Pulsa «Administrar».
- La contraseña inicial está en `script.js`, en la constante `ADMIN_PASSWORD`.
- Cámbiala antes de publicar el sitio.
- Añade el nombre, categoría, URL y opcionalmente una imagen.
- Elige si se intenta abrir dentro de PlayZone (iframe) o en la página original.

## Importante sobre el panel
Esta versión guarda los juegos en `localStorage`, es decir, en el navegador y dispositivo donde se añaden. La contraseña está en JavaScript y cualquiera que inspeccione el código puede verla. Por tanto, NO es un panel privado seguro para una web pública y los juegos añadidos no se sincronizan con otros visitantes.

Para que un panel sea realmente privado y los juegos se publiquen para todos, hay que conectar un backend/base de datos con autenticación (por ejemplo, Supabase o Firebase).

## Juegos de ejemplo
La web incluye tres ejemplos para probar el diseño. Comprueba los enlaces y las condiciones de cada juego antes de publicarlo. Algunos sitios bloquean la inserción en iframe; para esos juegos selecciona «Abrir en la página original».
