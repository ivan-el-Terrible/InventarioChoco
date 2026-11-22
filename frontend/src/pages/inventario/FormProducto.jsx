import React, { useState } from 'react';
import { X, Save } from 'lucide-react';

export default function FormProducto({ idTienda, onClose, onGuardar }) {//tabla del formulario 
  const [formData, setFormData] = useState({
    codOriginal: '',
    codigo: '',
    nombre: '',
    categoria: 'Filtros',
    marca: '',
    unidad: 'unidad',
    proveedor: '',
    telefonoProveedor: '',
    costo: '',
    precio: '',
    stock: '',
    minStock: 5
  });

  const [guardando, setGuardando] = useState(false);
const [error, setError] = useState('');

  const handleChange = (e) => { //este es la funcion qe envia el formulario
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

 const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.nombre.trim() || formData.costo === '' || formData.precio === '' || formData.stock === '') {
      setError('Completa los campos obligatorios.');
      return;
    }

    const costo = Number(formData.costo);
    const precio = Number(formData.precio);
    const stock = Number(formData.stock);

    if (
      !Number.isFinite(costo) ||
      !Number.isFinite(precio) ||
      !Number.isFinite(stock) ||
      costo < 0 ||
      precio < 0 ||
      stock <= 0
    ) {
      setError('Los precios deben ser válidos y el stock inicial debe ser mayor a 0.');
      return;
    }

    const nuevoProducto = {
      cod_origen: formData.codOriginal.trim() || null,
      codigo: formData.codigo.trim() || null,
      nombre: formData.nombre.trim(),
      categoria: formData.categoria,
      marca: formData.marca.trim() || null,
      unidad: formData.unidad.trim() || null,
      proveedor: formData.proveedor.trim() || null,
      telefono_proveedor: formData.telefonoProveedor.trim() || null,
      descripcion: '',
      stock,
      precio_compra: costo,
      precio_venta: precio,
      ...(idTienda ? { id_tienda: idTienda } : {})
    };

    setGuardando(true);

    try {
      const respuesta = await fetch('/productos', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(nuevoProducto)
      });

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(resultado.error || 'No se pudo guardar el producto.');
      }

      await onGuardar();
      onClose();

    } catch (error) {
      console.error('Error al registrar producto:', error);
      setError(error.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-[#25364B] rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-slate-600">
        
        <div className="p-6 bg-[#334155] text-white flex justify-between items-center">
          <h2 className="text-lg font-bold">Registrar Nuevo Producto</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Código Original (OEM)
            </label>
            <input
              type="text"
              name="codOriginal"
              placeholder="Ej: 20998367"
              value={formData.codOriginal}
              onChange={handleChange}
              className="w-full p-2 border border-slate-500 bg-[#0F172A] rounded-lg text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>


          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Código / SKU</label>
              <input
                type="text"
                name="codigo"
                placeholder="PROD-004"
                value={formData.codigo}
                onChange={handleChange}
                className="w-full p-2 border border-slate-500 bg-[#0F172A] rounded-lg text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Categoría</label>
              <select
                name="categoria"
                value={formData.categoria}
                onChange={handleChange}
                className="w-full p-2 border border-slate-500 bg-[#0F172A] rounded-lg text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="Filtros">Filtros</option>
                <option value="Frenos">Frenos</option>
                <option value="Motor">Motor</option>
                <option value="Refrigeración">Refrigeración</option>
                <option value="Suspensión">Suspensión</option>
                <option value="Transmisión">Transmisión</option>
                <option value="Sensores">Sensores</option>
                <option value="Eléctrico">Eléctrico</option>
                <option value="Otros">Otros</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre del Producto *</label>
            <input
              type="text"
              name="nombre"
              required
              placeholder="Ej: Auriculares Bluetooth"
              value={formData.nombre}
              onChange={handleChange}
              className="w-full p-2 border border-slate-500 bg-[#0F172A] rounded-lg text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Marca</label>
              <input
                type="text"
                name="marca"
                placeholder="Ej: Volvo, Scania..."
                value={formData.marca}
                onChange={handleChange}
                className="w-full p-2 border border-slate-500 bg-[#0F172A] rounded-lg text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Unidad</label>
              <select
                name="unidad"
                value={formData.unidad}
                onChange={handleChange}
                className="w-full p-2 border border-slate-500 bg-[#0F172A] rounded-lg text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="unidad">unidad</option>
                <option value="juego">juego</option>
                <option value="par">par</option>
                <option value="caja">caja</option>
                <option value="metro">metro</option>
                <option value="litro">litro</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Proveedor</label>
              <input
                type="text"
                name="proveedor"
                placeholder="Empresa proveedora"
                value={formData.proveedor}
                onChange={handleChange}
                className="w-full p-2 border border-slate-500 bg-[#0F172A] rounded-lg text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Teléfono proveedor</label>
              <input
                type="text"
                name="telefonoProveedor"
                placeholder="Ej: 70000001"
                value={formData.telefonoProveedor}
                onChange={handleChange}
                className="w-full p-2 border border-slate-500 bg-[#0F172A] rounded-lg text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Precio Costo ($) *</label>
              <input
                type="number"
                step="0.01"
                name="costo"
                required
                placeholder="0.00"
                value={formData.costo}
                onChange={handleChange}
                className="w-full p-2 border border-slate-500 bg-[#0F172A] rounded-lg text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Precio Venta ($) *</label>
              <input
                type="number"
                step="0.01"
                name="precio"
                required
                placeholder="0.00"
                value={formData.precio}
                onChange={handleChange}
                className="w-full p-2 border border-slate-500 bg-[#0F172A] rounded-lg text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Stock Inicial *</label>
              <input
                type="number"
                name="stock"
                min="1"
                step="1"
                required
                placeholder="0"
                value={formData.stock}
                onChange={handleChange}
                className="w-full p-2 border border-slate-500 bg-[#0F172A] rounded-lg text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Stock Mínimo (Alerta)</label>
              <input
                type="number"
                name="minStock"
                value={formData.minStock}
                onChange={handleChange}
                className="w-full p-2 border border-slate-500 bg-[#0F172A] rounded-lg text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
          {/*errores en el formulario */}
          {error && (
            <p className="rounded-lg border border-rose-800 bg-rose-950 p-3 text-sm text-rose-200">
              {error}
            </p>
          )}

          <div className="pt-4 flex justify-end gap-2 border-t border-slate-600">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-500 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              <Save size={16} />
              {guardando ? 'Guardando...' : 'Guardar Producto'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
