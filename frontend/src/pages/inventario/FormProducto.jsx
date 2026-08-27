import React, { useState } from 'react';
import { X, Save } from 'lucide-react';

export default function FormProducto({ onClose, onGuardar }) {
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    categoria: 'Periféricos',
    costo: '',
    precio: '',
    stock: '',
    minStock: 5
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Validación básica
    if (!formData.nombre || !formData.costo || !formData.precio) {
      alert('Por favor completa los campos obligatorios');
      return;
    }
    // Aquí se enviará la información a Python
    console.log('Nuevo Producto:', formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
        
        <div className="p-6 bg-slate-800 text-white flex justify-between items-center">
          <h2 className="text-lg font-bold">Registrar Nuevo Producto</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Código / SKU</label>
              <input
                type="text"
                name="codigo"
                placeholder="PROD-004"
                value={formData.codigo}
                onChange={handleChange}
                className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Categoría</label>
              <select
                name="categoria"
                value={formData.categoria}
                onChange={handleChange}
                className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="Periféricos">Periféricos</option>
                <option value="Pantallas">Pantallas</option>
                <option value="Accesorios">Accesorios</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre del Producto *</label>
            <input
              type="text"
              name="nombre"
              required
              placeholder="Ej: Auriculares Bluetooth"
              value={formData.nombre}
              onChange={handleChange}
              className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Precio Costo ($) *</label>
              <input
                type="number"
                step="0.01"
                name="costo"
                required
                placeholder="0.00"
                value={formData.costo}
                onChange={handleChange}
                className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Precio Venta ($) *</label>
              <input
                type="number"
                step="0.01"
                name="precio"
                required
                placeholder="0.00"
                value={formData.precio}
                onChange={handleChange}
                className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Stock Inicial *</label>
              <input
                type="number"
                name="stock"
                required
                placeholder="0"
                value={formData.stock}
                onChange={handleChange}
                className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Stock Mínimo (Alerta)</label>
              <input
                type="number"
                name="minStock"
                value={formData.minStock}
                onChange={handleChange}
                className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Save size={16} /> Guardar Producto
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}