-- Importa este archivo en phpMyAdmin (pestaña Importar).
-- Crea la base luna_cabina, las publicaciones y el usuario del panel.
-- Usuario del panel: luna
-- Contraseña del panel: luna

CREATE DATABASE IF NOT EXISTS luna_cabina
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE luna_cabina;

CREATE TABLE IF NOT EXISTS publicaciones (
  id VARCHAR(36) NOT NULL,
  tipo ENUM('promocion', 'ocasion') NOT NULL,
  titulo VARCHAR(80) NOT NULL,
  descripcion VARCHAR(500) NOT NULL,
  fecha DATE NOT NULL,
  imagen VARCHAR(255) NOT NULL,
  creado_en DATETIME NOT NULL,
  actualizado_en DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_publicaciones_tipo_fecha (tipo, fecha)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS usuarios (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario VARCHAR(60) NOT NULL,
  clave_hash VARCHAR(255) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_usuarios_usuario (usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO usuarios (usuario, clave_hash)
VALUES ('luna', '$2y$12$1Y2L6/mjqc5sntKxL2JRPehP41.4pJz7lI6Flpj/Zi4wXM7uoZpJq')
ON DUPLICATE KEY UPDATE usuario = usuario;
