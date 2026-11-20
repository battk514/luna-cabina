import { api } from './api'

export const phoneStorageKey = 'luna-cabina.telefono'

export function rememberedPhone() {
  return localStorage.getItem(phoneStorageKey) || ''
}

export function rememberPhone(telefono) {
  localStorage.setItem(phoneStorageKey, telefono)
}

export function forgetPhone() {
  localStorage.removeItem(phoneStorageKey)
}

export function consultarCita(telefono) {
  return api('/api/mi-cita.php', { method: 'POST', body: JSON.stringify({ telefono }) })
}

export function urgentAlert(citas) {
  return [...(citas || [])].filter((item) => item.alerta).sort((a, b) => a.minutos - b.minutos)[0] || null
}

export function notifyAlerts(citas) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
  for (const cita of citas || []) {
    if (!cita.alerta) continue
    const key = `luna-aviso.${cita.id}.${cita.alerta.nivel}`
    if (localStorage.getItem(key)) continue
    localStorage.setItem(key, '1')
    try {
      new Notification('Luna Cabina', { body: cita.alerta.texto })
    } catch {
      localStorage.removeItem(key)
    }
  }
}

export function enableAlerts() {
  if (typeof Notification === 'undefined') return Promise.resolve('unsupported')
  return Notification.requestPermission()
}
