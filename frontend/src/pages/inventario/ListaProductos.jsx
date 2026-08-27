import React, { useState } from 'react';
import { Plus, Search, Filter, AlertTriangle, Eye, Edit, Package } from 'lucide-react';
import FormProducto from './FormProducto';
import Kardex from './Kardex';

export default function ListaProductos() {
  // Datos simulados (mientras conectamos el Backend en Python) estos datos es como si ya los tuvieramos en la base de datos mientras 
  // se diseña la interfaz necesitamos los  datos para las tablas 
  const [productos, setProductos] = useState([
    { id: 1, codigo: 'PROD-001', nombre: 'Teclado Mecánico RGB', categoria: 'Periféricos', costo: 35.00, precio: 65.00, stock: 12, minStock: 5 },
    { id: 2, codigo: 'PROD-002', nombre: 'Mouse Inalámbrico Pro', categoria: 'Periféricos', costo: 15.00, precio: 30.00, stock: 3, minStock: 5 },
    { id: 3, codigo: 'PROD-003', nombre: 'Monitor 24" Full HD', categoria: 'Pantallas', costo: 110.00, precio: 180.00, stock: 8, minStock: 2 },
  ]);

  const [busqueda, setBusqueda] = useState('');// estado vacio 
  const [modalAbierto, setModalAbierto] = useState(false);
  const [productoSeleccionadoKardex, setProductoSeleccionadoKardex] = useState(null);

  // Filtrado dinámico para la busqueda
  const productosFiltrados = productos.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.codigo.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* Encabezado del Módulo */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Control de Inventario</h1>
          <p className="text-slate-500 text-sm">Administra productos, precios y monitorea el stock actual</p>
        </div>
        <button
          onClick={() => setModalAbierto(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-md"
        >
          <Plus size={18} /> Nuevo Producto
        </button>
      </div>

      {/* Tarjetas de Métricas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Package size={24} /></div>
          <div>
            <p className="text-slate-500 text-xs font-semibold uppercase">Total Artículos</p>
            <p className="text-xl font-bold text-slate-800">{productos.length} Productos</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg"><AlertTriangle size={24} /></div>
          <div>
            <p className="text-slate-500 text-xs font-semibold uppercase">Bajo Stock</p>
            <p className="text-xl font-bold text-slate-800">
              {productos.filter(p => p.stock <= p.minStock).length} Alertas
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-xs font-semibold uppercase">Valor Inventario (Costo)</p>
          <p className="text-xl font-bold text-slate-800">
            ${productos.reduce((acc, p) => acc + (p.costo * p.stock), 0).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por nombre o código..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Tabla de Productos */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
            <tr>
              <th className="p-4">Código</th>
              <th className="p-4">Producto</th>
              <th className="p-4">Categoría</th>
              <th className="p-4 text-right">P. Costo</th>
              <th className="p-4 text-right">P. Venta</th>
              <th className="p-4 text-center">Stock</th>
              <th className="p-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {productosFiltrados.map((p) => {
              const esBajoStock = p.stock <= p.minStock;
              return (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-mono text-xs font-bold text-slate-500">{p.codigo}</td>
                  <td className="p-4 font-medium text-slate-800">{p.nombre}</td>
                  <td className="p-4">{p.categoria}</td>
                  <td className="p-4 text-right">${p.costo.toFixed(2)}</td>
                  <td className="p-4 text-right font-semibold text-slate-800">${p.precio.toFixed(2)}</td>
                  <td className="p-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      esBajoStock ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {p.stock} unidades
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center gap-2">
                      <button
                        title="Ver Kardex"
                        onClick={() => setProductoSeleccionadoKardex(p)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Eye size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Componente Modal para Kardex */}
      {productoSeleccionadoKardex && (
        <Kardex 
          producto={productoSeleccionadoKardex} 
          onClose={() => setProductoSeleccionadoKardex(null)} 
        />
      )}
    </div>
  );
}