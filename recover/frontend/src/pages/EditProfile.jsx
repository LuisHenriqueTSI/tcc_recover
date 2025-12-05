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
  const [phone, setPhone] = useState('');
  const [instagram, setInstagram] = useState('');
  const [twitter, setTwitter] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [facebook, setFacebook] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    async function load() {
      if (user) {
        setName(user.name || '');
        setEmail(user.email || '');
        setPhone(user.phone || '');
        setInstagram(user.instagram || '');
        setTwitter(user.twitter || '');
        setWhatsapp(user.whatsapp || '');
        setFacebook(user.facebook || '');
        setLinkedin(user.linkedin || '');
        return;
      }
      const token = localStorage.getItem('recover_token');
      if (!token) return;
      try {
        const u = await getUserProfile(token);
        setName(u.name || '');
        setEmail(u.email || '');
        setPhone(u.phone || '');
        setInstagram(u.instagram || '');
        setTwitter(u.twitter || '');
        setWhatsapp(u.whatsapp || '');
        setFacebook(u.facebook || '');
        setLinkedin(u.linkedin || '');
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
      // Atualizar nome
      const resProfile = await fetch('http://localhost:8000/auth/sync-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name }),
      });
      if (!resProfile.ok) {
        const body = await resProfile.json().catch(() => ({}));
        throw new Error(body.detail || 'Erro ao atualizar perfil');
      }

      // Atualizar redes sociais
      const resSocial = await fetch('http://localhost:8000/auth/update-social-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          phone,
          instagram,
          twitter,
          whatsapp,
          facebook,
          linkedin,
        }),
      });
      if (!resSocial.ok) {
        const body = await resSocial.json().catch(() => ({}));
        throw new Error(body.detail || 'Erro ao atualizar redes sociais');
      }

      // Update AuthContext
      const updatedUser = { 
        ...(user || {}), 
        name,
        phone,
        instagram,
        twitter,
        whatsapp,
        facebook,
        linkedin,
      };
      login(null, updatedUser);
      setSuccess('Perfil atualizado com sucesso');
      setTimeout(() => navigate('/profile'), 700);
    } catch (err) {
      setError(err.message || 'Erro ao atualizar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-light flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <h2 className="text-2xl font-heading font-bold text-primary mb-6">Editar Perfil</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          {/* Seção de Informações Básicas */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-bold text-primary mb-3">Informações Básicas</h3>
            <Input label="Nome" required value={name} onChange={e => setName(e.target.value)} />
            <Input label="Email" type="email" value={email} disabled />
          </div>

          {/* Seção de Contato */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-bold text-primary mb-3">Contato</h3>
            <Input label="Telefone / WhatsApp" type="tel" placeholder="+55 11 99999-9999" value={phone} onChange={e => setPhone(e.target.value)} />
            <Input label="WhatsApp" placeholder="55119999999999" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} />
          </div>

          {/* Seção de Redes Sociais */}
          <div>
            <h3 className="text-lg font-bold text-primary mb-3">Redes Sociais</h3>
            <Input label="Instagram" placeholder="@seu_usuario" value={instagram} onChange={e => setInstagram(e.target.value)} />
            <Input label="Twitter" placeholder="@seu_usuario" value={twitter} onChange={e => setTwitter(e.target.value)} />
            <Input label="Facebook" placeholder="seu.usuario" value={facebook} onChange={e => setFacebook(e.target.value)} />
            <Input label="LinkedIn" placeholder="seu-usuario" value={linkedin} onChange={e => setLinkedin(e.target.value)} />
          </div>

          <div className="flex gap-2 mt-4">
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
