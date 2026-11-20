import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Box, Button, Container, SimpleGrid, Stack, Text, Title } from '@mantine/core'
import { api } from '../api'
import { OccasionCard } from '../components/OccasionCard'
import { fallbackOccasions } from '../data'

export function Ocasiones() {
  const [items, setItems] = useState(fallbackOccasions)

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)
    api('/api/content.php')
      .then((data) => {
        const live = (data.occasions || [])
          .filter((item) => item.visible !== false && item.date >= today && item.title)
          .sort((a, b) => a.date.localeCompare(b.date))
        if (live.length) setItems(live)
      })
      .catch(() => {})
  }, [])

  return (
    <Box>
      <Box py={{ base: 48, sm: 72 }} style={{ background: 'linear-gradient(180deg, #f3ebe6 0%, #f7f2f0 100%)' }}>
        <Container size="lg">
          <Stack gap={8} maw={620}>
            <Text c="#b86f78" fw={700} size="xs" tt="uppercase" style={{ letterSpacing: '.16em' }}>Fechas</Text>
            <Title fz={{ base: 36, sm: 52 }} lh={1.05}>Ocasiones especiales</Title>
            <Text c="#716763" fz={{ base: 'sm', sm: 'md' }} lh={1.6}>Navidad, Día de Muertos, Buen Fin, Hot Sale y las fechas que la cabina quiere celebrar contigo.</Text>
          </Stack>
        </Container>
      </Box>

      <Container size="lg" pb={{ base: 48, sm: 72 }} mt={{ base: -8, sm: -12 }}>
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
          {items.map((item) => (
            <OccasionCard
              key={item.id}
              item={item}
              action={<Button className="promo-action" component={Link} to="/contacto" mt="auto" fullWidth size="md">Apartar cita</Button>}
            />
          ))}
        </SimpleGrid>
      </Container>
    </Box>
  )
}
