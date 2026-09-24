# Quickstart & Manual Testing Guide: Módulo de Personal y Colaboradores

Guía paso a paso para verificar de forma integral la funcionalidad en **Web (`apps/web`)** y **Android (`apps/android`)**.

---

## Prerrequisitos

1. Iniciar los servicios del monorepo:
   ```bash
   pnpm dev
   ```
2. Confirmar que la API responda en `http://localhost:3000` y la Web en `http://localhost:3001`.

---

## Escenarios de Validación

### Escenario 1: Navegación desde Menú Principal y Listado de Colaboradores
1. Abrir la aplicación Web en `http://localhost:3001`.
2. Abrir el menú de **Módulos** y situarse en la sección "PARTICIPANTES Y HONORARIOS".
3. Hacer clic en **"Personal/Profesionales"**.
4. **Resultado Esperado**:
   - La URL cambia a `/contributors`.
   - Se despliega la tabla con: Código, Nombre, Estado, Participaciones Asociadas y Acciones.
   - La barra de búsqueda reactiva filtra en tiempo real al escribir nombre o código.
   - El selector de estado ("Todos", "Activos", "Inactivos") filtra inmediatamente.

### Escenario 2: Creación y Edición con Retención de Pantalla (Constitución v2.6.0)
1. Hacer clic en **"+ Nuevo Colaborador"**.
2. Ingresar código `MED-01` y nombre `Dr. Alejandro Morales`.
3. Guardar el formulario:
   - **Resultado Esperado**: Aparece un toast push verde de éxito y el sistema redirige al listado mostrando al nuevo colaborador.
4. En el listado, hacer clic en el botón de edición del colaborador recién creado.
5. Cambiar el nombre a `Dr. Alejandro Morales S.` y hacer clic en **"Guardar Cambios"**:
   - **Resultado Esperado**: Aparece la notificación flotante de éxito y la interfaz **permanece en la pantalla/modal de edición** (cumpliendo el Principio 5.4 sin auto-navegar al índice).

### Escenario 3: Validación de Código Duplicado
1. Intentar crear o editar un colaborador utilizando un código ya existente en la misma institución (`MED-01`).
2. Presionar guardar:
   - **Resultado Esperado**: El backend responde con error controlado, la UI emite una notificación push de error y el campo de código se resalta.

### Escenario 4: Regla de Borrado Seguro (*Safe Deletion*)
1. Para un colaborador con asociaciones activas a artículos o liquidaciones:
   - Hacer clic en "Eliminar":
   - **Resultado Esperado**: El sistema bloquea el borrado e informa mediante toast/modal explicativo que el colaborador no puede borrarse por tener registros asociados, recomendando marcarlo como `INACTIVO`.
2. Para un colaborador sin asociaciones (0 registros vinculados):
   - Confirmar eliminación:
   - **Resultado Esperado**: El colaborador se elimina de la base de datos y de la lista con notificación push de éxito.

### Escenario 5: Detección y Fusión Atómica de Duplicados
1. Registrar intencionalmente un segundo colaborador: código `MED-99`, nombre `Alejandro Morales`.
2. Cambiar a la pestaña **"Detección de Duplicados"**.
3. **Resultado Esperado**:
   - El sistema lista el grupo candidato con una coincidencia superior al 80%.
4. Seleccionar `Dr. Alejandro Morales S.` como perfil maestro (`primaryContributorId`) y presionar **"Consolidar / Fusionar"**:
   - **Resultado Esperado**: Las asociaciones del perfil secundario se reasignan al principal, el duplicado se elimina y se muestra notificación push de consolidación exitosa.

### Escenario 6: Paridad Móvil Android (Kotlin / Jetpack Compose)
1. Ejecutar la aplicación Android (`apps/android`).
2. Acceder al menú lateral/inferior y seleccionar **"Personal/Profesionales"**.
3. Comprobar que todas las funcionalidades (listado, búsqueda, formulario con retención de pantalla, borrado seguro y fusión de duplicados) operan con idéntico comportamiento y estilo visual Material3 derivado del token system.
