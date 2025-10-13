import Card from '../components/Card'

export default function Map() {
  return (
    <div className="min-h-screen bg-neutral-light flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full text-center">
        <h2 className="text-2xl font-heading font-bold text-primary mb-4">Mapa Interativo</h2>
        <div className="bg-neutral-light border border-neutral-dark rounded h-64 flex items-center justify-center">
          <span className="text-neutral-dark">[Mapa com marcadores de itens]</span>
        </div>
      </Card>
    </div>
  )
}
