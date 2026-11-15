import React, { useEffect, useState } from 'react';
import {
  X, ArrowUpRight, ArrowDownLeft, FileText,
  Search, ClipboardList, Package, RotateCcw
} from 'lucide-react';

const API = '';

function adaptarMovimiento(m) {
  const tipoOriginal = String(m.tipo_movimiento ?? '').toLowerCase();
  const tipo = tipoOriginal.includes('entrada') || tipoOriginal.includes('compra')
    ? 'Entrada'
    : tipoOriginal.includes('salida') || tipoOriginal.includes('venta')
      ? 'Salida'
      : String(m.tipo_movimiento ?? 'Otro');
  return {
    id: m.id,
    fecha: String(m.fecha ?? ''),
    codOrigen: m.codOrigi ?? '',
    codigo: m.codigo ?? '',
    producto: m.producto ?? '',
    tipo,
    detalle: [m.motivo, m.referencia_id != null ? `Ref. #${m.referencia_id}` : '']
      .filter(Boolean).join(' · ') || 'Sin documento',
    cantidad: Number(m.cantidad ?? 0),
    saldoAnterior: Number(m.stock_anterior ?? 0),
    saldoNuevo: Number(m.stock_nuevo ?? 0),
    precioCompra: m.precio_unitario == null ? null : Number(m.precio_unitario),
  };
}

function formatoPrecio(valor) {
  return valor == null || !Number.isFinite(valor) ? '—' : `Bs ${valor.toFixed(2)}`;
}

function useMovimientos(url) {
  const [movimientos, setMovimientos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!url) return;
    const controlador = new AbortController();
    async function cargar() {
      setCargando(true);
      setError('');
      try {
        const respuesta = await fetch(url, {
          credentials: 'include',
          signal: controlador.signal,
        });
        const datos = await respuesta.json();
        if (!respuesta.ok) {
          throw new Error(datos.error || `No se pudo cargar el Kardex (${respuesta.status}).`);
        }
        if (!Array.isArray(datos)) throw new Error('Respuesta inesperada del servidor.');
        setMovimientos(datos.map(adaptarMovimiento));
      } catch (err) {
        if (err.name !== 'AbortError') setError(err.message);
      } finally {
        if (!controlador.signal.aborted) setCargando(false);
      }
    }
    cargar();
    return () => controlador.abort();
  }, [url]);
  return { movimientos, cargando, error };
}

function EtiquetaTipo({ tipo }) {
  const entrada = tipo === 'Entrada';
  const salida = tipo === 'Salida';
  return (
    <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold ${
      entrada ? 'bg-emerald-100 text-emerald-700' :
      salida ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-700'
    }`}>
      {entrada ? <ArrowDownLeft size={14} /> : salida ? <ArrowUpRight size={14} /> : null}
      {tipo}
    </span>
  );
}

function KardexGeneral() {
  const [busqueda, setBusqueda] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('Todos');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const { movimientos, cargando, error } = useMovimientos(`${API}/kardex`);

  const movimientosFiltrados = movimientos.filter(m => {
    const texto = busqueda.trim().toLowerCase();
    const coincideBusqueda = [m.producto, m.codigo, m.codOrigen]
      .some(campo => String(campo).toLowerCase().includes(texto));
    const coincideTipo = tipoFiltro === 'Todos' || m.tipo === tipoFiltro;
    const fecha = m.fecha.slice(0, 10);
    return coincideBusqueda && coincideTipo &&
      (!fechaInicio || fecha >= fechaInicio) && (!fechaFin || fecha <= fechaFin);
  });

  const entradas = movimientosFiltrados.filter(m => m.tipo === 'Entrada')
    .reduce((total, m) => total + m.cantidad, 0);
  const salidas = movimientosFiltrados.filter(m => m.tipo === 'Salida')
    .reduce((total, m) => total + m.cantidad, 0);

  const limpiarFiltros = () => {
    setBusqueda(''); setTipoFiltro('Todos'); setFechaInicio(''); setFechaFin('');
  };

  return (
    <div className="p-4 md:p-8 space-y-6 bg-slate-900 min-h-screen">
      <div className="flex items-center gap-3">
        <ClipboardList className="text-yellow-500" size={30} />
        <div>
          <h1 className="text-2xl font-bold text-slate-200">Kardex General</h1>
          <p className="text-sm text-slate-300 mt-1">Historial de compras, ventas y movimientos de todos los productos.</p>
        </div>
      </div>

      {error && <div role="alert" className="rounded-xl border border-white bg-red-50 p-3 text-sm text-red-100">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-300 rounded-xl shadow-sm border p-5">
          <div className="flex items-center gap-2 text-emerald-600"><ArrowDownLeft size={20} /><span className="font-semibold">Entradas</span></div>
          <p className="text-3xl font-bold mt-3">{entradas}</p>
          <p className="text-xs text-slate-900">Unidades ingresadas</p>
        </div>
        <div className="bg-slate-300 rounded-xl shadow-sm border p-5">
          <div className="flex items-center gap-2 text-red-600"><ArrowUpRight size={20} /><span className="font-semibold">Salidas</span></div>
          <p className="text-3xl font-bold mt-3">{salidas}</p>
          <p className="text-xs text-slate-900">Unidades retiradas</p>
        </div>
        <div className="bg-slate-300 rounded-xl shadow-sm border p-5">
          <div className="flex items-center gap-2 text-blue-600"><Package size={20} /><span className="font-semibold">Movimientos</span></div>
          <p className="text-3xl font-bold mt-3">{movimientosFiltrados.length}</p>
          <p className="text-xs text-slate-900">Registros encontrados</p>
        </div>
      </div>

      <div className="bg-slate-300 rounded-xl border shadow-sm p-5">
        <h2 className="font-bold text-slate-900 mb-4">Filtros de búsqueda</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div>
            <label className="text-xs text-slate-800">Buscar producto</label>
            <div className="relative mt-1">
              <Search size={17} className="absolute left-3 top-3 text-slate-400" />
              <input type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)}
                placeholder="Nombre, código o código original"
                className="w-full border rounded-lg py-2.5 pl-10 pr-3 text-sm" />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-800">Tipo de movimiento</label>
            <select value={tipoFiltro} onChange={e => setTipoFiltro(e.target.value)}
              className="w-full mt-1 border rounded-lg p-2.5 text-sm bg-white">
              <option value="Todos">Todos</option>
              <option value="Entrada">Entradas / Compras</option>
              <option value="Salida">Salidas / Ventas</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-800">Fecha desde</label>
            <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)}
              className="w-full mt-1 border rounded-lg p-2.5 text-sm" />
          </div>
          <div>
            <label className="text-xs text-slate-800">Fecha hasta</label>
            <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)}
              className="w-full mt-1 border rounded-lg p-2.5 text-sm" />
          </div>
        </div>
        <button onClick={limpiarFiltros}
          className="mt-4 flex items-center gap-2 text-sm text-orange-600 hover:text-orange-700 font-semibold">
          <RotateCcw size={15} /> Limpiar filtros
        </button>
      </div>

      <div className="bg-slate-300 rounded-xl border shadow-sm overflow-hidden">
        <div className="p-5 border-b">
          <h2 className="font-bold text-slate-800">Historial de movimientos</h2>
          <p className="text-xs text-slate-500 mt-1">Entradas y salidas de todos los productos</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="p-3">Fecha</th>
                <th className="p-3">Cod_Origen</th>
                <th className="p-3">Código</th>
                <th className="p-3">Producto</th>
                <th className="p-3">Movimiento</th>
                <th className="p-3">Documento</th>
                <th className="p-3 text-right">Cantidad</th>
                <th className="p-3 text-right">P. Compra</th>
                <th className="p-3 text-right">S. anterior</th>
                <th className="p-3 text-right">S. nuevo</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {movimientosFiltrados.map(m => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="p-3 whitespace-nowrap text-slate-500">{m.fecha}</td>
                  <td className="p-3 font-mono">{m.codOrigen || '—'}</td>
                  <td className="p-3 font-mono">{m.codigo}</td>
                  <td className="p-3 font-semibold">{m.producto}</td>
                  <td className="p-3"><EtiquetaTipo tipo={m.tipo} /></td>
                  <td className="p-3">{m.detalle}</td>
                  <td className={`p-3 text-right font-bold ${m.tipo === 'Entrada' ? 'text-emerald-600' : 'text-orange-600'}`}>
                    {m.tipo === 'Entrada' ? '+' : m.tipo === 'Salida' ? '-' : ''}{m.cantidad}
                  </td>
                  <td className="p-3 text-right whitespace-nowrap">{formatoPrecio(m.precioCompra)}</td>
                  <td className="p-3 text-right">{m.saldoAnterior}</td>
                  <td className="p-3 text-right font-bold">{m.saldoNuevo}</td>
                </tr>
              ))}
              {!cargando && !error && movimientosFiltrados.length === 0 && (
                <tr><td colSpan={10} className="p-10 text-center text-slate-500">No se encontraron movimientos.</td></tr>
              )}
              {cargando && <tr><td colSpan={10} className="p-10 text-center text-slate-500">Cargando movimientos...</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-slate-50 border-t text-xs text-slate-500">
          Mostrando {movimientosFiltrados.length} movimientos. Los saldos corresponden a cada producto individual.
        </div>
      </div>
    </div>
  );
}

function KardexIndividual({ producto, onClose }) {
  const { movimientos, cargando, error } = useMovimientos(
    `${API}/kardex/producto/${producto.id}`
  );
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-300 rounded-2xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="p-6 bg-slate-800 text-white flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-blue-500/20 text-blue-300 text-xs px-2 py-0.5 rounded font-mono">{producto.codigo}</span>
              <h2 className="text-xl font-bold">{producto.nombre}</h2>
            </div>
            <p className="text-slate-400 text-sm mt-1">Historial de movimientos y auditoría de stock</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar Kardex"
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-300 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 border-b border-slate-200 text-sm">
          <div>
            <p className="text-slate-500 text-xs">Stock Actual:</p>
            <p className="text-lg font-bold text-slate-800">{producto.stock} Unidades</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs">Precio Compra Actual:</p>
            <p className="text-lg font-bold text-slate-800">{formatoPrecio(Number(producto.costo))}</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs">Costo Promedio:</p>
            <p className="text-lg font-bold text-slate-800">{formatoPrecio(Number(producto.costoPromedio))}</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs">Precio de Venta:</p>
            <p className="text-lg font-bold text-emerald-600">{formatoPrecio(Number(producto.precio))}</p>
          </div>
        </div>

        <div className="p-6 overflow-auto flex-1">
          {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-red-700">{error}</p>}
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">Fecha y Hora</th>
                <th className="p-3">Tipo</th>
                <th className="p-3">Detalle / Documento</th>
                <th className="p-3 text-right">Cant.</th>
                <th className="p-3 text-right">P. Compra</th>
                <th className="p-3 text-right">S. Anterior</th>
                <th className="p-3 text-right">S. Nuevo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {movimientos.map(m => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="p-3 font-mono text-xs text-slate-500">{m.fecha}</td>
                  <td className="p-3"><EtiquetaTipo tipo={m.tipo} /></td>
                  <td className="p-3 font-medium text-slate-700">{m.detalle}</td>
                  <td className={`p-3 text-right font-bold ${m.tipo === 'Entrada' ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {m.tipo === 'Entrada' ? '+' : m.tipo === 'Salida' ? '-' : ''}{m.cantidad}
                  </td>
                  <td className="p-3 text-right">{formatoPrecio(m.precioCompra)}</td>
                  <td className="p-3 text-right text-slate-500">{m.saldoAnterior}</td>
                  <td className="p-3 text-right font-bold text-slate-800">{m.saldoNuevo}</td>
                </tr>
              ))}
              {cargando && <tr><td colSpan={7} className="p-8 text-center text-slate-500">Cargando movimientos...</td></tr>}
              {!cargando && !error && movimientos.length === 0 &&
                <tr><td colSpan={7} className="p-8 text-center text-slate-500">Este producto no tiene movimientos registrados.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center text-xs text-slate-500">
          <span className="flex items-center gap-1"><FileText size={14} /> Método de valoración: Costo Promedio Ponderado</span>
          <button type="button" onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium transition-colors">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Kardex({ producto, onClose }) {
  if (!producto) return <KardexGeneral />;
  return <KardexIndividual producto={producto} onClose={onClose} />;
}
