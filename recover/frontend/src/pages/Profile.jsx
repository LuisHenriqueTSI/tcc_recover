import Card from '../components/Card';
import Button from '../components/Button';
import { useAuth } from '../contexts/AuthContext';

export default function Profile() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <div className="text-red-600 font-bold mb-2">Usuário não autenticado</div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-light flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <h2 className="text-2xl font-heading font-bold text-primary mb-4">Meu Perfil</h2>
        <div className="mb-4">
          <div className="w-20 h-20 rounded-full bg-neutral-light border mx-auto mb-2" />
          <div className="text-lg font-bold text-neutral-dark">{user.name}</div>
          <div className="text-sm text-neutral-dark">{user.email}</div>
        </div>
        <Button variant="secondary">Editar Perfil</Button>
      </Card>
    </div>
  );
}
