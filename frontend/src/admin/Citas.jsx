import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Badge, Button, Group, Modal, NumberInput, ScrollArea, SegmentedControl, Select, Stack, Table, Text, Textarea, TextInput, Title } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { api, money, whatsappHref, when } from '../api'
import { CitaContacto, citaMessage, estadoLabel } from './CitaContacto'

const blank = { clienteId: '', servicioId: '', inicio: '', estado: 'pendiente', precio: 0, notas: '', telefono: '', cliente: '', servicio: '' }
const estados = [
  ['pendiente', 'Pendiente'],
  ['confirmada', 'Confirmada'],
  ['completada', 'Completada'],
  ['cancelada', 'Cancelada'],
]

function localToday() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export function Citas() {
  const [params, setParams] = useSearchParams()
  const [rows, setRows] = useState([])
  const [clients, setClients] = useState([])
  const [services, setServices] = useState([])
  const [form, setForm] = useState(null)
  const [originalInicio, setOriginalInicio] = useState('')
  const [vista, setVista] = useState('proximas')
  const servicioFiltro = params.get('servicio') || ''

  async function load() {
    const [citas, clientes, servicios] = await Promise.all([
      api('/api/erp.php?recurso=citas'),
      api('/api/erp.php?recurso=clientes'),
      api('/api/erp.php?recurso=servicios'),
    ])
    setRows(citas.citas)
    setClients(clientes.clientes)
    setServices(servicios.servicios)
  }

  useEffect(() => { load().catch((error) => notifications.show({ color: 'red', message: error.message })) }, [])

  const visible = useMemo(() => {
    const today = localToday()
    return rows
      .filter((row) => !servicioFiltro || String(row.servicioId) === servicioFiltro)
      .filter((row) => {
        const day = String(row.inicio).slice(0, 10)
        if (vista === 'hoy') return day === today && row.estado !== 'cancelada'
        if (vista === 'pasadas') return day < today || row.estado === 'completada'
        if (vista === 'canceladas') return row.estado === 'cancelada'
        return day >= today && row.estado !== 'cancelada' && row.estado !== 'completada'
      })
      .sort((a, b) => vista === 'pasadas' ? String(b.inicio).localeCompare(String(a.inicio)) : String(a.inicio).localeCompare(String(b.inicio)))
  }, [rows, vista, servicioFiltro])

  function edit(row) {
    const inicio = String(row.inicio).replace(' ', 'T').slice(0, 16)
    setOriginalInicio(inicio)
    setForm({
      id: row.id,
      clienteId: String(row.clienteId),
      servicioId: String(row.servicioId),
      inicio,
      estado: row.estado,
      precio: row.precio,
      notas: row.notas || '',
      telefono: row.telefono || '',
      cliente: row.cliente,
      servicio: row.servicio,
    })
  }

  function payload(current) {
    const service = services.find((item) => String(item.id) === String(current.servicioId))
    const client = clients.find((item) => String(item.id) === String(current.clienteId))
    return {
      ...current,
      clienteId: Number(current.clienteId),
      servicioId: Number(current.servicioId),
      cliente: client?.nombre || current.cliente,
      telefono: client?.telefono || current.telefono,
      servicio: service?.nombre || current.servicio,
    }
  }

  async function save(notify) {
    const editing = Boolean(form.id)
    const current = payload(form)
    await api(`/api/erp.php?recurso=citas${editing ? `&id=${form.id}` : ''}`, {
      method: editing ? 'PUT' : 'POST',
      body: JSON.stringify(current),
    })
    if (notify && current.telefono) {
      const text = citaMessage(current, current.inicio)
      if (current.clienteId) {
        await api('/api/erp.php?recurso=seguimientos', {
          method: 'POST',
          body: JSON.stringify({ clienteId: current.clienteId, tipo: 'mensaje', detalle: text }),
        }).catch(() => {})
      }
      const href = whatsappHref(current.telefono, text)
      if (href) window.open(href, '_blank', 'noopener')
    }
    setForm(null)
    await load()
    notifications.show({ color: 'teal', message: notify ? 'La cita quedó guardada y se abrió WhatsApp para avisarle.' : 'La cita quedó guardada.' })
  }

  async function cancel(row) {
    if (!window.confirm(`¿Cancelar la cita de ${row.cliente}?`)) return
    await api(`/api/erp.php?recurso=citas&id=${row.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        clienteId: row.clienteId,
        servicioId: row.servicioId,
        inicio: row.inicio,
        estado: 'cancelada',
        precio: row.precio,
        notas: row.notas || '',
      }),
    })
    await load()
  }

  async function remove(row) {
    if (!window.confirm(`¿Eliminar la cita de ${row.cliente}?`)) return
    await api(`/api/erp.php?recurso=citas&id=${row.id}`, { method: 'DELETE' })
    await load()
  }

  const moved = Boolean(form?.id) && form.inicio !== originalInicio

  return (
    <Stack>
      <Group justify="space-between" align="flex-end">
        <div>
          <Title order={2}>Citas</Title>
          <Text size="sm" c="dimmed">Citas agendadas. Si hay que recorrer la hora, edítala y avisa a la clienta por llamada o WhatsApp.</Text>
        </div>
        <Button color="rose" onClick={() => { setOriginalInicio(''); setForm(blank) }}>Nueva cita</Button>
      </Group>
      <Group justify="space-between" align="center">
        <SegmentedControl
          value={vista}
          onChange={setVista}
          data={[
            { value: 'proximas', label: 'Próximas' },
            { value: 'hoy', label: 'Hoy' },
            { value: 'pasadas', label: 'Pasadas' },
            { value: 'canceladas', label: 'Canceladas' },
          ]}
        />
        <Select
          placeholder="Todos los servicios"
          clearable
          data={services.map((item) => ({ value: String(item.id), label: item.nombre }))}
          value={servicioFiltro || null}
          onChange={(value) => {
            const next = new URLSearchParams(params)
            if (value) next.set('servicio', value)
            else next.delete('servicio')
            setParams(next)
          }}
          w={240}
        />
      </Group>
      <ScrollArea>
        <Table highlightOnHover bg="white" miw={860}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Cuándo</Table.Th>
              <Table.Th>Clienta</Table.Th>
              <Table.Th>Servicio</Table.Th>
              <Table.Th>Estado</Table.Th>
              <Table.Th>Precio</Table.Th>
              <Table.Th>Contacto</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {visible.map((row) => (
              <Table.Tr key={row.id}>
                <Table.Td>{when(row.inicio)}</Table.Td>
                <Table.Td>
                  <Text size="sm" fw={600}>{row.cliente}</Text>
                  <Text size="xs" c="dimmed">{row.telefono || 'Sin teléfono'}</Text>
                </Table.Td>
                <Table.Td>{row.servicio}</Table.Td>
                <Table.Td><Badge variant="light" color={row.estado === 'cancelada' ? 'gray' : row.estado === 'confirmada' ? 'teal' : 'rose'}>{estadoLabel(row.estado)}</Badge></Table.Td>
                <Table.Td>{money(row.precio)}</Table.Td>
                <Table.Td><CitaContacto row={row} /></Table.Td>
                <Table.Td>
                  <Group gap={4} justify="flex-end" wrap="nowrap">
                    <Button size="xs" variant="subtle" onClick={() => edit(row)}>Editar</Button>
                    {row.estado !== 'cancelada' && <Button size="xs" variant="subtle" onClick={() => cancel(row).catch((error) => notifications.show({ color: 'red', message: error.message }))}>Cancelar</Button>}
                    <Button size="xs" variant="subtle" color="red" onClick={() => remove(row).catch((error) => notifications.show({ color: 'red', message: error.message }))}>Eliminar</Button>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
            {!visible.length && <Table.Tr><Table.Td colSpan={7}>No hay citas en esta vista.</Table.Td></Table.Tr>}
          </Table.Tbody>
        </Table>
      </ScrollArea>
      <Modal opened={Boolean(form)} onClose={() => setForm(null)} title={form?.id ? 'Editar cita' : 'Nueva cita'}>
        {form && (
          <Stack>
            <Select label="Clienta" data={clients.map((item) => ({ value: String(item.id), label: item.telefono ? `${item.nombre} · ${item.telefono}` : item.nombre }))} value={form.clienteId || null} onChange={(clienteId) => setForm({ ...form, clienteId })} searchable />
            <Select label="Servicio" data={services.filter((item) => item.activo || String(item.id) === form.servicioId).map((item) => ({ value: String(item.id), label: item.nombre }))} value={form.servicioId || null} onChange={(servicioId) => {
              const service = services.find((item) => String(item.id) === servicioId)
              setForm({ ...form, servicioId, precio: service ? service.precio : form.precio, servicio: service?.nombre || form.servicio })
            }} />
            <TextInput label="Fecha y hora de llegada" type="datetime-local" value={form.inicio} onChange={(event) => setForm({ ...form, inicio: event.target.value })} />
            {moved && <Text size="sm" c="#97545e">La hora cambió. Puedes avisarle a la clienta por WhatsApp al guardar.</Text>}
            <Select label="Estado" data={estados.map(([value, label]) => ({ value, label }))} value={form.estado} onChange={(estado) => setForm({ ...form, estado })} />
            <NumberInput label="Precio" min={0} value={form.precio} onChange={(precio) => setForm({ ...form, precio })} />
            <Textarea label="Notas" value={form.notas} onChange={(event) => setForm({ ...form, notas: event.target.value })} />
            <Group grow>
              <Button variant="default" onClick={() => save(false).catch((error) => notifications.show({ color: 'red', message: error.message }))}>Guardar</Button>
              <Button color="rose" disabled={!payload(form).telefono} onClick={() => save(true).catch((error) => notifications.show({ color: 'red', message: error.message }))}>Guardar y avisar</Button>
            </Group>
            {!payload(form).telefono && <Text size="xs" c="dimmed">Agrega el teléfono de la clienta para poder llamarla o escribirle.</Text>}
          </Stack>
        )}
      </Modal>
    </Stack>
  )
}
