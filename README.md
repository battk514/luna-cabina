# Luna Cabina

Sitio de Luna, cabina de depilación y masajes.

Para verlo en local hace falta PHP, porque las promociones y ocasiones se leen desde MySQL:

```bash
php -S 127.0.0.1:5500
```

Luego abre http://127.0.0.1:5500/

## Base de datos

1. Abre phpMyAdmin.
2. Importa `sql/luna_cabina.sql`.
3. Si tu MySQL no usa `root` sin contraseña, ajusta `api/config.php`.

El panel de administración queda en `HTML/Administracion.html`. El usuario inicial es `luna` y la contraseña es `luna`. Las publicaciones viven en la tabla `publicaciones` de la base `luna_cabina`.
