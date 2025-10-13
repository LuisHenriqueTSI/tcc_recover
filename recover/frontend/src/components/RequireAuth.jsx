import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getUser } from '../services/supabaseAuth';

export default function RequireAuth({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUser().then(u => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  if (loading) return null;
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
