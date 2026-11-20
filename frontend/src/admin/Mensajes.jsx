import { useEffect, useState } from 'react'
import { Badge, Button, Card, Group, Stack, Text, Title } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { api, when } from '../api'

export function Mensajes() {
  const [rows, setRows] = useState([])

  async function load() {
    setRows((await api('/api/erp.php?recurso=mensajes')).mensajes)
  }

  useEffect(() => { load().catch((error) => notifications.show({ color: 'red', message: error.message })) }, [])

  async function mark(row) {
    await api(`/api/erp.php?recurso=mensajes&id=${row.id}`, {
      method: 'PUT',
      body: JSON.stringify({ estado: row.estado === 'nuevo' ? 'atendido' : 'nuevo' }),
    })
    await load()
  }

  return (
    <Stack>
      <Title order={2}>Mensajes del sitio</Title>
      <Text c="dimmed" size="sm">Aquí llegan los mensajes de Contacto y las cancelaciones de citas.</Text>
      {rows.map((row) => (
        <Card key={row.id} withBorder radius="md" bg="white">
          <Group justify="space-between" align="flex-start">
            <div>
              <Group gap="xs">
                <Text fw={700}>{row.nombre}</Text>
                <Badge color={row.estado === 'nuevo' ? 'rose' : 'gray'} variant="light">{row.estado}</Badge>
              </Group>
              <Text size="sm" c="dimmed">{row.email}{row.telefono ? ` · ${row.telefono}` : ''} · {when(row.creadoEn)}</Text>
              <Text mt="xs">{row.mensaje}</Text>
            </div>
            <Button size="xs" variant="light" color="rose" onClick={() => mark(row).catch((error) => notifications.show({ color: 'red', message: error.message }))}>
              {row.estado === 'nuevo' ? 'Marcar atendido' : 'Marcar nuevo'}
            </Button>
          </Group>
        </Card>
      ))}
      {!rows.length && <Text c="dimmed">Cuando alguien escriba desde Contacto o cancele una cita, el mensaje aparecerá aquí.</Text>}
    </Stack>
  )
}
