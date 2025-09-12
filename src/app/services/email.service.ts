import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpContext, HttpContextToken } from '@angular/common/http';
import { Observable, timeout } from 'rxjs';
import { environment } from '../../environments/environment';

export interface EmailData {
  to: string;
  cliente_nombre: string;
  clave: string;
  mensaje_personalizado?: string;
  datos_caratula: any;
  periodos?: { nombre: string; estado: string; }[];
}

export interface EmailConfig {
  configurado: boolean;
  email_remitente: string;
  usuario_actual: string;
  error?: string;
}

export interface HistorialCaratula {
  id: number;
  clave_cliente: string;
  cliente_nombre: string;
  correo_destinatario: string;
  correo_remitente: string;
  fecha_envio: string;
  hora_envio: string;
  nombre_usuario: string;
  usuario_envio: string;
}

@Injectable({
  providedIn: 'root'
})
export class EmailService {
  private apiUrl = `${environment.apiUrl}/email`;

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No se encontró token en localStorage');
      return new HttpHeaders({
        'Content-Type': 'application/json'
      });
    }

    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  enviarCaratulaPdf(emailData: EmailData): Observable<any> {
    return this.http.post(`${this.apiUrl}/enviar-caratura-pdf`, emailData, {
      headers: this.getHeaders()
    });
  }

  verificarConfiguracion(): Observable<EmailConfig> {
    return this.http.get<EmailConfig>(`${this.apiUrl}/configuracion`, {
      headers: this.getHeaders()
    });
  }

  historialCaratulas(): Observable<HistorialCaratula[]> {
    return this.http.get<HistorialCaratula[]>(`${this.apiUrl}/historial-caratulas`, {
      headers: this.getHeaders()
    });
  }
}