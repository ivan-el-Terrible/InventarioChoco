import React, { useEffect, useState } from 'react';
import {
  X, ArrowUpRight, ArrowDownLeft, FileText,
  Search, ClipboardList, Package, RotateCcw, Printer
} from 'lucide-react';
import SelectorTienda from '../../components/SelectorTienda';
import { imprimirDocumento, escapar } from '../../utils/impresion';

const API = '';

function adaptarMovimiento(m) {
  const tipoOriginal = String(m.tipo_movimiento ?? '').toLowerCase();
  // Tipos de la base en la nube: compra, venta, devolucion, ajuste_entrada,
  // ajuste_salida, traspaso_entrada, traspaso_salida, carga_inicial.
  const esEntrada = tipoOriginal.includes('entrada')
    || tipoOriginal.includes('compra')
    || tipoOriginal.includes('carga_inicial')
    || tipoOriginal.includes('devolucion');
  const esSalida = tipoOriginal.includes('salida')
    || tipoOriginal.includes('venta');
  const tipo = esEntrada
    ? 'Entrada'
    : esSalida
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
      entrada ? 'bg-emerald-900 text-emerald-200' :
      salida ? 'bg-amber-900 text-amber-200' : 'bg-slate-600 text-slate-200'
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
  const [tiendaSeleccionada, setTiendaSeleccionada] = useState('');
  const [tiendas, setTiendas] = useState([]);
  const urlKardex = tiendaSeleccionada
    ? `${API}/kardex?id_tienda=${encodeURIComponent(tiendaSeleccionada)}`
    : `${API}/kardex`;
  const { movimientos, cargando, error } = useMovimientos(urlKardex);

  // Nombres de tiendas para mostrar en la impresión (solo admin).
  useEffect(() => {
    let activo = true;
    (async () => {
      try {
        const respuesta = await fetch('/tiendas', { credentials: 'include' });
        if (!respuesta.ok) return;
        const datos = await respuesta.json();
        if (activo && Array.isArray(datos)) setTiendas(datos);
      } catch {
        /* sin tiendas: se usa la etiqueta por defecto */
      }
    })();
    return () => { activo = false; };
  }, []);

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

  // Imprime el Kardex filtrado (solo admin: la ruta es de administrador).
  const imprimirKardex = () => {
    const nombreTienda = tiendaSeleccionada
      ? (tiendas.find((t) => String(t.id) === String(tiendaSeleccionada))?.nombre || `Tienda #${tiendaSeleccionada}`)
      : 'Mi tienda (por defecto)';

    const filtros = [
      `Tienda: ${nombreTienda}`,
      busqueda.trim() ? `Búsqueda: "${busqueda.trim()}"` : null,
      tipoFiltro !== 'Todos' ? `Tipo: ${tipoFiltro}` : null,
      fechaInicio || fechaFin
        ? `Período: ${fechaInicio || '...'} a ${fechaFin || '...'}`
        : null
    ].filter(Boolean).join(' · ');

    const filas = movimientosFiltrados.map((m) => `
      <tr>
        <td>${escapar(m.fecha)}</td>
        <td>${escapar(m.codOrigen || '—')}</td>
        <td>${escapar(m.codigo || '—')}</td>
        <td>${escapar(m.producto)}</td>
        <td class="ctr">${escapar(m.tipo)}</td>
        <td>${escapar(m.detalle)}</td>
        <td class="num">${m.tipo === 'Entrada' ? '+' : m.tipo === 'Salida' ? '-' : ''}${m.cantidad}</td>
        <td class="num">${m.precioCompra == null ? '—' : `Bs ${m.precioCompra.toFixed(2)}`}</td>
        <td class="num">${m.saldoAnterior}</td>
        <td class="num">${m.saldoNuevo}</td>
      </tr>`).join('');

    imprimirDocumento({
      titulo: 'Kardex general',
      subtitulo: filtros,
      encabezado: `Fecha de impresión: ${new Date().toLocaleString('es-BO')} · ${movimientosFiltrados.length} movimiento(s) · Entradas: ${entradas} · Salidas: ${salidas}`,
      tabla: `
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Cod. Origen</th>
              <th>Código</th>
              <th>Producto</th>
              <th class="ctr">Movimiento</th>
              <th>Documento</th>
              <th class="num">Cantidad</th>
              <th class="num">P. Compra</th>
              <th class="num">S. Anterior</th>
              <th class="num">S. Nuevo</th>
            </tr>
          </thead>
          <tbody>${filas}</tbody>
        </table>`,
      pie: 'InventarioChoco · Método de valoración: Costo Promedio Ponderado.'
    });
  };

  return (
    <div className="p-6 space-y-6 bg-[#0F172A] min-h-screen text-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <ClipboardList className="text-yellow-500" size={30} />
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Kardex General</h1>
            <p className="text-sm text-slate-400 mt-1">Historial de compras, ventas y movimientos de todos los productos.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <SelectorTienda
            valor={tiendaSeleccionada}
            onChange={setTiendaSeleccionada}
          />
          <button
            type="button"
            onClick={imprimirKardex}
            disabled={movimientosFiltrados.length === 0}
            title="Imprimir el Kardex filtrado"
            className="flex items-center gap-2 bg-slate-600 hover:bg-slate-500 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-md disabled:opacity-50"
          >
            <Printer size={17} /> Imprimir Kardex
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-lg border border-rose-800 bg-rose-950 p-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-700 bg-[#1E293B] p-5">
          <div className="flex items-center gap-2 text-emerald-400"><ArrowDownLeft size={20} /><span className="font-semibold">Entradas</span></div>
          <p className="text-3xl font-bold mt-3">{entradas}</p>
          <p className="text-xs text-slate-400">Unidades ingresadas</p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-[#1E293B] p-5">
          <div className="flex items-center gap-2 text-rose-400"><ArrowUpRight size={20} /><span className="font-semibold">Salidas</span></div>
          <p className="text-3xl font-bold mt-3">{salidas}</p>
          <p className="text-xs text-slate-400">Unidades retiradas</p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-[#1E293B] p-5">
          <div className="flex items-center gap-2 text-blue-400"><Package size={20} /><span className="font-semibold">Movimientos</span></div>
          <p className="text-3xl font-bold mt-3">{movimientosFiltrados.length}</p>
          <p className="text-xs text-slate-400">Registros encontrados</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-700 bg-[#1E293B] p-5">
        <h2 className="font-bold text-slate-100 mb-4">Filtros de búsqueda</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div>
            <label className="text-xs text-slate-300">Buscar producto</label>
            <div className="relative mt-1">
              <Search size={17} className="absolute left-3 top-3 text-slate-400" />
              <input type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)}
                placeholder="Nombre, código o código original"
                className="w-full rounded-lg border border-slate-500 bg-[#0F172A] py-2.5 pl-10 pr-3 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-300">Tipo de movimiento</label>
            <select value={tipoFiltro} onChange={e => setTipoFiltro(e.target.value)}
              className="w-full mt-1 rounded-lg border border-slate-500 bg-[#0F172A] p-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500">
              <option value="Todos">Todos</option>
              <option value="Entrada">Entradas / Compras</option>
              <option value="Salida">Salidas / Ventas</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-300">Fecha desde</label>
            <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)}
              className="w-full mt-1 rounded-lg border border-slate-500 bg-[#0F172A] p-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="text-xs text-slate-300">Fecha hasta</label>
            <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)}
              className="w-full mt-1 rounded-lg border border-slate-500 bg-[#0F172A] p-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <button onClick={limpiarFiltros}
          className="mt-4 flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300 font-semibold">
          <RotateCcw size={15} /> Limpiar filtros
        </button>
      </div>

      <div className="rounded-xl border border-slate-700 bg-[#1E293B] overflow-hidden">
        <div className="p-5 border-b border-slate-700">
          <h2 className="font-bold text-slate-100">Historial de movimientos</h2>
          <p className="text-xs text-slate-400 mt-1">Entradas y salidas de todos los productos</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#334155] text-slate-200">
              <tr>
                <th className="p-4">Fecha</th>
                <th className="p-4">Cod_Origen</th>
                <th className="p-4">Código</th>
                <th className="p-4">Producto</th>
                <th className="p-4">Movimiento</th>
                <th className="p-4">Documento</th>
                <th className="p-4 text-right">Cantidad</th>
                <th className="p-4 text-right">P. Compra</th>
                <th className="p-4 text-right">S. anterior</th>
                <th className="p-4 text-right">S. nuevo</th>
              </tr>
            </thead>
            <tbody>
              {movimientosFiltrados.map(m => (
                <tr key={m.id} className="border-t border-slate-700 hover:bg-slate-700/30">
                  <td className="p-4 whitespace-nowrap text-slate-400">{m.fecha}</td>
                  <td className="p-4 font-mono text-slate-300">{m.codOrigen || '—'}</td>
                  <td className="p-4 font-mono text-slate-300">{m.codigo}</td>
                  <td className="p-4 font-semibold">{m.producto}</td>
                  <td className="p-4"><EtiquetaTipo tipo={m.tipo} /></td>
                  <td className="p-4 text-slate-300">{m.detalle}</td>
                  <td className={`p-4 text-right font-bold ${m.tipo === 'Entrada' ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {m.tipo === 'Entrada' ? '+' : m.tipo === 'Salida' ? '-' : ''}{m.cantidad}
                  </td>
                  <td className="p-4 text-right whitespace-nowrap text-slate-300">{formatoPrecio(m.precioCompra)}</td>
                  <td className="p-4 text-right text-slate-300">{m.saldoAnterior}</td>
                  <td className="p-4 text-right font-bold">{m.saldoNuevo}</td>
                </tr>
              ))}
              {!cargando && !error && movimientosFiltrados.length === 0 && (
                <tr><td colSpan={10} className="p-8 text-center text-slate-400">No se encontraron movimientos.</td></tr>
              )}
              {cargando && <tr><td colSpan={10} className="p-8 text-center text-slate-400">Cargando movimientos...</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-slate-700 bg-[#0F172A] text-xs text-slate-400">
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
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-[#1E293B] rounded-2xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-600">
        <div className="p-6 bg-[#334155] text-white flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-blue-500/20 text-blue-300 text-xs px-2 py-0.5 rounded font-mono">{producto.codigo}</span>
              <h2 className="text-xl font-bold">{producto.nombre}</h2>
            </div>
            <p className="text-slate-300 text-sm mt-1">Historial de movimientos y auditoría de stock</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar Kardex"
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-300 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-[#0F172A] border-b border-slate-700 text-sm">
          <div>
            <p className="text-slate-400 text-xs">Stock Actual:</p>
            <p className="text-lg font-bold text-slate-100">{producto.stock} Unidades</p>
          </div>
          <div>
            <p className="text-slate-400 text-xs">Precio Compra Actual:</p>
            <p className="text-lg font-bold text-slate-100">{formatoPrecio(Number(producto.costo))}</p>
          </div>
          <div>
            <p className="text-slate-400 text-xs">Costo Promedio:</p>
            <p className="text-lg font-bold text-slate-100">{formatoPrecio(Number(producto.costoPromedio))}</p>
          </div>
          <div>
            <p className="text-slate-400 text-xs">Precio de Venta:</p>
            <p className="text-lg font-bold text-emerald-400">{formatoPrecio(Number(producto.precio))}</p>
          </div>
        </div>

        <div className="p-6 overflow-auto flex-1">
          {error && <p role="alert" className="mb-4 rounded-lg border border-rose-800 bg-rose-950 p-3 text-rose-200">{error}</p>}
          <table className="w-full text-left text-sm">
            <thead className="bg-[#334155] text-slate-200">
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
            <tbody>
              {movimientos.map(m => (
                <tr key={m.id} className="border-t border-slate-700 hover:bg-slate-700/30">
                  <td className="p-3 font-mono text-xs text-slate-400">{m.fecha}</td>
                  <td className="p-3"><EtiquetaTipo tipo={m.tipo} /></td>
                  <td className="p-3 font-medium text-slate-300">{m.detalle}</td>
                  <td className={`p-3 text-right font-bold ${m.tipo === 'Entrada' ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {m.tipo === 'Entrada' ? '+' : m.tipo === 'Salida' ? '-' : ''}{m.cantidad}
                  </td>
                  <td className="p-3 text-right text-slate-300">{formatoPrecio(m.precioCompra)}</td>
                  <td className="p-3 text-right text-slate-400">{m.saldoAnterior}</td>
                  <td className="p-3 text-right font-bold text-slate-100">{m.saldoNuevo}</td>
                </tr>
              ))}
              {cargando && <tr><td colSpan={7} className="p-8 text-center text-slate-400">Cargando movimientos...</td></tr>}
              {!cargando && !error && movimientos.length === 0 &&
                <tr><td colSpan={7} className="p-8 text-center text-slate-400">Este producto no tiene movimientos registrados.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-slate-700 bg-[#0F172A] flex justify-between items-center text-xs text-slate-400">
          <span className="flex items-center gap-1"><FileText size={14} /> Método de valoración: Costo Promedio Ponderado</span>
          <button type="button" onClick={onClose}
            className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg font-medium transition-colors">
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
