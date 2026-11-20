<?php

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';
require __DIR__ . '/horario_datos.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    fail(405, 'Método no permitido.');
}

try {
    ok(['horarios' => horario_list(db())]);
} catch (PDOException) {
    ok(['horarios' => horario_defaults()]);
}
