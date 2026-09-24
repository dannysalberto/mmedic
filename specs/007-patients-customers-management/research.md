# Research & Decision Log: Módulo de Gestión de Clientes / Directorio de Pacientes

## 1. Contexto y Objetivos

El objetivo de esta investigación es definir la arquitectura, contratos, persistencia y patrones de UI para completar el CRUD del módulo de **Clientes / Directorio de Pacientes**, garantizando la paridad técnica con los módulos existentes de *Entidades Colaboradoras* y *Personal/Colaboradores*.

---

## 2. Decisiones de Arquitectura y Diseño

### Decisión 1: Estandarización del Modelo y Terminología Dual (Clientes / Pacientes)
- **Decisión**: Mantener el modelo Prisma `Customer` en la base de datos PostgreSQL, mientras que en la capa de navegación e interfaz de usuario se expone bajo el término funcional **"Directorio de Pacientes"** y **"Clientes Fiscales"**.
- **Justificación**: Garantiza compatibilidad 100% con los módulos de facturación (`invoices`), atenciones y expedientes médicos del sistema MMedic, unificando la ficha del paciente con su perfil de facturación fiscal.
- **Alternativas Evaluadas**: Crear un modelo `Patient` separado del `Customer`. Rechazado para evitar duplicidad de datos fiscales y fragmentación de cuentas por cobrar.

### Decisión 2: Operaciones CRUD Completas y Regla de Eliminación Segura (Safe Deletion Rule)
- **Decisión**: Expandir `CustomersService` y `CustomersController` en NestJS para incluir los endpoints `PUT /api/v1/customers/:id` (actualización) y `DELETE /api/v1/customers/:id` (eliminación segura con verificación de facturas asociadas).
- **Justificación**: Cumple con el Principio III de la Constitución v2.6.0. La eliminación debe verificar `_count.invoices > 0` antes de proceder; si existen facturas, lanza `ConflictException` (409) impidiendo la eliminación.
- **Alternativas Evaluadas**: Eliminación directa (*Hard Delete*) sin comprobación. Rechazada por violar la integridad contable y legal.

### Decisión 3: Retención de Navegación en Edición y Toast Push Notifications
- **Decisión**: En la Web SPA (`apps/web`) y en Android (`apps/android`), al guardar los cambios de una edición, el formulario **permanece en la pantalla/modal de edición** mostrando un toast flotante de éxito (`NotificationService.success`), preservando el contexto de trabajo del usuario. En la creación de nuevo registro, se notifica y se retorna a la lista.
- **Justificación**: Cumple con el Principio V (Subsección 5.4) de la Constitución v2.6.0.

### Decisión 4: Paridad Dual de Plataformas (Angular SPA + Android Jetpack Compose)
- **Decisión**:
  - **Web SPA (`apps/web`)**: Componente `CustomersListComponent` y `CustomerFormModalComponent` accesibles desde la opción de menú "Directorio de Pacientes" en `sidebar.component.html` (ruta `/customers`).
  - **Android (`apps/android`)**: Pantalla `CustomersScreen.kt` y `CustomersViewModel.kt` en Jetpack Compose integrada en la navegación lateral/inferior.
- **Justificación**: Cumple estrictamente con la Cláusula de Desarrollo Dual Obligatorio (Principio I, Subsección 1.3).

---

## 3. Matriz de Contratos e Interfaces

| Operación | Método HTTP | Endpoint | DTO Entrada | Respuesta |
|-----------|-------------|----------|-------------|-----------|
| Listar / Buscar | `GET` | `/api/v1/customers?search=` | Query string | `ApiResponse<Customer[]>` |
| Buscar por RIF/Cédula | `GET` | `/api/v1/customers/by-tax-id/:taxId` | Param `taxId` | `ApiResponse<Customer \| null>` |
| Obtener por ID | `GET` | `/api/v1/customers/:id` | Param `id` | `ApiResponse<Customer>` |
| Crear Cliente | `POST` | `/api/v1/customers` | `CreateCustomerDto` | `ApiResponse<Customer>` |
| Actualizar Cliente | `PUT` | `/api/v1/customers/:id` | `UpdateCustomerDto` | `ApiResponse<Customer>` |
| Eliminar Cliente | `DELETE` | `/api/v1/customers/:id` | Param `id` | `ApiResponse<{ id: string }>` |
