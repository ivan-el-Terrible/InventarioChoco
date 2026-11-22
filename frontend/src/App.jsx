
import React, { useEffect, useState } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Login from './pages/Login';
import ConfiguracionInicial from './pages/ConfiguracionInicial';

import Kardex from './pages/inventario/Kardex';
import ListaProductos from './pages/inventario/ListaProductos';
import EntradaStock from './pages/inventario/EntradaStock';
import DashboardInv from './pages/inventario/DashboardInv';
import VentasPro from './pages/VentasPro';
import DevolucionPro from './pages/DevolucionPro';
import Usuarios from './pages/Usuarios';
import VentasVendedores from './pages/VentasVendedores';
import Gastos from './pages/Gastos';

import './App.css';

const API = '';
export default function App() {
  const [usuarioActual, setUsuarioActual] = useState(null);
  const [verificandoSesion, setVerificandoSesion] = useState(true);
  const [requiereConfiguracion, setRequiereConfiguracion] = useState(false);
  const [errorInicial, setErrorInicial] = useState('');
  const [menuAbierto, setMenuAbierto] = useState(false);

  useEffect(() => {
    // Lee la respuesta como texto: si el servidor devuelve HTML en vez de
    // JSON (p. ej. abriendo la API directamente) no revienta la aplicación.
    const leerJson = async (respuesta) => {
      const texto = await respuesta.text();
      try {
        return JSON.parse(texto);
      } catch {
        throw new Error('El servidor no devolvió una respuesta válida.');
      }
    };

    const iniciarAplicacion = async () => {
      try {
        // Verificar si se necesita crear el primer administrador
        const respuestaConfig = await fetch(
          `${API}/configuracion/estado`,
          { credentials: 'include' }
        );

        if (!respuestaConfig.ok) {
          throw new Error('No se pudo verificar la configuración.');
        }

        const configuracion = await leerJson(respuestaConfig);

        if (configuracion?.requiere_configuracion) {
          setRequiereConfiguracion(true);
          return;
        }

        // Verificar si existe una sesión activa
        const respuestaSesion = await fetch(`${API}/sesion`, {
          credentials: 'include'
        });

        if (respuestaSesion.ok) {
          const datos = await leerJson(respuestaSesion);
          if (datos?.usuario) {
            setUsuarioActual(datos.usuario);
          }
        }

      } catch (error) {
        console.error('Error al iniciar aplicación:', error);
        setErrorInicial(
          'No se pudo conectar con el servidor. Verifica que Flask esté ejecutándose.'
        );
      } finally {
        setVerificandoSesion(false);
      }
    };

    iniciarAplicacion();
  }, []);

  const configuracionTerminada = () => {
    setRequiereConfiguracion(false);
    setUsuarioActual(null);
  };

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
        Verificando configuración y sesión...
      </div>
    );
  }

  if (errorInicial) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B1220] p-6 text-white">
        <p className="max-w-md text-center">{errorInicial}</p>
      </div>
    );
  }

  if (requiereConfiguracion) {
    return (
      <ConfiguracionInicial
        onConfigurado={configuracionTerminada}
      />
    );
  }

  if (!usuarioActual) {
    return <Login onLogin={setUsuarioActual} />;
  }

  const esAdmin = usuarioActual.rol === 'admin';
  const inicio = esAdmin ? '/inventario/dashboard' : '/ventas';

  const soloAdmin = (componente) =>
    esAdmin
      ? componente
      : <Navigate to="/ventas" replace />;

  return (
    <BrowserRouter>
      <div className="app-shell text-slate-100">
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
            <Route
              path="/"
              element={<Navigate to={inicio} replace />}
            />

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

            <Route
              path="/ventas"
              element={<VentasPro />}
            />

            {/* Devoluciones: admin y vendedor, sin restricciones */}
            <Route
              path="/devoluciones"
              element={<DevolucionPro />}
            />

            <Route
              path="/administracion/usuarios"
              element={soloAdmin(<Usuarios />)}
            />

            <Route
              path="/administracion/ventas"
              element={soloAdmin(<VentasVendedores />)}
            />

            <Route
              path="/gastos"
              element={<Gastos usuario={usuarioActual} />}
            />

            <Route
              path="*"
              element={<Navigate to={inicio} replace />}
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
