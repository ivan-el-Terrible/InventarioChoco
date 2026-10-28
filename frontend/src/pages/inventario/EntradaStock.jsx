import React, { useState, useEffect } from 'react';   {/*importamos react */}
import { ArrowDownCircle, Plus, CheckCircle, Package } from 'lucide-react';   {/*importamos los iconos de lucide-react */}


/*ESTO NO REGISTRA NUEVOS PRODUCTOS SOLO AÑADE PRODUCTOS YA EXIXTENTES INDICANDO LA CANTIDAD Y EL PROVEEDOR*/
export default function EntradaStock() { //duda
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const [proveedor, setProveedor] = useState(""); // esto es una variable estaica para almacenar el proveedor inicializada como vacia
  /*esto es para cuando el frontend se muestre un espacio vacio y dentro de este se introducira dato y este sera reemplazado
  en otras palabras dice que el estado al inicio debe de ser vacio*/
  const [numFactura, setNumFactura] = useState('');
  const [productoId, setProductoId] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const [cantidad, setCantidad] = useState('');
  const [costoUnitario, setCostoUnitario] = useState('');
  const [exito, setExito] = useState(false);

  const cargarProductos = async () => {
    setCargando(true);
    setError('');

    try {
      const respuesta = await fetch('/productos', {
        method: 'GET',
        credentials: 'include',
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          datos.error || `No se pudieron cargar los productos (${respuesta.status})`
        );
      }

      setProductos(datos.map(p => ({
        id: p.id,
        codOrigen: p.codOrigi ?? '',
        codigo: p.codigo ?? '',
        nombre: p.nombre,
        stock: Number(p.stock ?? 0),
        costo: Number(p.precio_compra ?? 0),
        costoPromedio: Number(p.costo_promedio ?? 0),
      })));

    } catch (err) {
      console.error('Error al cargar productos:', err);
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };



  useEffect(() => {
    cargarProductos();
  }, []);

  const handleRegistrar = async (e) => {
    e.preventDefault();

    setError('');
    setExito(false);

    const cantidadNumero = Number(cantidad);
    const costoNumero = Number(costoUnitario);

    if (!productoId || cantidad === '' || costoUnitario === '') {
      setError('Completa los campos obligatorios.');
      return;
    }

    if (!Number.isInteger(cantidadNumero) || cantidadNumero <= 0) {
      setError('La cantidad debe ser un número entero mayor a cero.');
      return;
    }

    if (!Number.isFinite(costoNumero) || costoNumero < 0) {
      setError('El costo unitario debe ser válido y no negativo.');
      return;
    }

    setGuardando(true);

    try {
      const respuesta = await fetch(
        `/productos/${productoId}/entrada`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            cantidad: cantidadNumero,
            costo_unitario: costoNumero
          })
        }
      );

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(resultado.error || 'Error al registrar la entrada');
      }

      await cargarProductos();

      setExito(true);
      setCantidad('');
      setCostoUnitario('');
      setNumFactura('');
      setProveedor('');
      setProductoId('');

    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };



  const productosFiltrados = productos.filter((p) => {
    const texto = `${p.nombre} ${p.codigo} ${p.codOrigen}`.toLowerCase();

      return texto.includes(busqueda.trim().toLowerCase());
      
    });
    

    const productoSeleccionado = productos.find(
      p => p.id === parseInt(productoId)
    );

  return (
    <div className="p-6 bg-slate-900 min-h-screen"> 
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100">AÑADIR PRODUCTOS AGOTADOS</h1> {/**este es el titulo de la pagina  */}
        <p className="text-slate-200 text-sm"> actualiza productos agotados de inventario</p> {/*esto es el subtitulo de la pagina */}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">


        {/* area del formulario*/}
        <div className="lg:col-span-2 bg-slate-800 p-6 rounded-2xl border border-slate-200 shadow-sm">
          <form onSubmit={handleRegistrar} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">Proveedor</label>
                  <input  /* esta es la entrada del proveedor */
                  /*este es lo mismo que el label de netBeans*/
                  type="text"/*tipo texto*/
                  placeholder="Empresa o Proveedor"/*este se mostrara en el input*/
                  value={proveedor}  //validando de la base de datos
                  onChange={(e) => setProveedor(e.target.value)}
                  className="w-full p-2.5 bg-slate-200 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">Nº Factura / Documento</label>
                <input
                  type="text"
                  placeholder="Ej: F-90821"
                  value={numFactura}
                  onChange={(e) => setNumFactura(e.target.value)}
                  className="w-full p-2.5 bg-slate-200 border border-slate-200 rounded-lg text-sm outline-none  focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1">
                Seleccionar Producto *
              </label>

              {/* Buscador en tiempo real */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar por nombre, código o código de origen..."
                  value={busqueda}
                  onChange={(e) => {
                    setBusqueda(e.target.value);
                    setMostrarResultados(true);
                  }}
                  onFocus={() => setMostrarResultados(true)}
                  className="w-full p-2.5 bg-slate-200 border border-slate-200 rounded-lg text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                />

                {/* Resultados debajo del buscador */}
                {mostrarResultados && busqueda.trim() !== '' && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-300 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">

                    {productosFiltrados.length > 0 ? (
                      productosFiltrados.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setProductoId(String(p.id));
                            setCostoUnitario(String(p.costo));
                            setBusqueda(`${p.codOrigen} - ${p.codigo} - ${p.nombre}`);
                            setMostrarResultados(false);
                          }}
                          className="w-full text-left px-3 py-3 border-b border-slate-200 hover:bg-blue-100 transition-colors"
                        >
                          <p className="font-semibold text-sm text-slate-800">
                            {p.nombre}
                          </p>

                          <p className="text-xs text-slate-500">
                            Origen: {p.codOrigen} | Código: {p.codigo}
                          </p>

                          <p className="text-xs text-blue-600">
                            Stock actual: {p.stock}
                          </p>
                        </button>
                      ))
                    ) : (
                      <p className="p-3 text-sm text-slate-500">
                        No se encontraron productos.
                      </p>
                    )}

                  </div>
                )}
              </div>

              {/* Producto seleccionado */}
              {productoSeleccionado && (
                <div className="mt-3 p-3 bg-blue-100 border border-blue-300 rounded-lg">
                  <p className="text-xs text-blue-600 font-semibold">
                    Producto seleccionado
                  </p>

                  <p className="text-sm font-bold text-slate-800">
                    {productoSeleccionado.nombre}
                  </p>

                  <p className="text-xs text-slate-600">
                    Código: {productoSeleccionado.codigo}
                    {' | '}
                    Stock: {productoSeleccionado.stock}
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-200  mb-1">Cantidad Recibida *</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  required
                  placeholder="0"
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  className="w-full p-2.5 bg-slate-200 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-200  mb-1">Costo Unitario ($) *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={costoUnitario}
                  onChange={(e) => setCostoUnitario(e.target.value)}
                  className="w-full p-2.5 bg-slate-200 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            

            <button
              type="submit"
              disabled={guardando || cargando}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-slate-200 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={18} />
              {guardando ? 'Registrando entrada...' : 'Registrar Ingreso a Stock'}
            </button>
          </form>            

          {/* Mensaje de error */}
          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-200 text-red-700 text-sm rounded-lg">
              {error}
            </div>
          )}

          {/* Mensaje de éxito */}
          {exito && (
            <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg flex items-center gap-2">
              <CheckCircle size={18} />
              Ingreso registrado correctamente. Stock actualizado.
            </div>
          )}


        </div>

        {/* Resumen Lateral */}
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-100 text-base mb-4 flex items-center gap-2">
              <Package size={20} className="text-blue-600" /> Resumen del Ingreso
            </h3>
            {productoSeleccionado ? (
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-slate-200 rounded-lg">
                  <p className="text-xs text-slate-600">Producto:</p>
                  <p className="font-bold text-slate-800">{productoSeleccionado.nombre}</p>
                </div>
                <div className="flex justify-between border-b py-2">
                  <span className="text-slate-200">Stock Actual:</span>
                  <span className="font-bold text-red-600">
                    {productoSeleccionado.stock} unidades</span>
                </div>
                <div className="flex justify-between border-b py-2">
                  <span className="text-slate-200">Costo promedio actual:</span>
                  <span className="font-bold text-emerald-400">
                    Bs {Number(productoSeleccionado.costoPromedio ?? 0).toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between border-b py-2">
                  <span className="text-slate-200">Nuevo Stock:</span>
                  <span className="font-bold text-emerald-600">
                    {productoSeleccionado.stock + (parseInt(cantidad) || 0)} unidades
                  </span>
                </div>
                <div className="flex justify-between border-b py-2">
                  <span className="text-slate-200 ">Inversión Total:</span>
                  <span className="font-bold text-blue-600">
                    ${((parseInt(cantidad) || 0) * (parseFloat(costoUnitario) || 0)).toFixed(2)}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-slate-400 text-xs italic">Selecciona un producto para mostrar detalles.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
