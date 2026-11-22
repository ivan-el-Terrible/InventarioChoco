import { useEffect, useRef } from 'react';

/**
 * Vuelve a ejecutar `callback` cada `intervalo` ms y al volver a la pestaña,
 * para que los cambios hechos por otra persona (precios, stock, ventas)
 * aparezcan solos sin recargar la página.
 *
 * El callback va en un ref para que el intervalo no se recree en cada render.
 */
export default function useAutoRefetch(callback, intervalo = 15000) {
  const ref = useRef(callback);

  useEffect(() => {
    ref.current = callback;
  }, [callback]);

  useEffect(() => {
    const ejecutar = () => {
      if (!document.hidden) {
        ref.current();
      }
    };

    const id = setInterval(ejecutar, intervalo);
    window.addEventListener('focus', ejecutar);
    document.addEventListener('visibilitychange', ejecutar);

    return () => {
      clearInterval(id);
      window.removeEventListener('focus', ejecutar);
      document.removeEventListener('visibilitychange', ejecutar);
    };
  }, [intervalo]);
}
