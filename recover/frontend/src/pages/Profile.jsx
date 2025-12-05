import Card from '../components/Card';
import Button from '../components/Button';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <div className="text-red-600 font-bold mb-2">Usuário não autenticado</div>
        </Card>
      </div>
    );
  }

  // Função para abrir redes sociais
  const openSocialMedia = (type, value) => {
    let url = '';
    if (!value) return;

    switch(type) {
      case 'instagram':
        url = `https://instagram.com/${value.replace('@', '')}`;
        break;
      case 'twitter':
        url = `https://twitter.com/${value.replace('@', '')}`;
        break;
      case 'facebook':
        url = `https://facebook.com/${value}`;
        break;
      case 'linkedin':
        url = `https://linkedin.com/in/${value}`;
        break;
      case 'whatsapp':
        url = `https://wa.me/${value}`;
        break;
      case 'phone':
        url = `tel:${value}`;
        break;
      default:
        return;
    }
    
    window.open(url, '_blank');
  };

  const hasSocialMedia = user.instagram || user.twitter || user.facebook || user.linkedin || user.whatsapp || user.phone;

  return (
    <div className="min-h-screen bg-neutral-light flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Card Principal */}
        <Card className="mb-6">
          <div className="text-center mb-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent mx-auto mb-4 flex items-center justify-center shadow-lg">
              <span className="text-5xl">👤</span>
            </div>
            <h2 className="text-3xl font-heading font-bold text-primary mb-1">{user.name}</h2>
            <p className="text-sm text-neutral-dark">{user.email}</p>
          </div>

          <div className="flex justify-center">
            <Button variant="primary" onClick={() => navigate('/profile/edit')}>
              ✏️ Editar Perfil
            </Button>
          </div>
        </Card>

        {/* Card de Redes Sociais */}
        {hasSocialMedia && (
          <Card>
            <h3 className="text-2xl font-heading font-bold text-primary mb-6 flex items-center gap-2">
              <span>🌐</span>
              Minhas Redes Sociais
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {user.instagram && (
                <button
                  onClick={() => openSocialMedia('instagram', user.instagram)}
                  className="p-4 rounded-lg border-2 border-pink-200 hover:border-pink-500 hover:bg-pink-50 transition flex items-center gap-3 group"
                >
                  <span className="text-3xl">📷</span>
                  <div className="text-left">
                    <div className="text-sm font-bold text-neutral-dark group-hover:text-pink-600">Instagram</div>
                    <div className="text-xs text-neutral-light truncate">@{user.instagram.replace('@', '')}</div>
                  </div>
                </button>
              )}

              {user.twitter && (
                <button
                  onClick={() => openSocialMedia('twitter', user.twitter)}
                  className="p-4 rounded-lg border-2 border-sky-200 hover:border-sky-500 hover:bg-sky-50 transition flex items-center gap-3 group"
                >
                  <span className="text-3xl">𝕏</span>
                  <div className="text-left">
                    <div className="text-sm font-bold text-neutral-dark group-hover:text-sky-600">Twitter/X</div>
                    <div className="text-xs text-neutral-light truncate">@{user.twitter.replace('@', '')}</div>
                  </div>
                </button>
              )}

              {user.facebook && (
                <button
                  onClick={() => openSocialMedia('facebook', user.facebook)}
                  className="p-4 rounded-lg border-2 border-blue-200 hover:border-blue-500 hover:bg-blue-50 transition flex items-center gap-3 group"
                >
                  <span className="text-3xl">👍</span>
                  <div className="text-left">
                    <div className="text-sm font-bold text-neutral-dark group-hover:text-blue-600">Facebook</div>
                    <div className="text-xs text-neutral-light truncate">{user.facebook}</div>
                  </div>
                </button>
              )}

              {user.linkedin && (
                <button
                  onClick={() => openSocialMedia('linkedin', user.linkedin)}
                  className="p-4 rounded-lg border-2 border-blue-700/20 hover:border-blue-700 hover:bg-blue-50 transition flex items-center gap-3 group"
                >
                  <span className="text-3xl">🔗</span>
                  <div className="text-left">
                    <div className="text-sm font-bold text-neutral-dark group-hover:text-blue-700">LinkedIn</div>
                    <div className="text-xs text-neutral-light truncate">{user.linkedin}</div>
                  </div>
                </button>
              )}

              {user.whatsapp && (
                <button
                  onClick={() => openSocialMedia('whatsapp', user.whatsapp)}
                  className="p-4 rounded-lg border-2 border-green-200 hover:border-green-500 hover:bg-green-50 transition flex items-center gap-3 group"
                >
                  <span className="text-3xl">💬</span>
                  <div className="text-left">
                    <div className="text-sm font-bold text-neutral-dark group-hover:text-green-600">WhatsApp</div>
                    <div className="text-xs text-neutral-light truncate">{user.whatsapp}</div>
                  </div>
                </button>
              )}

              {user.phone && (
                <button
                  onClick={() => openSocialMedia('phone', user.phone)}
                  className="p-4 rounded-lg border-2 border-purple-200 hover:border-purple-500 hover:bg-purple-50 transition flex items-center gap-3 group"
                >
                  <span className="text-3xl">☎️</span>
                  <div className="text-left">
                    <div className="text-sm font-bold text-neutral-dark group-hover:text-purple-600">Telefone</div>
                    <div className="text-xs text-neutral-light truncate">{user.phone}</div>
                  </div>
                </button>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
