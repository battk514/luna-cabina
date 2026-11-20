<?php

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

require_admin();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    fail(405, 'Método no permitido.');
}

$body = read_json();
if (!isset($body['promotions'], $body['occasions']) || !is_array($body['promotions']) || !is_array($body['occasions'])) {
    fail(422, 'El archivo no tiene el formato de respaldo de Luna Cabina.');
}

$rows = [];
foreach (['promotions' => 'promocion', 'occasions' => 'ocasion'] as $kind => $tipo) {
    foreach ($body[$kind] as $item) {
        if (!is_array($item)) {
            fail(422, 'El archivo contiene publicaciones incompletas.');
        }
        $id = trim((string) ($item['id'] ?? ''));
        $rows[] = [
            'id' => $id !== '' ? $id : bin2hex(random_bytes(16)),
            'tipo' => $tipo,
            'titulo' => clean_text($item['title'] ?? '', 80, 'El título'),
            'descripcion' => clean_text($item['description'] ?? '', 500, 'La descripción'),
            'fecha' => clean_date($item['date'] ?? ''),
            'image' => (string) ($item['image'] ?? ''),
        ];
    }
}

$savedImages = [];
try {
    foreach ($rows as $index => $row) {
        $savedImages[] = $rows[$index]['imagen'] = resolve_image($row['image']);
    }
} catch (Throwable $error) {
    foreach ($savedImages as $image) {
        delete_image($image);
    }
    throw $error;
}

$pdo = db();
$previous = $pdo->query('SELECT imagen FROM publicaciones')->fetchAll();
$now = gmdate('Y-m-d H:i:s');
$insert = $pdo->prepare('INSERT INTO publicaciones (id, tipo, titulo, descripcion, fecha, imagen, creado_en, actualizado_en) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');

$pdo->beginTransaction();
try {
    $pdo->exec('DELETE FROM publicaciones');
    foreach ($rows as $row) {
        $insert->execute([$row['id'], $row['tipo'], $row['titulo'], $row['descripcion'], $row['fecha'], $row['imagen'], $now, $now]);
    }
    $pdo->commit();
} catch (Throwable $error) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    foreach ($savedImages as $image) {
        delete_image($image);
    }
    fail(500, 'No se pudo importar el respaldo en MySQL.');
}

foreach ($previous as $row) {
    if (!in_array($row['imagen'], $savedImages, true)) {
        delete_image((string) $row['imagen']);
    }
}

ok(['ok' => true]);
