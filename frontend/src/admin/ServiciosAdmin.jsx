import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Anchor, Badge, Button, Group, Modal, NumberInput, ScrollArea, Select, Stack, Switch, Table, Text, Textarea, TextInput, Title } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { api, money } from '../api'
import { ProximasCitas } from './CitaContacto'

const blank = { nombre: '', descripcion: '', detalles: '', categoria: 'depilacion', precio: 0, duracionMin: 30, imagen: '', activo: true }

export function ServiciosAdmin() {
  const [rows, setRows] = useState([])
  const [form, setForm] = useState(null)

  async function load() {
    setRows((await api('/api/erp.php?recurso=servicios')).servicios)
  }

  useEffect(() => { load().catch((error) => notifications.show({ color: 'red', message: error.message })) }, [])

  async function save() {
    const editing = Boolean(form.id)
    await api(`/api/erp.php?recurso=servicios${editing ? `&id=${form.id}` : ''}`, {
      method: editing ? 'PUT' : 'POST',
      body: JSON.stringify(form),
    })
    setForm(null)
    await load()
    notifications.show({ color: 'teal', message: 'El servicio quedó guardado.' })
  }

  async function toggle(row) {
    await api(`/api/erp.php?recurso=servicios&id=${row.id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...row, activo: !row.activo }),
    })
    await load()
  }

  async function remove(row) {
    if (!window.confirm(`¿Eliminar “${row.nombre}”?`)) return
    await api(`/api/erp.php?recurso=servicios&id=${row.id}`, { method: 'DELETE' })
    await load()
  }

  return (
    <Stack>
      <Group justify="space-between">
        <div>
          <Title order={2}>Servicios</Title>
          <Text size="sm" c="dimmed">Crea, edita, oculta o elimina. Lo oculto deja de verse en el sitio y conserva sus citas.</Text>
        </div>
        <Button color="rose" onClick={() => setForm(blank)}>Nuevo servicio</Button>
      </Group>
      <ScrollArea><Table highlightOnHover bg="white" miw={720}>
        <Table.Thead><Table.Tr><Table.Th>Servicio</Table.Th><Table.Th>Categoría</Table.Th><Table.Th>Duración</Table.Th><Table.Th>Precio</Table.Th><Table.Th>En el sitio</Table.Th><Table.Th>Agenda</Table.Th><Table.Th /></Table.Tr></Table.Thead>
        <Table.Tbody>
          {rows.map((row) => (
            <Table.Tr key={row.id}>
              <Table.Td>{row.nombre}</Table.Td>
              <Table.Td>{row.categoria}</Table.Td>
              <Table.Td>{row.duracionMin} min</Table.Td>
              <Table.Td>{money(row.precio)}</Table.Td>
              <Table.Td><Badge color={row.activo ? 'teal' : 'gray'} variant="light">{row.activo ? 'Visible' : 'Oculto'}</Badge></Table.Td>
              <Table.Td><Anchor component={Link} to={`/admin/citas?servicio=${row.id}`} size="sm">Ver citas</Anchor></Table.Td>
              <Table.Td>
                <Group gap={4} justify="flex-end" wrap="nowrap">
                  <Button size="xs" variant="subtle" onClick={() => setForm({ ...row, activo: Boolean(row.activo) })}>Editar</Button>
                  <Button size="xs" variant="subtle" onClick={() => toggle(row).catch((error) => notifications.show({ color: 'red', message: error.message }))}>{row.activo ? 'Ocultar' : 'Mostrar'}</Button>
                  <Button size="xs" variant="subtle" color="red" onClick={() => remove(row).catch((error) => notifications.show({ color: 'red', message: error.message }))}>Eliminar</Button>
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table></ScrollArea>
      <Modal opened={Boolean(form)} onClose={() => setForm(null)} title={form?.id ? 'Editar servicio' : 'Nuevo servicio'}>
        {form && (
          <Stack>
            <TextInput label="Nombre" required value={form.nombre} onChange={(event) => setForm({ ...form, nombre: event.target.value })} />
            <Textarea label="Descripción" required value={form.descripcion} onChange={(event) => setForm({ ...form, descripcion: event.target.value })} />
            <Textarea label="Detalles, uno por línea" value={form.detalles || ''} onChange={(event) => setForm({ ...form, detalles: event.target.value })} />
            <Select label="Categoría" data={[{ value: 'depilacion', label: 'Depilación' }, { value: 'masaje', label: 'Masaje' }, { value: 'facial', label: 'Facial' }]} value={form.categoria} onChange={(categoria) => setForm({ ...form, categoria })} />
            <NumberInput label="Precio" min={0} value={form.precio} onChange={(precio) => setForm({ ...form, precio })} />
            <NumberInput label="Duración en minutos" min={5} value={form.duracionMin} onChange={(duracionMin) => setForm({ ...form, duracionMin })} />
            <TextInput label="Ruta de la imagen" value={form.imagen || ''} onChange={(event) => setForm({ ...form, imagen: event.target.value })} />
            <Switch label="Activo en el sitio" checked={Boolean(form.activo)} onChange={(event) => setForm({ ...form, activo: event.currentTarget.checked })} />
            <Button color="rose" onClick={() => save().catch((error) => notifications.show({ color: 'red', message: error.message }))}>Guardar</Button>
          </Stack>
        )}
      </Modal>
      <ProximasCitas />
    </Stack>
  )
}
