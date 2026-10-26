import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  ArrowDownCircle,
  LogOut,
  ShieldCheck,
  User,
  Users,
  ReceiptText
} from 'lucide-react';

/*ste componente se encarga de la navegación entre los módulos. Oculta o muestra opciones 
según el rol del usuario conectado (Administrador vs. Vendedor).*/

export default function Sidebar({ usuario = { nombre: 'Iván', rol: 'admin' }, abierto, onClose, onLogout }) {
  const esAdmin = usuario.rol === 'admin';

  return (
    <>
    {abierto && <button aria-label="Cerrar menú" onClick={onClose} className="fixed inset-0 z-30 bg-slate-950/50 lg:hidden" />}
    <aside className={`fixed inset-y-0 left-0 z-40 w-68 bg-slate-950 text-slate-300 flex flex-col justify-between border-r border-slate-800 transition-transform duration-200 lg:translate-x-0 ${abierto ? 'translate-x-0' : '-translate-x-full'}`}>
      <div>
        {/* Logo / Nombre del Negocio */}
        <div className="p-6 border-b border-slate-500 flex items-center gap-3">
          <div className="p-2  text-white rounded-xl font-bold">
            <img
                src="/logo-repuestos.jpg"
                alt="Logo Volvo Parts"
                className="h-16 w-16 rounded-full object-contain"
              />
          </div>
          <div>
            <h1 className="font-bold text-white text-base leading-tight">Inventario Choco</h1>
            <span className="text-xs text-slate-500 font-medium">Ventas e inventario</span>
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
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
              }`
            }
          >
            <ShoppingCart size={18} />
            <span>Punto de ventas</span>
          </NavLink>




          {/* ADMIN Y VENDEDOR: CONSULTAR PRODUCTOS */}
          {!esAdmin && (
            <NavLink
              to="/inventario/productos"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                }`
              }
            >
              <Package size={18} />
              <span>Lista de Productos</span>
            </NavLink>
          )}

          {/* SOLO ADMIN: Módulos restringidos de Inventario */}
          {esAdmin && (
            <>
              <div className="pt-4 pb-1">
                <p className="px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Administración</p>
              </div>

              <NavLink
                to="/inventario/dashboard"
                onClick={onClose}
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
                onClick={onClose}
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
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`
                }
              >
                <ArrowDownCircle size={18} />
                <span>Entradas de Stock</span>
              </NavLink>

              <NavLink
                to="/inventario/kardex"
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`
                }
              >
                <LayoutDashboard size={18} />
                <span>Kardex General</span>
              </NavLink>

              {/* ADMINISTRAR USUARIOS */}
              <NavLink
                to="/administracion/usuarios"
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`
                }
              >
                <Users size={18} />
                <span>Administrar Usuarios</span>
              </NavLink>

              {/* VENTAS POR VENDEDOR */}
              <NavLink
                to="/administracion/ventas"
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`
                }
              >
                <ReceiptText size={18} />
                <span>Ventas por Vendedor</span>
              </NavLink>
            </>
          )}
        </nav>
      </div>

      {/* Botón de Cerrar Sesión */}
      <div className="p-3 border-t border-slate-800">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
        >
          <LogOut size={18} />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
    </>
  );
}
