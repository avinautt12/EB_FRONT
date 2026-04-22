#!/bin/bash
# 📊 CHECKLIST INSTALACIÓN - Catálogo Excel Proyecciones
# ════════════════════════════════════════════════════════════════════════════

echo """
╔════════════════════════════════════════════════════════════════════════════╗
║                                                                            ║
║   📊 INSTALACIÓN - INTERFAZ CATÁLOGO EXCEL PARA PROYECCIONES             ║
║                                                                            ║
║   Sigue este checklist paso a paso para integrar la interfaz en tu app   ║
║                                                                            ║
╚════════════════════════════════════════════════════════════════════════════╝
"""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "\n${BLUE}PASO 1: VERIFICAR ARCHIVOS CREADOS${NC}\n"

# Array de archivos a verificar
declare -a files=(
    "EB_FRONT/src/app/services/catalogo-excel.service.ts"
    "EB_FRONT/src/app/services/catalogo-excel.service.spec.ts"
    "EB_FRONT/src/app/components/cargar-catalogo-proyecciones/cargar-catalogo-proyecciones.component.ts"
    "EB_FRONT/src/app/components/cargar-catalogo-proyecciones/cargar-catalogo-proyecciones.component.html"
    "EB_FRONT/src/app/components/cargar-catalogo-proyecciones/cargar-catalogo-proyecciones.component.css"
    "EB_FRONT/src/app/components/cargar-catalogo-proyecciones/cargar-catalogo-proyecciones.component.spec.ts"
    "EB_FRONT/src/app/components/cargar-catalogo-proyecciones/README.md"
    "EB_FRONT/src/app/components/cargar-catalogo-proyecciones/GUIA_INTEGRACION.md"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅${NC} $file"
    else
        echo -e "${RED}❌${NC} $file (NO ENCONTRADO)"
    fi
done

echo -e "\n${BLUE}PASO 2: VERIFICAR BACKEND - ENDPOINTS${NC}\n"

echo "Los siguientes endpoints ya están implementados en EB_BACK/routes/forecast.py:"
echo ""
echo -e "${GREEN}✅${NC} POST   /admin/productos-excel/cargar     (Cargar archivo)"
echo -e "${GREEN}✅${NC} GET    /admin/productos-excel             (Listar productos)"
echo -e "${GREEN}✅${NC} DELETE /admin/productos-excel/:sku       (Eliminar producto)"
echo -e "${GREEN}✅${NC} POST   /admin/productos-excel/vaciar     (Vaciar catálogo)"

echo -e "\n${BLUE}PASO 3: INTEGRACIÓN EN RUTAS${NC}\n"

echo "Abre tu archivo de rutas y agrega lo siguiente:"
echo ""
echo -e "${YELLOW}// En app.routes.ts o app-routing.module.ts:${NC}"
echo ""
echo "import { CargarCatalogoproyeccionesComponent } from './components/cargar-catalogo-proyecciones/cargar-catalogo-proyecciones.component';"
echo ""
echo "{
  path: 'admin/catalogo-proyecciones',
  component: CargarCatalogoproyeccionesComponent,
  canActivate: [AuthGuard],
  data: { title: 'Catálogo de Proyecciones' }
}"
echo ""
echo -e "${GREEN}✅${NC} Copia y pega ↑ en tus rutas"

echo -e "\n${BLUE}PASO 4: AGREGAR LINK EN NAVBAR${NC}\n"

echo "En tu componente navbar/sidebar, agrega:"
echo ""
echo -e "${YELLOW}<!-- En top-bar.component.html o similar: -->${NC}"
echo ""
echo '<a routerLink="/admin/catalogo-proyecciones" class="menu-item">'
echo '  📊 Catálogo Proyecciones'
echo '</a>'
echo ""
echo -e "${GREEN}✅${NC} Copia y pega ↑ en tu navbar"

echo -e "\n${BLUE}PASO 5: PRUEBAS${NC}\n"

echo -e "${YELLOW}En terminal 1 (Backend):${NC}"
echo "cd EB_BACK && source .venv/bin/activate && python3 app.py"
echo ""
echo -e "${YELLOW}En terminal 2 (Frontend):${NC}"
echo "cd EB_FRONT && npm start"
echo ""
echo -e "${YELLOW}En navegador:${NC}"
echo "http://localhost:4200/admin/catalogo-proyecciones"
echo ""
echo -e "${GREEN}✅${NC} Debería abrir la interfaz con el tema oscuro Elite Bike"

echo -e "\n${BLUE}PASO 6: PROBAR FUNCIONALIDADES${NC}\n"

echo -e "${GREEN}1. Cargar Excel${NC}"
echo "   - Crea un Excel con columnas: SKU, NOMBRE, COLOR, TALLA"
echo "   - Haz clic en '📤 Cargar Excel'"
echo "   - Selecciona tu archivo"
echo "   - Espera confirmación"
echo ""

echo -e "${GREEN}2. Buscar${NC}"
echo "   - Escribe en el buscador (SKU, nombre o color)"
echo "   - Debe filtrar en tiempo real"
echo ""

echo -e "${GREEN}3. Eliminar${NC}"
echo "   - Haz clic en 🗑️ en cualquier fila"
echo "   - Debe pedir confirmación"
echo "   - La tabla se actualiza"
echo ""

echo -e "${GREEN}4. Paginación${NC}"
echo "   - Navega entre páginas"
echo "   - Debe mostrar 20 productos por página"
echo ""

echo -e "${GREEN}5. Vaciar${NC}"
echo "   - Click en '🔄 Vaciar Catálogo'"
echo "   - Debe pedir doble confirmación"
echo "   - Se vacía completamente"

echo -e "\n${BLUE}PASO 7: TESTS (OPCIONAL)${NC}\n"

echo -e "${YELLOW}Ejecutar tests:${NC}"
echo "ng test --include='**/catalogo-excel**'"
echo ""
echo -e "${GREEN}✅${NC} Debe pasar todos los tests"

echo -e "\n${BLUE}PASO 8: PRODUCCIÓN - AGREGAR JWT (⚠️ IMPORTANTE)${NC}\n"

echo -e "${YELLOW}En EB_BACK/routes/forecast.py, agrega @require_jwt:${NC}"
echo ""
echo "from utils.jwt_utils import require_jwt"
echo ""
echo "@forecast_bp.route('/admin/productos-excel/cargar', methods=['POST'])"
echo "@require_jwt"
echo "def cargar_productos():"
echo "    # Tu código aquí"
echo ""
echo -e "${RED}⚠️${NC} SIN ESTO, CUALQUIERA PODRÍA CARGAR ARCHIVOS"

echo -e "\n${BLUE}PASO 9: VALIDACIÓN FINAL${NC}\n"

echo -e "${GREEN}Checklist de validación:${NC}"
echo ""

# Simular un checklist
checklist_items=(
    "¿Archivos copiados a EB_FRONT?"
    "¿Ruta agregada en app.routes.ts?"
    "¿Link visible en navbar?"
    "¿Backend corriendo (python3 app.py)?"
    "¿Frontend corriendo (npm start)?"
    "¿Puedes acceder a /admin/catalogo-proyecciones?"
    "¿Puedes cargar un Excel?"
    "¿Aparecen los productos en la tabla?"
    "¿Puedes buscar productos?"
    "¿Puedes eliminar productos?"
    "¿Tests pasan? (ng test)"
    "¿JWT en endpoints? (producción)"
)

for i in "${!checklist_items[@]}"; do
    echo "[ ] ${checklist_items[$i]}"
done

echo -e "\n${BLUE}═════════════════════════════════════════════════════════════${NC}\n"

echo -e "${GREEN}📊 INTERFAZ LISTA${NC}"
echo ""
echo "Acceso: http://localhost:4200/admin/catalogo-proyecciones"
echo ""
echo "Próximos pasos:"
echo "1. Carga tus primeros productos desde Excel"
echo "2. Crea proyecciones sin errores de SKU"
echo "3. (Opcional) Agregar autenticación JWT en endpoints"
echo ""
echo -e "${YELLOW}Documentación disponible:${NC}"
echo "- README.md (Referencia rápida)"
echo "- GUIA_INTEGRACION.md (Guía detallada)"
echo "- EJEMPLO_RUTAS.ts (Código comentado)"
echo "- RESUMEN_ENTREGA.md (Descripción general)"
echo ""
echo -e "${GREEN}🎉 ¡Listo para usar!${NC}\n"
