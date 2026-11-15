
from flask import Blueprint, jsonify
from database.database import get_db
from auth import roles_permitidos

dashboard_bp = Blueprint("dashboard", __name__)

STOCK_CRITICO = 5


@dashboard_bp.route("/dashboard", methods=["GET"])
@roles_permitidos("admin")
def obtener_dashboard():
    db = get_db()

    try:
        # =========================================
        # 1. VENTAS DEL MES
        # =========================================
        resumen = db.execute("""
            SELECT
                COUNT(*) AS ordenes,
                COALESCE(SUM(total), 0) AS ventas_mes
            FROM ventas
            WHERE strftime('%Y-%m', fecha) =
                  strftime('%Y-%m', 'now', 'localtime')
        """).fetchone()

        ventas_mes = float(resumen["ventas_mes"] or 0)
        ordenes = int(resumen["ordenes"] or 0)

        ticket_promedio = (
            ventas_mes / ordenes if ordenes > 0 else 0
        )

        # =========================================
        # 2. GANANCIA ESTIMADA DEL MES
        # =========================================
        costos = db.execute("""
            SELECT
                COALESCE(
                    SUM(
                        d.cantidad *
                        COALESCE(
                            p.costo_promedio,
                            p.precio_compra,
                            0
                        )
                    ),
                    0
                ) AS costo_total
            FROM detalle_ventas d
            INNER JOIN ventas v
                ON v.id = d.id_venta
            INNER JOIN productos p
                ON p.id = d.id_producto
            WHERE strftime('%Y-%m', v.fecha) =
                  strftime('%Y-%m', 'now', 'localtime')
        """).fetchone()

        costo_total = float(costos["costo_total"] or 0)

        ganancia_estimada = ventas_mes - costo_total

        margen_promedio = (
            ganancia_estimada / ventas_mes * 100
            if ventas_mes > 0 else 0
        )

        # =========================================
        # 3. PRODUCTOS CRITICOS
        # =========================================
        criticos = db.execute("""
            SELECT COUNT(*) AS cantidad
            FROM productos
            WHERE COALESCE(stock, 0) <= ?
        """, (STOCK_CRITICO,)).fetchone()

        productos_criticos = int(criticos["cantidad"] or 0)

        # =========================================
        # 4. PRODUCTOS MAS VENDIDOS DEL MES
        # =========================================
        filas_vendidos = db.execute("""
            SELECT
                p.id,
                p.nombre,
                SUM(d.cantidad) AS cantidad_vendida
            FROM detalle_ventas d
            INNER JOIN productos p
                ON p.id = d.id_producto
            INNER JOIN ventas v
                ON v.id = d.id_venta
            WHERE strftime('%Y-%m', v.fecha) =
                  strftime('%Y-%m', 'now', 'localtime')
            GROUP BY p.id, p.nombre
            ORDER BY cantidad_vendida DESC, p.nombre ASC
            LIMIT 5
        """).fetchall()

        productos_mas_vendidos = [
            {
                "id": fila["id"],
                "nombre": fila["nombre"],
                "cantidad": float(fila["cantidad_vendida"])
            }
            for fila in filas_vendidos
        ]

        # =========================================
        # 5. VALOR DEL INVENTARIO POR TIPO
        # =========================================
        filas_inventario = db.execute("""
            SELECT
                COALESCE(NULLIF(TRIM(tipo), ''), 'Sin categoría')
                    AS categoria,
                COALESCE(
                    SUM(
                        COALESCE(stock, 0) *
                        COALESCE(
                            costo_promedio,
                            precio_compra,
                            0
                        )
                    ),
                    0
                ) AS valor
            FROM productos
            GROUP BY COALESCE(
                NULLIF(TRIM(tipo), ''),
                'Sin categoría'
            )
            ORDER BY valor DESC
        """).fetchall()

        valor_inventario = [
            {
                "categoria": fila["categoria"],
                "valor": round(float(fila["valor"]), 2)
            }
            for fila in filas_inventario
        ]

        return jsonify({
            "ventas_mes": round(ventas_mes, 2),
            "ganancia_estimada": round(ganancia_estimada, 2),
            "ordenes_realizadas": ordenes,
            "ticket_promedio": round(ticket_promedio, 2),
            "margen_promedio": round(margen_promedio, 2),
            "productos_criticos": productos_criticos,
            "limite_stock_critico": STOCK_CRITICO,
            "productos_mas_vendidos": productos_mas_vendidos,
            "valor_inventario": valor_inventario
        }), 200

    except Exception as e:
        print("ERROR EN DASHBOARD:", repr(e))

        return jsonify({
            "error": "No se pudieron cargar los indicadores del dashboard"
        }), 500

    finally:
        db.close()
