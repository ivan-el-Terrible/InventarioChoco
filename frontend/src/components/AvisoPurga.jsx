import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Download, Trash2, X, CheckCircle2 } from 'lucide-react';
import useAutoRefetch from '../hooks/useAutoRefetch';
import { generarExcel } from '../utils/excel';

/**
 * Aviso de purga automatica para el administrador.
 *
 * - Al montarse consulta /mantenimiento/estado: el backend elimina solo
 *   lo que ya cumplio los 3 meses y devuelve lo que queda en la ventana
 *   de aviso (5 dias).
 * - Si hay algo por vencer muestra el banner: "saca tu copia" con los
 *   botones de DESCARGAR COPIA (Excel) y PURGAR AHORA.
 * - Si no lo presiona, al cumplir los 3 meses se borra de forma automatica
 *   la proxima vez que se consulte.
 */
export default function AvisoPurga() {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [descargando, setDescargando] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  const [purgando, setPurgando] = useState(false);
  const [error, setError] = useState('');
  const [autoMsg, setAutoMsg] = useState('');

  const cargarEstado = useCallback(async (silencioso = false) => {
    if (!silencioso) setCargando(true);
    setError('');
    try {
      const r = await fetch('/mantenimiento/estado', { credentials: 'include' });
      const resultado = await r.json();
      if (!r.ok) throw new Error(resultado.error || 'No se pudo consultar el mantenimiento');
      setDatos(resultado);

      const auto = resultado.auto_eliminado || {};
      const total = (auto.ventas || 0) + (auto.detalle_ventas || 0)
        + (auto.gastos || 0) + (auto.kardex || 0) + (auto.usuarios || 0);
      if (total > 0) {
        setAutoMsg(
          `Purga automática: se eliminaron ${total} registros de más de 3 meses `
          + `(ventas: ${auto.ventas}, detalle: ${auto.detalle_ventas}, `
          + `gastos: ${auto.gastos}, kardex: ${auto.kardex}, `
          + `usuarios: ${auto.usuarios}).`
        );
      }
    } catch (err) {
      if (!silencioso) setError(err.message);
    } finally {
      if (!silencioso) setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarEstado();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // La purga automatica se revisa cada minuto mientras la app este abierta.
  useAutoRefetch(() => { cargarEstado(true); }, 60000);

  const porVencer = datos?.por_vencer || {};
  const pendientes = (porVencer.ventas || 0) + (porVencer.gastos || 0)
    + (porVencer.kardex || 0) + (porVencer.usuarios || 0);

  // Descarga la copia Excel de todo lo que se va a purgar.
  const descargarCopia = async () => {
    if (descargando) return;
    setDescargando(true);
    setError('');
    try {
      const r = await fetch('/mantenimiento/copia', { credentials: 'include' });
      const copia = await r.json();
      if (!r.ok) throw new Error(copia.error || 'No se pudo obtener la copia');

      // Encabezados claros: cada columna dice que id es (no solo "id").
      await generarExcel(
        `copia_purga_${new Date().toISOString().slice(0, 10)}.xlsx`,
        [
          {
            nombre: 'Ventas',
            filas: (copia.ventas || []).map((v) => ({
              'N.º venta': v.id,
              'Fecha': v.fecha,
              'Tipo': v.tipo,
              'Cliente': v.nombre_cliente,
              'Total ($)': v.total,
              'Forma de pago': v.forma_pago,
              'Estado': v.estado,
              'Vendedor': v.vendedor,
              'Tienda': v.tienda
            }))
          },
          {
            nombre: 'Detalle ventas',
            filas: (copia.detalle_ventas || []).map((d) => ({
              'N.º venta': d.id_venta,
              'ID PRODUCTO': d.id_producto,
              'Producto': d.producto,
              'Código': d.codigo,
              'Cantidad': d.cantidad,
              'Precio venta ($)': d.precio_venta_real,
              'Costo unitario ($)': d.costo_unitario,
              'Subtotal ($)': d.sub_total
            }))
          },
          { nombre: 'Gastos', filas: copia.gastos || [] },
          {
            nombre: 'Kardex',
            filas: (copia.kardex || []).map((k) => ({
              'ID PRODUCTO': k.id_producto,
              'Fecha': k.fecha,
              'Producto': k.producto,
              'Código': k.codigo,
              'Movimiento': k.tipo_movimiento,
              'Motivo': k.motivo,
              'Cantidad': k.cantidad,
              'S. anterior': k.stock_anterior,
              'S. nuevo': k.stock_nuevo,
              'P. compra ($)': k.costo_unitario
            }))
          },
          {
            nombre: 'Usuarios a eliminar',
            filas: (copia.usuarios || []).map((u) => ({
              'ID usuario': u.id,
              'Nombre': u.nombre,
              'Email': u.email,
              'Fecha de alta': u.fecha_creacion,
              'Última venta': u.ultima_venta
            }))
          }
        ]
      );
    } catch (err) {
      setError(err.message || 'No se pudo descargar la copia.');
    } finally {
      setDescargando(false);
    }
  };

  // Purga manual: el admin no espera a que se cumplan los 3 meses.
  const purgarAhora = async () => {
    if (purgando) return;
    setPurgando(true);
    setError('');
    try {
      const r = await fetch('/mantenimiento/purgar', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meses: 3 })
      });
      const resultado = await r.json();
      if (!r.ok) throw new Error(resultado.error || 'No se pudo ejecutar la purga');
      setConfirmar(false);
      setAutoMsg(
        'Purga completada: '
        + `ventas ${resultado.eliminado.ventas}, detalle ${resultado.eliminado.detalle_ventas}, `
        + `gastos ${resultado.eliminado.gastos}, kardex ${resultado.eliminado.kardex}, `
        + `usuarios ${resultado.eliminado.usuarios}.`
      );
      await cargarEstado(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setPurgando(false);
    }
  };

  if (cargando && !datos) return null;

  return (
    <div className="mb-5 space-y-3">
      {/* Lo que la purga automatica elimino en esta revision */}
      {autoMsg && (
        <div className="flex items-start justify-between gap-3 rounded-xl border border-emerald-800 bg-emerald-950 p-4 text-sm text-emerald-200">
          <p className="flex items-start gap-2">
            <CheckCircle2 size={17} className="mt-0.5 shrink-0" />
            {autoMsg}
          </p>
          <button
            type="button"
            onClick={() => setAutoMsg('')}
            aria-label="Cerrar aviso"
            className="shrink-0 text-emerald-300 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Aviso: dentro de 5 dias se elimina solo. Sacar copia. */}
      {pendientes > 0 && (
        <div className="rounded-xl border border-amber-600 bg-amber-950 p-4 text-sm text-amber-100">
          <p className="mb-2 flex items-center gap-2 font-bold">
            <AlertTriangle size={17} className="text-amber-400" />
            Copia de seguridad: purga automática en máximo {datos?.dias_aviso || 5} días
          </p>
          <p className="mb-3 text-amber-200/90">
            Al cumplir 3 meses se eliminarán solos (sin preguntar):{' '}
            <strong>{porVencer.ventas || 0}</strong> ventas,{' '}
            <strong>{porVencer.gastos || 0}</strong> gastos,{' '}
            <strong>{porVencer.kardex || 0}</strong> movimientos de kardex y{' '}
            <strong>{porVencer.usuarios || 0}</strong> usuarios sin actividad
            (vendedores o administradores)
            (fecha límite: {datos?.fecha_limite || '—'}).
            Descarga tu copia ahora; el inventario, los productos y las
            tiendas nunca se tocan.
          </p>

          {confirmar && (
            <div className="mb-3 rounded-lg border border-rose-700 bg-rose-950 p-3 text-rose-100">
              <p className="mb-2 font-semibold">
                ¿Eliminar ahora todo lo listado? Esta acción no se puede deshacer.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={purgarAhora}
                  disabled={purgando}
                  className="flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 font-semibold text-white hover:bg-rose-500 disabled:opacity-60"
                >
                  <Trash2 size={15} />
                  {purgando ? 'Purgando...' : 'Sí, eliminar ahora'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmar(false)}
                  disabled={purgando}
                  className="rounded-lg bg-slate-600 px-4 py-2 text-white hover:bg-slate-500 disabled:opacity-60"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={descargarCopia}
              disabled={descargando}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
            >
              <Download size={15} />
              {descargando ? 'Generando copia...' : 'Descargar copia (Excel)'}
            </button>
            {!confirmar && (
              <button
                type="button"
                onClick={() => setConfirmar(true)}
                className="flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 font-semibold text-white hover:bg-rose-500"
              >
                <Trash2 size={15} /> Purgar ahora
              </button>
            )}
          </div>
        </div>
      )}

      {error && (
        <p className="rounded-lg border border-rose-800 bg-rose-950 p-3 text-sm text-rose-200">
          {error}
        </p>
      )}
    </div>
  );
}
