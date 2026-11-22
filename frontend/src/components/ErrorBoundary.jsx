import React from 'react';

/**
 * Evita la pantalla negra: si algo falla al pintar una página se muestra
 * un mensaje con botón de recarga en lugar de dejar la vista vacía.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Error de la interfaz:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-900 p-6 text-center text-slate-100">
          <h1 className="text-xl font-bold">Algo salió mal al mostrar esta página</h1>
          <p className="max-w-md text-sm text-slate-300">
            {String(this.state.error?.message || this.state.error)}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700"
          >
            Recargar la página
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
