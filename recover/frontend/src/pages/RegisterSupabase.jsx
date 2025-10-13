import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import { signUp } from '../services/supabaseAuth';

export default function RegisterSupabase() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await signUp(email, password);
    if (error) {
      setError(error.message);
    } else {
      navigate('/login');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-light p-4">
      <Card className="max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4 text-primary">Registrar Usuário</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="Email" type="email" required value={email} onChange={e => setEmail(e.target.value)} />
          <Input label="Senha" type="password" required value={password} onChange={e => setPassword(e.target.value)} />
          <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Registrando...' : 'Registrar'}</Button>
        </form>
        {error && <div className="mt-2 text-red-600 text-sm text-center">{error}</div>}
      </Card>
    </div>
  );
}
