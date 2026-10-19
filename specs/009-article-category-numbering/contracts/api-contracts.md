# API Contracts: Numeración Consecutiva por Categoría y Búsqueda de Artículos

**Feature**: `009-article-category-numbering`  
**Base Path**: `/api/v1`

---

## 1. Categorías con Semilla

### Crear Categoría con Semilla
- **Ruta**: `POST /api/v1/categories`
- **Headers**: `Authorization: Bearer <JWT>`
- **Request Body**:
```json
{
  "name": "Consultas Médicas",
  "seed": "CONS"
}
```
- **Response `201 Created`**:
```json
{
  "success": true,
  "data": {
    "id": "7f8b3c9a-1234-4a5b-9c8d-e1f2a3b4c5d6",
    "tenantId": "tenant-uuid",
    "name": "Consultas Médicas",
    "seed": "CONS",
    "currentSequence": 0,
    "createdAt": "2026-10-19T10:00:00.000Z",
    "updatedAt": "2026-10-19T10:00:00.000Z"
  },
  "timestamp": "2026-10-19T10:00:00.000Z"
}
```

---

## 2. Búsqueda Rápida de Artículo por Código

### Consultar Artículo por Código Exacto
- **Ruta**: `GET /api/v1/articles/code/:code`
- **Headers**: `Authorization: Bearer <JWT>`
- **Response `200 OK` (Si existe)**:
```json
{
  "success": true,
  "data": {
    "id": "art-uuid-1",
    "tenantId": "tenant-uuid",
    "code": "CONS-001",
    "name": "Consulta Urológica General",
    "categoryId": "7f8b3c9a-1234-4a5b-9c8d-e1f2a3b4c5d6",
    "category": {
      "id": "7f8b3c9a-1234-4a5b-9c8d-e1f2a3b4c5d6",
      "name": "Consultas Médicas",
      "seed": "CONS"
    },
    "price1": 35.00,
    "price2": 33.00,
    "price3": 31.00,
    "price4": 27.99,
    "appliesVat": true,
    "isActive": true,
    "participants": [
      {
        "id": "part-uuid-1",
        "entityId": "ent-uuid-1",
        "percentage": 70.00,
        "entity": {
          "id": "ent-uuid-1",
          "code": "MED-01",
          "name": "Dr. Carlos Morales",
          "status": "ACTIVE"
        }
      }
    ],
    "createdAt": "2026-10-19T10:05:00.000Z",
    "updatedAt": "2026-10-19T10:05:00.000Z"
  },
  "timestamp": "2026-10-19T10:10:00.000Z"
}
```
- **Response `404 Not Found` (Si no existe)**:
```json
{
  "success": false,
  "statusCode": 404,
  "message": "No existe ningún artículo con el código 'CONS-999' en esta organización",
  "error": "Not Found"
}
```

---

## 3. Creación de Artículo con Consecutivo Automático

### Guardar Nuevo Artículo (Código Opcional)
- **Ruta**: `POST /api/v1/articles`
- **Headers**: `Authorization: Bearer <JWT>`
- **Request Body**:
```json
{
  "categoryId": "7f8b3c9a-1234-4a5b-9c8d-e1f2a3b4c5d6",
  "name": "Consulta de Traumatología",
  "price1": 40.00,
  "price2": 38.00,
  "appliesVat": true,
  "isActive": true,
  "participants": []
}
```
*(Nota: Si `code` no viene o viene vacío, el backend adquiere el bloqueo sobre la categoría `7f8b3c9a-...`, incrementa `currentSequence` y genera `CONS-002` automáticamente)*.

- **Response `201 Created`**:
```json
{
  "success": true,
  "data": {
    "id": "art-uuid-2",
    "tenantId": "tenant-uuid",
    "code": "CONS-002",
    "name": "Consulta de Traumatología",
    "categoryId": "7f8b3c9a-1234-4a5b-9c8d-e1f2a3b4c5d6",
    "price1": 40.00,
    "price2": 38.00,
    "appliesVat": true,
    "isActive": true,
    "createdAt": "2026-10-19T10:15:00.000Z",
    "updatedAt": "2026-10-19T10:15:00.000Z"
  },
  "timestamp": "2026-10-19T10:15:00.000Z"
}
```
