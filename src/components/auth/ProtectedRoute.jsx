import { useAuth } from './authContext';
import LoginForm from './LoginForm';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col gap-2 text-lg items-center justify-center">
        <span className="loading loading-bars loading-lg"></span>
        <span>Cargando...</span>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  return children;
};

export default ProtectedRoute;