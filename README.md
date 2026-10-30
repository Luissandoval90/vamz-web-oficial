# VAMZ Studio

Web de recursos y comunidad construida con Next.js, React y TypeScript. La interfaz utiliza una navegación común, una biblioteca con búsqueda, filtros por tipo y ordenación, y un panel privado para gestionar archivos y redes sociales.

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

- Turso almacena usuarios, metadatos de recursos y enlaces sociales.
- Cloudflare R2 almacena archivos y portadas.
- `RESOURCE_STORAGE_LIMIT_MB` y `TURSO_STORAGE_LIMIT_GB` establecen los límites mostrados en el panel.

En una base de datos nueva, ejecuta `npm run db:push`. La carpeta `drizzle` conserva las migraciones existentes. No es necesario modificar el esquema para aplicar este rediseño a una instalación existente.

## Producción

```powershell
npx tsc --noEmit
npm run build
npm start
```

En Vercel, conserva las variables de entorno de la instalación actual. Los endpoints de autenticación, el almacenamiento y los identificadores de los recursos se mantienen.

## Interfaz

- Diseño adaptable desde pantallas de 320 px hasta monitores amplios.
- Navegación accesible con teclado y menú móvil con cierre mediante Escape.
- Imágenes con dimensiones reservadas y carga diferida; portada prioritaria sin vídeo automático.
- Búsqueda que admite texto sin tildes, filtros por formato, ordenación y carga de 24 tarjetas por bloque.
- Animaciones breves que respetan la preferencia de movimiento reducido.
- Mensajes de error, estados vacíos y páginas 404.

El navegador debe ser compatible con Next.js 16: Chrome, Edge y Firefox 111 o superior, o Safari 16.4 o superior. El diseño adaptable no sustituye la validación en dispositivos físicos.

## Estructura

- `app`: páginas y endpoints existentes.
- `components`: navegación, biblioteca pública, formularios y panel.
- `lib/public-content.ts`: lectura de recursos publicados y redes oficiales.
- `app/globals.css`: estilos de la interfaz y reglas de adaptación.
- `db` y `drizzle`: esquema y migraciones de la base de datos.
# Alojamiento en VPS

La configuración para alojar la web, SQLite y los archivos en una sola VPS está en [deploy/VPS.md](deploy/VPS.md). Incluye Docker Compose, HTTPS y una herramienta para copiar los datos existentes sin modificar Turso ni R2.

La dirección provisional del despliegue es `https://vps-e9431466.vps.ovh.net`. `vercel.json` redirige la dirección anterior a la VPS conservando la ruta. Al configurar un dominio propio, actualiza `VAMZ_DOMAIN` en la VPS y el destino de esa redirección.
