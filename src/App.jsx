import { RouterProvider } from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AlertasDevoluciones from './components/AlertasDevoluciones';

import { router } from './router.config';

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