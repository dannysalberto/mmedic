# API Contracts: Autenticación, Usuarios y Permisos Especiales

**Feature**: [spec.md](../spec.md) | **Directory**: `specs/001-user-management-auth/contracts` | **Date**: 2026-09-20

Todas las respuestas de la API cumplen estrictamente con el envelope constitucional `ApiResponse<T>`:
```typescript
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}
```

---

## 1. Módulo de Autenticación (`/api/v1/auth`)

### 1.1. Iniciar Sesión (`POST /api/v1/auth/login`)
- **Acceso**: Público (`@Public()`)
- **Request Body**:
  ```json
  {
    "username": "superadmin",
    "password": "superadmin@123#"
  }
  ```
- **Respuesta Exitosa (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": "c1f7a28e-8a8b-4c28-98e3-0d3a5a7b1234",
        "tenantId": "t1a2b3c4-0000-0000-0000-000000000001",
        "username": "superadmin",
        "email": "superadmin@mmedic.com",
        "fullName": "Super Administrador",
        "role": "ROL_SUPERADMIN",
        "isActive": true
      },
      "permissions": ["*"]
    },
    "message": "Inicio de sesión exitoso",
    "timestamp": "2026-09-20T17:30:00.000Z"
  }
  ```
- **Errores Posibles**: `400 Bad Request` (campos faltantes), `401 Unauthorized` (credenciales inválidas o usuario inactivo).

### 1.2. Perfil del Usuario Autenticado (`GET /api/v1/auth/me`)
- **Acceso**: Privado (requiere `Authorization: Bearer <token>`)
- **Respuesta Exitosa (`200 OK`)**: Retorna los datos del usuario en sesión, su rol y su lista de permisos activos.

---

## 2. Módulo de Administración de Usuarios (`/api/v1/users`)

### 2.1. Listar Usuarios del Tenant (`GET /api/v1/users`)
- **Acceso**: `ROL_ADMIN`, `ROL_SUPERADMIN`
- **Query Params**: `page` (int), `limit` (int), `search` (string), `role` (enum)
- **Respuesta Exitosa (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": {
      "items": [
        {
          "id": "u-12345",
          "tenantId": "t-001",
          "username": "cajero01",
          "email": "cajero01@clinica.com",
          "fullName": "Carlos Mendoza",
          "role": "ROL_CAJERO",
          "isActive": true,
          "specialPermissionsCount": 1,
          "createdAt": "2026-09-20T10:00:00.000Z"
        }
      ],
      "total": 1,
      "page": 1,
      "limit": 10
    },
    "timestamp": "2026-09-20T17:30:00.000Z"
  }
  ```

### 2.2. Crear Usuario (`POST /api/v1/users`)
- **Acceso**: `ROL_ADMIN`, `ROL_SUPERADMIN`
- **Request Body**:
  ```json
  {
    "username": "cajero01",
    "email": "cajero01@clinica.com",
    "password": "Password123#",
    "fullName": "Carlos Mendoza",
    "role": "ROL_CAJERO"
  }
  ```
- **Respuesta Exitosa (`201 Created`)**: Retorna el usuario creado (sin el `passwordHash`).

### 2.3. Actualizar Usuario (`PUT /api/v1/users/:id`)
- **Acceso**: `ROL_ADMIN`, `ROL_SUPERADMIN`
- **Request Body**: Datos editables (`fullName`, `role`, `isActive`, `password` opcional).

### 2.4. Cambiar Estado / Desactivar Usuario (`PATCH /api/v1/users/:id/status`)
- **Acceso**: `ROL_ADMIN`, `ROL_SUPERADMIN`
- **Request Body**: `{ "isActive": false }`

---

## 3. Módulo de Permisos Especiales (`/api/v1/permissions`)

### 3.1. Listar Catálogo de Permisos Especiales (`GET /api/v1/permissions`)
- **Acceso**: Autenticado
- **Respuesta Exitosa (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "p-01",
        "code": "FACTURA_ANULAR",
        "name": "Anular Factura",
        "description": "Habilita la capacidad de anular comprobantes emitidos en caja",
        "module": "FACTURACION"
      },
      {
        "id": "p-02",
        "code": "HISTORIA_CLINICA_EXPORTAR",
        "name": "Exportar Historia Clínica",
        "description": "Permite descargar en PDF registros clínicos confidenciales",
        "module": "HISTORIAS_CLINICAS"
      }
    ],
    "timestamp": "2026-09-20T17:30:00.000Z"
  }
  ```

### 3.2. Asignar Permiso Especial a Usuario (`POST /api/v1/users/:id/permissions`)
- **Acceso**: `ROL_ADMIN`, `ROL_SUPERADMIN`
- **Request Body**:
  ```json
  {
    "permissionCode": "FACTURA_ANULAR"
  }
  ```
- **Respuesta Exitosa (`200 OK`)**: Confirma la asignación del permiso especial al usuario.

### 3.3. Revocar Permiso Especial de Usuario (`DELETE /api/v1/users/:id/permissions/:permissionCode`)
- **Acceso**: `ROL_ADMIN`, `ROL_SUPERADMIN`
- **Respuesta Exitosa (`200 OK`)**: Confirma la revocación del permiso especial.

### 3.4. Consultar Verificación Usuario + Permiso (`POST /api/v1/permissions/check`)
- **Acceso**: Autenticado
- **Propósito**: Verifica si un usuario específico posee un permiso activo para habilitar acciones o botones (ej. "Anular Factura").
- **Request Body**:
  ```json
  {
    "userId": "u-12345",
    "permission": "FACTURA_ANULAR"
  }
  ```
- **Respuesta Exitosa (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": {
      "userId": "u-12345",
      "permission": "FACTURA_ANULAR",
      "hasPermission": true,
      "grantedVia": "SPECIAL_PERMISSION"
    },
    "timestamp": "2026-09-20T17:30:00.000Z"
  }
  ```
  *(En caso de no contar con el permiso, `hasPermission` retorna `false` con `grantedVia: "NONE"`)*.
