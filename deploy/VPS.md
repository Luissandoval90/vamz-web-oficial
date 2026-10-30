# VAMZ en una sola VPS

El despliegue utiliza el mismo repositorio y la dirección provisional `https://vps-e9431466.vps.ovh.net`. La administración se encuentra en `/dashboard`; la gestión de instaladores está en `/dashboard?view=minecraft` y la biblioteca pública de versiones en `/minecraft`.

Los usuarios normales solo pueden explorar y descargar recursos publicados. No acceden al panel ni pueden subir, editar, publicar o borrar archivos, aunque conocieran las direcciones de las API. La gestión de recursos, versiones de Minecraft y redes sociales es exclusiva del administrador. Los archivos existentes se conservan. El registro público no permite reclamar un correo reservado para administración.

El inicio de sesión dirige al administrador a `/dashboard` y al resto a `/recursos`. Las sesiones se contrastan con la cuenta actual de la base de datos. Los intentos de acceso y registro tienen límites persistentes en SQLite; Caddy sobrescribe `X-Real-IP` y el puerto de la aplicación no se expone públicamente. Los cambios de estado bloquean orígenes ajenos, los cuerpos JSON se limitan a 16 KB y las redes solo aceptan HTTPS sin credenciales. Las páginas utilizan una política CSP con un nonce distinto en cada respuesta para los scripts, junto con protección frente a marcos, MIME incorrecto y permisos innecesarios del navegador. Estas medidas reducen riesgos; requieren mantenimiento y no garantizan invulnerabilidad.

La web se ejecuta con Next.js, SQLite local y archivos en disco. Caddy recibe las conexiones y gestiona HTTPS. No se necesitan Turso ni R2 después de verificar la migración. La configuración de Vercel sigue funcionando con `STORAGE_DRIVER=r2` o sin esa variable.

## Preparación

Pensado para Linux con Docker Engine y el complemento Docker Compose. La configuración de ejemplo limita la aplicación a 2 GB de RAM y las subidas del administrador a 2 GB por archivo (2048 MB). Las portadas tienen un máximo de 16 MB. El archivo principal se envía por streaming; las rutas antiguas de formularios multipart se limitan a 32 MB en Caddy para acotar el uso de memoria. Reserva 25.000 MB para recursos y portadas y comprueba que queden al menos 2 GB libres antes de aceptar una subida. En un disco de 40 GB también deben caber el sistema, las imágenes de Docker y las copias de seguridad: estos valores se ajustan al espacio real disponible.

Necesitas la IP pública, acceso SSH y un dominio propio. Crea un registro DNS `A` hacia la IP; añade `AAAA` únicamente si la IPv6 funciona. El subdominio `vamz-web-oficial.vercel.app` pertenece a Vercel y no puede apuntarse directamente a esta VPS. Para una comprobación provisional por IP puedes usar `VAMZ_DOMAIN=http://IP`, pero el acceso de usuarios requiere el dominio con HTTPS porque las cookies de producción son seguras.

Deja accesibles los puertos 80 y 443 para la web. La aplicación y la base de datos no publican sus propios puertos.

En esta VPS dedicada, `sudo sh deploy/harden-host.sh` instala Fail2ban desde los repositorios de Ubuntu y activa UFW, permitiendo SSH en el puerto 22 y web en 80/443 (IPv4 e IPv6). Conserva el acceso SSH por contraseña y por clave; bloquea temporalmente los intentos SSH repetidos. Si alojas otros servicios o cambias el puerto SSH, adapta las reglas antes de ejecutarlo. Los puertos publicados por Docker pueden saltarse UFW: `compose.yaml` solo debe publicar Caddy, nunca la base de datos ni el puerto 3000.

## Copiar los datos existentes

Realiza la copia final durante una pausa de las subidas y de la edición del catálogo. La herramienta toma una instantánea de las tablas, pero los objetos de R2 se descargan después; mantener el origen estable evita cambios entre ambos pasos.

En una copia del repositorio con Node.js 22 y `npm ci`, crea un archivo privado `.env.migration` con estas variables, usando los valores actuales del proyecto:

```dotenv
SOURCE_TURSO_DATABASE_URL=libsql://...
SOURCE_TURSO_AUTH_TOKEN=...
SOURCE_R2_ENDPOINT=https://....r2.cloudflarestorage.com
SOURCE_R2_BUCKET=...
SOURCE_R2_ACCESS_KEY_ID=...
SOURCE_R2_SECRET_ACCESS_KEY=...
```

No lo subas a Git ni lo compartas en el chat. Ejecuta:

```bash
node --env-file=.env.migration scripts/migrate-vps.mjs --target ./data
```

El destino debe ser nuevo. Se conservan usuarios, hashes de contraseñas, recursos privados y publicados, fechas, portadas y enlaces sociales. La herramienta copia solo los archivos referenciados por la base de datos; verifica tamaños, SHA-256, recuentos e integridad de SQLite. Corrige en la copia los tamaños antiguos que estaban a cero. No modifica ni elimina el origen. Si falla, deja un directorio `.vamz-migration-*` para revisar el intento; no lo uses como datos de producción.

Transfiere el directorio `data` completo a la VPS si ejecutaste la migración en otro equipo. El archivo `data/migration-manifest.json` permite comprobar los archivos copiados. Comprueba manualmente el inicio de sesión de una cuenta existente y varios recursos antes del cambio de dominio.

## Arrancar en la VPS

Desde el directorio del repositorio:

```bash
cp .env.vps.example .env
chmod 600 .env
```

Edita `.env`: pon tu dominio, el correo de administrador y un secreto aleatorio de al menos 32 caracteres. Puedes generar el secreto en el propio servidor con `openssl rand -hex 32`. No dejes el valor de ejemplo. Los valores `DATA_DIR=/data` y `DATABASE_URL=file:/data/db/vamz.sqlite` son rutas dentro del contenedor.

Si se trata de una instalación vacía, crea `data` con `mkdir -p data`; el primer arranque crea las tablas. Para una migración, utiliza el directorio verificado del paso anterior. El proceso de la aplicación utiliza el usuario 1001:

```bash
sudo chown -R 1001:1001 ./data
sudo docker compose build
sudo docker compose up -d
sudo docker compose ps
```

Verifica primero que estás en el directorio correcto antes del cambio recursivo de propietario. Caddy necesita que el DNS apunte a la VPS y que los puertos 80/443 estén accesibles para emitir el certificado.

Comprueba `https://TU_DOMINIO/api/health`, el catálogo, el acceso, una subida y una descarga. Prueba también un recurso privado. No retires Vercel, Turso ni R2 hasta verificar la copia y el funcionamiento de la VPS.

Los datos persistentes quedan en:

```text
data/db/vamz.sqlite
data/storage/uploads/...
data/migration-manifest.json
```

Las descargas se transmiten por streaming y admiten rangos. Las subidas nuevas llegan directamente al servidor mediante autorizaciones temporales ligadas al usuario y al tamaño; se aceptan hasta dos subidas simultáneas por proceso. La cuota local cuenta todos los archivos del almacén, incluidos los que aún no se han vinculado a un recurso. Una subida interrumpida se descarta; un archivo subido cuya confirmación falló se conserva para poder reintentar esa confirmación.

## Copias y actualizaciones

```bash
sudo bash deploy/backup.sh
```

La copia comprueba primero el espacio disponible, detiene brevemente la aplicación para guardar SQLite y los archivos de forma coherente y vuelve a arrancarla al terminar. Lee los datos desde un contenedor con el usuario de la aplicación y guarda la copia en `backups/`. Con el almacén lleno puede no caber otra copia en el mismo disco de 40 GB: usa `sudo BACKUP_DIR=/ruta/otro-disco bash deploy/backup.sh` o realiza la copia hacia otro equipo. Una copia en el mismo disco no protege frente a su pérdida. El script no programa copias ni elimina las antiguas; vigila su espacio.

Para restaurar, detén la aplicación, conserva el directorio de datos actual y extrae la carpeta `data` de una copia verificada. Revisa el propietario 1001 antes de arrancar. No reemplaces una base SQLite mientras la aplicación la está usando.

Antes de actualizar el código, haz una copia. Después ejecuta `sudo docker compose build` y `sudo docker compose up -d`. El directorio `data` se mantiene fuera de la imagen. No elimines los volúmenes de Caddy, que guardan los certificados.

## Comprobaciones locales

```bash
npm run test:storage
npm run test:migration
npm run build
npm run test:vps
```

Las pruebas crean sus propios datos en `.local/` y no usan las credenciales del proyecto publicado. `test:vps` comprueba autenticación, permisos, subidas, portadas, descargas parciales y persistencia tras reiniciar la aplicación. Para verificar la salida standalone, compila con `VAMZ_STANDALONE=1` y ejecuta el test con `VAMZ_TEST_STANDALONE=1`.
