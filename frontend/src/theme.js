import { createTheme } from '@mantine/core'

export const theme = createTheme({
  primaryColor: 'rose',
  primaryShade: 6,
  defaultRadius: 'md',
  fontFamily: "'DM Sans', Arial, sans-serif",
  headings: { fontFamily: "'Playfair Display', Georgia, serif", fontWeight: '500' },
  colors: {
    rose: ['#fff7f7', '#fdecee', '#f6d5d8', '#eeb8bd', '#e099a0', '#d07d86', '#b86f78', '#97545e', '#7d4550', '#663842'],
  },
  other: {
    ink: '#342c2b',
    muted: '#817774',
    cream: '#f7f2f0',
  },
})
