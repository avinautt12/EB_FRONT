import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, interval, Subscription } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UpdateService implements OnDestroy {
  private buildActual: number | null = null;
  hayActualizacion$ = new BehaviorSubject<boolean>(false);
  private pollSub?: Subscription;
  private readonly INTERVALO_MS = 5 * 60 * 1000; // 5 minutos

  constructor(private http: HttpClient) {}

  iniciar(): void {
    this._leerVersion().subscribe(v => {
      if (v) this.buildActual = v.build;
    });

    // Jitter de hasta 60s para que 20 usuarios no consulten al mismo instante
    const jitter = Math.floor(Math.random() * 60_000);
    setTimeout(() => {
      this.pollSub = interval(this.INTERVALO_MS).pipe(
        switchMap(() => this._leerVersion())
      ).subscribe(v => {
        if (v && this.buildActual !== null && v.build !== this.buildActual) {
          this.hayActualizacion$.next(true);
        }
      });
    }, jitter);
  }

  recargar(): void {
    window.location.reload();
  }

  private _leerVersion() {
    return this.http
      .get<{ build: number }>(`/assets/version.json?t=${Date.now()}`)
      .pipe(catchError(() => of(null)));
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }
}
