# Regla Arquitectónica: Notificaciones Transversales Push y Navegación de Formularios

**ID**: `RULE-UI-001`  
**Ámbito**: Transversal (Web SPA en Angular 19+ y Móvil Nativo en Android Kotlin / Jetpack Compose)  
**Obligatoriedad**: Cumplimiento Vinculante y Estricto  
**Fecha de Ratificación**: 2026-09-22  

---

## 1. Notificaciones Transversales Estilo Push (Toast Flotante)

1. **Universalidad de la Retroalimentación**:
   - Todo proceso de **Guardar (Crear)**, **Actualizar (Modificar)** o **Eliminar** en cualquier módulo, pantalla o vista del sistema **DEBE** emitir una notificación visual interactiva con estilo de notificación push (Toast flotante / Banner superior).
   - Queda terminantemente prohibido el uso de alertas nativas del navegador (`alert()`, `confirm()`) o banners estáticos que desplacen abruptamente el layout de la pantalla.

2. **Diseño Visual y Estados**:
   - Las notificaciones deben respetar los Design Tokens de la plataforma con estética moderna y *glassmorphism*:
     - **Éxito (SUCCESS)**: Acento verde esmeralda (`#10B981` / `rgba(16, 185, 129, 0.16)`), icono de verificación (`✓`), título claro y mensaje conciso.
     - **Error (ERROR)**: Acento rojo carmesí (`#EF4444` / `rgba(239, 68, 68, 0.18)`), icono de alerta (`✕`), descripción del fallo y orientación al usuario.
     - **Advertencia (WARNING)**: Acento ámbar (`#F59E0B`), icono de precaución (`⚠️`).
     - **Información (INFO)**: Acento azul/cyan (`#0EA5E9`), icono informativo (`ℹ️`).
   - Cada notificación debe incluir:
     - Icono distintivo según el estado.
     - Título en negrita (ej. *"Artículo Guardado"*, *"Actualización Exitosa"*, *"Error de Validación"*).
     - Descripción textual descriptiva.
     - Botón de cierre o descarte manual (`✕`).
     - Barra de progreso o temporizador de autocierre suave (duración estándar de 3.5 a 4.5 segundos).

3. **Arquitectura del Servicio**:
   - **Web SPA (`apps/web`)**: Servicio singleton reactivo inyectable en raíz (`NotificationService`) con Angular Signals. Componente `<app-notification-toast>` alojado en el componente raíz (`AppComponent`) para visibilidad global.
   - **Android (`apps/android`)**: Singleton o StateHolder transversal en Compose (`NotificationManager`) con `StateFlow<PushNotification?>` y componente flotante animado (`NotificationPushBanner`) alojado en la capa superior de `MainActivity`.

---

## 2. Reglas de Retención de Navegación tras Guardar y Actualizar

1. **Prohibición de Redirección Automática en Actualizaciones**:
   - Al realizar el proceso de **Actualizar o Editar** un elemento existente, la pantalla o módulo **NUNCA debe volver al índice o listado automáticamente**.
   - El sistema **DEBE permanecer en la vista/formulario actual**, reflejar los datos actualizados y proyectar la notificación estilo push de éxito.
   - La acción de volver a la vista principal o índice debe ser **exclusivamente una decisión deliberada del usuario** mediante su interacción directa con el botón o enlace de navegación (ej. *"← Volver al Catálogo"*).

2. **Comportamiento en Guardado de Elementos Nuevos**:
   - La redirección o retorno automático al índice/catálogo principal **SOLO está permitida tras el guardado exitoso de un elemento NUEVO**, garantizando que el usuario observe el nuevo registro incorporado en el listado tras recibir la notificación push de confirmación.

3. **Paridad Total de Comportamiento (Web y Android)**:
   - Ambas reglas aplican idéntica e inexcusablemente tanto en la versión Web como en la versión Android nativa. Ningún módulo puede ser aprobado si presenta divergencias en esta heurística de navegación.
