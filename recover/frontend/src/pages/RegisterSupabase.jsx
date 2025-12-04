import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import CancelButton from '../components/CancelButton';
import { signUp, signIn } from '../services/supabaseAuth';

export default function RegisterSupabase() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    if (!name || name.trim() === '') {
      setError('Por favor, informe seu nome');
      setLoading(false);
      return;
    }
    const res = await signUp(email, password, name);
    if (res?.error) {
      setError(res.error.message || 'Erro ao registrar');
      setLoading(false);
      return;
    }

    // Try to sign in immediately to obtain token and sync profile via backend
    try {
      const signin = await signIn(email, password);
      const token = signin?.data?.session?.access_token || signin?.data?.access_token || signin?.access_token;
      if (token) {
        await fetch('http://localhost:8000/auth/sync-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ name })
        });
      }
    } catch (e) {
      // ignore sync errors, user can login later
      console.debug('sync-profile failed', e);
    }

    navigate('/login');
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-light p-4">
      <Card className="max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4 text-primary">Registrar Usuário</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="Nome" type="text" required value={name} onChange={e => setName(e.target.value)} />
          <Input label="Email" type="email" required value={email} onChange={e => setEmail(e.target.value)} />
          <Input label="Senha" type="password" required value={password} onChange={e => setPassword(e.target.value)} />
          <div className="flex gap-2">
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Registrando...' : 'Registrar'}</Button>
            <CancelButton />
          </div>
        </form>
        {error && <div className="mt-2 text-red-600 text-sm text-center">{error}</div>}
      </Card>
    </div>
  );
}
