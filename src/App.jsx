import { BrowserRouter, Route, Routes } from 'react-router-dom'

import './App.css'

import { AuthProvider } from './components/auth/authContext'
import ProtectedRoute from './components/auth/ProtectedRoute'

import Inventario from './components/Inventario'
import Prestamos from './components/Prestamos'
import ItemView from './components/inventario/ItemView'
import GetAllByRut from './components/prestamos/GetAllByRut'
import AgregarPrestamo from './components/prestamos/AgregarPrestamo'
import AgregarItem from './components/inventario/AgregarItem'
import NavBar from './components/NavBar'

function App() {
  return (
    <AuthProvider>
      <ProtectedRoute>
      <h1 className='text-3xl font-bold'>
        Plataforma Optimizada de Trazabilidad y Organización
      </h1>
      <hr />

      <BrowserRouter>

        <NavBar />

        <Routes>
          <Route path='/inventario' element={<Inventario />} />
          <Route path='/inventario/agregar' element={<AgregarItem />} />
          <Route path='/inventario/:id' element={<ItemView />} />
          <Route path='/historial_rut' element={<GetAllByRut />} />
          <Route path='/new_prestamo' element={<AgregarPrestamo />} />
          <Route path='/new_prestamo/:id' element={<AgregarPrestamo />} />
          <Route path='/' element={<Prestamos />} />
        </Routes>

      </BrowserRouter>
      </ProtectedRoute>
    </AuthProvider>
  )
}

export default App
