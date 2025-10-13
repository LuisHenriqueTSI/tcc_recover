import Card from '../components/Card'

export default function Admin() {
  return (
    <div className="min-h-screen bg-neutral-light flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full text-center">
        <h2 className="text-2xl font-heading font-bold text-primary mb-4">Painel Administrativo</h2>
        <div className="mb-4 text-neutral-dark">Gerencie usuários, itens, denúncias e veja estatísticas do sistema.</div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-neutral-light border rounded p-4">Usuários</div>
          <div className="bg-neutral-light border rounded p-4">Itens</div>
          <div className="bg-neutral-light border rounded p-4">Denúncias</div>
          <div className="bg-neutral-light border rounded p-4">Estatísticas</div>
        </div>
      </Card>
    </div>
  )
}
