
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
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10 flex flex-col items-center p-2 sm:p-4 md:p-6">
      <Card className="w-full max-w-2xl mb-8 shadow-lg border border-primary/20">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
          <h2 className="text-2xl sm:text-3xl font-heading font-bold text-primary drop-shadow">Meu Painel</h2>
          <LogoutButton />
        </div>
        {loading ? (
          <p className="text-neutral-dark">Carregando...</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : user ? (
          <div className="mb-6 flex flex-col items-center">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white text-2xl sm:text-3xl font-bold mb-2 shadow">
              {user.email?.charAt(0).toUpperCase()}
            </div>
            <div className="text-lg sm:text-xl font-bold text-neutral-dark">{user.name || user.email}</div>
            <div className="text-xs sm:text-sm text-neutral-dark">{user.email}</div>
          </div>
        ) : null}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 mb-6">
          <Card className="bg-primary/10 border border-primary/20">
            <div className="text-base sm:text-lg font-bold text-primary mb-2">Itens Registrados</div>
            <div className="text-2xl sm:text-3xl font-heading text-primary">0</div>
          </Card>
          <Card className="bg-secondary/10 border border-secondary/20">
            <div className="text-base sm:text-lg font-bold text-secondary mb-2">Mensagens</div>
            <div className="text-2xl sm:text-3xl font-heading text-secondary">0</div>
          </Card>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 justify-center">
          <Button variant="primary">Registrar Item</Button>
          <Button variant="secondary">Ver Mensagens</Button>
        </div>
      </Card>
      <Card className="w-full max-w-2xl shadow border border-accent/20">
        <h3 className="text-lg sm:text-xl font-bold text-accent mb-2">Histórico de Itens</h3>
        <p className="text-neutral-dark">Nenhum item registrado ainda.</p>
      </Card>
    </div>
  );
}
