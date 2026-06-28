# 🛢️ OILBOARDS — Índice de Documentación

**Guía de qué es cada documento y cuándo usarlo**

| Campo | Valor |
|---|---|
| Versión | v0.1 |
| Total de documentos | 9 |
| Última edición | (poner fecha) |

> Este índice es el punto de entrada a toda la documentación de Oilboards. Antes de buscar algo, revisa aquí en qué documento está.

---

## El mapa completo

```
NEGOCIO Y PRODUCTO
└── Doc 0 — La Biblia (fuente de verdad)

DESARROLLO — ARRANQUE
├── Doc 1 — Fundación técnica (stack + droplet de dev)
├── Doc 2 — Módulos y pantallas del dashboard
└── Doc 3 — Modelo de datos (tablas y esquema)

DESARROLLO — INTEGRACIONES
├── Doc 4 — Prompts de IA (Claude)
└── Doc 5 — Contratos de API (endpoints)

DESARROLLO — MÓVIL Y SEGURIDAD
├── Doc 6 — App móvil offline-first (PWA)
├── Doc 7 — Exportación de reportes (PDF/Excel)
└── Doc 8 — Seguridad y autenticación en código

OPERACIONES
└── Doc 9 — Despliegue a producción
```

---

## Doc 0 — La Biblia · Fuente de Verdad

**Archivo:** `0_oilboards-biblia-fuente-de-verdad.md`

**Qué es:** El documento madre del producto. Define qué es Oilboards, para quién es, qué problema resuelve, la estrategia comercial, el modelo de precios, las cláusulas contractuales clave y los riesgos del negocio. Es la visión completa, no el detalle técnico.

**Cuándo leerlo:**
- Antes de hablar con un cliente.
- Cuando alguien nuevo entra al proyecto y necesita entender el producto.
- Cuando hay que tomar una decisión de negocio (¿a quién vendemos?, ¿cómo cobramos?).
- Cuando hay dudas sobre el "por qué" de algo.

**No contiene:** código, tablas de base de datos ni endpoints. Para eso están los docs técnicos.

---

## Doc 1 — Fundación Técnica (Stack + Droplet de Desarrollo)

**Archivo:** `1_oilboards-fase0-fundacion-tecnica.md`

**Qué es:** Las decisiones de arquitectura y el setup del entorno de desarrollo desde cero. Define el stack tecnológico completo (Laravel + Inertia + React + Reverb + PostgreSQL + Redis), por qué se eligió cada tecnología, las librerías de gráficas para las pantallas espectaculares, la estructura de carpetas del proyecto, y los comandos paso a paso para dejar el droplet de desarrollo listo.

**Cuándo leerlo:**
- El primer día que el programador arranca.
- Cuando hay que agregar un nuevo miembro al equipo y necesita montar su entorno.
- Cuando surge una duda de "¿por qué usamos X y no Y?".
- Al instalar una nueva librería — verificar que sea compatible con el stack.

**No contiene:** el setup de producción (eso es el Doc 9). Este doc es solo para desarrollo local.

---

## Doc 2 — Módulos y Pantallas del Dashboard

**Archivo:** `2_oilboards-modulos-dashboard-detallado.md`

**Qué es:** El mapa completo de la interfaz. Define cada pantalla del sistema: qué muestra, qué componentes visuales usa (con qué librería de gráficas), qué datos consume, qué rol puede verla, y en qué fase del proyecto se construye (MVP vs. Escalamiento vs. Salas). Incluye también las pantallas recomendadas que no estaban en el diseño original.

**Cuándo leerlo:**
- Antes de diseñar o programar cualquier pantalla.
- Cuando hay que decidir si una pantalla es MVP o puede esperar.
- Cuando el diseñador necesita saber qué componentes van en cada módulo.
- Cuando el programador frontend va a crear un nuevo componente.

**No contiene:** el código de los componentes ni los endpoints que los alimentan. Para eso están los docs 4 y 5.

---

## Doc 3 — Modelo de Datos

**Archivo:** `3_oilboards-modelo-de-datos.md`

**Qué es:** El esquema completo de la base de datos. Define cada tabla con sus columnas, tipos, llaves foráneas, índices y notas. Incluye el diagrama de relaciones, las convenciones de diseño (multi-tenancy con `organization_id`, tablas append-only inmutables, columnas generadas), y el orden exacto en que hay que crear las migraciones de Laravel.

**Cuándo leerlo:**
- Antes de crear cualquier migración.
- Cuando hay que agregar un campo nuevo — verificar que no rompe el esquema existente.
- Cuando hay una duda sobre cómo se relacionan dos entidades.
- Cuando se detecta un bug de datos — entender la fuente.

**No contiene:** el código PHP de los modelos Eloquent (eso está en el repo). Define la estructura, no la implementación.

---

## Doc 4 — Specs de Prompts de IA

**Archivo:** `4_oilboards-specs-prompts-ia.md`

**Qué es:** La definición exacta de los 3 prompts de Claude que usa Oilboards: (1) estructuración de bitácora de voz → JSON, (2) diagnóstico y recomendación de alerta, (3) chat del asistente virtual. Para cada uno: el system prompt completo, el user prompt con variables, el JSON de respuesta esperado, el modelo recomendado (Haiku vs. Sonnet), el Job de Laravel que lo dispara, un caso de prueba real y el costo estimado. También incluye la clase `ClaudeService` compartida.

**Cuándo leerlo:**
- Al implementar cualquier integración con Claude.
- Cuando los resultados de la IA no son los esperados — revisar el prompt.
- Cuando hay que agregar un nuevo caso de uso de IA.
- Cuando se quiere optimizar el costo de la API (cambiar de Sonnet a Haiku).

**No contiene:** la lógica de cuándo se disparan los Jobs (eso está en los Observers del repo) ni el modelo de datos de `ai_interactions` (eso está en el Doc 3).

---

## Doc 5 — Contratos de API (Endpoints)

**Archivo:** `5_oilboards-doc5-contratos-api.md`

**Qué es:** La especificación completa de todas las rutas de la API REST: URL, método HTTP, autenticación requerida, rol necesario, payload de request, estructura de response, códigos de error y notas de implementación. Cubre los 40+ endpoints del MVP: auth, usuarios, activos, pozos, reportes diarios, voz, paros, alertas, KPIs, exportación, asistente virtual y sincronización offline. También define los canales y eventos de WebSocket (Reverb).

**Cuándo leerlo:**
- El programador backend al crear cualquier Controller.
- El programador frontend al hacer cualquier llamada a la API.
- Cuando hay que agregar un endpoint nuevo — seguir las convenciones del doc.
- Cuando hay un bug de integración entre frontend y backend.
- Cuando alguien externo necesita integrarse con Oilboards.

**No contiene:** el código de los Controllers (eso está en el repo). Define el contrato, no la implementación interna.

---

## Doc 6 — App Móvil Offline-First (PWA)

**Archivo:** `6_oilboards-doc6-app-movil-offline.md`

**Qué es:** Todo lo relacionado con la experiencia en celular/tablet del operador de campo. Define la decisión PWA vs. app nativa (y por qué PWA para el MVP), la configuración del Service Worker con Workbox, el esquema de IndexedDB con Dexie para almacenamiento offline, el `SyncManager` con la lógica completa de cola y sincronización, el hook `useAudioRecorder` para grabar bitácoras de voz, el manejo de permisos de micrófono por plataforma, el diseño de la vista `/campo` optimizada para usar en el pozo, y los 5 escenarios extremos de operación offline con su solución.

**Cuándo leerlo:**
- Al programar cualquier componente de la vista `/campo`.
- Cuando hay un bug de sincronización o datos perdidos en campo.
- Cuando hay que decidir si una feature funciona offline o no.
- Cuando se detectan problemas en iOS vs. Android.
- Si en el futuro se decide migrar de PWA a Capacitor/React Native.

**No contiene:** los endpoints del servidor que reciben la sincronización (eso está en el Doc 5, endpoint `POST /sync`).

---

## Doc 7 — Exportación de Reportes (PDF/Excel)

**Archivo:** `7_oilboards-doc7-exportacion-reportes.md`

**Qué es:** La definición de los 3 tipos de reporte exportable del MVP: Reporte Diario de Operaciones, Resumen de NPT y Reporte de Cumplimiento CNE/SENER. Para cada uno define: sección por sección qué contiene, el formato exacto de cada campo, y cómo se ve. En la parte técnica: las librerías (DomPDF + PhpSpreadsheet), el `ExportController`, el Job `GenerateExport`, la vista Blade completa del PDF (con CSS incluido), la tabla `exports` de la base de datos, y la nomenclatura de archivos generados.

**Cuándo leerlo:**
- Al implementar el módulo de exportación.
- Cuando un cliente dice que el reporte no tiene el formato correcto.
- Cuando hay que agregar un nuevo tipo de reporte.
- Cuando se valida el formato con CNE/SENER (y hay que ajustar campos).

**No contiene:** el endpoint HTTP que dispara la exportación (eso está en el Doc 5) ni la tabla de base de datos del modelo de datos general (ese está en el Doc 3 — la tabla `exports` aquí es la migración específica).

---

## Doc 8 — Seguridad y Autenticación en Código

**Archivo:** `8_oilboards-doc8-seguridad-auth.md`

**Qué es:** La implementación de seguridad que va antes que todo lo demás. Define el Global Scope de tenant (`OrganizationScope` + trait `BelongsToOrganization`) que garantiza que ningún cliente vea datos de otro, el seeder completo de roles y permisos con Spatie, el `AuthController` con expiración de tokens, el middleware de roles en las rutas, las Policies de Eloquent por recurso (qué puede hacer cada rol con cada entidad), los Form Requests de validación, los API Resources que nunca exponen datos internos, los headers de seguridad de Nginx, el rate limiting por endpoint, y el `AuditObserver` con hash encadenado para la bitácora inmutable.

**Cuándo leerlo:**
- **Primero que cualquier otro doc técnico** al arrancar el desarrollo.
- Cuando hay que agregar un nuevo modelo — aplicarle el trait.
- Cuando hay que crear un nuevo endpoint — definir qué rol lo protege.
- Cuando hay un reporte de seguridad o bug de acceso entre tenants.
- Al hacer una auditoría de seguridad antes de un cliente nuevo.

**No contiene:** la configuración de SSL ni el firewall del servidor (eso está en el Doc 9). Este doc es la seguridad a nivel de aplicación.

---

## Doc 9 — Despliegue a Producción

**Archivo:** `9_oilboards-doc9-despliegue-produccion.md`

**Qué es:** La guía completa para pasar de desarrollo a producción. Define la infraestructura recomendada por fase (DigitalOcean Managed DB + Redis + Spaces, ~$59/mes para el MVP), el setup paso a paso del droplet de producción (diferente al de desarrollo), la configuración completa de Nginx con proxy para WebSockets, Certbot/SSL, las variables de entorno de producción, Supervisor para mantener Reverb y Queue Workers corriendo siempre, el crontab del scheduler, el CI/CD con GitHub Actions para deploy automático en cada push a `main`, la estrategia de backups, el monitoreo de uptime y el checklist completo de go-live antes del primer cliente.

**Cuándo leerlo:**
- Cuando se va a hacer el primer deploy a producción.
- Cuando se agrega un nuevo proceso en background (agregar a Supervisor).
- Cuando hay que escalar la infraestructura (agregar un cliente nuevo).
- Cuando el servidor se cae y hay que recuperarlo.
- Cuando hay que configurar CI/CD en un repo nuevo.

**No contiene:** el setup del droplet de **desarrollo** (eso está en el Doc 1). Este doc es exclusivamente para el servidor de producción con datos reales.

---

## Guía rápida: "¿Dónde está X?"

| Pregunta | Documento |
|---|---|
| ¿Qué es Oilboards y a quién le vendemos? | Doc 0 — Biblia |
| ¿Por qué usamos Laravel y no Django? | Doc 1 — Fundación técnica |
| ¿Qué librerías de gráficas usamos? | Doc 1 — Fundación técnica (§3) |
| ¿Cómo dejo listo mi entorno de desarrollo? | Doc 1 — Fundación técnica (§5) |
| ¿Qué pantallas tiene el Módulo 1? | Doc 2 — Módulos y pantallas |
| ¿Qué rol puede ver la pantalla de KPIs? | Doc 2 — Módulos y pantallas (§6) |
| ¿Cuáles son las tablas de la base de datos? | Doc 3 — Modelo de datos |
| ¿Cómo se calcula el volumen neto? | Doc 3 — Modelo de datos (§4) |
| ¿En qué orden creo las migraciones? | Doc 3 — Modelo de datos (§10) |
| ¿Qué le mando a Claude para estructurar un audio? | Doc 4 — Prompts de IA |
| ¿Cuánto cuesta la API de Claude por mes? | Doc 4 — Prompts de IA (§costo total) |
| ¿Qué devuelve el endpoint de reportes diarios? | Doc 5 — Contratos de API |
| ¿Cómo funciona la sincronización offline? | Doc 5 (§11) + Doc 6 (§3) |
| ¿Qué eventos emite Reverb? | Doc 5 — Contratos de API (§12) |
| ¿PWA o app nativa? | Doc 6 — App móvil (§1) |
| ¿Cómo guardo un audio sin internet? | Doc 6 — App móvil (§3-4) |
| ¿Qué pasa si el operador no tiene red todo el turno? | Doc 6 — App móvil (§8) |
| ¿Qué contiene el PDF del reporte diario? | Doc 7 — Exportación (§2) |
| ¿Cómo se genera el Excel de cumplimiento CNE? | Doc 7 — Exportación (§4) |
| ¿Por qué va el Global Scope antes que los Controllers? | Doc 8 — Seguridad (§1) |
| ¿Qué permisos tiene el rol "ingeniero"? | Doc 8 — Seguridad (§2.2) |
| ¿Qué Policy protege los reportes diarios? | Doc 8 — Seguridad (§4) |
| ¿Cómo se hace el deploy a producción? | Doc 9 — Despliegue |
| ¿Cómo configuro Supervisor para Reverb? | Doc 9 — Despliegue (§3) |
| ¿Qué verifico antes de darle acceso al primer cliente? | Doc 9 — Despliegue (§8) |

---

## Estado de la documentación

| Doc | Título | Estado | Fase cubierta |
|---|---|---|---|
| 0 | Biblia / Fuente de Verdad | ✅ Completo | Producto completo |
| 1 | Fundación Técnica | ✅ Completo | MVP |
| 2 | Módulos y Pantallas | ✅ Completo | MVP + Escalamiento + Salas |
| 3 | Modelo de Datos | ✅ Completo | MVP + Escalamiento + Salas |
| 4 | Prompts de IA | ✅ Completo | MVP + Escalamiento |
| 5 | Contratos de API | ✅ Completo | MVP |
| 6 | App Móvil Offline | ✅ Completo | MVP |
| 7 | Exportación de Reportes | ✅ Completo | MVP |
| 8 | Seguridad y Auth | ✅ Completo | MVP |
| 9 | Despliegue a Producción | ✅ Completo | MVP → Escalamiento |

---

## Próximas actualizaciones pendientes

Cosas que se agregarán a la documentación conforme avance el desarrollo:

- `⚠️` **Formato regulatorio exacto** (CNE/SENER) para el Doc 7 — pendiente de confirmar con el regulador.
- `⚠️` **Decisión de dispositivos móviles** (Android vs iOS) para el Doc 6 — pendiente de confirmar con los activos target.
- `⚠️` **Specs del módulo SCADA** (Doc 2 y Doc 3 ya lo contemplan en Escalamiento, pero falta el doc de integración OPC-UA/MQTT).
- `⚠️` **Spec del microservicio ML** (Python + XGBoost) para la fase de predicción.
- `⚠️` **Contratos legales** (Términos y Condiciones, Aviso de Privacidad, Contrato de servicios) adaptados a Oilboards.

---

*Este índice se actualiza cada vez que se agrega o modifica un documento.*
