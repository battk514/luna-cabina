import { NavLink as RouterLink, Outlet, useLocation, useNavigate, useOutletContext } from 'react-router-dom'
import { AppShell, Burger, Button, Group, NavLink, Text } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { api } from '../api'

const links = [
  ['/admin', 'Resumen'],
  ['/admin/clientes', 'Clientas'],
  ['/admin/citas', 'Citas'],
  ['/admin/servicios', 'Servicios'],
  ['/admin/promociones', 'Promociones'],
  ['/admin/ocasiones', 'Ocasiones'],
  ['/admin/mensajes', 'Mensajes'],
  ['/admin/horarios', 'Horarios'],
]

export function AdminShell() {
  const { user, setUser } = useOutletContext()
  const location = useLocation()
  const [opened, { toggle, close }] = useDisclosure()
  const navigate = useNavigate()

  async function logout() {
    await api('/api/auth.php', { method: 'DELETE' }).catch(() => {})
    setUser(null)
    navigate('/admin')
  }

  return (
    <AppShell
      header={{ height: 64 }}
      navbar={{ width: 240, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header px="md">
        <Group h="100%" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" aria-label="Menú" />
            <div>
              <Text fw={700} ff="'Playfair Display', Georgia, serif" lh={1.1}>Luna</Text>
              <Text size="xs" c="dimmed">ERP y CRM</Text>
            </div>
          </Group>
          <Group gap="sm">
            <Text size="sm" c="dimmed" visibleFrom="sm">{user}</Text>
            <Button variant="default" size="xs" onClick={logout}>Salir</Button>
          </Group>
        </Group>
      </AppShell.Header>
      <AppShell.Navbar p="sm">
        {links.map(([to, label]) => (
          <NavLink
            key={label}
            component={RouterLink}
            to={to}
            end={to === '/admin'}
            label={label}
            active={to === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(to)}
            onClick={close}
          />
        ))}
        <NavLink component={RouterLink} to="/" label="Ver el sitio" mt="auto" />
      </AppShell.Navbar>
      <AppShell.Main bg="#f7f2f0">
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
}
