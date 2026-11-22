import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Undo2,
  Plus,
  Minus,
  CheckCircle,
  PackageX,
  Receipt,
} from 'lucide-react';

/**
 * DEVOLUCIONES: igual que el Punto de Venta, pero para devolver ventas.
 * - Admin y vendedor, sin restricciones (la tienda del usuario).
 * - Buscas la venta, eliges cuánto devolver de cada producto y registras.
 * - El stock regresa al inventario, queda en la tabla ventas, en el kardex
 *   y el dashboard lo descuenta automáticamente.
 */
export default function DevolucionPro() {
  const [ventas, setVentas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');

  // Venta elegida y sus items con lo que queda por devolver
  const [venta, setVenta] = useState(null);
  const [items, setItems] = useState([]);
  const [cantidades, setCantidades] = useState({});
  const [motivo, setMotivo] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [exito, setExito] = useState(null);

  const cargarVentas = async () => {
    setCargando(true);
    setError('');
    try {
      const respuesta = await fetch('/devoluciones/ventas', {
        credentials: 'include',
      });
      const datos = await respuesta.json();
      if (!respuesta.ok) throw new Error(datos.error || 'No se pudieron cargar las ventas');
      setVentas(datos);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarVentas();
  }, []);

  // Carga el detalle de la venta con lo disponible para devolver
  const elegirVenta = async (idVenta) => {
    setError('');
    setExito(null);
    try {
      const respuesta = await fetch(`/devoluciones/venta/${idVenta}`, {
        credentials: 'include',
      });
      const datos = await respuesta.json();
      if (!respuesta.ok) throw new Error(datos.error || 'No se pudo abrir la venta');
      setVenta(datos.venta);
      setItems(datos.items || []);
      setCantidades({});
    } catch (err) {
      setError(err.message);
    }
  };

  const cambiarCantidad = (item, cambio) => {
    setCantidades((anterior) => {
      const actual = anterior[item.id_detalle] || 0;
      const nueva = Math.max(0, Math.min(item.disponible, actual + cambio));
      return { ...anterior, [item.id_detalle]: nueva };
    });
  };

  const subtotalADevolver = items.reduce(
    (acc, item) => acc + (cantidades[item.id_detalle] || 0) * Number(item.precio_venta_real || 0),
    0
  );
  const recargo = venta && Number(venta.con_factura) === 1
    ? subtotalADevolver * 0.13
    : 0;
  const totalADevolver = subtotalADevolver + recargo;
  const cantidadItems = items.reduce(
    (acc, item) => acc + (cantidades[item.id_detalle] || 0), 0
  );

  const registrarDevolucion = async (e) => {
    e.preventDefault();
    if (guardando || !venta || cantidadItems === 0) return;
    setGuardando(true);
    setError('');
    try {
      const detalles = items
        .filter((item) => (cantidades[item.id_detalle] || 0) > 0)
        .map((item) => ({
          id_detalle_origen: item.id_detalle,
          cantidad: cantidades[item.id_detalle],
        }));

      const respuesta = await fetch('/devoluciones', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_venta_origen: venta.id,
          motivo: motivo.trim(),
          detalles,
        }),
      });
      const datos = await respuesta.json();
      if (!respuesta.ok) throw new Error(datos.error || 'No se pudo registrar la devolución');

      setExito(datos);
      setVenta(null);
      setItems([]);
      setCantidades({});
      setMotivo('');
      await cargarVentas();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const ventasFiltradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return ventas;
    return ventas.filter((v) =>
      `#${v.id} ${v.nombre_cliente || ''} ${v.productos || ''} ${v.vendedor || ''}`
        .toLowerCase()
        .includes(texto)
    );
  }, [ventas, busqueda]);

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)] bg-slate-900 overflow-hidden">

      {/* Mensajes de estado */}
      {error && (
        <div role="alert" className="absolute top-2 left-1/2 -translate-x-1/2 z-40 bg-red-100 border border-red-300 text-red-800 px-4 py-2 rounded-lg shadow-lg max-w-lg">
          {error}
        </div>
      )}

      {/* SECCIÓN IZQUIERDA: Ventas realizadas */}
      <div className="flex-1 p-6 flex flex-col overflow-hidden">

        <div className="mb-6 flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Devoluciones</h1>
            <p className="text-slate-200 text-xs">
              Busca la venta y devuelve productos: el stock regresa al inventario.
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Busca por N.º de venta, cliente o producto..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-300 border border-slate-100 rounded-xl text-sm text-slate-900 font-semibold placeholder:font-normal placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            />
          </div>
        </div>

        {/* Lista de ventas */}
        <div className="flex-1 overflow-y-auto pr-2">
          <div className="bg-slate-300 rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-800 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-100">N.º Venta</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-100">Fecha</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-100">Cliente</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-100">Productos</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-100 text-right">Total</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-100 text-right">Devuelto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ventasFiltradas.map((v) => (
                  <tr
                    key={v.id}
                    onClick={() => elegirVenta(v.id)}
                    className={`cursor-pointer transition-colors ${
                      venta && venta.id === v.id ? 'bg-blue-100' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="px-4 py-3">
                      <span className="text-sm font-mono font-bold text-slate-900">#{v.id}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-700">{v.fecha || '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-semibold text-slate-900">
                        {v.nombre_cliente || 'Consumidor final'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-700 line-clamp-1">
                        {v.productos || 'Sin productos'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-bold text-slate-900">
                        Bs {Number(v.total || 0).toFixed(2)}
                      </span>
                      {Number(v.con_factura) === 1 && (
                        <span className="block text-[10px] text-slate-500">con factura</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {Number(v.devuelto || 0) > 0 ? (
                        <span className="text-[12px] px-2 py-1 rounded-md font-bold bg-amber-100 text-red-600">
                          Bs {Number(v.devuelto).toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-[12px] px-2 py-1 rounded-md font-bold bg-slate-100 text-black">
                          Bs 0.00
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {cargando && (
                  <tr><td colSpan={6} className="p-4 text-center">Cargando ventas...</td></tr>
                )}
                {!cargando && ventasFiltradas.length === 0 && (
                  <tr><td colSpan={6} className="p-4 text-center">No hay ventas para devolver.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SECCIÓN DERECHA: Orden de Devolución */}
      <div className="w-full lg:w-[26rem] bg-slate-00 border-l border-slate-200 flex flex-col h-full shadow-lg">

        <div className="p-3 border-b border-slate-200 flex items-center gap-2 bg-slate-500 shrink-0">
          <Undo2 className="text-red-500" size={25} />
          <h2 className="font-bold text-slate-100">Orden de Devolución</h2>
          {venta && (
            <span className="ml-auto bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">
              Venta #{venta.id}
            </span>
          )}
        </div>

        {/* Items de la venta con cantidades a devolver */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3 divide-y divide-slate-100">
          {!venta ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-6">
              <PackageX size={48} className="mb-2 stroke-1 text-red-500" />
              <p className="text-sm text-slate-300">Selecciona una venta de la lista</p>
              <p className="text-xs text-slate-400 mt-1">
                Haz clic en una venta para ver sus productos y devolver
              </p>
            </div>
          ) : (
            items.map((item) => {
              const cantidad = cantidades[item.id_detalle] || 0;
              const agotado = item.disponible <= 0;
              return (
                <div key={item.id_detalle} className="pt-3 first:pt-0">
                  <div className="flex justify-between items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-slate-100 truncate">
                        {item.producto}
                      </h4>
                      <span className="text-xs text-slate-100">
                        Bs {Number(item.precio_venta_real || 0).toFixed(2)} c/u
                      </span>
                      {agotado ? (
                        <span className="block text-[10px] font-bold text-amber-600">
                          Ya se devolvió todo
                        </span>
                      ) : (
                        <span className="block text-[10px] text-slate-600">
                          Vendidos: {item.cantidad} · Disponibles para devolver: {item.disponible}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <div className={`flex items-center border border-blue-500 rounded-lg bg-slate-200 h-7 ${agotado ? 'opacity-40' : ''}`}>
                        <button
                          type="button"
                          disabled={agotado || cantidad === 0}
                          onClick={() => cambiarCantidad(item, -1)}
                          className="px-1.5 h-full hover:bg-slate-400 text-slate-900 rounded-l-lg disabled:opacity-50"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="px-1 text-xs font-bold text-black leading-none">
                          {cantidad}
                        </span>
                        <button
                          type="button"
                          disabled={agotado || cantidad >= item.disponible}
                          onClick={() => cambiarCantidad(item, 1)}
                          className="px-1.5 h-full hover:bg-slate-400 text-slate-900 rounded-r-lg disabled:opacity-50"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Motivo y totales: siempre visibles, sin scroll interno */}
        <form onSubmit={registrarDevolucion} className="px-4 py-2.5 border-t border-slate-100 bg-slate-300 space-y-2 shrink-0">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Motivo de la devolución
            </label>
            <input
              type="text"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej: producto defectuoso, cambio..."
              className={`w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm ${
                motivo.trim() === '' ? 'text-slate-500' : 'text-slate-900 font-semibold'
              }`}
            />
          </div>

          <div className="space-y-0.5 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Subtotal a devolver:</span>
              <span>Bs {subtotalADevolver.toFixed(2)}</span>
            </div>
            {recargo > 0 && (
              <div className="flex justify-between">
                <span>Recargo de la factura (13%):</span>
                <span>Bs {recargo.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-900">
              <span>Total a devolver:</span>
              <span className="text-red-600">Bs {totalADevolver.toFixed(2)}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={!venta || cantidadItems === 0 || guardando}
            className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Undo2 size={18} />
            {guardando
              ? 'Registrando devolución...'
              : `Registrar devolución (${cantidadItems} ítem${cantidadItems === 1 ? '' : 's'})`}
          </button>
          {venta && cantidadItems === 0 && (
            <p className="text-[11px] text-center text-slate-500">
              Sube la cantidad a devolver de al menos un producto
            </p>
          )}
        </form>
      </div>

      {/* Modal de confirmación */}
      {exito && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-800">¡Devolución Registrada!</h3>
            <p className="text-xs text-slate-500 mt-1">
              El stock devuelto regresó al inventario automáticamente.
            </p>

            <p className="text-xs text-slate-600 mt-2">
              Devolución #{exito.id_devolucion} de la venta #{exito.id_venta_origen}.
            </p>
            <div className="my-4 p-3 bg-slate-50 rounded-lg text-left text-xs space-y-1 border border-slate-200">
              <div className="flex justify-between text-slate-600">
                <span>Total devuelto:</span>
                <strong className="text-slate-800">
                  Bs {Number(exito.total_devuelto || 0).toFixed(2)}
                </strong>
              </div>
              {(exito.items_devueltos || []).map((item) => (
                <div key={item.id_producto} className="flex justify-between text-slate-600">
                  <span className="truncate">{item.cantidad} × {item.producto}</span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setExito(null)}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2"
            >
              <Receipt size={16} /> Aceptar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
