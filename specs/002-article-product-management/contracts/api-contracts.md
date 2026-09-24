# API Contracts: Registro y Gestión de Artículos, Categorías y Entidades Participantes

**Feature Branch**: `002-article-product-management`  
**Date**: 2026-09-22  
**Status**: Completed  
**Spec Reference**: [specs/002-article-product-management/spec.md](./spec.md)

---

## 1. Directivas Generales de Contrato

- **Autenticación**: Todos los endpoints exigen token JWT en la cabecera `Authorization: Bearer <token>`.
- **Envelope de Respuesta**: Todas las respuestas HTTP respetan obligatoriamente `ApiResponse<T>` de `@mmedic/types`:
  ```typescript
  export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
    timestamp: string;
  }
  ```
- **Aislamiento Multi-Tenant**: El `tenantId` se resuelve de forma automática y transparente a partir del token JWT del usuario autenticado; jamás se expone como parámetro manipulable en la URL o cuerpo de la petición.

---

## 2. Contratos del Módulo de Categorías (`/api/categories`)

### 2.1. Listar Categorías
- **Método**: `GET`
- **Ruta**: `/api/categories`
- **Query Params**:
  - `search` *(opcional, string)*: Filtrar categorías por coincidencia en nombre.
- **Respuesta Exitosa (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "c1a2b3c4-0000-0000-0000-000000000001",
        "name": "Consultas Médicas",
        "createdAt": "2026-09-22T10:00:00.000Z",
        "updatedAt": "2026-09-22T10:00:00.000Z"
      }
    ],
    "timestamp": "2026-09-22T12:00:00.000Z"
  }
  ```

### 2.2. Crear Categoría
- **Método**: `POST`
- **Ruta**: `/api/categories`
- **Cuerpo de la Petición (`CreateCategoryDto`)**:
  ```json
  {
    "name": "Laboratorio Clínico"
  }
  ```
- **Validaciones**:
  - `name`: String, no vacío, longitud 2-100 caracteres.
- **Respuesta Exitosa (201 Created)**:
  ```json
  {
    "success": true,
    "data": {
      "id": "c1a2b3c4-0000-0000-0000-000000000002",
      "name": "Laboratorio Clínico",
      "createdAt": "2026-09-22T12:00:00.000Z",
      "updatedAt": "2026-09-22T12:00:00.000Z"
    },
    "message": "Categoría creada exitosamente",
    "timestamp": "2026-09-22T12:00:00.000Z"
  }
  ```
- **Errores**:
  - `400 Bad Request`: Nombre de categoría duplicado en el mismo tenant o inválido.

> **NOTA DE GOBERNANZA**: No existe endpoint `DELETE /api/categories/:id`. Las categorías son inmutables.

---

## 3. Contratos del Módulo de Entidades Participantes (`/api/entities`)

### 3.1. Listar Entidades
- **Método**: `GET`
- **Ruta**: `/api/entities`
- **Query Params**:
  - `search` *(opcional, string)*: Búsqueda por coincidencia en código o nombre.
  - `status` *(opcional, enum: `ACTIVE` | `INACTIVE`)*: Filtrar por estatus.
- **Respuesta Exitosa (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "e1a2b3c4-0000-0000-0000-000000000001",
        "code": "DR-PEREZ-01",
        "name": "Dr. Carlos Pérez (Cardiología)",
        "status": "ACTIVE",
        "createdAt": "2026-09-22T10:00:00.000Z",
        "updatedAt": "2026-09-22T10:00:00.000Z"
      }
    ],
    "timestamp": "2026-09-22T12:00:00.000Z"
  }
  ```

### 3.2. Buscar Entidad por Código
- **Método**: `GET`
- **Ruta**: `/api/entities/by-code/:code`
- **Respuesta Exitosa (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "id": "e1a2b3c4-0000-0000-0000-000000000001",
      "code": "DR-PEREZ-01",
      "name": "Dr. Carlos Pérez (Cardiología)",
      "status": "ACTIVE",
      "createdAt": "2026-09-22T10:00:00.000Z",
      "updatedAt": "2026-09-22T10:00:00.000Z"
    },
    "timestamp": "2026-09-22T12:00:00.000Z"
  }
  ```
- **Errores**:
  - `404 Not Found`: No existe entidad con ese código en el tenant activo.

### 3.3. Crear Entidad (Invocado desde Modal o Catálogo)
- **Método**: `POST`
- **Ruta**: `/api/entities`
- **Cuerpo de la Petición (`CreateEntityDto`)**:
  ```json
  {
    "code": "LAB-SUR",
    "name": "Laboratorio Clínico del Sur C.A.",
    "status": "ACTIVE"
  }
  ```
- **Validaciones**:
  - `code`: String, no vacío, longitud 1-50, único por tenant.
  - `name`: String, no vacío, longitud 2-150.
  - `status`: Enum opcional (`ACTIVE` | `INACTIVE`), por defecto `ACTIVE`.
- **Respuesta Exitosa (201 Created)**:
  ```json
  {
    "success": true,
    "data": {
      "id": "e1a2b3c4-0000-0000-0000-000000000002",
      "code": "LAB-SUR",
      "name": "Laboratorio Clínico del Sur C.A.",
      "status": "ACTIVE",
      "createdAt": "2026-09-22T12:00:00.000Z",
      "updatedAt": "2026-09-22T12:00:00.000Z"
    },
    "message": "Entidad participante registrada exitosamente",
    "timestamp": "2026-09-22T12:00:00.000Z"
  }
  ```
- **Errores**:
  - `409 Conflict` o `400 Bad Request`: Código de entidad duplicado en el mismo tenant.

---

## 4. Contratos del Módulo de Artículos (`/api/articles`)

### 4.1. Listar Artículos
- **Método**: `GET`
- **Ruta**: `/api/articles`
- **Query Params**:
  - `search` *(opcional, string)*: Búsqueda por código o nombre del artículo.
  - `categoryId` *(opcional, UUID)*: Filtro por categoría.
  - `isActive` *(opcional, boolean)*: Filtro por estatus de activación.
- **Respuesta Exitosa (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "a1a2b3c4-0000-0000-0000-000000000001",
        "code": "CONS-CARD-01",
        "name": "Consulta Especializada de Cardiología",
        "categoryId": "c1a2b3c4-0000-0000-0000-000000000001",
        "category": {
          "id": "c1a2b3c4-0000-0000-0000-000000000001",
          "name": "Consultas Médicas"
        },
        "price1": 50.00,
        "price2": 65.00,
        "price3": 40.00,
        "price4": null,
        "isActive": true,
        "participantsCount": 1,
        "createdAt": "2026-09-22T10:00:00.000Z",
        "updatedAt": "2026-09-22T10:00:00.000Z"
      }
    ],
    "timestamp": "2026-09-22T12:00:00.000Z"
  }
  ```

### 4.2. Obtener Detalle de Artículo por ID
- **Método**: `GET`
- **Ruta**: `/api/articles/:id`
- **Respuesta Exitosa (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "id": "a1a2b3c4-0000-0000-0000-000000000001",
      "code": "CONS-CARD-01",
      "name": "Consulta Especializada de Cardiología",
      "categoryId": "c1a2b3c4-0000-0000-0000-000000000001",
      "category": {
        "id": "c1a2b3c4-0000-0000-0000-000000000001",
        "name": "Consultas Médicas"
      },
      "price1": 50.00,
      "price2": 65.00,
      "price3": 40.00,
      "price4": null,
      "isActive": true,
      "participants": [
        {
          "id": "p1a2b3c4-0000-0000-0000-000000000001",
          "entityId": "e1a2b3c4-0000-0000-0000-000000000001",
          "percentage": 70.00,
          "entity": {
            "id": "e1a2b3c4-0000-0000-0000-000000000001",
            "code": "DR-PEREZ-01",
            "name": "Dr. Carlos Pérez (Cardiología)",
            "status": "ACTIVE"
          }
        }
      ],
      "createdAt": "2026-09-22T10:00:00.000Z",
      "updatedAt": "2026-09-22T10:00:00.000Z"
    },
    "timestamp": "2026-09-22T12:00:00.000Z"
  }
  ```

### 4.3. Crear Artículo con Detalle de Participantes
- **Método**: `POST`
- **Ruta**: `/api/articles`
- **Cuerpo de la Petición (`CreateArticleDto`)**:
  ```json
  {
    "code": "CONS-CARD-01",
    "name": "Consulta Especializada de Cardiología",
    "categoryId": "c1a2b3c4-0000-0000-0000-000000000001",
    "price1": 50.00,
    "price2": 65.00,
    "price3": 40.00,
    "price4": null,
    "participants": [
      {
        "entityId": "e1a2b3c4-0000-0000-0000-000000000001",
        "percentage": 70.00
      }
    ]
  }
  ```
- **Validaciones**:
  - `code`: String, obligatorio, único por tenant.
  - `name`: String, obligatorio.
  - `categoryId`: UUID de categoría existente en el tenant.
  - `price1`: Number, obligatorio, $\ge 0.00$.
  - `price2..4`: Number opcional, $\ge 0.00$ si se envía.
  - `participants`: Array opcional de `{ entityId: UUID, percentage: number }`.
    - Cada `percentage` debe ser $> 0.00$ y $\le 100.00$.
    - No se admiten `entityId` duplicados en el array.
    - **Invariante**: $\sum \text{percentage} \le 100.00$.
- **Respuesta Exitosa (201 Created)**:
  ```json
  {
    "success": true,
    "data": {
      "id": "a1a2b3c4-0000-0000-0000-000000000001",
      "code": "CONS-CARD-01",
      "name": "Consulta Especializada de Cardiología",
      "categoryId": "c1a2b3c4-0000-0000-0000-000000000001",
      "price1": 50.00,
      "price2": 65.00,
      "price3": 40.00,
      "price4": null,
      "isActive": true,
      "participants": [
        {
          "id": "p1a2b3c4-0000-0000-0000-000000000001",
          "entityId": "e1a2b3c4-0000-0000-0000-000000000001",
          "percentage": 70.00
        }
      ],
      "createdAt": "2026-09-22T12:00:00.000Z",
      "updatedAt": "2026-09-22T12:00:00.000Z"
    },
    "message": "Artículo registrado exitosamente",
    "timestamp": "2026-09-22T12:00:00.000Z"
  }
  ```
- **Errores**:
  - `400 Bad Request`:
    - "El código de artículo ya existe."
    - "La suma de los porcentajes de participación (X%) no puede superar el 100.00%."
    - "No se permite asociar la misma entidad más de una vez en el artículo."

### 4.4. Actualizar Artículo
- **Método**: `PUT`
- **Ruta**: `/api/articles/:id`
- **Cuerpo de la Petición (`UpdateArticleDto`)**:
  - Mismo esquema que `CreateArticleDto` (campos editables: `name`, `categoryId`, `price1..4`, `isActive`, `participants`).
- **Respuesta Exitosa (200 OK)**: Datos del artículo actualizados tras transacción atómica.

---

## 5. DTOs e Interfaces en `@mmedic/types`

```typescript
export type EntityStatus = 'ACTIVE' | 'INACTIVE';

export interface ArticleCategory {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryDto {
  name: string;
}

export interface Entity {
  id: string;
  code: string;
  name: string;
  status: EntityStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEntityDto {
  code: string;
  name: string;
  status?: EntityStatus;
}

export interface ArticleParticipantItemDto {
  entityId: string;
  percentage: number;
}

export interface ArticleParticipant {
  id: string;
  articleId: string;
  entityId: string;
  percentage: number;
  entity?: Entity;
  createdAt: string;
  updatedAt: string;
}

export interface Article {
  id: string;
  code: string;
  name: string;
  categoryId: string;
  category?: ArticleCategory;
  price1: number;
  price2?: number | null;
  price3?: number | null;
  price4?: number | null;
  isActive: boolean;
  participants?: ArticleParticipant[];
  participantsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateArticleDto {
  code: string;
  name: string;
  categoryId: string;
  price1: number;
  price2?: number | null;
  price3?: number | null;
  price4?: number | null;
  participants?: ArticleParticipantItemDto[];
}

export interface UpdateArticleDto extends Partial<CreateArticleDto> {
  isActive?: boolean;
}
```
