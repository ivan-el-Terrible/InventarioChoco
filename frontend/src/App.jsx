import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Login from './pages/Login';
import Kardex from './pages/inventario/Kardex';
import ListaProductos from './pages/inventario/ListaProductos';
import EntradaStock from './pages/inventario/EntradaStock';
import DashboardInv from './pages/inventario/DashboardInv';
import VentasPro from './pages/VentasPro';
import Usuarios from './pages/Usuarios';
import VentasVendedores from './pages/VentasVendedores';
import './App.css';

const API = 'http://localhost:5000';

export default function App() {
  const [usuarioActual, setUsuarioActual] = useState(null);
  const [verificandoSesion, setVerificandoSesion] = useState(true);
  const [menuAbierto, setMenuAbierto] = useState(false);

  useEffect(() => {
    const verificarSesion = async () => {
      try {
        const respuesta = await fetch(`${API}/sesion`, {
          credentials: 'include'
        });

        if (respuesta.ok) {
          const datos = await respuesta.json();
          setUsuarioActual(datos.usuario);
        }
      } catch (error) {
        console.error('Error al verificar sesión:', error);
      } finally {
        setVerificandoSesion(false);
      }
    };

    verificarSesion();
  }, []);

  const cerrarSesion = async () => {
    try {
      await fetch(`${API}/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      setUsuarioActual(null);
      setMenuAbierto(false);
    }
  };

  if (verificandoSesion) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B1220] text-white">
        Verificando sesión...
      </div>
    );
  }

  if (!usuarioActual) {
    return <Login onLogin={setUsuarioActual} />;
  }

  const esAdmin = usuarioActual.rol === 'admin';

  const inicio = esAdmin ? '/inventario/dashboard' : '/ventas';

  const soloAdmin = (componente) =>
    esAdmin ? componente : <Navigate to="/ventas" replace />;

  return (
    <BrowserRouter>
      <div className="app-shell text-slate-800">
        <Sidebar
          usuario={usuarioActual}
          abierto={menuAbierto}
          onClose={() => setMenuAbierto(false)}
          onLogout={cerrarSesion}
        />

        <main className="app-content overflow-x-hidden">
          <Header
            usuario={usuarioActual}
            onMenu={() => setMenuAbierto(true)}
          />

          <Routes>
            <Route path="/" element={<Navigate to={inicio} replace />} />

            <Route
              path="/inventario/productos"
              element={<ListaProductos usuario={usuarioActual} />}
            />

            <Route
              path="/inventario/entradas"
              element={soloAdmin(<EntradaStock />)}
            />

            <Route
              path="/inventario/dashboard"
              element={soloAdmin(<DashboardInv />)}
            />

            <Route
              path="/inventario/kardex"
              element={soloAdmin(<Kardex />)}
            />

            <Route path="/ventas" element={<VentasPro />} />

            <Route
              path="/administracion/usuarios"
              element={soloAdmin(<Usuarios />)}
            />

            <Route
              path="/administracion/ventas"
              element={soloAdmin(<VentasVendedores />)}
            />

            <Route path="*" element={<Navigate to={inicio} replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}