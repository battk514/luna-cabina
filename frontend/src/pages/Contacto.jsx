import { useState } from 'react'
import { Button, Container, SimpleGrid, Stack, Text, Textarea, TextInput, Title } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { api } from '../api'
import { phone, phoneHref } from '../data'
import { CabinMap } from '../components/CabinMap'

const empty = { nombre: '', email: '', telefono: '', mensaje: '' }

export function Contacto() {
  const [form, setForm] = useState(empty)
  const [sending, setSending] = useState(false)

  function set(field) {
    return (event) => setForm((current) => ({ ...current, [field]: event.target.value }))
  }

  async function submit(event) {
    event.preventDefault()
    setSending(true)
    try {
      await api('/api/mensajes.php', { method: 'POST', body: JSON.stringify(form) })
      setForm(empty)
      notifications.show({ color: 'teal', message: 'Recibimos tu mensaje. Te contactaremos pronto.' })
    } catch (error) {
      notifications.show({ color: 'red', message: error.message })
    } finally {
      setSending(false)
    }
  }

  return (
    <Container size="lg" py={56}>
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing={40}>
        <form onSubmit={submit}>
          <Stack>
            <Text c="#b86f78" fw={700} size="xs" tt="uppercase" style={{ letterSpacing: '.14em' }}>Escríbenos</Text>
            <Title fz={{ base: 34, sm: 46 }}>Contacta con nosotros</Title>
            <TextInput label="Tu nombre" required value={form.nombre} onChange={set('nombre')} />
            <TextInput label="Tu correo" type="email" required value={form.email} onChange={set('email')} />
            <TextInput label="Tu teléfono" value={form.telefono} onChange={set('telefono')} />
            <Textarea label="Tu mensaje" required minRows={5} value={form.mensaje} onChange={set('mensaje')} />
            <Button type="submit" color="rose" loading={sending} w="fit-content">Enviar mensaje</Button>
          </Stack>
        </form>
        <Stack gap="sm">
          <Title order={2}>Información de contacto</Title>
          <Text><Text span fw={700}>Teléfono. </Text><a href={phoneHref}>{phone}</a></Text>
          <Text c="#716763" size="sm">Luna cabina de depilación.</Text>
          <CabinMap />
        </Stack>
      </SimpleGrid>
    </Container>
  )
}
