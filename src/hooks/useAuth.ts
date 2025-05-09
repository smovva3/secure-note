
"use client";
import { useEffect, useCallback, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import useLocalStorage from './useLocalStorage';
import type { User } from '@/lib/types';

// Helper function to set/clear a cookie
function setSessionCookie(name: string, value: string | null, days?: number) {
  if (typeof document === 'undefined') return; // Ensure running on client

  let expires = "";
  if (value === null) { // For deleting the cookie
    // Set expiry to a past date
    expires = "; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  } else if (days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = "; expires=" + date.toUTCString();
  }
  
  const cookieValue = value === null ? '' : encodeURIComponent(value);
  document.cookie = name + "=" + cookieValue + expires + "; path=/";
}


export function useAuth() {
  const [user, setUserInLocalStorage] = useLocalStorage<User | null>('securenote-user', null);
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);


  useEffect(() => {
    // Initialize loading state based on whether user info has been retrieved from localStorage
    // useLocalStorage's initial read might be asynchronous or delayed until client-side mount.
    // We consider loading complete once 'user' is not undefined.
    if (user !== undefined) {
      setIsLoading(false);
    }
  }, [user]);


  const login = useCallback((username: string) => {
    const userData = { username };
    setUserInLocalStorage(userData); // Updates localStorage and local state via useLocalStorage
    // Set a session cookie for the middleware.
    setSessionCookie('securenote-user-session', JSON.stringify(userData), 1); // Cookie for 1 day
    router.push('/notes');
  }, [setUserInLocalStorage, router]);

  const logout = useCallback(() => {
    setUserInLocalStorage(null); // Clears localStorage and local state
    setSessionCookie('securenote-user-session', null); // Erase the session cookie
    router.push('/login');
  }, [setUserInLocalStorage, router]);

  const checkAuthProtection = useCallback(() => {
    if (isLoading) return; // Don't run auth checks until loading is complete

    const isAuthPage = pathname === '/login';
    // Client-side check still relies on 'user' state from useLocalStorage
    if (!user && !isAuthPage) {
      router.replace('/login');
    } else if (user && isAuthPage) {
      router.replace('/notes');
    }
  }, [user, router, pathname, isLoading]);
  
  useEffect(() => {
    // This effect will run when 'user' (from localStorage) changes, pathname changes, or loading state completes.
    // It ensures client-side redirection is in sync.
    checkAuthProtection();
  }, [user, pathname, checkAuthProtection, isLoading]);

  return { user, login, logout, loading: isLoading }; 
}

