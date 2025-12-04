import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import CancelButton from '../components/CancelButton';
import { useAuth } from '../contexts/AuthContext';
import { getUser as getUserProfile } from '../services/user';

export default function EditProfile() {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    async function load() {
      if (user) {
        setName(user.name || '');
        setEmail(user.email || '');
        return;
      }
      const token = localStorage.getItem('recover_token');
      if (!token) return;
      try {
        const u = await getUserProfile(token);
        setName(u.name || '');
        setEmail(u.email || '');
      } catch (e) {
        console.debug('Failed to load profile', e);
      }
    }
    load();
  }, [user]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    const token = localStorage.getItem('recover_token');
    if (!token) {
      setError('Usuário não autenticado');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('http://localhost:8000/auth/sync-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || 'Erro ao atualizar perfil');
      }
      const body = await res.json().catch(() => ({}));
      // Update AuthContext quickly by passing incomingUser to login
      const updatedUser = { ...(user || {}), name };
      login(null, updatedUser);
      setSuccess('Perfil atualizado com sucesso');
      // navigate back to profile page after brief pause
      setTimeout(() => navigate('/profile'), 700);
    } catch (err) {
      setError(err.message || 'Erro ao atualizar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-light flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <h2 className="text-2xl font-heading font-bold text-primary mb-4">Editar Perfil</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="Nome" required value={name} onChange={e => setName(e.target.value)} />
          <Input label="Email" type="email" value={email} disabled />
          <div className="flex gap-2">
            <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</Button>
            <CancelButton to="/profile" />
          </div>
        </form>
        {error && <div className="mt-2 text-red-600 text-sm text-center">{error}</div>}
        {success && <div className="mt-2 text-green-600 text-sm text-center">{success}</div>}
      </Card>
    </div>
  );
}
