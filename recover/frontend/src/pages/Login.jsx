
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import { login as loginService } from '../services/auth';


export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await loginService(email, password);
      localStorage.setItem('recover_token', data.access_token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
        <div className="mt-4 text-sm text-neutral-dark text-center">
          <a href="#" className="text-primary hover:underline">Esqueci minha senha</a>
        </div>
      </Card>
    </div>
  );
}
