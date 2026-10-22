import React, { useState } from 'react';   {/*importamos react */}
import { ArrowDownCircle, Plus, CheckCircle, Package } from 'lucide-react';   {/*importamos los iconos de lucide-react */}


/*ESTO NO REGISTRA NUEVOS PRODUCTOS SOLO AÑADE PRODUCTOS YA EXIXTENTES INDICANDO LA CANTIDAD Y EL PROVEEDOR*/
export default function EntradaStock() { //duda
  const [productos] = useState([
    { id: 1,codOrigen: '123', codigo: 'PROD-001', nombre: 'Teclado Mecánico RGB', stock: 12, costo: 35.00 },
    { id: 2, codOrigen: '456', codigo: 'PROD-002', nombre: 'Mouse Inalámbrico Pro', stock: 3, costo: 15.00 },
    { id: 3, codOrigen: '789', codigo: 'PROD-003', nombre: 'Monitor 24" Full HD', stock: 8, costo: 110.00 },
  ]);

  const [proveedor, setProveedor] = useState(""); // esto es una variable estaica para almacenar el proveedor inicializada como vacia
  /*esto es para cuando el frontend se muestre un espacio vacio y dentro de este se introducira dato y este sera reemplazado
  en otras palabras dice que el estado al inicio debe de ser vacio*/
  const [numFactura, setNumFactura] = useState('');
  const [productoId, setProductoId] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [costoUnitario, setCostoUnitario] = useState('');
  const [exito, setExito] = useState(false);

  const handleRegistrar = (e) => {/*esto es el metodo quese ejecuta cuando presionamos el boton de enviar el formulario*/
    e.preventDefault();  /**evita que la pagina se recargue al enviar los datos */
    if (!productoId || !cantidad || !costoUnitario) { // esto vverifica que los campos no esten vacios 
      alert('Por favor completa todos los campos requeridos');
      return;
    }
    setExito(true);  // esto es para cambiar el estado de setexito 
    setTimeout(() => {
      setExito(false);
      setCantidad('');
      setCostoUnitario('');
      setNumFactura('');
    }, 2500);
  };

  const productoSeleccionado = productos.find(p => p.id === parseInt(productoId));

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
              <label className="block text-xs font-semibold text-slate-200 mb-1">Seleccionar Producto *</label>
              <select
                value={productoId}
                onChange={(e) => {
                  setProductoId(e.target.value);
                  const prod = productos.find(p => p.id === parseInt(e.target.value));
                  if (prod) setCostoUnitario(prod.costo);
                }}
                className="w-full p-2.5 bg-slate-200 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Elige un producto --</option>
                {productos.map(p => (
                  <option key={p.id} value={p.id}> {p.codOrigen} {p.codigo} - {p.nombre} (Stock actual: {p.stock})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-200  mb-1">Cantidad Recibida *</label>
                <input
                  type="number"
                  min="1"
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
                  step="0.01"
                  placeholder="0.00"
                  value={costoUnitario}
                  onChange={(e) => setCostoUnitario(e.target.value)}
                  className="w-full p-2.5 bg-slate-200 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-yellow-500 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-md"
            >
              <Plus size={18} /> Registrar Ingreso a Stock
            </button>
          </form>

          {exito && (
            <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg flex items-center gap-2">
              <CheckCircle size={18} /> Ingreso registrado correctamente. Stock actualizado.
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
