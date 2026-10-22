import React, { useState } from 'react';
import { 
  Search, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  CreditCard, 
  Banknote, 
  QrCode, 
  CheckCircle, 
  Receipt 
} from 'lucide-react';

export default function VentasPro() {
  // Catálogo de productos disponibles (Simulación de consulta a SQLite)
  const [productos] = useState([
    { id: 1, codOrigen: '123', codigo: 'PROD-001', nombre: 'cruzetas', precio: 65.00, stock: 12 },
    { id: 2, codOrigen: '456', codigo: 'PROD-002', nombre: 'correa dentada', precio: 30.00, stock: 5 },
    { id: 3, codOrigen: '789', codigo: 'PROD-003', nombre: 'rodamientos', precio: 180.00, stock: 8 },
    { id: 4, codOrigen: '012', codigo: 'PROD-004', nombre: 'pastillas', precio: 45.00, stock: 15 },
    { id: 5, codOrigen: '345', codigo: 'PROD-005', nombre: 'baterías', precio: 15.00, stock: 20 },
  ]);

  const [busqueda, setBusqueda] = useState('');
  const [carrito, setCarrito] = useState([]);
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [montoPagado, setMontoPagado] = useState('');
  const [ventaExitosa, setVentaExitosa] = useState(false);
  const [conFactura, setConFactura] = useState(true); // estado nuevo para calcular el cambio si se paga con factura o sin factura

  // Filtrar productos
  const productosFiltrados = productos.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.codOrigen.toLowerCase().includes(busqueda.toLowerCase())
  );

  // Agregar producto al carrito
  const agregarAlCarrito = (producto) => {
    if (producto.stock <= 0) {
      alert('Producto agotado');
      return;
    }

    const existe = carrito.find(item => item.id === producto.id);
    if (existe) {
      if (existe.cantidad >= producto.stock) {
        alert('No hay suficiente stock disponible');
        return;
      }
      setCarrito(carrito.map(item =>
        item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item
      ));
    } else {
      setCarrito([...carrito, { ...producto, cantidad: 1 }]);
    }
  };

  // Modificar cantidades en el carrito
  const cambiarCantidad = (id, cambio) => {
    setCarrito(carrito.map(item => {
      if (item.id === id) {
            const nuevaCant = item.cantidad + cambio;
            if (nuevaCant <= 0) return null;
            if (nuevaCant > item.stock) {
            alert('Límite de stock alcanzado');
            return item;
            }
            return { ...item, cantidad: nuevaCant };
        }
    return item;
    } ).filter(Boolean) );
  };

  // Eliminar producto del carrito
  const eliminarDelCarrito = (id) => {
    setCarrito(carrito.filter(item => item.id !== id));
  };

  // Cálculos financieros
  const subtotal = carrito.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
  const impuesto = subtotal * 0.13; // Ejemplo IVA 13%
  const total = subtotal + impuesto;
  const totalActual = conFactura ? total : subtotal;
  const cambio = parseFloat(montoPagado)
  ? Math.max(0, parseFloat(montoPagado) - totalActual)
  : 0;

  // Procesar venta
  const procesarVenta = (e, conFactura) => {
    e.preventDefault();

    if (carrito.length === 0) {
      alert('El carrito está vacío');
      return;
    }

    const totalAPagar = conFactura ? total : subtotal;
  
    if (metodoPago === 'efectivo' && (parseFloat(montoPagado) < totalAPagar || !montoPagado)) {
      alert('El monto pagado es insuficiente');
      return;
      }

      setVentaExitosa(true);
      // Aquí se enviará la venta a Flask / Python en el futuro, incluyendo si es con o sin factura
    }; 

  const nuevaVenta = () => {
    setCarrito([]);
    setMontoPagado('');
    setVentaExitosa(false);
  };



  /*de aqui para abajo es el codigo de la pagina de ventas, es decir el html y css de la pagina de ventas */

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-slate-900 overflow-hidden">
      
      {/* SECCIÓN IZQUIERDA: Catálogo de Productos */}
      <div className="flex-1 p-6 flex flex-col overflow-hidden">
        
        {/* Cabecera y Buscador */}
        <div className="mb-6 flex justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Punto de Venta</h1>
            <p className="text-slate-200 text-xs">Selecciona o busca productos para agregar a la nota de venta</p>
          </div>
          <div className="relative w-72">
            <Search className=" absolute left-3 top-2.5 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Busca por codOrigen, código o nombre..." /*este es el buscador de productos */
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-300 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            />
          </div>
        </div>

        {/* Grid de Tarjetas de Productos */}
        <div className="flex-1 overflow-y-auto pr-2">
          <div className="bg-slate-300 rounded-xl border border-slate-200 overflow-hidden">

            <table className="w-full text-left">
              <thead className="bg-slate-800 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-100">
                    Cod_Origen
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-100">
                    Código
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-100">
                    Producto
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-100">
                    Precio
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-100 text-right">
                    Stock
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {productosFiltrados.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => agregarAlCarrito(p)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="text-sm font-mono font-bold text-slate-900">
                        {p.codOrigen}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span className="text-sm font-mono font-bold text-slate-900">
                        {p.codigo}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span className="text-sm font-semibold text-slate-900">
                        {p.nombre}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span className="text-sm font-bold text-slate-900">
                        ${p.precio.toFixed(2)}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <span
                      /** condicion para que cuando el stock este bajo 5 me muestre en rojo */
                        className={`text-[12px] px-2 py-1 rounded-md font-bold ${
                          p.stock > 5
                            ? "bg-slate-100 text-black"
                            : "bg-amber-100 text-red-600"
                        }`}
                      >
                        {p.stock} pzas
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

          </div>
        </div>
      </div>

      {/* SECCIÓN DERECHA: Carrito y Cobro */}
      <div className="w-full lg:w-96 bg-slate-00 border-l border-slate-200 flex flex-col h-full shadow-lg">
        
        {/* Encabezado del Carrito */}
        <div className="p-4 border-b border-slate-200 flex items-center gap-2 bg-slate-500">
          <ShoppingCart className="text-red-500" size={25} />
          <h2 className="font-bold text-slate-100">Orden de Venta</h2>
          <span className="ml-auto bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">
            {carrito.reduce((acc, item) => acc + item.cantidad, 0)} ítems
          </span>
        </div>

        {/* Lista de Ítems en Carrito */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-slate-100">
          {carrito.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-6">
              <ShoppingCart size={48} className="mb-2 stroke-1 text-red-500" />
              <p className="text-sm text-slate-300">El carrito está vacío</p>
              <p className="text-xs text-slate-400 mt-1">Haz clic en los productos para agregarlos</p>
            </div>
          ) : (
            carrito.map((item) => (
              <div key={item.id} className="pt-3 first:pt-0 flex justify-between items-center">
                <div className="flex-1 pr-2">
                  <h4 className="text-sm font-semibold text-slate-100 truncate">{item.nombre}</h4>
                  <span className="text-xs text-slate-100">${item.precio.toFixed(2)} c/u</span>
                </div>
                
                {/* Controles de Cantidad */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center border border-blue-500 rounded-lg bg-slate-200">
                    <button
                      onClick={() => cambiarCantidad(item.id, -1)}
                      className="p-1 hover:bg-slate-400 text-slate-900 rounded-l-lg"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="px-2 text-xs font-bold text-black-500">{item.cantidad}</span>
                    <button
                      onClick={() => cambiarCantidad(item.id, 1)}
                      className="p-1 hover:bg-slate-400 text-slate-900 rounded-r-lg"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  
                  <button
                    onClick={() => eliminarDelCarrito(item.id)}
                    className="p-1 text-slate-300 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Totales y Métodos de Pago */}
        <div className="p-4 border-t border-slate-100 bg-slate-300 space-y-3">
          
          <div className="space-y-1 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Impuesto (13%):</span>
              <span>${impuesto.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-900">
              
              <span>Total sin factura:</span>
              <span className="text-red-600">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-900">
              
              <span>Total con factura:</span>
              <span className="text-blue-600">${total.toFixed(2)}</span>
            </div>
          </div>

          {/* Selección Método de Pago */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-900">
            <button
              onClick={() => setMetodoPago('efectivo')}
              className={`p-2 rounded-lg border text-xs font-medium flex flex-col items-center gap-1 ${
                metodoPago === 'efectivo' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-300 text-slate-700'
              }`}
            >
              <Banknote size={16} /> Efectivo
            </button>
            <button
              onClick={() => setMetodoPago('tarjeta')}
              className={`p-2 rounded-lg border text-xs font-medium flex flex-col items-center gap-1 ${
                metodoPago === 'tarjeta' ? 'bg-red-600 border-blue-600 text-white' : 'bg-white border-slate-300 text-slate-700'
              }`}
            >
              <CreditCard size={16} /> Tarjeta
            </button>
            <button
              onClick={() => setMetodoPago('qr')}
              className={`p-2 rounded-lg border text-xs font-medium flex flex-col items-center gap-1 ${
                metodoPago === 'qr' ? 'bg-red-600 border-blue-600 text-white' : 'bg-white border-slate-300 text-slate-700'
              }`}
            >
              <QrCode size={16} /> QR / Transf.
            </button>
          </div>

          {/* Cálculo de Cambio si es en Efectivo */}
          {metodoPago === 'efectivo' && (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Monto Entregado</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={montoPagado}
                  onChange={(e) => setMontoPagado(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Cambio a Devolver</label>
                <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-sm font-bold text-emerald-700">
                  ${cambio.toFixed(2)}
                </div>
              </div>
            </div>
          )}

          {/* Botón Completar Venta */}
          <button
            onClick={ (e) => { setConFactura(true); procesarVenta(e, true); } }
            disabled={carrito.length === 0}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2 mt-2"
          >
            
            <Receipt size={18} /> pagar con factura
          </button>
          

          <button 
          onClick={ (e) => { setConFactura(false); procesarVenta(e, false); } } 
          disabled={carrito.length === 0} className="w-full py-3 bg-red-500 hover:bg-red-700 disabled:bg-slate-300 text-white rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2 mt-2" 
          >
             <Receipt size={18} /> Procesar sin factura </button>
        </div>
      </div>


      {/* Modal de Confirmación / Recibo de Venta */}
      {ventaExitosa && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-800">¡Venta Registrada!</h3>
            <p className="text-xs text-slate-500 mt-1">El stock ha sido descontado del inventario automáticamente.</p>
            
            <div className="my-4 p-3 bg-slate-50 rounded-lg text-left text-xs space-y-1 border border-slate-200">
              <div className="flex justify-between text-slate-600"><span>Monto Total:</span> <strong className="text-slate-800">${totalActual.toFixed(2)}</strong></div>
              <div className="flex justify-between text-slate-600"><span>Método de Pago:</span> <strong className="uppercase text-slate-800">{metodoPago}</strong></div>
              {metodoPago === 'efectivo' && (
                <div className="flex justify-between text-slate-600"><span>Cambio Entregado:</span> <strong className="text-emerald-600">${cambio.toFixed(2)}</strong></div>
              )}
            </div>

            <button
              onClick={nuevaVenta}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm transition-colors"
            >
              Aceptar y Nueva Venta
            </button>
          </div>
        </div>
      )}

    </div>
  );
}