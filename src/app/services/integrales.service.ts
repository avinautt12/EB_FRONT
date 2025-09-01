import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Grupo {
  id: number;
  nombre_grupo: string;
}

export interface ClienteConGrupo {
  id: number;
  clave: string;
  evac: string;
  nombre_cliente: string;
  nivel: string;
  f_inicio: string;
  f_fin: string;
  id_grupo?: number;
}

export interface ClientesPorGrupo {
  grupo: string;
  clientes: ClienteConGrupo[];
}

@Injectable({
  providedIn: 'root'
})
export class IntegralesService {

  private apiUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json'
      // Se removió la autorización con token
    });
  }

  // Obtener todos los grupos
  obtenerGrupos(): Observable<Grupo[]> {
    return this.http.get<Grupo[]>(`${this.apiUrl}/integrales/grupos`, { headers: this.getHeaders() });
  }

  // Agregar un nuevo grupo
  agregarGrupo(nombreGrupo: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/integrales/agregar`,
      { nombre_grupo: nombreGrupo },
      { headers: this.getHeaders() }
    );
  }

  // Editar un grupo existente
  editarGrupo(idGrupo: number, nombreGrupo: string): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/integrales/grupos/editar/${idGrupo}`,
      { nombre_grupo: nombreGrupo },
      { headers: this.getHeaders() }
    );
  }

  // Eliminar un grupo
  eliminarGrupo(idGrupo: number): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/integrales/grupos/eliminar/${idGrupo}`,
      { headers: this.getHeaders() }
    );
  }

  // Obtener clientes por grupo
  obtenerClientesPorGrupo(idGrupo: number): Observable<ClientesPorGrupo> {
    return this.http.get<ClientesPorGrupo>(
      `${this.apiUrl}/integrales/clientes/grupo/${idGrupo}`,
      { headers: this.getHeaders() }
    );
  }

  // Asignar grupo a un cliente
  asignarGrupoCliente(idCliente: number, idGrupo: number): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/integrales/clientes/asignar-grupo`,
      { id_cliente: idCliente, id_grupo: idGrupo },
      { headers: this.getHeaders() }
    );
  }

  // Remover grupo de un cliente (id_grupo = 0)
  removerGrupoCliente(idCliente: number): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/integrales/clientes/asignar-grupo`,
      { id_cliente: idCliente, id_grupo: 0 },
      { headers: this.getHeaders() }
    );
  }
}