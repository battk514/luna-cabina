export async function api(path, options = {}) {
  const response = await fetch(path, {
    credentials: 'same-origin',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(data.error || 'No se pudo completar la operación.')
    error.status = response.status
    throw error
  }
  return data
}

export function media(path) {
  if (!path) return ''
  if (path.startsWith('data:') || path.startsWith('http')) return path
  return encodeURI(path)
}

export function money(value) {
  const amount = Number(value)
  if (!amount) return 'Por confirmar'
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(amount)
}

export function phoneDigits(value) {
  const digits = String(value || '').replace(/\D/g, '')
  if (digits.length === 10) return `52${digits}`
  return digits
}

export function telHref(value) {
  const digits = phoneDigits(value)
  return digits ? `tel:+${digits}` : ''
}

export function whatsappHref(value, text) {
  const digits = phoneDigits(value)
  if (!digits) return ''
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
}

export function when(value) {
  if (!value) return '—'
  const raw = String(value).replace(' ', 'T')
  const date = new Date(raw.length === 10 ? `${raw}T00:00:00` : raw)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: raw.length > 10 ? 'short' : undefined }).format(date)
}
