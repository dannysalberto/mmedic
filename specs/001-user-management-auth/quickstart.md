# Quickstart: Validación de Gestión de Usuarios, Permisos Especiales y Autenticación

**Feature**: [spec.md](./spec.md) | **Directory**: `specs/001-user-management-auth` | **Date**: 2026-09-20

Esta guía describe los pasos para validar y probar la característica end-to-end una vez implementada.

---

## 1. Prerrequisitos

- PostgreSQL 16 levantado vía Docker Compose:
  ```bash
  pnpm db:up
  ```
- Migraciones y semillas aplicadas:
  ```bash
  pnpm db:migrate
  pnpm db:seed
  ```
- Servidores de desarrollo en ejecución:
  ```bash
  pnpm dev
  ```
  - API REST: [http://localhost:3000/api/v1](http://localhost:3000/api/v1)
  - Web Portal: [http://localhost:3001](http://localhost:3001)

---

## 2. Escenarios de Validación

### Escenario 1: Navegación Pública y Header Institucional
1. Abrir el navegador en `http://localhost:3001`.
2. **Validar Cabecera Horizontal**:
   - Logotipo `logo.svg` alineado a la izquierda.
   - Menú superior a la derecha con los enlaces: "Acerca de", "Contáctanos" y "Quiénes somos".
   - Al hacer clic en cualquiera de las opciones se despliega información institucional o diálogo modal correspondiente.

### Escenario 2: Layout de Login (Desktop 80/20 vs Mobile-First)
1. **Validación en Pantalla de Escritorio ($\ge$ 1024px)**:
   - Verificar que la pantalla se divide en 2 paneles:
     - 80% (izquierda): Fondo con identidad corporativa, bienvenida y logotipo distintivo.
     - 20% (derecha): Formulario de acceso vertical con campos para usuario/email y contraseña.
2. **Validación en Pantalla Móvil (< 640px en DevTools)**:
   - Redimensionar el viewport a 375px (iPhone) o 412px (Android).
   - Verificar que el layout se apila verticalmente de forma armónica.
   - Confirmar que **no existe desplazamiento horizontal** (`overflow-x`).
   - Confirmar que los botones y campos tienen altura táctil mínima de 44px.

### Escenario 3: Inicio de Sesión con Superadmin Inicial
1. En el formulario de login, ingresar las credenciales iniciales de arranque:
   - **Usuario**: `superadmin`
   - **Contraseña**: `superadmin@123#`
2. Presionar el botón **Iniciar Sesión**.
3. **Resultado Esperado**:
   - Se recibe token JWT válido.
   - El sistema almacena la sesión y redirige al dashboard de administración.

### Escenario 4: CRUD de Usuarios y Roles Base
1. En el menú del sistema, ingresar a **Administración de Usuarios**.
2. Presionar **Nuevo Usuario** y completar el formulario:
   - **Nombre completo**: Carlos Mendoza
   - **Usuario**: `cajero_carlos`
   - **Email**: `carlos@clinica.com`
   - **Rol base**: Seleccionar `ROL_CAJERO`.
   - **Contraseña**: `Cajero2026#`
3. Guardar y verificar que el usuario aparece en la tabla clasificado con su rol `ROL_CAJERO`.

### Escenario 5: Asignación de Permiso Especial y Verificación de Botón Dinámico
1. En la fila del usuario `cajero_carlos`, presionar **Gestionar Permisos Especiales**.
2. Asignar el permiso especial `FACTURA_ANULAR`.
3. Guardar cambios.
4. **Verificación `usuario + permiso`**:
   - Probar la consulta interactiva de verificación en la interfaz o mediante llamada API:
     ```bash
     curl -X POST http://localhost:3000/api/v1/permissions/check \
       -H "Content-Type: application/json" \
       -H "Authorization: Bearer <TOKEN>" \
       -d '{"userId": "<ID_DE_CARLOS>", "permission": "FACTURA_ANULAR"}'
     ```
   - **Resultado Esperado**: Devuelve `{ "hasPermission": true, "grantedVia": "SPECIAL_PERMISSION" }`.
   - En la interfaz de simulación de facturación, el botón **"Anular Factura"** pasa a estar activo y funcional para este usuario.
5. Revocar el permiso especial y verificar que `hasPermission` pasa a `false` y el botón se desactiva inmediatamente.

### Escenario 6: Trazabilidad y Registro de Errores en Base de Datos
1. Provocar un error intencional (ej. llamada a usuario inexistente o validación forzada).
2. Consultar la tabla `system_error_logs` en PostgreSQL (vía Adminer o Prisma Studio):
   - Verificar que se creó un registro con: `fileName`, `lineNumber`, `errorMessage`, `errorDescription`, `userId`, `createdAt` y `errorType`.
