import Header from '../components/Header';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="min-h-screen bg-background-dark flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-surface-dark rounded-xl p-6 text-center border border-white/10">
          <div className="text-red-400 font-bold mb-2">Usuário não autenticado</div>
        </div>
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
    <div className="min-h-screen bg-background-dark">
      <Header showSearch={false} />
      <div className="pt-32 px-10 pb-10">
        <div className="max-w-4xl mx-auto">
          {/* Card Principal */}
          <div className="bg-surface-dark rounded-xl p-8 border border-white/10 mb-6">
            <div className="text-center mb-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary mx-auto mb-4 flex items-center justify-center shadow-lg ring-2 ring-primary/50">
                <span className="text-5xl">👤</span>
              </div>
              <h2 className="text-3xl font-bold text-text-primary-dark mb-1">{user.name}</h2>
              <p className="text-sm text-text-secondary-dark">{user.email}</p>
            </div>

            <div className="flex justify-center">
              <button 
                onClick={() => navigate('/profile/edit')}
                className="px-6 py-3 rounded-lg bg-primary hover:bg-primary/90 text-white font-semibold transition-colors"
              >
                ✏️ Editar Perfil
              </button>
            </div>
          </div>

          {/* Card de Redes Sociais */}
          {hasSocialMedia && (
            <div className="bg-surface-dark rounded-xl p-8 border border-white/10">
              <h3 className="text-2xl font-bold text-text-primary-dark mb-6 flex items-center gap-2">
                <span>🌐</span>
                Minhas Redes Sociais
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {user.instagram && (
                <button
                  onClick={() => openSocialMedia('instagram', user.instagram)}
                  className="p-4 rounded-lg border-2 border-pink-500/30 hover:border-pink-500/70 hover:bg-pink-500/10 transition flex items-center gap-3 group"
                >
                  <span className="text-3xl">📷</span>
                  <div className="text-left">
                    <div className="text-sm font-bold text-text-primary-dark group-hover:text-pink-400">Instagram</div>
                    <div className="text-xs text-text-secondary-dark truncate">@{user.instagram.replace('@', '')}</div>
                  </div>
                </button>
              )}

              {user.twitter && (
                <button
                  onClick={() => openSocialMedia('twitter', user.twitter)}
                  className="p-4 rounded-lg border-2 border-sky-500/30 hover:border-sky-500/70 hover:bg-sky-500/10 transition flex items-center gap-3 group"
                >
                  <span className="text-3xl">𝕏</span>
                  <div className="text-left">
                    <div className="text-sm font-bold text-text-primary-dark group-hover:text-sky-400">Twitter/X</div>
                    <div className="text-xs text-text-secondary-dark truncate">@{user.twitter.replace('@', '')}</div>
                  </div>
                </button>
              )}

              {user.facebook && (
                <button
                  onClick={() => openSocialMedia('facebook', user.facebook)}
                  className="p-4 rounded-lg border-2 border-blue-500/30 hover:border-blue-500/70 hover:bg-blue-500/10 transition flex items-center gap-3 group"
                >
                  <span className="text-3xl">👍</span>
                  <div className="text-left">
                    <div className="text-sm font-bold text-text-primary-dark group-hover:text-blue-400">Facebook</div>
                    <div className="text-xs text-text-secondary-dark truncate">{user.facebook}</div>
                  </div>
                </button>
              )}

              {user.linkedin && (
                <button
                  onClick={() => openSocialMedia('linkedin', user.linkedin)}
                  className="p-4 rounded-lg border-2 border-blue-400/30 hover:border-blue-400/70 hover:bg-blue-400/10 transition flex items-center gap-3 group"
                >
                  <span className="text-3xl">🔗</span>
                  <div className="text-left">
                    <div className="text-sm font-bold text-text-primary-dark group-hover:text-blue-400">LinkedIn</div>
                    <div className="text-xs text-text-secondary-dark truncate">{user.linkedin}</div>
                  </div>
                </button>
              )}

              {user.whatsapp && (
                <button
                  onClick={() => openSocialMedia('whatsapp', user.whatsapp)}
                  className="p-4 rounded-lg border-2 border-green-500/30 hover:border-green-500/70 hover:bg-green-500/10 transition flex items-center gap-3 group"
                >
                  <span className="text-3xl">💬</span>
                  <div className="text-left">
                    <div className="text-sm font-bold text-text-primary-dark group-hover:text-green-400">WhatsApp</div>
                    <div className="text-xs text-text-secondary-dark truncate">{user.whatsapp}</div>
                  </div>
                </button>
              )}

              {user.phone && (
                <button
                  onClick={() => openSocialMedia('phone', user.phone)}
                  className="p-4 rounded-lg border-2 border-purple-500/30 hover:border-purple-500/70 hover:bg-purple-500/10 transition flex items-center gap-3 group"
                >
                  <span className="text-3xl">☎️</span>
                  <div className="text-left">
                    <div className="text-sm font-bold text-text-primary-dark group-hover:text-purple-400">Telefone</div>
                    <div className="text-xs text-text-secondary-dark truncate">{user.phone}</div>
                  </div>
                </button>
              )}
            </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}