# Quickstart: Validación de Numeración Consecutiva por Categoría y Búsqueda

**Feature**: `009-article-category-numbering`  
**Status**: Ready for Implementation  
**Date**: 2026-10-19

---

## 1. Prerrequisitos

- Base de datos activa y migrada (`pnpm db:generate`, `pnpm db:migrate`).
- Servicios corriendo en local:
  - Backend NestJS en `http://localhost:3000`
  - Frontend Angular en `http://localhost:3001`
- Usuario autenticado con rol `ROL_ADMIN` o `ROL_SUPERADMIN`.

---

## 2. Escenarios de Validación End-to-End

### Escenario A: Creación de Categoría con Semilla
1. Navega a la vista de Categorías (`http://localhost:3001/categories`).
2. Presiona "+ Nueva Categoría".
3. Ingresa:
   - **Nombre**: `Consultas Médicas`
   - **Semilla**: `CONS`
4. Guarda la categoría y verifica en la lista que muestra la semilla `CONS` y el consecutivo en `0`.

---

### Escenario B: Creación de Artículo con Consecutivo Automático
1. Navega al formulario de nuevo artículo (`http://localhost:3001/articles/new`).
2. En la sección **1. Información General**, selecciona la categoría `Consultas Médicas`.
3. Observa que el campo de código muestra la serie correspondiente (`CONS-???` o el preview del siguiente).
4. Completa:
   - **Nombre**: `Consulta de Medicina General`
   - **Precio 1**: `30.00`
5. Presiona **Guardar Artículo**.
6. **Resultado esperado**: El artículo se persiste con el código exacto `CONS-001` y se redirecciona al catálogo mostrando el nuevo código correlativo.
7. Repite el proceso para un segundo artículo en la misma categoría:
   - Debe asignarse automáticamente `CONS-002`.

---

### Escenario C: Búsqueda Rápida en el Formulario y Conmutación a Modo Edición
1. Estando en el formulario de creación (`http://localhost:3001/articles/new`):
2. En el campo **Código de Artículo**, escribe `CONS-001` y presiona la tecla **Enter** (o **Tab**).
3. **Resultado esperado**:
   - El sistema realiza la búsqueda inmediata.
   - El formulario pasa automáticamente a **Modo Edición** ("Editar Artículo o Producto").
   - Todos los datos del artículo `CONS-001` se precargan (nombre, precios, checkbox de IVA, etc.).
   - El botón principal cambia a "Actualizar Artículo".

---

### Escenario D: Búsqueda Asistida mediante Botón de Lupa
1. En el campo de código, haz clic en el icono de lupa (🔍).
2. Se abre un diálogo modal con la lista de artículos existentes de la clínica y un campo de filtro.
3. Escribe `CONS` o `General` en el buscador del modal.
4. Haz clic en el ítem encontrado.
5. **Resultado esperado**: El modal se cierra, el artículo seleccionado se carga en el formulario y se activa el Modo Edición con sus datos listos para modificar.
