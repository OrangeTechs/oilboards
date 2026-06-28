# 🛢️ OILBOARDS — Módulos Extra (Fase 2)

**Spec de los Módulos 04, 05 y 06 · solicitados por el mercado (perfil Grupo Carso / operadores grandes)**
Para construir como pantallas nuevas de la demo (datos mockeados) y, después, como producto.

| Campo | Valor |
|---|---|
| Estado | 📋 Especificado · pendiente de construir |
| Objetivo | Convertir Oilboards de "monitoreo de pozos" a **plataforma operativa integral**: upstream + midstream + mantenimiento + ESG |
| Patrón de construcción | Igual a las pantallas existentes: componente en `resources/js/Pages/Demo/`, datos en `demoData.ts`, tema `lib/chart.ts`, registrar en `Sidebar.tsx` + `Index.tsx`. IA simulada. |

> ⚠️ **Regla de copy:** el regulador es **CNE / SENER**; la seguridad/ambiente la supervisa **ASEA**. La CNH desapareció en 2025 — NO usarla. (La solicitud original mencionaba "CNH"; corregir en todos los textos.)

---

## Módulo 04 — Gestión de Integridad de Ductos y Transporte (Midstream)

**Por qué lo van a pedir:** Grupo Carso es gigante en gasoductos (p. ej. Waha–Presidio que suministra a CFE). Saca a Oilboards del upstream y abre el mercado **midstream**.

**Qué debe hacer:**
- Sección dentro de la Sala de Monitoreo / pantalla propia que use IA para detectar **caídas de presión drásticas** en los tubos.
- Predecir **fugas de gas** y alertar en tiempo real de **robo de combustible (huachicol)** en tramos terrestres — *este es el gancho de venta más fuerte*.

**Pantalla(s) demo propuestas:**
- **Mapa del ducto** (MapLibre) con la traza de la línea dividida en **tramos/segmentos**; cada tramo con color por estado (normal / caída de presión / alerta huachicol).
- **Perfil de presión a lo largo del ducto** (ECharts línea): presión por kilómetro; una caída anómala localizada entre dos estaciones marca el punto sospechoso.
- **Panel de alerta IA**: "Caída de 18% entre KP-42 y KP-57 inconsistente con consumo programado → posible toma clandestina / fuga. Urgencia: inmediata." (estilo Doc 4).
- KPIs: volumen transportado, presión de entrada/salida, balance entrada vs entrega (delta = pérdida/robo).

**Datos a agregar en `demoData.ts`:** `DEMO_PIPELINE` (segmentos con coords, presión, estado), serie de presión por KP, alertas de integridad.

**Modelo (producto):** `pipelines`, `pipeline_segments`, `pressure_readings` (hypertable), `integrity_alerts`. Reusa el motor de alertas existente.

---

## Módulo 05 — Mantenimiento Predictivo de Activos Físicos (EAM)

**Por qué lo van a pedir:** plataformas marinas y torres usan miles de válvulas, compresores y generadores que necesitan refacciones. Es lo que **cierra el ciclo** predicción → acción y prueba el ROI.

**Qué debe hacer:**
- Conectar las **alertas de la IA con el inventario del almacén**.
- Si la IA predice que la BEC del POZO-101H fallará en ~5 días: el sistema revisa si la **refacción está en la bodega (Cd. del Carmen)** y **genera la orden de trabajo** para los ingenieros automáticamente.

**Pantalla(s) demo propuestas:**
- **Tablero EAM** con flujo visible: `Predicción IA → Refacción en inventario → Orden de trabajo`.
- Tarjeta de predicción: equipo, pozo, falla estimada, días restantes, confianza.
- **Estado de inventario** de la refacción (en bodega Cd. del Carmen: disponible / por pedir, cantidad, ubicación).
- **Orden de trabajo autogenerada** (folio, equipo, técnico asignado, prioridad, estado: abierta/en proceso).
- Tabla de salud de activos (válvulas, compresores, generadores, BEC/BM) con días-a-falla estimados.

**Datos a agregar:** `DEMO_ASSETS_HEALTH`, `DEMO_INVENTORY` (refacciones, bodega, stock), `DEMO_WORK_ORDERS`.

**Modelo (producto):** `physical_assets`, `spare_parts`, `warehouses`, `inventory`, `work_orders`. Observer: alerta IA crítica → busca refacción → crea work_order.

---

## Módulo 06 — Monitoreo de Emisiones y Huella de Carbono (ESG)

**Por qué lo van a pedir:** socios internacionales (Zama/Talos, inversionistas de Carso) y el marco **CNE/SENER + ASEA** exigen reglas estrictas para reducir venteo/quema. Quien no mida CO₂/metano recibirá multas.

**Qué debe hacer:**
- Dashboard ejecutivo que calcule en tiempo real el **% de aprovechamiento de gas**.
- Traduzca los **paros de pozo en toneladas de CO₂** emitidas (venteo/quema), listo para auditoría internacional.

**Pantalla(s) demo propuestas:**
- KPIs grandes: **% aprovechamiento de gas**, **gas quemado/venteado (MMpcd)**, **toneladas CO₂e hoy/mes**, **intensidad de emisiones (kg CO₂e/bbl)**, **metano (ton)**.
- Gráfica de tendencia de aprovechamiento vs meta (ECharts).
- **Conversión paro → CO₂**: tabla que toma los `downtime_events` y estima CO₂e por venteo durante el paro.
- Panel "listo para auditoría" con marco CNE/SENER + ASEA y exportación.

**Datos a agregar:** `DEMO_ESG` (aprovechamiento, gas quemado, CO₂e, metano, intensidad), serie mensual, conversión por paro.

**Modelo (producto):** `emissions_readings`, `flaring_events`, factores de conversión configurables. Deriva de `daily_reports` + `downtime_events` existentes.

---

## Integración con lo ya construido

- **Sidebar:** agregar un grupo nuevo (p. ej. "Midstream e Integridad") o sumar a los existentes; iconos lucide (`GitBranch`/`Waves` para ductos, `Wrench` para EAM, `Leaf` para ESG).
- **Sala de Monitoreo:** los 3 aportan widgets nuevos para el video-wall (perfil de presión del ducto, salud de activos, CO₂e en vivo).
- **Comparativa (landing):** se pueden sumar filas ("Midstream + huachicol", "EAM con inventario", "ESG/CO₂ nativo") como ventajas vs competencia.
- **Reusan** el motor de alertas IA, el tema visual y el patrón de pantallas — no requieren arquitectura nueva para la demo.

---

*Prioridad sugerida para construir: 04 Midstream (abre puertas) → 05 EAM (prueba ROI) → 06 ESG (ola regulatoria).*
