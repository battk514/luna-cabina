<?php

declare(strict_types=1);

function horario_nombres(): array
{
    return [1 => 'Lunes', 2 => 'Martes', 3 => 'Miércoles', 4 => 'Jueves', 5 => 'Viernes', 6 => 'Sábado', 7 => 'Domingo'];
}

function horario_defaults(): array
{
    $rows = [];
    foreach (horario_nombres() as $dia => $nombre) {
        $weekend = $dia === 6;
        $rows[] = [
            'dia' => $dia,
            'nombre' => $nombre,
            'abre' => $dia === 7 ? '10:00' : ($weekend ? '10:00' : '09:00'),
            'cierra' => $dia === 7 ? '15:00' : ($weekend ? '15:00' : '19:00'),
            'cerrado' => $dia === 7,
        ];
    }

    return $rows;
}

function horario_list(PDO $pdo): array
{
    $names = horario_nombres();
    $rows = $pdo->query('SELECT dia, abre, cierra, cerrado FROM horarios ORDER BY dia ASC')->fetchAll();
    if (count($rows) !== 7) {
        return horario_defaults();
    }
    $items = [];
    foreach ($rows as $row) {
        $dia = (int) $row['dia'];
        $items[] = [
            'dia' => $dia,
            'nombre' => $names[$dia] ?? 'Día',
            'abre' => $row['abre'] ? substr((string) $row['abre'], 0, 5) : '09:00',
            'cierra' => $row['cierra'] ? substr((string) $row['cierra'], 0, 5) : '19:00',
            'cerrado' => (int) $row['cerrado'] === 1,
        ];
    }

    return $items;
}

function horario_save(PDO $pdo, array $items): void
{
    if (count($items) !== 7) {
        fail(422, 'Hay que indicar el horario de los siete días.');
    }
    $seen = [];
    $ready = [];
    foreach ($items as $item) {
        if (!is_array($item)) {
            fail(422, 'El horario no es válido.');
        }
        $dia = (int) ($item['dia'] ?? 0);
        if ($dia < 1 || $dia > 7 || isset($seen[$dia])) {
            fail(422, 'El día del horario no es válido.');
        }
        $seen[$dia] = true;
        $cerrado = empty($item['cerrado']) ? 0 : 1;
        $abre = $cerrado ? null : clean_clock((string) ($item['abre'] ?? ''));
        $cierra = $cerrado ? null : clean_clock((string) ($item['cierra'] ?? ''));
        if (!$cerrado && $abre >= $cierra) {
            fail(422, 'La hora de cierre tiene que ser después de la apertura.');
        }
        $ready[] = [$dia, $abre, $cierra, $cerrado];
    }
    $update = $pdo->prepare('INSERT INTO horarios (dia, abre, cierra, cerrado) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE abre = VALUES(abre), cierra = VALUES(cierra), cerrado = VALUES(cerrado)');
    $pdo->beginTransaction();
    try {
        foreach ($ready as $values) {
            $update->execute($values);
        }
        $pdo->commit();
    } catch (Throwable $error) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $error;
    }
}

function clean_clock(string $value): string
{
    if (!preg_match('/^(\d{2}):(\d{2})(?::\d{2})?$/', trim($value), $matches)) {
        fail(422, 'La hora no es válida.');
    }
    $hour = (int) $matches[1];
    $minute = (int) $matches[2];
    if ($hour > 23 || $minute > 59) {
        fail(422, 'La hora no es válida.');
    }

    return sprintf('%02d:%02d:00', $hour, $minute);
}
