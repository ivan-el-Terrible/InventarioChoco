import React, { useEffect, useMemo, useState } from 'react';
import { ReceiptText, Users, DollarSign } from 'lucide-react';

const API = '';

export default function VentasVendedores() {
  const [ventas, setVentas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [vendedor, setVendedor] = useState('todos');
  const [error, setError] = useState('');

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [resVentas, resUsuarios] = await Promise.all([
          fetch(`${API}/ventas`, { credentials: 'include' }),
          fetch(`${API}/usuarios`, { credentials: 'include' })
        ]);

        const datosVentas = await resVentas.json();
        const datosUsuarios = await resUsuarios.json();

        if (!resVentas.ok || !resUsuarios.ok) {
          throw new Error('No se pudieron cargar las ventas');
        }

        setVentas(datosVentas);
        setUsuarios(datosUsuarios);
      } catch (err) {
        setError(err.message);
      }
    };

    cargarDatos();
  }, []);

  const vendedores = usuarios.filter((u) => u.rol === 'vendedor' || u.rol === 'admin');

  const ventasFiltradas = useMemo(() => {
    if (vendedor === 'todos') return ventas;
    return ventas.filter((v) => String(v.id_vendedor) === vendedor);
  }, [ventas, vendedor]);

  const total = ventasFiltradas.reduce(
    (acumulado, v) => acumulado + Number(v.total || 0),
    0
  );

  const nombreVendedor = (id) =>
    usuarios.find((u) => u.id === id)?.nombre || 'Sin asignar';

  return (
    <div className="min-h-screen bg-[#0F172A] p-6 text-slate-100">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Ventas por vendedor</h1>
        <p className="text-sm text-slate-400">
          Consulta las ventas realizadas por los usuarios del sistema.
        </p>
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
              <th className="p-4">Producto</th>
              <th className="p-4">Cantidad</th>
              <th className="p-4 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {ventasFiltradas.map((v) => (
              <tr key={v.id} className="border-t border-slate-700">
                <td className="p-4">#{v.id}</td>
                <td className="p-4">{v.fecha || '—'}</td>
                <td className="p-4">{nombreVendedor(v.id_vendedor)}</td>
                <td className="p-4">{v.nombre_cliente || 'Consumidor final'} </td>
                <td className="p-4"> {v.productos || 'Sin productos'} </td>
                <td className="p-4"> {v.cantidades || '—'}  </td>

                <td className="p-4 text-right font-semibold">
                  ${Number(v.total || 0).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}