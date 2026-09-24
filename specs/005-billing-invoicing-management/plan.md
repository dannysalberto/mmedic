# Implementation Plan: Módulo Integral de Facturación, Clientes Fiscales y Cobranzas

**Branch**: `005-billing-invoicing-management` | **Date**: 2026-09-23 | **Spec**: [`spec.md`](file:///d:/Projectos/Codigo/Personal/MMedic/specs/005-billing-invoicing-management/spec.md)

**Input**: Feature specification from `/specs/005-billing-invoicing-management/spec.md`

---

## Summary

Desarrollar el módulo integral de **Facturación, Clientes Fiscales y Cobranzas** con paridad funcional total entre la aplicación **Web SPA (`apps/web` en Angular 19+)** y la aplicación nativa **Android (`apps/android` en Kotlin / Jetpack Compose)**, bajo estricto cumplimiento de la **Constitución Técnica de Software v2.6.0**.

El módulo habilita:
1. Registro y autocompletado inline de clientes fiscales (RIF, Nombre, Teléfono, Dirección) vinculando su ID a la factura en proceso.
2. Emisión de facturas (Contado / Crédito) con asignación de correlativo secuencial multi-tenant y ciclo de estados (`PENDING`, `PAID`, `VOIDED`).
3. Detalle de renglones con selección de los 4 tipos de precio, nuevo atributo `appliesVat` en artículos, imputación obligatoria a un médico/entidad beneficiaria, y cálculo exacto con redondeo a 3 decimales (precio base, monto IVA 16%, subtotal unitario y total del renglón).
4. Cobranzas fraccionadas y pagos mixtos (Efectivo, Tarjeta, Cashea, Binance, Transferencia), con cálculo automático de vuelto para efectivo y recálculo automático de estatus a `PAID`.
5. Anulación de facturas y eliminación de pagos restringidos a roles de administración (`ROL_ADMIN`, `ROL_SUPERADMIN`).
6. Visualización de factura en modal interactivo con acciones directas para impresión física, envío por WhatsApp y correo electrónico.

---

## Technical Context

**Language/Version**: TypeScript 5.5+ (NestJS 10 / Angular 19), Kotlin 2.0+ (Android Jetpack Compose, Material3)  
**Primary Dependencies**: Turborepo, NestJS, Prisma ORM, Angular Signals, Jetpack Compose, Retrofit 2, Coroutines/StateFlow  
**Storage**: PostgreSQL (Supabase) con nuevas entidades relacionales `Customer`, `Invoice`, `InvoiceItem`, `InvoicePayment` y migración atómica a `Article` (`appliesVat`)  
**Testing**: Compilación estricta y typecheck sin advertencias (`pnpm build`, `.\gradlew.bat compileDebugKotlin`)  
**Target Platform**: Navegadores Web Modernos (Desktop y Tablet) y Android 8.0+ (API 26+)  
**Project Type**: Monorepo Fullstack Multi-Tenant  
**Performance Goals**: Tiempo de respuesta de endpoints $\le 150$ms, renderizado reactivo a 60fps, carga de modal $\le 1$s  
**Constraints**:
- Constitución v2.6.0: Cláusula de Paridad Web-Android obligatoria, Tiny Controllers ($\le 80$ LOC), Componentes/Servicios ($\le 300$ LOC), Push Notifications y navegación contextual no intrusiva.
- Precisión: Almacenamiento en `Decimal(14, 3)` y redondeo aritmético a 3 decimales en todas las fórmulas de IVA y subtotales.
- Seguridad: Eliminación de pagos y anulación de factura restringidas exclusivamente a `ROL_ADMIN` y `ROL_SUPERADMIN`.

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Criterio Constitucional | Requisito | Estado | Justificación / Estrategia |
|---|---|---|---|
| **Paridad Web y Android (1.3)** | Mismo conjunto de funcionalidades en ambas plataformas sin excepciones. | **PASÓ** | Se planifica e implementa la experiencia completa de facturación, clientes, cobros y modal en Angular 19 y en Jetpack Compose. |
| **Notificaciones Push y Navegación (5.4)** | Notificaciones no intrusivas en creación/edición/anulación; preservación de contexto. | **PASÓ** | Integrado con `NotificationService` en Web y `NotificationManager` en Android. |
| **Tiny Controllers (3.2)** | Controllers $\le 80$ LOC. | **PASÓ** | `InvoicesController` y `CustomersController` estructurados en max 80 LOC delegando lógica a servicios. |
| **300 LOC Rule (3.3)** | Componentes, clases y servicios $\le 300$ LOC. | **PASÓ** | Separación modular de pantallas en subcomponentes (formulario de cliente, detalle de ítems, sección de pagos, modal de impresión). |
| **Integridad de Contratos (1.2)** | `@mmedic/types` como única fuente de verdad. | **PASÓ** | Centralización de DTOs, enums e interfaces en `packages/types/src/index.ts`. |
| **Migraciones Atómicas (1.5)** | Cero alteraciones manuales en base de datos. | **PASÓ** | Generación de migración atómica versionada en Prisma para tablas `customers`, `invoices`, `invoice_items`, `invoice_payments` y columna `appliesVat`. |
| **Trazabilidad de Errores (1.4)** | Registro persistente en `SystemErrorLog`. | **PASÓ** | Captura automática de excepciones en capa de servicios mediante el filtro global de auditoría. |

---

## Project Structure

### Documentation (this feature)

```text
specs/005-billing-invoicing-management/
├── plan.md              # Este plan de implementación
├── research.md          # Investigación de decisiones aritméticas, cobranzas y seguridad
├── data-model.md        # Definición del esquema Prisma, DTOs y máquina de estados
├── quickstart.md        # Guía de verificación paso a paso con escenarios de prueba
├── contracts/           # Contratos API de Facturación y Clientes
│   └── invoices-api.ts
├── checklists/          # Checklists de calidad
│   └── requirements.md
└── tasks.md             # Tareas ordenadas (generadas en /speckit-tasks)
```

### Source Code (repository root)

```text
# Contratos Compartidos
packages/types/src/index.ts                      # Interfaces de Customer, Invoice, InvoiceItem, InvoicePayment y actualización de Article

# Backend (NestJS / Prisma)
apps/api/prisma/schema.prisma                    # Modelos Customer, Invoice, InvoiceItem, InvoicePayment y appliesVat en Article
apps/api/prisma/migrations/                      # Migración atómica de base de datos
apps/api/src/modules/
├── articles/                                    # Soporte de appliesVat en servicio y DTO
├── customers/                                   # Módulo de Clientes Fiscales (Controller, Service)
└── invoices/                                    # Módulo de Facturación y Pagos (Controller, Service con transacción)

# Frontend Web (Angular 19+)
apps/web/src/app/
├── services/
│   ├── customers.service.ts                     # Servicio cliente de clientes fiscales
│   └── invoices.service.ts                      # Servicio cliente de facturación y cobranzas
└── components/invoices/
    ├── invoices-list/                           # Listado, búsqueda y filtrado de comprobantes
    ├── invoice-create/                          # Pantalla de emisión de factura
    │   ├── customer-inline-form/                # Selector y alta rápida de cliente
    │   ├── invoice-items-table/                 # Renglones, selección de precios y cálculo IVA
    │   └── invoice-payment-section/             # Registro de cobros mixtos y vuelto
    └── invoice-preview-modal/                   # Modal de visualización, impresión física y envíos

# Móvil Nativo (Android Jetpack Compose)
apps/android/app/src/main/java/com/mmedic/
├── data/api/
│   ├── CustomersApiService.kt                   # Interfaz Retrofit para Clientes
│   └── InvoicesApiService.kt                    # Interfaz Retrofit para Facturación y Pagos
└── ui/invoices/
    ├── InvoicesViewModel.kt                     # StateFlow para emisión, cobros y consulta
    ├── InvoicesScreen.kt                        # Listado y gestión de facturas
    ├── InvoiceCreateScreen.kt                   # Pantalla de creación y selección de precios
    ├── CustomerQuickDialog.kt                   # Diálogo modal para nuevo cliente fiscal
    ├── InvoicePaymentSection.kt                 # Gestión de pagos fraccionados y vuelto
    └── InvoicePreviewDialog.kt                  # Diálogo de factura con compartir WhatsApp/Correo e impresión
```

---

## Complexity Tracking

| Requisito / Desafío | ¿Por qué es necesario? | Alternativa Rechazada y Justificación |
|---|---|---|
| Aritmética a 3 decimales (`Decimal 14, 3`) | Evita discrepancias de centavos en liquidaciones de IVA y honorarios médicos fraccionados. | Usar `Float` o `Number` estándar de JavaScript causaría errores de redondeo de punto flotante acumulativos. |
| Pagos Mixtos desacoplados en tabla independiente | Una factura médica puede ser liquidada en múltiples partes (ej. seguro, tarjeta, efectivo en divisas). | Incrustar un único campo de método de pago en la cabecera impediría registrar pagos mixtos reales. |
| Restricción de borrado de pagos a Administrador | Protege la integridad de la caja contra borrados no autorizados. | Permitir al cajero borrar pagos sin auditoría provocaría descuadres de caja y riesgo de fraude. |
| Visualización modal con impresión y compartir nativo | Brinda inmediatez en el punto de atención para entregar el comprobante físico o digital. | Redirigir a una página externa rompe el flujo del cajero y ralentiza la atención en cola. |
