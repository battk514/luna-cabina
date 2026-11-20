export const phone = '222 519 1501'
export const phoneHref = 'tel:+522225191501'
export const defaultHours = [
  { dia: 1, nombre: 'Lunes', abre: '09:00', cierra: '19:00', cerrado: false },
  { dia: 2, nombre: 'Martes', abre: '09:00', cierra: '19:00', cerrado: false },
  { dia: 3, nombre: 'Miércoles', abre: '09:00', cierra: '19:00', cerrado: false },
  { dia: 4, nombre: 'Jueves', abre: '09:00', cierra: '19:00', cerrado: false },
  { dia: 5, nombre: 'Viernes', abre: '09:00', cierra: '19:00', cerrado: false },
  { dia: 6, nombre: 'Sábado', abre: '10:00', cierra: '15:00', cerrado: false },
  { dia: 7, nombre: 'Domingo', abre: '10:00', cierra: '15:00', cerrado: true },
]

export function hourLabel(row) {
  if (row.cerrado) return 'Cerrado'
  const clock = (value) => {
    const [hour, minute] = String(value || '00:00').slice(0, 5).split(':')
    return `${Number(hour)}:${minute}`
  }
  return `${clock(row.abre)} a ${clock(row.cierra)}`
}

export const slides = [
  { image: '/images/fondo1.jpg', kicker: 'Promociones', title: 'Consiéntete, es tu momento.' },
  { image: '/images/d25aca616fcc9f85683310accc56c914.jpg', kicker: 'Depilación', title: 'Luce una piel suave y libre de vello.' },
  { image: '/images/c821f03b1ec555c964b020fcc4625b81.jpg', kicker: 'Masajes', title: 'Relájate, desconecta y recarga.' },
]

export const fallbackServices = [
  { id: 'bikini', nombre: 'Depilación bikini', descripcion: 'Depilación bikini suave y precisa, ideal para lucir perfecta en la playa o piscina.', detalles: ['Técnica suave para minimizar la irritación'], categoria: 'depilacion', precio: 0, duracionMin: 30, imagen: '/images/1 (2).png' },
  { id: 'ceja', nombre: 'Depilación de ceja', descripcion: 'Realzamos tu mirada con un diseño de cejas profesional.', detalles: ['Diseño adaptado a tus facciones'], categoria: 'depilacion', precio: 0, duracionMin: 20, imagen: '/images/2 (2).png' },
  { id: 'bigote', nombre: 'Depilación de bigote', descripcion: 'Eliminamos el vello facial no deseado de manera rápida y efectiva.', detalles: ['Respeta el contorno labial'], categoria: 'depilacion', precio: 0, duracionMin: 15, imagen: '/images/3 (2).png' },
  { id: 'relajante', nombre: 'Masaje relajante', descripcion: 'Experiencia de relajación profunda que alivia el estrés y la tensión muscular.', detalles: ['Reduce el estrés y la ansiedad', 'Mejora la calidad del sueño', 'Alivia dolores musculares'], categoria: 'masaje', precio: 0, duracionMin: 60, imagen: '/images/masaje-relajante.jpeg' },
  { id: 'terapeutico', nombre: 'Masaje terapéutico', descripcion: 'Tratamiento especializado para aliviar dolores específicos y mejorar la movilidad.', detalles: ['Trata molestias musculares', 'Mejora la circulación', 'Aumenta la flexibilidad'], categoria: 'masaje', precio: 0, duracionMin: 60, imagen: '/images/masaje-terapeutico.jpg' },
  { id: 'facial', nombre: 'Masaje facial', descripcion: 'Tratamiento rejuvenecedor que revitaliza la piel del rostro.', detalles: ['Reduce líneas de expresión', 'Mejora la circulación facial', 'Efecto lifting natural'], categoria: 'facial', precio: 0, duracionMin: 45, imagen: '/images/masaje-facial.jpg' },
  { id: 'cera', nombre: 'Depilación con cera', descripcion: 'Elimina el vello no deseado de manera efectiva y duradera.', detalles: ['Resultados duraderos', 'Adecuado para diversas zonas', 'Piel suave'], categoria: 'depilacion', precio: 0, duracionMin: 40, imagen: '/images/depilación-cera.png' },
  { id: 'laser', nombre: 'Depilación láser', descripcion: 'Tecnología avanzada para una eliminación del vello a largo plazo.', detalles: ['Tratamiento rápido y preciso', 'Adecuado para distintos tipos de piel'], categoria: 'depilacion', precio: 0, duracionMin: 40, imagen: '/images/depilacion-laser.jpg' },
  { id: 'limpieza', nombre: 'Limpieza facial profunda', descripcion: 'Tratamiento completo para purificar y renovar la piel del rostro.', detalles: ['Elimina impurezas', 'Hidratación profunda', 'Incluye masaje relajante'], categoria: 'facial', precio: 0, duracionMin: 60, imagen: '/images/limpieza-facial-profunda.jpg' },
]

export const fallbackOccasions = [
  { id: 'ocasion-muertos', title: 'Día de Muertos', description: 'Una fecha para consentirte y compartir un momento de cuidado en la cabina.', date: '2027-11-02', image: '/images/d25aca616fcc9f85683310accc56c914.jpg' },
  { id: 'ocasion-buen-fin', title: 'Buen Fin', description: 'Aprovecha estos días para agendar depilación o masaje con un espacio especial.', date: '2026-11-20', image: '/images/piernas1.png' },
  { id: 'ocasion-navidad', title: 'Navidad', description: 'Regálate un rato de calma antes de las fiestas. Reserva tu cita de temporada.', date: '2026-12-24', image: '/images/masaje-relajante.jpeg' },
  { id: 'ocasion-hot-sale', title: 'Hot Sale', description: 'La temporada para cuidar tu piel y apartar tu lugar en la cabina.', date: '2027-05-31', image: '/images/limpieza-facial-profunda.jpg' },
]

export const fallbackPromotions = [
  { id: 'promo-basico', title: 'Básico', description: 'Bikini a elegir + ceja + bigote + axilas.', includes: ['Bikini a elegir', 'Ceja', 'Bigote', 'Axilas'], price: 410, image: '/images/1 (2).png' },
  { id: 'promo-normal', title: 'Normal', description: 'Piernas completas + bikini mohicano + axilas + bigote o ceja.', includes: ['Piernas completas', 'Bikini mohicano', 'Axilas', 'Bigote o ceja'], price: 460, image: '/images/piernas1.png' },
  { id: 'promo-premium', title: 'Premium', description: 'Piernas completas + bikini brasilian + axilas + bigote o ceja.', includes: ['Piernas completas', 'Bikini brasilian', 'Axilas', 'Bigote o ceja'], price: 480, image: '/images/depilación-cera.png', featured: true },
]
