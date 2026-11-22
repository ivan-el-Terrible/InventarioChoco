/**
 * Abre un documento con los datos indicados y lanza el diálogo de impresión.
 * Se usa un iframe oculto para no bloquear la página principal.
 */
export function imprimirDocumento({ titulo, subtitulo, encabezado, tabla, pie }) {
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>${titulo}</title>
  <style>
    @page { size: landscape; margin: 12mm; }
    * { box-sizing: border-box; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      color: #0f172a;
      margin: 0;
      padding: 18px;
      font-size: 12px;
    }
    h1 { font-size: 20px; margin: 0 0 4px; }
    .sub { color: #475569; font-size: 12px; margin-bottom: 6px; }
    .meta { color: #334155; font-size: 11px; margin-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; }
    thead th {
      background: #e2e8f0;
      border: 1px solid #94a3b8;
      padding: 8px 10px;
      font-size: 16px;
      font-weight: 700;
      text-transform: uppercase;
      text-align: center;
      vertical-align: middle;
    }
    tbody td { border: 1px solid #cbd5e1; padding: 5px 8px; font-size: 11px; }
    tbody tr:nth-child(even) { background: #f8fafc; }
    .num { text-align: right; }
    .ctr { text-align: center; }
    .total { font-weight: bold; background: #e2e8f0; }
    .pie { margin-top: 14px; color: #64748b; font-size: 10px; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <h1>${titulo}</h1>
  ${subtitulo ? `<p class="sub">${subtitulo}</p>` : ''}
  ${encabezado ? `<p class="meta">${encabezado}</p>` : ''}
  ${tabla || ''}
  ${pie ? `<p class="pie">${pie}</p>` : ''}
</body>
</html>`;

  const marco = document.createElement('iframe');
  marco.setAttribute('aria-hidden', 'true');
  marco.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;';
  document.body.appendChild(marco);

  const doc = marco.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();

  const limpiar = () => {
    setTimeout(() => {
      if (marco.parentNode) marco.parentNode.removeChild(marco);
    }, 1000);
  };

  setTimeout(() => {
    try {
      marco.contentWindow.focus();
      marco.contentWindow.print();
    } finally {
      limpiar();
    }
  }, 350);
}

/** Escapa texto para insertarlo en el HTML de la impresión. */
export function escapar(valor) {
  return String(valor ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
