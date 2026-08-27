import React from 'react';
import { TrendingUp, DollarSign, AlertTriangle, ShoppingBag } from 'lucide-react';

export default function DashboardInv() {
  return (
    <div className="p-6 bg-slate-50 min-h-screen space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Panel de Control General</h1>
        <p className="text-slate-500 text-sm">Visión general del estado comercial e inventarios</p>
      </div>

      {/* Tarjetas de Indicadores Clave */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Ventas del Mes</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><DollarSign size={18} /></div>
          </div>
          <p className="text-2xl font-extrabold text-slate-800">$4,850.00</p>
          <span className="text-emerald-600 text-xs font-bold flex items-center gap-1 mt-1">
            <TrendingUp size={14} /> +12% vs mes anterior
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Ganancia Estimada</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><TrendingUp size={18} /></div>
          </div>
          <p className="text-2xl font-extrabold text-slate-800">$1,920.00</p>
          <span className="text-slate-400 text-xs">Margen Promedio: 39%</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Órdenes Realizadas</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><ShoppingBag size={18} /></div>
          </div>
          <p className="text-2xl font-extrabold text-slate-800">142</p>
          <span className="text-slate-400 text-xs">Ticket Promedio: $34.15</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Productos Críticos</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><AlertTriangle size={18} /></div>
          </div>
          <p className="text-2xl font-extrabold text-slate-800">3 SKUs</p>
          <span className="text-amber-600 text-xs font-bold">Requiere Reabastecimiento</span>
        </div>
      </div>

      {/* Representación de Rendimiento */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4">Productos Más Vendidos</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>Teclado Mecánico RGB</span>
                <span>45 Unidades</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '85%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>Mouse Inalámbrico Pro</span>
                <span>32 Unidades</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '60%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>Monitor 24" Full HD</span>
                <span>18 Unidades</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '35%' }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4">Distribución del Valor de Inventario</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-600">Categoría Periféricos</span>
              <span className="font-bold text-slate-800">$1,450.00</span>
            </div>
            <div className="flex justify-between p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-600">Categoría Pantallas</span>
              <span className="font-bold text-slate-800">$2,160.00</span>
            </div>
            <div className="flex justify-between p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-600">Categoría Accesorios</span>
              <span className="font-bold text-slate-800">$680.00</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}