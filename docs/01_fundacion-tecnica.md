# 🛢️ OILBOARDS — Fase 0: Fundación Técnica

**Documento de arranque de desarrollo · Para empezar a programar desde cero**
Complemento técnico de *La Biblia · Fuente de Verdad*.

| Campo | Valor |
|---|---|
| Versión | v0.1 |
| Propósito | Definir el stack, el entorno de desarrollo y la capa visual antes de escribir la primera línea de producto |
| Última edición | (poner fecha) |

> Este documento responde tres preguntas: **(1)** ¿con qué tecnologías se construye?, **(2)** ¿cómo dejo el droplet de desarrollo listo desde cero?, **(3)** ¿qué uso para que las gráficas se vean espectaculares? El detalle por módulo (modelo de datos, endpoints, prompts de IA) va en documentos siguientes que se construyen sobre esta base.

---

## 1. Decisión de arquitectura (lee esto primero)

El brain-dump original proponía **4 servicios en 3 lenguajes**: Laravel (PHP) + Next.js (frontend separado) + Node.js/Socket.io (tiempo real) + Python (ML). Para un fundador solo arrancando, eso es triplicar el trabajo operativo sin ganar nada en la etapa temprana. Dos simplificaciones clave:

### Cambio 1 — Tiempo real con **Laravel Reverb**, no Node.js
Reverb es el servidor WebSocket de primera mano de Laravel. Corre en la misma red que la app (sin round-trip a un servicio externo), habla el protocolo Pusher (compatible con Laravel Echo en el cliente) y se instala con un comando (`php artisan install:broadcasting`). **Elimina Node.js y Socket.io del stack.**

### Cambio 2 — **Laravel + Inertia + React** (una sola app), no API + Next.js separados
- Una sola app, un solo deploy, una sola autenticación de sesión. Sin CORS, sin tokens entre apps, sin dos repos.
- Tienes **todo el poder de React** para las pantallas espectaculares.
- Las "salas de monitoreo" con URL independiente por monitor = simples rutas (`/sala/campo-1`, `/sala/telemetria`, etc.), sincronizadas por Reverb.
- El landing page con buen SEO puede ser una página server-rendered (Blade) o un sitio estático aparte; el dashboard no necesita SEO.

> **¿Cuándo SÍ desacoplar a Next.js?** Cuando tengas tracción real y necesites escalar el frontend por separado, o un equipo frontend dedicado. Ese día extraes la capa React. Hoy no es ese día. **No optimices para un problema que no tienes.**

### El ML (Python) llega después
Por el cold-start de la IA (no hay histórico que entrenar el día 1), el microservicio Python con XGBoost **no se construye en el MVP**. Primero se construye el pipeline de captura y almacenamiento de datos; el módulo predictivo se agrega cuando ya hay datos que consumir (Fase de escalamiento). Ver §6.

---

## 2. El stack recomendado (capa por capa)

| Capa | Tecnología | Versión objetivo | Rol |
|---|---|---|---|
| **Backend** | Laravel | 12.x (estable actual) | Lógica de negocio, API, seguridad, integraciones |
| **Lenguaje base** | PHP | 8.3+ | — |
| **Puente front-back** | Inertia.js | 2.x | Conecta Laravel ↔ React sin API separada |
| **Frontend** | React + TypeScript | React 19 | UI, dashboards, salas de monitoreo |
| **Estilos** | Tailwind CSS | 4.x | Dark mode, diseño rápido y consistente |
| **Tiempo real** | Laravel Reverb + Laravel Echo | actual | WebSockets, push a pantallas sin recargar |
| **Cola / cache / pub-sub** | Redis | 7.x | Jobs en background, cache, escalado de Reverb |
| **Base de datos relacional** | PostgreSQL | 16/17 | Usuarios, pozos, reportes, eventos, alertas |
| **Series de tiempo** (fase escalamiento) | TimescaleDB (extensión de PostgreSQL) | — | Telemetría SCADA a alta frecuencia |
| **Auth / roles** | Laravel + Spatie Laravel Permission | actual | RBAC: Operador / Ingeniero / Administrador |
| **Voz a texto** | Whisper (OpenAI) o Deepgram | API | Transcribir bitácoras de voz |
| **IA lenguaje** | Claude API (tier Sonnet vigente) | — | Estructurar bitácoras, traducir alertas (RAG) |
| **ML numérico** (fase escalamiento) | Python 3.11 + XGBoost / Scikit-Learn (microservicio FastAPI) | — | Detección de anomalías y predicción |
| **Servidor web** | Nginx | actual | Reverse proxy, SSL |
| **Dashboard drag-and-drop** | react-grid-layout o Gridstack | actual | Widgets reacomodables en las salas |

> **Por qué PostgreSQL y no MySQL:** soporte nativo de JSON robusto (útil para los JSON estructurados de bitácoras), mejor con datos analíticos, y TimescaleDB es una **extensión de Postgres** — el día que metas telemetría SCADA real, no cambias de motor de base de datos, solo activas la extensión. Una sola tecnología de datos para todo.

---

## 3. ⭐ Gráficas espectaculares (la capa visual)

El objetivo estético (según la biblia): centro de control **estilo Tesla/SpaceX** — dark mode, acentos neón, gauges animados, tiempo real fluido, legible a distancia en pantallas 4K. No existe UNA librería que haga todo; se combinan según el tipo de visualización. Esta es la receta:

### 3.1 Motor principal: **Apache ECharts** (`echarts` + `echarts-for-react`)
Tu caballo de batalla para el 80% de las gráficas técnicas.
- **Renderiza en Canvas** → aguanta 100K–10M+ puntos sin congelar el navegador (clave para telemetría SCADA de 24 h e historiales largos).
- Memoria estable en dashboards de **larga duración** (salas que corren días sin recargar).
- Trae **gauges, medidores tipo aguja, mapas de calor, sunburst, sankey** y animaciones de alta gama de fábrica.
- API de streaming (`appendData`) para gráficas que crecen en tiempo real.
- **Úsala para:** curvas de declinación, historiales de presión THP/FLP cruzadas, gauges de Hz/RPM/amperaje de motores BEC/BM, mapas de calor de anomalías.
- ⚠️ **Nota Next.js/Inertia:** ECharts accede a `window`, así que se importa solo en cliente (componente con `'use client'` / carga dinámica). Con Inertia + React esto es trivial.

### 3.2 KPIs ejecutivos: **Recharts** (+ opcional **Tremor**)
Para el Módulo 3 (dirección): tarjetas de KPI, barras de cumplimiento de metas, porcentajes.
- API declarativa de componentes, limpísima, encaja perfecto con Tailwind y shadcn/ui.
- Es el default de facto de dashboards React (la librería con más adopción).
- **Tremor** (construido sobre Recharts) te da tarjetas de KPI y bloques de dashboard ya hechos, nativos de Tailwind — ideal para montar el panel ejecutivo rápido. Limitado en personalización, pero perfecto para KPIs.
- **Úsala para:** tarjetas de producción total, costo por barril, % uptime, barras de cumplimiento CNE, deltas y tendencias.

### 3.3 El mapa del campo: **MapLibre GL JS** (o Mapbox GL JS)
Para la vista geográfica de pozos (pines de colores por status sobre coordenadas reales en Veracruz / Golfo de México).
- **MapLibre** es el fork open-source y gratuito de Mapbox — evitas el lock-in y el costo por token de Mapbox. Misma API esencialmente.
- WebGL: mapas oscuros (*dark maps*), pines interactivos, click en pozo → despliega telemetría.
- **Úsala para:** mapa del activo con semáforo de status por pozo.

### 3.4 El factor "wow" real (opcional, diferenciador): **React Three Fiber** (Three.js)
Si quieres que un Director diga "¿qué es ESO?": visualización **3D** de un pozo/equipo (esquema del aparejo, bomba BEC, niveles) o un globo/escena 3D del activo.
- Es lo que separa "otro dashboard" de "esto parece de la NASA".
- Cuesta tiempo de desarrollo — déjalo para cuando el core funcione, pero tenlo en el roadmap visual.

### 3.5 Animación y pulido de UI: **Framer Motion**
Transiciones suaves, entradas animadas de widgets, parpadeo de alertas, números que "cuentan" al actualizarse. El detalle que hace que se sienta premium.

### 3.6 Resumen: qué usar para cada cosa
| Necesidad visual | Librería |
|---|---|
| Telemetría SCADA densa, curvas de declinación, series de tiempo grandes | **Apache ECharts** |
| Gauges / medidores de motor (Hz, RPM, amperaje) | **Apache ECharts** (gauge) |
| Tarjetas de KPI ejecutivo, barras de meta, deltas | **Recharts** / **Tremor** |
| Mapa geográfico del activo con pines de status | **MapLibre GL JS** |
| Visualización 3D de pozo/equipo (diferenciador) | **React Three Fiber** |
| Transiciones, animaciones, parpadeo de alertas | **Framer Motion** |
| Salas: arrastrar y reacomodar widgets | **react-grid-layout** / **Gridstack** |

### 3.7 Guía de estilo (de la biblia, conservar)
- **Dark mode obligatorio:** fondos `#0B0F19` / `#111827`.
- **Semáforo industrial:** 🟢 `#10B981` operando · 🔴 `#EF4444` parado/NPT · 🟡 `#F59E0B` alerta predictiva · 🔵 `#3B82F6` intervención.
- **Tipografía:** sans-serif legible a distancia (Inter) + monoespaciada para tableros numéricos (JetBrains Mono / Roboto Mono).

---

## 4. Estructura del proyecto

Un solo repositorio Laravel + Inertia/React:

```
oilboards/
├── app/                      # Backend Laravel
│   ├── Http/Controllers/     # Controladores (devuelven páginas Inertia)
│   ├── Models/               # Pozo, Reporte, Evento, Alerta, Activo, User...
│   ├── Events/               # Eventos broadcast (tiempo real vía Reverb)
│   ├── Services/             # ClaudeService, TranscriptionService, etc.
│   └── Policies/             # Permisos por rol (RBAC)
├── resources/
│   ├── js/
│   │   ├── Pages/            # Páginas React (Inertia): Dashboard, Sala, Reporte...
│   │   ├── Components/        # Componentes (charts, widgets, gauges)
│   │   │   ├── charts/        # Wrappers de ECharts, Recharts, etc.
│   │   │   └── salas/         # Vistas kiosko por monitor
│   │   ├── Layouts/
│   │   └── echo.ts            # Config de Laravel Echo (cliente WebSocket)
│   └── css/                   # Tailwind
├── routes/
│   ├── web.php                # Rutas de la app
│   └── channels.php           # Canales de broadcast (auth de WebSocket)
├── database/migrations/       # Esquema (ver doc de modelo de datos)
├── config/reverb.php          # Config WebSocket
└── docker-compose.yml         # (opcional) entorno reproducible
```

El microservicio Python ML, cuando llegue, vive **fuera** de este repo, como servicio aparte que Laravel invoca por HTTP.

---

## 5. Setup del droplet de desarrollo desde cero

> **Droplet de desarrollo recomendado:** Ubuntu 24.04 LTS, mínimo **2 vCPU / 4 GB RAM** (los WebSockets y el toolchain de Node piden más que los 2 GB del de la landing). Región `us-east`. Autenticación por **SSH key** (sin login por contraseña).

### Paso 1 — Acceso y endurecimiento básico
```bash
# Conéctate
ssh root@IP_DEL_DROPLET

# Actualiza
apt update && apt upgrade -y

# Usuario no-root con sudo
adduser oilboards
usermod -aG sudo oilboards

# Firewall
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw allow 8080      # Reverb (WebSocket) en desarrollo
ufw enable
```
Reconéctate ya como `oilboards` para lo siguiente.

### Paso 2 — PHP 8.3 + extensiones + Composer
```bash
sudo apt install -y software-properties-common
sudo add-apt-repository -y ppa:ondrej/php
sudo apt update
sudo apt install -y php8.3 php8.3-cli php8.3-fpm php8.3-pgsql \
  php8.3-redis php8.3-mbstring php8.3-xml php8.3-curl php8.3-bcmath \
  php8.3-zip php8.3-gd php8.3-intl unzip git

# Composer
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer
```

### Paso 3 — Node.js 22 LTS (para el frontend React/Vite)
```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node -v && npm -v
```

### Paso 4 — PostgreSQL + Redis
```bash
sudo apt install -y postgresql postgresql-contrib redis-server
sudo systemctl enable --now postgresql redis-server

# Crea base de datos y usuario
sudo -u postgres psql -c "CREATE DATABASE oilboards;"
sudo -u postgres psql -c "CREATE USER oilboards_user WITH ENCRYPTED PASSWORD 'CAMBIA_ESTO';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE oilboards TO oilboards_user;"
```

### Paso 5 — Nginx
```bash
sudo apt install -y nginx
# (config del server block + proxy a Reverb se hace al desplegar; en dev puedes usar `php artisan serve` + `npm run dev`)
```

### Paso 6 — Crear el proyecto Laravel + Inertia + React
```bash
cd /var/www
composer create-project laravel/laravel oilboards
cd oilboards

# Starter kit oficial con React + Inertia + Tailwind (elige React al preguntar)
# (Laravel 12 ofrece starter kits; alternativamente Laravel Breeze con stack React/Inertia)
composer require laravel/breeze --dev
php artisan breeze:install react      # instala Inertia + React + Tailwind + auth

# Tiempo real (Reverb + Echo + pusher-js en el cliente)
php artisan install:broadcasting      # elige Laravel Reverb

# RBAC
composer require spatie/laravel-permission

# Dependencias del frontend
npm install
npm install echarts echarts-for-react recharts maplibre-gl \
  framer-motion react-grid-layout
```

### Paso 7 — Configurar `.env`
```env
APP_ENV=local
APP_DEBUG=true
DB_CONNECTION=pgsql
DB_DATABASE=oilboards
DB_USERNAME=oilboards_user
DB_PASSWORD=CAMBIA_ESTO

BROADCAST_CONNECTION=reverb
REVERB_APP_ID=...        # generados por install:broadcasting
REVERB_APP_KEY=...
REVERB_APP_SECRET=...

REDIS_HOST=127.0.0.1
QUEUE_CONNECTION=redis

ANTHROPIC_API_KEY=       # tu llave de la API de Claude
```

### Paso 8 — Levantar todo (3 procesos en desarrollo)
```bash
php artisan migrate
php artisan serve            # app Laravel (terminal 1)
php artisan reverb:start     # servidor WebSocket (terminal 2)
npm run dev                  # build/HMR del frontend (terminal 3)
php artisan queue:work       # (opcional) procesar jobs en background
```

> **Tip de productividad:** Laravel 12 trae `composer run dev` que corre varios de estos procesos a la vez. En producción se manejan con **Supervisor** (Reverb y `queue:work` como demonios permanentes) y **Certbot** para SSL (que ya conoces de cofound.mx).

> **Alternativa Docker:** si quieres un entorno 100% reproducible/portable (para migrar fácil a AWS/Azure después), usa **Laravel Sail** (`php artisan sail:install`) en vez del setup nativo. Más portable, un poco más pesado en el droplet.

---

## 6. Orden de construcción (qué teclear primero)

Mapeado a las fases de la biblia. **Se construye de abajo hacia arriba: primero los datos, al final la predicción.**

| # | Bloque | Por qué en este orden |
|---|---|---|
| 1 | **Auth + RBAC + multi-tenancy** (Organización → Activo → Pozo) | Todo cuelga de aquí. Sin el modelo de tenencia, nada más tiene sentido |
| 2 | **Modelo de datos + migraciones** (pozos, reportes, eventos, alertas) | El esqueleto sobre el que se programa todo lo demás |
| 3 | **Módulo 1: captura de Reporte Diario** (form + cálculo de volumen neto) | Es lo que SÍ resuelve un dolor real desde el día 1 |
| 4 | **Pipeline de bitácora de voz → Claude → JSON estructurado** | Tu diferenciador temprano y barato |
| 5 | **Módulo 3: KPIs ejecutivos** (Recharts/Tremor sobre los datos del Módulo 1) | Da el "wow" ejecutivo sin necesitar SCADA ni ML |
| 6 | **Salas de monitoreo + Reverb** (tiempo real, URLs por monitor) | El gancho visual; ya tienes datos que mostrar |
| 7 | **Módulo 2: integración SCADA** (OPC-UA/MQTT, TimescaleDB) | Requiere acceso al cliente; va en escalamiento |
| 8 | **Microservicio ML predictivo** (Python/FastAPI) | Hasta el final: necesita histórico acumulado de los pasos 1-7 |

> **Regla de oro:** el módulo de IA predictiva (paso 8) se programa para **consumir el histórico** que generan los pasos anteriores. No al revés. Construir la predicción antes de tener datos es construir sobre el aire.

---

## 7. Próximos documentos (lo que sigue)

Esta fundación habilita los specs detallados que un programador teclea directo. En orden:

1. **Modelo de datos completo** — tablas, campos, tipos, relaciones, multi-tenancy, índices. (Paso 1-2 de arriba.)
2. **Spec del Módulo 1** — formulario, fórmulas (volumen neto = bruto × (1 − BSW/100), GOR, etc.), validaciones, criterios de aceptación, lógica de sincronización offline.
3. **Specs de prompts de IA** — el de bitácora de voz → JSON y el de alerta numérica → recomendación (como hiciste para cofound.mx).
4. **Contratos de API / endpoints** por módulo.

> Cada uno se construye sobre este documento. Recomendación: cerrar el **modelo de datos** antes de teclear cualquier feature.

---

*Fin de la Fase 0. Con esto, el entorno y las decisiones de stack están listos para empezar a programar.*
