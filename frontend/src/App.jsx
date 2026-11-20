import { Route, Routes } from 'react-router-dom'
import { SiteShell } from './components/SiteShell'
import { Home } from './pages/Home'
import { Servicios } from './pages/Servicios'
import { Promociones } from './pages/Promociones'
import { Ocasiones } from './pages/Ocasiones'
import { Contacto } from './pages/Contacto'
import { MiCita } from './pages/MiCita'
import { AdminGate } from './admin/AdminGate'
import { AdminShell } from './admin/AdminShell'
import { Dashboard } from './admin/Dashboard'
import { Clientes } from './admin/Clientes'
import { Citas } from './admin/Citas'
import { ServiciosAdmin } from './admin/ServiciosAdmin'
import { Publicaciones } from './admin/Publicaciones'
import { Mensajes } from './admin/Mensajes'
import { Horarios } from './admin/Horarios'

export default function App() {
  return (
    <Routes>
      <Route element={<SiteShell />}>
        <Route index element={<Home />} />
        <Route path="servicios" element={<Servicios />} />
        <Route path="promociones" element={<Promociones />} />
        <Route path="ocasiones" element={<Ocasiones />} />
        <Route path="contacto" element={<Contacto />} />
        <Route path="mi-cita" element={<MiCita />} />
      </Route>
      <Route path="admin" element={<AdminGate />}>
        <Route element={<AdminShell />}>
          <Route index element={<Dashboard />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="citas" element={<Citas />} />
          <Route path="servicios" element={<ServiciosAdmin />} />
          <Route path="promociones" element={<Publicaciones kind="promotions" title="Promociones" />} />
          <Route path="ocasiones" element={<Publicaciones kind="occasions" title="Ocasiones" />} />
          <Route path="mensajes" element={<Mensajes />} />
          <Route path="horarios" element={<Horarios />} />
        </Route>
      </Route>
    </Routes>
  )
}
