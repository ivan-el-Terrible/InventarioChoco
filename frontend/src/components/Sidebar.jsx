import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  ArrowDownCircle, 
  LogOut, 
  ShieldCheck, 
  User 
} from 'lucide-react';


/*ste componente se encarga de la navegación entre los módulos. Oculta o muestra opciones 
según el rol del usuario conectado (Administrador vs. Vendedor).*/

export default function Sidebar({ usuario = { nombre: 'Iván', rol: 'admin' } }) {
  const esAdmin = usuario.rol === 'admin';

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 min-h-screen flex flex-col justify-between border-r border-slate-800">
      <div>
        {/* Logo / Nombre del Negocio */}
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="p-2 bg-blue-600 text-white rounded-xl font-bold">
            <Package size={22} />
          </div>
          <div>
            <h1 className="font-bold text-white text-base leading-tight">ControlStock</h1>
            <span className="text-xs text-slate-500 font-medium">Sistema POS & Inventario</span>
          </div>
        </div>

        {/* Info del Usuario Logueado */}
        <div className="p-4 mx-3 my-4 bg-slate-800/60 rounded-xl border border-slate-700/50 flex items-center gap-3">
          <div className="p-2 bg-slate-700 rounded-lg text-blue-400">
            {esAdmin ? <ShieldCheck size={20} /> : <User size={20} />}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-white truncate">{usuario.nombre}</p>
            <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded ${
              esAdmin ? 'bg-blue-500/20 text-blue-300' : 'bg-emerald-500/20 text-emerald-300'
            }`}>
              {usuario.rol}
            </span>
          </div>
        </div>

        {/* Links de Navegación */}
        <nav className="px-3 space-y-1">
          <p className="px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Módulos</p>

          {/* VENDEDOR Y ADMIN: Acceso a Ventas */}
          <NavLink
            to="/ventas"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
              }`
            }
          >
            <ShoppingCart size={18} />
            <span>Punto de Ventas (POS)</span>
          </NavLink>

          {/* SOLO ADMIN: Módulos restringidos de Inventario */}
          {esAdmin && (
            <>
              <div className="pt-4 pb-1">
                <p className="px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Administración</p>
              </div>

              <NavLink
                to="/inventario/dashboard"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`
                }
              >
                <LayoutDashboard size={18} />
                <span>Métricas / Dashboard</span>
              </NavLink>

              <NavLink
                to="/inventario/productos"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`
                }
              >
                <Package size={18} />
                <span>Lista de Productos</span>
              </NavLink>

              <NavLink
                to="/inventario/entradas"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`
                }
              >
                <ArrowDownCircle size={18} />
                <span>Entradas de Stock</span>
              </NavLink>
            </>
          )}
        </nav>
      </div>

      {/* Botón de Cerrar Sesión */}
      <div className="p-3 border-t border-slate-800">
        <button
          onClick={() => alert('Cerrando sesión...')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
        >
          <LogOut size={18} />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}