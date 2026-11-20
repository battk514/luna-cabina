import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Center, Loader, Paper, PasswordInput, Stack, Text, TextInput, Title, Button } from '@mantine/core'
import { api } from '../api'

export function AdminGate() {
  const [user, setUser] = useState(undefined)
  const [usuario, setUsuario] = useState('')
  const [clave, setClave] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api('/api/auth.php').then((data) => setUser(data.usuario)).catch(() => setUser(null))
  }, [])

  async function submit(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const data = await api('/api/auth.php', { method: 'POST', body: JSON.stringify({ usuario, clave }) })
      setClave('')
      setUser(data.usuario)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (user === undefined) return <Center h="100vh" bg="#f7f2f0"><Loader color="rose" /></Center>
  if (!user) {
    return (
      <Center h="100vh" bg="#f7f2f0" p="md">
        <Paper component="form" onSubmit={submit} w={420} p={32} radius="lg" withBorder>
          <Text c="#a39793" fw={700} size="xs" tt="uppercase" style={{ letterSpacing: '.16em' }}>Luna Cabina</Text>
          <Title order={2} my="sm">Administración</Title>
          <Text c="#817774" size="sm" mb="lg">Entra para llevar clientas, citas, servicios y mensajes.</Text>
          <Stack>
            <TextInput label="Usuario" required value={usuario} onChange={(event) => setUsuario(event.target.value)} />
            <PasswordInput label="Contraseña" required value={clave} onChange={(event) => setClave(event.target.value)} />
            {error && <Text c="red" size="sm">{error}</Text>}
            <Button type="submit" color="rose" loading={loading}>Entrar</Button>
          </Stack>
        </Paper>
      </Center>
    )
  }

  return <Outlet context={{ user, setUser }} />
}
