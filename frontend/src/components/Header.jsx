
import { useEffect, useState } from 'react';
import { Bell, Menu, Search, Package, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API = '';

export default function Header({ usuario, onMenu }) {
  const navigate = useNavigate();

  const [busqueda, setBusqueda] = useState('');
  const [productos, setProductos] = useState([]);
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const controlador = new AbortController();

    async function cargarProductos() {
      setCargando(true);
      setError('');

      try {
        const respuesta = await fetch(`${API}/productos`, {
          credentials: 'include',
          signal: controlador.signal
        });

        const datos = await respuesta.json();

        if (!respuesta.ok) {
          throw new Error(datos.error || 'Error al buscar productos');
        }

        setProductos(Array.isArray(datos) ? datos : []);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message);
        }
      } finally {
        if (!controlador.signal.aborted) {
          setCargando(false);
        }
      }
    }

    cargarProductos();

    return () => controlador.abort();
  }, []);

  const texto = busqueda.trim().toLowerCase();

  const resultados = texto
    ? productos.filter((producto) =>
        [
          producto.nombre,
          producto.codigo,
          producto.codOrigi,
          producto.marca
        ].some((campo) =>
          String(campo ?? '').toLowerCase().includes(texto)
        )
      ).slice(0, 6)
    : [];

  const seleccionarProducto = (producto) => {
    setBusqueda('');
    setMostrarResultados(false);

    navigate(
      `/inventario/productos?buscar=${encodeURIComponent(
        producto.codigo || producto.nombre
      )}`
    );
  };

  const buscarTodos = () => {
    if (!texto) return;

    setMostrarResultados(false);

    navigate(
      `/inventario/productos?buscar=${encodeURIComponent(busqueda.trim())}`
    );
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-slate-200 px-4 backdrop-blur md:px-6">

      <button
        onClick={onMenu}
        aria-label="Abrir menú"
        className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
      >
        <Menu size={22} />
      </button>

      {/* BUSCADOR GLOBAL */}
      <div className="relative hidden max-w-md flex-1 sm:block">

        <form
          onSubmit={(e) => {
            e.preventDefault();
            buscarTodos();
          }}
        >
          <Search
            className="absolute left-3 top-2.5 text-slate-400"
            size={20}
          />

          <input
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              setMostrarResultados(true);
            }}
            onFocus={() => setMostrarResultados(true)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setMostrarResultados(false);
              }
            }}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-9 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            placeholder="Buscar productos en el sistema..."
            aria-label="Buscar productos"
          />

          {busqueda && (
            <button
              type="button"
              onClick={() => {
                setBusqueda('');
                setMostrarResultados(false);
              }}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700"
              aria-label="Limpiar búsqueda"
            >
              <X size={18} />
            </button>
          )}
        </form>

        {/* RESULTADOS */}
        {mostrarResultados && texto && (
          <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">

            {cargando ? (
              <p className="p-4 text-sm text-slate-500">
                Cargando productos...
              </p>
            ) : error ? (
              <p className="p-4 text-sm text-red-600">
                {error}
              </p>
            ) : resultados.length === 0 ? (
              <p className="p-4 text-sm text-slate-500">
                No se encontraron productos.
              </p>
            ) : (
              resultados.map((producto) => (
                <button
                  key={producto.id}
                  type="button"
                  onClick={() => seleccionarProducto(producto)}
                  className="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left hover:bg-slate-100"
                >
                  <Package size={18} className="text-slate-500" />

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {producto.nombre}
                    </p>

                    <p className="text-xs text-slate-500">
                      Código: {producto.codigo} · Stock: {producto.stock}
                    </p>
                  </div>
                </button>
              ))
            )}

            <button
              type="button"
              onClick={buscarTodos}
              className="w-full bg-slate-50 px-4 py-3 text-center text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              Ver resultados en Inventario
            </button>
          </div>
        )}
      </div>

      {/* USUARIO Y NOTIFICACIONES */}
      <div className="ml-auto flex items-center gap-3">

        <button
          aria-label="Notificaciones"
          className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100"
        >
          <Bell size={19} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
        </button>

        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold text-slate-800">
            {usuario.nombre}
          </p>
          <p className="text-xs capitalize text-slate-500">
            {usuario.rol}
          </p>
        </div>

        <div className="grid h-9 w-9 place-items-center rounded-full bg-blue-600 text-sm font-bold text-white">
          {usuario.nombre.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
