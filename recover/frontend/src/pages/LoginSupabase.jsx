import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import { signIn } from '../services/supabaseAuth';

export default function LoginSupabase() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { data, error } = await signIn(email, password);
    if (error) {
      setError(error.message);
    } else if (data?.session) {
      navigate('/dashboard');
    } else {
      setError('Login falhou. Verifique suas credenciais.');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-neutral-light flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <h2 className="text-2xl font-heading font-bold text-primary mb-4">Entrar</h2>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <Input label="Email" type="email" required value={email} onChange={e => setEmail(e.target.value)} />
          <Input label="Senha" type="password" required value={password} onChange={e => setPassword(e.target.value)} />
          <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Entrando...' : 'Login'}</Button>
        </form>
        {error && <div className="mt-2 text-red-600 text-sm text-center">{error}</div>}
      </Card>
    </div>
  );
}
