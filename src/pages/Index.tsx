import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export default function Index() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [isClearing, setIsClearing] = useState(true);

  useEffect(() => {
    // Force sign out on every app load and redirect to auth
    const clearSessionAndRedirect = async () => {
      try {
        await signOut();
      } catch (error) {
        console.error('Error signing out:', error);
      } finally {
        setIsClearing(false);
        navigate('/auth', { replace: true });
      }
    };

    clearSessionAndRedirect();
  }, [signOut, navigate]);

  if (isClearing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return null;
}
