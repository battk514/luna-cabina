const MAP_SRC = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3770.0356970500084!2d-98.27937692429117!3d19.10608985102596!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x85cfc7acc062ecc3%3A0xffa87628d38df874!2sLuna%20cabina%20de%20depilacion!5e0!3m2!1ses-419!2smx!4v1795145046158!5m2!1ses-419!2smx'

export function CabinMap() {
  return (
    <iframe
      title="Mapa de Luna cabina de depilación"
      src={MAP_SRC}
      width="600"
      height="450"
      className="cabin-map"
      style={{ border: 0, borderRadius: 16, width: '100%', maxWidth: '100%', display: 'block' }}
      allowFullScreen
      loading="lazy"
      referrerPolicy="strict-origin-when-cross-origin"
    />
  )
}
