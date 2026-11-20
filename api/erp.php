<?php

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';
require __DIR__ . '/horario_datos.php';

require_admin();

$resource = (string) ($_GET['recurso'] ?? '');
$method = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? (int) $_GET['id'] : 0;
$pdo = db();
$now = gmdate('Y-m-d H:i:s');

try {
    match ($resource) {
        'resumen' => resumen($pdo),
        'clientes' => clientes($pdo, $method, $id, $now),
        'servicios' => servicios($pdo, $method, $id, $now),
        'citas' => citas($pdo, $method, $id, $now),
        'seguimientos' => seguimientos($pdo, $method, $id, $now),
        'mensajes' => mensajes($pdo, $method, $id),
        'horarios' => horarios_admin($pdo, $method),
        default => fail(404, 'Ese recurso no existe.'),
    };
} catch (PDOException) {
    fail(500, 'Faltan tablas del ERP o CRM. Importa sql/erp_crm.sql en phpMyAdmin.');
}

function horarios_admin(PDO $pdo, string $method): never
{
    if ($method === 'GET') {
        ok(['horarios' => horario_list($pdo)]);
    }
    if ($method === 'PUT') {
        $body = read_json();
        $items = $body['horarios'] ?? null;
        if (!is_array($items)) {
            fail(422, 'Hay que indicar el horario de los siete días.');
        }
        horario_save($pdo, $items);
        ok(['horarios' => horario_list($pdo)]);
    }

    fail(405, 'Método no permitido.');
}

function resumen(PDO $pdo): never
{
    $counts = $pdo->query("SELECT
        (SELECT COUNT(*) FROM clientes) AS clientes,
        (SELECT COUNT(*) FROM citas WHERE inicio >= UTC_TIMESTAMP() AND estado IN ('pendiente', 'confirmada')) AS citasProximas,
        (SELECT COUNT(*) FROM mensajes WHERE estado = 'nuevo') AS mensajesNuevos,
        (SELECT COUNT(*) FROM servicios WHERE activo = 1) AS serviciosActivos
    ")->fetch();

        $upcoming = $pdo->query("SELECT c.id, c.inicio, c.estado, c.precio, c.cliente_id, cl.nombre AS cliente, cl.telefono, s.nombre AS servicio
        FROM citas c
        JOIN clientes cl ON cl.id = c.cliente_id
        JOIN servicios s ON s.id = c.servicio_id
        WHERE c.estado IN ('pendiente', 'confirmada')
        ORDER BY c.inicio ASC
        LIMIT 6")->fetchAll();

    ok([
        'clientes' => (int) $counts['clientes'],
        'citasProximas' => (int) $counts['citasProximas'],
        'mensajesNuevos' => (int) $counts['mensajesNuevos'],
        'serviciosActivos' => (int) $counts['serviciosActivos'],
        'agenda' => array_map(static fn (array $row): array => [
            'id' => (int) $row['id'],
            'inicio' => $row['inicio'],
            'estado' => $row['estado'],
            'precio' => (float) $row['precio'],
            'clienteId' => (int) $row['cliente_id'],
            'cliente' => $row['cliente'],
            'telefono' => $row['telefono'] ?? '',
            'servicio' => $row['servicio'],
        ], $upcoming),
    ]);
}

function clientes(PDO $pdo, string $method, int $id, string $now): never
{
    if ($method === 'GET' && $id > 0) {
        $client = $pdo->prepare('SELECT * FROM clientes WHERE id = ?');
        $client->execute([$id]);
        $row = $client->fetch();
        if (!$row) {
            fail(404, 'No se encontró a la clienta.');
        }
        $notes = $pdo->prepare('SELECT id, tipo, detalle, creado_en FROM seguimientos WHERE cliente_id = ? ORDER BY creado_en DESC');
        $notes->execute([$id]);
        $visits = $pdo->prepare("SELECT c.id, c.inicio, c.estado, c.precio, s.nombre AS servicio FROM citas c JOIN servicios s ON s.id = c.servicio_id WHERE c.cliente_id = ? ORDER BY c.inicio DESC");
        $visits->execute([$id]);
        ok(['cliente' => cliente_row($row), 'seguimientos' => $notes->fetchAll(), 'citas' => $visits->fetchAll()]);
    }

    if ($method === 'GET') {
        $query = trim((string) ($_GET['q'] ?? ''));
        $statement = $pdo->prepare('SELECT * FROM clientes WHERE nombre LIKE ? OR telefono LIKE ? OR email LIKE ? ORDER BY nombre ASC LIMIT 200');
        $like = '%' . $query . '%';
        $statement->execute([$like, $like, $like]);
        ok(['clientes' => array_map('cliente_row', $statement->fetchAll())]);
    }

    if ($method === 'DELETE') {
        ensure_id($id);
        $used = $pdo->prepare('SELECT COUNT(*) FROM citas WHERE cliente_id = ?');
        $used->execute([$id]);
        if ((int) $used->fetchColumn() > 0) {
            fail(409, 'Esta clienta tiene citas. Cancélalas o complétalas antes de eliminarla.');
        }
        $pdo->prepare('DELETE FROM clientes WHERE id = ?')->execute([$id]);
        ok(['ok' => true]);
    }

    $body = read_json();
    $data = cliente_input($body);

    if ($method === 'POST') {
        $insert = $pdo->prepare('INSERT INTO clientes (nombre, telefono, email, notas, origen, creado_en, actualizado_en) VALUES (?, ?, ?, ?, ?, ?, ?)');
        $insert->execute([$data['nombre'], $data['telefono'], $data['email'], $data['notas'], $data['origen'], $now, $now]);
        ok(['id' => (int) $pdo->lastInsertId()], 201);
    }

    if ($method === 'PUT') {
        ensure_id($id);
        $update = $pdo->prepare('UPDATE clientes SET nombre = ?, telefono = ?, email = ?, notas = ?, origen = ?, actualizado_en = ? WHERE id = ?');
        $update->execute([$data['nombre'], $data['telefono'], $data['email'], $data['notas'], $data['origen'], $now, $id]);
        ok(['id' => $id]);
    }

    fail(405, 'Método no permitido.');
}

function servicios(PDO $pdo, string $method, int $id, string $now): never
{
    if ($method === 'GET') {
        $rows = $pdo->query('SELECT * FROM servicios ORDER BY activo DESC, categoria, nombre')->fetchAll();
        ok(['servicios' => array_map('servicio_row', $rows)]);
    }

    if ($method === 'DELETE') {
        ensure_id($id);
        $used = $pdo->prepare('SELECT COUNT(*) FROM citas WHERE servicio_id = ?');
        $used->execute([$id]);
        if ((int) $used->fetchColumn() > 0) {
            fail(409, 'Este servicio ya tiene citas. Márcalo como inactivo en lugar de eliminarlo.');
        }
        $pdo->prepare('DELETE FROM servicios WHERE id = ?')->execute([$id]);
        ok(['ok' => true]);
    }

    $body = read_json();
    $data = servicio_input($body);
    if ($method === 'POST') {
        $insert = $pdo->prepare('INSERT INTO servicios (nombre, descripcion, detalles, categoria, precio, duracion_min, imagen, activo, creado_en, actualizado_en) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        $insert->execute([$data['nombre'], $data['descripcion'], $data['detalles'], $data['categoria'], $data['precio'], $data['duracion'], $data['imagen'], $data['activo'], $now, $now]);
        ok(['id' => (int) $pdo->lastInsertId()], 201);
    }
    if ($method === 'PUT') {
        ensure_id($id);
        $update = $pdo->prepare('UPDATE servicios SET nombre = ?, descripcion = ?, detalles = ?, categoria = ?, precio = ?, duracion_min = ?, imagen = ?, activo = ?, actualizado_en = ? WHERE id = ?');
        $update->execute([$data['nombre'], $data['descripcion'], $data['detalles'], $data['categoria'], $data['precio'], $data['duracion'], $data['imagen'], $data['activo'], $now, $id]);
        ok(['id' => $id]);
    }

    fail(405, 'Método no permitido.');
}

function citas(PDO $pdo, string $method, int $id, string $now): never
{
    if ($method === 'GET') {
        $rows = $pdo->query("SELECT c.*, cl.nombre AS cliente, cl.telefono, s.nombre AS servicio
            FROM citas c
            JOIN clientes cl ON cl.id = c.cliente_id
            JOIN servicios s ON s.id = c.servicio_id
            ORDER BY c.inicio DESC
            LIMIT 300")->fetchAll();
        ok(['citas' => array_map('cita_row', $rows)]);
    }

    if ($method === 'DELETE') {
        ensure_id($id);
        $pdo->prepare('DELETE FROM citas WHERE id = ?')->execute([$id]);
        ok(['ok' => true]);
    }

    $body = read_json();
    $clienteId = (int) ($body['clienteId'] ?? 0);
    $servicioId = (int) ($body['servicioId'] ?? 0);
    $inicio = clean_datetime((string) ($body['inicio'] ?? ''));
    $estado = (string) ($body['estado'] ?? 'pendiente');
    $notas = trim((string) ($body['notas'] ?? ''));
    if (!in_array($estado, ['pendiente', 'confirmada', 'completada', 'cancelada'], true)) {
        fail(422, 'El estado de la cita no es válido.');
    }
    if (strlen($notas) > 500) {
        fail(422, 'Las notas de la cita son demasiado largas.');
    }
    if ($clienteId < 1 || $servicioId < 1) {
        fail(422, 'Elige una clienta y un servicio.');
    }

    $service = $pdo->prepare('SELECT precio FROM servicios WHERE id = ?');
    $service->execute([$servicioId]);
    $serviceRow = $service->fetch();
    if (!$serviceRow) {
        fail(422, 'El servicio no existe.');
    }
    $precio = array_key_exists('precio', $body) && $body['precio'] !== '' ? clean_price($body['precio']) : (float) $serviceRow['precio'];

    if ($method === 'POST') {
        $insert = $pdo->prepare('INSERT INTO citas (cliente_id, servicio_id, inicio, estado, precio, notas, creado_en, actualizado_en) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
        $insert->execute([$clienteId, $servicioId, $inicio, $estado, $precio, $notas !== '' ? $notas : null, $now, $now]);
        ok(['id' => (int) $pdo->lastInsertId()], 201);
    }
    if ($method === 'PUT') {
        ensure_id($id);
        $update = $pdo->prepare('UPDATE citas SET cliente_id = ?, servicio_id = ?, inicio = ?, estado = ?, precio = ?, notas = ?, actualizado_en = ? WHERE id = ?');
        $update->execute([$clienteId, $servicioId, $inicio, $estado, $precio, $notas !== '' ? $notas : null, $now, $id]);
        ok(['id' => $id]);
    }

    fail(405, 'Método no permitido.');
}

function seguimientos(PDO $pdo, string $method, int $id, string $now): never
{
    if ($method === 'POST') {
        $body = read_json();
        $clienteId = (int) ($body['clienteId'] ?? 0);
        $tipo = (string) ($body['tipo'] ?? 'nota');
        $detalle = clean_text($body['detalle'] ?? '', 1000, 'El seguimiento');
        if ($clienteId < 1 || !in_array($tipo, ['nota', 'llamada', 'mensaje'], true)) {
            fail(422, 'El seguimiento está incompleto.');
        }
        $insert = $pdo->prepare('INSERT INTO seguimientos (cliente_id, tipo, detalle, creado_en) VALUES (?, ?, ?, ?)');
        $insert->execute([$clienteId, $tipo, $detalle, $now]);
        ok(['id' => (int) $pdo->lastInsertId()], 201);
    }
    if ($method === 'DELETE') {
        ensure_id($id);
        $pdo->prepare('DELETE FROM seguimientos WHERE id = ?')->execute([$id]);
        ok(['ok' => true]);
    }
    fail(405, 'Método no permitido.');
}

function mensajes(PDO $pdo, string $method, int $id): never
{
    if ($method === 'GET') {
        $rows = $pdo->query('SELECT * FROM mensajes ORDER BY creado_en DESC LIMIT 200')->fetchAll();
        ok(['mensajes' => array_map(static fn (array $row): array => [
            'id' => (int) $row['id'],
            'nombre' => $row['nombre'],
            'email' => $row['email'],
            'telefono' => $row['telefono'],
            'mensaje' => $row['mensaje'],
            'estado' => $row['estado'],
            'clienteId' => $row['cliente_id'] !== null ? (int) $row['cliente_id'] : null,
            'creadoEn' => $row['creado_en'],
        ], $rows)]);
    }
    if ($method === 'PUT') {
        ensure_id($id);
        $body = read_json();
        $estado = (string) ($body['estado'] ?? '');
        if (!in_array($estado, ['nuevo', 'atendido'], true)) {
            fail(422, 'El estado del mensaje no es válido.');
        }
        $pdo->prepare('UPDATE mensajes SET estado = ? WHERE id = ?')->execute([$estado, $id]);
        ok(['id' => $id]);
    }
    fail(405, 'Método no permitido.');
}

function cliente_input(array $body): array
{
    $email = trim((string) ($body['email'] ?? ''));
    $telefono = trim((string) ($body['telefono'] ?? ''));
    $notas = trim((string) ($body['notas'] ?? ''));
    $origen = (string) ($body['origen'] ?? 'mostrador');
    if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        fail(422, 'El correo no es válido.');
    }
    if (strlen($telefono) > 30 || strlen($notas) > 1000) {
        fail(422, 'Hay un campo demasiado largo.');
    }
    if (!in_array($origen, ['mostrador', 'web', 'referido'], true)) {
        $origen = 'mostrador';
    }

    return [
        'nombre' => clean_text($body['nombre'] ?? '', 120, 'El nombre'),
        'telefono' => $telefono !== '' ? $telefono : null,
        'email' => $email !== '' ? $email : null,
        'notas' => $notas !== '' ? $notas : null,
        'origen' => $origen,
    ];
}

function cliente_row(array $row): array
{
    return [
        'id' => (int) $row['id'],
        'nombre' => $row['nombre'],
        'telefono' => $row['telefono'],
        'email' => $row['email'],
        'notas' => $row['notas'],
        'origen' => $row['origen'],
        'creadoEn' => $row['creado_en'],
    ];
}

function servicio_input(array $body): array
{
    $categoria = (string) ($body['categoria'] ?? '');
    if (!in_array($categoria, ['depilacion', 'masaje', 'facial'], true)) {
        fail(422, 'La categoría no es válida.');
    }
    $detalles = trim((string) ($body['detalles'] ?? ''));
    if (strlen($detalles) > 500) {
        fail(422, 'Los detalles son demasiado largos.');
    }

    return [
        'nombre' => clean_text($body['nombre'] ?? '', 120, 'El nombre'),
        'descripcion' => clean_text($body['descripcion'] ?? '', 500, 'La descripción'),
        'detalles' => $detalles,
        'categoria' => $categoria,
        'precio' => clean_price($body['precio'] ?? 0),
        'duracion' => max(5, min(480, (int) ($body['duracionMin'] ?? 30))),
        'imagen' => trim((string) ($body['imagen'] ?? '')) ?: null,
        'activo' => empty($body['activo']) ? 0 : 1,
    ];
}

function servicio_row(array $row): array
{
    return [
        'id' => (int) $row['id'],
        'nombre' => $row['nombre'],
        'descripcion' => $row['descripcion'],
        'detalles' => $row['detalles'],
        'categoria' => $row['categoria'],
        'precio' => (float) $row['precio'],
        'duracionMin' => (int) $row['duracion_min'],
        'imagen' => $row['imagen'],
        'activo' => (bool) $row['activo'],
    ];
}

function cita_row(array $row): array
{
    return [
        'id' => (int) $row['id'],
        'clienteId' => (int) $row['cliente_id'],
        'servicioId' => (int) $row['servicio_id'],
        'cliente' => $row['cliente'] ?? '',
        'telefono' => $row['telefono'] ?? '',
        'servicio' => $row['servicio'] ?? '',
        'inicio' => $row['inicio'],
        'estado' => $row['estado'],
        'precio' => (float) $row['precio'],
        'notas' => $row['notas'],
    ];
}

function clean_price(mixed $value): float
{
    if (!is_numeric($value) || (float) $value < 0 || (float) $value > 100000) {
        fail(422, 'El precio no es válido.');
    }

    return round((float) $value, 2);
}

function clean_datetime(string $value): string
{
    $value = str_replace('T', ' ', trim($value));
    if (preg_match('/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/', $value)) {
        $value .= ':00';
    }
    $parsed = DateTime::createFromFormat('Y-m-d H:i:s', $value);
    if (!$parsed || $parsed->format('Y-m-d H:i:s') !== $value) {
        fail(422, 'La fecha de la cita no es válida.');
    }

    return $value;
}

function ensure_id(int $id): void
{
    if ($id < 1) {
        fail(422, 'Falta el identificador.');
    }
}
