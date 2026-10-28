
import { useState } from 'react';
import {
  Package,
  UserRound,
  Mail,
  LockKeyhole,
  Eye,
  EyeOff
} from 'lucide-react';

const API = '';

export default function ConfiguracionInicial({ onConfigurado }) {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [mostrar, setMostrar] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const registrar = async (event) => {
    event.preventDefault();
    setError('');

    if (!nombre.trim() || !email.trim() || !password) {
      setError('Completa todos los campos.');
      return;
    }

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (password !== confirmar) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setCargando(true);

    try {
      const respuesta = await fetch(
        `${API}/configuracion/administrador`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            nombre: nombre.trim(),
            email: email.trim().toLowerCase(),
            password
          })
        }
      );

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          resultado.error || 'No se pudo crear el administrador.'
        );
      }

      onConfigurado();

    } catch (err) {
      setError(err.message || 'Error de conexión con el servidor.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <main className="grid min-h-screen bg-slate-950 lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-gradient-to-br from-[#0B1220] via-[#123F73] to-[#2563A6] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="relative flex items-center gap-3">
          <div className="rounded-xl bg-white/15 p-3">
            <Package size={28} />
          </div>
          <span className="text-xl font-bold">Inventario Choco</span>
        </div>

        <div className="relative max-w-lg">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[.2em] text-blue-100">
            Primera configuración
          </p>

          <h1 className="text-4xl font-extrabold leading-tight">
            Prepara tu sistema de inventario y ventas.
          </h1>

          <p className="mt-5 text-base leading-7 text-blue-100">
            Crea tu cuenta de administrador para comenzar
            a registrar productos, proveedores, usuarios y ventas.
          </p>
        </div>

        <p className="relative text-sm text-blue-100">
          Sistema de gestión comercial
        </p>
      </section>

      <section className="flex items-center justify-center bg-[#0B1220] p-6">
        <div className="flex w-full max-w-md flex-col items-center gap-5">
          <img
            src="/logo-repuestos.jpg"
            alt="Logo del negocio"
            className="h-36 w-36 object-contain drop-shadow-xl"
          />

          <div className="w-full rounded-2xl border border-[#B8C4D0]/40 bg-[#25364B] p-7 shadow-xl shadow-black/30 sm:p-9">
            <h2 className="text-2xl font-extrabold text-white">
              Crear administrador
            </h2>

            <p className="mt-2 mb-6 text-sm text-slate-200">
              Esta configuración se realiza una sola vez.
            </p>

            <form onSubmit={registrar} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-200">
                  Nombre completo
                </label>
                <div className="relative">
                  <UserRound className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-[#2563A6]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-200">
                  Correo electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-[#2563A6]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-200">
                  Contraseña
                </label>
                <div className="relative">
                  <LockKeyhole className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input
                    type={mostrar ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-11 text-sm outline-none focus:ring-2 focus:ring-[#2563A6]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setMostrar(!mostrar)}
                    className="absolute right-3 top-2.5 text-slate-400"
                  >
                    {mostrar ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-200">
                  Confirmar contraseña
                </label>
                <input
                  type={mostrar ? 'text' : 'password'}
                  value={confirmar}
                  onChange={(e) => setConfirmar(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#2563A6]"
                  required
                />
              </div>

              {error && (
                <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={cargando}
                className="w-full rounded-xl bg-[#2563A6] py-3 text-sm font-bold text-white transition hover:bg-[#347FC4] disabled:opacity-60"
              >
                {cargando
                  ? 'Creando administrador...'
                  : 'Crear cuenta de administrador'}
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
