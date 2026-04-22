# 🎨 Vista previa - Interfaz Catálogo Excel Proyecciones

## 📊 Pantalla principal - Escritorio

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  📊 CATÁLOGO EXCEL - PROYECCIONES                         📤 Cargar    │
│  Gesiona los productos para proyecciones mientras Odoo se completa    │
│                                                           Excel         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                 │
│  │  Productos   │  │    Página    │  │  Mostrando   │                 │
│  │      45      │  │     2 / 3    │  │   21-40      │                 │
│  └──────────────┘  └──────────────┘  └──────────────┘                 │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  🔍 Buscar por SKU, nombre o color...                                   │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────┬──────────────────┬──────────┬──────────┬────────┬───────────┐ │
│  │ SKU │ NOMBRE           │ COLOR    │ TALLA    │ ORIGEN │ ACCIONES  │ │
│  ├─────┼──────────────────┼──────────┼──────────┼────────┼───────────┤ │
│  │001  │Bicicleta Road    │Rojo      │M         │📋 Excel│    🗑️     │ │
│  │002  │Bicicleta MTB     │Azul      │L         │📋 Excel│    🗑️     │ │
│  │003  │Casco Safety      │Negro     │-         │🔗 Odoo │    🗑️     │ │
│  │004  │Cambio Shimano    │Plateado  │Único     │📋 Excel│    🗑️     │ │
│  │005  │Llanta Kenda      │Negro     │700x35c   │📋 Excel│    🗑️     │ │
│  │...  │...               │...       │...       │...     │...        │ │
│  └─────┴──────────────────┴──────────┴──────────┴────────┴───────────┘ │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│          [← Anterior]  [1] [2] [3] [4] [5]  [Siguiente →]            │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│                              🔄 Vaciar Catálogo                        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📱 Pantalla principal - Móvil

```
┌──────────────────────┐
│                      │
│ 📊 CATÁLOGO EXCEL   │
│   PROYECCIONES       │
│                      │
│ Gesiona productos    │
│ mientras Odoo se     │
│ completa             │
│                      │
│  [📤 Cargar Excel]   │
│                      │
├──────────────────────┤
│ Productos: 45        │
│ Página: 2/3          │
│ Mostrando: 21-40     │
├──────────────────────┤
│ 🔍 Buscar...         │
├──────────────────────┤
│                      │
│ SKU: 001             │
│ Nombre: Bicicleta... │
│ Color: Rojo          │
│ Origen: 📋 Excel     │
│ [🗑️]                │
│                      │
│ SKU: 002             │
│ Nombre: Bicicleta... │
│ Color: Azul          │
│ Origen: 📋 Excel     │
│ [🗑️]                │
│                      │
├──────────────────────┤
│ [← Anterior]         │
│ [1][2][3][4][5]      │
│ [Siguiente →]        │
├──────────────────────┤
│                      │
│ [🔄 Vaciar]          │
│                      │
└──────────────────────┘
```

---

## 📤 Modal de carga - Paso 1: Seleccionar archivo

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  Cargar Catálogo Excel                              ✕              │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                                                             │  │
│  │           📁 Haz clic o arrastra tu                        │  │
│  │              archivo Excel aquí                           │  │
│  │                                                             │  │
│  │        Formatos soportados: .xlsx, .xls                   │  │
│  │                                                             │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  📋 Formato esperado del Excel:                                     │
│                                                                     │
│  • Columna A: SKU (requerido)                                       │
│  • Columna B: NOMBRE (requerido)                                    │
│  • Columna C: COLOR (opcional)                                      │
│  • Columna D: TALLA (opcional)                                      │
│                                                                     │
│  La primera fila se asume como encabezado                           │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                      [Cancelar]  [📤 Cargar]                      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📤 Modal de carga - Paso 2: Archivo seleccionado

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  Cargar Catálogo Excel                              ✕              │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                                                             │  │
│  │           📁 Haz clic o arrastra tu                        │  │
│  │              archivo Excel aquí                           │  │
│  │                                                             │  │
│  │        Formatos soportados: .xlsx, .xls                   │  │
│  │                                                             │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ✅ Archivo seleccionado: productos_mayo_2026.xlsx                 │
│                                                                     │
│  📋 Formato esperado del Excel:                                     │
│                                                                     │
│  • Columna A: SKU (requerido)                                       │
│  • Columna B: NOMBRE (requerido)                                    │
│  • Columna C: COLOR (opcional)                                      │
│  • Columna D: TALLA (opcional)                                      │
│                                                                     │
│  La primera fila se asume como encabezado                           │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                      [Cancelar]  [📤 Cargar]                      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📤 Modal de carga - Paso 3: Procesando

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  Cargar Catálogo Excel                              ✕              │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                        Procesando...                                │
│                                                                     │
│                           ⟳                                        │
│                        (animado)                                    │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                   [Cancelar]  [Cargando...]                       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📤 Modal de carga - Paso 4: Exitoso

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  Cargar Catálogo Excel                              ✕              │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                          ✅                                         │
│                                                                     │
│           Archivo cargado exitosamente                             │
│           • Productos cargados: 50                                 │
│           • Duplicados: 2                                          │
│                                                                     │
│                   (Se cierra automáticamente)                      │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                   [Cancelar]  [📤 Cargar]                         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔍 Tabla con búsqueda

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  🔍 Buscar por SKU, nombre o color...                                 │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────┬──────────────────┬──────────┬──────────┬────────┬────────┐ │
│  │ SKU │ NOMBRE           │ COLOR    │ TALLA    │ ORIGEN │ACCIONES│ │
│  ├─────┼──────────────────┼──────────┼──────────┼────────┼────────┤ │
│  │001  │Bicicleta Road    │Rojo      │M         │📋 Excel│  🗑️   │ │  Resultado
│  │002  │Bicicleta Road XL │Rojo      │XL        │📋 Excel│  🗑️   │ │  filtrado
│  │008  │Bicicleta Road-o  │Rojo      │L         │📋 Excel│  🗑️   │ │  por "Road"
│  │015  │Bicicleta Mountain│Rojo      │M         │📋 Excel│  🗑️   │ │
│  └─────┴──────────────────┴──────────┴──────────┴────────┴────────┘ │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 🗑️ Confirmación de eliminación

```
¿Eliminar "Bicicleta Road"?

[Cancelar]  [Sí, eliminar]
```

(Alerta nativa del navegador)

---

## 🔄 Confirmación vaciar catálogo

```
⚠️ ¿Estás seguro de que deseas vaciar TODO el catálogo?
   Esta acción no se puede deshacer.

[Cancelar]  [Sí, vaciar]

(En caso afirmativo, aparece segunda confirmación)

⚠️ Segunda confirmación: ¿Realmente quieres vaciar el catálogo?

[Cancelar]  [Sí, vaciar todo]
```

---

## 📊 Tabla sin productos

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│                           📭                                        │
│                                                                      │
│                   No hay productos cargados                        │
│                                                                      │
│      Carga tu primer archivo Excel con los productos para           │
│                       proyecciones                                   │
│                                                                      │
│                   [📤 Cargar Excel Ahora]                           │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 🎨 Colores y tema

```
Fondo principal:      #1a1916 (negro muy oscuro)
Fondo secundario:     #252422 (gris oscuro)
Borde/Separador:      #403D39 (gris medio)
Texto principal:      #FFFCF2 (blanco crudo)
Texto secundario:     #CCC5B9 (gris claro)
Texto deshabilitado:  #8a8077 (gris oscuro)

Color principal:      #EB5E28 (naranja Elite Bike)
Hover/Active:         #d45322 (naranja más oscuro)

Éxito:                #4ade80 (verde)
Error:                #dc3545 (rojo)
Info:                 #0dcaf0 (azul)
```

---

## 🏃 Flujo de usuario típico

```
1. Navega a /admin/catalogo-proyecciones
         ↓
[Ve tabla con productos previos]
         ↓
2. Haz click en "📤 Cargar Excel"
         ↓
[Abre modal]
         ↓
3. Selecciona archivo productos.xlsx
         ↓
[Muestra preview]
         ↓
4. Click en "📤 Cargar"
         ↓
[Muestra spinner]
         ↓
5. ✅ Exitoso - Modal se cierra automáticamente
         ↓
[Tabla actualizada con nuevos productos]
         ↓
6. (Opcional) Busca productos
         ↓
7. (Opcional) Elimina productos
         ↓
8. Crea proyección con SKU validado ✅
```

---

## 📊 Esquema de colores completo

La interfaz usa el **tema Elite Bike** consistente con:
- Top bar
- Dashboards existentes
- Otros componentes

Esto garantiza que se vea como parte de la aplicación.

---

## ✨ Animaciones

- **Modal:** Slide-in desde arriba con easing cubik-bezier
- **Tabla:** Hover suave con color de fondo
- **Botones:** Elevación al pasar el mouse
- **Spinner:** Rotación continua
- **Transiciones:** 0.3s por defecto (suave)

---

## 🎯 Resumen visual

| Elemento | Tamaño | Color |
|---|---|---|
| Encabezado | 1.8rem | Naranja #EB5E28 |
| Cards | 2rem | Gris oscuro |
| Tabla | Variable | Gris claro |
| Botones | 0.9rem | Naranja |
| Iconos | 0.95-4rem | Varios |

**Total de pantalla:** Responsive (mobile a desktop)

---

**Nota:** Esta es la **vista previa de texto**. La interfaz real tiene animaciones suaves, sombras, degradados y un pulido visual completo.
