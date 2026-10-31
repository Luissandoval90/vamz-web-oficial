# VAMZ Studio

Web de recursos y comunidad construida con Next.js, React y TypeScript. Los visitantes exploran y descargan recursos publicados; las cuentas registradas pueden escribir reseñas moderadas. El panel, los archivos, las versiones de Minecraft y las redes oficiales están reservados al administrador.

## Desarrollo

Requiere Node.js 20.9 o superior.

```powershell
npm ci
npm run dev
```

La portada, la biblioteca vacía y los formularios se pueden revisar sin credenciales. Sin una base de datos configurada, la vista pública muestra los enlaces oficiales y no simula archivos publicados. Para probar cuentas, el panel y los recursos reales se necesitan las variables de entorno.

## Configuración

```powershell
Copy-Item .env.example .env.local
```

Completa las variables con las credenciales del proyecto. Usa un secreto aleatorio de al menos 32 caracteres para `JWT_SECRET` y una lista de correos de administradores separada por comas en `ADMIN_EMAILS`.

- La instalación de producción usa SQLite y almacenamiento local en la VPS. Consulta `.env.vps.example` y `deploy/VPS.md`.
- El código conserva compatibilidad con Turso y Cloudflare R2 para instalaciones anteriores.
- `RESOURCE_STORAGE_LIMIT_MB`, `MAX_UPLOAD_MB` y `MIN_FREE_SPACE_MB` limitan el almacén y las subidas de la VPS.

En la VPS, el contenedor ejecuta `npm run db:init` antes de iniciar la aplicación; prepara SQLite y la tabla de límites de autenticación sin borrar datos. La carpeta `drizzle` conserva las migraciones anteriores.

## Producción

```powershell
npx tsc --noEmit
npm run build
npm start
```

Vercel redirige al dominio principal. La aplicación, la base de datos y los archivos se ejecutan en la VPS mediante Docker Compose.

## Interfaz

- Diseño adaptable desde pantallas de 320 px hasta monitores amplios.
- Navegación accesible con teclado y menú móvil con cierre mediante Escape.
- Imágenes con dimensiones reservadas y carga diferida; portada prioritaria sin vídeo automático.
- Búsqueda que admite texto sin tildes, filtros por formato, ordenación y carga de 24 tarjetas por bloque.
- Animaciones breves que respetan la preferencia de movimiento reducido.
- Mensajes de error, estados vacíos y páginas 404.
- Fichas con vistas, descargas iniciadas y puntuaciones de reseñas aprobadas. Los contadores empiezan al activar esta función y deduplican por navegador y día; no representan personas únicas.
- Una reseña por cuenta y recurso, moderación de nuevas reseñas y ediciones, y retirada por su autor.
- Progreso real de subidas, bytes enviados y cancelación antes de confirmar la publicación.
- Portada panorámica con carrusel de publicaciones reales, navegación por teclado, pausa al interactuar y reproducción que se detiene fuera de pantalla o al solicitar movimiento reducido.
- Accesos por tipo de archivo, tira horizontal de descubrimientos, plataformas reales de Minecraft, redes oficiales y ayuda desplegable.

`app/studio.css` define la identidad y los componentes de presentación. `app/library.css` conserva los estilos de fichas, reseñas y administración; se retiraron las reglas de la portada anterior.

La prueba de interacción `scripts/test-studio-ui.mjs` se ejecuta con `playwright-cli run-code --filename=scripts/test-studio-ui.mjs` después de abrir una vista previa aislada con varios recursos publicados, incluido el recurso de prueba Spectral. Comprueba carrusel, pausa, enlaces, teclado, movimiento reducido, tira, ayuda, menú móvil y filtros. No se debe ejecutar contra producción con cuentas de prueba o archivos ficticios.

El navegador debe ser compatible con Next.js 16: Chrome, Edge y Firefox 111 o superior, o Safari 16.4 o superior. El diseño adaptable no sustituye la validación en dispositivos físicos.

## Estructura

- `app`: páginas y endpoints existentes.
- `components`: navegación, biblioteca pública, formularios y panel.
- `lib/public-content.ts`: lectura de recursos publicados y redes oficiales.
- `app/library.css`: diseño de la portada, las fichas, las reseñas y la biblioteca; `app/globals.css` conserva los estilos compartidos del panel.
- `db` y `drizzle`: esquema y migraciones de la base de datos.
# Alojamiento en VPS

La configuración para alojar la web, SQLite y los archivos en una sola VPS está en [deploy/VPS.md](deploy/VPS.md). Incluye Docker Compose, HTTPS y una herramienta para copiar los datos existentes sin modificar Turso ni R2.

El dominio principal es `https://vamz.umifront.com`. Caddy redirige el antiguo hostname de OVH y `vercel.json` redirige la dirección anterior conservando la ruta. Las cuentas y los archivos se mantienen; los usuarios deben iniciar sesión al entrar en el dominio nuevo.
