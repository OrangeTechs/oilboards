# CLAUDE.md — Oilboards · Contexto Completo para Claude Code

> Este archivo es la fuente de verdad para Claude Code. Contiene todo el contexto del proyecto, las decisiones ya tomadas, y las instrucciones exactas de qué construir. Leerlo completo antes de ejecutar cualquier comando.

---

## 1. Quién soy y qué es este proyecto

Soy MANE, fundador de **Orange Technologies SA de CV**. Estoy construyendo **Oilboards**, un SaaS de monitoreo y optimización operativa de pozos petroleros para el mercado mexicano.

El objetivo de esta sesión de Claude Code es construir **dos cosas en un droplet limpio de DigitalOcean**:

1. **La landing page** de Oilboards — completa, impactante, dark mode, con animaciones. Que cuando un Director de Operaciones de una petrolera mexicana la abra diga "esto es serio".

2. **Una demo interactiva** del dashboard — navegable, con datos realistas mockeados, que simule exactamente cómo se vería el SaaS en producción. El objetivo es "apantallar": vender la visión antes de que el producto esté 100% construido.

**El criterio de éxito:** que un Director de Carso, Hokchi o un contratista petrolero mexicano abra `oilboards.com`, vea la landing, entre a la demo, y diga "quiero esto para mi activo".

---

## 2. El servidor (estado actual)

El servidor ya está completamente configurado y listo. **No instalar nada — solo programar.**

| Componente | Versión | Estado |
|---|---|---|
| OS | Ubuntu 24.04 LTS | ✅ |
| PHP | 8.3.31 | ✅ instalado |
| Composer | 2.10.1 | ✅ instalado |
| Node.js | 22.23.1 | ✅ instalado |
| npm | 10.9.8 | ✅ instalado |
| Nginx | 1.24 | ✅ corriendo |
| SSL | Let's Encrypt | ✅ activo (expira Sep 23, 2026) |
| Laravel | 12.x + Breeze + React + TypeScript | ✅ en `/var/www/oilboards` |
| Inertia.js | 2.x | ✅ instalado |
| Tailwind CSS | 4.x | ✅ instalado |
| ECharts + echarts-for-react | latest | ✅ instalado |
| Recharts | latest | ✅ instalado |
| Framer Motion | latest | ✅ instalado |
| MapLibre GL JS | latest | ✅ instalado |
| react-grid-layout | latest | ✅ instalado |
| Lucide React | latest | ✅ instalado |

- **IP:** 137.184.63.87
- **Dominio:** https://oilboards.com (SSL activo ✅)
- **Proyecto:** `/var/www/oilboards`
- **Permisos:** configurados para `www-data`
- **APP_ENV:** production
- **APP_DEBUG:** false
- **APP_URL:** https://oilboards.com

### Lo que ya funciona
`https://oilboards.com` sirve la página default de Laravel. El servidor está listo para construir la landing y la demo encima de esta base.

### Comandos útiles en el servidor
```bash
# Entrar al proyecto
cd /var/www/oilboards

# Build del frontend (después de cambios en React/CSS)
npm run build

# Limpiar caché de Laravel
php artisan config:cache && php artisan route:cache && php artisan view:cache

# Recargar Nginx
systemctl reload nginx

# Ver logs de errores
tail -f storage/logs/laravel.log
```

---

## 3. El producto — contexto completo

### Qué es Oilboards
Plataforma SaaS que centraliza el reporte diario de pozos petroleros, el monitoreo de producción y los KPIs operativos. Elimina el Excel disperso. Tiene IA que predice fallas antes de que ocurran.

### El cliente objetivo (ICP)
- Operadores privados de bloques petroleros en México (Hokchi, Tecpetrol, Perenco, Jaguar E&P)
- Contratistas Tier-2 nacionales (Nuvoil, Diavaz, Protexa, CME)
- Grupo Carso (Oil & Gas) como cliente aspiracional

### El dolor que resuelve
1. Ingenieros pierden 2-3 horas/día transcribiendo datos de campo a Excel
2. Fallas imprevistas detienen pozos → miles de USD/hora de NPT
3. Reportes incorrectos generan fricciones con Pemex y riesgo regulatorio ante CNE/SENER

### Los 3 módulos del producto
- **Módulo 1 — Captura y Campo:** app móvil offline, reporte diario por pozo, bitácora de voz → IA → JSON estructurado
- **Módulo 2 — Ingeniería y Telemetría:** integración SCADA, presiones THP/FLP, gauges de motor BEC/BM
- **Módulo 3 — Dirección y Estrategia:** KPIs ejecutivos, cumplimiento CNE/SENER, curva de declinación, asistente IA

### El diferenciador principal
**Salas de Monitoreo Virtuales** — cualquier oficina se convierte en un centro de control estilo NASA en 48 horas, usando pantallas comerciales con internet. Sin servidores en sitio, sin hardware industrial costoso.

### La IA
Motor híbrido de dos capas:
- **Capa 1 (ML local):** XGBoost/Random Forest detecta anomalías numéricas en telemetría
- **Capa 2 (Claude API):** traduce anomalías en recomendaciones técnicas en español claro

### Precio
- Fee de implementación: $35,000 USD (pago único)
- Suscripción: $10,000 USD/mes por activo (hasta 40 pozos, usuarios ilimitados)
- Prueba piloto: 14 días sin costo en 1 pozo seleccionado

### Regulatorio
El regulador en México es **CNE (Comisión Nacional de Energía) / SENER** (la CNH desapareció en la reforma energética 2025). La seguridad operativa la supervisa **ASEA**.

---

## 4. Stack tecnológico

### Para la landing y demo
- **Framework:** Laravel 12 + Inertia.js + React + TypeScript
- **Estilos:** Tailwind CSS 4.x (dark mode obligatorio)
- **Animaciones:** Framer Motion
- **Gráficas:** Apache ECharts (telemetría, declinación, gauges) + Recharts/Tremor (KPIs)
- **Mapa:** MapLibre GL JS (mapa del campo con pines de pozos)
- **Drag & Drop:** react-grid-layout (salas de monitoreo)
- **Tiempo real (simulado en demo):** setInterval para simular WebSocket updates
- **Build:** Vite


> ✅ **Todo el stack ya está instalado en el servidor. No correr ningún comando de instalación — ir directo a construir las páginas.**

### Colores y diseño (OBLIGATORIO seguir esto)
```
Fondo principal:     #0B0F19  (negro profundo)
Fondo secundario:    #111827  (gris oscuro)
Fondo tarjetas:      #1F2937
Verde neón (OK):     #10B981  (pozos activos, datos buenos)
Rojo (alerta):       #EF4444  (pozo parado, NPT)
Amarillo (warning):  #F59E0B  (alerta predictiva IA)
Azul (intervención): #3B82F6  (pozo en reparación)
Texto principal:     #F9FAFB
Texto secundario:    #9CA3AF
Acento/borde:        #374151
```

### Tipografía
- **UI general:** Inter (Google Fonts)
- **Números y tableros técnicos:** JetBrains Mono
- Importar ambas desde Google Fonts

### Iconos
- Lucide React (`npm install lucide-react`)

---

## 5. La Landing Page — spec completa

### Estructura de secciones (en orden)

---

#### SECCIÓN 1 — HERO (primera pantalla)
**Layout:** fondo `#0B0F19`, texto a la izquierda, mockup del dashboard a la derecha

**Elementos:**
- Navbar fija: logo "🛢️ Oilboards" + links (Producto, Precios, Demo) + botón CTA verde "Solicitar Demo"
- Ceja (eyebrow): `PLATAFORMA OPERATIVA · MÉXICO` — texto pequeño, verde neón, mayúsculas, letra espaciada
- Título H1 (grande, bold, blanco): `Producción, pozos y operaciones — todo en un solo lugar.`
- Subtítulo (gris claro, tamaño medio): `Oilboards centraliza el reporte diario de pozos, el monitoreo SCADA en tiempo real y los KPIs operativos de tu activo. Diseñado para operadores, ingenieros y dirección — desde campo hasta tu sala de monitoreo.`
- CTA principal (botón verde grande): `Solicitar demo de 14 días →`
- Texto de confianza debajo del botón (pequeño, gris): `Sin costos ocultos por usuario · Diseñado bajo el marco regulatorio CNE/SENER y Pemex`
- **Mockup derecho:** screenshot o ilustración del dashboard con dark mode, gráficas de ECharts, semáforo de pozos. Puede ser un iframe de la demo o una imagen estática animada con Framer Motion (fade in + float suave)

**Animación:** el mockup entra con fade-in desde abajo al cargar. El título aparece palabra por palabra con stagger.

---

#### SECCIÓN 2 — EL GRAN GANCHO (Salas de Monitoreo Virtuales)
**Layout:** fondo ligeramente diferente (`#111827`), imagen/video a la izquierda, texto a la derecha

**Elementos:**
- Título: `Tu Sala de Control estilo NASA. Instalada en 48 horas. Sin servidores locales.`
- Subtítulo: `Las salas de monitoreo tradicionales te exigen comprar computadoras industriales costosas y licencias por cada pantalla. Con Oilboards, transformas cualquier oficina en un centro de control usando pantallas comerciales conectadas a internet.`
- 3 bullets con ícono verde:
  - ✅ Monitoreo en múltiples pantallas con URLs independientes por módulo
  - ✅ Sincronización instantánea vía WebSockets — datos al milisegundo
  - ✅ Layouts dinámicos arrastrables (drag & drop) por el Ingeniero en Jefe
- **Visual izquierdo:** ilustración/mockup de una sala de juntas con 3 TVs mostrando los 3 módulos de Oilboards. Fondo oscuro, acentos neón.

---

#### SECCIÓN 3 — LOS 3 MÓDULOS
**Layout:** fondo `#0B0F19`, tabs o acordeón navegable, captura de pantalla de cada módulo

**Título:** `Todo lo que opera un activo petrolero.`
**Subtítulo:** `Tres módulos integrados que cubren desde la captura en campo hasta el análisis ejecutivo. Sin Excel intermedios, sin PDFs perdidos.`

**Tab 1 — MÓDULO 01: Reporte Diario de Producción**
- Descripción: captura desde celular offline, consolidación automática, cálculo de volumen neto
- Variables listadas: aceite (bbl/d), BSW %, volumen neto, gas asociado, GOR, horas en producción, causa de paro, consumo de diésel, eventos HSE
- Visual: mockup de la app móvil de campo

**Tab 2 — MÓDULO 02: Monitoreo de Pozos y Telemetría**
- Descripción: vista en tiempo real, integración SCADA, sin alterar infraestructura actual
- Variables: THP, FLP, temperatura de cabezal, Hz/RPM/amperaje de motor, status del pozo, BHP, inyección de químicos
- Visual: grid de pozos con semáforo + gráficas de presión

**Tab 3 — MÓDULO 03: KPIs Ejecutivos**
- Descripción: dashboard para dirección, cumplimiento CNE/SENER, curva de declinación
- Variables: producción total Mbd, balance vs Pemex, pronóstico vs real, eficiencia operativa, costo por barril, aprovechamiento de gas
- Visual: dashboard ejecutivo con tarjetas de KPI y gráfica de declinación

---

#### SECCIÓN 4 — REGULATORIO (Paz mental)
**Layout:** fondo `#111827`, 3 columnas con íconos institucionales

**Título:** `Cero errores humanos. Conciliaciones con Pemex sin fricciones y reportes CNE en un clic.`
**Subtítulo:** `En el sector energético de México, un reporte con datos erróneos detiene tus pagos o activa penalizaciones multimillonarias. Oilboards blinda tu operación automatizando el cumplimiento regulatorio.`

**3 pilares (columnas):**
1. **Validación de Volumen Neto** — cálculo automático que coincide con balances de Pemex Exploración y Procura
2. **Cumplimiento CNE/SENER** — exporta tus reportes con los formatos exigidos por el regulador vigente
3. **Auditoría de NPT** — respaldo histórico inmutable para resolver disputas con Pemex o subcontratistas

---

#### SECCIÓN 5 — LA IA (El diferenciador tecnológico)
**Layout:** fondo especial con gradiente sutil (`#0B0F19` → `#111827`), visual de alerta llegando al celular

**Título:** `El software tradicional te dice qué pasó ayer. Oilboards te dice qué va a fallar mañana.`
**Subtítulo:** `Nuestro motor híbrido de Inteligencia Artificial transforma los datos fríos en acciones preventivas para proteger tu producción y reducir el NPT.`

**2 bloques lado a lado:**

*El Analista Numérico (ML Local):*
- Ícono: chip/cpu en verde neón
- Algoritmos estadísticos escanean presiones y temperaturas 24/7
- Detectan micro-desviaciones invisibles al ojo humano
- Costo computacional mínimo — corre en nuestros servidores

*El Ingeniero Virtual (Claude API):*
- Ícono: cerebro/ai en azul eléctrico
- Traduce alertas numéricas en recomendaciones técnicas en español claro
- Procesa bitácoras de voz del operador y las estructura automáticamente
- Tus datos son 100% privados — nunca se usan para entrenar modelos públicos

**Ejemplo de alerta (tarjeta visual, estilo notificación push):**
```
⚠️ ALERTA PREDICTIVA — POZO-101H
Riesgo de bloqueo por gas (Gas-Lock)

Diagnóstico: La caída del 12% en THP combinada con picos
de vibración indica segregación de gas en la bomba.

Recomendación: Revisar frecuencia del variador según
procedimiento operativo del activo. Monitorear en 30 min.

Urgencia: ALTA · Confianza: Media · Fuente: ML + Claude
⚠️ Sugerencia sujeta a validación del ingeniero responsable.
```

Esta tarjeta debe verse exactamente como una notificación push en un iPhone, con borde amarillo/naranja pulsante.

---

#### SECCIÓN 6 — PRECIOS
**Layout:** fondo `#0B0F19`, tarjeta de precio grande centrada

**Título:** `Un plan fijo. Presupuestos 100% predecibles para tu activo.`
**Subtítulo:** `Sin cobros por usuario extra, sin penalizaciones por expandir tu campo.`

**Tarjeta PLAN ENTERPRISE POR ACTIVO:**
- Badge: "ENTERPRISE"
- Fee de implementación: `$35,000 USD` (pago único) — descripción: configuración, integración SCADA, carga de manuales en IA, capacitación
- Suscripción: `$10,000 USD / mes` (facturado anualmente: $120,000 USD/año)
- Incluye (lista con checkmarks verdes):
  - ✅ Hasta 40 pozos activos por campo
  - ✅ Usuarios e instalaciones de app móvil ilimitadas
  - ✅ Integración con sistemas SCADA existentes
  - ✅ Motor de IA Predictiva completo (ML + Claude)
  - ✅ Soporte técnico prioritario 24/7
  - ✅ Salas de Monitoreo Virtuales
- CTA: `Iniciar Prueba Piloto de 14 días →` (botón verde grande)
- Nota debajo: `La prueba piloto es sin costo en un pozo seleccionado de tu activo.`

---

#### SECCIÓN 7 — CTA FINAL (Cierre de conversión)
**Layout:** fondo `#10B981` (verde neón sólido) o gradiente verde oscuro, centrado

**Título (blanco, grande):** `Detén los paros imprevistos. Asegura tu producción hoy mismo.`
**Subtítulo:** `Comienza tu prueba piloto de 14 días sin costo en un pozo seleccionado y experimenta el poder de Oilboards.`

**Formulario de 5 campos (inline o modal):**
1. Nombre completo
2. Correo electrónico corporativo (validar: bloquear gmail/hotmail/yahoo/outlook en el frontend)
3. Empresa / Operadora
4. Puesto / Cargo
5. ¿Cuántos pozos activos opera? (dropdown: 1-5 / 6-20 / Más de 20)

**Botón submit:** `Iniciar Prueba Piloto Gratis →`
**Nota de confianza:** `🔒 Tus datos están protegidos. Un consultor técnico te contactará en menos de 24 horas.`

Al enviar el formulario: guardar en base de datos (tabla `leads`) + mostrar mensaje de confirmación. No se necesita integración de email en esta fase — solo guardar el lead.

---

#### FOOTER
- Logo + tagline: "Plataforma operativa petrolera · México"
- Links: Producto, Demo, Precios, Aviso de Privacidad, Términos
- Copyright: `© 2026 Orange Technologies SA de CV. Todos los derechos reservados.`
- Texto pequeño: `Oilboards no es responsable por decisiones operativas tomadas con base en las recomendaciones del sistema de IA. Toda sugerencia debe ser validada por personal calificado.`

---

## 6. La Demo Interactiva — spec completa

### Qué es
Un dashboard React completamente funcional con datos realistas hardcodeados/mockeados. Sin backend real. Los datos "se mueven" con setInterval para simular tiempo real. El usuario puede navegar entre pantallas, ver gráficas animadas, y sentir que está usando el producto real.

### Acceso
- URL: `oilboards.com/demo`
- Sin login (acceso directo, para no crear fricción)
- Banner fijo arriba: `🎭 MODO DEMO — Datos simulados para ilustración. Solicita tu prueba piloto con datos reales →`

### Datos del activo demo
```
Organización:   Energía Sureste SA de CV (demo)
Activo/Campo:   Activo Litoral Tabasco
Pozos:          8 pozos activos (ver lista abajo)
Región:         Tabasco / Campeche
```

**Los 8 pozos del demo:**
```
POZO-101H  BEC       Activo      320 bbl/d   THP: 342 psi
POZO-102H  BEC       ALERTA ⚠️   285 bbl/d   THP: 298 psi (cayendo)
POZO-103   Gas Lift  Activo      180 bbl/d   THP: 210 psi
POZO-104   BM        Parado 🔴   0 bbl/d     NPT: 4h 30min
POZO-105H  BEC       Activo      410 bbl/d   THP: 388 psi
POZO-106   Natural   Activo      95 bbl/d    THP: 156 psi
POZO-107H  Gas Lift  Intervención 🔵  0 bbl/d  Reparación mayor
POZO-108   BM        Activo      145 bbl/d   THP: 198 psi
```

### Pantallas de la demo (en orden de construcción)

---

#### PANTALLA 1 — Dashboard de Campo (entrada del Módulo 1)

**Layout:** sidebar izquierdo + área de contenido

**Sidebar:**
- Logo "🛢️ Oilboards" arriba
- Selector de activo: "Activo Litoral Tabasco ▾"
- Navegación:
  - 📋 Captura y Campo (activo)
    - Dashboard de Campo
    - Reporte Diario
    - Consola de Audio
    - Bitácora NPT
  - 📡 Ingeniería y Telemetría
    - Matriz de Pozos
    - Monitor SCADA
    - Diagnóstico de Motores
  - 📈 Dirección y Estrategia
    - KPIs Ejecutivos
    - Cumplimiento CNE
    - Curva de Declinación
    - Asistente IA
  - 🖥️ Sala de Monitoreo
  - ⚙️ Configuración
- Abajo: avatar usuario "Ing. Carlos Mendoza" + rol "Ingeniero"

**Contenido principal:**

Barra superior:
- Título: "Dashboard de Campo"
- Fecha: "Lunes 24 junio 2026 · Turno matutino"
- Campana de alertas con badge rojo "2" (pulsante)
- Indicador conexión: "🟢 En línea"

4 tarjetas KPI (Recharts/Tremor):
- `3,248 bbl` Producción neta hoy (↑ 3.2% vs ayer)
- `87.5%` Uptime global (6 de 8 pozos activos)
- `2` Alertas activas (número en rojo pulsante)
- `4h 30min` NPT acumulado hoy

Feed cronológico de eventos (timeline):
```
08:15  ✅ POZO-101H — Reporte matutino capturado por Op. Antonio Pérez
08:32  ⚠️ POZO-102H — ALERTA IA: Riesgo de gas-lock detectado
09:00  🔴 POZO-104  — Paro por falla eléctrica en tablero de control
09:45  🔵 POZO-107H — Inicio de reparación mayor programada
10:30  ✅ POZO-105H — Reporte matutino capturado (voz → IA)
```
Los eventos nuevos entran desde arriba cada 15 segundos (simulado con setInterval).

---

#### PANTALLA 2 — Matriz de Pozos (estrella visual)

Esta es la pantalla más impactante. Debe hacer el "wow".

**Grid de 8 tarjetas** (2 filas de 4), cada una mostrando:
- Nombre del pozo (bold, blanco)
- Badge de status con color de semáforo (pulsante si es ALERTA)
- Tipo de levantamiento
- Producción neta bbl/d
- Presión THP actual
- Mini sparkline de las últimas 6 horas (ECharts, línea verde/roja)

**Colores de tarjeta por status:**
- Activo: borde izquierdo verde `#10B981`, fondo `#1F2937`
- ALERTA: borde izquierdo amarillo `#F59E0B`, fondo con tinte amarillo muy sutil, badge pulsante
- Parado: borde izquierdo rojo `#EF4444`, fondo con tinte rojo muy sutil
- Intervención: borde izquierdo azul `#3B82F6`

**Simulación de tiempo real:** cada 8 segundos, el THP del POZO-102H baja 2-3 psi (simulando la anomalía progresiva). La tarjeta "tiembla" suavemente con Framer Motion cuando cae.

Al hacer click en una tarjeta → modal o panel lateral con detalle del pozo.

---

#### PANTALLA 3 — Monitor SCADA / Telemetría (las gráficas espectaculares)

**Selector de pozo** arriba: "POZO-102H ▾" (el que tiene la alerta)

**Gráfica principal (ECharts, ocupa 60% de la pantalla):**
- Doble eje Y: THP (psi) en verde + FLP (psi) en azul
- Eje X: últimas 24 horas (timestamps)
- La línea de THP muestra la caída progresiva desde las 06:00
- Zona sombreada en rojo donde cruza el umbral de alerta
- Zoom interactivo, tooltip al hover con valores exactos
- Título: "Presión de Cabezal vs. Presión de Línea — POZO-102H"

**Panel de alerta activa** (derecha, 40%):
```
⚠️ ALERTA PREDICTIVA ACTIVA
━━━━━━━━━━━━━━━━━━━━━━━━━━
POZO-102H · Gas-Lock Risk
Detectada: 08:32 AM · Hace 2h 15min
Urgencia: ALTA
Confianza del modelo: Media

DIAGNÓSTICO
La caída escalonada del 12% en THP
combinada con picos de vibración del
motor en las últimas 6 horas es
consistente con segregación de gas en
la bomba electrocentrífuga.

RECOMENDACIÓN
Revisar la frecuencia de operación del
variador según el rango indicado en el
manual del equipo. Monitorear la
respuesta de presión de succión en
los próximos 30 minutos.

⚠️ Sugerencia sujeta a validación
del ingeniero responsable del activo.

[✓ Acusar recibo]  [✗ Resolver]
```

**3 gauges de motor** (ECharts, tipo aguja) debajo de la gráfica:
- Frecuencia variador: 52 Hz (rango normal 45-60)
- Corriente motor: 48.3 A (subiendo — en amarillo)
- Vibración: 0.87 mm/s (por encima del umbral — en rojo)

Los gauges se actualizan cada 5 segundos con variaciones pequeñas aleatorias (simula SCADA).

---

#### PANTALLA 4 — KPIs Ejecutivos (Módulo 3)

**Layout:** grid de tarjetas grandes arriba + gráficas abajo

**Selector de período:** "Junio 2026 ▾"

**6 tarjetas KPI grandes (Tremor):**
- 🛢️ `72,450 bbl` Producción neta del mes (↑ 4.1% vs meta)
- ⏱️ `87.3%` Uptime global
- ⚡ `72.4 h` NPT acumulado
- 💧 `18.2%` BSW promedio
- 💵 `$18.40` Costo estimado por barril
- 🔥 `95.8%` Gas comercializado

**Gráfica de cumplimiento CNE (ECharts, barras agrupadas):**
- Eje X: meses Ene-Jun 2026
- Barras azules: meta comprometida
- Barras verdes: producción real
- Línea roja horizontal: umbral mínimo (80%)
- Junio: barra verde ligeramente por encima de la azul (104% cumplimiento)

**Tabla de pozos (abajo):**
Ranking de pozos por producción neta, con sparkline de tendencia, status y % del total del activo.

---

#### PANTALLA 5 — Consola del Asistente IA

**Layout:** chat centrado, ancho medio, fondo `#111827`

**Header:** "🤖 Asistente Técnico Virtual — Activo Litoral Tabasco"
**Subtítulo pequeño:** "Responde preguntas sobre manuales de equipo, historial de fallas y procedimientos operativos del activo."

**Historial de conversación (hardcodeado, parece real):**

```
👤 Ingeniero (10:45 AM)
¿Cuál es el procedimiento para diagnosticar
un gas-lock en la BEC del POZO-102H?

🤖 Asistente (10:45 AM)
Según el manual de la bomba BEC instalada
en POZO-102H (Sección 4.3 — Diagnóstico
de Gas-Lock), los síntomas típicos incluyen:

1. Caída progresiva en THP sin reducción
   de frecuencia del variador
2. Aumento en la corriente del motor
3. Picos de vibración por encima de
   0.75 mm/s

El procedimiento recomendado es:
• Reducir la frecuencia al rango inferior
  del equipo (verificar placa del motor)
• Abrir la línea de ventilación del
  espacio anular si aplica
• Monitorear la recuperación de presión
  de succión en 30 minutos

⚠️ Esta información debe validarse con
el personal calificado antes de ejecutarse.

👤 Ingeniero (10:47 AM)
¿Cuántas veces ha tenido gas-lock este
pozo en los últimos 6 meses?

🤖 Asistente (10:47 AM)
Según el historial de intervenciones del
activo, POZO-102H ha registrado 2 eventos
de gas-lock en los últimos 6 meses:

• 15 abril 2026: Gas-lock, duración 8h,
  resolución por reducción de frecuencia
• 28 febrero 2026: Gas-lock, duración 14h,
  requirió intervención de reparación menor

El patrón sugiere que el pozo es susceptible
a gas-lock cuando el GOR supera 1,450 scf/bbl,
condición que se presentó en ambos eventos.
```

**Input activo abajo:** "Escribe tu pregunta sobre el activo..."
**Botón:** "Enviar →"

Al enviar cualquier cosa en la demo → respuesta genérica: "Esta es una demo. En el sistema real, el asistente responde con base en los manuales de tus equipos y el historial del activo."

---

#### PANTALLA 6 — Sala de Monitoreo Virtual (el "wow" final)

Esta es la pantalla de cierre que más impacta en demos presenciales.

**Layout especial:** fondo negro puro `#000000`, sin sidebar, pantalla completa

**Header:** "🖥️ Sala de Monitoreo Virtual — Activo Litoral Tabasco" + botón "Salir de la sala"

**3 "pantallas" simuladas** lado a lado (aspect ratio de TV):

Pantalla 1 (izquierda) — "CAMPO":
- Feed de eventos en tiempo real (misma data que Dashboard de Campo)
- Producción neta acumulada del día: counter que sube cada 10 segundos
- Últimas bitácoras capturadas

Pantalla 2 (centro) — "TELEMETRÍA":
- Versión compacta del grid de pozos (semáforo de colores)
- THP en tiempo real de los 3 pozos más activos
- Gauge de corriente del motor de POZO-102H (el que tiene la alerta, pulsante)

Pantalla 3 (derecha) — "DIRECCIÓN":
- KPI grande: producción del día vs. meta
- Gráfica de cumplimiento CNE (mini)
- Panel de alertas activas: "⚠️ 2 alertas activas — POZO-102H, POZO-104"

**Efecto visual:** las 3 pantallas tienen un borde de "TV" sutil, con reflejo sutil en la parte inferior. Las actualizaciones en tiempo real son visibles y sincronizadas.

---

## 7. Tabla `leads` (base de datos del formulario)

```sql
CREATE TABLE leads (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    email VARCHAR NOT NULL,
    company VARCHAR NOT NULL,
    position VARCHAR NOT NULL,
    wells_count VARCHAR NOT NULL,  -- '1-5' / '6-20' / 'Mas de 20'
    source VARCHAR DEFAULT 'landing',
    created_at TIMESTAMP DEFAULT NOW()
);
```

Guardar cada lead del formulario de la landing. Sin integración de email por ahora.

---

## 8. Estructura de archivos del proyecto

```
oilboards/
├── app/
│   └── Http/Controllers/
│       ├── LandingController.php    # sirve la landing
│       ├── DemoController.php       # sirve la demo
│       └── LeadController.php       # guarda leads
├── resources/
│   └── js/
│       ├── Pages/
│       │   ├── Landing.tsx          # la landing completa
│       │   └── Demo/
│       │       ├── Index.tsx        # layout de la demo
│       │       ├── DashboardCampo.tsx
│       │       ├── MatrizPozos.tsx
│       │       ├── MonitorScada.tsx
│       │       ├── KpisEjecutivos.tsx
│       │       ├── AsistenteIA.tsx
│       │       └── SalaMonitoreo.tsx
│       ├── Components/
│       │   ├── Landing/
│       │   │   ├── Navbar.tsx
│       │   │   ├── Hero.tsx
│       │   │   ├── SalasMonitoreo.tsx
│       │   │   ├── LosTresModulos.tsx
│       │   │   ├── Regulatorio.tsx
│       │   │   ├── LaIA.tsx
│       │   │   ├── Precios.tsx
│       │   │   ├── CtaFinal.tsx
│       │   │   └── Footer.tsx
│       │   ├── Demo/
│       │   │   ├── Sidebar.tsx
│       │   │   ├── TopBar.tsx
│       │   │   ├── AlertPanel.tsx
│       │   │   ├── WellCard.tsx
│       │   │   └── charts/
│       │   │       ├── PressureChart.tsx   # ECharts THP/FLP
│       │   │       ├── DeclineChart.tsx    # ECharts declinación
│       │   │       ├── MotorGauge.tsx      # ECharts gauge
│       │   │       └── KpiCard.tsx         # Tremor
│       │   └── ui/
│       │       ├── Badge.tsx
│       │       ├── StatusDot.tsx           # punto pulsante de semáforo
│       │       └── AlertCard.tsx
│       └── data/
│           └── demoData.ts              # todos los datos mockeados del demo
├── routes/
│   └── web.php
└── database/
    └── migrations/
        └── create_leads_table.php
```

---

## 9. Archivo de datos demo (`demoData.ts`)

Centralizar TODOS los datos del demo aquí. Nunca hardcodear en los componentes.

```typescript
export const DEMO_ASSET = {
  name: 'Activo Litoral Tabasco',
  organization: 'Energía Sureste SA de CV',
  region: 'Tabasco / Campeche',
  totalWells: 8,
  activeWells: 6,
};

export const DEMO_WELLS = [
  {
    id: 'pozo-101h',
    name: 'POZO-101H',
    liftType: 'BEC',
    status: 'active',
    netOilBbl: 320,
    thpPsi: 342,
    flpPsi: 180,
    tempC: 68,
    motorHz: 55,
    motorAmp: 42.1,
    vibrationMms: 0.42,
    bswPct: 18.0,
    uptimePct: 95.8,
  },
  {
    id: 'pozo-102h',
    name: 'POZO-102H',
    liftType: 'BEC',
    status: 'alert',
    netOilBbl: 285,
    thpPsi: 298,  // cayendo
    flpPsi: 175,
    tempC: 71,
    motorHz: 52,
    motorAmp: 48.3,  // subiendo
    vibrationMms: 0.87,  // sobre umbral
    bswPct: 21.5,
    uptimePct: 88.2,
    activeAlert: {
      title: 'Riesgo de bloqueo por gas (Gas-Lock)',
      severity: 'high',
      urgency: 'alta',
      detectedAt: '08:32 AM',
    }
  },
  // ... resto de pozos según la lista del §6
];

export const DEMO_KPIS = {
  netOilBblMonth: 72450,
  netOilBblMonthVsTarget: 4.1,  // % sobre meta
  uptimePct: 87.3,
  nptHours: 72.4,
  bswAvgPct: 18.2,
  costPerBarrelUsd: 18.40,
  gasCommercialized: 95.8,
};

export const DEMO_EVENTS = [
  { time: '08:15', type: 'ok',    well: 'POZO-101H', message: 'Reporte matutino capturado por Op. Antonio Pérez' },
  { time: '08:32', type: 'alert', well: 'POZO-102H', message: 'ALERTA IA: Riesgo de gas-lock detectado' },
  { time: '09:00', type: 'down',  well: 'POZO-104',  message: 'Paro por falla eléctrica en tablero de control' },
  { time: '09:45', type: 'info',  well: 'POZO-107H', message: 'Inicio de reparación mayor programada' },
  { time: '10:30', type: 'ok',    well: 'POZO-105H', message: 'Reporte matutino capturado (voz → IA)' },
];
```

---

## 10. Instrucciones de ejecución para Claude Code

### Orden de trabajo (seguir este orden exacto)

1. **Setup del servidor** — instalar todo el stack en el droplet limpio (Doc 9)
2. **Crear el proyecto Laravel** — con Inertia + React + Tailwind
3. **Instalar dependencias** — ECharts, Recharts, Framer Motion, MapLibre, Lucide, react-grid-layout
4. **Crear la tabla `leads`** y el `LeadController`
5. **Construir la Landing** — sección por sección, empezando por el Navbar y Hero
6. **Construir el Demo** — empezando por el Sidebar y layout base, luego cada pantalla
7. **Configurar rutas** — `/` para landing, `/demo` para demo
8. **Configurar Nginx + SSL** con Certbot
9. **Smoke test** — verificar que `oilboards.com` carga y `/demo` es navegable

### Comandos de arranque del proyecto

```bash
cd /var/www
composer create-project laravel/laravel oilboards
cd oilboards
composer require laravel/breeze --dev
php artisan breeze:install react
npm install
npm install echarts echarts-for-react recharts @tremor/react \
  framer-motion react-grid-layout maplibre-gl \
  lucide-react @types/react-grid-layout
npm run build
```

### Variables de entorno mínimas para la landing + demo

```env
APP_NAME="Oilboards"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://oilboards.com
DB_CONNECTION=sqlite   # SQLite para la demo, sin necesidad de PostgreSQL todavía
```

### Criterio de éxito de esta sesión

- [ ] `https://oilboards.com` carga la landing completa en menos de 2 segundos
- [ ] Las 7 secciones de la landing están completas y se ven profesionales
- [ ] `https://oilboards.com/demo` carga el dashboard sin login
- [ ] Las 6 pantallas del demo son navegables desde el sidebar
- [ ] Las gráficas de ECharts se ven con dark mode y acentos neón
- [ ] Los datos del POZO-102H "se mueven" en tiempo real (simulado)
- [ ] La alerta del POZO-102H tiene el badge pulsante amarillo
- [ ] La Sala de Monitoreo Virtual ocupa pantalla completa con las 3 "TVs"
- [ ] El formulario de la landing guarda el lead en la base de datos
- [ ] SSL activo (candado verde en el navegador)

---

## 11. Tono y voz del copy

- **Directo y técnico.** El cliente es un ingeniero o director de operaciones, no un consumidor.
- **En español de México.** Usar términos del sector: "activo", "pozo", "NPT", "levantamiento artificial", "bitácora".
- **Sin exagerar.** Nada de "revolucionario" o "disruptivo". Decir exactamente qué hace y qué resuelve.
- **Con credibilidad.** Mencionar CNE/SENER, Pemex, BSW, THP — los ingenieros detectan cuando alguien no conoce el sector.
- **Urgencia real.** Un pozo parado cuesta miles de USD/hora. Eso es el dolor que se resuelve.

---

## 12. Lo que NO hacer

- ❌ No usar `APP_DEBUG=true` en producción
- ❌ No hardcodear datos en los componentes — todo en `demoData.ts`
- ❌ No usar `localStorage` en los componentes React (no funciona en Claude.ai pero sí en el droplet real — en el droplet sí se puede usar)
- ❌ No mencionar "CNH" en ningún copy — la CNH desapareció en 2025, es CNE/SENER
- ❌ No poner "45 RPM" como consigna de BEC — el variador se ajusta en Hz, no RPM
- ❌ No mezclar los archivos de la landing con los del demo — estructura de carpetas separada
- ❌ No instalar librerías innecesarias — solo las listadas en §10

---

---

## 13. Documentación de referencia

La documentación completa del proyecto vive en `/docs/`. Consultarla cuando se necesite detalle específico. Este `CLAUDE.md` es el briefing de sesión — los docs son la biblioteca.

| Archivo | Cuándo consultarlo |
|---|---|
| `docs/00_indice.md` | Para saber en qué doc está cualquier cosa |
| `docs/01_fundacion-tecnica.md` | Decisiones de stack, librerías, estructura de carpetas, orden de construcción |
| `docs/02_modulos-dashboard.md` | Qué muestra cada pantalla, qué librería de gráficas usa, qué rol la ve |
| `docs/03_modelo-de-datos.md` | Tablas, columnas, tipos, relaciones, orden de migraciones |
| `docs/04_prompts-ia.md` | System prompts completos de Claude, Jobs de Laravel, costos de API |
| `docs/05_contratos-api.md` | Todos los endpoints: URL, método, payload, response, códigos de error |
| `docs/06_app-movil-offline.md` | PWA, Service Worker, IndexedDB, SyncManager, grabación de audio |
| `docs/07_exportacion-reportes.md` | PDF/Excel: contenido exacto, vista Blade, Job de generación |
| `docs/08_seguridad-auth.md` | OrganizationScope, RBAC, Sanctum, Policies, Form Requests, rate limiting |
| `docs/09_despliegue-produccion.md` | Setup servidor, Nginx, Supervisor, CI/CD, backups, checklist go-live |

### Reglas de consulta

- Si hay conflicto entre este `CLAUDE.md` y un doc de `/docs/`, **gana este `CLAUDE.md`** — es la versión más reciente.
- Para la landing y la demo, este archivo tiene toda la spec necesaria. Los docs de `/docs/` son para el desarrollo del producto completo (siguiente fase).
- El Doc 9 (`09_despliegue-produccion.md`) es la referencia para el setup del servidor en esta sesión.
- El Doc 1 (`01_fundacion-tecnica.md`) tiene los comandos exactos de instalación del stack.

---

*Este archivo es la fuente de verdad para esta sesión de Claude Code. Cualquier decisión de diseño, copy o implementación que no esté aquí debe seguir el espíritu de lo que sí está documentado.*
