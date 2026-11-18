import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search, AlertTriangle, Eye, Edit, Package, DollarSign, Store, X, Pencil } from 'lucide-react';
import FormProducto from './FormProducto';
import Kardex from './Kardex';
import useAutoRefetch from '../../hooks/useAutoRefetch';

export default function ListaProductos({ usuario }) {

  const esAdmin = usuario?.rol === 'admin';
  const [searchParams, setSearchParams] = useSearchParams();
  const busquedaURL = searchParams.get('buscar') ?? '';
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorProductos, setErrorProductos] = useState('');
  const [tiendas, setTiendas] = useState([]);
  const [tiendaSeleccionada, setTiendaSeleccionada] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalTienda, setModalTienda] = useState(false);
  const [tiendaEditId, setTiendaEditId] = useState(null);
  const [guardandoTienda, setGuardandoTienda] = useState(false);
  const [errorTienda, setErrorTienda] = useState('');
  const [formTienda, setFormTienda] = useState({ nombre: '', direccion: '' });
  const [productoSeleccionadoKardex, setProductoSeleccionadoKardex] = useState(null);
  const [productoEditar, setProductoEditar] = useState(null);
  const [nuevoPrecioVenta, setNuevoPrecioVenta] = useState('');
  const [guardandoPrecio, setGuardandoPrecio] = useState(false);
  const [errorPrecio, setErrorPrecio] = useState('');

  // silencioso = true evita el parpadeo de "Cargando" en la auto-actualización.
  const cargarProductos = useCallback(async (silencioso = false) => {
    if (!silencioso) setCargando(true);
    setErrorProductos('');
    try {
      const urlTienda = esAdmin && tiendaSeleccionada
        ? `/productos?id_tienda=${encodeURIComponent(tiendaSeleccionada)}`
        : '/productos';
      const respuesta = await fetch(urlTienda, {
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
        codOrigen: p.cod_origen ?? p.codOrigi ?? '',
        codigo: p.codigo ?? '',
        nombre: p.nombre ?? '',
        categoria: p.categoria ?? p.tipo ?? '',
        costo: p.precio_compra == null ? null : Number(p.precio_compra),
        costoPromedio: p.costo_promedio == null ? null : Number(p.costo_promedio),
        precio: Number(p.precio_venta ?? 0),
        stock: Number(p.stock ?? 0),
        minStock: 5,
        marca: p.marca ?? '',
        unidad: p.unidad ?? '',
        descripcion: p.descripcion ?? '',
        proveedor: p.proveedor ?? '',
        telefonoProveedor: p.telefono_proveedor ?? '',
        id_proveedor: p.id_proveedor ?? null
      })));
      return true;
    } catch (error) {
      console.error('Error al cargar productos:', error);
      if (!silencioso) setErrorProductos(error.message);
      return false;
    } finally {
      if (!silencioso) setCargando(false);
    }
  }, [esAdmin, tiendaSeleccionada]);

  useEffect(() => {
    cargarProductos();
  }, [cargarProductos]);

  // El administrador elige la tienda de la que quiere ver los productos.
  useEffect(() => {
    if (!esAdmin) return;
    let activo = true;
    (async () => {
      try {
        const respuesta = await fetch('/tiendas', { credentials: 'include' });
        if (!respuesta.ok) return;
        const datos = await respuesta.json();
        if (activo && Array.isArray(datos)) setTiendas(datos);
      } catch {
        /* sin tiendas: se queda con la tienda por defecto de la sesión */
      }
    })();
    return () => { activo = false; };
  }, [esAdmin]);

  // Precios y stock actualizados sin recargar (p. ej. si el admin cambia un precio).
  useAutoRefetch(() => { cargarProductos(true); }, 15000);

  const abrirModalTienda = () => {
    setTiendaEditId(null);
    setFormTienda({ nombre: '', direccion: '' });
    setErrorTienda('');
    setModalTienda(true);
  };

  // Editar la tienda que está elegida en el selector (poner dirección, etc.).
  const abrirEdicionTienda = () => {
    const t = tiendas.find((x) => String(x.id) === String(tiendaSeleccionada));
    if (!t) return;
    setTiendaEditId(t.id);
    setFormTienda({ nombre: t.nombre, direccion: t.direccion || '' });
    setErrorTienda('');
    setModalTienda(true);
  };

  const guardarTienda = async (e) => {
    e.preventDefault();
    if (guardandoTienda) return;
    if (!formTienda.nombre.trim()) {
      setErrorTienda('El nombre de la tienda es obligatorio.');
      return;
    }

    setGuardandoTienda(true);
    setErrorTienda('');
    try {
      const url = tiendaEditId ? `/tiendas/${tiendaEditId}` : '/tiendas';
      const respuesta = await fetch(url, {
        method: tiendaEditId ? 'PATCH' : 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: formTienda.nombre.trim(),
          direccion: formTienda.direccion.trim() || null
        })
      });
      const resultado = await respuesta.json();
      if (!respuesta.ok) throw new Error(resultado.error || 'No se pudo guardar la tienda');

      // Se refresca la lista del selector con los cambios.
      const nueva = await fetch('/tiendas', { credentials: 'include' });
      const lista = await nueva.json();
      if (nueva.ok && Array.isArray(lista)) setTiendas(lista);

      setModalTienda(false);
    } catch (error) {
      setErrorTienda(error.message);
    } finally {
      setGuardandoTienda(false);
    }
  };
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
        `/productos/${productoEditar.id}/precio-venta`,
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
    p.codOrigen.toLowerCase().includes(textoBusqueda) ||
    p.categoria.toLowerCase().includes(textoBusqueda) ||
    p.marca.toLowerCase().includes(textoBusqueda) ||
    p.proveedor.toLowerCase().includes(textoBusqueda)
  ));

  return (
    <div className="p-6 bg-[#0F172A] min-h-screen text-slate-100">
      {/* Encabezado */}
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">INVENTARIO DE PRODUCTOS</h1>
          <p className="text-slate-400 text-sm">
            {esAdmin
              ? 'Administra tus productos, precios y el stock, no te quedes sin stock 0'
              : 'Consulta los productos disponibles, precios de venta y existencias.'}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {esAdmin && (
            <div className="flex flex-wrap items-center gap-3">
              <Store size={19} className="text-blue-400" />
              <label htmlFor="tienda-productos">Tienda:</label>
              <select
                id="tienda-productos"
                value={tiendaSeleccionada}
                onChange={(e) => setTiendaSeleccionada(e.target.value)}
                className="rounded-lg border border-slate-600 bg-[#1E293B] px-4 py-2 text-white"
              >
                <option value="">Mi tienda (por defecto)</option>
                {tiendas.map((t) => (
                  <option key={t.id} value={t.id} title={t.direccion || ''}>
                    {t.nombre}
                  </option>
                ))}
              </select>
              <button
                type="button"
                title="Añadir tienda"
                aria-label="Añadir tienda"
                onClick={abrirModalTienda}
                className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Plus size={15} />
              </button>
              {tiendaSeleccionada && (
                <button
                  type="button"
                  title="Editar la tienda seleccionada (nombre y dirección)"
                  aria-label="Editar tienda seleccionada"
                  onClick={abrirEdicionTienda}
                  className="p-1.5 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors"
                >
                  <Pencil size={15} />
                </button>
              )}
            </div>
          )}
        {esAdmin && (
          <button
            type="button"
            onClick={() => setModalAbierto(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-md"
          >
            <Plus size={18} /> Agregar nuevo
          </button>
        )}
        </div>
      </div>

      {/* Métricas */}
      <div className={`mb-5 grid gap-4 ${esAdmin ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
        <div className="flex items-center gap-3 rounded-xl border border-slate-700 bg-[#1E293B] p-5">
          <Package className="text-blue-400" size={28} />
          <div>
            <p className="text-sm text-slate-400">Total Artículos</p>
            <p className="text-2xl font-bold">{productos.length} Productos</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-slate-700 bg-[#1E293B] p-5">
          <AlertTriangle className="text-amber-400" size={28} />
          <div>
            <p className="text-sm text-slate-400">Bajo Stock</p>
            <p className="text-2xl font-bold">
              {productos.filter((p) => p.stock <= p.minStock).length} Alertas
            </p>
          </div>
        </div>
        {esAdmin && (
          <div className="flex items-center gap-3 rounded-xl border border-slate-700 bg-[#1E293B] p-5">
            <DollarSign className="text-emerald-400" size={28} />
            <div>
              <p className="text-sm text-slate-400">Valor Inventario (Costo)</p>
              <p className="text-2xl font-bold">
                ${productos.reduce((acc, p) => acc + ((p.costoPromedio ?? 0) * p.stock), 0).toFixed(2)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Buscador */}
      <div className="mb-5 rounded-xl border border-slate-700 bg-[#1E293B] p-4">
        <div className="relative">
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
            className="w-full rounded-lg border border-slate-500 bg-[#0F172A] py-2 pl-10 pr-4 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {cargando && (
        <p className="mb-4 text-sm text-blue-300">Cargando productos desde la base de datos...</p>
      )}
      {errorProductos && (
        <p className="mb-4 rounded-lg border border-rose-800 bg-rose-950 p-3 text-sm text-rose-200">
          {errorProductos}
        </p>
      )}

      {/* Tabla de productos */}
      <div className="overflow-x-auto rounded-xl border border-slate-700 bg-[#1E293B]">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#334155] text-slate-200">
            <tr>
              <th className="p-4">Cod_Origen</th>
              <th className="p-4">Código</th>
              <th className="p-4">Nombre Producto</th>
              <th className="p-4">Categoría</th>
              <th className="p-4">Marca</th>
              <th className="p-4">Unidad</th>
              {esAdmin && <th className="p-4">Proveedor</th>}
              {esAdmin && (
                <>
                  <th className="p-4 text-right">P. Compra</th>
                  <th className="p-4 text-right">C. Promedio</th>
                </>
              )}
              <th className="p-4 text-right">P. Venta</th>
              <th className="p-4 text-center">Stock</th>
              {esAdmin && <th className="p-4 text-center">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {productosFiltrados.map((p) => {
              const esBajoStock = p.stock <= p.minStock;
              return (
                <tr key={p.id} className="border-t border-slate-700 hover:bg-slate-700/30">
                  <td className="p-4 text-xs font-bold text-slate-300">{p.codOrigen || '—'}</td>
                  <td className="p-4 text-xs font-bold text-slate-300">{p.codigo || '—'}</td>
                  <td className="p-4 font-semibold">
                    {p.nombre}
                    {p.descripcion && (
                      <span className="block text-xs font-normal text-slate-400">
                        {p.descripcion}
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-slate-300">{p.categoria || '—'}</td>
                  <td className="p-4 text-slate-300">{p.marca || '—'}</td>
                  <td className="p-4 text-slate-300">{p.unidad || '—'}</td>
                  {esAdmin && (
                    <td className="p-4 text-slate-300">
                      {p.proveedor || '—'}
                      {p.telefonoProveedor && (
                        <span className="block text-xs text-slate-400">
                          {p.telefonoProveedor}
                        </span>
                      )}
                    </td>
                  )}
                  {esAdmin && (
                    <>
                      <td className="p-4 text-right text-slate-300">${(p.costo ?? 0).toFixed(2)}</td>
                      <td className="p-4 text-right font-semibold text-blue-400">
                        ${(p.costoPromedio ?? 0).toFixed(2)}
                      </td>
                    </>
                  )}
                  <td className="p-4 text-right font-semibold">${p.precio.toFixed(2)}</td>
                  <td className="p-4 text-center">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                      esBajoStock
                        ? 'bg-red-900 text-red-200'
                        : 'bg-emerald-900 text-emerald-200'
                    }`}>
                      {p.stock} unidades
                    </span>
                  </td>
                  {esAdmin && (
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          title="Ver Kardex"
                          aria-label={`Ver Kardex de ${p.nombre}`}
                          onClick={() => setProductoSeleccionadoKardex(p)}
                          className="rounded-lg p-1.5 text-blue-400 transition-colors hover:bg-slate-700"
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
                          className="rounded-lg p-1.5 text-amber-400 transition-colors hover:bg-slate-700"
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
                <td colSpan={esAdmin ? 12 : 8} className="p-8 text-center text-slate-400">
                  No se encontraron productos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: crear tienda (nombre + dirección) */}
      {esAdmin && modalTienda && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-600 bg-[#25364B] p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-xl font-bold text-white">
                <Store size={18} className="text-blue-400" />
                {tiendaEditId ? 'Editar tienda' : 'Nueva tienda'}
              </h2>
              <button
                type="button"
                onClick={() => setModalTienda(false)}
                aria-label="Cerrar"
                className="text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={guardarTienda} className="space-y-4">
              <div>
                <label htmlFor="tienda-nombre" className="mb-1 block text-sm text-slate-200">
                  Nombre de la tienda *
                </label>
                <input
                  id="tienda-nombre"
                  type="text"
                  required
                  autoFocus
                  placeholder="Ej: Tienda Centro"
                  value={formTienda.nombre}
                  onChange={(e) => setFormTienda({ ...formTienda, nombre: e.target.value })}
                  className="w-full rounded-lg border border-slate-500 bg-[#0F172A] p-3 text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="tienda-direccion" className="mb-1 block text-sm text-slate-200">
                  Dirección
                </label>
                <input
                  id="tienda-direccion"
                  type="text"
                  placeholder="Ej: Av. Principal #123, Santa Cruz"
                  value={formTienda.direccion}
                  onChange={(e) => setFormTienda({ ...formTienda, direccion: e.target.value })}
                  className="w-full rounded-lg border border-slate-500 bg-[#0F172A] p-3 text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-slate-400">
                  Opcional. Queda guardada en la base de datos junto a la tienda.
                </p>
              </div>

              {errorTienda && (
                <p className="rounded-lg border border-rose-800 bg-rose-950 p-3 text-sm text-rose-200">
                  {errorTienda}
                </p>
              )}

              <div className="flex justify-end gap-3 border-t border-slate-600 pt-4">
                <button
                  type="button"
                  onClick={() => setModalTienda(false)}
                  className="rounded-lg bg-slate-600 px-4 py-2 text-white hover:bg-slate-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoTienda}
                  className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
                >
                  {guardandoTienda
                    ? 'Guardando...'
                    : tiendaEditId ? 'Guardar cambios' : 'Crear tienda'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: editar precio */}
      {esAdmin && productoEditar && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-600 bg-[#25364B] p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4">Editar precio de venta</h2>
            <p className="text-slate-200 mb-3">
              Producto: <strong>{productoEditar.nombre}</strong>
            </p>
            <div className="bg-[#0F172A] p-3 rounded-lg mb-4 text-sm border border-slate-700">
              <p className="text-slate-300">Último costo: ${(productoEditar.costo ?? 0).toFixed(2)}</p>
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
              className="w-full rounded-lg border border-slate-500 bg-[#0F172A] p-3 text-white mb-4"
            />
            {errorPrecio && <p className="text-rose-400 text-sm mb-3">{errorPrecio}</p>}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                disabled={guardandoPrecio}
                onClick={() => setProductoEditar(null)}
                className="rounded-lg bg-slate-600 px-4 py-2 text-white disabled:opacity-50 hover:bg-slate-500"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={guardandoPrecio}
                onClick={actualizarPrecioVenta}
                className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white disabled:opacity-50 hover:bg-blue-500"
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
