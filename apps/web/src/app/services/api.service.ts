import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { HealthStatus, Patient, Appointment } from '@mmedic/types';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:3000/api/v1';

  getHealth(): Observable<HealthStatus | null> {
    return this.http.get<HealthStatus>(`${this.baseUrl}/health`).pipe(
      catchError(() => of(null))
    );
  }

  getPatients(search?: string): Observable<Patient[]> {
    const url = search ? `${this.baseUrl}/patients?search=${encodeURIComponent(search)}` : `${this.baseUrl}/patients`;
    return this.http.get<Patient[]>(url).pipe(
      catchError(() => of([]))
    );
  }

  getAppointments(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.baseUrl}/appointments`).pipe(
      catchError(() => of([]))
    );
  }
}
