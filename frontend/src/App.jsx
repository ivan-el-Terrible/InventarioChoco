import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Componentes
import Sidebar from './components/Sidebar';

// Páginas (Asegúrate de que la ruta del archivo exista)
import ListaProductos from './pages/inventario/ListaProductos';
import EntradaStock from './pages/inventario/EntradaStock';
import DashboardInv from './pages/inventario/DashboardInv';
import VentasPro from './pages/VentasPro';

export default function App() {
  const usuarioActual = { nombre: 'Iván', rol: 'admin' };

  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-slate-50 text-slate-800">
        <Sidebar usuario={usuarioActual} />

        <main className="flex-1 overflow-x-hidden">
          <Routes>
            <Route path="/" element={<Navigate to="/inventario/productos" replace />} />
            <Route path="/inventario/productos" element={<ListaProductos />} />
            <Route path="/inventario/entradas" element={<EntradaStock />} />
            <Route path="/inventario/dashboard" element={<DashboardInv />} />
            <Route path="/ventas" element={<VentasPro />} />
            <Route path="*" element={<div className="p-8 font-bold">Página no encontrada (404)</div>} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}