import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search, AlertTriangle, Eye, Edit, Package, DollarSign } from 'lucide-react';
import FormProducto from './FormProducto';
import Kardex from './Kardex';

export default function ListaProductos({ usuario }) {

  const esAdmin = usuario?.rol === 'admin';
  const [searchParams, setSearchParams] = useSearchParams();
  const busquedaURL = searchParams.get('buscar') ?? '';
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorProductos, setErrorProductos] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [productoSeleccionadoKardex, setProductoSeleccionadoKardex] = useState(null);
  const [productoEditar, setProductoEditar] = useState(null);
  const [nuevoPrecioVenta, setNuevoPrecioVenta] = useState('');
  const [guardandoPrecio, setGuardandoPrecio] = useState(false);
  const [errorPrecio, setErrorPrecio] = useState('');

  const cargarProductos = async () => {
    setCargando(true);
    setErrorProductos('');
    try {
      const respuesta = await fetch('http://localhost:5000/productos', {
        method: 'GET',
        credentials: 'include'
      });
      if (!respuesta.ok) {
        throw new Error(respuesta.status === 401
          ? 'Tu sesión ha caducado. Vuelve a iniciar sesión.'
          : 'No se pudieron obtener los productos');
      }
      const datos = await respuesta.json();
      if (!Array.isArray(datos)) throw new Error('La respuesta de productos no es válida.');
      setProductos(datos.map((p) => ({
        id: p.id,
        codOrigen: p.codOrigi ?? '',
        codigo: p.codigo ?? '',
        nombre: p.nombre ?? '',
        categoria: p.tipo ?? '',
        costo: p.precio_compra == null ? null : Number(p.precio_compra),
        costoPromedio: p.costo_promedio == null ? null : Number(p.costo_promedio),
        precio: Number(p.precio_venta ?? 0),
        stock: Number(p.stock ?? 0),
        minStock: 5,
        marca: p.marca,
        descripcion: p.descripcion,
        proveedor: p.proveedor,
        id_proveedor: p.id_proveedor
      })));
      return true;
    } catch (error) {
      console.error('Error al cargar productos:', error);
      setErrorProductos(error.message);
      return false;
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarProductos();
  }, []);
  useEffect(() => {
  setBusqueda(busquedaURL);
}, [busquedaURL]);

  const guardarProducto = async () => {
    await cargarProductos();
  };

  const actualizarPrecioVenta = async () => {
    if (!esAdmin || !productoEditar || guardandoPrecio) return;
    const precio = Number(nuevoPrecioVenta);
    if (nuevoPrecioVenta.trim() === '' || !Number.isFinite(precio) || precio < 0) {
      setErrorPrecio('Introduce un precio de venta válido.');
      return;
    }
    setGuardandoPrecio(true);
    setErrorPrecio('');
    try {
      const respuesta = await fetch(
        `http://localhost:5000/productos/${productoEditar.id}/precio-venta`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ precio_venta: precio })
        }
      );
      const resultado = await respuesta.json();
      if (!respuesta.ok) {
        throw new Error(resultado.error || 'No se pudo actualizar el precio de venta.');
      }
      const actualizado = await cargarProductos();
      if (!actualizado) {
          setErrorPrecio('El precio se guardó, pero no se pudo actualizar la lista. Recarga la página.');
        return;
      }
      setProductoEditar(null);
      setNuevoPrecioVenta('');
    } catch (error) {
      setErrorPrecio(error.message || 'Error al guardar el precio.');
    } finally {
      setGuardandoPrecio(false);
    }
  };

  const textoBusqueda = busqueda.toLowerCase().trim();
  const productosFiltrados = productos.filter((p) => (
    p.nombre.toLowerCase().includes(textoBusqueda) ||
    p.codigo.toLowerCase().includes(textoBusqueda) ||
    p.codOrigen.toLowerCase().includes(textoBusqueda)
  ));

  return (
    <div className="p-6 bg-slate-900 min-h-screen">
      {/* Encabezado */}
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">INVENTARIO DE PRODUCTOS</h1>
          <p className="text-slate-200 text-sm">
            {esAdmin
              ? 'Administra tus productos, precios y el stock, no te quedes sin stock 0'
              : 'Consulta los productos disponibles, precios de venta y existencias.'}
          </p>
        </div>
        {esAdmin && (
          <button
            type="button"
            onClick={() => setModalAbierto(true)}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-md"
          >
            <Plus size={18} /> Agregar nuevo
          </button>
        )}
      </div>

      {/* Métricas */}
      <div className={`grid grid-cols-1 gap-4 mb-6 ${esAdmin ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
        <div className="bg-slate-700 p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Package size={24} /></div>
          <div>
            <p className="text-slate-100 text-xs font-semibold uppercase">Total Artículos</p>
            <p className="text-xl font-bold text-slate-100">{productos.length} Productos</p>
          </div>
        </div>
        <div className="bg-slate-700 p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg"><AlertTriangle size={24} /></div>
          <div>
            <p className="text-slate-100 text-xs font-semibold uppercase">Bajo Stock</p>
            <p className="text-xl font-bold text-slate-100">
              {productos.filter((p) => p.stock <= p.minStock).length} Alertas
            </p>
          </div>
        </div>
        {esAdmin && (
          <div className="bg-slate-700 p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-green-600 rounded-lg"><DollarSign size={24} /></div>
            <div>
              <p className="text-slate-100 text-xs font-semibold uppercase">Valor Inventario (Costo)</p>
              <p className="text-xl font-bold text-slate-100">
                ${productos.reduce((acc, p) => acc + ((p.costoPromedio ?? 0) * p.stock), 0).toFixed(2)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Buscador */}
      <div className="bg-slate-700 p-4 rounded-xl border border-slate-100 shadow-sm mb-6 flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por nombre o código o cod_origen..."
            value={busqueda}
            onChange={(e) => {
                const valor = e.target.value;
                setBusqueda(valor);

                setSearchParams(
                  valor.trim() ? { buscar: valor } : {},
                  { replace: true } );
                }}
            className="w-full pl-10 pr-4 py-2 bg-slate-200 border border-slate-900 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {cargando && (
        <p className="mb-4 text-sm text-blue-300">Cargando productos desde la base de datos...</p>
      )}
      {errorProductos && (
        <p className="mb-4 rounded-lg bg-red-100 p-3 text-sm text-red-700">{errorProductos}</p>
      )}

      {/* Tabla de productos */}
      <div className="bg-slate-300 rounded-xl border border-slate-100 shadow-sm overflow-x-auto">
        <table className="w-full text-left text-sm text-black">
          <thead className="bg-slate-800 text-slate-100 font-semibold border-b border-slate-100">
            <tr>
              <th className="p-4">Cod_Origen</th>
              <th className="p-4">Código</th>
              <th className="p-4">Producto</th>
              <th className="p-4">Categoría</th>
              {esAdmin && (
                <>
                  <th className="p-4 text-right">P. Costo</th>
                  <th className="p-4 text-right">C. Promedio</th>
                </>
              )}
              <th className="p-4 text-right">P. Venta</th>
              <th className="p-4 text-center">Stock</th>
              {esAdmin && <th className="p-4 text-center">Acciones</th>}
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
                  {esAdmin && (
                    <>
                      <td className="p-4 text-right">${(p.costo ?? 0).toFixed(2)}</td>
                      <td className="p-4 text-right font-semibold text-blue-700">
                        ${(p.costoPromedio ?? 0).toFixed(2)}
                      </td>
                    </>
                  )}
                  <td className="p-4 text-right font-semibold text-black">${p.precio.toFixed(2)}</td>
                  <td className="p-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      esBajoStock
                        ? 'bg-red-100 text-red-700 border border-red-200'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {p.stock} unidades
                    </span>
                  </td>
                  {esAdmin && (
                    <td className="p-4">
                      <div className="flex justify-center gap-2">
                        <button
                          type="button"
                          title="Ver Kardex"
                          aria-label={`Ver Kardex de ${p.nombre}`}
                          onClick={() => setProductoSeleccionadoKardex(p)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          type="button"
                          title="Editar precio de venta"
                          aria-label={`Editar precio de venta de ${p.nombre}`}
                          onClick={() => {
                            setProductoEditar(p);
                            setNuevoPrecioVenta(String(p.precio));
                            setErrorPrecio('');
                          }}
                          className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        >
                          <Edit size={18} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
                {!cargando && !errorProductos && productosFiltrados.length === 0 && (
              <tr>
                <td colSpan={esAdmin ? 9 : 6} className="p-6 text-center text-slate-600">
                  No se encontraron productos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: editar precio */}
      {esAdmin && productoEditar && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-600 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-4">Editar precio de venta</h2>
            <p className="text-slate-200 mb-3">
              Producto: <strong>{productoEditar.nombre}</strong>
            </p>
            <div className="bg-slate-700 p-3 rounded-lg mb-4 text-sm">
              <p className="text-slate-200">Último costo: ${(productoEditar.costo ?? 0).toFixed(2)}</p>
              <p className="text-emerald-400">
                Costo promedio: ${(productoEditar.costoPromedio ?? 0).toFixed(2)}
              </p>
            </div>
            <label htmlFor="nuevo-precio-venta" className="block text-sm text-slate-200 mb-2">
              Nuevo precio de venta
            </label>
            <input
              id="nuevo-precio-venta"
              type="number"
              min="0"
              step="0.01"
              value={nuevoPrecioVenta}
              onChange={(e) => setNuevoPrecioVenta(e.target.value)}
              className="w-full p-3 bg-slate-100 text-slate-900 rounded-lg mb-4"
            />
            {errorPrecio && <p className="text-red-400 text-sm mb-3">{errorPrecio}</p>}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                disabled={guardandoPrecio}
                onClick={() => setProductoEditar(null)}
                className="px-4 py-2 bg-slate-600 text-white rounded-lg disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={guardandoPrecio}
                onClick={actualizarPrecioVenta}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
              >
                {guardandoPrecio ? 'Guardando...' : 'Guardar precio'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Kardex por producto */}
      {esAdmin && productoSeleccionadoKardex && (
        <Kardex
          producto={productoSeleccionadoKardex}
          onClose={() => setProductoSeleccionadoKardex(null)}
        />
      )}

      {esAdmin && modalAbierto && (
        <FormProducto
          onClose={() => setModalAbierto(false)}
          onGuardar={guardarProducto}
        />
      )}
    </div>
  );
}
