import React, { useEffect, useState } from 'react';
import {
  Wallet,
  Plus,
  ReceiptText,
  UserRound,
  Store
} from 'lucide-react';
import SelectorTienda from '../components/SelectorTienda';
import useAutoRefetch from '../hooks/useAutoRefetch';

const API = '';

const formatoDinero = (valor) =>
  `Bs ${Number(valor || 0).toLocaleString('es-BO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;

const gastoInicial = {
  concepto: '',
  descripcion: '',
  monto: ''
};

export default function Gastos({ usuario }) {
  const esAdmin = usuario?.rol === 'admin';

  const [gastos, setGastos] = useState([]);
  const [resumen, setResumen] = useState({ cantidad: 0, total: 0 });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [tiendaSeleccionada, setTiendaSeleccionada] = useState('');
  const [formulario, setFormulario] = useState(gastoInicial);

  const cargarGastos = async (silencioso = false) => {
    if (!silencioso) setCargando(true);
    try {
      const query = esAdmin && tiendaSeleccionada
        ? `?id_tienda=${encodeURIComponent(tiendaSeleccionada)}`
        : '';
      const [resGastos, resResumen] = await Promise.all([
        fetch(`${API}/gastos${query}`, { credentials: 'include' }),
        fetch(`${API}/gastos/resumen${query}`, { credentials: 'include' })
      ]);

      const datosGastos = await resGastos.json();
      const datosResumen = await resResumen.json();

      if (!resGastos.ok) {
        throw new Error(datosGastos.error || 'No se pudieron cargar los gastos');
      }

      setGastos(Array.isArray(datosGastos) ? datosGastos : []);
      if (resResumen.ok) setResumen(datosResumen);
      setError('');
    } catch (err) {
      if (!silencioso) setError(err.message);
    } finally {
      if (!silencioso) setCargando(false);
    }
  };

  useEffect(() => {
    cargarGastos();
  }, [tiendaSeleccionada]);

  // Los gastos registrados por otra persona aparecen solos.
  useAutoRefetch(() => { cargarGastos(true); }, 15000);

  const registrarGasto = async (e) => {
    e.preventDefault();
    if (guardando) return;

    const monto = Number(formulario.monto);
    if (!formulario.concepto.trim()) {
      setError('Indica el concepto del gasto.');
      return;
    }
    if (!Number.isFinite(monto) || monto <= 0) {
      setError('El monto debe ser un número mayor a cero.');
      return;
    }

    setError('');
    setMensaje('');
    setGuardando(true);
    try {
      const cuerpo = {
        concepto: formulario.concepto.trim(),
        descripcion: formulario.descripcion.trim() || null,
        monto
      };
      if (esAdmin && tiendaSeleccionada) {
        cuerpo.id_tienda = Number(tiendaSeleccionada);
      }

      const respuesta = await fetch(`${API}/gastos`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cuerpo)
      });
      const datos = await respuesta.json();
      if (!respuesta.ok) throw new Error(datos.error || 'No se pudo registrar el gasto');

      setMensaje('Gasto registrado correctamente');
      setFormulario(gastoInicial);
      await cargarGastos();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const cambiarCampo = (campo) => (e) =>
    setFormulario({ ...formulario, [campo]: e.target.value });

  return (
    <div className="min-h-screen bg-[#0F172A] p-6 text-slate-100">
      {/* ENCABEZADO */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Gastos</h1>
          <p className="text-sm text-slate-400">
            {esAdmin
              ? 'Registra y consulta los gastos de cada tienda.'
              : 'Registra y consulta los gastos de tu tienda.'}
          </p>
        </div>

        {esAdmin && (
          <SelectorTienda
            valor={tiendaSeleccionada}
            onChange={setTiendaSeleccionada}
          />
        )}
      </div>

      {/* INDICADORES */}
      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-xl border border-slate-700 bg-[#1E293B] p-5">
          <Wallet className="text-rose-400" size={26} />
          <div>
            <p className="text-sm text-slate-400">Total gastos vigentes</p>
            <p className="text-2xl font-bold">{formatoDinero(resumen.total)}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-slate-700 bg-[#1E293B] p-5">
          <ReceiptText className="text-blue-400" size={26} />
          <div>
            <p className="text-sm text-slate-400">Gastos registrados</p>
            <p className="text-2xl font-bold">{resumen.cantidad}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-slate-700 bg-[#1E293B] p-5">
          <Store className="text-emerald-400" size={26} />
          <div>
            <p className="text-sm text-slate-400">Tienda</p>
            <p className="text-2xl font-bold">
              {esAdmin ? (tiendaSeleccionada ? 'Seleccionada' : 'Por defecto') : 'Mi tienda'}
            </p>
          </div>
        </div>
      </div>

      {/* MENSAJES */}
      {error && (
        <p className="mb-4 rounded-lg border border-rose-800 bg-rose-950 p-3 text-rose-200">
          {error}
        </p>
      )}
      {mensaje && (
        <p className="mb-4 rounded-lg border border-emerald-800 bg-emerald-950 p-3 text-emerald-200">
          {mensaje}
        </p>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* FORMULARIO */}
        <div className="rounded-xl border border-slate-700 bg-[#1E293B] p-5">
          <h2 className="mb-4 flex items-center gap-2 font-bold">
            <Plus size={18} className="text-blue-400" />
            Registrar gasto
          </h2>

          <form onSubmit={registrarGasto} className="space-y-4">
            <div>
              <label htmlFor="concepto" className="mb-1 block text-sm">
                Concepto *
              </label>
              <input
                id="concepto"
                required
                value={formulario.concepto}
                onChange={cambiarCampo('concepto')}
                placeholder="Ej: Luz, alquiler, transporte..."
                className="w-full rounded-lg border border-slate-500 bg-[#0F172A] p-3 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="descripcion" className="mb-1 block text-sm">
                Descripción
              </label>
              <textarea
                id="descripcion"
                rows={3}
                value={formulario.descripcion}
                onChange={cambiarCampo('descripcion')}
                placeholder="Detalles opcionales del gasto"
                className="w-full rounded-lg border border-slate-500 bg-[#0F172A] p-3 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="monto" className="mb-1 block text-sm">
                Monto (Bs) *
              </label>
              <input
                id="monto"
                required
                type="number"
                min="0.01"
                step="0.01"
                value={formulario.monto}
                onChange={cambiarCampo('monto')}
                placeholder="0.00"
                className="w-full rounded-lg border border-slate-500 bg-[#0F172A] p-3 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={guardando}
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
            >
              {guardando ? 'Registrando...' : 'Registrar gasto'}
            </button>
          </form>
        </div>

        {/* TABLA */}
        <div className="overflow-x-auto rounded-xl border border-slate-700 bg-[#1E293B] lg:col-span-2">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#334155]">
              <tr>
                <th className="p-4">Fecha</th>
                <th className="p-4">Concepto</th>
                <th className="p-4">Descripción</th>
                {esAdmin && <th className="p-4">Tienda</th>}
                <th className="p-4">Registrado por</th>
                <th className="p-4 text-right">Monto</th>
                <th className="p-4 text-center">Estado</th>
              </tr>
            </thead>
            <tbody>
              {gastos.map((g) => (
                <tr key={g.id} className="border-t border-slate-700">
                  <td className="p-4 text-slate-400">
                    {(g.fecha || '').slice(0, 16).replace('T', ' ')}
                  </td>
                  <td className="p-4 font-semibold">{g.concepto}</td>
                  <td className="p-4 text-slate-300">{g.descripcion || '—'}</td>
                  {esAdmin && <td className="p-4 text-slate-300">{g.tienda || '—'}</td>}
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1 text-slate-300">
                      <UserRound size={14} className="text-blue-400" />
                      {g.registrado_por}
                    </span>
                  </td>
                  <td className="p-4 text-right font-semibold text-rose-300">
                    {formatoDinero(g.monto)}
                  </td>
                  <td className="p-4 text-center">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                        g.estado === 'vigente'
                          ? 'bg-emerald-900 text-emerald-200'
                          : 'bg-slate-600 text-slate-200'
                      }`}
                    >
                      {g.estado === 'vigente' ? 'Vigente' : 'Anulado'}
                    </span>
                  </td>
                </tr>
              ))}

              {!cargando && gastos.length === 0 && (
                <tr>
                  <td
                    colSpan={esAdmin ? 7 : 6}
                    className="p-8 text-center text-slate-400"
                  >
                    No hay gastos registrados en esta tienda.
                  </td>
                </tr>
              )}

              {cargando && (
                <tr>
                  <td
                    colSpan={esAdmin ? 7 : 6}
                    className="p-8 text-center text-slate-400"
                  >
                    Cargando gastos...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
