import { useEffect, useState } from 'react'
import { Button, Group, Modal, ScrollArea, Select, Stack, Table, Text, Textarea, TextInput, Title } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { api, when } from '../api'

const blank = { nombre: '', telefono: '', email: '', notas: '', origen: 'mostrador' }

export function Clientes() {
  const [rows, setRows] = useState([])
  const [query, setQuery] = useState('')
  const [form, setForm] = useState(null)
  const [detail, setDetail] = useState(null)
  const [note, setNote] = useState('')

  async function load(q = query) {
    const data = await api(`/api/erp.php?recurso=clientes&q=${encodeURIComponent(q)}`)
    setRows(data.clientes)
  }

  useEffect(() => { load('').catch((error) => notifications.show({ color: 'red', message: error.message })) }, [])

  async function save() {
    const editing = Boolean(form.id)
    await api(`/api/erp.php?recurso=clientes${editing ? `&id=${form.id}` : ''}`, {
      method: editing ? 'PUT' : 'POST',
      body: JSON.stringify(form),
    })
    setForm(null)
    await load()
    notifications.show({ color: 'teal', message: 'La clienta quedó guardada.' })
  }

  async function openDetail(id) {
    setDetail(await api(`/api/erp.php?recurso=clientes&id=${id}`))
  }

  async function addNote() {
    await api('/api/erp.php?recurso=seguimientos', { method: 'POST', body: JSON.stringify({ clienteId: detail.cliente.id, tipo: 'nota', detalle: note }) })
    setNote('')
    await openDetail(detail.cliente.id)
  }

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={2}>Clientas</Title>
        <Button color="rose" onClick={() => setForm(blank)}>Nueva clienta</Button>
      </Group>
      <TextInput placeholder="Buscar por nombre, teléfono o correo" value={query} onChange={(event) => { setQuery(event.target.value); load(event.target.value).catch(() => {}) }} />
      <ScrollArea><Table highlightOnHover bg="white" miw={640}>
        <Table.Thead><Table.Tr><Table.Th>Nombre</Table.Th><Table.Th>Teléfono</Table.Th><Table.Th>Correo</Table.Th><Table.Th>Origen</Table.Th></Table.Tr></Table.Thead>
        <Table.Tbody>
          {rows.map((row) => (
            <Table.Tr key={row.id} onClick={() => openDetail(row.id)} style={{ cursor: 'pointer' }}>
              <Table.Td>{row.nombre}</Table.Td>
              <Table.Td>{row.telefono || '—'}</Table.Td>
              <Table.Td>{row.email || '—'}</Table.Td>
              <Table.Td>{row.origen}</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table></ScrollArea>

      <Modal opened={Boolean(form)} onClose={() => setForm(null)} title={form?.id ? 'Editar clienta' : 'Nueva clienta'}>
        {form && (
          <Stack>
            <TextInput label="Nombre" required value={form.nombre} onChange={(event) => setForm({ ...form, nombre: event.target.value })} />
            <TextInput label="Teléfono" value={form.telefono || ''} onChange={(event) => setForm({ ...form, telefono: event.target.value })} />
            <TextInput label="Correo" value={form.email || ''} onChange={(event) => setForm({ ...form, email: event.target.value })} />
            <Select label="Origen" data={[['mostrador', 'Mostrador'], ['web', 'Sitio web'], ['referido', 'Referida']].map(([value, label]) => ({ value, label }))} value={form.origen} onChange={(origen) => setForm({ ...form, origen })} />
            <Textarea label="Notas" value={form.notas || ''} onChange={(event) => setForm({ ...form, notas: event.target.value })} />
            <Button color="rose" onClick={() => save().catch((error) => notifications.show({ color: 'red', message: error.message }))}>Guardar</Button>
          </Stack>
        )}
      </Modal>

      <Modal opened={Boolean(detail)} onClose={() => setDetail(null)} title={detail?.cliente.nombre} size="lg">
        {detail && (
          <Stack>
            <Text size="sm">{detail.cliente.telefono || 'Sin teléfono'} · {detail.cliente.email || 'Sin correo'}</Text>
            <Text size="sm" c="dimmed">{detail.cliente.notas}</Text>
            <Group>
              <Button variant="default" onClick={() => { setForm(detail.cliente); setDetail(null) }}>Editar</Button>
            </Group>
            <Title order={4}>Seguimiento</Title>
            {detail.seguimientos.map((item) => <Text key={item.id} size="sm"><b>{when(item.creado_en)} · {item.tipo}.</b> {item.detalle}</Text>)}
            {!detail.seguimientos.length && <Text size="sm" c="dimmed">Todavía no hay notas.</Text>}
            <Textarea placeholder="Nota de la visita, llamada o preferencia" value={note} onChange={(event) => setNote(event.target.value)} />
            <Button variant="light" color="rose" onClick={() => addNote().catch((error) => notifications.show({ color: 'red', message: error.message }))}>Agregar nota</Button>
            <Title order={4}>Citas</Title>
            {detail.citas.map((item) => <Text key={item.id} size="sm">{when(item.inicio)} · {item.servicio} · {item.estado}</Text>)}
          </Stack>
        )}
      </Modal>
    </Stack>
  )
}
