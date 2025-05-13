import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';

export default function HomePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isInitialCheckDone, setIsInitialCheckDone] = useState(false);

  useEffect(() => {
    if (!loading) {
      setIsInitialCheckDone(true);
      if (user) {
        navigate('/notes', { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
    }
  }, [user, loading, navigate]);

  if (!isInitialCheckDone) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-background p-4">
        <Skeleton className="h-12 w-1/2 mb-4" />
        <Skeleton className="h-8 w-1/3" />
      </div>
    );
  }
  
  return (
    <div className="flex h-screen items-center justify-center bg-background p-4">
      <p className="text-foreground">SecureNote</p>
    </div>
  );
}
