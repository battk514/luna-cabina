import { useEffect, useState } from 'react'
import { Badge, Card, Container, Group, SimpleGrid, Stack, Text, Title } from '@mantine/core'
import { api, media, money } from '../api'
import { fallbackServices } from '../data'

const labels = { depilacion: 'Depilación', masaje: 'Masaje', facial: 'Facial' }

export function Servicios() {
  const [services, setServices] = useState(fallbackServices)

  useEffect(() => {
    api('/api/content.php')
      .then((data) => { if (data.services?.length) setServices(data.services) })
      .catch(() => {})
  }, [])

  return (
    <Container size="lg" py={56}>
      <Stack gap={6} mb={32} maw={640}>
        <Text c="#b86f78" fw={700} size="xs" tt="uppercase" style={{ letterSpacing: '.14em' }}>La cabina</Text>
        <Title fz={{ base: 34, sm: 46 }}>Nuestros servicios</Title>
        <Text c="#716763">Depilación, masajes y cuidado facial. Cada sesión se adapta a lo que necesitas ese día.</Text>
      </Stack>
      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
        {services.map((service) => (
          <Card key={service.id} padding={0} radius="lg" withBorder bg="white">
            <div style={{ height: 190, background: `#f3ebe6 url('${media(service.imagen)}') center/cover` }} />
            <Stack p="lg" gap="xs">
              <Group justify="space-between">
                <Badge variant="light" color="rose">{labels[service.categoria] || service.categoria}</Badge>
                {Number(service.precio) > 0 && <Text size="sm" c="#97545e" fw={700}>{money(service.precio)}</Text>}
              </Group>
              <Title order={3} fz={22}>{service.nombre}</Title>
              <Text size="sm" c="#716763" lh={1.6}>{service.descripcion}</Text>
              {!!service.detalles?.length && (
                <Stack gap={4} mt={4}>
                  {service.detalles.map((item) => <Text key={item} size="sm" c="#5c514e">· {item}</Text>)}
                </Stack>
              )}
              <Text size="xs" c="#9a8f8a">{service.duracionMin} min</Text>
            </Stack>
          </Card>
        ))}
      </SimpleGrid>
    </Container>
  )
}
