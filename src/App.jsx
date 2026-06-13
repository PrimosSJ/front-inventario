import { createBrowserRouter, RouterProvider, useLocation, useOutlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

import ProtectedRoute from './components/auth/ProtectedRoute';
import AgregarPrestamo from './components/prestamos/AgregarPrestamo';
import Inventario from './components/Inventario';
import Prestamos from './components/Prestamos';
import ItemView from './components/inventario/ItemView';
import GetAllByRut from './components/prestamos/GetAllByRut';
import AlertasDevoluciones from './components/AlertasDevoluciones';
import Header from './components/shared/Header';

const NewLoanPageWrapper = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="container mx-auto p-4 max-w-2xl mt-8">
      <div className="bg-base-100 p-6 rounded-box shadow-lg border border-base-content/10">
        <AgregarPrestamo
          initialProductId={id}
          onClose={() => navigate('/inventario')}
        />
      </div>
    </div>
  );
};

const PageTransitionProvider = () => {
  const location = useLocation();
  const currentOutlet = useOutlet();

  return (
    <AnimatePresence mode="wait">
      <motion.main
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="flex-1 w-full flex flex-col"
      >
        {currentOutlet}
      </motion.main>
    </AnimatePresence>
  );
};

/**
 * Shared layout component
 */
const MainLayout = () => {
  return (
    <>
      <Header />
      <PageTransitionProvider />
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
        path: 'new_prestamo/:id',
        element: <NewLoanPageWrapper />
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
      <SocketProvider>
        <ProtectedRoute>
          <AlertasDevoluciones />
          <RouterProvider router={router} />
        </ProtectedRoute>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;