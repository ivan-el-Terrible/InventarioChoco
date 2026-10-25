import React, { useState } from 'react';
import {
  X, ArrowUpRight, ArrowDownLeft, FileText,
  Search, ClipboardList, Package, RotateCcw
} from 'lucide-react';





function KardexGeneral() {
  const [busqueda, setBusqueda] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('Todos');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  // Datos de demostración. Posteriormente vendrán del backend.
  const movimientos = [
    {
      id: 1,
      fecha: '2026-10-20 09:30',
      codOrigen: '90915-YZZE1',
      codigo: 'P001',
      producto: 'Chocolate amargo',
      tipo: 'Entrada',
      detalle: 'Compra #C-001',
      cantidad: 20,
      saldoAnterior: 30,
      saldoNuevo: 50,
    },
    {
      id: 2,
      fecha: '2026-10-21 11:45',
      codigo: 'P002',
      producto: 'Chocolate blanco',
      tipo: 'Salida',
      detalle: 'Venta #V-001',
      cantidad: 5,
      saldoAnterior: 25,
      saldoNuevo: 20,
    },
    {
      id: 3,
      fecha: '2026-10-22 14:10',
      codigo: 'P003',
      producto: 'Cacao en polvo',
      tipo: 'Entrada',
      detalle: 'Compra #C-002',
      cantidad: 15,
      saldoAnterior: 10,
      saldoNuevo: 25,
    },
    {
      id: 4,
      fecha: '2026-10-23 16:20',
      codigo: 'P001',
      producto: 'Chocolate amargo',
      tipo: 'Salida',
      detalle: 'Venta #V-002',
      cantidad: 8,
      saldoAnterior: 50,
      saldoNuevo: 42,
    },
  ];

  
const movimientosFiltrados = movimientos.filter((m) => {
    const texto = busqueda.trim().toLowerCase();

    // Buscar por nombre, código o código original
    const nombre = String(m.producto ?? '').toLowerCase();
    const codigo = String(m.codigo ?? '').toLowerCase();
    const codOrigen = String(m.codOrigen ?? '').toLowerCase();

    const coincideBusqueda =
      nombre.includes(texto) || codigo.includes(texto) || codOrigen.includes(texto);

    // Filtrar por tipo de movimiento
    const coincideTipo =
      tipoFiltro === 'Todos' || m.tipo === tipoFiltro;

    // Filtrar por fechas
    const fecha = m.fecha.slice(0, 10);

    const coincideInicio =
      !fechaInicio || fecha >= fechaInicio;

    const coincideFin =
      !fechaFin || fecha <= fechaFin;

    return (
      coincideBusqueda &&
      coincideTipo &&
      coincideInicio &&
      coincideFin
    );
  });


  const entradas = movimientosFiltrados
    .filter((m) => m.tipo === 'Entrada')
    .reduce((total, m) => total + m.cantidad, 0);

  const salidas = movimientosFiltrados
    .filter((m) => m.tipo === 'Salida')
    .reduce((total, m) => total + m.cantidad, 0);

  const limpiarFiltros = () => {
    setBusqueda('');
    setTipoFiltro('Todos');
    setFechaInicio('');
    setFechaFin('');
  };

  return (
    <div className="p-4 md:p-8 space-y-6 bg-[#FFF8E7] min-h-screen">

      {/* Encabezado */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <ClipboardList className="text-orange-500" size={30} />
            <h1 className="text-2xl font-bold text-slate-800">
              Kardex General
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-2">
            Historial de compras, ventas y movimientos
            de todos los productos.
          </p>
        </div>
      </div>

      {/* Aviso de demostración */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
        Vista de demostración: los movimientos todavía no
        están conectados a la base de datos.
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center gap-2 text-emerald-600">
            <ArrowDownLeft size={20} />
            <span className="font-semibold">Entradas</span>
          </div>
          <p className="text-3xl font-bold mt-3">{entradas}</p>
          <p className="text-xs text-slate-500">
            Unidades ingresadas
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center gap-2 text-orange-600">
            <ArrowUpRight size={20} />
            <span className="font-semibold">Salidas</span>
          </div>
          <p className="text-3xl font-bold mt-3">{salidas}</p>
          <p className="text-xs text-slate-500">
            Unidades retiradas
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center gap-2 text-blue-600">
            <Package size={20} />
            <span className="font-semibold">Movimientos</span>
          </div>
          <p className="text-3xl font-bold mt-3">
            {movimientosFiltrados.length}
          </p>
          <p className="text-xs text-slate-500">
            Registros encontrados
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border shadow-sm p-5">
        <h2 className="font-bold text-slate-700 mb-4">
          Filtros de búsqueda
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div>
            <label className="text-xs text-slate-500">
              Buscar producto
            </label>
            <div className="relative mt-1">
              <Search
                size={17}
                className="absolute left-3 top-3 text-slate-400"
              />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Nombre, código o código original"
                className="w-full border rounded-lg py-2.5 pl-10 pr-3 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-500">
              Tipo de movimiento
            </label>
            <select
              value={tipoFiltro}
              onChange={(e) => setTipoFiltro(e.target.value)}
              className="w-full mt-1 border rounded-lg p-2.5 text-sm bg-white"
            >
              <option value="Todos">Todos</option>
              <option value="Entrada">Entradas / Compras</option>
              <option value="Salida">Salidas / Ventas</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-500">
              Fecha desde
            </label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-full mt-1 border rounded-lg p-2.5 text-sm"
            />
          </div>

          <div>
            <label className="text-xs text-slate-500">
              Fecha hasta
            </label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="w-full mt-1 border rounded-lg p-2.5 text-sm"
            />
          </div>
        </div>

        <button
          onClick={limpiarFiltros}
          className="mt-4 flex items-center gap-2 text-sm text-orange-600 hover:text-orange-700 font-semibold"
        >
          <RotateCcw size={15} />
          Limpiar filtros
        </button>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="p-5 border-b">
          <h2 className="font-bold text-slate-800">
            Historial de movimientos
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Entradas y salidas de todos los productos
          </p>
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
                <th className="p-3 text-right">S. anterior</th>
                <th className="p-3 text-right">S. nuevo</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {movimientosFiltrados.map((m) => {
                const entrada = m.tipo === 'Entrada';

                return (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="p-3 whitespace-nowrap text-slate-500">
                      {m.fecha}
                    </td>
                    <td className="p-3 font-mono">{m.codOrigen || '—'}</td>
                    <td className="p-3 font-mono">{m.codigo}</td>
                    <td className="p-3 font-semibold">{m.producto}</td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold ${
                          entrada
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-orange-100 text-orange-700'
                        }`}
                      >
                        {entrada
                          ? <ArrowDownLeft size={14} />
                          : <ArrowUpRight size={14} />}
                        {m.tipo}
                      </span>
                    </td>
                    <td className="p-3">{m.detalle}</td>
                    <td
                      className={`p-3 text-right font-bold ${
                        entrada ? 'text-emerald-600' : 'text-orange-600'
                      }`}
                    >
                      {entrada ? '+' : '-'}{m.cantidad}
                    </td>
                    <td className="p-3 text-right">{m.saldoAnterior}</td>
                    <td className="p-3 text-right font-bold">{m.saldoNuevo}</td>
                  </tr>
                );
              })}

              {movimientosFiltrados.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="p-10 text-center text-slate-500"
                  >
                    No se encontraron movimientos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-slate-50 border-t text-xs text-slate-500">
          Mostrando {movimientosFiltrados.length} movimientos.
          Los saldos corresponden a cada producto individual.
        </div>
      </div>
    </div>
  );
}



{/** este es del kardes individual */}

export default function Kardex({ producto, onClose }) {
  // Datos simulados de movimientos del Kardex (se conectarán con SQLite)
  const movimientos = [
    { id: 1, fecha: '2026-08-20 10:30', tipo: 'Entrada', detalle: 'Factura Compra #F-4502', cantidad: 15, saldoAnterior: 0, saldoNuevo: 15, costoUnitario: 35.00 },
    { id: 2, fecha: '2026-08-21 14:15', tipo: 'Salida', detalle: 'Venta #V-00101', cantidad: 2, saldoAnterior: 15, saldoNuevo: 13, costoUnitario: 35.00 },
    { id: 3, fecha: '2026-08-22 09:00', tipo: 'Salida', detalle: 'Venta #V-00108', cantidad: 1, saldoAnterior: 13, saldoNuevo: 12, costoUnitario: 35.00 },
  ];
  if (!producto) {
    return <KardexGeneral />;
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Cabecera del Modal */}
        <div className="p-6 bg-slate-800 text-white flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-blue-500/20 text-blue-300 text-xs px-2 py-0.5 rounded font-mono">
                {producto.codigo}
              </span>
              <h2 className="text-xl font-bold">{producto.nombre}</h2>
            </div>
            <p className="text-slate-400 text-sm mt-1">Historial de movimientos y auditoría de stock</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-300 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Resumen del Estado Actual */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 border-b border-slate-200 text-sm">
          <div>
            <p className="text-slate-500 text-xs">Stock Actual:</p>
            <p className="text-lg font-bold text-slate-800">{producto.stock} Unidades</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs">Costo Promedio:</p>
            <p className="text-lg font-bold text-slate-800">${producto.costo.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs">Precio de Venta:</p>
            <p className="text-lg font-bold text-emerald-600">${producto.precio.toFixed(2)}</p>
          </div>
        </div>

        {/* Tabla de Movimientos del Kardex */}
        <div className="p-6 overflow-auto flex-1">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">Fecha y Hora</th>
                <th className="p-3">Tipo</th>
                <th className="p-3">Detalle / Documento</th>
                <th className="p-3 text-right">Cant.</th>
                <th className="p-3 text-right">S. Anterior</th>
                <th className="p-3 text-right">S. Nuevo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {movimientos.map((m) => {
                const esEntrada = m.tipo === 'Entrada';
                return (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono text-xs text-slate-500">{m.fecha}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${
                        esEntrada ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {esEntrada ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                        {m.tipo}
                      </span>
                    </td>
                    <td className="p-3 font-medium text-slate-700">{m.detalle}</td>
                    <td className={`p-3 text-right font-bold ${esEntrada ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {esEntrada ? `+${m.cantidad}` : `-${m.cantidad}`}
                    </td>
                    <td className="p-3 text-right text-slate-500">{m.saldoAnterior}</td>
                    <td className="p-3 text-right font-bold text-slate-800">{m.saldoNuevo}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pie del Modal */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center text-xs text-slate-500">
          <span className="flex items-center gap-1"><FileText size={14} /> Método de valoración: Costo Promedio Ponderado</span>
          <button 
            onClick={onClose} 
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium transition-colors"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
}
