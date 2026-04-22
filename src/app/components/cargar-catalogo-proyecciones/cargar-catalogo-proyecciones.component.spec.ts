import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CargarCatalogoproyeccionesComponent } from './cargar-catalogo-proyecciones.component';
import { CatalogoExcelService } from '../../services/catalogo-excel.service';
import { AlertaService } from '../../services/alerta.service';
import { of, throwError } from 'rxjs';

describe('CargarCatalogoproyeccionesComponent', () => {
  let component: CargarCatalogoproyeccionesComponent;
  let fixture: ComponentFixture<CargarCatalogoproyeccionesComponent>;
  let catalogoService: jasmine.SpyObj<CatalogoExcelService>;
  let alertaService: jasmine.SpyObj<AlertaService>;

  beforeEach(async () => {
    const catalogoServiceSpy = jasmine.createSpyObj('CatalogoExcelService', [
      'subirArchivo',
      'obtenerProductos',
      'eliminarProducto',
      'vaciarCatalogo'
    ]);

    const alertaServiceSpy = jasmine.createSpyObj('AlertaService', [
      'mostrarExito',
      'mostrarError'
    ]);

    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, CargarCatalogoproyeccionesComponent],
      providers: [
        { provide: CatalogoExcelService, useValue: catalogoServiceSpy },
        { provide: AlertaService, useValue: alertaServiceSpy }
      ]
    }).compileComponents();

    catalogoService = TestBed.inject(CatalogoExcelService) as jasmine.SpyObj<CatalogoExcelService>;
    alertaService = TestBed.inject(AlertaService) as jasmine.SpyObj<AlertaService>;

    catalogoService.obtenerProductos.and.returnValue(
      of({
        total: 2,
        productos: [
          { sku: 'BIKE001', nombre: 'Bicicleta Road', color: 'Rojo', talla: 'M', origen: 'excel' },
          { sku: 'BIKE002', nombre: 'Bicicleta MTB', color: 'Azul', talla: 'L', origen: 'excel' }
        ]
      })
    );

    fixture = TestBed.createComponent(CargarCatalogoproyeccionesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('debería cargar productos al iniciar', () => {
    expect(catalogoService.obtenerProductos).toHaveBeenCalled();
    expect(component.totalProductos).toBe(2);
  });

  it('debería abrir y cerrar modal', () => {
    expect(component.mostrarModal).toBe(false);
    component.abrirModalCarga();
    expect(component.mostrarModal).toBe(true);
    component.cerrarModal();
    expect(component.mostrarModal).toBe(false);
  });

  it('debería validar archivos Excel', () => {
    const excelFile = new File([''], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const txtFile = new File([''], 'test.txt', { type: 'text/plain' });

    expect(component['esArchivoExcel'](excelFile)).toBe(true);
    expect(component['esArchivoExcel'](txtFile)).toBe(false);
  });

  it('debería subir archivo exitosamente', () => {
    const file = new File([''], 'test.xlsx');
    catalogoService.subirArchivo.and.returnValue(
      of({
        success: true,
        message: 'Archivo cargado',
        productos_cargados: 50,
        duplicados: 2
      })
    );

    component.archivo = file;
    component.subirArchivo();

    expect(catalogoService.subirArchivo).toHaveBeenCalledWith(file);
    expect(alertaService.mostrarExito).toHaveBeenCalled();
  });

  it('debería eliminar un producto', () => {
    catalogoService.eliminarProducto.and.returnValue(
      of({ success: true, message: 'Eliminado' })
    );

    spyOn(window, 'confirm').and.returnValue(true);
    component.eliminarProducto('BIKE001', 'Bicicleta Road');

    expect(catalogoService.eliminarProducto).toHaveBeenCalledWith('BIKE001');
    expect(alertaService.mostrarExito).toHaveBeenCalled();
  });

  it('debería filtrar productos por búsqueda', () => {
    component.busqueda = 'road';
    component.aplicarFiltro();

    expect(component.productosFiltrados.length).toBe(1);
    expect(component.productosFiltrados[0].sku).toBe('BIKE001');
  });

  it('debería calcular total de páginas correctamente', () => {
    component.totalProductos = 50;
    component.registrosPorPagina = 20;

    expect(component.totalPaginas).toBe(3);
  });

  it('debería vaciar catálogo con confirmación', () => {
    catalogoService.vaciarCatalogo.and.returnValue(
      of({ success: true, message: 'Vaciado' })
    );

    spyOn(window, 'confirm').and.returnValue(true);
    component.vaciarCatalogo();

    expect(catalogoService.vaciarCatalogo).toHaveBeenCalled();
    expect(alertaService.mostrarExito).toHaveBeenCalled();
  });
});
