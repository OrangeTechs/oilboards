# 🛢️ OILBOARDS — Doc 6: Spec de la App Móvil (Offline-First)

**Especificación técnica de la experiencia móvil · Para desarrollo frontend y PWA**
Complemento de *Fase 0*, *Módulos*, *Modelo de Datos*, *Prompts de IA* y *Contratos de API*.

| Campo | Valor |
|---|---|
| Versión | v0.1 |
| Propósito | Definir la decisión PWA vs. nativa, la lógica offline, la cola de sincronización, los permisos de micrófono y todo lo necesario para construir el Módulo 1 en campo |
| Usuarios objetivo | Operadores de campo (pozos terrestres, zonas rurales, conectividad limitada o nula) |

> **Por qué este documento importa.** El Formulario de Reporte Diario y la Consola de Audio son el corazón del MVP. Ambos deben funcionar **sin internet**. Si esto falla en campo, el producto no sirve. Las decisiones técnicas aquí no son de preferencia — son de supervivencia del producto.

---

## 1. Decisión: PWA vs. App Nativa

Esta es la primera pregunta que hay que responder antes de escribir una línea de código móvil.

### Opción A — PWA (Progressive Web App) ✅ RECOMENDADA para el MVP

La misma app React (Inertia + Next.js / Vite) se convierte en PWA agregando un **Service Worker** y un **Web App Manifest**. El operador la instala desde el navegador del celular ("Agregar a pantalla de inicio") sin pasar por App Store ni Play Store.

**Ventajas:**
- **Un solo codebase.** El mismo React que corre en el dashboard del ingeniero corre en el celular del operador. Sin mantener dos proyectos.
- **Deploy instantáneo.** Actualizar la app = hacer deploy al servidor. Sin revisiones de App Store (que tardan días).
- **Funciona offline** con Service Worker + IndexedDB / Cache API.
- **Cero fricción de instalación.** El operador abre el link en Chrome/Safari y lo instala. No necesita cuenta de Play Store ni permisos corporativos.
- **Costo:** $0 adicional (no hay cuota de developer de Apple/Google).

**Limitaciones a manejar:**
- **iOS Safari:** soporte de PWA más limitado que Android/Chrome. Restricciones en background sync y notificaciones push (mejorando en iOS 17+, pero no perfecto).
- **Acceso al micrófono:** funciona en PWA vía `MediaRecorder API`, pero requiere HTTPS (ya tienes Certbot).
- **Almacenamiento offline:** limitado por el navegador (~50 MB en iOS, más en Android). Suficiente para colas de reportes y audios cortos.

### Opción B — App Nativa React Native

Máximo control, mejor UX en iOS, background sync real. Pero implica un segundo proyecto, dependencias adicionales (Expo o bare RN), y despliegues separados al App Store y Play Store — incluyendo review de Apple (5-7 días) cada update.

### Opción C — Capacitor (híbrida) ⭐ Plan B si la PWA falla en iOS

Capacitor envuelve la misma app React en un shell nativo. Acceso a APIs nativas del dispositivo (micrófono, almacenamiento, notificaciones) con el mismo codebase web. Si los operadores usan iPhones y la PWA da problemas en iOS, Capacitor es el puente más barato.

### Decisión recomendada

```
MVP → PWA
Si iOS es problema → Capacitor (mismo código, mínima refactorización)
Si el producto escala y hay presupuesto → React Native dedicado
```

> **Pregunta para confirmar con MANE:** ¿Qué dispositivos usan los operadores de campo? ¿Android (Samsung Galaxy Tab Active / Getac) o iPhone/iPad? Eso determina si la PWA es suficiente o si hay que ir a Capacitor desde el inicio.

---

## 2. Configuración PWA

### 2.1 Web App Manifest (`/public/manifest.json`)

```json
{
  "name": "Oilboards Campo",
  "short_name": "Oilboards",
  "description": "Captura de reportes de pozos petroleros",
  "start_url": "/campo",
  "display": "standalone",
  "background_color": "#0B0F19",
  "theme_color": "#10B981",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "categories": ["productivity", "utilities"],
  "lang": "es-MX"
}
```

> `"display": "standalone"` — la app se abre sin barra del navegador, como app nativa.
> `"start_url": "/campo"` — al abrir desde el ícono va directo al Módulo 1, no al dashboard completo.

### 2.2 Service Worker (estrategia de caché)

El Service Worker es el cerebro del offline. Intercepta las requests de red y decide si responde desde caché o espera conexión.

**Herramienta recomendada:** **Workbox** (de Google) — abstrae la complejidad del Service Worker con estrategias predefinidas. Se integra con Vite via `vite-plugin-pwa`.

```bash
npm install -D vite-plugin-pwa workbox-window
```

**Estrategias por tipo de recurso:**

| Recurso | Estrategia Workbox | Por qué |
|---|---|---|
| App shell (HTML/CSS/JS) | `CacheFirst` | La UI siempre carga rápido offline |
| Assets estáticos (iconos, fuentes) | `CacheFirst` | No cambian |
| `GET /api/v1/wells` | `NetworkFirst` | Datos importantes; si no hay red, sirve caché |
| `GET /api/v1/assets/{uuid}/reports/daily-summary` | `NetworkFirst` | Idem |
| `POST /api/v1/wells/{uuid}/reports` | **Background Sync Queue** | No disponible offline → va a la cola |
| `POST /api/v1/wells/{uuid}/voice-logs` | **Background Sync Queue** | Audio → cola offline |
| `POST /api/v1/sync` | Online only | Solo se llama cuando hay red |

---

## 3. Lógica offline completa

### 3.1 El problema central

El operador en campo llena el reporte y graba el audio **sin internet**. La app debe:
1. Guardar los datos localmente.
2. Mostrar al operador que está guardado (aunque no sincronizado).
3. Detectar cuando hay red.
4. Enviar automáticamente todo lo pendiente al servidor.
5. Manejar errores y conflictos.

### 3.2 Almacenamiento local: IndexedDB

**Herramienta:** **Dexie.js** — wrapper de IndexedDB con API limpia y soporte TypeScript.

```bash
npm install dexie
```

**Esquema de la base de datos local:**

```typescript
// lib/localDb.ts
import Dexie, { Table } from 'dexie';

export interface LocalReport {
  localId: string;          // UUID generado en el cliente
  wellUuid: string;
  reportDate: string;
  shift: string;
  payload: object;          // los campos del reporte
  status: 'pending' | 'syncing' | 'synced' | 'conflict';
  createdAt: string;
  attempts: number;         // intentos de sync fallidos
}

export interface LocalVoiceLog {
  localId: string;
  wellUuid: string;
  audioBlob: Blob;          // el audio en crudo
  shift: string;
  reportDate: string;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  createdAt: string;
  attempts: number;
}

export interface LocalDowntimeEvent {
  localId: string;
  wellUuid: string;
  payload: object;
  status: 'pending' | 'synced';
  createdAt: string;
}

class OilboardsLocalDB extends Dexie {
  reports!: Table<LocalReport>;
  voiceLogs!: Table<LocalVoiceLog>;
  downtimeEvents!: Table<LocalDowntimeEvent>;

  constructor() {
    super('oilboards-campo');
    this.version(1).stores({
      reports:       'localId, wellUuid, status, reportDate',
      voiceLogs:     'localId, wellUuid, status',
      downtimeEvents:'localId, wellUuid, status',
    });
  }
}

export const localDb = new OilboardsLocalDB();
```

### 3.3 Flujo completo de captura offline

```
OPERADOR LLENA FORMULARIO
          │
          ▼
¿Hay internet?
    │           │
   SÍ          NO
    │           │
    ▼           ▼
POST al      Guardar en
servidor     IndexedDB
    │        (status: pending)
    │           │
    ▼           │
Guardado     Mostrar: "✓ Guardado
confirmado   sin conexión. Se
             sincronizará automáticamente."
                │
                ▼
          Detectar red
          (Online event /
          Periodic Sync)
                │
                ▼
          SyncQueue.flush()
          → POST /api/v1/sync
          con batch de pendientes
                │
                ▼
          ¿Éxito?
         │       │
        SÍ       NO
         │       │
         ▼       ▼
   status:    attempts++
   'synced'   Si attempts > 3
              → status: 'failed'
              → notificar al usuario
```

### 3.4 El SyncManager (clase central)

```typescript
// lib/syncManager.ts

export class SyncManager {

  // Guardar reporte (decide si manda ahora o encola)
  async saveReport(wellUuid: string, payload: object): Promise<void> {
    const localId = crypto.randomUUID();

    await localDb.reports.add({
      localId,
      wellUuid,
      reportDate: payload.report_date,
      shift: payload.shift,
      payload,
      status: 'pending',
      createdAt: new Date().toISOString(),
      attempts: 0,
    });

    // Intentar sync inmediato si hay red
    if (navigator.onLine) {
      await this.flush();
    }
  }

  // Vaciar la cola de pendientes
  async flush(): Promise<void> {
    const pendingReports = await localDb.reports
      .where('status').equals('pending')
      .toArray();

    const pendingEvents = await localDb.downtimeEvents
      .where('status').equals('pending')
      .toArray();

    if (pendingReports.length === 0 && pendingEvents.length === 0) return;

    // Marcar como 'syncing' para evitar doble envío
    const ids = pendingReports.map(r => r.localId);
    await localDb.reports.where('localId').anyOf(ids)
      .modify({ status: 'syncing' });

    try {
      const response = await api.post('/sync', {
        device_id: this.getDeviceId(),
        records: [
          ...pendingReports.map(r => ({
            type: 'daily_report',
            well_uuid: r.wellUuid,
            local_id: r.localId,
            payload: r.payload,
          })),
          ...pendingEvents.map(e => ({
            type: 'downtime_event',
            well_uuid: e.wellUuid,
            local_id: e.localId,
            payload: e.payload,
          })),
        ],
      });

      // Procesar resultados
      for (const result of response.data.results) {
        if (result.status === 'created') {
          await localDb.reports.where('localId')
            .equals(result.local_id)
            .modify({ status: 'synced' });
        } else if (result.status === 'conflict_skipped') {
          await localDb.reports.where('localId')
            .equals(result.local_id)
            .modify({ status: 'conflict' });
          // Notificar al usuario que hay un conflicto
          this.notifyConflict(result);
        }
      }
    } catch (error) {
      // En error: revertir a 'pending' e incrementar intentos
      await localDb.reports.where('localId').anyOf(ids)
        .modify(r => {
          r.status = r.attempts >= 3 ? 'failed' : 'pending';
          r.attempts += 1;
        });
    }
  }

  // Detectar reconexión y sincronizar automáticamente
  registerOnlineListener(): void {
    window.addEventListener('online', () => {
      console.log('[Oilboards] Conexión restaurada. Sincronizando...');
      this.flush();
    });
  }

  // ID único del dispositivo (persiste en localStorage)
  private getDeviceId(): string {
    let id = localStorage.getItem('oilboards_device_id');
    if (!id) {
      id = `device-${crypto.randomUUID()}`;
      localStorage.setItem('oilboards_device_id', id);
    }
    return id;
  }

  private notifyConflict(result: any): void {
    // Mostrar toast/banner al usuario con el conflicto
    console.warn('[Oilboards] Conflicto de sincronización:', result);
  }
}

export const syncManager = new SyncManager();
```

### 3.5 Indicador visual de estado de sincronización

La UI siempre muestra al operador en qué estado está. Es crítico para que confíe en la app.

```
┌─────────────────────────────────────┐
│ 🟢 Sincronizado — Último: 10:32 AM  │  (todo OK)
│ 🟡 Sin conexión — 3 reportes pendientes │  (offline con datos)
│ 🔄 Sincronizando...                 │  (flush en progreso)
│ 🔴 Error de sync — Reintentar       │  (falló 3 veces)
└─────────────────────────────────────┘
```

Este indicador vive en la barra superior de la vista `/campo` y se actualiza reactivamente con el estado de IndexedDB.

---

## 4. Captura de audio (Consola de Audio / NLP)

### 4.1 API del navegador: `MediaRecorder`

```typescript
// hooks/useAudioRecorder.ts

export function useAudioRecorder() {
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobEvent['data'][]>([]);

  const startRecording = async () => {
    // Pedir permiso al micrófono
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: getSupportedMimeType(), // ver §4.2
    });

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, {
        type: getSupportedMimeType()
      });
      setAudioBlob(blob);
      chunksRef.current = [];
      stream.getTracks().forEach(track => track.stop());
    };

    mediaRecorder.start(1000); // chunk cada 1 segundo
    mediaRecorderRef.current = mediaRecorder;
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  return { recording, audioBlob, startRecording, stopRecording };
}

// Detectar formato soportado por el dispositivo
function getSupportedMimeType(): string {
  const types = [
    'audio/webm;codecs=opus', // Chrome/Android (preferido)
    'audio/mp4',              // iOS Safari
    'audio/ogg;codecs=opus',  // Firefox
    'audio/webm',             // fallback
  ];
  return types.find(t => MediaRecorder.isTypeSupported(t)) ?? 'audio/webm';
}
```

### 4.2 Formato de audio por plataforma

| Plataforma | Formato soportado | Notas |
|---|---|---|
| Android Chrome | `audio/webm;codecs=opus` | Óptimo, tamaño pequeño |
| iOS Safari 14.5+ | `audio/mp4` | Único soportado en iOS |
| Firefox | `audio/ogg;codecs=opus` | Desktop |

> **Deepgram y Whisper aceptan todos estos formatos.** No hay que convertir en el cliente.

### 4.3 Límites y validaciones de audio

| Parámetro | Límite | Por qué |
|---|---|---|
| Duración máxima | 5 minutos | Un turno completo cabe en 3-5 min; audios más largos sugieren error |
| Tamaño máximo | 25 MB | Límite del endpoint de upload |
| Duración mínima | 3 segundos | Evitar uploads accidentales |

```typescript
// Validar antes de subir
const validateAudio = (blob: Blob, durationSeconds: number): string | null => {
  if (durationSeconds < 3)  return 'El audio es muy corto. Mínimo 3 segundos.';
  if (durationSeconds > 300) return 'El audio supera el límite de 5 minutos.';
  if (blob.size > 25 * 1024 * 1024) return 'El archivo supera el límite de 25 MB.';
  return null; // OK
};
```

### 4.4 Manejo de permisos de micrófono

El navegador pide permiso la primera vez. Hay que manejar todos los estados:

```typescript
type MicPermission = 'granted' | 'denied' | 'prompt' | 'unsupported';

async function checkMicPermission(): Promise<MicPermission> {
  if (!navigator.mediaDevices?.getUserMedia) return 'unsupported';

  try {
    const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
    return result.state as MicPermission;
  } catch {
    // navigator.permissions no disponible en algunos browsers
    return 'prompt';
  }
}
```

**UX por estado de permiso:**

| Estado | Qué muestra la UI |
|---|---|
| `granted` | Botón de grabar activo |
| `prompt` | Botón de grabar; al tocar, el browser pide permiso |
| `denied` | Banner: "Permiso de micrófono denegado. Ve a Configuración > [app] > Micrófono para activarlo." |
| `unsupported` | Banner: "Tu navegador no soporta grabación de audio. Usa Chrome en Android." |

### 4.5 Flujo completo de audio offline

```
OPERADOR TOCA "Grabar"
        │
        ▼
¿Permiso de micrófono?
    NO → mostrar instrucciones
    SÍ ↓
        │
        ▼
MediaRecorder graba
(indicador visual: botón rojo pulsante + timer)
        │
        ▼
"Detener" → audioBlob en memoria
        │
        ▼
Guardar en IndexedDB (localVoiceLogs)
como Blob + metadata
        │
        ▼
¿Hay internet?
    SÍ → POST /wells/{uuid}/voice-logs (multipart)
         → Response 202 → polling / WebSocket
         → Cuando status = 'structured':
           mostrar transcript + JSON para validar
    NO → status: 'pending'
         "Audio guardado. Se procesará cuando haya conexión."
         → Al reconectar: flush() sube el audio
```

> **Nota importante:** los audios Blob se guardan en IndexedDB sin problema (Dexie los soporta nativamente). El tamaño de un audio de 3 minutos en webm/opus es ~500 KB — muy manejable.

---

## 5. Vista móvil `/campo` — diseño y UX

Esta es la pantalla que el operador ve en campo. Debe ser extremadamente simple.

### 5.1 Principios de diseño para campo

- **Botones grandes.** Mínimo 48×48 px de área táctil. El operador usa guantes o tiene los dedos sucios.
- **Contraste alto.** Dark mode (`#0B0F19`) con texto blanco — legible bajo el sol directo.
- **Mínimo scroll.** El formulario de un turno debe caber en 2-3 pantallas máximo.
- **Feedback inmediato.** Cada acción confirma visualmente en <200ms.
- **Sin jerga de sistema.** Nada de "sincronizando con el servidor". Decir "Guardando..." y "Listo ✓".

### 5.2 Estructura de la vista `/campo`

```
┌──────────────────────────────────┐
│  OILBOARDS CAMPO          [🔔][👤] │
│  🟡 Sin conexión — 2 pendientes  │  ← indicador de sync
├──────────────────────────────────┤
│                                  │
│  [← POZO-101H ▾]                 │  ← selector de pozo asignado
│  Lunes 24 jun 2026 · Turno mañana│
│                                  │
│  ┌────────────────────────────┐  │
│  │  📋 REPORTE DEL TURNO     │  │
│  ├────────────────────────────┤  │
│  │ Aceite bruto  [____] bbl   │  │
│  │ BSW           [____] %     │  │
│  │ Gas asociado  [____] MMpcd │  │
│  │ Agua          [____] bbl   │  │
│  │ Horas prod.   [____] h     │  │
│  │ Paro:  ○ No   ● Sí _______ │  │
│  └────────────────────────────┘  │
│                                  │
│  ┌────────────────────────────┐  │
│  │  🎙️ DICTAR NOVEDADES      │  │
│  │  [    ● GRABAR    ]        │  │
│  └────────────────────────────┘  │
│                                  │
│  [ GUARDAR REPORTE DEL TURNO ]   │  ← CTA principal
│                                  │
└──────────────────────────────────┘
```

### 5.3 El selector de pozo

Un operador puede tener 1-5 pozos asignados. El selector muestra solo los suyos (por `well_user`). Al entrar por primera vez en el día, la app recuerda el último pozo seleccionado.

### 5.4 Navegación simplificada para el operador

El sidebar completo del dashboard **no aparece** en la vista `/campo`. El operador solo ve:
- Su pozo y su turno.
- El formulario.
- La grabadora.
- El botón de guardar.
- El indicador de sync.

Todo lo demás (KPIs, alertas, módulos 2 y 3) solo aparece cuando el usuario tiene rol Ingeniero o Admin.

---

## 6. Instalación de la PWA (flujo del operador)

El operador necesita instalar la PWA una sola vez:

### Android (Chrome) — el caso principal
1. Abrir `https://oilboards.com/campo` en Chrome.
2. Chrome muestra automáticamente el banner "Instalar Oilboards Campo".
3. Tocar "Instalar" → el ícono aparece en la pantalla de inicio.
4. Desde ese momento abre como app, sin barra del navegador.

> Si no aparece el banner automáticamente: menú de Chrome → "Agregar a pantalla de inicio".

### iOS (Safari)
1. Abrir `https://oilboards.com/campo` en Safari (no Chrome en iOS — no soporta PWA install).
2. Tocar el ícono de compartir → "Agregar a pantalla de inicio".
3. Confirmar.

> **Limitación iOS:** las notificaciones push en PWA en iOS requieren iOS 16.4+. Para versiones anteriores, las alertas solo aparecen dentro de la app (no como push del sistema).

### Actualización automática
Cuando hay una nueva versión del Service Worker (deploy), el usuario recibe un banner: "Hay una actualización disponible. [Actualizar ahora]". Al tocar, recarga con la versión nueva. No requiere ninguna acción en el App Store.

---

## 7. Notificaciones push (MVP ligero)

### Qué notificar en el MVP
Solo lo crítico para el operador en campo:

| Evento | Notificación | Canal |
|---|---|---|
| Alerta de anomalía en su pozo | "⚠️ POZO-101H: Riesgo detectado. Revisa Oilboards." | Push (si tiene permiso) + in-app |
| Audio procesado listo | "Tu bitácora del turno ya está lista para revisar." | In-app (WebSocket) |
| Recordatorio de reporte | "Recuerda capturar el reporte del turno nocturno." | Push (si tiene permiso) |

### Implementación en MVP
**In-app (WebSocket Reverb):** ya está definido en los canales del Doc 5. Siempre funciona mientras la app está abierta.

**Push nativo:** requiere registrar el Service Worker para push + el backend configurado con **Web Push** (librería `minishlink/web-push` para Laravel). Recomiendo dejarlo para después del MVP — las notificaciones in-app son suficientes para el piloto.

---

## 8. Manejo del modo avión y casos extremos

### Escenario 1: El operador llena el formulario y nunca hay red en todo el turno
- El reporte se guarda en IndexedDB con `status: 'pending'`.
- Al llegar a la estación base (con Wi-Fi), la app detecta la red y hace flush automáticamente.
- El operador ve el indicador cambiar de 🟡 a 🟢.

### Escenario 2: El operador cambia de celular o borra la app
- Los datos en IndexedDB **se pierden** si se borra la app antes de sincronizar.
- Mitigación: mostrar un aviso claro si hay datos pendientes y el usuario intenta cerrar (`beforeunload`).
- En dispositivos corporativos administrados (MDM), esto no es problema — la app no se borra accidentalmente.

### Escenario 3: Dos operadores reportan el mismo pozo en el mismo turno
- El servidor usa el `unique(well_id, report_date, shift)` del modelo de datos.
- El segundo que llega recibe `"status": "conflict_skipped"` en el sync.
- La app muestra: "Este turno ya fue reportado por [nombre]. Contacta a tu supervisor si hay un error."

### Escenario 4: El audio es demasiado grande para el almacenamiento del dispositivo
- Validar tamaño antes de grabar (si el dispositivo tiene <50 MB libres, advertir).
- Límite de grabación de 5 minutos evita audios monstruosos.
- Si el dispositivo no puede guardar: mostrar error claro y sugerir captura manual.

### Escenario 5: La app se cierra a la mitad del formulario
- Los campos del formulario se guardan en IndexedDB como borrador (`status: 'draft'`) cada 30 segundos automáticamente y al cambiar de campo.
- Al reabrir, la app detecta el borrador y pregunta: "Tienes un reporte sin guardar del turno matutino. ¿Continuar?"

---

## 9. Stack técnico de la capa móvil

| Herramienta | Rol | Instalación |
|---|---|---|
| `vite-plugin-pwa` | Genera Service Worker y manifest automáticamente con Vite | `npm i -D vite-plugin-pwa` |
| `workbox-window` | Cliente JS para manejar actualizaciones del SW | incluido con vite-plugin-pwa |
| `Dexie.js` | IndexedDB con API limpia (almacenamiento offline) | `npm i dexie` |
| `MediaRecorder API` | Grabación de audio (nativa del navegador) | sin instalación |
| `react-use` | Hooks útiles: `useNetworkState`, `useLocalStorage` | `npm i react-use` |

### Configuración de `vite-plugin-pwa` en `vite.config.ts`

```typescript
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    // ... otros plugins (react, laravel)
    VitePWA({
      registerType: 'prompt', // Pedir confirmación al usuario antes de actualizar
      manifest: {
        // el contenido del manifest.json del §2.1
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/oilboards\.com\/api\/v1\/wells/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-wells-cache',
              expiration: { maxAgeSeconds: 3600 }, // 1 hora
            },
          },
        ],
      },
    }),
  ],
});
```

---

## 10. Checklist de implementación

### PWA base
- [ ] Instalar `vite-plugin-pwa` y configurar.
- [ ] Crear `manifest.json` con íconos en los tamaños requeridos (192, 512px).
- [ ] Verificar que la app pase el **Lighthouse PWA audit** (Chrome DevTools → Lighthouse).
- [ ] Confirmar que el Service Worker se registra correctamente en producción (HTTPS obligatorio).

### Almacenamiento offline
- [ ] Instalar Dexie y definir el esquema de `OilboardsLocalDB`.
- [ ] Implementar `SyncManager` con `flush()` y `registerOnlineListener()`.
- [ ] Implementar guardado automático de borrador cada 30 segundos.
- [ ] Implementar recuperación de borrador al reabrir la app.
- [ ] Probar los 5 escenarios extremos del §8.

### Audio
- [ ] Implementar `useAudioRecorder` hook.
- [ ] Implementar `getSupportedMimeType()` para detección de formato.
- [ ] Implementar validaciones de duración y tamaño.
- [ ] Implementar manejo de los 4 estados de permiso de micrófono.
- [ ] Guardar audioBlob en IndexedDB (`localVoiceLogs`).
- [ ] Probar en Android Chrome **y** en iOS Safari.

### UX móvil
- [ ] Crear vista `/campo` simplificada (sin sidebar completo).
- [ ] Implementar selector de pozo filtrado por asignación del operador.
- [ ] Implementar indicador de estado de sync en la barra superior.
- [ ] Verificar que todos los botones tienen área táctil mínima de 48×48 px.
- [ ] Probar legibilidad bajo luz solar directa (dark mode + contraste alto).
- [ ] Probar flujo completo en dispositivo real Android + iOS.

### Sincronización
- [ ] Conectar `SyncManager.flush()` al evento `window.online`.
- [ ] Implementar el endpoint `POST /api/v1/sync` del Doc 5.
- [ ] Probar conflicto `unique(well_id, report_date, shift)` con dos dispositivos.
- [ ] Probar recuperación después de 3 intentos fallidos.

---

## 11. Decisión pendiente para confirmar

> ❓ **¿Qué dispositivos usan los operadores de campo en los activos target?**
>
> - Si son **Android** (Samsung Galaxy Tab Active, Getac, Panasonic Toughbook) → la PWA es perfecta, arrancar con esto.
> - Si son **iOS** (iPhone/iPad corporativo) → evaluar Capacitor desde el inicio para evitar las limitaciones de Safari.
> - Si son **ambos** → PWA primero, Capacitor si iOS da problemas en el piloto.
>
> Esta decisión no bloquea el desarrollo del backend ni del dashboard. Solo afecta la capa de la app de campo. Se puede arrancar con PWA y ajustar después.

---

*Fin del Doc 6. Con esto, el Módulo 1 (captura en campo) tiene todo lo necesario para construirse correctamente desde el inicio — sin tener que reescribir la lógica offline cuando llegue el primer piloto real.*
