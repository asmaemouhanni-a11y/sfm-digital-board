import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const SESSION_RESET_KEY = 'sfm_session_reset';

export default function Index() {
  const navigate = useNavigate();
  const { signOut, user, loading, role } = useAuth();
  const [isClearing, setIsClearing] = useState(true);

  useEffect(() => {
    const handleStartup = async () => {
      const hasBeenReset = sessionStorage.getItem(SESSION_RESET_KEY);

      // Only force logout once per browser session (tab opening)
      if (!hasBeenReset) {
        sessionStorage.setItem(SESSION_RESET_KEY, 'true');
        try {
          await signOut();
        } catch (error) {
          console.error('Error signing out:', error);
        }
        setIsClearing(false);
        navigate('/auth', { replace: true });
        return;
      }

      // After reset, handle normal navigation
      if (!loading) {
        setIsClearing(false);
        if (user) {
          if (role === 'admin') {
            navigate('/users', { replace: true });
          } else {
            navigate('/dashboard', { replace: true });
          }
        } else {
          navigate('/auth', { replace: true });
        }
      }
    };

    handleStartup();
  }, [signOut, navigate, user, loading, role]);

  if (isClearing || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return null;
}
