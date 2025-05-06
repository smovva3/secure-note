"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';

export default function HomePage() {
  const { user, loading } = useAuth(); // useAuth will handle redirection via its useEffect
  const router = useRouter();
  const [isInitialCheckDone, setIsInitialCheckDone] = useState(false);

  useEffect(() => {
    if (!loading) {
      setIsInitialCheckDone(true);
      if (user) {
        router.replace('/notes');
      } else {
        router.replace('/login');
      }
    }
  }, [user, loading, router]);

  if (!isInitialCheckDone) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-background p-4">
        <Skeleton className="h-12 w-1/2 mb-4" />
        <Skeleton className="h-8 w-1/3" />
      </div>
    );
  }
  
  // This content will ideally not be shown as redirection should occur.
  return (
    <div className="flex h-screen items-center justify-center bg-background p-4">
      <p className="text-foreground">SecureNote</p>
    </div>
  );
}
