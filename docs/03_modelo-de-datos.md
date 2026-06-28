# 🛢️ OILBOARDS — Modelo de Datos

**Esquema de base de datos · Para migraciones y desarrollo**
Complemento de *La Biblia*, *Fase 0 · Fundación Técnica* y *Mapa Detallado del Dashboard*.

| Campo | Valor |
|---|---|
| Versión | v0.1 |
| Motor | PostgreSQL 16/17 (+ TimescaleDB para telemetría) |
| ORM | Laravel 12 / Eloquent |
| Propósito | Definir cada tabla, campo, tipo, relación y índice que soporta el mapa de pantallas |

> **Cómo usar este documento.** Cada tabla incluye: columnas (tipo PostgreSQL), llaves, notas y la **fase** (`MVP` / `Escalamiento` / `Salas`). Al final de cada capa indico **qué pantallas la consumen** (trazabilidad con el doc de dashboard). Lo marcado `⭐` es recomendación mía.

---

## 1. Convenciones y decisiones de diseño

Estas reglas aplican a TODO el esquema:

- **PK:** `id` `bigint` autoincremental (default de Laravel) en todas las tablas.
- **Referencia pública:** las entidades que aparecen en URLs (`assets`, `wells`, `daily_reports`, `alerts`) llevan además una columna `uuid` (tipo `uuid`, índice único) para no exponer IDs secuenciales enumerables.
- **Timestamps:** todas llevan `created_at` y `updated_at` (default de Laravel).
- **Soft deletes:** `deleted_at` solo en entidades de configuración (assets, wells, users, equipment). Los registros operativos (reportes, paros, telemetría, alertas, auditoría) **NO se borran** — son históricos.
- **Multi-tenancy (clave):** modelo **row-level** — toda tabla con datos de cliente lleva `organization_id`. Un **Global Scope** de Eloquent fuerza el filtro por organización en cada query automáticamente. Esto materializa la promesa de "aislamiento de datos" de forma simple y robusta.
  - `⭐` Para un cliente enterprise muy sensible (tipo operador grande) se puede ofrecer **base de datos dedicada por tenant** como upgrade. Para el MVP y la mayoría, row-level es lo correcto. No sobre-ingenierar.
- **Inmutabilidad:** `downtime_events`, `voice_logs`, `audit_logs` y `telemetry_readings` son **append-only**. Se recomienda un trigger de PostgreSQL que bloquee `UPDATE`/`DELETE`, además de no exponer endpoints de edición. (Es el "respaldo inmutable" que se vende para disputas con Pemex.)
- **`on delete`:** las FK de configuración usan `restrict` (no dejar borrar un pozo con reportes); las pivote usan `cascade`.
- **Enums:** se modelan como columnas `varchar` + validación en la app (más flexibles que los enums nativos de PG para evolucionar).

---

## 2. Diagrama de relaciones (visión general)

```
organizations (TENANT RAÍZ)
│
├──< users >──(Spatie roles/permissions)
│      │
│      └──< well_user (asignación operador↔pozo)
│
├──< assets (campos/activos)
│      │
│      ├──< wells (pozos)
│      │      ├──< equipment (BEC/BM) ──< manuals
│      │      ├──< daily_reports ──< downtime_events
│      │      │                   ├──< voice_logs
│      │      │                   ├──< hse_incidents
│      │      │                   └──< chemical_injections
│      │      ├──< telemetry_readings  (TimescaleDB)
│      │      ├──< alerts
│      │      └──< well_status_history
│      │
│      ├──< production_targets (metas CNE/plan)
│      ├──< fiscalization_records (balance Pemex)
│      └──< monitoring_rooms ──< screens / layout_profiles
│
├──< alert_rules (umbrales configurables)
├──< ai_interactions (log de llamadas a Claude)
├──< sync_logs (estado de sincronización offline)
└──< audit_logs (bitácora inmutable con hash encadenado)
```

---

## 3. Capa de tenencia y acceso

### `organizations` — el tenant (empresa cliente) · MVP
| Columna | Tipo | Notas |
|---|---|---|
| id | bigint PK | |
| uuid | uuid | único |
| name | varchar | ej. "Grupo XYZ Energía" |
| rfc | varchar(13) | nullable |
| plan | varchar | `trial` / `enterprise` |
| status | varchar | `active` / `suspended` (mora → bloqueo de acceso) |
| settings | jsonb | preferencias (idioma default, zona horaria) |
| created_at, updated_at, deleted_at | timestamp | |

### `users` — usuarios · MVP
| Columna | Tipo | Notas |
|---|---|---|
| id | bigint PK | |
| organization_id | bigint FK → organizations | tenant |
| name | varchar | |
| email | varchar | único |
| password | varchar | hash |
| phone | varchar | nullable |
| position | varchar | puesto (Superintendente, Ing. Producción…) |
| locale | varchar(5) | `es` / `en` |
| last_login_at | timestamp | nullable |
| created_at, updated_at, deleted_at | timestamp | |

> **Roles/permisos:** se usan las tablas de **Spatie Laravel Permission** (`roles`, `permissions`, `model_has_roles`, `role_has_permissions`, `model_has_permissions`). Roles base: `operador`, `ingeniero`, `admin`. Los permisos se asignan por rol. No redefinir estas tablas — las crea el paquete.

### `assets` — campos / activos · MVP
| Columna | Tipo | Notas |
|---|---|---|
| id | bigint PK | |
| uuid | uuid | único |
| organization_id | bigint FK → organizations | |
| name | varchar | ej. "Activo Sureste / Bloque X" |
| region | varchar | Terrestre / Marino; estado |
| latitude, longitude | decimal(10,7) | centro del campo (para el mapa) |
| timezone | varchar | default `America/Mexico_City` |
| created_at, updated_at, deleted_at | timestamp | |

### `wells` — pozos · MVP
| Columna | Tipo | Notas |
|---|---|---|
| id | bigint PK | |
| uuid | uuid | único |
| organization_id | bigint FK | denormalizado para scope rápido |
| asset_id | bigint FK → assets | |
| name | varchar | ej. "POZO-101H" |
| type | varchar | Terrestre / Marino |
| lift_type | varchar | Natural / Gas Lift / BEC / BM |
| current_status | varchar | Activo / Cerrado / Reparación / Estimulación |
| latitude, longitude | decimal(10,7) | para el pin en el mapa |
| choke_size | varchar | nullable |
| metadata | jsonb | profundidad, terminación, etc. |
| created_at, updated_at, deleted_at | timestamp | |

**Índices:** `(asset_id)`, `(organization_id, current_status)`.

### `well_user` — asignación operador ↔ pozo (pivote) · MVP
| Columna | Tipo | Notas |
|---|---|---|
| id | bigint PK | |
| well_id | bigint FK → wells | |
| user_id | bigint FK → users | |
| created_at, updated_at | timestamp | |

> **Crítico para el RBAC:** un Operador solo ve/captura los pozos que tiene asignados aquí. El Global Scope del rol Operador filtra por esta tabla.

### `equipment` — equipos de levantamiento (BEC/BM) · MVP
| Columna | Tipo | Notas |
|---|---|---|
| id | bigint PK | |
| organization_id | bigint FK | |
| well_id | bigint FK → wells | |
| type | varchar | BEC / BM / Válvula / Generador |
| manufacturer | varchar | |
| model | varchar | |
| specs | jsonb | rangos nominales (Hz, RPM, amperaje) → base para alertas |
| installed_at | date | nullable |
| created_at, updated_at, deleted_at | timestamp | |

### `manuals` — manuales para RAG (Asistente IA) · MVP
| Columna | Tipo | Notas |
|---|---|---|
| id | bigint PK | |
| organization_id | bigint FK | |
| asset_id | bigint FK → assets | |
| equipment_id | bigint FK → equipment | nullable |
| title | varchar | |
| file_path | varchar | PDF en storage |
| status | varchar | `pending` / `indexed` (procesado para RAG) |
| created_at, updated_at | timestamp | |

> `⭐` Para el RAG real, el contenido se trocea (chunks) y se vectoriza. Si quieres búsqueda semántica nativa en Postgres, usar la extensión **pgvector** con una tabla `manual_chunks (manual_id, content, embedding vector)`. Fase Escalamiento.

**Pantallas que consume esta capa:** Onboarding/Alta de Activo y Pozos · Gestión de Usuarios y Roles · Selector de Activo · todo el RBAC.

---

## 4. Capa operativa / captura (Módulo 1)

### `daily_reports` — reporte diario por pozo · MVP · **núcleo**
| Columna | Tipo | Notas |
|---|---|---|
| id | bigint PK | |
| uuid | uuid | único |
| organization_id | bigint FK | |
| well_id | bigint FK → wells | |
| reported_by | bigint FK → users | operador que capturó |
| report_date | date | día del cierre |
| shift | varchar | nullable (matutino/vespertino/nocturno) |
| gross_oil_bbl | decimal(12,2) | aceite bruto (bbl/d) |
| bsw_pct | decimal(5,2) | % agua y sedimento |
| net_oil_bbl | decimal(12,2) | **columna generada:** `gross_oil_bbl * (1 - bsw_pct/100)` |
| gas_mmscfd | decimal(12,3) | gas asociado (MMpcd) |
| water_bbl | decimal(12,2) | agua producida |
| gor | decimal(12,2) | gas-oil ratio (calculable) |
| production_hours | decimal(4,1) | horas en producción (uptime del día) |
| diesel_consumed_l | decimal(12,2) | nullable |
| source | varchar | `manual` / `voice` / `scada` |
| status | varchar | `draft` / `synced` / `validated` |
| created_at, updated_at | timestamp | |

**Índices:** `unique(well_id, report_date, shift)` (un reporte por pozo/día/turno), `(organization_id, report_date)`.

> **Volumen neto** como columna generada (`GENERATED ALWAYS AS ... STORED` en PostgreSQL) garantiza que el cálculo nunca se desincronice. Es el cálculo central del producto.

### `downtime_events` — paros / NPT · MVP · **append-only**
| Columna | Tipo | Notas |
|---|---|---|
| id | bigint PK | |
| organization_id | bigint FK | |
| well_id | bigint FK → wells | |
| daily_report_id | bigint FK → daily_reports | nullable |
| reported_by | bigint FK → users | |
| started_at | timestamp | inicio del paro |
| ended_at | timestamp | nullable (paro en curso) |
| duration_minutes | int | calculable |
| category | varchar | `mecanica` / `clima` / `mantenimiento` / `electrica` |
| root_cause | text | |
| created_at | timestamp | sin updated_at: inmutable |

**Índices:** `(well_id, started_at)`, `(organization_id, category)`.

### `voice_logs` — bitácoras de voz / NLP · MVP · **append-only**
| Columna | Tipo | Notas |
|---|---|---|
| id | bigint PK | |
| organization_id | bigint FK | |
| well_id | bigint FK → wells | |
| user_id | bigint FK → users | |
| audio_path | varchar | archivo de audio |
| transcript | text | salida de Whisper/Deepgram |
| structured_json | jsonb | salida estructurada por Claude |
| status | varchar | `transcribing` / `structured` / `validated` |
| created_at | timestamp | |

### `hse_incidents` — eventos de seguridad y ambiente · MVP
| Columna | Tipo | Notas |
|---|---|---|
| id | bigint PK | |
| organization_id | bigint FK | |
| well_id | bigint FK → wells | nullable (puede ser de campo) |
| reported_by | bigint FK → users | |
| type | varchar | derrame / condición de riesgo / incidente |
| severity | varchar | bajo / medio / alto |
| description | text | |
| occurred_at | timestamp | |
| created_at, updated_at | timestamp | |

### `chemical_injections` — dosificación química · MVP (captura) / Escalamiento (SCADA)
| Columna | Tipo | Notas |
|---|---|---|
| id | bigint PK | |
| organization_id | bigint FK | |
| well_id | bigint FK → wells | |
| chemical_type | varchar | demulsificante / inhibidor de corrosión |
| volume_gal | decimal(10,2) | galones por día |
| recorded_at | date | |
| created_at, updated_at | timestamp | |

**Pantallas que consume esta capa:** Formulario de Reporte Diario · Consola de Audio/NLP · Bitácora de Paros y NPT · Inventario Operativo (HSE/Energía) · Dashboard de Campo.

---

## 5. Capa de telemetría (Módulo 2 · Escalamiento)

### `telemetry_readings` — lecturas SCADA · **hypertable TimescaleDB** · Escalamiento
| Columna | Tipo | Notas |
|---|---|---|
| time | timestamptz | partición temporal (hypertable) |
| organization_id | bigint | |
| well_id | bigint FK → wells | |
| metric | varchar | `thp` / `flp` / `temp_cabezal` / `bhp` / `hz` / `rpm` / `amp` |
| value | double precision | |

> **No es una tabla normal.** Es una **hypertable** de TimescaleDB particionada por `time`, optimizada para millones de inserts. Llave de consulta típica: `(well_id, metric, time)`. Se le aplican políticas de **retención** y **agregados continuos** (rollups por hora/día) para que las gráficas de rangos largos sean instantáneas.

**Índices/optimización:** índice compuesto `(well_id, metric, time DESC)`; continuous aggregates para vistas de 24h/30d.

### `well_status_history` — histórico de cambios de status · Escalamiento
| Columna | Tipo | Notas |
|---|---|---|
| id | bigint PK | |
| organization_id | bigint FK | |
| well_id | bigint FK → wells | |
| status | varchar | Activo / Cerrado / Reparación / Estimulación / Alerta |
| changed_at | timestamp | |
| source | varchar | manual / scada / ia |

**Pantallas:** Matriz de Estatus de Pozos · Monitor SCADA en Vivo · Diagnóstico de Motores · Dosificación Química · Mapa del campo.

---

## 6. Capa de alertas

### `alert_rules` — umbrales configurables · MVP
| Columna | Tipo | Notas |
|---|---|---|
| id | bigint PK | |
| organization_id | bigint FK | |
| asset_id | bigint FK → assets | nullable (puede ser global) |
| well_id | bigint FK → wells | nullable |
| metric | varchar | `thp`, `production_hours`, `net_oil_bbl`… |
| operator | varchar | `<`, `>`, `drop_pct`… |
| threshold | double precision | |
| severity | varchar | info / warning / critical |
| is_active | boolean | |
| created_by | bigint FK → users | |
| created_at, updated_at | timestamp | |

> **Habilita alertas útiles desde el MVP**, sin esperar al ML predictivo. Es lo que hace el producto "inteligente" antes de tener histórico.

### `alerts` — instancias de alerta · MVP (umbral) / Escalamiento (ML)
| Columna | Tipo | Notas |
|---|---|---|
| id | bigint PK | |
| uuid | uuid | único |
| organization_id | bigint FK | |
| well_id | bigint FK → wells | |
| alert_rule_id | bigint FK → alert_rules | nullable (null si vino de ML) |
| source | varchar | `threshold` / `ml` / `manual` |
| severity | varchar | info / warning / critical |
| title | varchar | |
| diagnosis | text | redactado por Claude (Capa 2) |
| recommendation | text | **con disclaimer obligatorio de validación humana** |
| status | varchar | `open` / `acknowledged` / `resolved` |
| acknowledged_by | bigint FK → users | nullable |
| triggered_at | timestamp | |
| resolved_at | timestamp | nullable |
| created_at, updated_at | timestamp | |

**Pantallas:** Centro de Notificaciones de IA (barra superior) · Configuración de Alertas · Consola Central de Alertas (sala) · Matriz de Pozos (color amarillo).

---

## 7. Capa de dirección / estrategia (Módulo 3)

### `production_targets` — metas (plan CNE/SENER) · MVP
| Columna | Tipo | Notas |
|---|---|---|
| id | bigint PK | |
| organization_id | bigint FK | |
| asset_id | bigint FK → assets | |
| well_id | bigint FK → wells | nullable (meta por pozo o por activo) |
| period_month | date | mes objetivo |
| target_net_oil_bbl | decimal(14,2) | meta comprometida |
| created_at, updated_at | timestamp | |

### `fiscalization_records` — balance de venta/entrega Pemex · MVP
| Columna | Tipo | Notas |
|---|---|---|
| id | bigint PK | |
| organization_id | bigint FK | |
| asset_id | bigint FK → assets | |
| record_date | date | |
| produced_bbl | decimal(14,2) | volumen producido |
| delivered_bbl | decimal(14,2) | volumen fiscalizado/entregado |
| difference_bbl | decimal(14,2) | columna generada |
| created_at, updated_at | timestamp | |

> **Curva de declinación / análisis de yacimiento:** NO necesita tabla propia en el MVP — se deriva del histórico de `daily_reports` (serie de `net_oil_bbl` por pozo en el tiempo). La tendencia predictiva (ML) llega en Escalamiento.

**Pantallas:** KPIs Ejecutivos Consolidados · Monitoreo Regulatorio CNE · Balance de Fiscalización · Análisis de Yacimientos · Centro de Reportes/Exportación.

---

## 8. Capa de sistema

### `audit_logs` — bitácora inmutable con hash encadenado · MVP/Escalamiento
| Columna | Tipo | Notas |
|---|---|---|
| id | bigint PK | |
| organization_id | bigint FK | |
| user_id | bigint FK → users | nullable |
| action | varchar | created / updated / exported / login… |
| auditable_type | varchar | modelo afectado |
| auditable_id | bigint | id afectado |
| changes | jsonb | antes/después |
| hash | varchar(64) | SHA-256 de este registro |
| previous_hash | varchar(64) | hash del registro anterior → cadena tamper-evident |
| created_at | timestamp | sin updated_at: inmutable |

> El **hash encadenado** (cada registro incluye el hash del anterior) hace la bitácora a prueba de manipulación: alterar un registro rompe la cadena. Esto es lo que respalda de verdad la promesa de "datos inmutables para disputas con Pemex".

### `ai_interactions` — log de llamadas a Claude · MVP
| Columna | Tipo | Notas |
|---|---|---|
| id | bigint PK | |
| organization_id | bigint FK | |
| user_id | bigint FK → users | nullable |
| type | varchar | `voice_structuring` / `alert_diagnosis` / `assistant_chat` |
| model | varchar | modelo usado (versión vigente) |
| input_tokens, output_tokens | int | control de costos |
| cost_usd | decimal(8,4) | |
| created_at | timestamp | |

> Te permite **medir el costo real de IA por cliente** (vs. el estimado) y detectar abuso. Clave para defender tu margen.

### `sync_logs` — estado de sincronización offline · MVP
| Columna | Tipo | Notas |
|---|---|---|
| id | bigint PK | |
| organization_id | bigint FK | |
| user_id | bigint FK → users | |
| device_id | varchar | identificador del dispositivo |
| synced_at | timestamp | |
| records_count | int | cuántos registros subió |
| status | varchar | `success` / `partial` / `failed` |

**Pantallas:** Historial/Auditoría · Estado de Sincronización · Consola del Asistente Virtual (vía ai_interactions).

---

## 9. Capa de salas (Salas · fase posterior)

### `monitoring_rooms` · Salas
| Columna | Tipo | Notas |
|---|---|---|
| id | bigint PK | |
| organization_id | bigint FK | |
| asset_id | bigint FK → assets | |
| name | varchar | |
| created_at, updated_at | timestamp | |

### `screens` · Salas
| Columna | Tipo | Notas |
|---|---|---|
| id | bigint PK | |
| monitoring_room_id | bigint FK → monitoring_rooms | |
| pairing_code | varchar | código numérico de vinculación |
| module | varchar | `m1` / `m2` / `m3` |
| created_at, updated_at | timestamp | |

### `layout_profiles` · Salas
| Columna | Tipo | Notas |
|---|---|---|
| id | bigint PK | |
| monitoring_room_id | bigint FK | |
| name | varchar | "Turno Matutino" / "Junta Ejecutiva" |
| layout_json | jsonb | posición/tamaño de widgets (react-grid-layout) |
| created_at, updated_at | timestamp | |

**Pantallas:** Configurador de Salas (Gestor de Pantallas, Lanzador de URLs, Biblioteca de Layouts, Editor de Widgets).

---

## 10. Orden de migraciones (qué crear primero)

Respetando las dependencias de FK y el orden de construcción de Fase 0:

```
1. organizations
2. users  (+ tablas de Spatie: roles, permissions, pivotes)
3. assets
4. wells
5. well_user
6. equipment → manuals
7. daily_reports  ← el corazón del MVP
8. downtime_events, voice_logs, hse_incidents, chemical_injections
9. alert_rules, alerts
10. production_targets, fiscalization_records
11. audit_logs, ai_interactions, sync_logs
12. (Escalamiento) telemetry_readings [TimescaleDB], well_status_history
13. (Salas) monitoring_rooms, screens, layout_profiles
```

---

## 11. Checklist de implementación

- [ ] Configurar el **Global Scope de tenant** (`organization_id`) y aplicarlo a todos los modelos con datos de cliente.
- [ ] Trait `BelongsToTenant` reutilizable (setea `organization_id` automático al crear).
- [ ] Triggers de PostgreSQL para bloquear `UPDATE`/`DELETE` en tablas append-only.
- [ ] Columnas generadas (`net_oil_bbl`, `difference_bbl`) con `GENERATED ALWAYS AS ... STORED`.
- [ ] Roles Spatie sembrados (`operador`, `ingeniero`, `admin`) + sus permisos.
- [ ] Scope del rol Operador limitado a sus pozos vía `well_user`.
- [ ] Índices listados en cada tabla.
- [ ] (Escalamiento) Instalar TimescaleDB y convertir `telemetry_readings` en hypertable.
- [ ] Seeder de datos demo (1 organización, 1 activo, ~5 pozos, reportes de 3 meses) para desarrollo y demos.

---

## 12. Decisiones que confirmar contigo

1. **ID público:** ¿UUID (lo recomendado) o ULID? Ambos evitan enumeración; ULID es ordenable por tiempo.
2. **Multi-tenancy:** ¿row-level para todos (recomendado MVP), con opción de DB dedicada para enterprise?
3. **Profundidad del histórico de telemetría:** ¿cuánto tiempo retener al detalle antes de pasar a rollups? (impacta costo de almacenamiento).
4. **Formato regulatorio:** confirmar la estructura exacta del reporte vigente bajo CNE/SENER para modelar `production_targets` y la exportación con precisión.

---

*Fin del modelo de datos. Con este esquema, las migraciones de Laravel se escriben directo y cada pantalla del dashboard ya tiene su respaldo en datos.*
