
import React, { useEffect, useState } from 'react';
import {
  Plus,
  Users,
  ShieldCheck,
  UserRound,
  X,
  Trash2,
  UserCheck,
  UserX
} from 'lucide-react';

const API = '';

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [procesandoId, setProcesandoId] = useState(null);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [usuarioActualId, setUsuarioActualId] = useState(null);

  const [formulario, setFormulario] = useState({
    nombre: '',
    email: '',
    password: '',
    rol: 'vendedor'
  });

  // =========================================
  // CARGAR USUARIOS
  // =========================================
  const cargarUsuarios = async () => {
    const respuesta = await fetch(`${API}/usuarios`, {
      credentials: 'include'
    });

    const datos = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(datos.error || 'No se pudieron cargar los usuarios');
    }

    setUsuarios(datos);
  };

  // =========================================
  // CARGAR DATOS INICIALES
  // =========================================
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [resUsuarios, resSesion] = await Promise.all([
          fetch(`${API}/usuarios`, { credentials: 'include' }),
          fetch(`${API}/sesion`, { credentials: 'include' })
        ]);

        const datosUsuarios = await resUsuarios.json();
        const datosSesion = await resSesion.json();

        if (!resUsuarios.ok) {
          throw new Error(
            datosUsuarios.error || 'No se pudieron cargar los usuarios'
          );
        }

        if (!resSesion.ok) {
          throw new Error(
            datosSesion.error || 'No se pudo consultar la sesión'
          );
        }

        setUsuarios(datosUsuarios);
        setUsuarioActualId(datosSesion.usuario.id);
      } catch (err) {
        setError(err.message);
      }
    };

    cargarDatos();
  }, []);

  // =========================================
  // CREAR USUARIO
  // =========================================
  const crearUsuario = async (e) => {
    e.preventDefault();

    setError('');
    setMensaje('');
    setGuardando(true);

    try {
      const respuesta = await fetch(`${API}/usuarios`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formulario)
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(datos.error || 'No se pudo crear el usuario');
      }

      await cargarUsuarios();

      setModalAbierto(false);
      setFormulario({
        nombre: '',
        email: '',
        password: '',
        rol: 'vendedor'
      });

      setMensaje('Usuario creado correctamente');
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  // =========================================
  // ACTIVAR / DESACTIVAR USUARIO
  // =========================================
  const cambiarEstado = async (usuario) => {
    const nuevoEstado = !Boolean(usuario.activo);
    const accion = nuevoEstado ? 'activar' : 'desactivar';

    if (usuario.id === usuarioActualId && !nuevoEstado) {
      setError('No puedes desactivar tu propia cuenta');
      return;
    }

    const confirmar = window.confirm(
      `¿Estás seguro de ${accion} a "${usuario.nombre}"?`
    );

    if (!confirmar) return;

    setError('');
    setMensaje('');
    setProcesandoId(usuario.id);

    try {
      const respuesta = await fetch(
        `${API}/usuarios/${usuario.id}/estado`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            activo: nuevoEstado
          })
        }
      );

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          datos.error || 'No se pudo cambiar el estado del usuario'
        );
      }

      await cargarUsuarios();

      setMensaje(
        `Usuario ${nuevoEstado ? 'activado' : 'desactivado'} correctamente`
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setProcesandoId(null);
    }
  };

  // =========================================
  // ELIMINAR USUARIO
  // =========================================
  const eliminarUsuario = async (usuario) => {
    if (usuario.id === usuarioActualId) {
      setError('No puedes eliminar tu propia cuenta');
      return;
    }

    const confirmar = window.confirm(
      `¿Estás seguro de eliminar a "${usuario.nombre}"?\n\n` +
      'Esta acción no se puede deshacer.\n' +
      'Si tiene ventas registradas, el sistema impedirá eliminarlo.'
    );

    if (!confirmar) return;

    setError('');
    setMensaje('');
    setProcesandoId(usuario.id);

    try {
      const respuesta = await fetch(
        `${API}/usuarios/${usuario.id}`,
        {
          method: 'DELETE',
          credentials: 'include'
        }
      );

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          datos.error || 'No se pudo eliminar el usuario'
        );
      }

      await cargarUsuarios();

      setMensaje('Usuario eliminado correctamente');
    } catch (err) {
      setError(err.message);
    } finally {
      setProcesandoId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] p-6 text-slate-100">

      {/* ENCABEZADO */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            Administración de usuarios
          </h1>
          <p className="text-sm text-slate-400">
            Gestiona administradores y vendedores del sistema.
          </p>
        </div>

        <button
          onClick={() => {
            setError('');
            setMensaje('');
            setModalAbierto(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2.5 font-semibold text-white hover:bg-blue-500"
        >
          <Plus size={18} />
          Agregar usuario
        </button>
      </div>

      {/* INDICADORES */}
      <div className="mb-5 grid gap-4 sm:grid-cols-3">

        <div className="flex items-center gap-3 rounded-xl border border-slate-700 bg-[#1E293B] p-5">
          <Users className="text-blue-400" size={28} />
          <div>
            <p className="text-sm text-slate-400">
              Usuarios registrados
            </p>
            <p className="text-2xl font-bold">
              {usuarios.length}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-slate-700 bg-[#1E293B] p-5">
          <UserCheck className="text-emerald-400" size={28} />
          <div>
            <p className="text-sm text-slate-400">
              Usuarios activos
            </p>
            <p className="text-2xl font-bold">
              {usuarios.filter((u) => Boolean(u.activo)).length}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-slate-700 bg-[#1E293B] p-5">
          <UserX className="text-amber-400" size={28} />
          <div>
            <p className="text-sm text-slate-400">
              Usuarios inactivos
            </p>
            <p className="text-2xl font-bold">
              {usuarios.filter((u) => !Boolean(u.activo)).length}
            </p>
          </div>
        </div>
      </div>

      {/* MENSAJES */}
      {error && !modalAbierto && (
        <p className="mb-4 rounded-lg border border-rose-800 bg-rose-950 p-3 text-rose-200">
          {error}
        </p>
      )}

      {mensaje && (
        <p className="mb-4 rounded-lg border border-emerald-800 bg-emerald-950 p-3 text-emerald-200">
          {mensaje}
        </p>
      )}

      {/* TABLA */}
      <div className="overflow-x-auto rounded-xl border border-slate-700 bg-[#1E293B]">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#334155] text-slate-200">
            <tr>
              <th className="p-4">Nombre</th>
              <th className="p-4">Correo electrónico</th>
              <th className="p-4">Rol</th>
              <th className="p-4">Estado</th>
              <th className="p-4">Fecha de registro</th>
              <th className="p-4 text-center">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {usuarios.map((u) => {
              const esCuentaActual = u.id === usuarioActualId;
              const procesando = procesandoId === u.id;
              const activo = Boolean(u.activo);

              return (
                <tr
                  key={u.id}
                  className="border-t border-slate-700 hover:bg-slate-700/30"
                >
                  <td className="p-4 font-semibold">
                    {u.nombre}
                    {esCuentaActual && (
                      <span className="ml-2 text-xs text-blue-400">
                        (Tú)
                      </span>
                    )}
                  </td>

                  <td className="p-4 text-slate-300">
                    {u.email}
                  </td>

                  <td className="p-4">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${
                        u.rol === 'admin'
                          ? 'bg-blue-900 text-blue-200'
                          : 'bg-emerald-900 text-emerald-200'
                      }`}
                    >
                      {u.rol === 'admin' ? (
                        <ShieldCheck size={14} />
                      ) : (
                        <UserRound size={14} />
                      )}

                      {u.rol === 'admin'
                        ? 'Administrador'
                        : 'Vendedor'}
                    </span>
                  </td>

                  <td className="p-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                        activo
                          ? 'bg-emerald-900 text-emerald-200'
                          : 'bg-slate-600 text-slate-200'
                      }`}
                    >
                      {activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>

                  <td className="p-4 text-slate-400">
                    {u.fecha_creacion || '—'}
                  </td>

                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">

                      {/* ACTIVAR / DESACTIVAR */}
                      <button
                        type="button"
                        onClick={() => cambiarEstado(u)}
                        disabled={
                          procesandoId !== null ||
                          esCuentaActual
                        }
                        className={`inline-flex w-28 items-center justify-center gap-2 rounded-lg px-2 py-1 text-xs font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                          activo
                            ? 'bg-black hover:bg-red-700'
                            : 'bg-green-900 hover:bg-green-700'
                        }`}
                        title={
                          esCuentaActual
                            ? 'No puedes desactivar tu propia cuenta'
                            : activo
                              ? 'Desactivar usuario'
                              : 'Activar usuario'
                        }
                      >
                        {activo ? (
                          <UserX size={15} />
                        ) : (
                          <UserCheck size={15} />
                        )}

                        {procesando
                          ? 'Procesando...'
                          : activo
                            ? 'Desactivar'
                            : 'Activar'}
                      </button>

                      {/* ELIMINAR */}
                      <button
                        type="button"
                        onClick={() => eliminarUsuario(u)}
                        disabled={
                          procesandoId !== null ||
                          esCuentaActual
                        }
                        className="inline-flex items-center gap-2 rounded-lg bg-red-900 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                        title={
                          esCuentaActual
                            ? 'No puedes eliminar tu propia cuenta'
                            : 'Eliminar usuario'
                        }
                      >
                        <Trash2 size={15} />
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {usuarios.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="p-8 text-center text-slate-400"
                >
                  No hay usuarios registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL AGREGAR USUARIO */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-600 bg-[#25364B] p-6 shadow-2xl">

            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold">
                Agregar usuario
              </h2>

              <button
                type="button"
                onClick={() => setModalAbierto(false)}
                title="Cerrar"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={crearUsuario} className="space-y-4">

              <div>
                <label className="mb-1 block text-sm">
                  Nombre completo
                </label>
                <input
                  required
                  value={formulario.nombre}
                  onChange={(e) =>
                    setFormulario({
                      ...formulario,
                      nombre: e.target.value
                    })
                  }
                  className="w-full rounded-lg border border-slate-500 bg-[#0F172A] p-3 text-white"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm">
                  Correo electrónico
                </label>
                <input
                  required
                  type="email"
                  value={formulario.email}
                  onChange={(e) =>
                    setFormulario({
                      ...formulario,
                      email: e.target.value
                    })
                  }
                  className="w-full rounded-lg border border-slate-500 bg-[#0F172A] p-3 text-white"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm">
                  Contraseña
                </label>
                <input
                  required
                  type="password"
                  minLength={8}
                  value={formulario.password}
                  onChange={(e) =>
                    setFormulario({
                      ...formulario,
                      password: e.target.value
                    })
                  }
                  className="w-full rounded-lg border border-slate-500 bg-[#0F172A] p-3 text-white"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm">
                  Rol
                </label>
                <select
                  value={formulario.rol}
                  onChange={(e) =>
                    setFormulario({
                      ...formulario,
                      rol: e.target.value
                    })
                  }
                  className="w-full rounded-lg border border-slate-500 bg-[#0F172A] p-3 text-white"
                >
                  <option value="vendedor">Vendedor</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <p className="text-xs text-slate-300">
                El nuevo usuario se registrará como activo.
              </p>

              {error && (
                <p className="rounded-lg bg-rose-950 p-3 text-sm text-rose-200">
                  {error}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="rounded-lg bg-slate-600 px-4 py-2 hover:bg-slate-500"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={guardando}
                  className="rounded-lg bg-blue-600 px-4 py-2 font-semibold hover:bg-blue-500 disabled:opacity-60"
                >
                  {guardando ? 'Guardando...' : 'Crear usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
