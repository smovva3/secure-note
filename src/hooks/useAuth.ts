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
  // Ensure secure cookie attributes in production if HTTPS is used
  const secureAttribute = process.env.NODE_ENV === 'production' ? '; Secure; SameSite=Lax' : '; SameSite=Lax';
  document.cookie = name + "=" + cookieValue + expires + "; path=/" + secureAttribute;
}


export function useAuth() {
  const [user, setUserInLocalStorage] = useLocalStorage<User | null>('securenote-user', null);
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);


  useEffect(() => {
    // isLoading should be true until the user state has been definitively determined from localStorage.
    // useLocalStorage initializes with `initialValue` (null), then updates in an effect.
    // So, we wait for the first time `user` is set (either to null from empty LS, or a User object).
    // The `user !== undefined` check handles this, as `user` is initially `null`.
    // This effect will run once `user` gets its value from `useLocalStorage`'s internal `useEffect`.
    if (user !== undefined) { // This condition might make isLoading false too soon if initialValue of useLocalStorage is null
        setIsLoading(false);
    }
  }, [user]);


  const login = useCallback((username: string) => {
    const userData = { username };
    try {
      setUserInLocalStorage(userData); 
      setSessionCookie('securenote-user-session', JSON.stringify(userData), 1); 
    } catch (error) {
        // This catch block might not be strictly necessary for setUserInLocalStorage
        // if useLocalStorage no longer throws on setItem failure.
        // However, it's good for catching other potential errors during the login data setup.
        console.error("Error during login data setup:", error);
        // Optionally, inform the user that login data might not persist.
        // e.g., toast({ title: "Login Warning", description: "Could not save login permanently.", variant: "destructive" });
    }
    router.push('/notes');
  }, [setUserInLocalStorage, router]);

  const logout = useCallback(() => {
    try {
        setUserInLocalStorage(null); 
        setSessionCookie('securenote-user-session', null); 
    } catch (error) {
        console.error("Error during logout data cleanup:", error);
    }
    router.push('/login');
  }, [setUserInLocalStorage, router]);

  const checkAuthProtection = useCallback(() => {
    if (isLoading) return; 

    const isAuthPage = pathname === '/login';
    
    if (!user && !isAuthPage) {
      router.replace('/login');
    } else if (user && isAuthPage) {
      router.replace('/notes');
    }
  }, [user, router, pathname, isLoading]);
  
  useEffect(() => {
    checkAuthProtection();
  }, [user, pathname, isLoading, checkAuthProtection]); // Added isLoading and checkAuthProtection to dependency array

  return { user, login, logout, loading: isLoading }; 
}
