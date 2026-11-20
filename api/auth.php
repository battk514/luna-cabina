<?php

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

start_session();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    if (empty($_SESSION['usuario_id'])) {
        fail(401, 'Inicia sesión para entrar al panel.');
    }
    ok(['usuario' => $_SESSION['usuario']]);
}

if ($method === 'DELETE') {
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'] ?? '', (bool) $params['secure'], (bool) $params['httponly']);
    }
    session_destroy();
    ok(['ok' => true]);
}

if ($method !== 'POST') {
    fail(405, 'Método no permitido.');
}

$body = read_json();
$usuario = trim((string) ($body['usuario'] ?? ''));
$clave = (string) ($body['clave'] ?? '');
if ($usuario === '' || $clave === '') {
    fail(422, 'Escribe el usuario y la contraseña.');
}

$statement = db()->prepare('SELECT id, usuario, clave_hash FROM usuarios WHERE usuario = ? LIMIT 1');
$statement->execute([$usuario]);
$row = $statement->fetch();

if (!$row || !password_verify($clave, (string) $row['clave_hash'])) {
    fail(401, 'Usuario o contraseña incorrectos.');
}

session_regenerate_id(true);
$_SESSION['usuario_id'] = (int) $row['id'];
$_SESSION['usuario'] = $row['usuario'];
ok(['usuario' => $row['usuario']]);
