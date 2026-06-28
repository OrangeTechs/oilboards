# Doc 14 — Asistente IA (Claude API)

> Asistente técnico real integrado con la API de Claude, en la landing y el demo. Creado jun 28 2026.
> Doble expertise: ingeniero petrolero senior + especialista en dashboards/telemetría que explica Oilboards.

---

## 1. Concepto: "capacitar" ≠ entrenar

No hay fine-tuning. El asistente se "capacita" con **system prompt + base de conocimiento** (en `config/assistant.php`). Editar ese archivo + `php artisan config:clear` ajusta su comportamiento y conocimiento en segundos, sin reentrenar nada.

## 2. Arquitectura (todo en Laravel)

```
React (AsistenteIA / ChatWidget)  →  POST /assistant  →  AssistantController  →  Claude API
                                                          (API key vive en .env)
```

| Pieza | Qué hace |
|---|---|
| `app/Services/AnthropicClient.php` | Cliente cURL reutilizado del proyecto Medriks (probado en prod): `CONNECT_TIMEOUT`, reintentos en 5xx/red, keep-alive, gzip, `extractText`/`isError`/`randomFallback`. PHP puro, sin dependencias. |
| `config/assistant.php` | Modelo, max_tokens, temperature, frases de fallback, `max_turns`, y el **system_prompt** (la capacitación). `api_key` => `env('ANTHROPIC_API_KEY')` (leída vía config para sobrevivir a `config:cache`). |
| `app/Http/Controllers/AssistantController.php` | Chat **stateless**. Valida `messages[]` (+ `context` opcional), capa los últimos N turnos, inyecta el contexto de la pantalla actual al system prompt, llama a Claude, devuelve JSON con fallback. |
| ruta | `POST /assistant` (web.php). |

**Modelo: `claude-sonnet-4-6`.** Elegido sobre Opus por costo/velocidad (suena experto sin razonamiento pesado). Nota: Opus 4.7/4.8 rechazan `temperature` y el cliente lo manda — otra razón para Sonnet/Haiku.

**Seguridad:** la `ANTHROPIC_API_KEY` vive SOLO en `.env` del servidor, nunca en el frontend ni en el repo (`.env` está en `.gitignore`). Conversaciones NO se persisten en BD.

## 3. Frontend

- `resources/js/Components/ui/Markdown.tsx` — render de markdown propio (sin librerías), compartido por la pantalla y el widget. Cubre `#`, `**`, viñetas, `>`, `---`.
- `resources/js/Pages/Demo/AsistenteIA.tsx` — pantalla del Asistente IA del demo, conectada en vivo a `/assistant`.
- `resources/js/Components/ui/ChatWidget.tsx` — **widget flotante omnipresente** (montado en `Landing.tsx` y `Demo/Index.tsx`):
  - **Proactivo:** burbuja de saludo + badge a los 6s (una vez por sesión).
  - **Persistencia:** la conversación se guarda en `sessionStorage` (`oilboards_chat_v1`) → continua entre secciones del demo, entre landing↔demo, y al recargar. Estado abierto y "ya saludó" también persisten. Guardas para SSR (`typeof window`).
  - **Consciente de la sección:** recibe prop `section={{title,desc}}` (en el demo, de `TITLES`+`SCREEN_DESC`). Muestra "📍 Estás en: X", un chip "💡 ¿Qué veo en esta sección?", y manda `context` al backend para que oriente de esa pantalla.

## 4. La capacitación (qué sabe)

El system prompt incluye: qué es Oilboards, los 6 módulos, **qué monitorea cada una de las 24 pantallas** (incluidas las de admin/Sistema), **los 32 bloques de la Sala** + variables comparables, los 8 pozos del demo, y reglas duras:
- Español de México, técnico y conciso.
- Regulador **CNE/SENER**, seguridad **ASEA** — NUNCA "CNH".
- BEC en **Hz**, balancín en **SPM**.
- **NUNCA da precios** → cotización a la medida + invita a la prueba piloto de 14 días.
- Toda recomendación cierra "sujeto a validación por personal calificado".

## 5. Cómo ajustarlo

| Quiero… | Hago… |
|---|---|
| Cambiar tono / conocimiento / reglas del asistente | Editar `config/assistant.php` → `php artisan config:clear` (sin build) |
| Cambiar el modelo | `ASSISTANT_MODEL` en `.env` (default `claude-sonnet-4-6`) |
| Cambiar la API key | `ANTHROPIC_API_KEY` en `.env` → `php artisan config:clear` |
| Cambiar el UI del chat | Editar los `.tsx` → `npm run build` |

---

*Verificado en vivo (jun 28 2026): conexión real a Claude, respuestas con conocimiento de Oilboards, markdown renderizado, persistencia entre secciones, orientación contextual por pantalla, y bloqueo de precios.*
