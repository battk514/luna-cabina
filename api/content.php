<?php

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    fail(405, 'Método no permitido.');
}

$pdo = db();
$promotions = [];
$occasions = [];
try {
    $statement = $pdo->query('SELECT id, tipo, titulo, descripcion, fecha, imagen, visible, creado_en, actualizado_en FROM publicaciones WHERE visible = 1 ORDER BY fecha ASC');
} catch (PDOException) {
    $statement = $pdo->query('SELECT id, tipo, titulo, descripcion, fecha, imagen, creado_en, actualizado_en FROM publicaciones ORDER BY fecha ASC');
}

foreach ($statement->fetchAll() as $row) {
    $item = row_to_item($row);
    if ($row['tipo'] === 'promocion') {
        $promotions[] = $item;
    } else {
        $occasions[] = $item;
    }
}

$services = [];
try {
    $rows = $pdo->query('SELECT id, nombre, descripcion, detalles, categoria, precio, duracion_min, imagen FROM servicios WHERE activo = 1 ORDER BY categoria, nombre')->fetchAll();
    foreach ($rows as $row) {
        $services[] = [
            'id' => (int) $row['id'],
            'nombre' => $row['nombre'],
            'descripcion' => $row['descripcion'],
            'detalles' => array_values(array_filter(array_map('trim', explode("\n", (string) $row['detalles'])))),
            'categoria' => $row['categoria'],
            'precio' => (float) $row['precio'],
            'duracionMin' => (int) $row['duracion_min'],
            'imagen' => $row['imagen'],
        ];
    }
} catch (PDOException) {
    $services = [];
}

ok([
    'promotions' => $promotions,
    'occasions' => $occasions,
    'services' => $services,
]);
