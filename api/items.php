<?php

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

require_admin();

$method = $_SERVER['REQUEST_METHOD'];
if (!in_array($method, ['GET', 'POST', 'PUT', 'DELETE'], true)) {
    fail(405, 'Método no permitido.');
}

$pdo = db();

if ($method === 'GET') {
    $kind = (string) ($_GET['kind'] ?? '');
    $tipo = tipo_from_kind($kind);
    try {
        $statement = $pdo->prepare('SELECT id, tipo, titulo, descripcion, fecha, imagen, visible, creado_en, actualizado_en FROM publicaciones WHERE tipo = ? ORDER BY fecha ASC');
        $statement->execute([$tipo]);
    } catch (PDOException) {
        $statement = $pdo->prepare('SELECT id, tipo, titulo, descripcion, fecha, imagen, creado_en, actualizado_en FROM publicaciones WHERE tipo = ? ORDER BY fecha ASC');
        $statement->execute([$tipo]);
    }
    ok(['items' => array_map('row_to_item', $statement->fetchAll())]);
}

$body = read_json();
$kind = (string) ($body['kind'] ?? '');
$tipo = tipo_from_kind($kind);

if ($method === 'DELETE') {
    $id = trim((string) ($body['id'] ?? ''));
    if ($id === '') {
        fail(422, 'Falta la publicación que quieres eliminar.');
    }
    $current = $pdo->prepare('SELECT imagen FROM publicaciones WHERE id = ? AND tipo = ?');
    $current->execute([$id, $tipo]);
    $row = $current->fetch();
    if (!$row) {
        fail(404, 'No se encontró la publicación.');
    }
    $pdo->prepare('DELETE FROM publicaciones WHERE id = ? AND tipo = ?')->execute([$id, $tipo]);
    delete_image((string) $row['imagen']);
    ok(['ok' => true]);
}

$title = clean_text($body['title'] ?? '', 80, 'El título');
$description = clean_text($body['description'] ?? '', 500, 'La descripción');
$date = clean_date($body['date'] ?? '');
$now = gmdate('Y-m-d H:i:s');

if ($method === 'POST') {
    $id = trim((string) ($body['id'] ?? ''));
    if ($id === '') {
        $id = bin2hex(random_bytes(16));
    }
    $image = resolve_image((string) ($body['image'] ?? ''));
    $visible = visible_flag($body);
    try {
        $insert = $pdo->prepare('INSERT INTO publicaciones (id, tipo, titulo, descripcion, fecha, imagen, visible, creado_en, actualizado_en) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
        $insert->execute([$id, $tipo, $title, $description, $date, $image, $visible, $now, $now]);
    } catch (PDOException) {
        $insert = $pdo->prepare('INSERT INTO publicaciones (id, tipo, titulo, descripcion, fecha, imagen, creado_en, actualizado_en) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
        $insert->execute([$id, $tipo, $title, $description, $date, $image, $now, $now]);
    }
    ok(['id' => $id], 201);
}

$id = trim((string) ($body['id'] ?? ''));
if ($id === '') {
    fail(422, 'Falta la publicación que quieres editar.');
}

$current = $pdo->prepare('SELECT imagen FROM publicaciones WHERE id = ? AND tipo = ?');
$current->execute([$id, $tipo]);
$row = $current->fetch();
if (!$row) {
    fail(404, 'No se encontró la publicación.');
}

$image = resolve_image((string) ($body['image'] ?? ''));
$visible = visible_flag($body);
try {
    $update = $pdo->prepare('UPDATE publicaciones SET titulo = ?, descripcion = ?, fecha = ?, imagen = ?, visible = ?, actualizado_en = ? WHERE id = ? AND tipo = ?');
    $update->execute([$title, $description, $date, $image, $visible, $now, $id, $tipo]);
} catch (PDOException) {
    $update = $pdo->prepare('UPDATE publicaciones SET titulo = ?, descripcion = ?, fecha = ?, imagen = ?, actualizado_en = ? WHERE id = ? AND tipo = ?');
    $update->execute([$title, $description, $date, $image, $now, $id, $tipo]);
}
if ($image !== $row['imagen']) {
    delete_image((string) $row['imagen']);
}

ok(['id' => $id]);

function visible_flag(array $body): int
{
    if (!array_key_exists('visible', $body)) {
        return 1;
    }

    return empty($body['visible']) ? 0 : 1;
}
