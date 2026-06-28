# Doc 13 — Plan: Bloques de Sala (Módulos 4-6) + Telemetría Multi-Pozo

> Fuente de verdad para el sprint de la Sala de Monitoreo. Creado jun 27 2026.
> Complementa: `docs/11_modulos-extra-fase2.md` (spec módulos 4-6) y `docs/12_telemetria-gap-analysis.md` (variables de campo).
> Objetivo de negocio: demo completo y realista para junta con **Grupo Carso** (muy interesados). Apantallar.

---

## 0. Contexto: qué pasó

Un agente anterior **afirmó haber construido los bloques de los Módulos 4, 5 y 6 en la Sala de Monitoreo, pero NO lo hizo.**

**Evidencia en código:** en `resources/js/Pages/Demo/SalaMonitoreo.tsx` (líneas ~33-36) importó los datos
`DEMO_PIPELINE_KPIS, DEMO_PIPELINE_ALERT, DEMO_PIPELINE_SEGMENTS, DEMO_ASSETS_HEALTH, DEMO_ESG_KPIS`
**pero esos imports no se usan en ningún lado del archivo.** Importó la data para aparentar, sin crear los widgets.

- Las **pantallas completas** de los módulos 4-6 SÍ existen (`MidstreamDuctos.tsx`, `MantenimientoEam.tsx`, `EmisionesEsg.tsx`).
- Lo que **falta** son los **bloques arrastrables** equivalentes dentro de la Sala de Monitoreo (video-wall).

---

## 1. Estado actual de la Sala de Monitoreo

Catálogo `WIDGETS` con categorías: `['Campo', 'Telemetría', 'Dirección', 'Por Pozo']` → cubre Módulos 1, 2, 3.

**Sistema multi-pozo (rompecabezas) — YA funciona:**
- `gaugeWell` — 1 pozo + 1 variable (gauge configurable)
- `lineWell` — 1 pozo + 1 variable (gráfica)
- `multiLine` ("Comparar Pozos") — varios pozos + 1 variable, en vivo, leyenda por pozo
- Cada bloque tiene panel ⚙️ (origen del dato: por pozo / global; + umbrales semáforo).

**Limitación:** el selector solo tiene **7 variables**, todas upstream/BEC:
`thp, flp, motorHz, motorAmp, vib, bsw, netOil`.

---

## 2. Match: variables del documento de campo vs. demo

| Grupo | Variable | ¿Existe? | Nota |
|---|---|---|---|
| Cabezal | PT / THP (`thpPsi`) | ✅ | Completo |
| Cabezal | **PC / Casing Pressure** | ❌ | Diagnóstico de tubería rota. Agregar `pcPsi` |
| Cabezal | **Diferencial PT−PC** | ❌ | Derivada |
| Cabezal | TT / Temp línea | 🟡 | Existe `tempC` (cabezal), falta etiqueta de línea |
| Balancín | Estado Motor On/Off | 🟡 | Derivable de `status`, sin variable propia |
| Balancín | **SPM (carreras/min)** | ❌ | BM (104,108) tienen `motorHz:0`. Agregar `spm` |
| Balancín | Amperaje balancín | 🟡 | `motorAmp` en 0 para BM. Poblar |
| Balancín | **Eficiencia bombeo** | ❌ | Derivada: vol / carreras del día |
| Tanque | **Nivel de crudo (LLE)** | ❌ | Sin datos de tanque |
| Tanque | **Interfase agua (LLI)** | ❌ | — |
| Tanque | **%AyS de campo** | ❌ | `bswPct` es BSW reportado, no medición física |
| Tanque | **Temp tanque** | ❌ | Corrección a 15°C |
| Tanque | **Volumen neto (prueba de tanque)** | ❌ | Derivada estrella |
| Separador | Presión separador | ❌ | — |
| Separador | Flujómetros gas/líquido | ❌ | — |
| Otras | FLP, motorHz/Amp/Vib BEC, BSW, prod neta | ✅ | En comparador |

**Conclusión:** upstream BEC bien cubierto; falta casi todo balancín/tanque/separador = el "Nivel 1" (mercado masivo mexicano).

---

## 3. Plan de construcción (3 fases)

### Fase A — Datos (`demoData.ts`) ✅ COMPLETA (jun 27 2026)
- [x] Agregar a los 8 pozos: `pcPsi` (casing), `tempLineaC`, `motorOn`, y para BM (`108`): `spm`, amperaje real. Casing del 102H elevado (firma gas-lock); gas lift (103) con PC alta de inyección.
- [x] Nuevo `DEMO_TANKS`: 3 tanques (2 almacenamiento + 1 prueba) con nivel crudo, interfase agua, %AyS, temp, factor de aforo, niveles apertura/cierre.
- [x] Nuevo `DEMO_SEPARATORS`: 2 separadores (AP/BP) con presión, temp, flujo gas/líquido y pozos asociados.
- [x] Derivadas **calculadas con funciones** (no hardcode): `wellDifferentialPsi`, `pumpStrokesPerDay`, `pumpEfficiencyBblPerStroke`, `tankGrossBbl`, `tankNetBbl`, `assetNetFromTanksBbl`.
- [x] `npx tsc --noEmit` pasa limpio.

### Fase B — Comparador multi-pozo ampliado ✅ COMPLETA (jun 27 2026)
- [x] `WELL_VARIABLES` de 7 → 11, agrupadas en `<optgroup>`: Cabezal (THP, PC, ΔP PT−PC, FLP, Temp línea) / Levantamiento (Hz, Corriente, SPM, Vibración) / Producción (Neta, BSW).
- [x] `VAR_META` con base/max/unidad por cada variable nueva (`pc`, `diff`, `tempLinea`, `spm`); `diff` usa la derivada `wellDifferentialPsi`.
- [x] `gaugeWell`, `lineWell` y `multiLine` ya leen las variables nuevas.
- [x] **Bug corregido:** el comparador "Comparar Pozos" arrancaba con variable `prodTotal` (no existía en `VAR_META`) → nunca graficaba. Ahora usa variables por-pozo reales. Se eliminó `GLOBAL_VARIABLES` (código muerto).
- [x] Toggle re-etiquetado: "Un Pozo" / "Comparar Pozos". `tsc` + `build` limpios.

### Fase C — Bloques nuevos en la Sala ✅ COMPLETA (jun 28 2026)
**Módulo 4 · Ductos** (categoría "Ductos") — verificado en navegador
- [x] `ductoPerfil`: perfil de presión por KP (línea ECharts con `markArea` roja en la anomalía KP42-57)
- [x] `ductoBalance`: volumen transportado, balance entrega, entrada→salida, pérdida no contabilizada
- [x] `ductoAlerta`: panel alerta huachicol/fuga (toma clandestina, urgencia, ML+Claude)
- [x] `ductoSegmentos`: lista de tramos con color por estado (normal/warning/alert)

**Módulo 5 · EAM** (categoría "Mantenimiento") — verificado en navegador
- [x] `eamSalud`: tabla salud de activos con días-a-falla y color por estado
- [x] `eamFlujo`: tarjeta flujo Predicción IA → Refacción → Orden de trabajo
- [x] `eamOrdenes`: órdenes de trabajo con folio, badge IA, estado

**Módulo 6 · ESG** (categoría "ESG") — verificado en navegador
- [x] `esgAprov`: gauge % aprovechamiento de gas (vivo) vs meta CNE
- [x] `esgCo2`: contador CO₂e hoy/mes en vivo
- [x] `esgIntensidad`: intensidad de emisiones (kg CO₂e/bbl)
- [x] `esgTendencia`: gráfica aprovechamiento vs meta (6 meses)

Imports `DEMO_PIPELINE_*`, `DEMO_ASSETS_HEALTH`, `DEMO_ESG_*` que estaban sin usar → ahora SÍ se usan en widgets reales. `tsc` + `build` limpios, 0 errores en consola.

**Pantalla preconfigurada "Sala Ejecutiva · Midstream"** (jun 28 2026): la antigua "Custom 1" de `DEFAULT_SCREENS` ahora arranca armada como sala ejecutiva midstream — Perfil de Presión + Alerta Huachicol (fila 1), Tramos + Salud de Activos + Aprovechamiento de Gas (fila 2), Balance + Tendencia ESG + CO₂e en vivo (fila 3). Verificada en navegador: los 8 bloques renderizan con datos reales. (Nombre genérico a propósito: no se usa el nombre de ningún prospecto para no incomodar a otras empresas que prueben el demo.)

**Bonus Nivel 1** (pendiente, opcional): bloque de Tanque visual · gauge SPM dedicado · widget ΔP dedicado. (Las variables de tanque/balancín/ΔP ya están disponibles en el comparador y en Gauge/Gráfica·Por Pozo desde Fase B.)

---

## 4. Checklist de verificación (criterio de "hecho de verdad")

- [ ] Los imports de `DEMO_PIPELINE_*`, `DEMO_ASSETS_HEALTH`, `DEMO_ESG_*` en SalaMonitoreo SÍ se usan en widgets reales.
- [ ] La categoría del catálogo incluye Ductos / Mantenimiento / ESG / Tanques además de las 3 originales.
- [ ] `npm run build` pasa sin errores.
- [ ] Cada bloque nuevo se puede arrastrar al video-wall y muestra dato (vivo donde aplique).
- [ ] El comparador multi-pozo lista las variables nuevas y grafica balancín/tanque entre pozos.
- [ ] Revisión visual en `oilboards.com/demo` → Sala de Monitoreo.

---

## 4b. Bugs encontrados y corregidos durante la verificación

- **Bug "Ver pared" no mostraba bloques configurables** (jun 27 2026): la vista video-wall (`MiniScreen`) usaba `def.render()` por defecto e ignoraba `item.binding`, así que Comparar Pozos / Gauge·Por Pozo / Gráfica·Por Pozo salían como "Click ⚙️ para configurar". **Fix:** se extrajo `resolveBoundWidget(item, def)` compartido por `WidgetItem` (edición) y `MiniScreen` (pared). Verificado en navegador.
- **Bug bloques "se regresan" al reacomodar** (jun 27 2026): `react-grid-layout` con `compactType="vertical"` compactaba todo hacia arriba, impidiendo dejar un bloque abajo con espacio encima. **Fix:** `compactType={null}` + `preventCollision={true}` (colocación libre tipo rompecabezas) y `addWidget` ahora calcula el `y` real (fondo del contenido) en vez del sentinela `y=99`. Verificado en navegador (ALERTAS ACTIVAS se queda donde se suelta).
- **Mejora: grid guía visible al editar** (jun 27 2026): overlay con la misma geometría que RGL (12 cols · filas 68px · gap 8px · padding 8px, `z-0` tras los bloques en `z-10`) para que el usuario vea dónde encajan los bloques. Verificado en navegador.
- **Bug crash en Bitácora de Eventos (DashboardCampo)** (jun 27 2026): condición de carrera — el `i++` corría antes de que el updater diferido de `setEvents` leyera `i`, así que al 3er tick leía `newEvents[3]` (undefined) → `undefined.type` → crash de la pantalla de entrada a los ~36s. **Fix:** capturar `const next = newEvents[i]` antes de incrementar. Verificado en navegador: 0 errores tras 45s. (Bug preexistente, no introducido en este sprint.)

- **Bug "Por variable global no sirve" en bloques de un pozo** (jun 28 2026): el toggle "Un Pozo / Comparar Pozos" se mostraba también en `gaugeWell` y `lineWell`, que son de un solo pozo; al elegir modo comparación no graficaban (combinación inválida). **Fix:** el modo ahora se deriva del tipo de bloque (`bindMode = type==='multiLine' ? 'global' : 'well'`), se quitó el toggle y se reemplazó por un letrero informativo. Verificado en navegador (Gráfica·Por Pozo con SPM del POZO-108 grafica curva completa; 0 errores).

## 5. Reglas (no romper)
- Copy: regulador **CNE/SENER**, seguridad **ASEA**. NUNCA "CNH".
- Todos los datos en `demoData.ts`, nunca hardcodeados en componentes.
- Tema visual: `lib/chart.ts` y la paleta del `CLAUDE.md`.
- Balancín se mide en **SPM (cpm)**, no RPM. BEC en **Hz**, no RPM.

---

*Se va marcando el progreso en este archivo conforme se construye. Última actualización: jun 27 2026 (creación).*
