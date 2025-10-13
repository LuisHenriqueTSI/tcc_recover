
import Card from '../components/Card'
import Button from '../components/Button'
import { useNavigate } from 'react-router-dom'

export default function Home() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-neutral-light flex flex-col items-center justify-center p-4">
      <Card className="max-w-xl w-full text-center">
        <h1 className="text-4xl font-heading font-bold text-primary mb-4">Recover</h1>
        <p className="text-lg text-neutral-dark mb-6">Sistema web para achados e perdidos de objetos e animais. Encontre, registre e ajude a comunidade!</p>
        <div className="flex flex-col gap-2 mb-4">
          <Button variant="primary" onClick={() => navigate('/login')}>Entrar</Button>
          <Button variant="secondary" onClick={() => navigate('/register-item')}>Registrar Item</Button>
          <Button variant="accent" onClick={() => navigate('/register')}>Registrar Usuário</Button>
        </div>
        <div className="flex justify-center gap-6 mt-4">
          <div>
            <span className="block text-2xl font-bold text-primary">+1200</span>
            <span className="block text-sm text-neutral-dark">Itens encontrados</span>
          </div>
          <div>
            <span className="block text-2xl font-bold text-secondary">+300</span>
            <span className="block text-sm text-neutral-dark">Animais reunidos</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
