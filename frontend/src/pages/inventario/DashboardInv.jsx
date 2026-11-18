
import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  AlertTriangle,
  ShoppingBag,
  RefreshCw
} from 'lucide-react';
import useAutoRefetch from '../../hooks/useAutoRefetch';
import SelectorTienda from '../../components/SelectorTienda';

const API = '';

const datosIniciales = {
  ventas_mes: 0,
  ganancia_estimada: 0,
  ordenes_realizadas: 0,
  ticket_promedio: 0,
  margen_promedio: 0,
  productos_criticos: 0,
  limite_stock_critico: 5,
  productos_mas_vendidos: [],
  valor_inventario: []
};

const formatoDinero = (valor) =>
  `Bs ${Number(valor || 0).toLocaleString('es-BO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;

const formatoCantidad = (valor) =>
  Number(valor || 0).toLocaleString('es-BO', {
    maximumFractionDigits: 2
  });

export default function DashboardInv() {
  const [datos, setDatos] = useState(datosIniciales);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [tiendaSeleccionada, setTiendaSeleccionada] = useState('');

  // silencioso = true evita el parpadeo de "Cargando" en la auto-actualización.
  const cargarDashboard = async (silencioso = false) => {
    if (!silencioso) setCargando(true);
    setError('');

    try {
      const query = tiendaSeleccionada
        ? `?id_tienda=${encodeURIComponent(tiendaSeleccionada)}`
        : '';
      const respuesta = await fetch(`${API}/dashboard${query}`, {
        credentials: 'include'
      });

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          resultado.error || 'No se pudo cargar el dashboard'
        );
      }

      setDatos(resultado);
    } catch (err) {
      if (!silencioso) setError(err.message);
    } finally {
      if (!silencioso) setCargando(false);
    }
  };

  useEffect(() => {
    cargarDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tiendaSeleccionada]);

  // Los indicadores se refrescan solos: al entrar un mes nuevo el backend
  // calcula automáticamente los datos del mes en curso.
  useAutoRefetch(() => { cargarDashboard(true); }, 60000);

  const productosVendidos = datos.productos_mas_vendidos || [];
  const categorias = datos.valor_inventario || [];

  const mayorCantidad = Math.max(
    1,
    ...productosVendidos.map((p) => Number(p.cantidad || 0))
  );

  const valorTotalInventario = categorias.reduce(
    (total, item) => total + Number(item.valor || 0),
    0
  );

  return (
    <div className="min-h-screen space-y-6 bg-[#0F172A] p-6 text-slate-100">

      {/* ENCABEZADO */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">
            Panel de Control General
          </h1>
          <p className="text-sm text-slate-400">
            Visión general del estado comercial e inventarios
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <SelectorTienda
            valor={tiendaSeleccionada}
            onChange={setTiendaSeleccionada}
          />

          <button
            type="button"
            onClick={() => cargarDashboard()}
            disabled={cargando}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
          >
            <RefreshCw
              size={17}
              className={cargando ? 'animate-spin' : ''}
            />
            {cargando ? 'Actualizando...' : 'Actualizar'}
          </button>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="rounded-lg border border-rose-800 bg-rose-950 p-4 text-rose-200">
          {error}
        </div>
      )}

      {/* INDICADORES */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

        {/* VENTAS DEL MES */}
        <div className="flex items-center gap-3 rounded-xl border border-slate-700 bg-[#1E293B] p-5">
          <DollarSign className="text-emerald-400" size={26} />
          <div className="min-w-0">
            <p className="text-sm text-slate-400">Ventas del Mes</p>
            <p className="text-2xl font-bold">
              {cargando ? '...' : formatoDinero(datos.ventas_mes)}
            </p>
            <span className="mt-1 block text-xs font-semibold text-emerald-300">
              Ingresos registrados este mes
            </span>
          </div>
        </div>

        {/* GANANCIA ESTIMADA */}
        <div className="flex items-center gap-3 rounded-xl border border-slate-700 bg-[#1E293B] p-5">
          <TrendingUp className="text-blue-400" size={26} />
          <div className="min-w-0">
            <p className="text-sm text-slate-400">Ganancia Estimada</p>
            <p className="text-2xl font-bold">
              {cargando ? '...' : formatoDinero(datos.ganancia_estimada)}
            </p>
            <span className="mt-1 block text-xs text-slate-400">
              Margen estimado: {Number(datos.margen_promedio || 0).toFixed(2)}%
            </span>
          </div>
        </div>

        {/* ORDENES REALIZADAS */}
        <div className="flex items-center gap-3 rounded-xl border border-slate-700 bg-[#1E293B] p-5">
          <ShoppingBag className="text-purple-400" size={26} />
          <div className="min-w-0">
            <p className="text-sm text-slate-400">Órdenes Realizadas</p>
            <p className="text-2xl font-bold">
              {cargando ? '...' : datos.ordenes_realizadas}
            </p>
            <span className="mt-1 block text-xs text-slate-400">
              Ticket promedio: {formatoDinero(datos.ticket_promedio)}
            </span>
          </div>
        </div>

        {/* PRODUCTOS CRITICOS */}
        <div className="flex items-center gap-3 rounded-xl border border-slate-700 bg-[#1E293B] p-5">
          <AlertTriangle className="text-amber-400" size={26} />
          <div className="min-w-0">
            <p className="text-sm text-slate-400">Productos Críticos</p>
            <p className="text-2xl font-bold">
              {cargando ? '...' : `${datos.productos_criticos} SKUs`}
            </p>
            <span className="mt-1 block text-xs font-semibold text-amber-300">
              Stock menor o igual a {datos.limite_stock_critico}
            </span>
          </div>
        </div>
      </div>

      {/* SECCIONES INFERIORES */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* PRODUCTOS MAS VENDIDOS */}
        <div className="rounded-xl border border-slate-700 bg-[#1E293B] p-6">
          <h3 className="mb-1 font-bold text-slate-100">
            Productos Más Vendidos
          </h3>

          <p className="mb-5 text-xs text-slate-400">
            Los cinco productos más vendidos del mes
          </p>

          {productosVendidos.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">
              No hay productos vendidos este mes.
            </p>
          ) : (
            <div className="space-y-5">
              {productosVendidos.map((producto) => {
                const porcentaje =
                  (Number(producto.cantidad || 0) / mayorCantidad) * 100;

                return (
                  <div key={producto.id}>
                    <div className="mb-2 flex items-center justify-between gap-3 text-xs font-semibold text-slate-200">
                      <span className="min-w-0 break-words">
                        {producto.nombre}
                      </span>

                      <span className="shrink-0">
                        {formatoCantidad(producto.cantidad)} unidades
                      </span>
                    </div>

                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-700">
                      <div
                        className="h-2 rounded-full bg-blue-500 transition-all"
                        style={{ width: `${porcentaje}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* VALOR DEL INVENTARIO */}
        <div className="rounded-xl border border-slate-700 bg-[#1E293B] p-6">
          <h3 className="mb-1 font-bold text-slate-100">
            Distribución del Valor de Inventario
          </h3>

          <p className="mb-5 text-xs text-slate-400">
            Valor de las existencias por tipo de producto
          </p>

          {categorias.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">
              No hay productos registrados.
            </p>
          ) : (
            <div className="space-y-3">
              {categorias.map((categoria) => (
                <div
                  key={categoria.categoria}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-700 bg-[#0F172A] p-3"
                >
                  <span className="text-sm text-slate-300">
                    {categoria.categoria}
                  </span>

                  <span className="font-bold text-slate-100">
                    {formatoDinero(categoria.valor)}
                  </span>
                </div>
              ))}

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-700 pt-4">
                <span className="text-sm font-bold text-slate-100">
                  Valor total del inventario
                </span>

                <span className="text-lg font-extrabold text-emerald-300">
                  {formatoDinero(valorTotalInventario)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
