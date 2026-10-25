import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, AlertTriangle, Eye, Edit, Package, DollarSign } from 'lucide-react';  // estas son las impraciones de iconos de react
import FormProducto from './FormProducto';
import Kardex from './Kardex';

export default function ListaProductos() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorProductos, setErrorProductos] = useState('');

  const [busqueda, setBusqueda] = useState('');// estado vacio 
  const [modalAbierto, setModalAbierto] = useState(false);
  const [productoSeleccionadoKardex, setProductoSeleccionadoKardex] = useState(null);

  const cargarProductos = async () => {
    setCargando(true);
    setErrorProductos('');

    try {
      const respuesta = await fetch('http://127.0.0.1:5000/productos');

      if (!respuesta.ok) {
        throw new Error('No se pudieron obtener los productos');
      }

      const datos = await respuesta.json();

      const productosAdaptados = datos.map((p) => ({
        id: p.id,
        codOrigen: p.codOrigi ?? '',
        codigo: p.codigo ?? '',
        nombre: p.nombre,
        categoria: p.tipo ?? '',
        costo: Number(p.precio_compra ?? 0),
        precio: Number(p.precio_venta ?? 0),
        stock: Number(p.stock ?? 0),
        minStock: 5,
        marca: p.marca,
        descripcion: p.descripcion,
        proveedor: p.proveedor,
        id_proveedor: p.id_proveedor
      }));

      setProductos(productosAdaptados);

    } catch (error) {
      console.error('Error al cargar productos:', error);
      setErrorProductos(error.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  const guardarProducto = async () => {
    await cargarProductos();
  };

  // Filtrado dinámico para la busqueda
  const productosFiltrados = productos.filter(p => {
    const texto = busqueda.toLowerCase().trim();

    return (
      p.nombre.toLowerCase().includes(texto) ||
      p.codigo.toLowerCase().includes(texto) ||
      p.codOrigen.toLowerCase().includes(texto)
    );
});

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
            placeholder="Buscar por nombre o código o cod_origen..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-200 border border-slate-900 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>


      {cargando && (
        <p className="mb-4 text-sm text-blue-300">
          Cargando productos desde la base de datos...
        </p>
        )}

        {errorProductos && (
          <p className="mb-4 rounded-lg bg-red-100 p-3 text-sm text-red-700">
            {errorProductos}
          </p>
        )}

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
