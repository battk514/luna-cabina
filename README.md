# Luna Cabina

Sitio de Luna, cabina de depilación y masajes. La interfaz está en React, Vite y Mantine. El ERP y el CRM viven en PHP y MySQL, para consultarlos también desde phpMyAdmin.

## Base de datos

En phpMyAdmin importa `sql/luna_cabina.sql` si la base es nueva. Si ya tenías la versión anterior, importa `sql/erp_crm.sql`.

`api/config.php` usa `root` sin contraseña en `127.0.0.1`. Cámbialo si tu MySQL es distinto.

El panel entra con usuario `luna` y contraseña `luna`.

## Desarrollo

La API sigue en el puerto 5500 y la interfaz en el 5173:

```bash
php -S 127.0.0.1:5500
cd frontend && npm install && npm run dev
```

Abre http://127.0.0.1:5173/

## Servidor

```bash
cd frontend && npm install && npm run build
php -S 127.0.0.1:5500 router.php
```

En Apache, el `.htaccess` sirve la aplicación construida y deja `/api`, `/images` y `/uploads` en PHP.
