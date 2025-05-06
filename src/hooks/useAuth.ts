"use client";
import { useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import useLocalStorage from './useLocalStorage';
import type { User } from '@/lib/types';

export function useAuth() {
  const [user, setUser] = useLocalStorage<User | null>('securenote-user', null);
  const router = useRouter();
  const pathname = usePathname();

  const login = useCallback((username: string) => {
    setUser({ username });
    router.push('/notes');
  }, [setUser, router]);

  const logout = useCallback(() => {
    setUser(null);
    // Consider how to handle notes for the logged-out user.
    // For this version, notes are filtered by userId in useNotes.
    router.push('/login');
  }, [setUser, router]);

  const checkAuthProtection = useCallback(() => {
    const isAuthPage = pathname === '/login';
    if (!user && !isAuthPage) {
      router.replace('/login');
    } else if (user && isAuthPage) {
      router.replace('/notes');
    }
  }, [user, router, pathname]);
  
  useEffect(() => {
    checkAuthProtection();
  }, [user, pathname, checkAuthProtection]);

  return { user, login, logout, loading: user === undefined }; // loading state could be more refined
}
