<?php

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';
require __DIR__ . '/cita_reglas.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    fail(405, 'Método no permitido.');
}

$body = read_json();
$key = phone_key((string) ($body['telefono'] ?? ''));
if (strlen($key) !== 10) {
    fail(422, 'Escribe un teléfono de 10 dígitos.');
}

$pdo = db();
$now = cabin_now();
$desde = (clone $now)->modify('-12 hours')->format('Y-m-d H:i:s');
$statement = $pdo->prepare("SELECT c.id, c.inicio, c.estado, c.notas, c.cliente_id, cl.nombre, cl.telefono, cl.email, s.nombre AS servicio
    FROM citas c
    JOIN clientes cl ON cl.id = c.cliente_id
    JOIN servicios s ON s.id = c.servicio_id
    WHERE c.inicio >= ? AND c.estado IN ('pendiente', 'confirmada', 'cancelada')
    ORDER BY c.inicio ASC");
$statement->execute([$desde]);
$matched = array_values(array_filter($statement->fetchAll(), static function (array $row) use ($key): bool {
    return phone_key((string) $row['telefono']) === $key;
}));

$accion = (string) ($body['accion'] ?? 'consultar');
if ($accion === 'cancelar') {
    cancelar_cita($pdo, $matched, (int) ($body['citaId'] ?? 0), $now);
}

$citas = [];
foreach ($matched as $row) {
    if ($row['estado'] === 'cancelada') {
        continue;
    }
    $inicio = cita_inicio((string) $row['inicio']);
    $minutes = minutes_until($inicio, $now);
    if ($minutes < -30) {
        continue;
    }
    $citas[] = [
        'id' => (int) $row['id'],
        'servicio' => $row['servicio'],
        'inicio' => $inicio->format('Y-m-d H:i:s'),
        'estado' => $row['estado'],
        'minutos' => $minutes,
        'puedeCancelar' => puede_cancelar($minutes),
        'alerta' => alerta_de_cita((string) $row['servicio'], $inicio, $minutes, $now),
    ];
}

ok([
    'nombre' => $matched[0]['nombre'] ?? '',
    'citas' => $citas,
]);

function cancelar_cita(PDO $pdo, array $matched, int $citaId, DateTime $now): never
{
    $row = null;
    foreach ($matched as $item) {
        if ((int) $item['id'] === $citaId) {
            $row = $item;
            break;
        }
    }
    if (!$row || $row['estado'] === 'cancelada') {
        fail(404, 'No encontramos esa cita.');
    }

    $inicio = cita_inicio((string) $row['inicio']);
    $minutes = minutes_until($inicio, $now);
    if (!puede_cancelar($minutes)) {
        fail(422, 'Solo puedes cancelar hasta 20 minutos antes de la hora acordada. Llama al 222 519 1501.');
    }

    $stamp = gmdate('Y-m-d H:i:s');
    $nota = 'La clienta canceló con ' . $minutes . ' min de anticipación.';
    $notas = trim(((string) $row['notas']) . ' ' . $nota);
    if (strlen($notas) > 500) {
        $notas = $nota;
    }
    $pdo->prepare('UPDATE citas SET estado = ?, notas = ?, actualizado_en = ? WHERE id = ?')
        ->execute(['cancelada', $notas, $stamp, $citaId]);

    $cuando = $inicio->format('d/m/Y H:i');
    $mensaje = $row['nombre'] . ' canceló su cita de ' . $row['servicio'] . ' del ' . $cuando . '. Avisó con ' . $minutes . ' minutos de anticipación.';
    $email = filter_var((string) $row['email'], FILTER_VALIDATE_EMAIL) ? $row['email'] : 'sin-correo@lunacabina.local';
    $pdo->prepare('INSERT INTO mensajes (nombre, email, telefono, mensaje, estado, cliente_id, creado_en) VALUES (?, ?, ?, ?, \'nuevo\', ?, ?)')
        ->execute([$row['nombre'], $email, $row['telefono'], $mensaje, (int) $row['cliente_id'], $stamp]);
    $pdo->prepare('INSERT INTO seguimientos (cliente_id, tipo, detalle, creado_en) VALUES (?, \'mensaje\', ?, ?)')
        ->execute([(int) $row['cliente_id'], $mensaje, $stamp]);

    ok(['ok' => true, 'mensaje' => 'Cancelamos tu cita. El aviso ya le llegó a la cabina.']);
}
