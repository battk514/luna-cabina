<?php

declare(strict_types=1);

function cabin_tz(): DateTimeZone
{
    return new DateTimeZone('America/Mexico_City');
}

function cabin_now(): DateTime
{
    return new DateTime('now', cabin_tz());
}

function cita_inicio(string $value): DateTime
{
    $parsed = DateTime::createFromFormat('Y-m-d H:i:s', $value, cabin_tz());
    if (!$parsed) {
        $parsed = DateTime::createFromFormat('Y-m-d H:i', $value, cabin_tz());
    }
    if (!$parsed) {
        fail(422, 'La hora de la cita no es válida.');
    }

    return $parsed;
}

function minutes_until(DateTime $inicio, ?DateTime $now = null): int
{
    $now ??= cabin_now();

    return (int) floor(($inicio->getTimestamp() - $now->getTimestamp()) / 60);
}

function puede_cancelar(int $minutes): bool
{
    return $minutes >= 20;
}

function phone_key(string $value): string
{
    $digits = preg_replace('/\D+/', '', $value) ?? '';
    if (strlen($digits) > 10) {
        $digits = substr($digits, -10);
    }

    return $digits;
}

function alerta_de_cita(string $servicio, DateTime $inicio, int $minutes, ?DateTime $now = null): ?array
{
    $now ??= cabin_now();
    $hora = $inicio->format('H:i');
    if ($minutes < -30) {
        return null;
    }
    if ($minutes < 0) {
        return ['nivel' => 'ahora', 'texto' => "Tu cita de {$servicio} ya es a esta hora ({$hora})."];
    }
    if ($minutes <= 60) {
        return ['nivel' => 'hora', 'texto' => "Ya se acerca tu hora de cita de {$servicio}. Es a las {$hora}."];
    }
    if ($minutes <= 180) {
        return ['nivel' => 'pronto', 'texto' => "Tu cita de {$servicio} es hoy a las {$hora}. Ya falta poco."];
    }

    $hoy = $now->format('Y-m-d');
    $manana = (clone $now)->modify('+1 day')->format('Y-m-d');
    $dia = $inicio->format('Y-m-d');
    if ($dia === $hoy) {
        return ['nivel' => 'hoy', 'texto' => "Hoy es tu día de cita de {$servicio}, a las {$hora}."];
    }
    if ($dia === $manana) {
        return ['nivel' => 'manana', 'texto' => "Mañana es tu día de cita de {$servicio}, a las {$hora}."];
    }

    return null;
}
