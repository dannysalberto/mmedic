# Quickstart & Manual Testing Guide: Módulo de Entidades Colaboradoras

Guía paso a paso para verificar la funcionalidad del módulo en **Web (`apps/web`)** y **Android (`apps/android`)**.

---

## Prerrequisitos

1. Iniciar el backend (`apps/api`) y la aplicación Web (`apps/web`):
   ```bash
   pnpm dev
   ```
2. Asegurar que los servicios operen en `http://localhost:3000` (API) y `http://localhost:3001` (Web).

---

## Escenarios de Prueba

### Escenario 1: Listado y Búsqueda de Entidades
1. Abrir la aplicación Web en `http://localhost:3001`.
2. En el mega-menú de navegación, hacer clic en **"Entidades Colaboradoras"**.
3. Verificar la tabla con columnas: Código, Nombre, Estado, Cantidad de Artículos y Acciones.
4. Escribir un filtro en la barra de búsqueda y verificar la actualización en tiempo real.

### Escenario 2: Edición con Retención de Navegación (Constitución v2.6.0)
1. En la lista, hacer clic en "Editar" sobre una entidad existente.
2. Cambiar el nombre del médico/laboratorio y presionar **"Guardar Cambios"**.
3. **Verificación Esperada**:
   - Aparece un toast push flotante verde confirmando el éxito.
   - La pantalla **permanece en el formulario/modal de edición** (NO regresa al índice).

### Escenario 3: Borrado Seguro (Safe Deletion Rule)
1. Intentar eliminar una entidad que esté asociada a 1 o más artículos.
   - **Resultado Esperado**: El sistema muestra un aviso de bloqueo indicando que no se puede borrar porque tiene artículos vinculados.
2. Crear una nueva entidad sin artículos asignados y presionar "Eliminar".
   - **Resultado Esperado**: Se elimina correctamente y muestra toast push de confirmación.

### Escenario 4: Detección y Fusión de Duplicados
1. Crear dos entidades con nombres similares (ej: `Dr. Roberto Gomez` y `Roberto Gomez`).
2. Abrir la pestaña **"Detección de Duplicados"**.
3. Verificar que aparezcan agrupadas como candidatas a duplicado.
4. Seleccionar la entidad principal y hacer clic en **"Consolidar / Fusionar"**.
5. Verificar que las participaciones se reasignen a la principal y la secundaria sea removida.

### Escenario 5: Paridad en Android
1. Abrir la app Android (`apps/android`).
2. Navegar a la sección "Entidades Colaboradoras".
3. Comprobar que todas las funciones (listado, búsqueda, creación, edición con retención, borrado seguro y fusión) funcionen con la misma lógica que la Web.
