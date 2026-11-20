import { useEffect, useState } from 'react'
import { Badge, Button, FileButton, Group, Modal, ScrollArea, SimpleGrid, Stack, Switch, Table, Text, Textarea, TextInput, Title } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { api, media, when } from '../api'
import { OccasionCard } from '../components/OccasionCard'
import { fallbackOccasions } from '../data'
import { ProximasCitas } from './CitaContacto'

const occasionIdeas = fallbackOccasions.map(({ title, description, date, image }) => ({ title, description, date, image }))

export function Publicaciones({ kind, title }) {
  const [rows, setRows] = useState([])
  const [form, setForm] = useState(null)

  async function load() {
    const data = await api(`/api/items.php?kind=${kind}`)
    setRows(data.items)
  }

  useEffect(() => { load().catch((error) => notifications.show({ color: 'red', message: error.message })) }, [kind])

  async function onFile(file) {
    if (!file) return
    const image = await fileToDataUrl(file)
    setForm((current) => ({ ...current, image }))
  }

  async function save() {
    const editing = Boolean(form.id)
    await api('/api/items.php', { method: editing ? 'PUT' : 'POST', body: JSON.stringify({ ...form, kind }) })
    setForm(null)
    await load()
    notifications.show({ color: 'teal', message: 'La publicación quedó guardada.' })
  }

  async function remove(row) {
    if (!window.confirm(`¿Eliminar “${row.title}”?`)) return
    await api('/api/items.php', { method: 'DELETE', body: JSON.stringify({ kind, id: row.id }) })
    await load()
  }

  async function setVisible(row, visible) {
    await api('/api/items.php', { method: 'PUT', body: JSON.stringify({ ...row, kind, visible }) })
    await load()
  }

  const blank = { title: '', description: '', date: new Date().toISOString().slice(0, 10), image: '', visible: true }
  const occasions = kind === 'occasions'

  return (
    <Stack>
      <Group justify="space-between" align="flex-end">
        <div>
          <Title order={2}>{title}</Title>
          <Text size="sm" c="dimmed" mt={4}>{occasions ? 'Eventos como Navidad, Día de Muertos, Buen Fin o Hot Sale.' : 'Paquetes que se muestran en el sitio.'} Puedes editarlos, ocultarlos o eliminarlos.</Text>
        </div>
        <Button color="rose" onClick={() => setForm(blank)}>{occasions ? 'Nueva ocasión' : 'Nueva'}</Button>
      </Group>
      {occasions && (
        <Group gap="xs">
          {occasionIdeas.map((idea) => (
            <Button key={idea.title} size="xs" variant="light" color="rose" onClick={() => setForm({ ...idea })}>{idea.title}</Button>
          ))}
        </Group>
      )}
      {occasions ? (
        rows.length ? (
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            {rows.map((row) => (
              <div key={row.id} style={{ opacity: row.visible === false ? 0.55 : 1 }}>
              <OccasionCard
                item={row}
                action={(
                  <Stack gap="xs" mt="auto">
                    <Badge variant="light" color={row.visible === false ? 'gray' : 'teal'} w="fit-content">{row.visible === false ? 'Oculta' : 'Visible'}</Badge>
                    <Group gap="xs">
                      <Button className="promo-action" size="sm" style={{ flex: 1 }} onClick={() => setForm({ ...row, visible: row.visible !== false })}>Editar</Button>
                      <Button size="sm" variant="default" onClick={() => setVisible(row, row.visible === false).catch((error) => notifications.show({ color: 'red', message: error.message }))}>{row.visible === false ? 'Mostrar' : 'Ocultar'}</Button>
                      <Button size="sm" variant="default" color="red" onClick={() => remove(row).catch((error) => notifications.show({ color: 'red', message: error.message }))}>Eliminar</Button>
                    </Group>
                  </Stack>
                )}
              />
              </div>
            ))}
          </SimpleGrid>
        ) : <Text c="dimmed">Aún no hay ocasiones. Crea una tarjeta o parte de una fecha sugerida.</Text>
      ) : (
      <ScrollArea><Table highlightOnHover bg="white" miw={640}>
        <Table.Thead><Table.Tr><Table.Th>Publicación</Table.Th><Table.Th>Fecha</Table.Th><Table.Th>En el sitio</Table.Th><Table.Th /></Table.Tr></Table.Thead>
        <Table.Tbody>
          {rows.map((row) => (
            <Table.Tr key={row.id}>
              <Table.Td>
                <Group>
                  {row.image && <img src={media(row.image)} alt="" style={{ width: 42, height: 42, objectFit: 'cover', borderRadius: 8 }} />}
                  <div><Text fw={600} size="sm">{row.title}</Text><Text size="xs" c="dimmed" lineClamp={1}>{row.description}</Text></div>
                </Group>
              </Table.Td>
              <Table.Td>{when(row.date)}</Table.Td>
              <Table.Td><Badge variant="light" color={row.visible === false ? 'gray' : 'teal'}>{row.visible === false ? 'Oculta' : 'Visible'}</Badge></Table.Td>
              <Table.Td>
                <Group gap={4} justify="flex-end" wrap="nowrap">
                  <Button size="xs" variant="subtle" onClick={() => setForm({ ...row, visible: row.visible !== false })}>Editar</Button>
                  <Button size="xs" variant="subtle" onClick={() => setVisible(row, row.visible === false).catch((error) => notifications.show({ color: 'red', message: error.message }))}>{row.visible === false ? 'Mostrar' : 'Ocultar'}</Button>
                  <Button size="xs" variant="subtle" color="red" onClick={() => remove(row).catch((error) => notifications.show({ color: 'red', message: error.message }))}>Eliminar</Button>
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table></ScrollArea>
      )}
      <Modal opened={Boolean(form)} onClose={() => setForm(null)} title={form?.id ? 'Editar' : occasions ? 'Nueva ocasión' : 'Nueva publicación'} size={occasions ? 'lg' : 'md'}>
        {form && (
          <SimpleGrid cols={occasions ? { base: 1, sm: 2 } : 1} spacing="lg">
            <Stack>
              <TextInput label={occasions ? 'Nombre del evento' : 'Título'} required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
              <Textarea label={occasions ? 'Texto de la tarjeta' : 'Descripción'} required minRows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
              <TextInput label={kind === 'promotions' ? 'Válida hasta' : 'Fecha del evento'} type="date" required value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
              <FileButton onChange={onFile} accept="image/png,image/jpeg,image/webp">
                {(props) => <Button variant="default" {...props}>Elegir imagen</Button>}
              </FileButton>
              {!occasions && form.image && <img src={media(form.image)} alt="" style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 8 }} />}
              <Switch label="Visible en el sitio" checked={form.visible !== false} onChange={(event) => setForm({ ...form, visible: event.currentTarget.checked })} />
              <Button color="rose" onClick={() => save().catch((error) => notifications.show({ color: 'red', message: error.message }))}>Guardar</Button>
            </Stack>
            {occasions && (
              <OccasionCard item={{ ...form, title: form.title || 'Nombre del evento', description: form.description || 'Aquí va el texto de la tarjeta.' }} />
            )}
          </SimpleGrid>
        )}
      </Modal>
      <ProximasCitas />
    </Stack>
  )
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('No se pudo leer la imagen.'))
    reader.onload = () => resolve(reader.result)
    reader.readAsDataURL(file)
  })
}
