import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Componentes
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Login from './pages/Login';

// Páginas (Asegúrate de que la ruta del archivo exista)
import ListaProductos from './pages/inventario/ListaProductos';
import EntradaStock from './pages/inventario/EntradaStock';
import DashboardInv from './pages/inventario/DashboardInv';
import VentasPro from './pages/VentasPro';
import './App.css';

export default function App() {
  const [usuarioActual, setUsuarioActual] = useState(null);
  const [menuAbierto, setMenuAbierto] = useState(false);

  if (!usuarioActual) return <Login onLogin={setUsuarioActual} />;

  return (
    <BrowserRouter>
      <div className="app-shell text-slate-800">
        <Sidebar usuario={usuarioActual} abierto={menuAbierto} onClose={() => setMenuAbierto(false)} onLogout={() => setUsuarioActual(null)} />

        <main className="app-content overflow-x-hidden">
          <Header usuario={usuarioActual} onMenu={() => setMenuAbierto(true)} />
          <Routes>
            <Route path="/" element={<Navigate to="/inventario/dashboard" replace />} />
            <Route path="/inventario/productos" element={<ListaProductos />} />
            <Route path="/inventario/entradas" element={<EntradaStock />} />
            <Route path="/inventario/dashboard" element={<DashboardInv />} />
            <Route path="/ventas" element={<VentasPro />} />
            <Route path="*" element={<Navigate to="/inventario/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
