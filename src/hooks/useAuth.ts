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
    // The checkAuthProtection depends on `user` which comes from useLocalStorage.
    // useLocalStorage initializes with `initialValue` and then updates in an effect.
    // We need to ensure `user` has its definite value from localStorage before redirecting.
    // The `user === undefined` check in the return helps, but for redirection,
    // it's crucial that `user` is resolved.
    // If `user` is `null` (explicitly set, meaning no user or logged out) or an object (user logged in),
    // then `checkAuthProtection` can run.
    // If `user` is `undefined` (initial state of useLocalStorage before effect runs),
    // we should wait. The `loading` prop handles this for UI, but for redirects:
    if (user !== undefined) { // Only run protection if user state is resolved from localStorage
      checkAuthProtection();
    }
  }, [user, pathname, checkAuthProtection, router]); // Added router to dependencies as it's used in checkAuthProtection

  // `user === undefined` means useLocalStorage hasn't yet run its effect to load the value.
  // `user === null` means localStorage has been read and no user is stored, or user logged out.
  // `user === User Object` means user is logged in.
  return { user, login, logout, loading: user === undefined }; 
}
