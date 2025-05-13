import { useEffect, useCallback, createContext, useContext, useState, ReactNode } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import useLocalStorage from './useLocalStorage';
import type { User } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  login: (username: string) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useLocalStorage<User | null>('securenote-user', null);
  const [loading, setLoading] = useState(true); // For initial load from local storage
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // This effect ensures that `user` is read from localStorage before `loading` is set to false.
    // `useLocalStorage` itself initializes `user` and then updates it.
    // We set loading to false once `user` has its value from localStorage (or initialValue if not found).
    // The `user === undefined` check in useLocalStorage's initial state is now managed here explicitly.
    const storedUser = localStorage.getItem('securenote-user');
    if (storedUser) {
        setUser(JSON.parse(storedUser));
    } else {
        setUser(null);
    }
    setLoading(false);
  }, [setUser]);


  const login = useCallback((username: string) => {
    setUser({ username });
    navigate('/notes', { replace: true });
  }, [setUser, navigate]);

  const logout = useCallback(() => {
    setUser(null);
    navigate('/login', { replace: true });
  }, [setUser, navigate]);

  // This effect handles route protection after user state is resolved
  useEffect(() => {
    if (!loading) { // Only run protection if initial user load is complete
      const isAuthPage = location.pathname === '/login';
      const isHomePage = location.pathname === '/';

      if (user && (isAuthPage || isHomePage)) {
        navigate('/notes', { replace: true });
      } else if (!user && !isAuthPage && !isHomePage) {
        navigate('/login', { replace: true });
      }
    }
  }, [user, loading, location.pathname, navigate]);


  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
