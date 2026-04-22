# Referencia Rápida - Interfaz Catálogo Excel Proyecciones

## 📍 Ubicación en archivos

```
EB_FRONT/src/app/
├── services/
│   ├── catalogo-excel.service.ts ...................... Service (API)
│   └── catalogo-excel.service.spec.ts
└── components/
    └── cargar-catalogo-proyecciones/
        ├── cargar-catalogo-proyecciones.component.ts.... Lógica
        ├── cargar-catalogo-proyecciones.component.html.. Template
        ├── cargar-catalogo-proyecciones.component.css... Estilos
        ├── cargar-catalogo-proyecciones.component.spec.ts
        └── GUIA_INTEGRACION.md

EB_BACK/
└── routes/
    └── forecast.py .................... Endpoints implementados
```

---

## 🗺️ Integración en 3 pasos

### Paso 1: Importar componente en tu ruta

```typescript
// app.routes.ts
import { CargarCatalogoproyeccionesComponent } from './components/cargar-catalogo-proyecciones/cargar-catalogo-proyecciones.component';

{
  path: 'admin/catalogo-proyecciones',
  component: CargarCatalogoproyeccionesComponent,
  canActivate: [AuthGuard]
}
```

### Paso 2: Agregar link en navbar

```html
<a routerLink="/admin/catalogo-proyecciones">📊 Catálogo Proyecciones</a>
```

### Paso 3: Listo. Eso es todo.

El componente es **standalone** y **contenido**. No necesita nada más.

---

## 🎯 Características principales

| Funcionalidad | Cómo se usa | Notas |
|---|---|---|
| **Cargar Excel** | Click en botón "📤 Cargar Excel" | Soporta .xlsx y .xls |
| **Buscar** | Escribe en el input "🔍 Buscar..." | Busca por SKU, nombre, color |
| **Filtrar** | Automático mientras escribes | Sin botón, en tiempo real |
| **Paginar** | Botones debajo de tabla | 20 registros por página (ajustable) |
| **Eliminar** | Click en 🗑️ por producto | Requiere confirmación |
| **Vaciar todo** | Click en "🔄 Vaciar Catálogo" | Requiere 2 confirmaciones |
| **Ver origen** | Columna "Origen" | Excel 📋 o Odoo 🔗 |
| **Estadísticas** | Panel superior | Total, página, rango |

---

## 📋 Formato del Excel

**Columnas (en este orden):**

| A | B | C | D |
|---|---|---|---|
| **SKU** | **NOMBRE** | *COLOR* | *TALLA* |
| 001 | Bicicleta Road Pro | Rojo | M |
| 002 | Bicicleta MTB | Azul | L |

**Requerido:** A + B  
**Opcional:** C + D  
**Encabezado:** Primera fila  
**Duplicados:** Se actualizan (UPSERT)

---

## 🔗 Endpoints (ya implementados)

```
POST   /admin/productos-excel/cargar     → Cargar archivo
GET    /admin/productos-excel             → Listar con search
DELETE /admin/productos-excel/:sku        → Eliminar uno
POST   /admin/productos-excel/vaciar     → Vaciar todo
```

Ver detalles en [GUIA_INTEGRACION.md](GUIA_INTEGRACION.md#-api-endpoints-backend)

---

## 🎨 Estilos

- **Tema:** Oscuro Elite Bike (gradientes negro → gris)
- **Color principal:** Naranja #EB5E28
- **Responsive:** Automático (mobile, tablet, desktop)
- **Animaciones:** Suave (buttons, modales, carga)

---

## 🔐 Autorización

⚠️ **En producción**, agregar `@require_jwt` a endpoints.

```python
@forecast_bp.route('/admin/productos-excel/cargar', methods=['POST'])
@require_jwt
def cargar_productos():
    ...
```

Ver [GUIA_INTEGRACION.md](GUIA_INTEGRACION.md#-seguridad)

---

## 🧪 Testing

```bash
ng test --include='**/catalogo-excel**'
```

Coverage:
- ✅ Carga de archivos
- ✅ Búsqueda y filtrado
- ✅ Eliminación
- ✅ Paginación
- ✅ Validación Excel

---

## 📱 Uso desde Proyecciones

Cuando el usuario crea una proyección:

1. Valida SKU contra **Excel** (prioridad)
2. Si no existe, busca en **Odoo**
3. Si no existe, muestra **error**

Esto garantiza que no haya "SKU no encontrado" en proyecciones temporales.

---

## 🚀 Quick Start

1. Copiar archivos a tu EB_FRONT
2. Importar componente en rutas
3. Agregar link en navbar
4. ✅ Listo

**No requiere configuración adicional.**

---

## 📊 Información técnica

- **Framework:** Angular 19 (standalone)
- **State management:** RxJS BehaviorSubject
- **HTTP:** HttpClient con interceptors
- **Memory:** Limpieza automática con takeUntil
- **Bundle:** ~8 KB gzipped

---

## ❓ FAQ

**P: ¿Qué pasa si cargo el mismo SKU dos veces?**  
R: Se actualiza (UPSERT). Los productos se deduplican automáticamente.

**P: ¿Puedo eliminar toda la tabla?**  
R: Sí, con "🔄 Vaciar Catálogo". Requiere confirmación doble por seguridad.

**P: ¿Se sincroniza con Odoo automáticamente?**  
R: No. Excel tiene prioridad, pero los SKUs de Odoo también se ven como fallback.

**P: ¿Funciona en móvil?**  
R: Sí. Es 100% responsive. El modal se adapta automáticamente.

**P: ¿Se pierden datos si recargo la página?**  
R: No. Los datos se guardan en la BD. Solo la sesión local se pierde.

---

## 📝 Soporte

Revisa [GUIA_INTEGRACION.md](GUIA_INTEGRACION.md) para:
- Integración detallada
- API endpoints completos
- Ejemplos de curls
- Troubleshooting

---

**Última actualización:** 21 de abril, 2026  
**Versión:** 1.0  
**Estado:** Producción
