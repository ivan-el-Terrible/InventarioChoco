import { useState } from 'react';
import { Eye, EyeOff, LockKeyhole, Package, UserRound } from 'lucide-react';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('admin@choco.com');
  const [password, setPassword] = useState('123456');
  const [mostrar, setMostrar] = useState(false);
  const [error, setError] = useState('');

  const ingresar = (event) => {
    event.preventDefault();
    if (!email.trim() || !password.trim()) return setError('Ingresa tu correo y contraseña.');
    setError('');
    onLogin({ nombre: email.toLowerCase().startsWith('admin') ? 'Iván' : email.split('@')[0], rol: email.toLowerCase().startsWith('admin') ? 'admin' : 'vendedor' });
  };

  return (
    <main className="grid min-h-screen bg-slate-950 lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-gradient-to-br from-[#0B1220] via-[#123F73] to-[#2563A6] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full border-[60px] border-white/10" />
          <div className="relative flex items-center gap-3">
            <div className="rounded-xl bg-white/15 p-3">
              <Package size={28} />
            </div>
            <span className="text-xl font-bold">Inventario Choco</span>
          </div>
          <div className="relative max-w-lg">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[.2em] text-blue-100">Control simple y confiable</p>
            <h1 className="text-4xl font-extrabold leading-tight">Tus ventas y existencias, organizadas en un solo lugar.</h1>
            <p className="mt-5 text-base leading-7 text-blue-100">Consulta productos, registra entradas y realiza ventas con información clara para tomar mejores decisiones.</p>
          </div>
            <p className="relative text-sm text-blue-100">Sistema de gestión comercial</p>
      </section>
      <section className="flex items-center justify-center bg-[#0B1220] p-6">
         {/* Contenedor del logo y formulario */}
        <div className="flex w-full max-w-md flex-col items-center gap-5">

            {/* Logo encima del formulario */}
          <img
            src="/logo-repuestos.jpg"
            alt="Logo Repuestos Volvo Parts"
            className="h-46 w-46 object-contain drop-shadow-xl"
            />

          <div className="w-full max-w-md rounded-2xl border border-[#B8C4D0]/40 bg-[#25364B] p-7 shadow-xl shadow-black/30 sm:p-9">          <div className="mb-8">
            <div className="mb-5 inline-flex rounded-xl bg-blue-600 p-3 text-white lg:hidden">
              <Package size={26} />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-100">Bienvenido</h2>
            <p className="mt-2 text-sm text-slate-200">Ingresa tus datos para acceder al sistema.</p>
          </div>
          <form onSubmit={ingresar} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-200">Correo electrónico</label>
              <div className="relative">
                <UserRound className="absolute left-3 top-3 text-slate-400" size={18} />
                <input value={email} onChange={e => setEmail(e.target.value)} type="email" className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[#2563A6] focus:ring-2 focus:ring-[#2563A6]" />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-200">Contraseña</label>
              <div className="relative">
                <LockKeyhole className="absolute left-3 top-3 text-slate-400" size={18} />
                <input value={password} onChange={e => setPassword(e.target.value)} type={mostrar ? 'text' : 'password'} className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-11 text-sm outline-none focus:border-[#2563A6] focus:ring-2 focus:ring-[#2563A6]" />
                <button type="button" 
                  onClick={() => setMostrar(!mostrar)} className="absolute right-3 top-2.5 p-1 text-slate-400" aria-label="Mostrar contraseña">
                  {mostrar ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            {error && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
            <button 
              className="w-full rounded-xl bg-[#2563A6] py-3 text-sm font-bold text-white shadow-lg shadow-blue-900/30 transition hover:bg-[#347FC4]">Ingresar al sistema
            </button>
          </form>
          <p className="mt-6 text-center text-xs text-slate-200">Prueba local: admin@choco.com / 123456</p>
        </div>
        </div> {/* Cierre del contenedor del logo y formulario */}
      </section>
    </main>
  );
}
