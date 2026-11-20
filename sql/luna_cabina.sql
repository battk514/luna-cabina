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
  visible TINYINT(1) NOT NULL DEFAULT 1,
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

-- CRM y ERP
-- Amplía luna_cabina con el CRM y el ERP de la cabina.
-- Si ya importaste luna_cabina.sql, importa este archivo en phpMyAdmin.
-- Un servidor nuevo puede importar solo luna_cabina.sql, que ya incluye estas tablas.

USE luna_cabina;

CREATE TABLE IF NOT EXISTS clientes (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(120) NOT NULL,
  telefono VARCHAR(30) NULL,
  email VARCHAR(160) NULL,
  notas VARCHAR(1000) NULL,
  origen ENUM('mostrador', 'web', 'referido') NOT NULL DEFAULT 'mostrador',
  creado_en DATETIME NOT NULL,
  actualizado_en DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_clientes_nombre (nombre),
  KEY idx_clientes_telefono (telefono),
  KEY idx_clientes_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS servicios (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(120) NOT NULL,
  descripcion VARCHAR(500) NOT NULL,
  detalles VARCHAR(500) NOT NULL DEFAULT '',
  categoria ENUM('depilacion', 'masaje', 'facial') NOT NULL,
  precio DECIMAL(10,2) NOT NULL DEFAULT 0,
  duracion_min SMALLINT UNSIGNED NOT NULL DEFAULT 30,
  imagen VARCHAR(255) NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  creado_en DATETIME NOT NULL,
  actualizado_en DATETIME NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS citas (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  cliente_id INT UNSIGNED NOT NULL,
  servicio_id INT UNSIGNED NOT NULL,
  inicio DATETIME NOT NULL,
  estado ENUM('pendiente', 'confirmada', 'completada', 'cancelada') NOT NULL DEFAULT 'pendiente',
  precio DECIMAL(10,2) NOT NULL DEFAULT 0,
  notas VARCHAR(500) NULL,
  creado_en DATETIME NOT NULL,
  actualizado_en DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_citas_inicio (inicio),
  KEY idx_citas_cliente (cliente_id),
  CONSTRAINT fk_citas_cliente FOREIGN KEY (cliente_id) REFERENCES clientes (id),
  CONSTRAINT fk_citas_servicio FOREIGN KEY (servicio_id) REFERENCES servicios (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS seguimientos (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  cliente_id INT UNSIGNED NOT NULL,
  tipo ENUM('nota', 'llamada', 'mensaje') NOT NULL DEFAULT 'nota',
  detalle VARCHAR(1000) NOT NULL,
  creado_en DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_seguimientos_cliente (cliente_id),
  CONSTRAINT fk_seguimientos_cliente FOREIGN KEY (cliente_id) REFERENCES clientes (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mensajes (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL,
  telefono VARCHAR(30) NULL,
  mensaje VARCHAR(1000) NOT NULL,
  estado ENUM('nuevo', 'atendido') NOT NULL DEFAULT 'nuevo',
  cliente_id INT UNSIGNED NULL,
  creado_en DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_mensajes_estado (estado),
  CONSTRAINT fk_mensajes_cliente FOREIGN KEY (cliente_id) REFERENCES clientes (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO servicios (nombre, descripcion, detalles, categoria, precio, duracion_min, imagen, activo, creado_en, actualizado_en)
SELECT * FROM (
  SELECT 'Depilación bikini' AS nombre, 'Depilación bikini suave y precisa, ideal para lucir perfecta en la playa o piscina.' AS descripcion, 'Técnica suave para minimizar la irritación' AS detalles, 'depilacion' AS categoria, 0 AS precio, 30 AS duracion_min, '/images/1 (2).png' AS imagen, 1 AS activo, NOW() AS creado_en, NOW() AS actualizado_en
  UNION ALL SELECT 'Depilación de ceja', 'Realzamos tu mirada con un diseño de cejas profesional.', 'Diseño adaptado a tus facciones', 'depilacion', 0, 20, '/images/2 (2).png', 1, NOW(), NOW()
  UNION ALL SELECT 'Depilación de bigote', 'Eliminamos el vello facial no deseado de manera rápida y efectiva.', 'Respeta el contorno labial', 'depilacion', 0, 15, '/images/3 (2).png', 1, NOW(), NOW()
  UNION ALL SELECT 'Masaje relajante', 'Experiencia de relajación profunda que alivia el estrés y la tensión muscular.', 'Reduce el estrés y la ansiedad\nMejora la calidad del sueño\nAlivia dolores musculares', 'masaje', 0, 60, '/images/masaje-relajante.jpeg', 1, NOW(), NOW()
  UNION ALL SELECT 'Masaje terapéutico', 'Tratamiento especializado para aliviar dolores específicos y mejorar la movilidad.', 'Trata molestias musculares\nMejora la circulación\nAumenta la flexibilidad', 'masaje', 0, 60, '/images/masaje-terapeutico.jpg', 1, NOW(), NOW()
  UNION ALL SELECT 'Masaje facial', 'Tratamiento rejuvenecedor que revitaliza la piel del rostro.', 'Reduce líneas de expresión\nMejora la circulación facial\nEfecto lifting natural', 'facial', 0, 45, '/images/masaje-facial.jpg', 1, NOW(), NOW()
  UNION ALL SELECT 'Depilación con cera', 'Elimina el vello no deseado de manera efectiva y duradera.', 'Resultados duraderos\nAdecuado para diversas zonas\nPiel suave', 'depilacion', 0, 40, '/images/depilación-cera.png', 1, NOW(), NOW()
  UNION ALL SELECT 'Depilación láser', 'Tecnología avanzada para una eliminación del vello a largo plazo.', 'Tratamiento rápido y preciso\nAdecuado para distintos tipos de piel', 'depilacion', 0, 40, '/images/depilacion-laser.jpg', 1, NOW(), NOW()
  UNION ALL SELECT 'Limpieza facial profunda', 'Tratamiento completo para purificar y renovar la piel del rostro.', 'Elimina impurezas\nHidratación profunda\nIncluye masaje relajante', 'facial', 0, 60, '/images/limpieza-facial-profunda.jpg', 1, NOW(), NOW()
) AS semilla
WHERE NOT EXISTS (SELECT 1 FROM servicios LIMIT 1);

INSERT INTO publicaciones (id, tipo, titulo, descripcion, fecha, imagen, creado_en, actualizado_en)
SELECT 'promo-basico', 'promocion', 'Básico', 'Bikini a elegir + ceja + bigote + axilas. $410.', '2027-03-31', '/images/1 (2).png', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM publicaciones WHERE id = 'promo-basico');

INSERT INTO publicaciones (id, tipo, titulo, descripcion, fecha, imagen, creado_en, actualizado_en)
SELECT 'promo-normal', 'promocion', 'Normal', 'Piernas completas + bikini mohicano + axilas + bigote o ceja. $460.', '2027-03-31', '/images/piernas1.png', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM publicaciones WHERE id = 'promo-normal');

INSERT INTO publicaciones (id, tipo, titulo, descripcion, fecha, imagen, creado_en, actualizado_en)
SELECT 'promo-premium', 'promocion', 'Premium', 'Piernas completas + bikini brasilian + axilas + bigote o ceja. $480.', '2027-03-31', '/images/depilación-cera.png', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM publicaciones WHERE id = 'promo-premium');

INSERT INTO publicaciones (id, tipo, titulo, descripcion, fecha, imagen, creado_en, actualizado_en)
SELECT 'ocasion-muertos', 'ocasion', 'Día de Muertos', 'Una fecha para consentirte y compartir un momento de cuidado en la cabina.', '2027-11-02', '/images/d25aca616fcc9f85683310accc56c914.jpg', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM publicaciones WHERE id = 'ocasion-muertos');

INSERT INTO publicaciones (id, tipo, titulo, descripcion, fecha, imagen, creado_en, actualizado_en)
SELECT 'ocasion-buen-fin', 'ocasion', 'Buen Fin', 'Aprovecha estos días para agendar depilación o masaje con un espacio especial.', '2026-11-20', '/images/piernas1.png', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM publicaciones WHERE id = 'ocasion-buen-fin');

INSERT INTO publicaciones (id, tipo, titulo, descripcion, fecha, imagen, creado_en, actualizado_en)
SELECT 'ocasion-navidad', 'ocasion', 'Navidad', 'Regálate un rato de calma antes de las fiestas. Reserva tu cita de temporada.', '2026-12-24', '/images/masaje-relajante.jpeg', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM publicaciones WHERE id = 'ocasion-navidad');

INSERT INTO publicaciones (id, tipo, titulo, descripcion, fecha, imagen, creado_en, actualizado_en)
SELECT 'ocasion-hot-sale', 'ocasion', 'Hot Sale', 'La temporada para cuidar tu piel y apartar tu lugar en la cabina.', '2027-05-31', '/images/limpieza-facial-profunda.jpg', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM publicaciones WHERE id = 'ocasion-hot-sale');

SET @visible_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'publicaciones' AND COLUMN_NAME = 'visible'
);
SET @visible_sql := IF(
  @visible_exists = 0,
  'ALTER TABLE publicaciones ADD COLUMN visible TINYINT(1) NOT NULL DEFAULT 1 AFTER imagen',
  'SELECT 1'
);
PREPARE visible_stmt FROM @visible_sql;
EXECUTE visible_stmt;
DEALLOCATE PREPARE visible_stmt;

CREATE TABLE IF NOT EXISTS horarios (
  dia TINYINT UNSIGNED NOT NULL,
  abre TIME NULL,
  cierra TIME NULL,
  cerrado TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (dia)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO horarios (dia, abre, cierra, cerrado)
SELECT * FROM (
  SELECT 1 AS dia, '09:00:00' AS abre, '19:00:00' AS cierra, 0 AS cerrado
  UNION ALL SELECT 2, '09:00:00', '19:00:00', 0
  UNION ALL SELECT 3, '09:00:00', '19:00:00', 0
  UNION ALL SELECT 4, '09:00:00', '19:00:00', 0
  UNION ALL SELECT 5, '09:00:00', '19:00:00', 0
  UNION ALL SELECT 6, '10:00:00', '15:00:00', 0
  UNION ALL SELECT 7, '10:00:00', '15:00:00', 1
) AS semilla
WHERE NOT EXISTS (SELECT 1 FROM horarios LIMIT 1);
