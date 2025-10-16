import { createContext, useContext, useState, useEffect } from 'react';
import { getUser as getUserProfile } from '../services/user';
import { signOut } from '../services/supabaseAuth';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('recover_token');
    if (!token) {
      setUser(null);
      setIsAdmin(false);
      return;
    }
    getUserProfile(token)
      .then(u => {
        setUser(u);
        if (u && (u.email === 'admin@email.com' || u.role === 'admin')) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      })
      .catch(() => {
        setUser(null);
        setIsAdmin(false);
      });
  }, []);

  const login = async () => {
    const token = localStorage.getItem('recover_token');
    if (!token) {
      setUser(null);
      setIsAdmin(false);
      return;
    }
    try {
      const u = await getUserProfile(token);
      setUser(u);
      if (u && (u.email === 'admin@email.com' || u.role === 'admin')) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    } catch {
      setUser(null);
      setIsAdmin(false);
    }
  };

  const logout = async () => {
    await signOut();
    setUser(null);
    setIsAdmin(false);
    localStorage.removeItem('recover_token');
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
