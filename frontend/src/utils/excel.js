import ExcelJS from 'exceljs';

/**
 * Genera y descarga un Excel con estilo unificado:
 *  - Encabezados: tamaño 16, negrita, MAYÚSCULAS y centrados (al medio).
 *  - Columnas que se ajustan solas al contenido (texto largo = tabla más
 *    larga, sin recortar).
 *  - Primera fila fija al desplazar.
 *
 * hojas: [{ nombre: 'Ventas', filas: [{ col1: valor, col2: valor }] }]
 * Las claves del primer objeto (o de filas[0]) son los encabezados.
 */
export async function generarExcel(nombreArchivo, hojas) {
  const libro = new ExcelJS.Workbook();
  libro.creator = 'InventarioChoco';

  for (const hoja of hojas || []) {
    const filas = hoja.filas || [];
    const claves = Object.keys(filas[0] || {});
    if (!claves.length) continue;

    const ws = libro.addWorksheet(hoja.nombre || 'Hoja', {
      views: [{ state: 'frozen', ySplit: 1 }]
    });

    // Columnas con encabezado en MAYÚSCULAS (el texto tal cual, en mayúscula)
    ws.columns = claves.map((k) => ({ key: k, header: k.toUpperCase() }));

    // Filas de datos
    filas.forEach((fila) => ws.addRow(fila));

    // --- Estilo del encabezado: 16, negrita, centrado al medio ---
    const encabezado = ws.getRow(1);
    encabezado.height = 34;
    encabezado.eachCell((celda) => {
      celda.font = { name: 'Calibri', size: 16, bold: true };
      celda.alignment = {
        horizontal: 'center',
        vertical: 'middle',
        wrapText: false
      };
      celda.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFCBD5E1' }
      };
      celda.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'medium' },
        right: { style: 'thin' }
      };
    });

    // --- Datos: tamaño normal y con bordes finos ---
    for (let numero = 2; numero <= ws.rowCount; numero++) {
      const fila = ws.getRow(numero);
      fila.eachCell((celda) => {
        celda.font = { name: 'Calibri', size: 12 };
        celda.alignment = { vertical: 'middle', wrapText: false };
        celda.border = {
          top: { style: 'hair' },
          left: { style: 'hair' },
          bottom: { style: 'hair' },
          right: { style: 'hair' }
        };
      });
    }

    // --- Ancho de columna automatico: se ajusta al contenido ---
    claves.forEach((k) => {
      const anchoTexto = (texto, esEncabezado) => {
        const n = String(texto ?? '').length;
        // 16 pt negrita ocupa ~1.55 veces el ancho base de 12 pt
        return n * (esEncabezado ? 1.55 : 1.05) + 3;
      };
      let max = anchoTexto(k.toUpperCase(), true);
      filas.forEach((f) => {
        max = Math.max(max, anchoTexto(f[k], false));
      });
      // Minimo 10 para que no queden columnas apretadas
      ws.getColumn(k).width = Math.min(Math.max(max, 10), 70);
    });
  }

  const salida = await libro.xlsx.writeBuffer();
  const blob = new Blob([salida], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombreArchivo;
  enlace.style.display = 'none';
  document.body.appendChild(enlace);
  enlace.click();
  setTimeout(() => {
    document.body.removeChild(enlace);
    URL.revokeObjectURL(url);
  }, 1000);
}
