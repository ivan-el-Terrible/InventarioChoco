import React from 'react';
import { X, ArrowUpRight, ArrowDownLeft, FileText } from 'lucide-react';

export default function Kardex({ producto, onClose }) {
  // Datos simulados de movimientos del Kardex (se conectarán con SQLite)
  const movimientos = [
    { id: 1, fecha: '2026-08-20 10:30', tipo: 'Entrada', detalle: 'Factura Compra #F-4502', cantidad: 15, saldoAnterior: 0, saldoNuevo: 15, costoUnitario: 35.00 },
    { id: 2, fecha: '2026-08-21 14:15', tipo: 'Salida', detalle: 'Venta #V-00101', cantidad: 2, saldoAnterior: 15, saldoNuevo: 13, costoUnitario: 35.00 },
    { id: 3, fecha: '2026-08-22 09:00', tipo: 'Salida', detalle: 'Venta #V-00108', cantidad: 1, saldoAnterior: 13, saldoNuevo: 12, costoUnitario: 35.00 },
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Cabecera del Modal */}
        <div className="p-6 bg-slate-800 text-white flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-blue-500/20 text-blue-300 text-xs px-2 py-0.5 rounded font-mono">
                {producto.codigo}
              </span>
              <h2 className="text-xl font-bold">{producto.nombre}</h2>
            </div>
            <p className="text-slate-400 text-sm mt-1">Historial de movimientos y auditoría de stock</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-300 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Resumen del Estado Actual */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 border-b border-slate-200 text-sm">
          <div>
            <p className="text-slate-500 text-xs">Stock Actual:</p>
            <p className="text-lg font-bold text-slate-800">{producto.stock} Unidades</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs">Costo Promedio:</p>
            <p className="text-lg font-bold text-slate-800">${producto.costo.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs">Precio de Venta:</p>
            <p className="text-lg font-bold text-emerald-600">${producto.precio.toFixed(2)}</p>
          </div>
        </div>

        {/* Tabla de Movimientos del Kardex */}
        <div className="p-6 overflow-y-auto flex-1">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">Fecha y Hora</th>
                <th className="p-3">Tipo</th>
                <th className="p-3">Detalle / Documento</th>
                <th className="p-3 text-right">Cant.</th>
                <th className="p-3 text-right">S. Anterior</th>
                <th className="p-3 text-right">S. Nuevo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {movimientos.map((m) => {
                const esEntrada = m.tipo === 'Entrada';
                return (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono text-xs text-slate-500">{m.fecha}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${
                        esEntrada ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {esEntrada ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                        {m.tipo}
                      </span>
                    </td>
                    <td className="p-3 font-medium text-slate-700">{m.detalle}</td>
                    <td className={`p-3 text-right font-bold ${esEntrada ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {esEntrada ? `+${m.cantidad}` : `-${m.cantidad}`}
                    </td>
                    <td className="p-3 text-right text-slate-500">{m.saldoAnterior}</td>
                    <td className="p-3 text-right font-bold text-slate-800">{m.saldoNuevo}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pie del Modal */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center text-xs text-slate-500">
          <span className="flex items-center gap-1"><FileText size={14} /> Método de valoración: Costo Promedio Ponderado</span>
          <button 
            onClick={onClose} 
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium transition-colors"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
}