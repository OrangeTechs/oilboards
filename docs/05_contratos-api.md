# 🛢️ OILBOARDS — Doc 5: Contratos de API / Endpoints

**Especificación de rutas, payloads y respuestas · Para desarrollo backend y frontend**
Complemento de *Fase 0*, *Módulos*, *Modelo de Datos* y *Prompts de IA*.

| Campo | Valor |
|---|---|
| Versión | v0.1 |
| Base URL desarrollo | `http://localhost:8000/api/v1` |
| Base URL producción | `https://oilboards.com/api/v1` |
| Autenticación | Laravel Sanctum — Bearer Token en header `Authorization` |
| Formato | JSON en todas las requests y responses |
| Fase cubierta | MVP completo |

> **Convenciones de este documento:**
> - `🔒` = requiere autenticación (Bearer Token).
> - `🛡️` = requiere rol específico (se indica cuál).
> - Los campos marcados `*` son obligatorios en el request.
> - Todos los timestamps en **ISO 8601** (`2026-06-24T10:30:00Z`).
> - Todas las respuestas exitosas tienen estructura `{ "data": ..., "meta": ... }`.
> - Todos los errores tienen estructura `{ "error": { "code": "...", "message": "..." } }`.

---

## 0. Estructura de respuesta estándar

### Éxito — recurso único
```json
{
  "data": {
    "id": 1,
    "uuid": "a1b2c3d4-...",
    "..."  : "..."
  }
}
```

### Éxito — colección paginada
```json
{
  "data": [ { "..." }, { "..." } ],
  "meta": {
    "current_page": 1,
    "per_page": 25,
    "total": 142,
    "last_page": 6
  }
}
```

### Error estándar
```json
{
  "error": {
    "code": "WELL_NOT_FOUND",
    "message": "El pozo solicitado no existe o no pertenece a tu organización."
  }
}
```

### Códigos de error globales
| Código HTTP | `error.code` | Cuándo ocurre |
|---|---|---|
| 401 | `UNAUTHENTICATED` | Token ausente o inválido |
| 403 | `FORBIDDEN` | Rol insuficiente para la acción |
| 403 | `TENANT_MISMATCH` | El recurso no pertenece a la organización del usuario |
| 404 | `{RESOURCE}_NOT_FOUND` | Recurso no encontrado |
| 422 | `VALIDATION_ERROR` | Campos inválidos (incluye `errors: { campo: ["mensaje"] }`) |
| 429 | `RATE_LIMIT_EXCEEDED` | Demasiadas requests |
| 500 | `SERVER_ERROR` | Error interno |

---

## 1. Autenticación

### `POST /auth/login`
Inicia sesión y devuelve un token Sanctum.

**Request:**
```json
{
  "email": "ingeniero@carso.com.mx",
  "password": "secreto123"
}
```

**Response 200:**
```json
{
  "data": {
    "token": "1|abc123xyz...",
    "token_type": "Bearer",
    "user": {
      "id": 42,
      "uuid": "a1b2c3...",
      "name": "Carlos Mendoza",
      "email": "ingeniero@carso.com.mx",
      "role": "ingeniero",
      "locale": "es",
      "organization": {
        "id": 5,
        "name": "Grupo XYZ Energía",
        "plan": "enterprise"
      }
    }
  }
}
```

**Errores:** `401 INVALID_CREDENTIALS`, `403 ACCOUNT_SUSPENDED`.

---

### `POST /auth/logout` 🔒
Invalida el token actual.

**Response 200:**
```json
{ "data": { "message": "Sesión cerrada correctamente." } }
```

---

### `GET /auth/me` 🔒
Devuelve el usuario autenticado con su contexto completo (útil al recargar la app).

**Response 200:** mismo objeto `user` del login más `permissions: ["view_reports", ...]`.

---

### `POST /auth/password/change` 🔒
```json
{
  "current_password": "*",
  "new_password": "*",
  "new_password_confirmation": "*"
}
```
**Response 200:** `{ "data": { "message": "Contraseña actualizada." } }`

---

## 2. Organizaciones y usuarios (Admin)

### `GET /users` 🔒 🛡️`admin`
Lista usuarios de la organización.

**Query params:** `?role=operador&page=1&per_page=25`

**Response 200:** colección paginada de usuarios con `id, uuid, name, email, role, position, created_at`.

---

### `POST /users` 🔒 🛡️`admin`
Crea un usuario nuevo en la organización.

**Request:**
```json
{
  "name": "*",
  "email": "*",
  "password": "*",
  "role": "*",
  "position": "Superintendente de Pozos",
  "phone": "+52 993 123 4567",
  "locale": "es"
}
```

**Response 201:** el usuario creado.
**Errores:** `422` si el email ya existe en la organización.

---

### `PUT /users/{uuid}` 🔒 🛡️`admin`
Actualiza datos de un usuario. Mismo body que POST, todos los campos opcionales.

---

### `DELETE /users/{uuid}` 🔒 🛡️`admin`
Soft delete del usuario (no se puede borrar a sí mismo).

**Response 200:** `{ "data": { "message": "Usuario desactivado." } }`

---

## 3. Activos y pozos

### `GET /assets` 🔒
Lista los activos/campos de la organización.

**Response 200:**
```json
{
  "data": [
    {
      "id": 1,
      "uuid": "f3a9...",
      "name": "Activo Sureste",
      "region": "Tabasco",
      "latitude": 18.0,
      "longitude": -93.0,
      "wells_count": 12,
      "active_wells_count": 10
    }
  ]
}
```

---

### `POST /assets` 🔒 🛡️`admin`
Crea un nuevo activo/campo.

**Request:**
```json
{
  "name": "*",
  "region": "*",
  "latitude": 18.0,
  "longitude": -93.0,
  "timezone": "America/Mexico_City"
}
```

**Response 201:** el activo creado.

---

### `GET /assets/{uuid}/wells` 🔒
Lista los pozos de un activo.

**Query params:** `?status=Activo&lift_type=BEC&page=1`

**Response 200:**
```json
{
  "data": [
    {
      "id": 7,
      "uuid": "b2c3...",
      "name": "POZO-101H",
      "type": "Terrestre",
      "lift_type": "BEC",
      "current_status": "Activo",
      "latitude": 18.1,
      "longitude": -93.1,
      "last_report_at": "2026-06-24T06:00:00Z",
      "reported_today": true
    }
  ]
}
```

> `reported_today` — booleano que la UI usa para colorear en el Dashboard de Campo qué pozos ya reportaron.

---

### `POST /assets/{uuid}/wells` 🔒 🛡️`admin|ingeniero`
Crea un pozo nuevo en el activo.

**Request:**
```json
{
  "name": "*",
  "type": "*",
  "lift_type": "*",
  "latitude": 18.1,
  "longitude": -93.1,
  "choke_size": "16/64",
  "metadata": {}
}
```

**Response 201:** el pozo creado.

---

### `PUT /wells/{uuid}` 🔒 🛡️`admin|ingeniero`
Actualiza datos de un pozo (nombre, status, lift_type, etc.).

**Request:** campos opcionales del pozo.

---

### `POST /wells/{uuid}/assign-operator` 🔒 🛡️`admin`
Asigna un operador a un pozo.

**Request:**
```json
{ "user_id": 15 }
```

**Response 200:** `{ "data": { "message": "Operador asignado correctamente." } }`

---

### `DELETE /wells/{uuid}/assign-operator/{user_id}` 🔒 🛡️`admin`
Desasigna un operador de un pozo.

---

## 4. Reportes diarios (Módulo 1 — núcleo del MVP)

### `GET /wells/{uuid}/reports` 🔒
Lista reportes diarios de un pozo.

**Query params:** `?from=2026-06-01&to=2026-06-24&page=1`

**Response 200:** colección paginada de reportes con todos los campos del modelo `daily_reports`.

---

### `GET /wells/{uuid}/reports/{report_uuid}` 🔒
Detalle de un reporte específico incluyendo sus eventos de paro e incidentes HSE.

**Response 200:**
```json
{
  "data": {
    "id": 101,
    "uuid": "c4d5...",
    "well_uuid": "b2c3...",
    "report_date": "2026-06-24",
    "shift": "matutino",
    "gross_oil_bbl": 320.5,
    "bsw_pct": 18.0,
    "net_oil_bbl": 262.81,
    "gas_mmscfd": 0.42,
    "water_bbl": 70.0,
    "gor": 1312.5,
    "production_hours": 20.0,
    "diesel_consumed_l": null,
    "source": "voice",
    "status": "validated",
    "reported_by": {
      "id": 15,
      "name": "Antonio Pérez"
    },
    "downtime_events": [
      {
        "id": 55,
        "started_at": "2026-06-24T03:00:00Z",
        "ended_at": "2026-06-24T07:00:00Z",
        "duration_minutes": 240,
        "category": "mecanica",
        "root_cause": "Cambio de empaquetadura en cabezal"
      }
    ],
    "hse_incidents": [],
    "created_at": "2026-06-24T07:35:00Z"
  }
}
```

---

### `POST /wells/{uuid}/reports` 🔒 🛡️`operador|ingeniero|admin`
Crea o actualiza el reporte diario de un pozo.

> **Lógica:** si ya existe un reporte para `(well_id, report_date, shift)`, lo actualiza en lugar de crear duplicado (upsert). Esto permite que el operador corrija en el mismo turno sin duplicar.

**Request:**
```json
{
  "report_date": "2026-06-24",
  "shift": "matutino",
  "gross_oil_bbl": 320.5,
  "bsw_pct": 18.0,
  "gas_mmscfd": 0.42,
  "water_bbl": 70.0,
  "production_hours": 20.0,
  "diesel_consumed_l": null,
  "source": "manual",
  "downtime_events": [
    {
      "started_at": "2026-06-24T03:00:00Z",
      "ended_at": "2026-06-24T07:00:00Z",
      "category": "mecanica",
      "root_cause": "Cambio de empaquetadura"
    }
  ],
  "hse_incidents": []
}
```

> `net_oil_bbl` y `gor` NO se envían — los calcula la base de datos (columnas generadas).

**Response 201/200:** el reporte completo (con `net_oil_bbl` ya calculado).

**Errores:** `422 REPORT_ALREADY_VALIDATED` si el ingeniero ya lo validó y el operador intenta modificarlo.

---

### `POST /reports/{uuid}/validate` 🔒 🛡️`ingeniero|admin`
El ingeniero valida un reporte (cambia `status` de `synced` a `validated`). Acción inmutable.

**Response 200:** el reporte con `status: "validated"`.

---

### `GET /assets/{uuid}/reports/daily-summary` 🔒
Resumen consolidado del activo para el día (suma de todos los pozos). Base del Dashboard de Campo y los KPIs Ejecutivos.

**Query params:** `?date=2026-06-24`

**Response 200:**
```json
{
  "data": {
    "date": "2026-06-24",
    "asset_uuid": "f3a9...",
    "total_gross_oil_bbl": 3840.5,
    "total_net_oil_bbl": 3149.2,
    "total_gas_mmscfd": 5.04,
    "total_water_bbl": 840.0,
    "total_production_hours": 240.0,
    "uptime_pct": 83.3,
    "total_npt_minutes": 960,
    "wells_reported": 10,
    "wells_pending": 2,
    "wells_active": 10,
    "wells_down": 2,
    "cost_per_barrel_usd": null
  }
}
```

---

## 5. Bitácoras de voz (Módulo 1)

### `POST /wells/{uuid}/voice-logs` 🔒 🛡️`operador|ingeniero|admin`
Sube un audio para transcripción y estructuración por IA.

**Request:** `multipart/form-data`
```
audio_file: [archivo .m4a / .mp3 / .wav — máx 25 MB]
shift: "matutino"
report_date: "2026-06-24"
```

**Response 202 (Accepted):**
```json
{
  "data": {
    "voice_log_uuid": "e5f6...",
    "status": "transcribing",
    "message": "Audio recibido. La transcripción estará lista en unos segundos."
  }
}
```

> **202, no 201.** El procesamiento es asíncrono (Job de cola). El cliente hace polling o escucha por WebSocket.

---

### `GET /voice-logs/{uuid}` 🔒
Consulta el estado y resultado de una bitácora de voz.

**Response 200:**
```json
{
  "data": {
    "uuid": "e5f6...",
    "status": "structured",
    "transcript": "Buenos días, soy el Toño...",
    "structured_json": { "...": "..." },
    "confidence": "high",
    "created_at": "2026-06-24T07:30:00Z"
  }
}
```

> `status`: `transcribing` → `structured` → `validated`. El frontend hace polling cada 3 segundos hasta que `status !== "transcribing"`, o escucha el evento Reverb `VoiceLogProcessed`.

---

### `POST /voice-logs/{uuid}/apply` 🔒 🛡️`operador|ingeniero|admin`
El operador/ingeniero revisa el JSON estructurado, lo confirma (con posibles ediciones) y lo aplica como Reporte Diario.

**Request:**
```json
{
  "structured_json": { "...campos editados si aplica..." }
}
```

**Response 200:** el `daily_report` creado a partir del JSON.

---

## 6. Paros y NPT

### `POST /wells/{uuid}/downtime-events` 🔒 🛡️`operador|ingeniero|admin`
Registra un paro manualmente (fuera del flujo de reporte diario).

**Request:**
```json
{
  "started_at": "*",
  "ended_at": null,
  "category": "*",
  "root_cause": "*",
  "daily_report_id": null
}
```

**Response 201:** el evento creado.

---

### `PATCH /downtime-events/{id}/close` 🔒 🛡️`operador|ingeniero|admin`
Cierra un paro en curso (establece `ended_at`).

**Request:**
```json
{ "ended_at": "2026-06-24T09:00:00Z" }
```

---

### `GET /assets/{uuid}/downtime-events` 🔒
Lista paros del activo con filtros.

**Query params:** `?from=2026-06-01&to=2026-06-24&category=mecanica&well_uuid=b2c3...`

**Response 200:** colección paginada de paros con totales de NPT.

---

## 7. Alertas (Módulo 1 MVP → Escalamiento)

### `GET /alert-rules` 🔒 🛡️`ingeniero|admin`
Lista las reglas de alerta configuradas para la organización.

**Response 200:** colección de reglas con `metric, operator, threshold, severity, is_active`.

---

### `POST /alert-rules` 🔒 🛡️`ingeniero|admin`
Crea una regla de umbral.

**Request:**
```json
{
  "asset_uuid": "f3a9...",
  "well_uuid": null,
  "metric": "net_oil_bbl",
  "operator": "<",
  "threshold": 200.0,
  "severity": "warning",
  "is_active": true
}
```

**Métricas disponibles en MVP:** `net_oil_bbl`, `production_hours`, `bsw_pct`, `npt_minutes_today`.

**Response 201:** la regla creada.

---

### `PUT /alert-rules/{id}` 🔒 🛡️`ingeniero|admin`
Actualiza una regla (ej. cambiar umbral o desactivar).

---

### `GET /alerts` 🔒
Lista alertas de la organización.

**Query params:** `?status=open&severity=critical&well_uuid=b2c3...&page=1`

**Response 200:**
```json
{
  "data": [
    {
      "uuid": "g7h8...",
      "well": { "uuid": "b2c3...", "name": "POZO-101H" },
      "severity": "critical",
      "urgency": "inmediata",
      "title": "Riesgo de bloqueo por gas — POZO-101H",
      "diagnosis": "La caída del 12% en THP combinada con...",
      "recommendation": "Revisar frecuencia del variador...",
      "disclaimer": "⚠️ Esta recomendación es generada por un sistema de apoyo...",
      "status": "open",
      "source": "threshold",
      "triggered_at": "2026-06-24T03:15:00Z",
      "data_confidence": "medium"
    }
  ]
}
```

---

### `PATCH /alerts/{uuid}/acknowledge` 🔒 🛡️`ingeniero|admin`
El ingeniero acusa recibo de la alerta.

**Response 200:** la alerta con `status: "acknowledged"`.

---

### `PATCH /alerts/{uuid}/resolve` 🔒 🛡️`ingeniero|admin`
Cierra la alerta.

**Request:**
```json
{ "resolution_note": "Se ajustó la frecuencia del variador a 48 Hz. Presión estabilizada." }
```

**Response 200:** la alerta con `status: "resolved"`.

---

## 8. KPIs ejecutivos y regulatorio (Módulo 3)

### `GET /assets/{uuid}/kpis` 🔒 🛡️`ingeniero|admin`
KPIs consolidados del activo para el período. Base del Módulo 3.

**Query params:** `?from=2026-06-01&to=2026-06-24`

**Response 200:**
```json
{
  "data": {
    "period": { "from": "2026-06-01", "to": "2026-06-24" },
    "production": {
      "total_net_oil_bbl": 72450.0,
      "daily_average_bbl": 3018.75,
      "peak_day": "2026-06-18",
      "peak_value_bbl": 3520.0
    },
    "uptime": {
      "global_pct": 87.3,
      "total_npt_hours": 72.4
    },
    "gas": {
      "total_mmscfd": 118.0,
      "flared_pct": 4.2,
      "commercialized_pct": 95.8
    },
    "costs": {
      "opex_per_barrel_usd": null
    },
    "wells_breakdown": [
      {
        "well_uuid": "b2c3...",
        "well_name": "POZO-101H",
        "net_oil_bbl": 7800.0,
        "uptime_pct": 91.2
      }
    ]
  }
}
```

---

### `GET /assets/{uuid}/production-targets` 🔒
Lista las metas del plan (CNE/SENER) del activo.

**Query params:** `?year=2026`

**Response 200:** array de metas por mes con `period_month, target_net_oil_bbl`.

---

### `POST /assets/{uuid}/production-targets` 🔒 🛡️`admin`
Carga las metas del período (normalmente una vez al año).

**Request:**
```json
{
  "targets": [
    { "period_month": "2026-07-01", "target_net_oil_bbl": 93000.0 },
    { "period_month": "2026-08-01", "target_net_oil_bbl": 96000.0 }
  ]
}
```

---

### `GET /assets/{uuid}/regulatory-compliance` 🔒 🛡️`ingeniero|admin`
Comparativo producción real vs. meta comprometida ante CNE/SENER.

**Query params:** `?year=2026`

**Response 200:**
```json
{
  "data": {
    "months": [
      {
        "month": "2026-06",
        "target_bbl": 90000.0,
        "actual_bbl": 86420.0,
        "compliance_pct": 96.0,
        "status": "warning"
      }
    ]
  }
}
```

> `status`: `on_track` (≥95%) / `warning` (80-95%) / `at_risk` (<80%).

---

### `GET /assets/{uuid}/fiscalization` 🔒 🛡️`ingeniero|admin`
Balance entre producción y volumen fiscalizado/entregado a Pemex.

**Query params:** `?from=2026-06-01&to=2026-06-24`

---

### `GET /wells/{uuid}/decline-curve` 🔒 🛡️`ingeniero|admin`
Serie de tiempo de producción neta del pozo para graficar la curva de declinación.

**Query params:** `?from=2026-01-01&to=2026-06-24&granularity=daily`

**Response 200:**
```json
{
  "data": {
    "well_uuid": "b2c3...",
    "granularity": "daily",
    "series": [
      { "date": "2026-01-01", "net_oil_bbl": 350.0 },
      { "date": "2026-01-02", "net_oil_bbl": 347.5 }
    ]
  }
}
```

> Esta es la serie que alimenta ECharts para la curva de declinación.

---

## 9. Exportación de reportes

### `POST /assets/{uuid}/reports/export` 🔒 🛡️`ingeniero|admin`
Genera el reporte consolidado exportable (PDF o Excel).

**Request:**
```json
{
  "format": "pdf",
  "from": "2026-06-01",
  "to": "2026-06-24",
  "type": "daily_operations"
}
```

**`type` disponibles en MVP:** `daily_operations` / `npt_summary` / `regulatory_cne`.

**Response 202 (Accepted):**
```json
{
  "data": {
    "export_uuid": "k1l2...",
    "status": "generating",
    "message": "El reporte se está generando. Recibirás una notificación cuando esté listo."
  }
}
```

---

### `GET /exports/{uuid}` 🔒
Consulta el estado de un export.

**Response 200:**
```json
{
  "data": {
    "uuid": "k1l2...",
    "status": "ready",
    "download_url": "https://oilboards.com/exports/k1l2.../download",
    "expires_at": "2026-06-25T10:00:00Z"
  }
}
```

---

### `GET /exports/{uuid}/download` 🔒
Descarga el archivo generado (stream del PDF/Excel).

---

## 10. Asistente Virtual (Módulo 3)

### `POST /assets/{uuid}/assistant/chat` 🔒 🛡️`ingeniero|admin`
Envía un mensaje al asistente virtual con contexto del activo.

**Request:**
```json
{
  "message": "*",
  "conversation_history": [
    { "role": "user", "content": "¿Cuál es el procedimiento para un gas-lock en BEC?" },
    { "role": "assistant", "content": "Según el manual de la bomba BEC instalada en el activo..." }
  ]
}
```

> `conversation_history` se envía completo desde el cliente para mantener el contexto multi-turn. El servidor no guarda el historial de chat (stateless) — el cliente lo gestiona.

**Response 200:**
```json
{
  "data": {
    "reply": "Según el manual de la BEC (sección 4.3), el procedimiento ante un gas-lock es...",
    "disclaimer": "Esta información debe validarse con el personal calificado y los procedimientos operativos del activo antes de ejecutarse.",
    "tokens_used": 1840
  }
}
```

---

## 11. Sincronización offline

### `POST /sync` 🔒 🛡️`operador|ingeniero|admin`
Endpoint de sincronización masiva para dispositivos que estuvieron offline. Acepta un batch de reportes y eventos capturados sin conexión.

**Request:**
```json
{
  "device_id": "iphone-antonio-abc123",
  "records": [
    {
      "type": "daily_report",
      "well_uuid": "b2c3...",
      "local_id": "local-001",
      "payload": { "...campos del reporte..." }
    },
    {
      "type": "downtime_event",
      "well_uuid": "b2c3...",
      "local_id": "local-002",
      "payload": { "...campos del paro..." }
    }
  ]
}
```

**Response 200:**
```json
{
  "data": {
    "synced": 2,
    "failed": 0,
    "results": [
      {
        "local_id": "local-001",
        "status": "created",
        "server_uuid": "c4d5..."
      },
      {
        "local_id": "local-002",
        "status": "created",
        "server_uuid": "d5e6..."
      }
    ]
  }
}
```

> **Resolución de conflictos:** si el servidor ya tiene un reporte para `(well_id, report_date, shift)` y llega otro del batch offline, gana el del servidor (el más reciente validado). El resultado del record problemático devuelve `"status": "conflict_skipped"` con el `server_uuid` del existente para que el cliente muestre un aviso.

---

## 12. WebSocket — Canales y eventos (Reverb)

No son endpoints HTTP, pero el frontend los necesita igual de definidos.

### Canales

| Canal | Tipo | Acceso | Descripción |
|---|---|---|---|
| `organization.{org_id}` | Privado | Todos los roles | Alertas globales, actualizaciones de activo |
| `asset.{asset_id}` | Privado | Ingeniero, Admin | Actualizaciones en tiempo real del campo |
| `well.{well_id}` | Privado | Operador (sus pozos), Ingeniero, Admin | Cambios de status, telemetría, alertas del pozo |
| `user.{user_id}` | Privado | El usuario mismo | Notificaciones personales (ej. export listo) |

> Los canales privados se autentican vía `POST /broadcasting/auth` (ruta que Laravel genera automáticamente con Reverb).

### Eventos

| Evento | Canal | Payload | Cuándo se emite |
|---|---|---|---|
| `AlertCreated` | `asset.{id}` | `{ alert_uuid, title, severity, well_name }` | Al crear una alerta nueva |
| `AlertAcknowledged` | `asset.{id}` | `{ alert_uuid, acknowledged_by }` | Al acusar recibo |
| `WellStatusChanged` | `asset.{id}` | `{ well_uuid, new_status, changed_at }` | Al cambiar status del pozo |
| `ReportSubmitted` | `asset.{id}` | `{ well_uuid, report_date, shift }` | Al guardar un reporte diario |
| `VoiceLogProcessed` | `user.{id}` | `{ voice_log_uuid, status, confidence }` | Al terminar transcripción + estructuración |
| `ExportReady` | `user.{id}` | `{ export_uuid, download_url }` | Al generar un export exitosamente |
| `DailySummaryUpdated` | `asset.{id}` | `{ date, total_net_oil_bbl, wells_reported }` | Al actualizarse el resumen del día |

---

## 13. Versionado y rate limiting

- **Versión:** todas las rutas bajo `/api/v1/`. Cuando haya cambios breaking, se agrega `/api/v2/` en paralelo.
- **Rate limiting:** 60 requests/minuto por token por defecto (configurable en `RouteServiceProvider`). El endpoint `POST /sync` tiene límite propio más alto (10 requests/minuto, pero cada una puede traer un batch de hasta 50 registros).
- **Tamaño máximo de body:** 10 MB por defecto; `POST /wells/{uuid}/voice-logs` acepta hasta 25 MB (configurar en Nginx y PHP).

---

## 14. Rutas en `routes/api.php` (esquema Laravel)

```php
Route::prefix('v1')->group(function () {

    // Auth (sin middleware)
    Route::post('/auth/login',           [AuthController::class, 'login']);

    // Rutas autenticadas
    Route::middleware('auth:sanctum')->group(function () {

        Route::post('/auth/logout',              [AuthController::class, 'logout']);
        Route::get('/auth/me',                   [AuthController::class, 'me']);
        Route::post('/auth/password/change',     [AuthController::class, 'changePassword']);

        // Usuarios (admin)
        Route::apiResource('users', UserController::class);

        // Activos y pozos
        Route::apiResource('assets', AssetController::class);
        Route::get('/assets/{asset}/wells',      [WellController::class, 'index']);
        Route::post('/assets/{asset}/wells',     [WellController::class, 'store']);
        Route::put('/wells/{well}',              [WellController::class, 'update']);
        Route::post('/wells/{well}/assign-operator',              [WellController::class, 'assignOperator']);
        Route::delete('/wells/{well}/assign-operator/{user}',     [WellController::class, 'unassignOperator']);

        // Reportes diarios
        Route::get('/wells/{well}/reports',           [DailyReportController::class, 'index']);
        Route::post('/wells/{well}/reports',          [DailyReportController::class, 'store']);
        Route::get('/wells/{well}/reports/{report}',  [DailyReportController::class, 'show']);
        Route::post('/reports/{report}/validate',     [DailyReportController::class, 'validate']);
        Route::get('/assets/{asset}/reports/daily-summary', [DailyReportController::class, 'dailySummary']);

        // Voz / NLP
        Route::post('/wells/{well}/voice-logs',       [VoiceLogController::class, 'store']);
        Route::get('/voice-logs/{voiceLog}',          [VoiceLogController::class, 'show']);
        Route::post('/voice-logs/{voiceLog}/apply',   [VoiceLogController::class, 'apply']);

        // Paros / NPT
        Route::post('/wells/{well}/downtime-events',        [DowntimeEventController::class, 'store']);
        Route::patch('/downtime-events/{event}/close',      [DowntimeEventController::class, 'close']);
        Route::get('/assets/{asset}/downtime-events',       [DowntimeEventController::class, 'index']);

        // Alertas
        Route::apiResource('alert-rules', AlertRuleController::class)->except(['show']);
        Route::get('/alerts',                         [AlertController::class, 'index']);
        Route::patch('/alerts/{alert}/acknowledge',   [AlertController::class, 'acknowledge']);
        Route::patch('/alerts/{alert}/resolve',       [AlertController::class, 'resolve']);

        // KPIs y regulatorio
        Route::get('/assets/{asset}/kpis',                    [KpiController::class, 'index']);
        Route::get('/assets/{asset}/production-targets',      [ProductionTargetController::class, 'index']);
        Route::post('/assets/{asset}/production-targets',     [ProductionTargetController::class, 'store']);
        Route::get('/assets/{asset}/regulatory-compliance',   [RegulatoryController::class, 'compliance']);
        Route::get('/assets/{asset}/fiscalization',           [RegulatoryController::class, 'fiscalization']);
        Route::get('/wells/{well}/decline-curve',             [WellController::class, 'declineCurve']);

        // Exportación
        Route::post('/assets/{asset}/reports/export',  [ExportController::class, 'store']);
        Route::get('/exports/{export}',                [ExportController::class, 'show']);
        Route::get('/exports/{export}/download',       [ExportController::class, 'download']);

        // Asistente virtual
        Route::post('/assets/{asset}/assistant/chat',  [AssistantController::class, 'chat']);

        // Sincronización offline
        Route::post('/sync',                           [SyncController::class, 'sync']);
    });
});
```

---

## 15. Checklist de implementación

- [ ] Instalar y configurar **Laravel Sanctum** (ya viene con Laravel 12 + Breeze).
- [ ] Crear todos los **Controllers** listados en §14.
- [ ] Crear **Form Requests** de validación por cada endpoint (no validar en el Controller).
- [ ] Crear **API Resources** de Eloquent para cada modelo (transforman el modelo en el JSON de respuesta).
- [ ] Implementar el **Global Scope de tenant** antes de cualquier Controller — sin esto todos los datos se mezclan entre clientes.
- [ ] Implementar middleware de **autorización por rol** en las rutas que lo requieren.
- [ ] Registrar los **canales de Reverb** en `routes/channels.php` con sus callbacks de autenticación.
- [ ] Emitir los **eventos de Reverb** desde los lugares correctos (Observers, Jobs, Controllers).
- [ ] Configurar rate limiting en `RouteServiceProvider`.
- [ ] Configurar el límite de 25 MB para uploads de audio en Nginx y `php.ini`.
- [ ] Seeder de datos demo (1 organización, 1 activo, 5 pozos, reportes de prueba).
- [ ] **Tests de feature** para los endpoints críticos: login, crear reporte, sync offline, exportar.

---

*Fin del Doc 5. Con los endpoints definidos, el frontend sabe exactamente qué llamar y el backend sabe exactamente qué construir. No hay margen para que uno asuma lo que el otro hace.*
