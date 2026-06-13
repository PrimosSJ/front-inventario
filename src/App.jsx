import { RouterProvider } from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/auth/ProtectedRoute';

import AlertasDevoluciones from './components/shared/AlertasDevoluciones';

import { router } from './routes';

/**
 * Root Application Component.
 * Initializes global providers and the main routing mechanism.
 */
export default function App() {
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