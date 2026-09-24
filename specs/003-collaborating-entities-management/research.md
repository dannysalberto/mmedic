# Research & Technical Decisions: Módulo de Entidades Colaboradoras

## 1. Algoritmo de Detección de Duplicados

### Problema
En entornos clínicos y comerciales, distintos usuarios suelen registrar el mismo profesional o aliado comercial con variaciones tipográficas o de código. Ejemplos:
- `Dr. Juan Pérez` (Código: `DOC-001`) vs `Juan Perez` (Código: `MED-050`)
- `Laboratorio Central C.A.` (Código: `LAB-01`) vs `LABORATORIO CENTRAL` (Código: `ALI-09`)

### Estrategia de Normalización y Comparación
1. **Paso 1: Normalización de Cadena (`normalizeName`)**
   - Convertir a minúsculas: `.toLowerCase()`
   - Remover acentos/diacríticos: `.normalize("NFD").replace(/[\u0300-\u036f]/g, "")`
   - Eliminar prefijos honorificos comunes: `dr`, `dra`, `doctor`, `doctora`, `lic`, `licenciado`, `ing`, `prof`, `c.a`, `s.a`, `sr`, `sra`
   - Eliminar signos de puntuación y espacios extras.
2. **Paso 2: Agrupación y Cálculo de Similitud**
   - Agrupar entidades dentro del mismo `tenantId` cuyo nombre normalizado sea idéntico o posea una distancia de Levenshtein / similitud $\ge 80\%$.
   - Retornar en el endpoint `GET /api/v1/entities/duplicates` los grupos de candidatos para revisión visual.

---

## 2. Regla de Borrado Seguro (*Safe Deletion Logic*)

- Antes de ejecutar `prisma.entity.delete()`, consultar `_count.articleParticipants`.
- Si `articleParticipants > 0`:
  - Retornar respuesta HTTP `400 Bad Request` con mensaje explicativo: *"No es posible eliminar la entidad '[Nombre]' porque está asociada a X artículos. Por favor, desasóciela previamente o cambie su estado a INACTIVA"*.
  - Registrar traza en la base de datos de logs de error (`SystemErrorLog`).
- Si `articleParticipants == 0`:
  - Ejecutar borrado seguro y emitir respuesta `200 OK`.

---

## 3. Lógica Transaccional de Fusión de Entidades (`/merge`)

Al ejecutar la consolidación de `secondaryEntityId` hacia `primaryEntityId`:
1. Abrir transacción atómica `$transaction` en Prisma.
2. Obtener todos los registros de `ArticleParticipant` vinculados a `secondaryEntityId`.
3. Para cada artículo involucrado:
   - Verificar si `primaryEntityId` ya participa en dicho artículo.
   - Si YA participa: Sumar los porcentajes (`primary.percentage + secondary.percentage`). Si la suma excede 100.00%, ajustar o advertir. Actualizar `primary` y eliminar `secondary`.
   - Si NO participa: Reasignar el `entityId` de `secondaryEntityId` a `primaryEntityId`.
4. Eliminar físicamente el registro `secondaryEntityId`.
5. Retornar la entidad principal consolidada.
