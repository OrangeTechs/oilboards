# 🛢️ OILBOARDS — Estado Construido: Landing + Demo

**Bitácora de lo entregado en la sesión de construcción (jun 2026)**
Complemento operativo de `CLAUDE.md`. Documenta QUÉ se construyó, DÓNDE vive y CÓMO está hecho.

| Campo | Valor |
|---|---|
| URL producción | https://oilboards.com (landing) · https://oilboards.com/demo (demo) |
| Stack | Laravel 12 + Inertia + React 18 + TS + Tailwind 4 + Vite |
| Librerías clave | ECharts, Framer Motion, **MapLibre GL**, **React Three Fiber** (three 0.160 / fiber 8 / drei 9), **react-grid-layout v2.2.3** |
| Estética aprobada | Tesla/SpaceX sleek + mission-control + 3D ("tipo NASA") |

> Nota de regla del proyecto: la **CNH desapareció en 2025**. Todo el copy usa **CNE / SENER** (regulador) y **ASEA** (seguridad operativa). No reintroducir "CNH" como vigente.

---

## 1. Sistema de diseño compartido

| Archivo | Qué es |
|---|---|
| `resources/css/app.css` | Fuentes (Inter + JetBrains Mono), imports de MapLibre/RGL CSS, utilidades: `.glass`, `.tech-grid`, `.glow-green/amber`, `.text-gradient`, `.pulse-dot`, overrides de popup MapLibre y placeholder de react-grid-layout |
| `resources/js/lib/chart.ts` | Tema oscuro ECharts compartido: paleta `C`, `tooltipStyle` (glass + JetBrains Mono), `axisX/axisY`, `areaGradient`, `baseGrid` |
| `resources/js/lib/useLive.ts` | Hooks de simulación: `useCounter`, `useStream`, `useJitter` |
| `resources/js/Components/ui/primitives.tsx` | `Panel`, `SectionLabel`, `StatCard`, `StatusDot`, `Badge`, `Sparkline` |
| `resources/js/Components/Shared/FieldMap.tsx` | Mapa MapLibre oscuro de la Sonda de Campeche con pines por semáforo (teselas CARTO dark, sin token). ResizeObserver para bloques ajustables |
| `resources/js/Components/Shared/Well3D.tsx` | **Gemelo digital 3D**: cabezal de pozo / árbol de válvulas (christmas tree) en acero metálico realista, con Environment (Lightformers, sin HDRI externo) + piso reflejante (MeshReflectorMaterial) + auto-rotación lenta. (Reemplazó a un pumpjack que se veía "low-poly".) |

---

## 2. Landing (`/`)

Orden de secciones (todas estética glass/sleek consistente):

1. **Navbar** (`Components/Landing/Navbar.tsx`) — fija, glass al hacer scroll. Links: Producto · Módulos · Salas · IA · Comparativa · Precios. Botón verde **"Demo"** → `/demo`. (Se quitó el link "Demo" del menú.)
2. **Hero** (`Hero.tsx`) — mission-control EN VIVO: mapa MapLibre + contador de producción + telemetría streaming + alerta gas-lock flotante. Headline animado palabra-por-palabra. `FieldMap` lazy-load. Padding `pt-[142px] pb-[88px]` (ajustado para no dejar huecos).
3. **MissionControl** (`MissionControl.tsx`, `id=producto`) — "Telemetría en tiempo real": **Gemelo digital 3D** (Well3D, lazy-load) + gráfica SCADA THP/FLP en vivo + 3 gauges de motor. Etiqueta del panel 3D: "GEMELO DIGITAL · POZO-102H · Cabezal" con medidas THP/Temp. cabezal/Choke.
4. **SalasMonitoreo** (`SalasMonitoreo.tsx`, `id=salas`) — mosaico teaser "14 pantallas" + bullets. Botón "Ver la Sala de Monitoreo en la demo" → `/demo?screen=sala-monitoreo`.
5. **LosTresModulos** (`id=modulos`) — tabs de los 3 módulos del producto.
6. **Regulatorio** — 3 pilares (Volumen Neto, CNE/SENER, Auditoría NPT).
7. **LaIA** (`id=ia`) — motor híbrido ML + Claude, tarjeta de alerta predictiva.
8. **Comparativa** (`Comparativa.tsx`, `id=comparativa`) — **VS competencia**: tabla Oilboards (verde, glow) vs Proveedores tradicionales (gris), 7 filas. Sin badge "Recomendado".
9. **Precios** (`id=precios`) — tarjeta Enterprise. **Cifras ocultas temporalmente**: dice "USD · a cotizar" (los montos $35k/$10k están comentados/reemplazados, regresar cuando se pida).
10. **CtaFinal** (`id=cta`) — sección verde + formulario de leads funcional (valida correo corporativo, bloquea gmail/hotmail/etc.).
11. **Footer**.

---

## 3. Demo (`/demo`) — 22 pantallas

Router en `resources/js/Pages/Demo/Index.tsx` (estado `screen`, lee `?screen=<id>` para deep-link). Sidebar agrupado en `Components/Demo/Sidebar.tsx`. Datos en `resources/js/data/demoData.ts`. Banner "MODO DEMO" (oculto en Sala).

| Grupo | Pantallas |
|---|---|
| **Captura y Campo** | dashboard-campo · reporte-diario (cálculo neto en vivo + offline) · consola-voz (voz→Whisper→Claude JSON, simulado) · bitacora-npt (inmutable + dona por causa) · inventario-hse |
| **Ingeniería y Telemetría** | matriz-pozos · mapa-campo (MapLibre interactivo) · monitor-scada · diagnostico-motores · dosificacion-quimica |
| **Dirección y Estrategia** | kpis-ejecutivos · cumplimiento-cne · balance-fiscalizacion · curva-declinacion · asistente-ia |
| **Sistema** | centro-reportes · config-alertas · gestion-usuarios (RBAC) · onboarding (alta de activo) · auditoria (hash encadenado) · sincronizacion |
| **Sala** | **sala-monitoreo** (ver §4) |

Todas usan el tema compartido (glass + lib/chart). IA simulada.

---

## 4. Sala de Monitoreo Virtual (el "anzuelo")

`resources/js/Pages/Demo/SalaMonitoreo.tsx` — video-wall configurable con **react-grid-layout v2**.

- **6 pantallas externas** (tabs): Pantalla 1 · Campo, Pantalla 2 · Telemetría, Pantalla 3 · Dirección, **Custom 1, Custom 2, Custom 3** (vacías para armar).
- **18 widgets en vivo** (mapa, matriz, THP×3, gauges×3, producción, uptime, gas, BSW, alertas, eventos, CNE, NPT, declinación).
- **Personalizar**: arrastrar / redimensionar / agregar (paleta) / quitar bloques. **Restablecer** vuelve al layout default.
- **Organizar** (tile): auto-acomoda los widgets de la pantalla activa en mosaico uniforme.
- **Ver pared**: modal (portal a `body`, z-9999) que muestra las 6 pantallas en miniatura con **widgets en vivo reales** en su layout exacto. Clic en una salta a editarla.
- Deep-link: `/demo?screen=sala-monitoreo`.

> API react-grid-layout v2 (ojo, distinta a v1): default export (NO `WidthProvider`); props `width` (medido con ResizeObserver), `gridConfig{cols,rowHeight,margin}`, `dragConfig{enabled,handle:'.drag-handle'}`, `resizeConfig{enabled}`; hijos keyed por `i`.

---

## 5. Backend y datos

- Tabla `leads` (SQLite) + migración + modelo `Lead`.
- Controladores: `LandingController`, `DemoController`, `LeadController`. Rutas: `/`, `/demo`, `POST /leads`.
- Datos demo (vocabulario del Doc 3): `resources/js/data/demoData.ts` — activo Litoral Tabasco, 8 pozos con coords de la Sonda, KPIs, eventos, NPT, HSE, química, fiscalización, declinación, alertas con diagnóstico estilo Claude, auditoría hash, sync, manuales, consola de voz, chat IA.

---

## 6. Infra / fixes aplicados

- **502 en /demo**: headers de Inertia muy grandes → buffers FastCGI en `/etc/nginx/sites-available/oilboards` (`fastcgi_buffer_size 32k; fastcgi_buffers 16 16k; fastcgi_busy_buffers_size 64k`).
- **Peso del landing**: 1.9MB → ~13KB gzip vía `React.lazy` de Well3D y FieldMap (chunks async de three/maplibre).
- Comandos: `npm run build` + `php artisan view:cache` tras cada cambio.

---

## 7. Pendientes conocidos (menores)

- Precios: regresar montos cuando MANE lo pida.
- Construir Módulos 04/05/06 (ver `docs/11_modulos-extra-fase2.md`).
- **Sala — Drawer de widgets (mejora UX, planeada):** reemplazar la barra horizontal "AGREGAR BLOQUE" (se satura, scroll horizontal) por un **drawer lateral** con los widgets como **cuadritos/cards** (mini-preview o ícono + nombre + color), agrupados por categoría. Ideal: **drag-from-drawer-to-canvas** (arrastrar el cuadrito al muro), no solo clic. Libera el espacio superior.
- **Revisar al construir el drawer:** en modo edición los bloques se ven apilados en una columna angosta en algunas vistas — verificar que el GridLayout tome el ancho completo (el `width` del ResizeObserver) al editar.
- **Sala — Reordenar pantallas en "Ver pared" (planeada):** permitir **arrastrar las miniaturas** del modal de pared para reordenar las pantallas (reordena el array `screens` en el estado). El nuevo orden se refleja en las pestañas y en la asignación monitor/URL. Incluir también **renombrar** pantallas (sobre todo las Custom). Implementación: sortable/drag sobre el grid de miniaturas.
