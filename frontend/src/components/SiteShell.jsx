import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Anchor, Box, Burger, Button, Container, Group, Stack, Text } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { defaultHours, hourLabel, phone, phoneHref } from '../data'
import { api } from '../api'
import { consultarCita, notifyAlerts, rememberedPhone, urgentAlert } from '../citaAvisos'

const links = [
  ['/', 'Inicio'],
  ['/servicios', 'Servicios'],
  ['/promociones', 'Promociones'],
  ['/ocasiones', 'Ocasiones'],
  ['/contacto', 'Contacto'],
  ['/mi-cita', 'Mi cita'],
]

export function SiteShell() {
  const [opened, { toggle, close }] = useDisclosure(false)
  const [year] = useState(() => new Date().getFullYear())
  const [aviso, setAviso] = useState(null)
  const [hours, setHours] = useState(defaultHours)
  const location = useLocation()

  useEffect(() => {
    api('/api/horarios.php').then((data) => {
      if (Array.isArray(data.horarios) && data.horarios.length === 7) setHours(data.horarios)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    let stop = false
    async function tick() {
      const telefono = rememberedPhone()
      if (!telefono) {
        if (!stop) setAviso(null)
        return
      }
      try {
        const data = await consultarCita(telefono)
        if (stop) return
        notifyAlerts(data.citas)
        setAviso(urgentAlert(data.citas))
      } catch {
        if (!stop) setAviso(null)
      }
    }
    tick()
    const id = window.setInterval(tick, 60000)
    return () => { stop = true; window.clearInterval(id) }
  }, [location.pathname])

  return (
    <Box mih="100vh" bg="#f7f2f0" c="#342c2b" style={{ display: 'flex', flexDirection: 'column' }}>
      <Box component="header" bg="#f3ebe6" style={{ borderBottom: '1px solid #eadfd9', position: 'sticky', top: 0, zIndex: 20 }}>
        <Container size="lg" h={78} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <Anchor component={Link} to="/" underline="never" onClick={close}>
            <img src="/images/logo_medium-removebg-preview.png" alt="Luna" style={{ height: 52, display: 'block' }} />
          </Anchor>
          <Group gap={4} visibleFrom="sm">
            {links.map(([to, label]) => (
              <NavItem key={to} to={to} label={label} />
            ))}
          </Group>
          <Group gap="xs">
            <Button component="a" href={phoneHref} visibleFrom="sm" color="rose">{phone}</Button>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" aria-label="Abrir menú" color="#97545e" />
          </Group>
        </Container>
        {opened && (
          <Stack gap={4} hiddenFrom="sm" px="md" pb="md">
            {links.map(([to, label]) => (
              <NavItem key={to} to={to} label={label} onClick={close} />
            ))}
            <Button component="a" href={phoneHref} color="rose">{phone}</Button>
          </Stack>
        )}
      </Box>
      {aviso?.alerta && location.pathname !== '/mi-cita' && (
        <Box bg="#97545e" c="white" py={10}>
          <Container size="lg">
            <Group justify="space-between" gap="sm">
              <Text size="sm">{aviso.alerta.texto}</Text>
              <Anchor component={Link} to="/mi-cita" c="white" size="sm" underline="always">Ver mi cita</Anchor>
            </Group>
          </Container>
        </Box>
      )}

      <Box style={{ flex: '1 0 auto' }}>
        <Outlet context={{ hours }} />
      </Box>

      <Box component="footer" bg="#342c2b" c="#f7f2f0" py={36}>
        <Container size="lg">
          <Group justify="space-between" align="flex-start" gap="xl">
            <div>
              <Text ff="'Playfair Display', Georgia, serif" fz={28}>Luna</Text>
              <Text c="#d9ccc7" size="sm" mt={6}>Cabina de depilación y masajes</Text>
              <Text size="sm" mt={14}><Anchor href={phoneHref} c="#f7f2f0">{phone}</Anchor></Text>
            </div>
            <Stack gap={6} miw={220}>
              {hours.map((row) => (
                <Group key={row.dia} justify="space-between" gap="xl" wrap="nowrap">
                  <Text size="sm" c="#d9ccc7">{row.nombre}</Text>
                  <Text size="sm">{hourLabel(row)}</Text>
                </Group>
              ))}
            </Stack>
          </Group>
          <Text size="xs" c="#b7aaa4" mt={28}>© {year} Luna Cabina · <Anchor component={Link} to="/admin" c="#e7d4cf" size="xs">Administración</Anchor></Text>
        </Container>
      </Box>
    </Box>
  )
}

function NavItem({ to, label, onClick }) {
  return (
    <NavLink to={to} end={to === '/'} onClick={onClick} style={{ textDecoration: 'none' }}>
      {({ isActive }) => (
        <Text px={12} py={8} fw={isActive ? 700 : 500} c={isActive ? '#97545e' : '#5c514e'} fz="sm">{label}</Text>
      )}
    </NavLink>
  )
}
