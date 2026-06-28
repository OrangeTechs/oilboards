# 🛢️ OILBOARDS — Mapa Detallado del Dashboard

**Especificación de módulos, pantallas y navegación · Para diseño y desarrollo**
Complemento de *La Biblia · Fuente de Verdad* y de *Fase 0 · Fundación Técnica*.

| Campo | Valor |
|---|---|
| Versión | v0.1 |
| Propósito | Detallar cada pantalla del dashboard, qué muestra, qué datos consume, quién la ve y en qué fase se construye |
| Última edición | (poner fecha) |

> **Cómo leer este documento.** Los **3 módulos** son las grandes áreas del producto. Dentro de cada módulo hay varias **pantallas**. Para cada pantalla defino: qué hace, componentes visuales (con la librería de gráficas recomendada), datos que consume, rol que la ve y la **fase** (`MVP` / `Escalamiento` / `Salas`). Lo marcado `⭐ Recomendación` es complemento mío, no estaba en el brain-dump original.

---

## 0. Estructura general de navegación

```
┌─────────────────────────────────────────────────────────────┐
│  BARRA SUPERIOR (global)                                    │
│  [Selector Activo ▾]   [🔔 Alertas IA]  [ES/EN] [👤 Perfil] │
├──────────────┬──────────────────────────────────────────────┤
│              │                                              │
│  SIDEBAR     │           ÁREA DE CONTENIDO                  │
│              │                                              │
│  📋 Módulo 1 │   (la pantalla seleccionada se pinta aquí)   │
│  📡 Módulo 2 │                                              │
│  📈 Módulo 3 │                                              │
│  ─────────   │                                              │
│  🖥️ Salas    │                                              │
│  ⚙️ Config   │                                              │
└──────────────┴──────────────────────────────────────────────┘
```

El dashboard **se adapta al rol**: el sidebar solo muestra los módulos a los que el usuario tiene acceso (ver §6, RBAC).

---

## 1. Barra superior (global, siempre visible)

| Elemento | Función | Detalle técnico | Fase |
|---|---|---|---|
| **Selector de Activo/Campo** | Cambiar de bloque petrolero | Dropdown; filtra TODO el dashboard al activo elegido. Clave para multi-tenancy y multi-campo | MVP |
| **Centro de Notificaciones de IA** | Campana que parpadea 🟡/🔴 ante anomalía o alerta predictiva | Push en tiempo real vía Reverb; badge con contador; al abrir, lista de alertas activas con link al pozo | MVP (alertas básicas) → Escalamiento (predictivas) |
| **Idioma (ES/EN)** | Toggle rápido | Útil para operadores que reportan a casa matriz extranjera | MVP |
| **Perfil de Usuario** | Cuenta, rol, permisos, cerrar sesión | RBAC (Spatie) | MVP |
| ⭐ **Buscador global** | Saltar a un pozo por nombre/ID | Mejora enorme de UX cuando hay 40 pozos. Atajo de teclado (`/`) | MVP |
| ⭐ **Indicador de conexión / "último dato"** | Muestra si el WebSocket está vivo y hace cuánto llegó el último dato | En industria petrolera, saber si los datos están "frescos" o congelados es crítico para confiar en la pantalla | Escalamiento |

---

## 2. 📋 Módulo 01 — Captura y Campo

**Foco:** el factor humano. Bitácoras, eventos del turno, captura diaria. **Es el núcleo del MVP.**

### 2.1 Dashboard de Campo *(pantalla de entrada del módulo)*
- **Qué muestra:** resumen del día — cuántos pozos ya reportaron vs. pendientes, horas de captura, estatus de cuadrillas, últimos eventos.
- **Componentes:** tarjetas de resumen (Recharts/Tremor) + un **feed cronológico tipo timeline** ("08:15 Pozo 12 normal", "10:30 Pozo 3 cerrado por falla eléctrica").
- **Datos:** reportes del día, eventos, asignación de operadores.
- **Rol:** Ingeniero, Admin (vista de supervisión).
- **Fase:** MVP.

### 2.2 Formulario de Reporte Diario *(la pantalla más importante del producto)*
- **Qué muestra:** captura rápida por pozo, optimizada para celular/tablet, **funciona offline**.
- **Campos:** aceite bruto (bbl/d), gas asociado (MMpcd), agua (bbl/d), **BSW (%)**, GOR, horas en producción, causa de paro (mecánica/clima/mantenimiento), consumo de diésel, eventos HSE.
- **Cálculo automático:** Volumen Neto = Bruto × (1 − BSW/100). Se muestra en vivo al capturar.
- **Componentes:** formulario limpio, validaciones en vivo, indicador de "guardado offline / sincronizado".
- **Datos:** escribe en la tabla de reportes diarios.
- **Rol:** Operador (solo su pozo), Ingeniero, Admin.
- **Fase:** MVP. ⭐ **Es lo primero que se construye.**

### 2.3 Consola de Audio / NLP *(tu diferenciador temprano)*
- **Qué muestra:** el operador graba un audio del turno → se transcribe (Whisper/Deepgram) → Claude lo estructura en JSON limpio → se muestra el reproductor + el texto tabulado listo para guardar.
- **Componentes:** reproductor de audio, texto estructurado editable (el humano valida antes de guardar).
- **Datos:** audio → transcripción → JSON → reporte/evento.
- **Rol:** Operador, Ingeniero.
- **Fase:** MVP. ⭐ Vende solo: "dictas el turno, el sistema arma el reporte".

### 2.4 Bitácora de Paros y NPT
- **Qué muestra:** registro y categorización de cada minuto de pozo parado, con causa raíz.
- **Componentes:** tabla filtrable + **gráfica de NPT por causa** (ECharts, barras/pie).
- **Datos:** eventos de paro con timestamps, categoría, duración.
- **Rol:** Ingeniero, Admin.
- **Fase:** MVP.
- ⭐ **Recomendación clave:** esta bitácora debe ser **append-only / inmutable** (respaldo histórico para disputas de pago con Pemex). Es exactamente el "respaldo de datos inmutable" que vendes — aquí es donde se implementa de verdad.

### 2.5 Inventario Operativo (HSE y Energía)
- **Qué muestra:** consumo diario de diésel de generadores + reportes rápidos de incidentes de seguridad/ambiente.
- **Componentes:** formularios rápidos + tendencias (Recharts).
- **Datos:** consumo de combustible, incidentes HSE.
- **Rol:** Operador (captura), Ingeniero, Admin.
- **Fase:** MVP.

---

## 3. 📡 Módulo 02 — Ingeniería y Telemetría

**Foco:** variables físicas y mecánicas de alta frecuencia. **Requiere integración SCADA → fase de escalamiento.**

### 3.1 Matriz de Estatus de Pozos *(pantalla estrella de la sala)*
- **Qué muestra:** cuadrícula interactiva donde cada pozo es un cuadro con color de status.
- **Semáforo:** 🟢 produciendo · 🔴 parado/NPT · 🟡 alerta predictiva · 🔵 intervención.
- **Componentes:** grid de tarjetas; click → detalle del pozo. Actualización en tiempo real (Reverb).
- **Datos:** status en vivo de cada pozo.
- **Rol:** Ingeniero, Admin.
- **Fase:** Escalamiento (status básico puede existir en MVP con datos de captura manual).

### 3.2 Monitor SCADA en Vivo
- **Qué muestra:** gráficos de alta frecuencia de presiones y temperatura en tiempo real.
- **Componentes:** **ECharts** — curvas continuas de **THP vs. FLP cruzadas** (detectar obstrucciones), temperatura de cabezal. Zoom interactivo, ventana de 24 h.
- **Datos:** telemetría SCADA (TimescaleDB).
- **Rol:** Ingeniero, Admin.
- **Fase:** Escalamiento.

### 3.3 Diagnóstico de Motores (BEC/BM)
- **Qué muestra:** variables eléctricas de los motores de fondo, para cuidar la integridad del equipo.
- **Componentes:** **gauges tipo aguja (ECharts)** de Hz, RPM y amperaje + histórico.
- **Datos:** telemetría de motor (SCADA).
- **Rol:** Ingeniero, Admin.
- **Fase:** Escalamiento.
- ⚠️ **Recordatorio:** validar unidades con ingeniero real (el variador se ajusta en **Hz**; las RPM son resultado). No repetir el error Hz/RPM del brain-dump.

### 3.4 Dosificación Química
- **Qué muestra:** consumo y control de inyección de químicos (demulsificantes, inhibidores de corrosión).
- **Componentes:** gráficas de consumo (Recharts/ECharts).
- **Datos:** registros de inyección diaria.
- **Rol:** Ingeniero, Admin.
- **Fase:** Escalamiento (puede capturarse manual en MVP).

---

## 4. 📈 Módulo 03 — Dirección y Estrategia

**Foco:** visión macro del negocio, cumplimiento regulatorio, dirección. **MVP parcial** (lo que NO necesita SCADA sí entra al MVP).

### 4.1 KPIs Ejecutivos Consolidados *(pantalla de entrada de dirección)*
- **Qué muestra:** vista macro del activo — producción total neta (Mbd), costo estimado por barril (OPEX/producción), % uptime global.
- **Componentes:** tarjetas de KPI grandes (**Tremor/Recharts**) con deltas y tendencias; animación de números (Framer Motion).
- **Datos:** agregados de los reportes diarios (Módulo 1).
- **Rol:** Admin/Director, Ingeniero.
- **Fase:** MVP. ⭐ Da el "wow" ejecutivo **sin necesitar SCADA**.

### 4.2 Monitoreo Regulatorio (CNE / SENER)
- **Qué muestra:** producción real vs. plan comprometido ante el regulador.
- **Componentes:** **gráfica de barras de cumplimiento (ECharts)** — meta vs. real del período.
- **Datos:** producción real + metas del plan.
- **Rol:** Admin/Director, Ingeniero.
- **Fase:** MVP.
- ⚠️ **Actualizado:** la **CNH ya no existe** (reforma 2025). Es **CNE (Comisión Nacional de Energía) / SENER**. Confirmar el formato de reporte vigente bajo el nuevo Reglamento de la Ley del Sector Hidrocarburos (oct-2025).

### 4.3 Balance de Fiscalización y Venta
- **Qué muestra:** conciliación de volumen producido vs. volumen fiscalizado y entregado a Pemex.
- **Componentes:** tabla comparativa + gráfica de diferencias.
- **Datos:** producción + entregas fiscalizadas.
- **Rol:** Admin/Director.
- **Fase:** MVP (con datos de captura manual).

### 4.4 Análisis de Yacimientos
- **Qué muestra:** curva de declinación histórica + tendencia.
- **Componentes:** **ECharts** — la curva de declinación es el caso de uso perfecto (series largas, zoom, escalas).
- **Datos:** histórico de producción por pozo.
- **Rol:** Ingeniero, Admin/Director.
- **Fase:** MVP (curva histórica) → Escalamiento (tendencia predictiva con ML).

### 4.5 Consola del Asistente Virtual (Claude)
- **Qué muestra:** chat donde el ingeniero senior pregunta a la IA sobre manuales del pozo, fallas recurrentes, planes de contingencia (RAG sobre los manuales cargados).
- **Componentes:** interfaz de chat; respuestas con citas a los manuales fuente.
- **Datos:** manuales del activo (RAG) + histórico.
- **Rol:** Ingeniero, Admin.
- **Fase:** MVP ligero (chat sobre manuales) → Escalamiento (cruce con telemetría).
- ⚠️ Toda recomendación operativa lleva disclaimer: *"sugerencia generada por IA, validar con personal calificado"* (ver marco de responsabilidad en la biblia).

---

## 5. 🖥️ Salas de Monitoreo Virtuales

**Foco:** el centro de control estilo NASA. **Fase de salas.**

### 5.1 Configurador de Salas *(menú maestro)*
| Sub-pantalla | Función |
|---|---|
| **Gestor de Pantallas** | Vincular monitores físicos generando un código numérico |
| **Lanzador de URLs Modulares** | Copiar el enlace "kiosko" limpio (sin menús ni barras) de cada módulo para pegarlo en cada TV |
| **Biblioteca de Layouts** | Guardar/cargar perfiles: "Turno Matutino", "Junta Ejecutiva", "Alerta de Emergencia" |
| **Editor de Widgets (Drag & Drop)** | Lienzo para arrastrar y redimensionar gráficas por pantalla (react-grid-layout) |

### 5.2 Vistas "kiosko" (lo que se ve en cada monitor)
- **Monitor 1 → Módulo 1** (timeline de campo, volumen neto, bitácora transcrita).
- **Monitor 2 → Módulo 2** (matriz de pozos, presiones cruzadas, gauges de motor).
- **Monitor 3 → Módulo 3** (cumplimiento CNE, declinación, consola de alertas IA).
- Cada una es una **ruta limpia** sincronizada por Reverb. Sin toolbars, pantalla completa.
- **Fase:** Salas.

---

## 6. Control de acceso por rol (RBAC)

El dashboard **cambia según quién entra**. Esto define qué construir primero y cómo diseñar cada pantalla.

| Rol | Módulo 1 | Módulo 2 | Módulo 3 | Salas/Config | Alcance |
|---|---|---|---|---|---|
| **Operador** | ✅ (captura) | — | — | — | **Solo su pozo asignado.** Sin vista global |
| **Ingeniero** | ✅ | ✅ (lectura) | ✅ (lectura) | Ver salas | Todo el activo, lectura técnica |
| **Admin / Director** | ✅ | ✅ | ✅ | ✅ Configurar | Total: alta de activos, widgets, exportar, salas |

> Implementación: **Spatie Laravel Permission**. Cada pantalla valida el permiso antes de renderizar; el sidebar oculta lo que el rol no puede ver.

---

## 7. ⭐ Pantallas que te recomiendo agregar (no estaban en el brain-dump)

Estas cierran huecos reales del producto:

1. **Onboarding / Alta de Activo y Pozos** — pantalla de configuración inicial: dar de alta el campo, los pozos, tipo de levantamiento, asignar operadores. Sin esto, no hay por dónde empezar a capturar. **Fase MVP.**
2. **Centro de Reportes / Exportación** — generar y exportar el Reporte Diario de Operaciones en el formato regulatorio vigente (PDF/Excel) con un clic. Es literalmente el dolor #1 que vendes. **Fase MVP.**
3. **Gestión de Usuarios y Roles** — el Admin da de alta operadores/ingenieros y asigna permisos. **Fase MVP.**
4. **Historial / Auditoría** — log inmutable de quién capturó/cambió qué y cuándo. Refuerza el "respaldo inmutable" para disputas con Pemex. **Fase Escalamiento.**
5. **Configuración de Alertas** — que el ingeniero defina umbrales (ej. "avísame si la presión cae >10%"). Permite alertas útiles **desde el MVP**, antes de que el ML predictivo exista. **Fase MVP.**
6. **Pantalla de "Estado de Sincronización"** — qué pozos/dispositivos sincronizaron, cuáles tienen datos pendientes offline. Da confianza en que no se perdió nada. **Fase MVP.**

> La #2 (exportación de reportes) y la #5 (alertas por umbral) son las que más te recomiendo no dejar para después: son las que convierten el MVP en algo que un cliente paga, sin depender de SCADA ni de IA predictiva.

---

## 8. Resumen: qué construir para el MVP

De todo el mapa, el **MVP vendible** son estas pantallas:

```
✅ Alta de Activo y Pozos (onboarding)
✅ Gestión de Usuarios y Roles
✅ Formulario de Reporte Diario  ← el corazón
✅ Consola de Audio/NLP (bitácora de voz → Claude)
✅ Dashboard de Campo (timeline)
✅ Bitácora de Paros y NPT (inmutable)
✅ KPIs Ejecutivos Consolidados
✅ Monitoreo Regulatorio CNE
✅ Centro de Reportes / Exportación  ← lo que paga el cliente
✅ Configuración de Alertas por umbral
```

Todo lo de **Módulo 2 (SCADA)**, **ML predictivo** y **Salas físicas** es fase posterior — está en el mapa para que el **modelo de datos los contemple desde ahora**, no para construirlos en la semana 1.

---

## 9. Próximo documento

El siguiente paso natural es el **modelo de datos completo**, ya estructurado para soportar exactamente este mapa de pantallas y los 3 roles: tablas (Organización, Activo, Pozo, Reporte, Evento, Alerta, Usuario, Telemetría…), campos, tipos, relaciones, multi-tenancy e índices. Con eso, tu programador arranca a teclear features en serio.

---

*Fin del mapa de módulos. Cada pantalla aquí listada se traduce luego en una ruta + un componente + (opcionalmente) un canal de tiempo real.*
