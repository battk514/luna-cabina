import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Anchor, Badge, Card, Group, ScrollArea, SimpleGrid, Stack, Table, Text, Title } from '@mantine/core'
import { api, money, when } from '../api'
import { CitaContacto, estadoLabel } from './CitaContacto'

const empty = { clientes: 0, citasProximas: 0, mensajesNuevos: 0, serviciosActivos: 0, agenda: [] }

export function Dashboard() {
  const [data, setData] = useState(empty)
  const [error, setError] = useState('')

  useEffect(() => {
    api('/api/erp.php?recurso=resumen').then(setData).catch((err) => setError(err.message))
  }, [])

  const stats = [
    ['Clientas', data.clientes, '/admin/clientes'],
    ['Citas por venir', data.citasProximas, '/admin/citas'],
    ['Mensajes nuevos', data.mensajesNuevos, '/admin/mensajes'],
    ['Servicios activos', data.serviciosActivos, '/admin/servicios'],
  ]

  return (
    <Stack>
      <Title order={2}>Resumen</Title>
      {error && <Text c="red">{error}</Text>}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
        {stats.map(([label, value, to]) => (
          <Card key={label} component={Link} to={to} withBorder radius="md" padding="lg" style={{ textDecoration: 'none', color: 'inherit' }}>
            <Text size="xs" c="dimmed" tt="uppercase" fw={700}>{label}</Text>
            <Text fz={32} ff="'Playfair Display', Georgia, serif">{value}</Text>
          </Card>
        ))}
      </SimpleGrid>
      <Card withBorder radius="md" bg="white">
        <Group justify="space-between" mb="sm">
          <Title order={3} fz={18}>Próximas citas</Title>
          <Anchor component={Link} to="/admin/citas" size="sm">Ver agenda</Anchor>
        </Group>
        <ScrollArea><Table miw={640}>
          <Table.Thead><Table.Tr><Table.Th>Cuándo</Table.Th><Table.Th>Clienta</Table.Th><Table.Th>Servicio</Table.Th><Table.Th>Estado</Table.Th><Table.Th>Precio</Table.Th><Table.Th>Contacto</Table.Th></Table.Tr></Table.Thead>
          <Table.Tbody>
            {data.agenda.map((item) => (
              <Table.Tr key={item.id}>
                <Table.Td>{when(item.inicio)}</Table.Td>
                <Table.Td>{item.cliente}</Table.Td>
                <Table.Td>{item.servicio}</Table.Td>
                <Table.Td><Badge variant="light">{estadoLabel(item.estado)}</Badge></Table.Td>
                <Table.Td>{money(item.precio)}</Table.Td>
                <Table.Td><CitaContacto row={item} /></Table.Td>
              </Table.Tr>
            ))}
            {!data.agenda.length && <Table.Tr><Table.Td colSpan={6}>Todavía no hay citas confirmadas.</Table.Td></Table.Tr>}
          </Table.Tbody>
        </Table></ScrollArea>
      </Card>
    </Stack>
  )
}
