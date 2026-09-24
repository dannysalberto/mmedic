# Tasks: Módulo de Gestión de Clientes / Directorio de Pacientes (CRUD Completo y Paridad Dual)

**Feature**: Módulo de Gestión de Clientes / Directorio de Pacientes  
**Branch**: `007-patients-customers-management`  
**Spec**: [spec.md](file:///d:/Projectos/Codigo/Personal/MMedic/specs/007-patients-customers-management/spec.md) | **Plan**: [plan.md](file:///d:/Projectos/Codigo/Personal/MMedic/specs/007-patients-customers-management/plan.md)

---

## Phase 1: Setup & Shared Types

**Purpose**: Verificación e inicialización de contratos compartidos en `@mmedic/types`

- [x] T001 [P] Verify `@mmedic/types` exports for Customer (`Customer`, `CreateCustomerDto`, `UpdateCustomerDto`) in `packages/types/src/customer.ts` and `packages/types/src/index.ts`

---

## Phase 2: Foundational (Backend API `apps/api`)

**Purpose**: Infraestructura backend y servicios NestJS que bloquean las historias de usuario

- [x] T002 [P] Update NestJS `CustomersService` in `apps/api/src/modules/customers/customers.service.ts` to implement `update(id, dto, tenantId)` and `delete(id, tenantId)` with Safe Deletion check (`_count.invoices > 0` throws `ConflictException`)
- [x] T003 [P] Update NestJS `CustomersController` in `apps/api/src/modules/customers/customers.controller.ts` with `PUT /api/v1/customers/:id` and `DELETE /api/v1/customers/:id` endpoints

---

## Phase 3: User Story 1 - Menú Principal & Navegación "Directorio de Pacientes" (Priority: P1)

**Goal**: Permitir el acceso directo al módulo de pacientes desde el menú de navegación lateral en Web SPA y Android.

**Independent Test**: Hacer clic en "Directorio de Pacientes" en el menú lateral y verificar que cargue la vista del catálogo.

- [x] T004 [P] [US1] Add "Directorio de Pacientes" link to header navigation in `apps/web/src/app/components/header/header.component.html` and register `/customers` route in `apps/web/src/app/app.routes.ts`
- [x] T005 [P] [US1] Add "Directorio de Pacientes" navigation item in Android app navigation drawer in `apps/android/app/src/main/java/com/mmedic/MainActivity.kt`

---

## Phase 4: User Story 2 - Consulta, Listado y Búsqueda en Tiempo Real (Priority: P1) 🎯 MVP

**Goal**: Permitir consultar y filtrar el catálogo completo de clientes/pacientes en tiempo real por RIF/Cédula, Nombre o Teléfono.

**Independent Test**: Filtrar la lista ingresando un RIF o nombre parcial y verificar que la tabla/lista muestre solo los registros coincidentes.

- [x] T006 [P] [US2] Implement Web SPA Customers List component TS & HTML in `apps/web/src/app/components/customers/customers-list/customers-list.component.ts` and `customers-list.component.html` with real-time search input
- [x] T007 [P] [US2] Implement Web SPA Customers List CSS styles in `apps/web/src/app/components/customers/customers-list/customers-list.component.css`
- [x] T008 [P] [US2] Implement Android Customers Repository & ViewModel in `apps/android/app/src/main/java/com/mmedic/data/repository/CustomerRepository.kt` and `apps/android/app/src/main/java/com/mmedic/ui/customers/CustomersViewModel.kt`
- [x] T009 [P] [US2] Implement Android Customers List Screen UI in Jetpack Compose in `apps/android/app/src/main/java/com/mmedic/ui/customers/CustomersScreen.kt`

---

## Phase 5: User Story 3 - Registro y Edición de Clientes con Retención de Navegación (Priority: P1)

**Goal**: Permitir crear nuevos clientes y editar existentes manteniendo la posición de trabajo al guardar cambios (Principio V, Subsección 5.4).

**Independent Test**: Editar un cliente, presionar "Guardar Cambios" y verificar que permanezca en la vista de edición mostrando un toast flotante de éxito.

- [x] T010 [P] [US3] Implement Web SPA Customer Form Modal component TS & HTML in `apps/web/src/app/components/customers/customer-form-modal/customer-form-modal.component.ts` and `customer-form-modal.component.html` ensuring edit mode retains navigation with toast notification
- [x] T011 [P] [US3] Implement Web SPA Customer Form Modal CSS styles in `apps/web/src/app/components/customers/customer-form-modal/customer-form-modal.component.css`
- [x] T012 [P] [US3] Implement Android Create/Edit Customer Dialog UI in Jetpack Compose in `apps/android/app/src/main/java/com/mmedic/ui/customers/CustomerFormDialog.kt`

---

## Phase 6: User Story 4 - Eliminación Segura (Safe Deletion Rule) (Priority: P2)

**Goal**: Garantizar que los clientes con facturas o movimientos vinculados no puedan ser eliminados, mostrando una advertencia explicativa.

**Independent Test**: Intentar borrar un cliente con facturas y comprobar que la API bloquee la acción e informe el motivo.

- [x] T013 [US4] Integrate delete confirmation dialog and Safe Deletion error handling toast notification in `apps/web/src/app/components/customers/customers-list/customers-list.component.ts`
- [x] T014 [US4] Integrate delete confirmation dialog and Safe Deletion error handling in `apps/android/app/src/main/java/com/mmedic/ui/customers/CustomersScreen.kt`

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Verificación de compilación workspace y ejecución del plan de pruebas end-to-end

- [x] T015 [P] Run `pnpm --filter @mmedic/types build` and `pnpm --filter web build` to verify workspace compilation
- [x] T016 Run quickstart end-to-end validation scenarios in `specs/007-patients-customers-management/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sin dependencias.
- **Foundational (Phase 2)**: Depende de Phase 1. Bloquea las historias de usuario.
- **User Story 1 (Phase 3)**: Depende de Phase 2.
- **User Story 2 (Phase 4)**: Depende de Phase 2. Puede ejecutarse en paralelo con US1.
- **User Story 3 (Phase 5)**: Depende de Phase 2 y Phase 4 (para abrir el modal desde la lista).
- **User Story 4 (Phase 6)**: Depende de Phase 2 y Phase 4.
- **Polish (Phase 7)**: Depende de la finalización de todas las historias de usuario.

---

## Implementation Strategy

### MVP First (User Story 1 & 2)
1. Completar Setup (Phase 1) y Foundational API (Phase 2).
2. Implementar Menú "Directorio de Pacientes" (Phase 3) y Listado con Búsqueda (Phase 4).
3. **VALIDAR**: Verificar que el listado y búsqueda respondan correctamente en Web y Android.

### Incremental Delivery
1. Añadir Formulario de Alta y Edición con Retención de Navegación (Phase 5).
2. Añadir Borrado Seguro con validación de facturas vinculadas (Phase 6).
3. Compilar y ejecutar guía quickstart (Phase 7).
