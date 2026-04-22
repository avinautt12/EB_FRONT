import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CatalogoExcelService, RespuestaUpload, ListadoProductos } from './catalogo-excel.service';
import { environment } from '../../environments/environment';

describe('CatalogoExcelService', () => {
  let service: CatalogoExcelService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/admin/productos-excel`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CatalogoExcelService]
    });
    service = TestBed.inject(CatalogoExcelService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('debería cargar un archivo', () => {
    const file = new File(['contenido'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const mockResponse: RespuestaUpload = {
      success: true,
      message: 'Archivo cargado exitosamente',
      productos_cargados: 50,
      duplicados: 2
    };

    service.subirArchivo(file).subscribe(respuesta => {
      expect(respuesta.success).toBe(true);
      expect(respuesta.productos_cargados).toBe(50);
    });

    const req = httpMock.expectOne(`${apiUrl}/cargar`);
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('debería obtener productos', () => {
    const mockResponse: ListadoProductos = {
      total: 2,
      productos: [
        { sku: 'BIKE001', nombre: 'Bicicleta Road', color: 'Rojo', origen: 'excel' },
        { sku: 'BIKE002', nombre: 'Bicicleta MTB', color: 'Azul', origen: 'excel' }
      ]
    };

    service.obtenerProductos().subscribe(data => {
      expect(data.productos.length).toBe(2);
      expect(data.total).toBe(2);
    });

    const req = httpMock.expectOne(req => req.url === apiUrl && req.method === 'GET');
    req.flush(mockResponse);
  });

  it('debería eliminar un producto', () => {
    service.eliminarProducto('BIKE001').subscribe(respuesta => {
      expect(respuesta.success).toBe(true);
    });

    const req = httpMock.expectOne(`${apiUrl}/BIKE001`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ success: true, message: 'Producto eliminado' });
  });

  it('debería vaciar el catálogo', () => {
    service.vaciarCatalogo().subscribe(respuesta => {
      expect(respuesta.success).toBe(true);
    });

    const req = httpMock.expectOne(`${apiUrl}/vaciar`);
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('X-Confirm-Action')).toBe('vaciar_catalogo');
    req.flush({ success: true, message: 'Catálogo vaciado' });
  });
});
