'use client';

import React from 'react';
import { Activity, ShieldCheck, Smartphone, Globe, Database } from 'lucide-react';

export function Header() {
  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '1.25rem 0',
      borderBottom: '1px solid var(--border-color)',
      marginBottom: '2rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 20px rgba(14, 165, 233, 0.4)'
        }}>
          <Activity size={24} color="#ffffff" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.025em' }}>
              MMedic <span style={{ color: 'var(--accent-cyan)' }}>Platform</span>
            </h1>
            <span className="badge badge-info">v1.0 Monorepo</span>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Ecosistema Unificado: Web (Next.js) · Backend (NestJS + Prisma) · Android (Kotlin)
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <a 
          href="http://localhost:3000/api/docs" 
          target="_blank" 
          rel="noreferrer"
          className="btn btn-secondary"
          style={{ fontSize: '0.8rem' }}
        >
          <Database size={15} color="var(--accent-cyan)" /> Swagger API
        </a>
        <a 
          href="http://localhost:8080" 
          target="_blank" 
          rel="noreferrer"
          className="btn btn-secondary"
          style={{ fontSize: '0.8rem' }}
        >
          <ShieldCheck size={15} color="var(--accent-emerald)" /> Adminer DB
        </a>
      </div>
    </header>
  );
}
