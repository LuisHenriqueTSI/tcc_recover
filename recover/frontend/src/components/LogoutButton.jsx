// Botão de logout
import { useNavigate } from 'react-router-dom';
import Button from './Button';
import { signOut } from '../services/supabaseAuth';

export default function LogoutButton() {
  const navigate = useNavigate();
  async function handleLogout() {
    await signOut();
    navigate('/login');
  }
  return (
    <Button variant="outline" onClick={handleLogout}>Sair</Button>
  );
}
