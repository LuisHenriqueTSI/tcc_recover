import { createContext, useContext, useState, useEffect } from 'react';
import { getUser as getUserProfile } from '../services/user';
import { signOut } from '../services/supabaseAuth';
import { supabase } from '../supabaseClient';

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

      // 1) Try backend first (preferred)
      const maxAttempts = 3;
      let attempt = 0;
      let lastError = null;
      for (; attempt < maxAttempts; attempt++) {
        try {
          const u = await getUserProfile(t);
          console.debug('[Auth] loaded user from backend:', u, 'attempt:', attempt + 1);
          setUser(u);
          setIsAdmin(Boolean(u && (u.email === 'admin@email.com' || u.role === 'admin')));
          lastError = null;
          break;
        } catch (e) {
          lastError = e;
          console.debug('[Auth] backend /auth/me attempt failed', attempt + 1, e);
          // backoff
          await new Promise(res => setTimeout(res, 200 * (attempt + 1)));
        }
      }

      // 2) If backend failed, try Supabase client as a fallback so UI can show user immediately
      if (lastError) {
        try {
          console.debug('[Auth] trying supabase client fallback');
          const { data: sessionData } = await supabase.auth.getSession();
          const session = sessionData?.session;
          if (session && session.access_token) {
            const { data: userData } = await supabase.auth.getUser();
            const u = userData?.user || null;
            console.debug('[Auth] loaded user from supabase client:', u);
            if (u) {
              // ensure token is persisted locally
              localStorage.setItem('recover_token', session.access_token);
              setUser(u);
              setIsAdmin(Boolean(u && (u.email === 'admin@email.com' || u.role === 'admin')));
              lastError = null;
            }
          }
        } catch (e) {
          console.debug('[Auth] supabase client fallback failed', e);
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

  // Keep supabase auth state in sync (handles cases where supabase SDK updates session)
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      console.debug('[Auth] onAuthStateChange', event, session);
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        const access_token = session?.access_token;
        if (access_token) {
          localStorage.setItem('recover_token', access_token);
          setToken(access_token);
        }
      }
      if (event === 'SIGNED_OUT') {
        localStorage.removeItem('recover_token');
        setToken(null);
        setUser(null);
        setIsAdmin(false);
      }
    });
    return () => {
      listener?.subscription?.unsubscribe?.();
    };
  }, []);

  const login = async () => {
    // Prefer reading the session from Supabase SDK (ensures client persistence is used)
    try {
      const { data } = await supabase.auth.getSession();
      const session = data?.session;
      const access_token = session?.access_token || localStorage.getItem('recover_token');
      console.debug('[Auth] login, new token (from supabase):', access_token);
      if (access_token) {
        localStorage.setItem('recover_token', access_token);
        setToken(access_token);
      }
    } catch (e) {
      // fallback to localStorage
      const t = localStorage.getItem('recover_token');
      console.debug('[Auth] login fallback, token:', t);
      setToken(t);
    }
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
