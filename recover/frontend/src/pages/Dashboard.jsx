
import { useEffect, useState } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import LogoutButton from '../components/LogoutButton';
import { getUser } from '../services/supabaseAuth';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getUser()
      .then(setUser)
      .catch(() => setError('Não foi possível carregar os dados do usuário'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10 flex flex-col items-center p-6">
      <Card className="max-w-2xl w-full mb-8 shadow-lg border border-primary/20">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-3xl font-heading font-bold text-primary drop-shadow">Meu Painel</h2>
          <LogoutButton />
        </div>
        {loading ? (
          <p className="text-neutral-dark">Carregando...</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : user ? (
          <div className="mb-6 flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white text-3xl font-bold mb-2 shadow">
              {user.email?.charAt(0).toUpperCase()}
            </div>
            <div className="text-xl font-bold text-neutral-dark">{user.name || user.email}</div>
            <div className="text-sm text-neutral-dark">{user.email}</div>
          </div>
        ) : null}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card className="bg-primary/10 border border-primary/20">
            <div className="text-lg font-bold text-primary mb-2">Itens Registrados</div>
            <div className="text-3xl font-heading text-primary">0</div>
          </Card>
          <Card className="bg-secondary/10 border border-secondary/20">
            <div className="text-lg font-bold text-secondary mb-2">Mensagens</div>
            <div className="text-3xl font-heading text-secondary">0</div>
          </Card>
        </div>
        <div className="flex gap-4 justify-center">
          <Button variant="primary">Registrar Item</Button>
          <Button variant="secondary">Ver Mensagens</Button>
        </div>
      </Card>
      <Card className="max-w-2xl w-full shadow border border-accent/20">
        <h3 className="text-xl font-bold text-accent mb-2">Histórico de Itens</h3>
        <p className="text-neutral-dark">Nenhum item registrado ainda.</p>
      </Card>
    </div>
  );
}
