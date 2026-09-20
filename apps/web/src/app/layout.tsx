import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MMedic - Sistema Clínico Multiplataforma',
  description: 'Plataforma médica unificada con Next.js, NestJS, Prisma y Android Kotlin',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <div className="container">
          {children}
        </div>
      </body>
    </html>
  );
}
