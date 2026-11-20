import { Box, Stack, Text } from '@mantine/core'
import { media } from '../api'

function dateParts(value) {
  const [year, month, day] = String(value || '').slice(0, 10).split('-').map(Number)
  if (!year || !month || !day) return { day: '—', month: '' }
  const date = new Date(Date.UTC(year, month - 1, day))
  const label = new Intl.DateTimeFormat('es-MX', { month: 'short', timeZone: 'UTC' }).format(date).replace('.', '')
  return { day: String(day), month: label }
}

export function OccasionCard({ item, action }) {
  const { day, month } = dateParts(item.date)
  return (
    <Box className="promo-card" h="100%" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRadius: 20 }}>
      <Box h={220} pos="relative" style={{ background: `#f3ebe6 url('${media(item.image)}') center/cover` }}>
        <Box className="occasion-date">
          <Text fw={700} fz={22} lh={1}>{day}</Text>
          <Text size="xs" fw={700} tt="uppercase" style={{ letterSpacing: '.08em' }}>{month}</Text>
        </Box>
      </Box>
      <Stack p={{ base: 'lg', sm: 24 }} gap="sm" style={{ flex: 1 }}>
        <Text className="promo-kicker" fw={700} size="sm" tt="uppercase" style={{ letterSpacing: '.14em' }}>{item.title}</Text>
        <Text className="promo-copy" size="sm" lh={1.6} style={{ flex: 1 }}>{item.description}</Text>
        {action}
      </Stack>
    </Box>
  )
}
