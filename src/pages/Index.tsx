import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export default function Index() {
  const navigate = useNavigate();
  const { user, loading, role } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        // Admin redirigé vers la page Utilisateurs, autres vers le Dashboard
        if (role === 'admin') {
          navigate('/users');
        } else {
          navigate('/dashboard');
        }
      } else {
        navigate('/auth');
      }
    }
  }, [user, loading, role, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  );
}
