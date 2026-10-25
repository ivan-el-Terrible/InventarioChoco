// este es mmi ultimo commit
import { Bell, Menu, Search } from 'lucide-react';

export default function Header({ usuario, onMenu }) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-slate-200 px-4 backdrop-blur md:px-6">
      <button onClick={onMenu} aria-label="Abrir menú" className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden">
        <Menu size={22} />
      </button>
      <div className="relative hidden max-w-md flex-1 sm:block">
        <Search className="absolute left-3 top-2.5 text-slate-400" size={20} />
        <input className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2
               pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" 
               placeholder="Buscar en el sistema..." />
      </div>
      <div className="ml-auto flex items-center gap-3">
        <button aria-label="Notificaciones" className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100">
          <Bell size={19} /><span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
        </button>
        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold text-slate-800">{usuario.nombre}</p>
          <p className="text-xs capitalize text-slate-500">{usuario.rol}</p>
        </div>
        <div className="grid h-9 w-9 place-items-center rounded-full bg-blue-600 text-sm font-bold text-white">{usuario.nombre.charAt(0).toUpperCase()}</div>
      </div>
    </header>
  );
}
