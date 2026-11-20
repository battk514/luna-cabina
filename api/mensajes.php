<?php

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    fail(405, 'Método no permitido.');
}

$body = read_json();
$nombre = clean_text($body['nombre'] ?? '', 120, 'El nombre');
$email = trim((string) ($body['email'] ?? ''));
$telefono = trim((string) ($body['telefono'] ?? ''));
$mensaje = clean_text($body['mensaje'] ?? '', 1000, 'El mensaje');

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    fail(422, 'El correo no es válido.');
}
if (strlen($telefono) > 30) {
    fail(422, 'El teléfono es demasiado largo.');
}

$pdo = db();
$now = gmdate('Y-m-d H:i:s');
$clienteId = null;

$find = $pdo->prepare('SELECT id FROM clientes WHERE email = ? OR (? <> \'\' AND telefono = ?) ORDER BY id ASC LIMIT 1');
$find->execute([$email, $telefono, $telefono]);
$existing = $find->fetch();

if ($existing) {
    $clienteId = (int) $existing['id'];
} else {
    $insertCliente = $pdo->prepare('INSERT INTO clientes (nombre, telefono, email, notas, origen, creado_en, actualizado_en) VALUES (?, ?, ?, ?, \'web\', ?, ?)');
    $insertCliente->execute([$nombre, $telefono !== '' ? $telefono : null, $email, 'Llegó desde el formulario de contacto.', $now, $now]);
    $clienteId = (int) $pdo->lastInsertId();
}

$insert = $pdo->prepare('INSERT INTO mensajes (nombre, email, telefono, mensaje, estado, cliente_id, creado_en) VALUES (?, ?, ?, ?, \'nuevo\', ?, ?)');
$insert->execute([$nombre, $email, $telefono !== '' ? $telefono : null, $mensaje, $clienteId, $now]);

$note = $pdo->prepare('INSERT INTO seguimientos (cliente_id, tipo, detalle, creado_en) VALUES (?, \'mensaje\', ?, ?)');
$note->execute([$clienteId, $mensaje, $now]);

ok(['ok' => true], 201);
