# Interfaz de Carga - Catálogo Excel Proyecciones

## 📋 Descripción

Interfaz Angular 19 sencilla y elegante para cargar y gestionar productos desde Excel, específicamente diseñada para las **proyecciones** mientras Odoo se completa.

**Ubicación en el proyecto:**
```
EB_FRONT/src/app/
├── services/
│   ├── catalogo-excel.service.ts      ← Service de API
│   └── catalogo-excel.service.spec.ts
└── components/
    └── cargar-catalogo-proyecciones/
        ├── cargar-catalogo-proyecciones.component.ts
        ├── cargar-catalogo-proyecciones.component.html
        ├── cargar-catalogo-proyecciones.component.css
        └── cargar-catalogo-proyecciones.component.spec.ts
```

---

## 🚀 Cómo integrar en tu aplicación

### 1. **Opción A: Como ruta dedicada en el menú**

En tu archivo de rutas (`src/app/app.routes.ts`):

```typescript
import { Routes } from '@angular/router';
import { CargarCatalogoproyeccionesComponent } from './components/cargar-catalogo-proyecciones/cargar-catalogo-proyecciones.component';
import { AuthGuard } from './guards/auth.guard'; // Ajusta según tu guard

export const routes: Routes = [
  {
    path: 'admin/catalogo-proyecciones',
    component: CargarCatalogoproyeccionesComponent,
    canActivate: [AuthGuard], // Solo usuarios autenticados
    data: { title: 'Catálogo de Proyecciones' }
  },
  // ... otras rutas
];
```

Luego agrega un link en tu navbar/menú:
```html
<a routerLink="/admin/catalogo-proyecciones" class="menu-item">
  📊 Catálogo Proyecciones
</a>
```

### 2. **Opción B: Como modal dentro de la vista de Proyecciones**

Si ya tienes una vista de proyecciones (`src/app/views/proyecciones-view.component.ts`):

```typescript
import { CargarCatalogoproyeccionesComponent } from '../components/cargar-catalogo-proyecciones/cargar-catalogo-proyecciones.component';

export class ProyeccionesViewComponent {
  mostrarCatalogo = false;

  abrirCatalogo() {
    this.mostrarCatalogo = true;
  }

  cerrarCatalogo() {
    this.mostrarCatalogo = false;
  }
}
```

En el template:
```html
<button (click)="abrirCatalogo()" class="btn-action">📊 Gestionar Catálogo</button>

<div *ngIf="mostrarCatalogo" class="modal-wrapper">
  <app-cargar-catalogo-proyecciones></app-cargar-catalogo-proyecciones>
</div>
```

### 3. **Opción C: Lado a lado con formulario de proyecciones**

```html
<div class="container-grid">
  <div class="panel-proyecciones">
    <!-- Tu formulario/tabla de proyecciones aquí -->
  </div>
  
  <div class="panel-catalogo">
    <app-cargar-catalogo-proyecciones></app-cargar-catalogo-proyecciones>
  </div>
</div>
```

---

## 🎨 Diseño y características

### Visual
- **Tema:** Degradado oscuro Elite Bike (#1a1916 → #252422)
- **Color principal:** #EB5E28 (naranja Elite Bike)
- **Fuente:** System fonts (-apple-system, Segoe UI)
- **Responsive:** Se adapta a móvil, tablet y desktop

### Funcionalidades
✅ **Carga de archivos Excel** con validación de tipos  
✅ **Modal de carga** con feedback visual  
✅ **Búsqueda y filtrado** de productos  
✅ **Paginación** configurable (defecto: 20 registros)  
✅ **Eliminar productos** individuales  
✅ **Vaciar catálogo completo** con confirmación  
✅ **Estadísticas en tiempo real** (total, página, rango)  
✅ **Manejo de errores** con alertas visuales  
✅ **Indicadores de origen** (Excel vs Odoo)  

---

## 📋 Formato esperado del Excel

El archivo debe incluir:

```
┌─────┬────────────────────┬─────────┬────────┐
│ SKU │ NOMBRE             │ COLOR   │ TALLA  │
├─────┼────────────────────┼─────────┼────────┤
│ 001 │ Bicicleta Road Pro │ Rojo    │ M      │
│ 002 │ Bicicleta MTB      │ Azul    │ L      │
│ 003 │ Casco Safety       │ Negro   │ Único  │
└─────┴────────────────────┴─────────┴────────┘
```

**Columnas obligatorias:**
- **A: SKU** — Identificador único del producto
- **B: NOMBRE** — Descripción del producto

**Columnas opcionales:**
- **C: COLOR** — Color del producto
- **D: TALLA** — Tamaño/talla del producto

**Notas:**
- La primera fila se asume como encabezado
- Los encabezados pueden variar (ej: "SKU", "CODIGO", "Producto", "Descripción")
- Archivos soportados: `.xlsx`, `.xls`

---

## 🔧 API Endpoints (Backend)

La interfaz se comunica con estos endpoints que ya están implementados en Flask:

### 1. **Cargar archivos**
```bash
POST /admin/productos-excel/cargar
Content-Type: multipart/form-data

file: <archivo.xlsx>
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Archivo cargado exitosamente",
  "productos_cargados": 50,
  "duplicados": 2
}
```

### 2. **Listar productos**
```bash
GET /admin/productos-excel?search=BIKE&limit=20&offset=0
```

**Respuesta:**
```json
{
  "total": 2,
  "productos": [
    {
      "sku": "BIKE001",
      "nombre": "Bicicleta Road",
      "color": "Rojo",
      "talla": "M",
      "origen": "excel",
      "cargado_en": "2026-04-21T10:30:00"
    }
  ]
}
```

### 3. **Eliminar producto**
```bash
DELETE /admin/productos-excel/BIKE001
```

### 4. **Vaciar catálogo completo**
```bash
POST /admin/productos-excel/vaciar
X-Confirm-Action: vaciar_catalogo
```

---

## 🔐 Seguridad

⚠️ **IMPORTANTE:** En producción, los endpoints deben estar protegidos con JWT.

**Modificación necesaria en `routes/forecast.py`:**

```python
from utils.jwt_utils import verificar_token, require_jwt

@forecast_bp.route('/admin/productos-excel/cargar', methods=['POST'])
@require_jwt
def cargar_productos():
    # Solo usuarios autenticados pueden cargar
    ...

@forecast_bp.route('/admin/productos-excel/vaciar', methods=['POST'])
@require_jwt
def vaciar_catalogo():
    # Agregar validación de rol admin
    usuario = verificar_token(request.headers)
    if usuario.get('rol') != 'admin':
        return jsonify({'error': 'No autorizado'}), 403
    ...
```

---

## 📱 Uso desde la interfaz

### Flujo de usuario típico:

1. **Acceder a la interfaz:**
   - Navega a `/admin/catalogo-proyecciones`
   - O abre el modal "Gestionar Catálogo"

2. **Cargar productos:**
   - Haz clic en "📤 Cargar Excel"
   - Selecciona tu archivo `.xlsx`
   - Revisa el preview de columnas
   - Haz clic en "📤 Cargar"
   - Espera confirmación (puede tomar 2-5 segundos)

3. **Buscar y filtrar:**
   - Usa el buscador: busca por SKU, nombre o color
   - El filtrado es instantáneo (local)

4. **Gestionar productos:**
   - Elimina productos individuales con el botón 🗑️
   - O vacía toda el catálogo (requiere confirmación doble)

5. **Validar en proyecciones:**
   - Al crear una proyección, el sistema valida el SKU contra:
     - Primero: Productos en Excel (prioridad)
     - Si no existe: Busca en Odoo
     - Si no existe: Muestra error "SKU no encontrado"

---

## 🧪 Testing

Ejecuta los tests con:

```bash
# Frontend tests
ng test --watch=false

# Tests específicos del componente
ng test --include='**/cargar-catalogo-proyecciones**'

# Tests del service
ng test --include='**/catalogo-excel.service**'
```

---

## 📊 Estadísticas y monitoreo

Desde la interfaz puedes monitorear:
- **Total de productos:** Cantidad en el catálogo Excel
- **Página actual:** En qué página estás navegando
- **Rango:** Qué registros estás viendo (ej: "1-20 de 150")

---

## 🎯 Próximos pasos

1. **Agregar autenticación JWT** en los endpoints admin
2. **Implementar sync automático** Excel ↔ Odoo
3. **Agregar auditoría** de cambios (quién, cuándo, qué)
4. **Crear reportes** de uso del catálogo
5. **Integrar con dashboard** de proyecciones

---

## 📧 Soporte

Si encuentras errores:
1. Revisa la consola del navegador (F12)
2. Valida el formato del Excel (ver sección "📋 Formato esperado")
3. Verifica que el backend esté corriendo: `python3 app.py`
4. Comprueba que tu JWT token sea válido (si es requerido)

---

## 📝 Notas técnicas

- **Componente:** Standalone (Angular 19)
- **Patrón:** Service + Component con RxJS
- **Navegación:** Sin rutas internas (todo en un componente)
- **Estado:** Gestión local en el componente + service
- **Memory management:** Usa `takeUntil` para limpiar suscripciones en `ngOnDestroy`
- **Validación:** Frontend (tipo Excel) + Backend (contenido)

**Tamaño del bundle:**
- Service: ~3.2 KB
- Component (TS): ~8.1 KB
- CSS: ~14.5 KB
- Template: ~4.8 KB
- **Total:** ~30.6 KB (gzipped: ~8 KB)
