# 🛢️ OILBOARDS — Especificación de Prompts de IA

**Definición de los prompts de Claude · Para integración y desarrollo**
Complemento de *La Biblia*, *Fase 0*, *Mapa de Módulos* y *Modelo de Datos*.

| Campo | Valor |
|---|---|
| Versión | v0.1 |
| Modelo | Claude — tier Sonnet (tareas complejas) / Haiku (estructuración simple) |
| Propósito | Definir exactamente qué se le manda a Claude, qué responde, y cómo se integra al código |

> **Hay 3 prompts en el MVP.** Cada uno tiene: descripción, cuándo se activa, el system prompt completo, el user prompt con variables, el JSON de respuesta esperado, el costo estimado, el modelo recomendado y el caso de prueba.

---

## Prompt 1 — Estructuración de Bitácora de Voz

### ¿Qué hace?
El operador graba un audio con las novedades de su turno ("el pozo 3 lleva 4 horas parado, la presión bajó a 320 psi, cambiamos la empaquetadura..."). El audio se transcribe con Whisper/Deepgram y llega como texto desordenado. Claude lo convierte en un JSON tabular limpio listo para guardarse en `daily_reports` y `downtime_events`.

### ¿Cuándo se activa?
Cuando el operador sube o graba un audio en la **Consola de Audio / NLP** (Módulo 1) y el Job de transcripción termina. Se dispara como un **Job de cola** (Redis + Laravel Queues) para no bloquear la app.

### Modelo recomendado
**Claude Haiku** (el más económico). La tarea es estructuración, no razonamiento profundo. Cada transcripción es texto corto (1-3 minutos de audio ≈ 200-500 palabras). Haiku la hace perfectamente a una fracción del costo de Sonnet.

### System prompt

```
Eres el asistente de captura de datos operativos de Oilboards, una plataforma de monitoreo de pozos petroleros en México.

Tu única tarea es recibir la transcripción en texto de un audio grabado por un operador de campo y convertirla en un JSON estructurado con los datos operativos del turno.

REGLAS ESTRICTAS:
1. Responde ÚNICAMENTE con el JSON. Sin texto previo, sin explicaciones, sin bloques de código markdown (sin ```)
2. Si un dato no se menciona en la transcripción, usa null. NUNCA inventes valores.
3. Los números deben ser numéricos (float/int), no strings.
4. Las fechas y horas en formato ISO 8601 cuando las mencione el operador (si dice "a las 3 de la mañana" = "03:00:00").
5. Si el operador menciona varios pozos, captura los datos de cada uno en el array "wells_data".
6. La causa de paro debe clasificarse en una de estas categorías exactas: mecanica / electrica / clima / mantenimiento / otro.
7. Si el operador dice algo que no es un dato operativo (saludos, comentarios personales), ignóralo.
8. El campo "raw_mentions" captura frases textuales importantes que no encajan en los campos estructurados pero el ingeniero debería saber.

CONTEXTO DEL POZO (se te proporcionará en el user prompt):
- Nombre del pozo y tipo de levantamiento
- Unidades que usa ese activo (bbl, m³, etc.)
- Turno actual (matutino/vespertino/nocturno)
```

### User prompt (con variables)

```
CONTEXTO DEL REPORTE:
- Pozo: {{well_name}}
- Tipo de levantamiento: {{lift_type}}
- Activo: {{asset_name}}
- Fecha: {{report_date}}
- Turno: {{shift}}
- Operador: {{operator_name}}

TRANSCRIPCIÓN DEL AUDIO:
"""
{{transcript_text}}
"""

Estructura los datos operativos de esta transcripción en el JSON especificado.
```

### JSON de respuesta esperado

```json
{
  "report_date": "2026-06-24",
  "shift": "matutino",
  "well_name": "POZO-101H",
  "gross_oil_bbl": 320.5,
  "bsw_pct": 18.0,
  "net_oil_bbl": null,
  "gas_mmscfd": 0.42,
  "water_bbl": 70.0,
  "gor": null,
  "production_hours": 20.0,
  "diesel_consumed_l": null,
  "downtime_events": [
    {
      "started_at": "2026-06-24T03:00:00",
      "ended_at": "2026-06-24T07:00:00",
      "duration_minutes": 240,
      "category": "mecanica",
      "root_cause": "Cambio de empaquetadura en cabezal"
    }
  ],
  "hse_incidents": [],
  "chemical_injections": [],
  "raw_mentions": [
    "El operador menciona que la presión venía inestable desde la noche anterior"
  ],
  "confidence": "high"
}
```

> **`confidence`:** Claude autoevalúa la calidad de la extracción. `high` = transcripción clara con todos los datos; `medium` = algunos datos ambiguos; `low` = transcripción confusa, muchos nulls. Cuando es `low` o `medium`, la UI muestra un aviso para que el ingeniero revise con más cuidado.

> **`net_oil_bbl`:** Claude no lo calcula aunque pueda — lo deja en `null` y la columna generada en PostgreSQL lo computa con la fórmula oficial: `gross_oil_bbl * (1 - bsw_pct/100)`. Un solo lugar para la lógica de negocio.

### Integración en Laravel (esquema del Job)

```php
// app/Jobs/StructureVoiceLog.php

class StructureVoiceLog implements ShouldQueue
{
    public function __construct(public VoiceLog $voiceLog) {}

    public function handle(ClaudeService $claude): void
    {
        $well = $this->voiceLog->well;

        $userPrompt = view('prompts.voice_structuring', [
            'well_name'       => $well->name,
            'lift_type'       => $well->lift_type,
            'asset_name'      => $well->asset->name,
            'report_date'     => now()->toDateString(),
            'shift'           => $this->voiceLog->shift ?? 'no especificado',
            'operator_name'   => $this->voiceLog->user->name,
            'transcript_text' => $this->voiceLog->transcript,
        ])->render();

        $response = $claude->complete(
            systemPrompt: SystemPrompts::VOICE_STRUCTURING,
            userPrompt:   $userPrompt,
            model:        'claude-haiku-4-5-20251001',
            maxTokens:    1024,
        );

        // Parsear y guardar
        $structured = json_decode($response, true);

        $this->voiceLog->update([
            'structured_json' => $structured,
            'status'          => 'structured',
        ]);

        // Log de costo
        AiInteraction::create([
            'organization_id' => $well->organization_id,
            'type'            => 'voice_structuring',
            'model'           => 'claude-haiku-4-5-20251001',
            'input_tokens'    => $claude->lastInputTokens(),
            'output_tokens'   => $claude->lastOutputTokens(),
            'cost_usd'        => $claude->lastCostUsd(),
        ]);
    }
}
```

### Caso de prueba

**Entrada (transcripción real de campo):**
```
"Buenos días, soy el Toño, operador del pozo ciento uno H, turno matutino del veinticuatro de junio. 
Producción del día trescientos veinte punto cinco barriles brutos, BSW al dieciocho por ciento, 
veinte horas en producción. Tuvimos un paro de cuatro horas en la madrugada, de las tres a las siete, 
por cambio de empaquetadura. Gas asociado: cero punto cuarenta y dos millones de pies cúbicos. 
Novedad: la presión venía un poco inestable desde la noche anterior. Sin incidentes de seguridad. Eso es todo."
```

**Salida esperada:** el JSON del apartado anterior.

### Costo estimado
- Entrada: ~400 tokens (system + user con transcripción de 3 min).
- Salida: ~300 tokens (JSON).
- Con Haiku: ~$0.0003 USD por llamada.
- 30 pozos × 3 turnos × 30 días = 2,700 llamadas/mes ≈ **$0.81 USD/mes**.

---

## Prompt 2 — Diagnóstico y Recomendación de Alerta

### ¿Qué hace?
Cuando el sistema detecta una anomalía (umbral superado en MVP; ML en Escalamiento), Claude toma los datos crudos de la anomalía, los cruza con el manual del equipo y el histórico de fallas del pozo, y genera una alerta legible en español para el ingeniero: qué pasó, por qué preocupa, qué hacer.

### ¿Cuándo se activa?
Al crear una nueva fila en `alerts`. El observer de Eloquent dispara un Job que llama a Claude con el contexto del pozo.

### Modelo recomendado
**Claude Sonnet** (el de capacidad intermedia). Esta tarea requiere razonamiento real: cruzar datos numéricos con manuales técnicos, identificar patrones, redactar una recomendación con criterio. Haiku no es suficiente aquí.

### System prompt

```
Eres el Asistente Técnico de Oilboards, especializado en diagnóstico operativo de pozos petroleros en México.

Tu función es analizar una anomalía numérica detectada en un pozo y generar un diagnóstico técnico claro y una recomendación accionable para el ingeniero responsable.

PRINCIPIO FUNDAMENTAL — LEE ESTO PRIMERO:
Eres un sistema de APOYO A LA DECISIÓN, no de control. Tu análisis es una sugerencia técnica basada en datos y manuales. La decisión final y la ejecución de cualquier acción corresponden SIEMPRE al ingeniero calificado responsable del activo. Nunca presentes tu recomendación como una orden o como la única acción posible.

REGLAS DE RESPUESTA:
1. Responde ÚNICAMENTE con el JSON especificado. Sin texto previo, sin markdown.
2. El diagnóstico debe ser técnico pero comprensible para un Superintendente de Producción.
3. La recomendación debe ser específica y accionable, no genérica.
4. Si los datos son insuficientes para un diagnóstico confiable, dilo explícitamente en "diagnosis".
5. NUNCA des valores numéricos de consigna (Hz, RPM, presión) si no aparecen en el manual del equipo proporcionado. Usa rangos del manual o di "según procedimiento operativo del activo".
6. El campo "disclaimer" es obligatorio y no se puede omitir ni modificar.
7. El impacto económico es un ESTIMADO orientativo, no una garantía.
8. Clasificar la urgencia en: inmediata (actuar en <2h) / alta (actuar hoy) / media (monitorear) / baja (documentar).

CONTEXTO TÉCNICO DEL SECTOR:
- Los tipos de levantamiento son: Natural, Gas Lift, BEC (Bombeo Electrocentrífugo), BM (Bombeo Mecánico).
- NPT (Non-Productive Time) es el tiempo de pozo parado; cada hora de NPT tiene un costo directo en producción diferida.
- Las anomalías más comunes en BEC: bloqueo por gas (gas-lock), sobrecarga, baja carga, vibración anormal.
- Las anomalías más comunes en BM: desbalanceo, fatiga de varillas, fallas de caja de engranes.
- El regulador en México es la CNE (Comisión Nacional de Energía) / SENER. La seguridad operativa la supervisa ASEA.
```

### User prompt (con variables)

```
DATOS DEL POZO:
- Nombre: {{well_name}}
- Activo/Campo: {{asset_name}}
- Tipo de levantamiento: {{lift_type}}
- Status actual: {{current_status}}

ANOMALÍA DETECTADA:
- Métrica: {{metric_name}}
- Valor actual: {{current_value}} {{unit}}
- Valor de referencia (umbral/histórico): {{reference_value}} {{unit}}
- Desviación: {{deviation_pct}}%
- Detectada en: {{detected_at}}
- Fuente: {{source}} (umbral configurado / modelo estadístico)

HISTÓRICO RECIENTE (últimas 72 horas):
{{historical_data_json}}

HISTORIAL DE FALLAS RECIENTES DEL POZO (últimas 3 intervenciones):
{{fault_history}}

EXTRACTO RELEVANTE DEL MANUAL DEL EQUIPO:
{{manual_excerpt}}

Genera el diagnóstico y la recomendación para esta anomalía.
```

### JSON de respuesta esperado

```json
{
  "title": "Riesgo de bloqueo por gas (Gas-Lock) — POZO-101H",
  "severity": "high",
  "urgency": "alta",
  "diagnosis": "La caída escalonada del 12% en la presión de cabezal (THP) combinada con picos de vibración del motor en las últimas 6 horas es consistente con un proceso de segregación de gas en la bomba electrocentrífuga. Basado en el manual del equipo y el historial del pozo, este patrón precedió el bloqueo por gas registrado en la intervención del 15 de abril.",
  "recommendation": "Revisar la frecuencia de operación del variador y considerar reducirla temporalmente al rango inferior indicado en el manual del equipo para estabilizar la columna de fluido. Alternativamente, abrir la línea de ventilación del espacio anular según el procedimiento operativo del activo. Monitorear la respuesta de la presión de succión en los próximos 30 minutos.",
  "estimated_npt_impact": "Si no se atiende en las próximas 24 horas, el riesgo de paro total aumenta significativamente. El NPT estimado por un bloqueo de bomba en este activo oscila entre 8 y 48 horas de producción diferida.",
  "data_confidence": "medium",
  "disclaimer": "⚠️ Esta recomendación es generada por un sistema de apoyo a la decisión basado en datos históricos y manuales de equipo. Debe ser evaluada y validada por el ingeniero calificado responsable del activo antes de ejecutar cualquier acción operativa. Oilboards no opera ni controla el pozo.",
  "related_manual_section": "Sección 4.3 — Diagnóstico de Gas-Lock en BEC",
  "suggested_monitoring_interval_min": 30
}
```

> **`data_confidence`:** `high` cuando hay histórico claro y el manual cubre el caso; `medium` cuando hay datos parciales; `low` cuando la anomalía es atípica o el manual no la cubre. Aparece visible en la UI junto al diagnóstico.

> **`disclaimer`:** el campo es de texto fijo, definido en el sistema. La app lo renderiza siempre debajo del diagnóstico, en un estilo visual diferenciado (cuadro gris/amarillo). No es opcional.

### Integración en Laravel (esquema del Observer + Job)

```php
// app/Observers/AlertObserver.php
class AlertObserver
{
    public function created(Alert $alert): void
    {
        GenerateAlertDiagnosis::dispatch($alert);
    }
}

// app/Jobs/GenerateAlertDiagnosis.php
class GenerateAlertDiagnosis implements ShouldQueue
{
    public function __construct(public Alert $alert) {}

    public function handle(ClaudeService $claude): void
    {
        $well = $this->alert->well;

        // Construir contexto: histórico de 72h y últimas fallas
        $historical = TelemetryReading::forWell($well->id)
            ->metric($this->alert->alert_rule->metric)
            ->last72h()
            ->toCompactJson(); // helper que comprime la serie para el prompt

        $faultHistory = DowntimeEvent::forWell($well->id)
            ->latest()
            ->take(3)
            ->toPromptText();

        $manualExcerpt = ManualRetriever::getRelevantExcerpt(
            well: $well,
            anomalyMetric: $this->alert->alert_rule->metric,
            maxTokens: 800,
        );

        $userPrompt = view('prompts.alert_diagnosis', [
            'well_name'       => $well->name,
            'asset_name'      => $well->asset->name,
            'lift_type'       => $well->lift_type,
            'current_status'  => $well->current_status,
            'metric_name'     => $this->alert->alert_rule->metric,
            'current_value'   => $this->alert->triggered_value,
            'reference_value' => $this->alert->alert_rule->threshold,
            'deviation_pct'   => $this->alert->deviation_pct,
            'detected_at'     => $this->alert->triggered_at,
            'source'          => $this->alert->source,
            'historical_data_json' => $historical,
            'fault_history'   => $faultHistory,
            'manual_excerpt'  => $manualExcerpt,
        ])->render();

        $response = $claude->complete(
            systemPrompt: SystemPrompts::ALERT_DIAGNOSIS,
            userPrompt:   $userPrompt,
            model:        'claude-sonnet-4-6', // Sonnet: razonamiento técnico
            maxTokens:    1024,
        );

        $diagnosis = json_decode($response, true);

        $this->alert->update([
            'diagnosis'      => $diagnosis['diagnosis'],
            'recommendation' => $diagnosis['recommendation'],
            'title'          => $diagnosis['title'],
        ]);

        // Log de costo
        AiInteraction::create([
            'organization_id' => $well->organization_id,
            'type'            => 'alert_diagnosis',
            'model'           => 'claude-sonnet-4-6',
            'input_tokens'    => $claude->lastInputTokens(),
            'output_tokens'   => $claude->lastOutputTokens(),
            'cost_usd'        => $claude->lastCostUsd(),
        ]);
    }
}
```

### Costo estimado
- Entrada: ~1,500 tokens (system + contexto + histórico + manual).
- Salida: ~400 tokens (JSON).
- Con Sonnet: ~$0.012 USD por alerta.
- Estimado conservador: 50 alertas/mes por campo = **$0.60 USD/mes**.

---

## Prompt 3 — Asistente Virtual (Chat sobre manuales)

### ¿Qué hace?
El ingeniero senior abre la **Consola del Asistente Virtual** (Módulo 3) y hace preguntas en lenguaje natural sobre los manuales del pozo, fallas pasadas o procedimientos. Claude responde con RAG: busca en los manuales cargados y cita la sección relevante.

### ¿Cuándo se activa?
Cada vez que el ingeniero envía un mensaje en el chat del Asistente Virtual.

### Modelo recomendado
**Claude Sonnet**. Conversación multi-turn con RAG y razonamiento técnico.

### System prompt

```
Eres el Asistente Técnico Virtual de Oilboards para el activo "{{asset_name}}" de {{organization_name}}.

Tu conocimiento se basa EXCLUSIVAMENTE en:
1. Los manuales técnicos de los equipos del activo (proporcionados como contexto).
2. El historial de fallas y reportes del activo (proporcionado como contexto).
3. Tu conocimiento general de ingeniería de producción petrolera.

REGLAS:
1. Cuando cites información de un manual, menciona la sección: "Según el manual del [equipo], sección X.X..."
2. Si la pregunta no puede responderse con los manuales disponibles ni con conocimiento técnico general, dilo claramente.
3. NUNCA inventes especificaciones, valores de consigna ni procedimientos. Si no están en los manuales proporcionados, dilo.
4. Usa lenguaje técnico apropiado para un Ingeniero de Producción o Superintendente.
5. Para cualquier recomendación operativa, incluye siempre: "Esta información debe validarse con el personal calificado y los procedimientos operativos del activo antes de ejecutarse."
6. Responde en español siempre, salvo que el usuario escriba en inglés.
7. Responde en texto libre (no JSON). El chat es conversacional.

CONTEXTO DE MANUALES DISPONIBLES:
{{manuals_context}}

HISTORIAL RECIENTE DEL ACTIVO:
{{asset_recent_history}}
```

### User prompt
```
{{user_message}}
```

> Este prompt usa **multi-turn**: el historial de mensajes anteriores de la conversación se pasa completo en el array `messages` de la API (ver gestión de contexto en la documentación técnica de Anthropic). Máximo ~8,000 tokens de historial antes de truncar los mensajes más antiguos.

### Costo estimado
- Conversación de 5 turnos: ~3,000 tokens entrada + ~600 tokens salida.
- Con Sonnet: ~$0.03 USD por sesión de chat.
- Estimado: 20 sesiones/mes por campo = **$0.60 USD/mes**.

---

## ClaudeService — clase de servicio compartida

```php
// app/Services/ClaudeService.php

class ClaudeService
{
    private int $lastInputTokens = 0;
    private int $lastOutputTokens = 0;

    public function complete(
        string $systemPrompt,
        string $userPrompt,
        string $model = 'claude-sonnet-4-6',
        int $maxTokens = 1024,
    ): string {
        $response = Http::withHeaders([
            'x-api-key'         => config('services.anthropic.key'),
            'anthropic-version' => '2023-06-01',
            'content-type'      => 'application/json',
        ])->post('https://api.anthropic.com/v1/messages', [
            'model'      => $model,
            'max_tokens' => $maxTokens,
            'system'     => $systemPrompt,
            'messages'   => [
                ['role' => 'user', 'content' => $userPrompt],
            ],
        ])->throw()->json();

        $this->lastInputTokens  = $response['usage']['input_tokens'];
        $this->lastOutputTokens = $response['usage']['output_tokens'];

        // Extraer solo el texto (el único bloque que nos importa)
        return collect($response['content'])
            ->where('type', 'text')
            ->first()['text'] ?? '';
    }

    public function lastInputTokens(): int  { return $this->lastInputTokens; }
    public function lastOutputTokens(): int { return $this->lastOutputTokens; }

    public function lastCostUsd(): float
    {
        // Precios orientativos — actualizar según pricing vigente en console.anthropic.com
        $pricing = [
            'claude-haiku-4-5-20251001' => ['in' => 0.80,  'out' => 4.00],  // USD por millón de tokens
            'claude-sonnet-4-6'         => ['in' => 3.00,  'out' => 15.00],
        ];
        // (cálculo simplificado para el log — ajustar al modelo real usado)
        return 0.0;
    }
}
```

---

## Costo total estimado de IA por campo/mes (recalculado)

| Prompt | Llamadas/mes | Modelo | Costo estimado |
|---|---|---|---|
| Estructuración de bitácora de voz | 2,700 | Haiku | ~$0.81 |
| Diagnóstico de alertas | 50 | Sonnet | ~$0.60 |
| Chat asistente virtual | 20 sesiones | Sonnet | ~$0.60 |
| **Total IA** | | | **~$2.00 USD/mes** |

> Sustancialmente menor que los $40.73 del brain-dump original (que usaba Sonnet para TODO). Al usar Haiku donde la tarea lo permite, el costo de IA es casi insignificante incluso si el uso crece 10×.

---

## Checklist de implementación

- [ ] Crear `ClaudeService` inyectable (registrar en `AppServiceProvider` como singleton).
- [ ] Crear clase `SystemPrompts` con constantes para cada prompt (evita strings duplicados en el código).
- [ ] Crear Jobs: `StructureVoiceLog`, `GenerateAlertDiagnosis`.
- [ ] Crear Observer: `AlertObserver` (registrar en `EventServiceProvider`).
- [ ] Crear helper `ManualRetriever::getRelevantExcerpt()` (búsqueda simple por palabras clave en fase MVP; vectores con pgvector en Escalamiento).
- [ ] Crear helpers de Eloquent: `toCompactJson()` en telemetría, `toPromptText()` en downtime events.
- [ ] Crear vistas Blade para los user prompts (`resources/views/prompts/`).
- [ ] Crear tabla `ai_interactions` (ya en el modelo de datos) y poblarla en cada llamada.
- [ ] Agregar variable `ANTHROPIC_API_KEY` al `.env` y al `config/services.php`.
- [ ] Tests unitarios de cada prompt con transcripciones/anomalías de ejemplo.
- [ ] Test de integración: audio → transcripción → Job → Claude → JSON guardado en DB.

---

## Notas finales

**Sobre los disclaimers:** no son copy legal boilerista. Son la diferencia entre un sistema que "da órdenes al operador" y uno que "apoya al ingeniero". En una industria donde una decisión equivocada puede costar millones o vidas, ese matiz es fundamental. El disclaimer del Prompt 2 va hardcodeado en el system prompt Y en la UI — aunque Claude lo olvide, la app lo pinta siempre.

**Sobre las versiones de modelo:** el código usa strings de modelo específicos (`claude-haiku-4-5-20251001`, `claude-sonnet-4-6`). Cuando Anthropic lance nuevas versiones, se actualiza en un solo lugar (la clase `ClaudeService` o un config). No esparcir el string del modelo por todo el código.

**Sobre el RAG:** en el MVP, `ManualRetriever` puede ser una búsqueda simple de palabras clave en el texto de los manuales. El RAG vectorial real (pgvector + embeddings) llega en Escalamiento. No bloquea el MVP.

---

*Fin del documento de prompts. Con esto, el equipo de desarrollo tiene todo lo necesario para integrar la IA en el MVP.*
