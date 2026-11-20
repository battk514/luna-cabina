import { Link } from 'react-router-dom'
import { Carousel } from '@mantine/carousel'
import { Box, Button, Container, Group, SimpleGrid, Stack, Text, Title } from '@mantine/core'
import { fallbackServices, phoneHref, slides } from '../data'
import { media } from '../api'
import { CabinMap } from '../components/CabinMap'

const highlights = fallbackServices.slice(0, 3)

export function Home() {
  return (
    <>
      <Carousel withIndicators height="78vh" emblaOptions={{ loop: true }} styles={{ indicator: { background: '#fff' } }}>
        {slides.map((slide) => (
          <Carousel.Slide key={slide.title}>
            <Box h="78vh" style={{ background: `linear-gradient(90deg, rgba(42,30,28,.55), rgba(42,30,28,.12)), url('${media(slide.image)}') center/cover` }}>
              <Container size="lg" h="100%" style={{ display: 'flex', alignItems: 'center' }}>
                <Stack gap="md" maw={560}>
                  <Text c="#f6d5d8" fw={700} tt="uppercase" style={{ letterSpacing: '.16em' }} size="xs">{slide.kicker}</Text>
                  <Title c="white" fz={{ base: 42, sm: 64 }} lh={1.05}>{slide.title}</Title>
                  <Button component={Link} to="/contacto" color="rose" size="md" w="fit-content">Contáctanos</Button>
                </Stack>
              </Container>
            </Box>
          </Carousel.Slide>
        ))}
      </Carousel>

      <Container size="lg" py={{ base: 48, sm: 72 }}>
        <Group justify="space-between" align="flex-end" mb={28}>
          <div>
            <Text c="#b86f78" fw={700} size="xs" tt="uppercase" style={{ letterSpacing: '.14em' }}>Servicios</Text>
            <Title order={2} fz={{ base: 32, sm: 40 }}>Un momento para ti</Title>
          </div>
          <Button component={Link} to="/servicios" variant="subtle" color="rose">Ver todos</Button>
        </Group>
        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="xl">
          {highlights.map((service) => (
            <Stack key={service.id} align="center" ta="center" gap="sm">
              <Box w={148} h={148} style={{ borderRadius: '50%', overflow: 'hidden', border: '8px solid #f6e8e9' }}>
                <img src={media(service.imagen)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </Box>
              <Title order={3} fz={22}>{service.nombre}</Title>
              <Text c="#716763" size="sm" lh={1.6}>{service.descripcion}</Text>
            </Stack>
          ))}
        </SimpleGrid>
      </Container>

      <Box bg="white" py={{ base: 48, sm: 72 }}>
        <Container size="lg">
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing={40}>
            <Stack gap="sm">
              <Text c="#b86f78" fw={700} size="xs" tt="uppercase" style={{ letterSpacing: '.14em' }}>Acerca de nosotros</Text>
              <Title order={2} fz={{ base: 32, sm: 40 }}>Cuidado que se siente personal</Title>
              <Text c="#5c514e" lh={1.7}>En Luna nos dedicamos a proporcionar servicios de masajes y depilación de la más alta calidad. Nuestro equipo está comprometido con el cuidado integral de cada persona y con tratamientos que se adaptan a lo que necesitas.</Text>
              <Title order={3} fz={22} mt="sm">Nuestra misión</Title>
              <Text c="#5c514e" lh={1.7}>Promover el bienestar físico y emocional a través de servicios de excelencia, en un ambiente relajante y con resultados que se notan.</Text>
              <Title order={3} fz={22}>Nuestra visión</Title>
              <Text c="#5c514e" lh={1.7}>Ser el centro de referencia en masajes y depilación de la región, por la calidad de la atención y el cuidado de cada visita.</Text>
            </Stack>
            <Box style={{ borderRadius: 18, overflow: 'hidden', minHeight: 360 }}>
              <img src={media('/images/d4c28c76c2682ab9fc8fbbe003f77a60.jpg')} alt="Cabina Luna" style={{ width: '100%', height: '100%', objectFit: 'cover', minHeight: 360 }} />
            </Box>
          </SimpleGrid>
        </Container>
      </Box>

      <Container size="lg" py={{ base: 48, sm: 72 }}>
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xl">
          <Stack>
            <Title order={2}>Aquí es donde nos puedes encontrar</Title>
            <Text c="#716763">Luna cabina de depilación. Llama o escríbenos para reservar tu lugar.</Text>
            <Group>
              <Button component="a" href={phoneHref} color="rose" w="fit-content">Llamar a Luna</Button>
              <Button component={Link} to="/contacto" variant="light" color="rose">Escribir a la cabina</Button>
            </Group>
          </Stack>
          <CabinMap />
        </SimpleGrid>
      </Container>
    </>
  )
}
