import { useEffect, useState } from 'react'
import { Button, Group, Stack, Switch, Text, TextInput, Title } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { api } from '../api'
import { defaultHours } from '../data'

export function Horarios() {
  const [rows, setRows] = useState(defaultHours)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api('/api/erp.php?recurso=horarios')
      .then((data) => { if (data.horarios?.length === 7) setRows(data.horarios) })
      .catch((error) => notifications.show({ color: 'red', message: error.message }))
  }, [])

  function update(dia, patch) {
    setRows((current) => current.map((row) => row.dia === dia ? { ...row, ...patch } : row))
  }

  async function save() {
    setSaving(true)
    try {
      const data = await api('/api/erp.php?recurso=horarios', { method: 'PUT', body: JSON.stringify({ horarios: rows }) })
      setRows(data.horarios)
      notifications.show({ color: 'teal', message: 'Los horarios ya se ven en el sitio.' })
    } catch (error) {
      notifications.show({ color: 'red', message: error.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Stack maw={720}>
      <div>
        <Title order={2}>Horarios</Title>
        <Text size="sm" c="dimmed" mt={4}>Define la apertura y el cierre de cada día. Lo que guardes aparece en el sitio.</Text>
      </div>
      {rows.map((row) => (
        <Group key={row.dia} align="flex-end" bg="white" p="md" style={{ borderRadius: 12 }} grow preventGrowOverflow={false}>
          <Text fw={600} mb={8} style={{ flex: '0 0 110px' }}>{row.nombre}</Text>
          <Switch mb={10} label="Cerrado" checked={Boolean(row.cerrado)} onChange={(event) => update(row.dia, { cerrado: event.currentTarget.checked })} />
          <TextInput label="Abre" type="time" disabled={row.cerrado} value={row.abre || ''} onChange={(event) => update(row.dia, { abre: event.target.value })} />
          <TextInput label="Cierra" type="time" disabled={row.cerrado} value={row.cierra || ''} onChange={(event) => update(row.dia, { cierra: event.target.value })} />
        </Group>
      ))}
      <Button color="rose" w="fit-content" loading={saving} onClick={save}>Guardar horarios</Button>
    </Stack>
  )
}
