import React, { ReactNode } from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: ReactNode;
  accentColor: string;
}

export function StatsCard({ title, value, subtitle, icon, accentColor }: StatsCardProps) {
  return (
    <div className="glass-card" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute',
        top: '-15px',
        right: '-15px',
        width: '70px',
        height: '70px',
        borderRadius: '50%',
        background: accentColor,
        opacity: 0.1,
        filter: 'blur(10px)',
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            {title}
          </span>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.35rem', color: 'var(--text-primary)' }}>
            {value}
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            {subtitle}
          </p>
        </div>

        <div style={{
          padding: '0.75rem',
          borderRadius: '12px',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {icon}
        </div>
      </div>
    </div>
  );
}
