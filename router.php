<?php

$uri = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? '/');
$root = __DIR__;

if (str_contains($uri, '..')) {
    http_response_code(400);
    return true;
}

if (str_starts_with($uri, '/api/')) {
    return false;
}

$direct = $root . $uri;
if ($uri !== '/' && is_file($direct)) {
    return false;
}

$distFile = $root . '/dist' . ($uri === '/' ? '/index.html' : $uri);
if (is_file($distFile)) {
    $types = [
        'css' => 'text/css; charset=utf-8',
        'js' => 'text/javascript; charset=utf-8',
        'svg' => 'image/svg+xml',
        'html' => 'text/html; charset=utf-8',
        'json' => 'application/json',
    ];
    $extension = pathinfo($distFile, PATHINFO_EXTENSION);
    if (isset($types[$extension])) {
        header('Content-Type: ' . $types[$extension]);
    }
    readfile($distFile);
    return true;
}

$index = $root . '/dist/index.html';
if (is_file($index)) {
    header('Content-Type: text/html; charset=utf-8');
    readfile($index);
    return true;
}

return false;
