import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import { signIn } from '../services/supabaseAuth';
import { useAuth } from '../contexts/AuthContext';

export default function LoginSupabase() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, user, loading: authLoading } = useAuth();
  

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { data, error } = await signIn(email, password);
    console.debug('[LoginSupabase] signIn result:', { data, error });
    if (error) {
      setError(error.message);
    } else if (data?.session) {
      // Salva o token e estabelece o usuário no contexto imediatamente
      const token = data.session.access_token;
      const supabaseUser = data.user || null;
      console.debug('[LoginSupabase] token and supabaseUser:', { token, supabaseUser });
      try {
        await login(token, supabaseUser);
        navigate('/dashboard');
      } catch (e) {
        console.debug('[Login] login helper failed', e);
        setError('Falha ao autenticar. Tente novamente.');
      }
    } else {
      setError('Login falhou. Verifique suas credenciais.');
    }
    setLoading(false);
  }

  // Se já está logado, redireciona para dashboard
  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-neutral-light flex items-center justify-center p-4">
      <Card className="max-w-md w-full animate-fade-in">
        <h2 className="text-2xl font-heading font-bold text-primary mb-4">Entrar</h2>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <Input label="Email" type="email" required value={email} onChange={e => setEmail(e.target.value)} />
          <Input label="Senha" type="password" required value={password} onChange={e => setPassword(e.target.value)} />
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></span>
                Entrando...
              </span>
            ) : 'Login'}
          </Button>
        </form>
        {error && (
          <div className="mt-2 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-sm text-center" role="alert">
            {error}
          </div>
        )}
      </Card>
    </div>
  );
}
