'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { StatsCard } from '../components/StatsCard';
import { 
  Users, 
  Calendar, 
  Server, 
  Smartphone, 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  Terminal, 
  ExternalLink,
  Cpu,
  Layers,
  Sparkles
} from 'lucide-react';
import { HealthStatus } from '@mmedic/types';

export default function HomePage() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function checkHealth() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
        const res = await fetch(`${apiUrl}/health`);
        if (res.ok) {
          const data = await res.json();
          setHealth(data);
        } else {
          setHealth(null);
        }
      } catch {
        setHealth(null);
      } finally {
        setLoading(false);
      }
    }
    checkHealth();
  }, []);

  return (
    <div>
      <Header />

      {/* Hero / Architecture Banner */}
      <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span className="badge badge-success">
                <Sparkles size={12} /> Monorepo Inicializado
              </span>
              <span className="badge badge-info">PostgreSQL 16 + Prisma</span>
            </div>
            <h2 style={{ fontSize: '1.875rem', fontWeight: 800 }}>
              Bienvenido al Sistema MMedic
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '680px', marginTop: '0.5rem' }}>
              Arquitectura unificada y moderna lista para desarrollo. El backend en NestJS expone APIs tipadas consumibles de forma nativa por la Web (Next.js) y la aplicación Móvil (Android Kotlin).
            </p>
          </div>

          <div style={{
            background: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '1rem 1.25rem',
            minWidth: '280px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>ESTADO DE SERVICIOS</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <span className="pulse-dot" style={{ background: health ? 'var(--accent-emerald)' : 'var(--accent-amber)' }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: health ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}>
                  {loading ? 'Verificando...' : health ? 'API Online' : 'API Desconectada'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8125rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>NestJS API (Puerto 3000):</span>
                <span style={{ fontWeight: 600, color: health?.status === 'ok' ? '#34d399' : '#f87171' }}>
                  {health?.status === 'ok' ? 'Activo' : 'Offline'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>PostgreSQL (Puerto 5432):</span>
                <span style={{ fontWeight: 600, color: health?.database === 'connected' ? '#34d399' : '#fbbf24' }}>
                  {health?.database === 'connected' ? 'Conectado' : 'Pendiente (docker up)'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Android Target:</span>
                <span style={{ fontWeight: 600, color: '#38bdf8' }}>Jetpack Compose (Kotlin)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Metrics */}
      <div className="grid-cols-4">
        <StatsCard 
          title="Módulo Web" 
          value="Next.js 15" 
          subtitle="React 19 & App Router" 
          icon={<Layers size={22} color="var(--accent-cyan)" />}
          accentColor="var(--accent-cyan)"
        />
        <StatsCard 
          title="Módulo API" 
          value="NestJS 11" 
          subtitle="TypeScript & Prisma ORM" 
          icon={<Server size={22} color="var(--accent-purple)" />}
          accentColor="var(--accent-purple)"
        />
        <StatsCard 
          title="Módulo Móvil" 
          value="Android Native" 
          subtitle="Kotlin & Jetpack Compose" 
          icon={<Smartphone size={22} color="var(--accent-emerald)" />}
          accentColor="var(--accent-emerald)"
        />
        <StatsCard 
          title="Base de Datos" 
          value="PostgreSQL 16" 
          subtitle="Dockerizado con Adminer" 
          icon={<Database size={22} color="var(--accent-amber)" />}
          accentColor="var(--accent-amber)"
        />
      </div>

      {/* Main Grid: Architecture Details & Quick Commands */}
      <div className="grid-main">
        {/* Left Column: Modules & Structure */}
        <div className="glass-card" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Cpu size={20} color="var(--accent-cyan)" /> Módulos del Monorepo
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ padding: '1rem', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <span style={{ fontWeight: 700, color: '#38bdf8' }}>📁 apps/web (Frontend Web)</span>
                <span className="badge badge-info">Next.js 15</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Portal clínico web con servidor SSR, panel de control de médicos y pacientes, gestión de citas y diseño responsivo de alto rendimiento.
              </p>
            </div>

            <div style={{ padding: '1rem', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <span style={{ fontWeight: 700, color: '#a78bfa' }}>📁 apps/api (Backend REST)</span>
                <span className="badge badge-warning">NestJS + Prisma</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Servicio backend central con validación DTO estricta, documentación Swagger automática, conexión a PostgreSQL vía Prisma ORM y endpoints seguros para Web y Móvil.
              </p>
            </div>

            <div style={{ padding: '1rem', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <span style={{ fontWeight: 700, color: '#34d399' }}>📁 apps/android (Aplicación Móvil)</span>
                <span className="badge badge-success">Kotlin Compose</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                App Android nativa construida con Jetpack Compose y Material 3. Incluye cliente Retrofit preparado para comunicarse con NestJS tanto en emulador local (10.0.2.2) como en red local.
              </p>
            </div>

            <div style={{ padding: '1rem', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <span style={{ fontWeight: 700, color: '#fbbf24' }}>📁 packages/types (Tipos Compartidos)</span>
                <span className="badge badge-info">TypeScript</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Paquete interno que comparte interfaces de dominio (User, Patient, Appointment, ApiResponse) entre el backend y frontend web sin duplicación de código.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Terminal Commands CheatSheet */}
        <div className="glass-card" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Terminal size={20} color="var(--accent-emerald)" /> Comandos Principales
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.8125rem' }}>
            <div>
              <span style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                1. Levantar Base de Datos PostgreSQL:
              </span>
              <code style={{ background: '#000', padding: '0.35rem 0.65rem', borderRadius: '6px', display: 'block', color: '#38bdf8' }}>
                pnpm db:up
              </code>
            </div>

            <div>
              <span style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                2. Iniciar Web y API en desarrollo:
              </span>
              <code style={{ background: '#000', padding: '0.35rem 0.65rem', borderRadius: '6px', display: 'block', color: '#34d399' }}>
                pnpm dev
              </code>
            </div>

            <div>
              <span style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                3. Aplicar migraciones de Prisma:
              </span>
              <code style={{ background: '#000', padding: '0.35rem 0.65rem', borderRadius: '6px', display: 'block', color: '#fbbf24' }}>
                pnpm db:migrate
              </code>
            </div>

            <div>
              <span style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                4. Poblar datos de prueba (Seed):
              </span>
              <code style={{ background: '#000', padding: '0.35rem 0.65rem', borderRadius: '6px', display: 'block', color: '#a78bfa' }}>
                pnpm db:seed
              </code>
            </div>

            <div>
              <span style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                5. Explorar Base de Datos con Prisma Studio:
              </span>
              <code style={{ background: '#000', padding: '0.35rem 0.65rem', borderRadius: '6px', display: 'block', color: '#f43f5e' }}>
                pnpm db:studio
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
