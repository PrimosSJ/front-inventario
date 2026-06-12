import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';

import { AuthProvider } from './components/auth/authContext';
import ProtectedRoute from './components/auth/ProtectedRoute';

import Inventario from './components/Inventario';
import Prestamos from './components/Prestamos';
import ItemView from './components/inventario/ItemView';
import GetAllByRut from './components/prestamos/GetAllByRut';
import AlertasDevoluciones from './components/AlertasDevoluciones';
import Header from './components/shared/Header';

/**
 * Shared layout component
 */
const MainLayout = () => {
  return (
    <>
      <Header />
      <Outlet />
    </>
  );
};

/**
 * Data Router configuration
 */
const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Prestamos />
      },
      {
        path: 'inventario',
        element: <Inventario />
      },
      {
        path: 'inventario/:id',
        element: <ItemView />
      },
      {
        path: 'historial_rut',
        element: <GetAllByRut />
      }
    ]
  }
]);

function App() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <AlertasDevoluciones />
        <RouterProvider router={router} />
      </ProtectedRoute>
    </AuthProvider>
  );
}

export default App;