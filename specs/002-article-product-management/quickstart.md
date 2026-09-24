# Quickstart Guide: Registro y Gestión de Artículos, Categorías y Entidades Participantes

**Feature Branch**: `002-article-product-management`  
**Date**: 2026-09-22  
**Status**: Completed  
**Spec Reference**: [specs/002-article-product-management/spec.md](./spec.md) | [data-model.md](./data-model.md) | [contracts/api-contracts.md](./contracts/api-contracts.md)

---

## 1. Prerrequisitos

1. Tener levantado el entorno con base de datos PostgreSQL:
   ```bash
   pnpm db:up
   ```
2. Haber aplicado las migraciones de base de datos y generado el cliente de Prisma:
   ```bash
   pnpm db:generate
   ```
3. Iniciar el entorno de desarrollo del monorepo:
   ```bash
   pnpm dev
   ```
   - Backend API: `http://localhost:3000`
   - Frontend Web: `http://localhost:4200`
4. Contar con un token JWT válido de usuario autenticado (ej. login con `superadmin` / `superadmin@123#` o administrador del tenant).

---

## 2. Escenarios de Validación End-to-End

### Escenario 1: Creación de Categoría de Artículos
**Objetivo**: Validar que una categoría se crea correctamente y no puede ser eliminada.

1. Enviar petición de creación de categoría:
   ```bash
   curl -X POST http://localhost:3000/api/categories \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <TOKEN>" \
     -d '{ "name": "Procedimientos Quirúrgicos" }'
   ```
2. **Resultado Esperado**:
   - Código de estado `201 Created`.
   - Objeto de categoría devuelto con `id`, `name`, `createdAt`.
3. Intentar ejecutar una eliminación (prueba de inmutabilidad):
   ```bash
   curl -X DELETE http://localhost:3000/api/categories/<CATEGORY_ID> \
     -H "Authorization: Bearer <TOKEN>"
   ```
4. **Resultado Esperado**:
   - Código `404 Not Found` o método no permitido `405`. En la UI no existe botón de borrado.

---

### Escenario 2: Creación y Búsqueda de Entidades Participantes
**Objetivo**: Validar el registro de entidades maestras y la búsqueda por código único.

1. Registrar una entidad médica participante:
   ```bash
   curl -X POST http://localhost:3000/api/entities \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <TOKEN>" \
     -d '{ "code": "MED-CIR-01", "name": "Dr. Fernando Ruiz (Cirujano)", "status": "ACTIVE" }'
   ```
2. **Resultado Esperado**:
   - Código `201 Created` con el ID generado.
3. Buscar la entidad por su código:
   ```bash
   curl -X GET http://localhost:3000/api/entities/by-code/MED-CIR-01 \
     -H "Authorization: Bearer <TOKEN>"
   ```
4. **Resultado Esperado**:
   - Código `200 OK` retornando los datos completos del Dr. Fernando Ruiz.

---

### Escenario 3: Registro de Artículo con Múltiples Precios y Participantes Válidos ($\le 100\%$)
**Objetivo**: Registrar un artículo con 3 precios y 2 participantes cuya suma es exactamente 100.00%.

1. Registrar una segunda entidad auxiliar (ej. Anestesiólogo):
   ```bash
   curl -X POST http://localhost:3000/api/entities \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <TOKEN>" \
     -d '{ "code": "MED-ANES-01", "name": "Dra. Elena Vargas (Anestesiología)", "status": "ACTIVE" }'
   ```
2. Crear el artículo:
   ```bash
   curl -X POST http://localhost:3000/api/articles \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <TOKEN>" \
     -d '{
       "code": "CIR-APEND-01",
       "name": "Apendicectomía Laparoscópica",
       "categoryId": "<CATEGORY_ID>",
       "price1": 1200.00,
       "price2": 1500.00,
       "price3": 1100.00,
       "price4": null,
       "participants": [
         { "entityId": "<MED_CIR_ID>", "percentage": 65.00 },
         { "entityId": "<MED_ANES_ID>", "percentage": 35.00 }
       ]
     }'
   ```
3. **Resultado Esperado**:
   - Código `201 Created`.
   - Suma acumulada de participación: $65.00\% + 35.00\% = 100.00\%$. El artículo se guarda exitosamente con sus relaciones persistidas.

---

### Escenario 4: Bloqueo de Regla de Negocio ante Suma de Participación $> 100.00\%$
**Objetivo**: Verificar que el sistema rechaza cualquier intento de guardar una distribución mayor al 100%.

1. Intentar registrar un artículo con porcentajes excesivos ($70\% + 40\% = 110\%$):
   ```bash
   curl -X POST http://localhost:3000/api/articles \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <TOKEN>" \
     -d '{
       "code": "CIR-ERR-01",
       "name": "Procedimiento Inválido",
       "categoryId": "<CATEGORY_ID>",
       "price1": 500.00,
       "participants": [
         { "entityId": "<MED_CIR_ID>", "percentage": 70.00 },
         { "entityId": "<MED_ANES_ID>", "percentage": 40.00 }
       ]
     }'
   ```
2. **Resultado Esperado**:
   - Código `400 Bad Request`.
   - Mensaje: *"La suma de los porcentajes de participación (110%) no puede superar el 100.00%"*.
   - No se crea ningún registro en `articles` ni en `article_participants`.

---

### Escenario 5: Validación de Experiencia de Usuario (UI Web)
**Objetivo**: Comprobar el flujo visual en el navegador.

1. Ingresar a `http://localhost:4200` y navegar al módulo de **Artículos**.
2. **Selector de Categoría**:
   - Escribir un texto en el buscador de categorías. Si no existe, hacer clic en la opción "+ Crear '[término]'" y verificar que se agregue y seleccione de inmediato sin parpadeo ni recarga.
3. **Detalle de Participantes**:
   - Agregar una fila e ingresar el código `"MED-CIR-01"`. Verificar que el sistema autocompleta el nombre y estatus.
   - Pulsar el botón "+ Nueva Entidad", llenar el modal con código `"INST-PAB-01"`, nombre `"Pabellón Quirúrgico Central"`, estatus `"Activo"`, guardar y constatar que se cierra el modal y se añade como nueva fila al detalle.
   - Colocar $60\%$ en la primera fila y $45\%$ en la segunda. Constatar que el badge total muestra `105%`, cambia a color de error (rojo) y el botón "Guardar Artículo" queda deshabilitado.
   - Reducir la segunda fila a $40\%$. Constatar que el total es $100\%$ y el botón se habilita.
4. **Validación Mobile-First**:
   - Abrir DevTools en resolución móvil (ej. iPhone 14, 390px de ancho).
   - Verificar que no existe ningún scroll o desbordamiento horizontal (`overflow-x: hidden`).
   - Las filas de participantes se presentan como tarjetas limpias y el modal ocupa la pantalla de forma ergonómica.
