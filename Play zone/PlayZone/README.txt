# PlayZone conectado a Supabase

## Archivos
- `index.html`: estructura de la web.
- `style.css`: diseño original.
- `script.js`: conexión con Supabase, catálogo compartido y panel privado.

## Configuración ya incluida
- Project URL de Supabase: https://wzrpqkltoszjudzmrktk.supabase.co
- Se utiliza una clave `sb_publishable_` en el navegador. Es una clave pública; nunca incluyas una clave `sb_secret_` o `service_role` en estos archivos.
- Tabla esperada: `public.juegos`.
- Columnas esperadas: `id`, `nombre`, `categoria`, `url`, `imagen`, `modo`, `destacado`, `created_at`.

## Publicar en GitHub Pages
Sube/reemplaza los tres archivos (`index.html`, `style.css`, `script.js`) en la carpeta raíz que publica GitHub Pages. Conserva la estructura del repositorio.

## Uso
- Los visitantes pueden ver el catálogo sin iniciar sesión.
- Pulsa «Administrar» e inicia sesión con el usuario que creaste en Supabase Authentication.
- Añade, edita y elimina juegos desde el panel. Los cambios se guardan en Supabase.

## Seguridad
- Mantén desactivados los registros públicos en Supabase.
- Crea usuarios administradores solo desde Supabase Dashboard.
- No compartas contraseñas ni claves secretas.
- Las políticas RLS de INSERT, UPDATE y DELETE están destinadas a usuarios `authenticated`. Si vuelves a permitir registros públicos, cualquier usuario que se registre podría tener esos permisos: no lo hagas.

## Actualización en tiempo real
El proyecto se suscribe a Supabase Realtime para refrescar el catálogo cuando cambie la tabla. Si no se actualiza automáticamente en otro dispositivo, habilita `juegos` en Database > Publications/Replication para la publicación `supabase_realtime`. Aunque Realtime no esté habilitado, los cambios se verán al recargar la web.
