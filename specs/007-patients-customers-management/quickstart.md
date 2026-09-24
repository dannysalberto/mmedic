# Quickstart Validation Guide: Módulo de Gestión de Clientes / Directorio de Pacientes

## 1. Prerrequisitos y Entorno de Pruebas

Asegurarse de contar con los servicios de backend y frontend activos localmente:

```bash
# Iniciar servicios del monorepo
pnpm dev
```

---

## 2. Escenarios de Validación End-to-End

### Escenario 1: Acceso desde el Menú Lateral ("Directorio de Pacientes")
1. Abrir la SPA Web (`http://localhost:3001`).
2. En la barra de navegación lateral, localizar el módulo **Directorio de Pacientes**.
3. Hacer clic sobre la opción y verificar que la URL cambie a `/customers` y la vista cargue el listado principal de clientes.

### Escenario 2: Búsqueda de Clientes en Tiempo Real
1. En la barra de búsqueda del listado, escribir un RIF o nombre registrado (ej: `V-19876543` o `Inversiones`).
2. Verificar que los resultados de la tabla filtren instantáneamente mostrando únicamente el cliente buscado.

### Escenario 3: Registro de Nuevo Cliente / Paciente
1. Hacer clic en el botón `+ Nuevo Cliente`.
2. Completar los campos obligatorios:
   - RIF/Cédula: `J-99887766-0`
   - Nombre / Razón Social: `Clínica de Pruebas E2E`
   - Teléfono: `04129998877`
   - Dirección: `Av. Principal, Edf. Medical Center`
3. Presionar **Guardar**.
4. Validar que aparezca la notificación flotante (toast) de éxito y la tabla liste el nuevo registro.

### Escenario 4: Edición y Retención de Navegación
1. En la tabla de clientes, hacer clic en la acción **Editar** sobre un registro existente.
2. Modificar el nombre o teléfono y hacer clic en **Guardar Cambios**.
3. Validar que:
   - Aparezca la notificación flotante de éxito.
   - El sistema **permanezca en la pantalla/modal de edición** sin forzar redirección al listado (cumplimiento del Principio V, Subsección 5.4).

### Escenario 5: Regla de Eliminación Segura (Safe Deletion Rule)
1. Intentar eliminar un cliente que posee facturas asociadas.
2. Confirmar que el sistema muestre una notificación de advertencia/error indicando que no se puede eliminar un cliente con comprobantes vinculados.
3. Eliminar un cliente recién registrado sin movimientos y verificar que la eliminación se efectúe correctamente.
