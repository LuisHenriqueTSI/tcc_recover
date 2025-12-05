export default function Sidebar({ statusFilter, onStatusChange, categoryFilter, onCategoryChange, showMyItems, onMyItemsChange }) {
  return (
    <aside className="fixed left-0 top-32 bottom-0 w-80 border-r border-white/10 bg-background-dark px-6 py-8 overflow-y-auto">
      {/* Status Filter */}
      <div className="mb-8">
        <label className="text-text-secondary-dark text-sm font-semibold mb-3 block">Status</label>
        <select
          value={statusFilter}
          onChange={e => onStatusChange(e.target.value)}
          className="form-input flex w-full rounded-lg text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-white/10 bg-surface-dark h-10 px-4 text-sm"
        >
          <option value="">Todos</option>
          <option value="perdido">Perdido</option>
          <option value="achado">Achado</option>
        </select>
      </div>

      {/* Category Filter */}
      <div className="mb-8">
        <label className="text-text-secondary-dark text-sm font-semibold mb-3 block">Categoria</label>
        <select
          value={categoryFilter}
          onChange={e => onCategoryChange(e.target.value)}
          className="form-input flex w-full rounded-lg text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-white/10 bg-surface-dark h-10 px-4 text-sm"
        >
          <option value="">Todas</option>
          <option value="electronics">Eletrônicos</option>
          <option value="documents">Documentos</option>
          <option value="keys">Chaves</option>
          <option value="accessories">Acessórios</option>
          <option value="other">Outros</option>
        </select>
      </div>

      {/* My Items Checkbox */}
      <label className="flex items-center gap-3 cursor-pointer hover:bg-surface-dark/50 p-3 rounded-lg transition">
        <input
          type="checkbox"
          checked={showMyItems}
          onChange={e => onMyItemsChange(e.target.checked)}
          className="w-5 h-5 rounded border-white/10 text-primary focus:ring-2 focus:ring-primary/50 cursor-pointer"
        />
        <span className="text-white font-medium">Meus itens</span>
      </label>
    </aside>
  );
}
