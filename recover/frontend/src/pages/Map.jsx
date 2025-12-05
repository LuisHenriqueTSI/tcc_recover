import Header from '../components/Header';

export default function Map() {
  return (
    <div className="min-h-screen bg-background-dark">
      <Header showSearch={false} />
      <div className="pt-32 px-10 pb-10">
        <div className="max-w-4xl mx-auto text-center bg-surface-dark rounded-xl p-8 border border-white/10">
          <h2 className="text-2xl font-bold text-white mb-6">🗺️ Mapa Interativo</h2>
          <div className="bg-surface-dark/60 border border-white/10 rounded-lg h-96 flex items-center justify-center">
            <span className="text-text-secondary-dark">[Mapa com marcadores de itens]</span>
          </div>
        </div>
      </div>
    </div>
  );
}
