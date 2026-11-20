import { useEffect, useState } from 'react'
import { Alert, Box, Button, Container, Group, Stack, Text, TextInput, Title } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { api, when } from '../api'
import { phone, phoneHref } from '../data'
import { consultarCita, enableAlerts, forgetPhone, notifyAlerts, rememberPhone, rememberedPhone } from '../citaAvisos'

export function MiCita() {
  const [telefono, setTelefono] = useState(rememberedPhone)
  const [nombre, setNombre] = useState('')
  const [citas, setCitas] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [alertsOn, setAlertsOn] = useState(typeof Notification !== 'undefined' && Notification.permission === 'granted')

  async function load(number = telefono) {
    const data = await consultarCita(number)
    rememberPhone(number)
    setNombre(data.nombre || '')
    setCitas(data.citas || [])
    notifyAlerts(data.citas)
  }

  useEffect(() => {
    if (!rememberedPhone()) return
    load(rememberedPhone()).catch(() => {})
  }, [])

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await load(telefono.trim())
    } catch (error) {
      setCitas(null)
      setError(error.status === 422 ? error.message : 'No pudimos consultar tus citas. Llama al ' + phone + '.')
    } finally {
      setBusy(false)
    }
  }

  async function cancel(cita) {
    if (!window.confirm('¿Cancelar esta cita? El aviso le llega a la cabina.')) return
    setBusy(true)
    try {
      const data = await api('/api/mi-cita.php', { method: 'POST', body: JSON.stringify({ telefono, citaId: cita.id, accion: 'cancelar' }) })
      notifications.show({ color: 'teal', message: data.mensaje || 'Cancelamos tu cita.' })
      await load(telefono)
    } catch (error) {
      notifications.show({ color: 'red', message: error.status === 422 || error.status === 404 ? error.message : 'No pudimos cancelar la cita. Llama al ' + phone + '.' })
    } finally {
      setBusy(false)
    }
  }

  async function activateAlerts() {
    const result = await enableAlerts()
    setAlertsOn(result === 'granted')
    if (result === 'granted') notifyAlerts(citas || [])
    else notifications.show({ color: 'red', message: 'El navegador no dejó activar las alertas.' })
  }

  return (
    <Box>
      <Box py={{ base: 48, sm: 72 }} style={{ background: 'linear-gradient(180deg, #f3ebe6 0%, #f7f2f0 100%)' }}>
        <Container size="lg">
          <Stack gap={8} maw={640}>
            <Text c="#b86f78" fw={700} size="xs" tt="uppercase" style={{ letterSpacing: '.16em' }}>Tu cita</Text>
            <Title fz={{ base: 36, sm: 52 }} lh={1.05}>Mi cita</Title>
            <Text c="#716763" lh={1.6}>Consulta el día y la hora. Te avisamos cuando se acerquen. Puedes cancelar hasta 20 minutos antes; ese aviso le llega a la cabina.</Text>
          </Stack>
        </Container>
      </Box>
      <Container size="sm" pb={{ base: 48, sm: 72 }}>
        <form onSubmit={submit}>
          <Stack>
            <TextInput label="Teléfono con el que agendaste" required value={telefono} onChange={(event) => setTelefono(event.target.value)} placeholder="222 000 0000" />
            <Group>
              <Button type="submit" color="rose" loading={busy}>Ver mi cita</Button>
              {citas && (
                <Button variant="default" onClick={() => { forgetPhone(); setCitas(null); setNombre(''); setTelefono('') }}>Olvidar teléfono</Button>
              )}
            </Group>
            {error && <Text c="#97545e" size="sm">{error}</Text>}
          </Stack>
        </form>

        {citas && (
          <Stack mt={28} gap="md">
            {nombre && <Text fw={600}>Hola, {nombre}.</Text>}
            {!alertsOn && citas.length > 0 && (
              <Button variant="light" color="rose" onClick={activateAlerts}>Activar alertas de día y hora</Button>
            )}
            {citas.map((cita) => (
              <Box key={cita.id} bg="white" p="lg" style={{ borderRadius: 20, border: '1px solid #eee8e5' }}>
                <Stack gap="xs">
                  {cita.alerta && <Alert color="rose" variant="light" title="Aviso de tu cita">{cita.alerta.texto}</Alert>}
                  <Text fw={700} fz="lg">{cita.servicio}</Text>
                  <Text>{when(cita.inicio)}</Text>
                  {cita.puedeCancelar ? (
                    <Button variant="default" disabled={busy} onClick={() => cancel(cita)}>Cancelar cita</Button>
                  ) : (
                    <Text size="sm" c="#716763">Ya no se puede cancelar por aquí. Hay que avisar al menos 20 minutos antes. Llama al <a href={phoneHref}>{phone}</a>.</Text>
                  )}
                </Stack>
              </Box>
            ))}
            {!citas.length && <Text c="#716763">No hay citas próximas con ese teléfono.</Text>}
          </Stack>
        )}
      </Container>
    </Box>
  )
}
