import { BrowserRouter, Route, Routes } from 'react-router-dom'

import { AuthProvider } from './components/auth/authContext'
import ProtectedRoute from './components/auth/ProtectedRoute'

import Inventario from './components/Inventario'
import Prestamos from './components/Prestamos'
import ItemView from './components/inventario/ItemView'
import GetAllByRut from './components/prestamos/GetAllByRut'
import AlertasDevoluciones from './components/AlertasDevoluciones'
import Header from './components/shared/Header'

function App() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <AlertasDevoluciones />

        <BrowserRouter>
          <Header />
          <Routes>
            <Route path='/inventario' element={<Inventario />} />
            <Route path='/inventario/:id' element={<ItemView />} />
            <Route path='/historial_rut' element={<GetAllByRut />} />
            <Route path='/' element={<Prestamos />} />
          </Routes>

        </BrowserRouter>
      </ProtectedRoute>
    </AuthProvider>
  )
}

export default App
