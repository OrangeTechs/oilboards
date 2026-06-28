# Doc 12 — Telemetría: Gap Analysis (Demo vs. Realidad de Campo)

> Fuente: revisión técnica de variables operativas reales en pozos mexicanos (jun 27 2026).
> Documento de referencia: briefing de variables de cabezal, levantamiento, tanques y separadores.
> Complementa: `docs/02_modulos-dashboard.md` y `docs/03_modelo-de-datos.md`.

---

## 1. Lo que SÍ tenemos en el demo hoy

### Monitor SCADA (`MonitorScada.tsx`)
| Variable | Unidad | Cómo se muestra | Actualización |
|---|---|---|---|
| THP (Tubing Head Pressure) | psi | Gráfica de línea 24h + zona alerta | Live, cada 5s |
| FLP (Flowing Line Pressure) | psi | Gráfica de línea 24h (línea azul punteada) | Live, cada 5s |
| Frecuencia variador (BEC) | Hz | Gauge de aguja ECharts | Live, cada 5s |
| Corriente del motor (BEC) | A | Gauge de aguja ECharts | Live, cada 5s |
| Vibración del motor (BEC) | mm/s | Gauge de aguja ECharts | Live, cada 5s |
| Panel de alerta IA (Gas-Lock) | — | Panel lateral con diagnóstico + recomendación | Estático hardcoded |

**Limitaciones actuales:**
- Pantalla fija a POZO-102H (sin selector de pozo)
- Solo cubre BEC — no hay vista para balancín ni Gas Lift

### Diagnóstico de Motores (`DiagnosticoMotores.tsx`)
| Variable | Unidad | Cómo se muestra | Actualización |
|---|---|---|---|
| Frecuencia variador | Hz | Gauge de aguja | Live, cada 4s |
| Corriente del motor | A | Gauge de aguja | Live, cada 4s |
| Vibración | mm/s | Gauge de aguja | Live, cada 4s |
| Histórico corriente 24h | A | Gráfica de área | Estático mockeado |
| Ficha del equipo | — | Tabla: fabricante, modelo, RPM, profundidad | Estático |

**Limitaciones:**
- Solo filtra pozos BEC (POZO-101H, 102H, 105H)
- No existe equivalente para balancines ni Gas Lift

### Matriz de Pozos (`MatrizPozos.tsx`)
| Variable | Unidad | Cómo se muestra |
|---|---|---|
| Status del pozo | activo/alerta/parado/intervención | Badge con semáforo de color + pulso en alerta |
| Producción neta | bbl/d | Valor numérico en card |
| THP | psi | Valor numérico en card |
| BSW | % | Valor numérico en card |
| Mini-sparkline THP 6h | psi | Gráfica de línea pequeña (ECharts) |

### Reporte Diario (`ReporteDiario.tsx`)
- BSW%, aceite neto bbl/d, gas asociado, GOR, horas en producción, causa de paro, eventos HSE
- Captura manual por el operador (simulada)
- No incluye variables de tanque ni de cabezal SCADA

### Dosificación Química (`DosificacionQuimica.tsx`)
- Inyección de inhibidor de parafinas, corrosión, escala (L/d)
- Estático

---

## 2. Lo que FALTA (Gap completo)

### 2.1 Variables de Cabezal — faltan

| Variable | Nombre técnico | Unidad | Por qué es crítica | Prioridad |
|---|---|---|---|---|
| Presión de Revestimiento | PC / Casing Pressure | kg/cm² o psi | Si PT baja y PC sube → tubería rota. Diagnóstico más básico de integridad del pozo | 🔴 Alta |
| Diferencial PT − PC | ΔP | psi | Variable derivada que el ingeniero calcula primero manualmente. Debe ser automática | 🔴 Alta |
| Temperatura de línea | TT / Line Temperature | °C | Vital en crudos pesados/parafinicos: si baja, el crudo se tapa en tubería | 🟡 Media |

### 2.2 Variables de Balancín (Pump Jack / BM) — faltan completamente

> ⚠️ **El balancín es el método de levantamiento más común en México.** Nuestro demo tiene POZO-104 y POZO-108 como BM pero sin ninguna pantalla de telemetría propia.

| Variable | Nombre técnico | Unidad | Por qué es crítica | Prioridad |
|---|---|---|---|---|
| Carreras por minuto | SPM (Strokes Per Minute) | cpm | Si baja → problema mecánico o eléctrico. El ritmo cardíaco del balancín | 🔴 Alta |
| Amperaje del motor | Current | A | Si se dispara → bomba de fondo trabada (areneada o pegada) | 🔴 Alta |
| Estado del motor | On/Off | Booleano | ¿Está girando o parado? Downtime explícito | 🔴 Alta |
| Eficiencia de bombeo | — | bbl/carrera | Variable derivada: volumen producido / carreras totales del día. El KPI que el gerente pide al ingeniero | 🟡 Media |
| Carta dinamométrica | — | Curva carga vs. posición | Diagnóstico avanzado de la bomba de fondo. Nivel 2-3 | 🟢 Baja (Fase 2) |

### 2.3 Variables de Tanques — faltan completamente

> ⚠️ **Esta es la zona dorada para la PWA (Fase 1).** Casi ningún campo menor en México tiene SCADA en tanques, pero es donde el dinero se mide físicamente.

| Variable | Nombre técnico | Unidad | Por qué es crítica | Prioridad |
|---|---|---|---|---|
| Nivel de crudo | LLE (Level) | cm o metros | Aquí se mide el inventario físico. La diferencia ayer−hoy = producción del día | 🔴 Alta |
| Nivel de interfase agua/crudo | LLI (Interface Level) | cm o metros | Necesario para calcular el volumen neto vendible vs. agua de formación | 🔴 Alta |
| %AyS (Agua y Sedimento) | BSW de campo | % | Se toma con vaso graduado. Diferente al BSW del reporte — es la medición física de calidad | 🟡 Media |
| Temperatura del tanque | — | °C | Para corrección de volumen a 15°C estándar antes de la venta. Obligatorio para facturación | 🟡 Media |

### 2.4 Variables Derivadas — no se calculan automáticamente

| Variable | Fórmula | Por qué es crítica |
|---|---|---|
| Volumen neto diario (desde tanque) | (Nivel ayer − Nivel hoy) × Factor tanque − Agua | Reemplaza al contador físico. El corazón del SaaS Fase 1 |
| Declinación de producción | % caída vs. mes anterior | Planificación de reparaciones |
| Eficiencia de bombeo | Volumen producido / Carreras totales del día | KPI de integridad del balancín |
| Diferencial PT − PC | PT − PC | Diagnóstico de integridad de tubería |
| Corrección de volumen a 15°C | Vol × factor(temp) según tabla ASTM | Obligatorio para venta y balance Pemex |

### 2.5 Variables de Separador — no están

| Variable | Unidad | Prioridad |
|---|---|---|
| Presión del separador | psi | 🟡 Media |
| Flujómetro de gas | m³/día | 🟡 Media |
| Flujómetro de líquido | bbl/día | 🟡 Media |

> Nota: en pozos sin flujómetro (la mayoría de Nivel 1), el volumen diario se calcula por diferencia de nivel de tanque — no por flujómetro.

### 2.6 Pantallas de demo que no existen

| Pantalla | Módulo | Qué mostraría | Prioridad |
|---|---|---|---|
| Monitor de Tanques | Módulo 01 / Campo | Visualización del tanque con nivel crudo + interfase agua + temperatura + cálculo automático de volumen neto | 🔴 Alta |
| Telemetría de Balancín | Módulo 02 / Telemetría | Gauge SPM, amperaje, estado On/Off, eficiencia de bombeo. Para POZO-104 y POZO-108 | 🔴 Alta |
| Gas Lift Monitor | Módulo 02 / Telemetría | Presión de inyección de gas, caudal de gas inyectado, THP vs. gas inyectado. Para POZO-103 y POZO-107H | 🟡 Media |

---

## 3. Modelo de datos de referencia (tabla `variables`)

Según el documento técnico, la tabla `Variable` del backend debería incluir:

| nombre_logico | tipo_equipo | unidad | tipo_dato | objetivo_principal |
|---|---|---|---|---|
| `PT_CABEZA` | Pozo | kg/cm² | Continuous | Detectar paro de bombeo / taponamiento |
| `PC_CABEZA` | Pozo | kg/cm² | Continuous | Detectar fuga de tubería |
| `TEMP_LINEA` | Pozo | °C | Continuous | Control de parafinas |
| `ESTADO_MOTOR` | Balancín | On/Off | Discrete | Downtime del pozo |
| `SPM_BALANCIN` | Balancín | cpm | Continuous | Eficiencia mecánica |
| `AMP_MOTOR` | Balancín | A | Continuous | Detección de bomba trabada |
| `NIVEL_CRUDO` | Tanque | cm | Continuous | Medición de inventario (volumen) |
| `INTERFASE_AGUA` | Tanque | cm | Continuous | Calidad del crudo vendido |
| `TEMP_TANQUE` | Tanque | °C | Continuous | Corrección de volumen a 15°C |
| `PORC_AYS` | Tanque | % | Discrete | Reporte de venta |
| `PRES_SEPARADOR` | Separador | psi | Continuous | Operación de separación gas/líquido |

---

## 4. Estrategia de producto (Tiering según documento)

### Nivel 1 — "Pan de Cada Día" (construir primero)
- PWA de tanques (nivel crudo, interfase agua, %AyS, temperatura)
- Presiones de cabezal básicas (PT, PC) en pozos de balancín
- SCADA de baja frecuencia (1 lectura cada 15-60 min)
- Cálculo de volumen neto por diferencia de tanque
- **Precio objetivo: $50–100 USD/pozo/mes · Costo infra: ~$2 USD/pozo/mes**

### Nivel 2 — "Premium" (Edge Computing)
- BEC/BES y Gas Lift
- Edge Gateway (caja física en campo) que procesa datos a 1 seg localmente
- Solo envía resúmenes y alertas a la nube (cada 5-15 min)
- Algoritmo de detección de gas-lock, quemado de bomba, etc.
- **Precio objetivo: $300–500 USD/pozo/mes**

### Nivel 3 — "Enterprise"
- Plataformas marinas
- Formas de onda completas (análisis de vibración)
- Integración con DCS
- Setup Fee + contrato anual 5-6 cifras
- **Precio: negociado case by case**

> 🚨 **Error estratégico actual en el demo:** el demo muestra principalmente BEC (Nivel 2), que es el mercado nicho. El mercado masivo y de mayor margen es Nivel 1 (balancines + tanques). Corregir esto en la siguiente iteración del demo.

---

## 5. Prioridad de construcción para el demo

1. 🔴 **Agregar PC (Casing Pressure) y diferencial PT−PC al Monitor SCADA** — 30 min
2. 🔴 **Nueva pantalla: Monitor de Tanques** — visualización con nivel + interfase + volumen neto automático
3. 🔴 **Nueva pantalla: Telemetría de Balancín** — SPM, amperaje, On/Off, eficiencia de bombeo
4. 🟡 **Selector de pozo en Monitor SCADA** — actualmente fijo a POZO-102H
5. 🟡 **Temperatura de línea** como gauge en cabezal
6. 🟡 **Nueva pantalla: Gas Lift Monitor** — para POZO-103 y 107H
7. 🟢 **Carta dinamométrica** — Fase 2, no urgente para demo comercial

---

*Última actualización: jun 27 2026 · Fuente: briefing técnico de variables operativas de campo mexicano.*
