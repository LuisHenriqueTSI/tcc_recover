import { createContext, useContext, useState, useEffect } from 'react';
import { getUser as getUserProfile } from '../services/user';
import { signOut } from '../services/supabaseAuth';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('recover_token'));
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    async function load() {
      setLoading(true);
      const t = token;
      console.debug('[Auth] useEffect token:', t);
      if (!t) {
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      // Retry loop: try a few times before giving up (handles transient failures)
      const maxAttempts = 3;
      let attempt = 0;
      let lastError = null;
      for (; attempt < maxAttempts; attempt++) {
        try {
          const u = await getUserProfile(t);
          console.debug('[Auth] loaded user:', u, 'attempt:', attempt + 1);
          setUser(u);
          if (u && (u.email === 'admin@email.com' || u.role === 'admin')) {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
          lastError = null;
          break;
        } catch (e) {
          lastError = e;
          console.debug('[Auth] load user attempt failed', attempt + 1, e);
          // backoff
          await new Promise(res => setTimeout(res, 200 * (attempt + 1)));
        }
      }
      if (lastError) {
        console.debug('[Auth] failed to load user after attempts', lastError);
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    }
    load();
  }, [token]);

  const login = async () => {
    const t = localStorage.getItem('recover_token');
    console.debug('[Auth] login, new token:', t);
    setToken(t);
  };

  const logout = async () => {
    // Remove token locally first so UI updates immediately
    localStorage.removeItem('recover_token');
    setToken(null);
    setUser(null);
    setIsAdmin(false);
    console.debug('[Auth] logout performed, token removed and user cleared');
    // Sign out from supabase in background (don't block UI)
    try {
      await signOut();
    } catch (e) {
      console.debug('[Auth] signOut failed', e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
