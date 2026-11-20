import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Box, Button, Container, Group, SimpleGrid, Stack, Text, Title } from '@mantine/core'
import { api, media, when } from '../api'
import { fallbackPromotions, phoneHref } from '../data'

function priceFrom(description, price) {
  if (price) return price
  const match = String(description || '').match(/\$\s*(\d+)/)
  return match ? Number(match[1]) : null
}

function includesFrom(item) {
  if (item.includes?.length) return item.includes
  const cleaned = String(item.description || '').replace(/\$\s*\d+[.,]?\d*/g, '').replace(/\.\s*$/, '')
  const parts = cleaned.split(/\s*\+\s*/).map((part) => part.trim()).filter(Boolean)
  return parts.length > 1 ? parts : []
}

export function Promociones() {
  const [items, setItems] = useState(fallbackPromotions)
  const [selectedId, setSelectedId] = useState(null)

  useEffect(() => {
    api('/api/content.php').then((data) => {
      const today = new Date().toISOString().slice(0, 10)
      const live = (data.promotions || []).filter((item) => item.visible !== false && item.date >= today && item.title)
      if (!live.length) return
      setItems(live.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        image: item.image,
        until: item.date,
        price: priceFrom(item.description),
      })))
    }).catch(() => {})
  }, [])

  return (
    <Box>
      <Box py={{ base: 48, sm: 72 }} style={{ background: 'linear-gradient(180deg, #f3ebe6 0%, #f7f2f0 100%)' }}>
        <Container size="lg">
          <Stack gap={8} maw={560}>
            <Text c="#b86f78" fw={700} size="xs" tt="uppercase" style={{ letterSpacing: '.16em' }}>Ofertas</Text>
            <Title fz={{ base: 36, sm: 52 }} lh={1.05}>Nuestras promociones</Title>
            <Text c="#716763" fz={{ base: 'sm', sm: 'md' }} lh={1.6}>Paquetes para consentirte. Elige el que mejor se adapta a lo que quieres cuidar.</Text>
          </Stack>
        </Container>
      </Box>

      <Container size="lg" pb={{ base: 48, sm: 72 }} mt={{ base: -8, sm: -12 }}>
        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
          {items.map((item) => {
            const includes = includesFrom(item)
            const selected = selectedId === item.id
            return (
              <Box
                key={item.id}
                className={selected ? 'promo-card is-selected' : 'promo-card'}
                h="100%"
                onClick={() => setSelectedId(item.id)}
                style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRadius: 20 }}
              >
                <Box h={{ base: 190, sm: 210 }} style={{ background: `#f3ebe6 url('${media(item.image)}') center/cover` }} />
                <Stack p={{ base: 'lg', sm: 28 }} gap="sm" style={{ flex: 1 }}>
                  <Text className="promo-kicker" fw={700} size="xs" tt="uppercase" style={{ letterSpacing: '.14em' }}>{item.title}</Text>
                  {item.price ? (
                    <Group gap={6} align="flex-end">
                      <Text fz={{ base: 42, sm: 48 }} lh={1} fw={600} ff="'Playfair Display', Georgia, serif">${item.price}</Text>
                      <Text className="promo-muted" size="xs" mb={8}>MXN</Text>
                    </Group>
                  ) : null}
                  {includes.length ? (
                    <Stack gap={8} mt={4}>
                      {includes.map((line) => (
                        <Group key={line} gap={10} wrap="nowrap" align="flex-start">
                          <Box className="promo-dot" w={7} h={7} mt={6} style={{ borderRadius: '50%', flex: 'none' }} />
                          <Text className="promo-copy" size="sm" lh={1.45}>{line}</Text>
                        </Group>
                      ))}
                    </Stack>
                  ) : (
                    <Text className="promo-copy" size="sm" lh={1.6}>{item.description}</Text>
                  )}
                  {item.until && <Text className="promo-muted" size="xs">Válida hasta {when(item.until)}</Text>}
                  <Button className="promo-action" component={Link} to="/contacto" mt="auto" fullWidth size="md" onClick={() => setSelectedId(item.id)}>Seleccionar promoción</Button>
                </Stack>
              </Box>
            )
          })}
        </SimpleGrid>

        <Group justify="space-between" align="center" mt={36} gap="md">
          <Text c="#817774" size="sm">Precios en pesos. La reserva se confirma por teléfono o con un mensaje.</Text>
          <Button component="a" href={phoneHref} variant="light" color="rose">Llamar para reservar</Button>
        </Group>
      </Container>
    </Box>
  )
}
