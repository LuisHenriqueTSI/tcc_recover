import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Statistics from '../components/Statistics';
import Button from '../components/Button';

export default function Welcome() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Se já está logado, redireciona para Home
  if (user) {
    navigate('/home');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-accent/10 to-secondary/20">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-heading font-bold text-primary mb-6 animate-fade-in">
            Bem-vindo ao Recover
          </h1>
          <p className="text-xl md:text-2xl text-neutral-dark mb-8 max-w-3xl mx-auto">
            Ajudamos você a encontrar seus pertences perdidos e reunir objetos com seus donos
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button variant="primary" onClick={() => navigate('/register')} className="text-lg px-8 py-3">
              Criar Conta
            </Button>
            <Button variant="secondary" onClick={() => navigate('/login')} className="text-lg px-8 py-3">
              Entrar
            </Button>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-lg shadow-lg p-6 text-center transform hover:scale-105 transition-transform">
            <div className="text-5xl mb-4">📸</div>
            <h3 className="text-xl font-bold text-primary mb-2">Registre Itens</h3>
            <p className="text-neutral-dark">
              Cadastre objetos perdidos ou encontrados com fotos e localização
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 text-center transform hover:scale-105 transition-transform">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-primary mb-2">Busque e Encontre</h3>
            <p className="text-neutral-dark">
              Procure por itens perdidos ou encontrados na sua região
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 text-center transform hover:scale-105 transition-transform">
            <div className="text-5xl mb-4">💬</div>
            <h3 className="text-xl font-bold text-primary mb-2">Conecte-se</h3>
            <p className="text-neutral-dark">
              Entre em contato com quem encontrou ou perdeu o item
            </p>
          </div>
        </div>

        {/* Statistics Section */}
        <div className="flex flex-col items-center">
          <h2 className="text-3xl font-heading font-bold text-primary mb-8 text-center">
            Histórias de Sucesso
          </h2>
          <Statistics />
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
          <h3 className="text-2xl font-bold text-primary mb-4">
            Pronto para começar?
          </h3>
          <p className="text-neutral-dark mb-6">
            Junte-se a nossa comunidade e ajude a reunir pessoas com seus pertences
          </p>
          <Button variant="primary" onClick={() => navigate('/register')} className="text-lg px-8 py-3">
            Cadastre-se Gratuitamente
          </Button>
        </div>
      </div>
    </div>
  );
}
