import { useEffect, useId, useState } from 'react';
import { Store } from 'lucide-react';

/**
 * Selector de tienda para el administrador (páginas de admin).
 * `valor` es el id elegido ('' = tienda por defecto) y `onChange` lo actualiza.
 * Mismo estilo que el filtro de usuario de Ventas por vendedor:
 * icono suelto + etiqueta + select, sin marco alrededor.
 */
export default function SelectorTienda({
  valor,
  onChange,
  etiqueta = 'Tienda:',
  defectoLabel = 'Mi tienda (por defecto)'
}) {
  const [tiendas, setTiendas] = useState([]);
  const idSelector = useId();

  useEffect(() => {
    let activo = true;
    (async () => {
      try {
        const respuesta = await fetch('/tiendas', { credentials: 'include' });
        if (!respuesta.ok) return;
        const datos = await respuesta.json();
        if (activo && Array.isArray(datos)) setTiendas(datos);
      } catch {
        /* sin tiendas: se queda con la opción por defecto */
      }
    })();
    return () => { activo = false; };
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Store size={19} className="text-blue-400" />
      <label htmlFor={idSelector}>{etiqueta}</label>
      <select
        id={idSelector}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-slate-600 bg-[#1E293B] px-4 py-2 text-white"
      >
        <option value="">{defectoLabel}</option>
        {tiendas.map((t) => (
          <option key={t.id} value={t.id} title={t.direccion || ''}>
            {t.nombre}
          </option>
        ))}
      </select>
    </div>
  );
}
