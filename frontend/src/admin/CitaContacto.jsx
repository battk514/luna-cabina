import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Anchor, Badge, Button, Card, Group, ScrollArea, Table, Text, Title } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { api, telHref, whatsappHref, when } from '../api'

export function citaMessage(row, inicio = row.inicio) {
  return `Hola ${row.cliente}, te escribimos de Luna Cabina. Tu cita de ${row.servicio} queda para el ${when(inicio)}. Si necesitas recorrer la hora, avísanos.`
}

export function CitaContacto({ row, message }) {
  const tel = telHref(row.telefono)
  const text = message || citaMessage(row)
  const wa = whatsappHref(row.telefono, text)
  if (!tel && !wa) return <Text size="xs" c="dimmed">Sin teléfono</Text>

  async function avisar() {
    if (row.clienteId) {
      await api('/api/erp.php?recurso=seguimientos', {
        method: 'POST',
        body: JSON.stringify({ clienteId: row.clienteId, tipo: 'mensaje', detalle: text }),
      }).catch(() => {})
    }
    window.open(wa, '_blank', 'noopener')
  }

  return (
    <Group gap={4} wrap="nowrap">
      {tel && <Button component="a" href={tel} size="xs" variant="light" color="rose">Llamar</Button>}
      {wa && <Button size="xs" variant="light" onClick={() => avisar().catch((error) => notifications.show({ color: 'red', message: error.message }))}>WhatsApp</Button>}
    </Group>
  )
}

export function ProximasCitas() {
  const [rows, setRows] = useState([])

  useEffect(() => {
    api('/api/erp.php?recurso=citas').then((data) => {
      const now = Date.now()
      const upcoming = (data.citas || [])
        .filter((row) => row.estado !== 'cancelada' && row.estado !== 'completada' && new Date(String(row.inicio).replace(' ', 'T')).getTime() >= now - 60 * 60 * 1000)
        .sort((a, b) => String(a.inicio).localeCompare(String(b.inicio)))
        .slice(0, 6)
      setRows(upcoming)
    }).catch(() => {})
  }, [])

  return (
    <Card withBorder radius="md" bg="white" mt="lg">
      <Group justify="space-between" mb="sm">
        <div>
          <Title order={3} fz={18}>Citas agendadas</Title>
          <Text size="xs" c="dimmed">Si hay que mover la hora, llama o escribe a la clienta desde aquí.</Text>
        </div>
        <Anchor component={Link} to="/admin/citas" size="sm">Abrir agenda</Anchor>
      </Group>
      <ScrollArea>
        <Table miw={640}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Cuándo</Table.Th>
              <Table.Th>Clienta</Table.Th>
              <Table.Th>Servicio</Table.Th>
              <Table.Th>Estado</Table.Th>
              <Table.Th>Contacto</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.map((row) => (
              <Table.Tr key={row.id}>
                <Table.Td>{when(row.inicio)}</Table.Td>
                <Table.Td>{row.cliente}</Table.Td>
                <Table.Td>{row.servicio}</Table.Td>
                <Table.Td><Badge variant="light">{estadoLabel(row.estado)}</Badge></Table.Td>
                <Table.Td><CitaContacto row={row} /></Table.Td>
              </Table.Tr>
            ))}
            {!rows.length && (
              <Table.Tr><Table.Td colSpan={5}><Text size="sm" c="dimmed">No hay citas próximas.</Text></Table.Td></Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </ScrollArea>
    </Card>
  )
}

export function estadoLabel(estado) {
  return { pendiente: 'Pendiente', confirmada: 'Confirmada', completada: 'Completada', cancelada: 'Cancelada' }[estado] || estado
}
