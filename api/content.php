<?php

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    fail(405, 'Método no permitido.');
}

$statement = db()->query('SELECT id, tipo, titulo, descripcion, fecha, imagen, creado_en, actualizado_en FROM publicaciones ORDER BY fecha ASC');
$promotions = [];
$occasions = [];

foreach ($statement->fetchAll() as $row) {
    $item = row_to_item($row);
    if ($row['tipo'] === 'promocion') {
        $promotions[] = $item;
    } else {
        $occasions[] = $item;
    }
}

ok([
    'promotions' => $promotions,
    'occasions' => $occasions,
]);
