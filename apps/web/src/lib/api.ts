import { HealthStatus, Patient, Appointment } from '@mmedic/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export async function getHealthStatus(): Promise<HealthStatus | null> {
  try {
    const res = await fetch(`${API_BASE}/health`, {
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    return null;
  }
}

export async function getPatients(): Promise<Patient[]> {
  try {
    const res = await fetch(`${API_BASE}/patients`, {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    return [];
  }
}

export async function getAppointments(): Promise<Appointment[]> {
  try {
    const res = await fetch(`${API_BASE}/appointments`, {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    return [];
  }
}
