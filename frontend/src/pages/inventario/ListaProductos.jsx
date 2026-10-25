import React, { useState } from 'react';
import { Plus, Search, Filter, AlertTriangle, Eye, Edit, Package, DollarSign } from 'lucide-react';  // estas son las impraciones de iconos de react
import FormProducto from './FormProducto';
import Kardex from './Kardex';

export default function ListaProductos() {
  // Datos simulados (mientras conectamos el Backend en Python) estos datos es como si ya los tuvieramos en la base de datos mientras 
  // se diseña la interfaz necesitamos los  datos para las tablas 
  const [productos, setProductos] = useState([
    { id: 1, codOrigen: '123', codigo: 'PROD-001', nombre: 'Teclado Mecánico RGB', categoria: 'Periféricos', costo: 35.00, precio: 65.00, stock: 12, minStock: 5 },
    { id: 2, codOrigen: '456', codigo: 'PROD-002', nombre: 'Mouse Inalámbrico Pro', categoria: 'Periféricos', costo: 15.00, precio: 30.00, stock: 3, minStock: 5 },
    { id: 3, codOrigen: '789', codigo: 'PROD-003', nombre: 'Monitor 24" Full HD', categoria: 'Pantallas', costo: 110.00, precio: 180.00, stock: 8, minStock: 2 },
  ]);

  const [busqueda, setBusqueda] = useState('');// estado vacio 
  const [modalAbierto, setModalAbierto] = useState(false);
  const [productoSeleccionadoKardex, setProductoSeleccionadoKardex] = useState(null);

  const guardarProducto = (nuevoProducto) => { /*metodo para guardar un nuevo producto */
    setProductos(actuales => [...actuales, { ...nuevoProducto,
                                             id: Date.now(),
                                             codOrigen: nuevoProducto.codOrigen,   //|| `COD-${String(actuales.length + 1).padStart(3, '0')}`, esto para que pongamos nosotros el codigo original 
                                             codigo: nuevoProducto.codigo || `PROD-${String(actuales.length + 1).padStart(3, '0')}` }]);
  };

  // Filtrado dinámico para la busqueda
  const productosFiltrados = productos.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.codigo.toLowerCase().includes(busqueda.toLowerCase())
  ); // busca  un producto por nombre o codigo, filtra los nombres o codigo 

  return (
    <div className="p-6 bg-slate-900 min-h-screen">  //esto es el fondo como si fuera un panel de los de netbeans 
      {/* Encabezado del Módulo */}
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">INVENTARIO DE PRODUCTOS </h1> {/** casi siempre esto es para el titulo de una pagina */}
          <p className="text-slate-200 text-sm">Administra tus productos, precios y el stock, no te quedes sin stock 0 </p>
        </div>
        <button 
          onClick={() => setModalAbierto(true)}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-md"
        >
          <Plus size={18} /> Agregar nuevo
        </button>
      </div>

      {/* Tarjetas de Métricas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-700 p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Package size={24} /></div>
          <div>
            <p className="text-slate-100 text-xs font-semibold uppercase">Total Artículos</p>
            <p className="text-xl font-bold text-slate-100">{productos.length} Productos </p>
          </div>
        </div>

        <div className="bg-slate-700 p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg"><AlertTriangle size={24} /></div>
          <div>
            <p className="text-slate-100 text-xs font-semibold uppercase">Bajo Stock</p>
            <p className="text-xl font-bold text-slate-100">
              {productos.filter(p => p.stock <= p.minStock).length} Alertas
            </p>
          </div>
        </div>


{/* ESTO ES PARA SUMAR TODO EL INVENTARIO Y MULTIPLICARLO POR EL COSTO */}
        <div className="bg-slate-700 p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-green-600 rounded-lg"><DollarSign size={24} /></div>
          <div>
            <p className="text-slate-100 text-xs font-semibold uppercase">Valor Inventario (Costo)</p>
            <p className="text-xl font-bold text-slate-100">
            ${productos.reduce((acc, p) => acc + (p.costo * p.stock), 0).toFixed(2)} 
          </p>
             </div>
          
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-slate-700 p-4 rounded-xl border border-slate-100 shadow-sm mb-6 flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por nombre o código..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-200 border border-slate-900 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Tabla de Productos */}
      <div className="bg-slate-300 rounded-xl border border-slate-100 shadow-sm overflow-x-auto">
        <table className="w-full text-left text-sm text-black">
          <thead className="bg-slate-800 text-slate-100 font-semibold border-b border-slate-100">
            <tr>
              <th className="p-4">Cod_Origen</th>
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
                <tr key={p.id} className="hover:bg-slate-100 transition-colors">
                  <td className="p-4 font-medium text-xs font-bold text-black">{p.codOrigen}</td>
                  <td className="p-4 font-medium text-xs font-bold text-black">{p.codigo}</td>
                  <td className="p-4 font-medium text-black">{p.nombre}</td>
                  <td className="p-4">{p.categoria}</td>
                  <td className="p-4 text-right">${p.costo.toFixed(2)}</td>
                  <td className="p-4 text-right font-semibold text-black ">${p.precio.toFixed(2)}</td>
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
      {modalAbierto && <FormProducto onClose={() => setModalAbierto(false)} onGuardar={guardarProducto} />}
    </div>
  );
}
