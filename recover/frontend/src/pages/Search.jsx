import Card from '../components/Card'
import Input from '../components/Input'
import Button from '../components/Button'

export default function Search() {
  return (
    <div className="min-h-screen bg-neutral-light flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <h2 className="text-2xl font-heading font-bold text-primary mb-4">Buscar Itens</h2>
        <form className="flex flex-col gap-4 mb-4">
          <Input label="Categoria" />
          <Input label="Localização" />
          <Input label="Data" type="date" />
          <Button variant="primary" type="submit">Buscar</Button>
        </form>
        <div className="mt-4 text-neutral-dark">Nenhum resultado encontrado.</div>
      </Card>
    </div>
  )
}
