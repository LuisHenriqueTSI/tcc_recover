import Card from '../components/Card'
import Button from '../components/Button'

export default function Chat() {
  return (
    <div className="min-h-screen bg-neutral-light flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <h2 className="text-2xl font-heading font-bold text-primary mb-4">Chat de Mensagens</h2>
        <div className="h-48 bg-neutral-light border rounded mb-4 p-2 overflow-y-auto">
          <div className="text-neutral-dark mb-2">[Mensagens entre usuários]</div>
        </div>
        <form className="flex gap-2">
          <input className="flex-1 px-3 py-2 border border-neutral-light rounded focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Digite sua mensagem..." />
          <Button variant="primary" type="submit">Enviar</Button>
        </form>
      </Card>
    </div>
  )
}
