import React, { useEffect, useMemo, useState } from 'react';
import { ReceiptText, Users, DollarSign, Trash2, X, ShieldAlert, Printer, FileSpreadsheet } from 'lucide-react';
import useAutoRefetch from '../hooks/useAutoRefetch';
import SelectorTienda from '../components/SelectorTienda';
import AvisoPurga from '../components/AvisoPurga';
import { imprimirDocumento, escapar } from '../utils/impresion';
import { generarExcel } from '../utils/excel';

const API = '';

export default function VentasVendedores() {
  const [ventas, setVentas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [vendedor, setVendedor] = useState('todos');
  const [tiendaSeleccionada, setTiendaSeleccionada] = useState('');
  const [error, setError] = useState('');
  const [tiendas, setTiendas] = useState([]);
  const [exportando, setExportando] = useState(false);

  // Purga de registros con más de 3 meses (solo admin).
  const [modalPurga, setModalPurga] = useState(false);
  const [previa, setPrevia] = useState(null);
  const [cargandoPrevia, setCargandoPrevia] = useState(false);
  const [purgando, setPurgando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [errorPurga, setErrorPurga] = useState('');

  const cargarDatos = async () => {
    try {
      const queryVentas = tiendaSeleccionada
        ? `?id_tienda=${encodeURIComponent(tiendaSeleccionada)}`
        : '';
      const [resVentas, resUsuarios] = await Promise.all([
        fetch(`${API}/ventas${queryVentas}`, { credentials: 'include' }),
        fetch(`${API}/usuarios`, { credentials: 'include' })
      ]);

      const datosVentas = await resVentas.json();
      const datosUsuarios = await resUsuarios.json();

      if (!resVentas.ok || !resUsuarios.ok) {
        throw new Error('No se pudieron cargar las ventas');
      }

      setVentas(datosVentas);
      setUsuarios(datosUsuarios);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [tiendaSeleccionada]);

  // Nombres de tiendas para la impresion y el Excel (mismo selector).
  useEffect(() => {
    let activo = true;
    (async () => {
      try {
        const r = await fetch(`${API}/tiendas`, { credentials: 'include' });
        if (!r.ok) return;
        const datos = await r.json();
        if (activo && Array.isArray(datos)) setTiendas(datos);
      } catch {
        /* sin nombres: se muestra el id */
      }
    })();
    return () => { activo = false; };
  }, []);

  // Las ventas nuevas aparecen solas sin recargar la página.
  useAutoRefetch(cargarDatos, 30000);

  const vendedores = usuarios.filter((u) => u.rol === 'vendedor' || u.rol === 'admin');

  const ventasFiltradas = useMemo(() => {
    let lista = ventas;
    if (vendedor !== 'todos') {
      lista = lista.filter((v) => String(v.id_vendedor) === vendedor);
    }
    return lista;
  }, [ventas, vendedor]);

  // Total neto: las devoluciones se descuentan de lo vendido.
  const total = ventasFiltradas.reduce(
    (acumulado, v) => acumulado + (v.tipo === 'devolucion'
      ? -Number(v.total || 0)
      : Number(v.total || 0)),
    0
  );
  const cantidadDevoluciones = ventasFiltradas.filter(
    (v) => v.tipo === 'devolucion'
  ).length;

  const nombreVendedor = (id) =>
    usuarios.find((u) => u.id === id)?.nombre || 'Sin asignar';

  // Etiqueta del vendedor elegido en el filtro (para impresion y Excel).
  const etiquetaVendedor = () => {
    if (vendedor === 'todos') return 'Todos los usuarios';
    const u = vendedores.find((x) => String(x.id) === String(vendedor));
    return u ? u.nombre : `Usuario #${vendedor}`;
  };

  // Nombre de la tienda elegida en el filtro.
  const nombreTiendaActual = () => {
    const t = tiendas.find((x) => String(x.id) === String(tiendaSeleccionada));
    return t ? t.nombre : 'Tienda por defecto';
  };

  // Imprime las ventas del vendedor/tienda elegidos en los filtros.
  const imprimirVentas = () => {
    const filas = ventasFiltradas.map((v) => `
      <tr>
        <td>#${escapar(v.id)}${v.tipo === 'devolucion' ? ' · DEVOLUCIÓN' : ''}</td>
        <td>${escapar(v.fecha || '—')}</td>
        <td>${escapar(v.tipo === 'devolucion' ? 'DEVOLUCIÓN' : 'VENTA')}</td>
        <td>${escapar(nombreVendedor(v.id_vendedor))}</td>
        <td>${escapar(v.nombre_cliente || 'Consumidor final')}</td>
        <td>${escapar(v.tienda || '—')}</td>
        <td>${escapar(v.productos || 'Sin productos')}</td>
        <td class="ctr">${escapar(v.cantidades || '—')}</td>
        <td class="num">${v.tipo === 'devolucion' ? '−' : ''}$${Number(v.total || 0).toFixed(2)}</td>
      </tr>`).join('');

    imprimirDocumento({
      titulo: 'Ventas por vendedor',
      subtitulo: `Vendedor: ${escapar(etiquetaVendedor())} · Tienda: ${escapar(nombreTiendaActual())}`,
      encabezado: `Fecha de impresión: ${new Date().toLocaleString('es-BO')} · ${ventasFiltradas.length} registro(s) · Devoluciones descontadas del total`,
      tabla: `
        <table>
          <thead>
            <tr>
              <th>N.º venta</th>
              <th>Fecha</th>
              <th class="ctr">Tipo</th>
              <th>Vendedor</th>
              <th>Cliente</th>
              <th>Tienda</th>
              <th>Producto(s)</th>
              <th class="ctr">Cantidad</th>
              <th class="num">Total</th>
            </tr>
          </thead>
          <tbody>${filas}</tbody>
          <tfoot>
            <tr class="total">
              <td colspan="8">Total neto (devoluciones descontadas)</td>
              <td class="num">$${total.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>`,
      pie: 'InventarioChoco · Documento generado desde Ventas por vendedor.'
    });
  };

  // Exporta a Excel las ventas del vendedor/tienda elegidos en los filtros.
  const exportarExcel = async () => {
    if (exportando) return;
    setExportando(true);
    setError('');
    try {
      const filas = ventasFiltradas.map((v) => ({
        'N.º Venta': `#${v.id}`,
        'Fecha': v.fecha || '',
        'Tipo': v.tipo === 'devolucion' ? 'DEVOLUCIÓN' : 'VENTA',
        'Vendedor': nombreVendedor(v.id_vendedor),
        'Cliente': v.nombre_cliente || 'Consumidor final',
        'Tienda': v.tienda || '',
        'Producto(s)': v.productos || '',
        'Cantidades': v.cantidades || '',
        'Total ($)': v.tipo === 'devolucion'
          ? -Number(Number(v.total || 0).toFixed(2))
          : Number(Number(v.total || 0).toFixed(2))
      }));

      await generarExcel(
        `ventas_${etiquetaVendedor().replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`,
        [{ nombre: 'Ventas', filas }]
      );
    } catch (err) {
      console.error('Error al exportar a Excel:', err);
      setError('No se pudo exportar las ventas a Excel.');
    } finally {
      setExportando(false);
    }
  };

  // Abre el modal y trae el conteo de lo que se borraría.
  const abrirPurga = async () => {
    setModalPurga(true);
    setPrevia(null);
    setResultado(null);
    setErrorPurga('');
    setCargandoPrevia(true);
    try {
      const r = await fetch(`${API}/mantenimiento/reglas`, { credentials: 'include' });
      const datos = await r.json();
      if (!r.ok) throw new Error(datos.error || 'No se pudo consultar la purga');
      setPrevia(datos);
    } catch (err) {
      setErrorPurga(err.message);
    } finally {
      setCargandoPrevia(false);
    }
  };

  const ejecutarPurga = async () => {
    if (purgando) return;
    setPurgando(true);
    setErrorPurga('');
    try {
      const r = await fetch(`${API}/mantenimiento/purgar`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meses: 3 })
      });
      const datos = await r.json();
      if (!r.ok) throw new Error(datos.error || 'No se pudo ejecutar la purga');
      setResultado(datos);
      setPrevia(null);
      await cargarDatos(); // refresca la lista con lo que queda
    } catch (err) {
      setErrorPurga(err.message);
    } finally {
      setPurgando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] p-6 text-slate-100">
      {/* AVISO DE PURGA AUTOMATICA (con copia de seguridad) */}
      <AvisoPurga />

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Ventas por vendedor</h1>
          <p className="text-sm text-slate-400">
            Consulta las ventas realizadas por los usuarios del sistema.
          </p>
        </div>
        <button
          type="button"
          onClick={abrirPurga}
          className="flex items-center gap-2 rounded-lg border border-rose-700 bg-rose-950 px-4 py-2 text-sm font-semibold text-rose-200 transition-colors hover:bg-rose-900"
        >
          <Trash2 size={16} />
          Purgar registros +3 meses
        </button>
      </div>

      <div className="mb-5 grid gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-3 rounded-xl border border-slate-700 bg-[#1E293B] p-5">
          <ReceiptText className="text-blue-400" size={26} />
          <div>
            <p className="text-sm text-slate-400">Ventas registradas</p>
            <p className="text-2xl font-bold">{ventasFiltradas.length}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-slate-700 bg-[#1E293B] p-5">
          <DollarSign className="text-emerald-400" size={26} />
          <div>
            <p className="text-sm text-slate-400">Total vendido</p>
            <p className="text-2xl font-bold">${total.toFixed(2)}</p>
            {cantidadDevoluciones > 0 && (
              <p className="text-xs font-semibold text-rose-300">
                {cantidadDevoluciones} devolución(es) descontadas
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Users size={19} className="text-blue-400" />
        <label htmlFor="filtro-vendedor">Filtrar por usuario:</label>
        <select
          id="filtro-vendedor"
          value={vendedor}
          onChange={(e) => setVendedor(e.target.value)}
          className="rounded-lg border border-slate-600 bg-[#1E293B] px-4 py-2 text-white"
        >
          <option value="todos">Todos los usuarios</option>
          {vendedores.map((u) => (
            <option key={u.id} value={String(u.id)}>
            {u.nombre} ({u.rol === 'admin' ? 'Administrador' : 'Vendedor'})
          </option>
          ))}
        </select>

        <SelectorTienda
          valor={tiendaSeleccionada}
          onChange={setTiendaSeleccionada}
        />

        {/* Imprimir / Excel de las ventas con los filtros elegidos */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={imprimirVentas}
            disabled={ventasFiltradas.length === 0}
            title="Imprimir las ventas del vendedor y tienda seleccionados"
            className="flex items-center gap-2 rounded-lg bg-slate-600 px-4 py-2 font-medium text-white transition-all shadow-md hover:bg-slate-500 disabled:opacity-50"
          >
            <Printer size={17} /> Imprimir ventas
          </button>
          <button
            type="button"
            onClick={exportarExcel}
            disabled={exportando || ventasFiltradas.length === 0}
            title="Guardar en Excel las ventas del vendedor y tienda seleccionados"
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white transition-all shadow-md hover:bg-emerald-500 disabled:opacity-50"
          >
            <FileSpreadsheet size={17} /> {exportando ? 'Generando...' : 'Excel'}
          </button>
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-rose-950 p-3 text-rose-200">{error}</p>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-700 bg-[#1E293B]">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#334155]">
            <tr>
              <th className="p-4">N.º Venta</th>
              <th className="p-4">Fecha</th>
              <th className="p-4">Vendedor</th>
              <th className="p-4">Cliente</th>
              <th className="p-4">Tienda</th>
              <th className="p-4">Nombre Producto</th>
              <th className="p-4">Cantidad</th>
              <th className="p-4 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {ventasFiltradas.map((v) => (
              <tr key={v.id} className="border-t border-slate-700">
                <td className="p-4">
                  #{v.id}
                  {v.tipo === 'devolucion' && (
                    <span className="ml-2 rounded-md bg-rose-900 px-2 py-0.5 text-[10px] font-bold text-rose-200">
                      DEVOLUCIÓN
                    </span>
                  )}
                </td>
                <td className="p-4">{v.fecha || '—'}</td>
                <td className="p-4">{nombreVendedor(v.id_vendedor)}</td>
                <td className="p-4">{v.nombre_cliente || 'Consumidor final'} </td>
                <td className="p-4">{v.tienda || '—'}</td>
                <td className="p-4"> {v.productos || 'Sin productos'} </td>
                <td className="p-4"> {v.cantidades || '—'}  </td>

                <td className={`p-4 text-right font-semibold ${v.tipo === 'devolucion' ? 'text-rose-400' : ''}`}>
                  {v.tipo === 'devolucion' ? '−' : ''}${Number(v.total || 0).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal: purga de registros con más de 3 meses */}
      {modalPurga && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-600 bg-[#25364B] p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-xl font-bold text-white">
                <Trash2 size={18} className="text-rose-400" />
                Purgar registros antiguos
              </h2>
              <button
                type="button"
                onClick={() => setModalPurga(false)}
                aria-label="Cerrar"
                className="text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-4 rounded-lg border border-slate-600 bg-slate-800 p-3 text-sm text-slate-300">
              <p className="mb-2 flex items-center gap-2 font-semibold text-slate-200">
                <ShieldAlert size={15} className="text-amber-400" />
                Se eliminarán todos los datos de hace 3 meses:
              </p>
              <ul className="space-y-1 text-slate-300">
                <li>• Ventas de todos los usuarios (y su detalle)</li>
                <li>• Gastos registrados</li>
                <li>• Movimientos del kardex</li>
                <li>• Vendedores y administradores sin ventas hace 3 meses</li>
              </ul>
              <p className="mt-2 text-emerald-300">
                Se mantienen siempre: inventario, productos y tiendas.
                Siempre queda al menos un administrador activo para poder entrar.
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Lo mismo se elimina de forma automática al cumplir los 3 meses
                (con aviso de sacar copia 5 días antes).
              </p>
            </div>

            {cargandoPrevia && (
              <p className="mb-3 text-sm text-slate-400">Contando registros...</p>
            )}

            {previa && !cargandoPrevia && (
              <div className="mb-4 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-lg border border-slate-600 bg-[#0F172A] p-3">
                  <p className="text-slate-400 text-xs">Ventas</p>
                  <p className="text-lg font-bold text-white">{previa.ventas}</p>
                </div>
                <div className="rounded-lg border border-slate-600 bg-[#0F172A] p-3">
                  <p className="text-slate-400 text-xs">Detalle de ventas</p>
                  <p className="text-lg font-bold text-white">{previa.detalle_ventas}</p>
                </div>
                <div className="rounded-lg border border-slate-600 bg-[#0F172A] p-3">
                  <p className="text-slate-400 text-xs">Gastos</p>
                  <p className="text-lg font-bold text-white">{previa.gastos}</p>
                </div>
                <div className="rounded-lg border border-slate-600 bg-[#0F172A] p-3">
                  <p className="text-slate-400 text-xs">Kardex</p>
                  <p className="text-lg font-bold text-white">{previa.kardex}</p>
                </div>
                <div className="rounded-lg border border-slate-600 bg-[#0F172A] p-3">
                  <p className="text-slate-400 text-xs">Vendedores sin ventas</p>
                  <p className="text-lg font-bold text-white">{previa.usuarios_inactivos ?? 0}</p>
                </div>
                <p className="col-span-2 text-xs text-slate-400">
                  Corte: registros anteriores al {previa.fecha_corte}.
                </p>
              </div>
            )}

            {resultado && (
              <div className="mb-4 rounded-lg border border-emerald-800 bg-emerald-950 p-3 text-sm text-emerald-200">
                <p className="font-semibold">{resultado.mensaje}</p>
                <p className="mt-1">
                  Eliminados — ventas: {resultado.eliminado.ventas}, detalle:{' '}
                  {resultado.eliminado.detalle_ventas}, gastos:{' '}
                  {resultado.eliminado.gastos}, kardex: {resultado.eliminado.kardex},
                  vendedores: {resultado.eliminado.usuarios}.
                </p>
              </div>
            )}

            {errorPurga && (
              <p className="mb-3 rounded-lg border border-rose-800 bg-rose-950 p-3 text-sm text-rose-200">
                {errorPurga}
              </p>
            )}

            <div className="flex justify-end gap-3 border-t border-slate-600 pt-4">
              <button
                type="button"
                onClick={() => setModalPurga(false)}
                className="rounded-lg bg-slate-600 px-4 py-2 text-white hover:bg-slate-500"
              >
                {resultado ? 'Cerrar' : 'Cancelar'}
              </button>
              {!resultado && (
                <button
                  type="button"
                  onClick={ejecutarPurga}
                  disabled={purgando || cargandoPrevia}
                  className="flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 font-semibold text-white hover:bg-rose-500 disabled:opacity-60"
                >
                  <Trash2 size={15} />
                  {purgando ? 'Purgando...' : 'Eliminar ahora'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}