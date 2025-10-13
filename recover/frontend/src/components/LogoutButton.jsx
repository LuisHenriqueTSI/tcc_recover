// Botão de logout
import { useNavigate } from 'react-router-dom';
import Button from './Button';

export default function LogoutButton() {
  const navigate = useNavigate();
  function handleLogout() {
    localStorage.removeItem('recover_token');
    navigate('/login');
  }
  return (
    <Button variant="outline" onClick={handleLogout}>Sair</Button>
  );
}
