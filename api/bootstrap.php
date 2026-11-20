<?php

declare(strict_types=1);

function fail(int $status, string $message): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}

function ok(array $payload, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

function config(): array
{
    static $config = null;
    if ($config === null) {
        $path = __DIR__ . '/config.php';
        if (!is_file($path)) {
            fail(500, 'Falta api/config.php con los datos de MySQL.');
        }
        $loaded = require $path;
        if (!is_array($loaded)) {
            fail(500, 'api/config.php no devolvió la configuración de MySQL.');
        }
        $config = $loaded;
    }

    return $config;
}

function db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $settings = config();
    $dsn = sprintf(
        'mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',
        $settings['host'],
        (int) $settings['port'],
        $settings['database']
    );

    try {
        $pdo = new PDO($dsn, (string) $settings['user'], (string) $settings['password'], [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
    } catch (PDOException) {
        fail(500, 'No se pudo conectar a MySQL. Importa sql/luna_cabina.sql en phpMyAdmin y revisa api/config.php.');
    }

    return $pdo;
}

function start_session(): void
{
    if (session_status() === PHP_SESSION_NONE) {
        session_set_cookie_params([
            'httponly' => true,
            'samesite' => 'Lax',
            'path' => '/',
        ]);
        session_start();
    }
}

function require_admin(): void
{
    start_session();
    if (empty($_SESSION['usuario_id'])) {
        fail(401, 'Inicia sesión para modificar las publicaciones.');
    }
}

function read_json(): array
{
    $data = json_decode(file_get_contents('php://input') ?: '', true);
    if (!is_array($data)) {
        fail(400, 'La petición no trae datos JSON válidos.');
    }

    return $data;
}

function tipo_from_kind(string $kind): string
{
    return match ($kind) {
        'promotions' => 'promocion',
        'occasions' => 'ocasion',
        default => fail(422, 'El tipo de publicación no es válido.'),
    };
}

function row_to_item(array $row): array
{
    return [
        'id' => $row['id'],
        'title' => $row['titulo'],
        'description' => $row['descripcion'],
        'date' => $row['fecha'],
        'image' => $row['imagen'],
        'createdAt' => gmdate('c', strtotime((string) $row['creado_en'])),
        'updatedAt' => gmdate('c', strtotime((string) $row['actualizado_en'])),
    ];
}

function clean_text(mixed $value, int $max, string $label): string
{
    $text = trim((string) $value);
    $length = function_exists('mb_strlen') ? mb_strlen($text) : strlen($text);
    if ($text === '' || $length > $max) {
        fail(422, $label . ' es obligatorio y debe tener como máximo ' . $max . ' caracteres.');
    }

    return $text;
}

function clean_date(mixed $value): string
{
    $date = trim((string) $value);
    $parsed = DateTime::createFromFormat('Y-m-d', $date);
    if (!$parsed || $parsed->format('Y-m-d') !== $date) {
        fail(422, 'La fecha no es válida.');
    }

    return $date;
}

function uploads_dir(): string
{
    $dir = dirname(__DIR__) . '/uploads';
    if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
        fail(500, 'No se pudo crear la carpeta de imágenes.');
    }

    return $dir;
}

function save_image(string $dataUrl): string
{
    if (!preg_match('#^data:image/(jpeg|jpg|png|webp);base64,([A-Za-z0-9+/=\r\n]+)$#', $dataUrl, $matches)) {
        fail(422, 'La imagen debe ser JPG, PNG o WebP.');
    }

    $binary = base64_decode($matches[2], true);
    if ($binary === false || strlen($binary) < 32 || strlen($binary) > 700 * 1024) {
        fail(422, 'La imagen no es válida o supera el tamaño permitido.');
    }

    $extension = match ($matches[1]) {
        'png' => 'png',
        'webp' => 'webp',
        default => 'jpg',
    };
    $name = bin2hex(random_bytes(16)) . '.' . $extension;
    if (file_put_contents(uploads_dir() . '/' . $name, $binary) === false) {
        fail(500, 'No se pudo guardar la imagen.');
    }

    return '/uploads/' . $name;
}

function existing_image(string $path): string
{
    if (!preg_match('#^/uploads/[A-Za-z0-9._-]+$#', $path)) {
        fail(422, 'La imagen actual no es válida.');
    }
    $file = dirname(__DIR__) . $path;
    if (!is_file($file)) {
        fail(422, 'No se encontró la imagen actual.');
    }

    return $path;
}

function resolve_image(string $image): string
{
    if (str_starts_with($image, 'data:image/')) {
        return save_image($image);
    }
    if (str_starts_with($image, '/uploads/')) {
        return existing_image($image);
    }

    fail(422, 'Agrega una imagen antes de guardar.');
}

function delete_image(string $path): void
{
    if (!preg_match('#^/uploads/[A-Za-z0-9._-]+$#', $path)) {
        return;
    }
    $file = dirname(__DIR__) . $path;
    if (is_file($file)) {
        unlink($file);
    }
}
