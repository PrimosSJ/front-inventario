import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AlertasDevoluciones from './components/shared/AlertasDevoluciones';
import { router } from './routes';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Data stays fresh for 5 minutes before background refetch
      refetchOnWindowFocus: false, // Prevent refetching when switching browser tabs
    },
  },
});

/**
 * Root Application Component.
 */
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SocketProvider>
          <ProtectedRoute>
            <AlertasDevoluciones />
            <RouterProvider router={router} />
          </ProtectedRoute>
        </SocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}