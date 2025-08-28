import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ClientesService {
  private apiUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) { }

  getClientes(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/clientes`);
  }

  getNivelCliente(): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    return this.http.get<any>(`${this.apiUrl}/clientes/nivel`, { headers });
  }

  getInfoClienteActual(): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    return this.http.get<any>(`${this.apiUrl}/clientes/info`, { headers });
  }

  getNombresClientes(): Observable<{ clave: string; nombre_cliente: string }[]> {
    return this.http.get<{ clave: string; nombre_cliente: string }[]>(`${this.apiUrl}/clientes/nombres`);
  }

  // Buscar cliente por clave o nombre (POST con JSON)
  buscarCliente(valor: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/clientes/buscar`, { valor });
  }

  // Agregar un nuevo cliente
  agregarCliente(cliente: { clave: string; evac: string; nombre_cliente: string; nivel: string }): Observable<any> {
  return this.http.post(`${this.apiUrl}/clientes/agregar`, cliente);
}

  // Editar cliente por ID
  editarCliente(id: number, cliente: {
    clave: string;
    zona: string;
    nombre_cliente: string;
    nivel: string;
  }): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/clientes/editar/${id}`, cliente);
  }

  // Eliminar cliente por ID
  eliminarCliente(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/clientes/eliminar/${id}`);
  }

  ObtenerFechasClientes(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/clientes_fechas`);
  }
}
