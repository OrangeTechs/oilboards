# 🛢️ OILBOARDS — Doc 8: Seguridad y Autenticación en Código

**RBAC, Global Scope de tenant, middleware y endurecimiento · Para desarrollo backend**

| Campo | Valor |
|---|---|
| Versión | v0.1 |
| Prioridad | 🔴 ALTA — implementar ANTES de escribir cualquier Controller |
| Propósito | Definir en código exacto cómo se implementa la seguridad de tenant, roles y acceso |

> **Por qué va primero.** Si construyes los Controllers antes del Global Scope de tenant, cada query puede filtrar datos entre clientes. Un bug de seguridad a este nivel no se parchea con un hotfix — requiere auditar y reescribir todo lo construido. Va primero, sin excepción.

---

## 1. Global Scope de Tenant

Toda tabla con datos de cliente lleva `organization_id`. Este scope lo aplica automáticamente en cada query de Eloquent, sin que el dev tenga que acordarse en cada Controller.

### 1.1 Trait `BelongsToOrganization`

```php
// app/Traits/BelongsToOrganization.php

namespace App\Traits;

use App\Models\Organization;
use App\Scopes\OrganizationScope;
use Illuminate\Support\Facades\Auth;

trait BelongsToOrganization
{
    // Aplica el scope global automáticamente al bootear el modelo
    protected static function bootBelongsToOrganization(): void
    {
        // Al crear un registro, setea organization_id automáticamente
        static::creating(function ($model) {
            if (Auth::check() && empty($model->organization_id)) {
                $model->organization_id = Auth::user()->organization_id;
            }
        });

        // En cada query, filtra por la organización del usuario autenticado
        static::addGlobalScope(new OrganizationScope());
    }

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }
}
```

### 1.2 OrganizationScope

```php
// app/Scopes/OrganizationScope.php

namespace App\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;
use Illuminate\Support\Facades\Auth;

class OrganizationScope implements Scope
{
    public function apply(Builder $builder, Model $model): void
    {
        // Solo aplica si hay un usuario autenticado
        // (Jobs en background o comandos artisan pueden correr sin auth)
        if (Auth::check()) {
            $builder->where(
                $model->getTable() . '.organization_id',
                Auth::user()->organization_id
            );
        }
    }
}
```

### 1.3 Aplicar el trait a los modelos

```php
// app/Models/Well.php
class Well extends Model
{
    use BelongsToOrganization; // ← esto es todo lo que necesita cada modelo

    protected $fillable = [
        'asset_id', 'name', 'type', 'lift_type',
        'current_status', 'latitude', 'longitude',
        'choke_size', 'metadata',
    ];
}

// app/Models/DailyReport.php
class DailyReport extends Model
{
    use BelongsToOrganization;
    // ...
}

// Aplicar en: Asset, Well, Equipment, Manual, DailyReport,
// DowntimeEvent, VoiceLog, HseIncident, Alert, AlertRule,
// ProductionTarget, FiscalizationRecord, AiInteraction, SyncLog
```

> **Cuándo NO usar el trait:** `Organization`, `User` (tienen su propia lógica), y las tablas de sistema de Spatie (roles/permissions). Las tablas de auditoría y telemetría tienen su propio acceso controlado por política.

### 1.4 Jobs en background (sin Auth context)

Los Jobs de cola (StructureVoiceLog, GenerateAlertDiagnosis) corren sin usuario autenticado. Deben ignorar el Global Scope:

```php
// Dentro del Job, al hacer queries:
$well = Well::withoutGlobalScope(OrganizationScope::class)
    ->findOrFail($this->wellId);

// O más limpio: pasar el modelo ya cargado al Job desde el Controller
// (el Controller ya lo filtró con el scope)
class StructureVoiceLog implements ShouldQueue
{
    public function __construct(public VoiceLog $voiceLog) {}
    // El $voiceLog ya viene del Controller, que ya aplicó el scope.
    // No necesita hacer queries con organización aquí.
}
```

---

## 2. RBAC con Spatie Laravel Permission

### 2.1 Instalación y configuración

```bash
composer require spatie/laravel-permission
php artisan vendor:publish --provider="Spatie\LaravelPermission\PermissionServiceProvider"
php artisan migrate
```

### 2.2 Seeder de roles y permisos

```php
// database/seeders/RolesAndPermissionsSeeder.php

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        // Reset de caché
        app()[\Spatie\LaravelPermission\PermissionRegistrar::class]
            ->forgetCachedPermissions();

        // --- PERMISOS ---

        // Pozos y activos
        Permission::create(['name' => 'view_assets']);
        Permission::create(['name' => 'manage_assets']);    // crear/editar activos y pozos
        Permission::create(['name' => 'assign_operators']); // asignar operadores a pozos

        // Reportes
        Permission::create(['name' => 'submit_reports']);   // capturar reporte
        Permission::create(['name' => 'validate_reports']); // validar/aprobar reporte
        Permission::create(['name' => 'view_reports']);

        // Voz / NLP
        Permission::create(['name' => 'submit_voice_logs']);
        Permission::create(['name' => 'view_voice_logs']);

        // Paros
        Permission::create(['name' => 'submit_downtime']);
        Permission::create(['name' => 'view_downtime']);

        // Alertas
        Permission::create(['name' => 'view_alerts']);
        Permission::create(['name' => 'manage_alert_rules']);
        Permission::create(['name' => 'acknowledge_alerts']);

        // KPIs y regulatorio
        Permission::create(['name' => 'view_kpis']);
        Permission::create(['name' => 'manage_targets']);   // cargar metas CNE

        // Exportación
        Permission::create(['name' => 'export_reports']);

        // Asistente IA
        Permission::create(['name' => 'use_assistant']);

        // Usuarios
        Permission::create(['name' => 'manage_users']);

        // Salas
        Permission::create(['name' => 'manage_rooms']);
        Permission::create(['name' => 'view_rooms']);

        // --- ROLES ---

        $operador = Role::create(['name' => 'operador']);
        $operador->givePermissionTo([
            'view_assets',
            'submit_reports',
            'submit_voice_logs',
            'submit_downtime',
            'view_alerts',       // ver alertas de sus pozos
        ]);

        $ingeniero = Role::create(['name' => 'ingeniero']);
        $ingeniero->givePermissionTo([
            'view_assets',
            'manage_assets',
            'submit_reports',
            'validate_reports',
            'view_reports',
            'submit_voice_logs',
            'view_voice_logs',
            'submit_downtime',
            'view_downtime',
            'view_alerts',
            'manage_alert_rules',
            'acknowledge_alerts',
            'view_kpis',
            'export_reports',
            'use_assistant',
            'view_rooms',
        ]);

        $admin = Role::create(['name' => 'admin']);
        $admin->givePermissionTo(Permission::all()); // admin tiene todo
    }
}
```

### 2.3 Modelo User con Spatie

```php
// app/Models/User.php

use Spatie\LaravelPermission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasApiTokens, HasRoles; // HasApiTokens = Sanctum

    protected $fillable = [
        'organization_id', 'name', 'email', 'password',
        'phone', 'position', 'locale',
    ];

    protected $hidden = ['password', 'remember_token'];

    // Helper: rol único del usuario (cada usuario tiene un solo rol)
    public function getRoleNameAttribute(): string
    {
        return $this->roles->first()?->name ?? 'sin_rol';
    }
}
```

---

## 3. Autenticación con Laravel Sanctum

### 3.1 Configuración en `config/sanctum.php`

```php
// Tokens expiran en 8 horas (turno de trabajo)
'expiration' => 480, // minutos

// Para la app móvil PWA, usar stateful (cookie) en el mismo dominio
// o tokens para requests de API puras
'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', 'oilboards.com')),
```

### 3.2 AuthController completo

```php
// app/Http/Controllers/Api/AuthController.php

class AuthController extends Controller
{
    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'error' => [
                    'code'    => 'INVALID_CREDENTIALS',
                    'message' => 'Credenciales incorrectas.',
                ]
            ], 401);
        }

        // Verificar que la organización esté activa
        if ($user->organization->status !== 'active') {
            return response()->json([
                'error' => [
                    'code'    => 'ACCOUNT_SUSPENDED',
                    'message' => 'Tu cuenta está suspendida. Contacta a soporte.',
                ]
            ], 403);
        }

        // Revocar tokens anteriores (un solo token activo por usuario)
        $user->tokens()->delete();

        $token = $user->createToken(
            name: 'oilboards-app',
            expiresAt: now()->addMinutes(480)
        )->plainTextToken;

        $user->update(['last_login_at' => now()]);

        return response()->json([
            'data' => [
                'token'      => $token,
                'token_type' => 'Bearer',
                'user'       => new UserResource($user),
            ]
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'data' => ['message' => 'Sesión cerrada correctamente.']
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'data' => new UserResource($request->user())
        ]);
    }
}
```

### 3.3 Middleware de roles en rutas

```php
// routes/api.php

Route::middleware(['auth:sanctum'])->group(function () {

    // Solo admin
    Route::middleware('role:admin')->group(function () {
        Route::apiResource('users', UserController::class);
        Route::post('/assets/{asset}/wells', [WellController::class, 'store']);
        Route::post('/wells/{well}/assign-operator', [WellController::class, 'assignOperator']);
        Route::post('/assets/{asset}/production-targets', [ProductionTargetController::class, 'store']);
        Route::post('/assets/{asset}/reports/export',
            [ExportController::class, 'store'])->middleware('permission:export_reports');
    });

    // Ingeniero o admin
    Route::middleware('role:ingeniero|admin')->group(function () {
        Route::post('/reports/{report}/validate', [DailyReportController::class, 'validate']);
        Route::get('/assets/{asset}/kpis',        [KpiController::class, 'index']);
        Route::apiResource('alert-rules',          AlertRuleController::class);
        Route::post('/assets/{asset}/assistant/chat', [AssistantController::class, 'chat']);
        Route::get('/assets/{asset}/regulatory-compliance', [RegulatoryController::class, 'compliance']);
    });

    // Todos los roles autenticados
    Route::get('/assets/{asset}/wells',           [WellController::class, 'index']);
    Route::get('/wells/{well}/reports',           [DailyReportController::class, 'index']);
    Route::post('/wells/{well}/reports',          [DailyReportController::class, 'store']);
    Route::post('/wells/{well}/voice-logs',       [VoiceLogController::class, 'store']);
    Route::get('/voice-logs/{voiceLog}',          [VoiceLogController::class, 'show']);
    Route::post('/sync',                          [SyncController::class, 'sync']);
    // ...resto de rutas
});
```

---

## 4. Policies de Eloquent (autorización por recurso)

El middleware de roles protege la ruta. Las Policies protegen el **recurso específico** — por ejemplo, que un Operador solo pueda ver/editar reportes de sus pozos asignados.

```php
// app/Policies/DailyReportPolicy.php

class DailyReportPolicy
{
    // ¿Puede ver este reporte?
    public function view(User $user, DailyReport $report): bool
    {
        // Admin e ingeniero ven todo (el Global Scope ya filtra por organización)
        if ($user->hasRole(['admin', 'ingeniero'])) return true;

        // Operador: solo reportes de sus pozos asignados
        return $user->wells()->where('wells.id', $report->well_id)->exists();
    }

    // ¿Puede crear/editar un reporte en este pozo?
    public function submitReport(User $user, Well $well): bool
    {
        if ($user->hasRole(['admin', 'ingeniero'])) return true;

        // Operador: solo sus pozos asignados
        return $user->wells()->where('wells.id', $well->id)->exists();
    }

    // ¿Puede validar?
    public function validate(User $user, DailyReport $report): bool
    {
        return $user->hasRole(['admin', 'ingeniero']);
    }
}

// app/Policies/WellPolicy.php
class WellPolicy
{
    public function viewAny(User $user): bool
    {
        return true; // todos ven pozos (filtrados por Global Scope + asignación)
    }

    public function update(User $user, Well $well): bool
    {
        return $user->hasRole(['admin', 'ingeniero']);
    }
}
```

### Registrar las Policies

```php
// app/Providers/AuthServiceProvider.php

protected $policies = [
    DailyReport::class => DailyReportPolicy::class,
    Well::class        => WellPolicy::class,
    Alert::class       => AlertPolicy::class,
    VoiceLog::class    => VoiceLogPolicy::class,
];
```

### Usar en Controllers

```php
// app/Http/Controllers/Api/DailyReportController.php

public function store(StoreDailyReportRequest $request, Well $well): JsonResponse
{
    // Verificar que el usuario puede reportar en este pozo
    $this->authorize('submitReport', [DailyReport::class, $well]);

    // El Global Scope ya garantiza que $well pertenece a la organización.
    // La Policy garantiza que el operador tiene asignado este pozo.

    $report = DailyReport::updateOrCreate(
        [
            'well_id'     => $well->id,
            'report_date' => $request->report_date,
            'shift'       => $request->shift,
        ],
        $request->validated() + ['reported_by' => $request->user()->id]
    );

    return response()->json(['data' => new DailyReportResource($report)], 201);
}
```

---

## 5. Form Requests (validación)

Nunca validar en el Controller. Cada endpoint tiene su Form Request:

```php
// app/Http/Requests/StoreDailyReportRequest.php

class StoreDailyReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        // La autorización de Policy se hace en el Controller con $this->authorize()
        return true;
    }

    public function rules(): array
    {
        return [
            'report_date'        => ['required', 'date', 'before_or_equal:today'],
            'shift'              => ['required', 'in:matutino,vespertino,nocturno'],
            'gross_oil_bbl'      => ['required', 'numeric', 'min:0', 'max:99999'],
            'bsw_pct'            => ['required', 'numeric', 'min:0', 'max:100'],
            'gas_mmscfd'         => ['nullable', 'numeric', 'min:0'],
            'water_bbl'          => ['nullable', 'numeric', 'min:0'],
            'production_hours'   => ['required', 'numeric', 'min:0', 'max:24'],
            'diesel_consumed_l'  => ['nullable', 'numeric', 'min:0'],
            'source'             => ['required', 'in:manual,voice,scada'],
            'downtime_events'    => ['nullable', 'array'],
            'downtime_events.*.started_at'  => ['required', 'date'],
            'downtime_events.*.ended_at'    => ['nullable', 'date', 'after:downtime_events.*.started_at'],
            'downtime_events.*.category'    => ['required', 'in:mecanica,electrica,clima,mantenimiento,otro'],
            'downtime_events.*.root_cause'  => ['required', 'string', 'max:500'],
            'hse_incidents'      => ['nullable', 'array'],
        ];
    }

    public function messages(): array
    {
        return [
            'report_date.before_or_equal' => 'No se pueden crear reportes para fechas futuras.',
            'bsw_pct.max'                 => 'El BSW no puede superar el 100%.',
            'production_hours.max'        => 'Las horas de producción no pueden superar 24.',
        ];
    }
}
```

---

## 6. API Resources (transformación de respuesta)

Los Resources controlan exactamente qué campos se exponen en la API. Nunca retornar modelos Eloquent directamente.

```php
// app/Http/Resources/DailyReportResource.php

class DailyReportResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'               => $this->uuid, // exponer UUID, no ID interno
            'well_uuid'        => $this->well->uuid,
            'report_date'      => $this->report_date->toDateString(),
            'shift'            => $this->shift,
            'gross_oil_bbl'    => (float) $this->gross_oil_bbl,
            'bsw_pct'          => (float) $this->bsw_pct,
            'net_oil_bbl'      => (float) $this->net_oil_bbl,
            'gas_mmscfd'       => $this->gas_mmscfd ? (float) $this->gas_mmscfd : null,
            'water_bbl'        => $this->water_bbl  ? (float) $this->water_bbl  : null,
            'production_hours' => (float) $this->production_hours,
            'source'           => $this->source,
            'status'           => $this->status,
            'reported_by'      => [
                'id'   => $this->reporter->uuid,
                'name' => $this->reporter->name,
            ],
            'downtime_events'  => DowntimeEventResource::collection(
                $this->whenLoaded('downtimeEvents')
            ),
            'hse_incidents'    => HseIncidentResource::collection(
                $this->whenLoaded('hseIncidents')
            ),
            'created_at'       => $this->created_at->toISOString(),
            // organization_id NUNCA se expone en la API
        ];
    }
}
```

> **Regla:** `organization_id` **nunca** aparece en ningún Resource. Es un detalle interno de seguridad.

---

## 7. Endurecimiento de seguridad adicional

### 7.1 Headers de seguridad (Nginx)

```nginx
# En el server block de oilboards.com
add_header X-Frame-Options "SAMEORIGIN";
add_header X-Content-Type-Options "nosniff";
add_header X-XSS-Protection "1; mode=block";
add_header Referrer-Policy "strict-origin-when-cross-origin";
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;";
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

### 7.2 Rate limiting por endpoint sensible

```php
// app/Providers/RouteServiceProvider.php

protected function configureRateLimiting(): void
{
    // Login: máximo 5 intentos por minuto por IP
    RateLimiter::for('login', function (Request $request) {
        return Limit::perMinute(5)->by($request->ip())
            ->response(fn() => response()->json([
                'error' => ['code' => 'TOO_MANY_ATTEMPTS',
                            'message' => 'Demasiados intentos. Espera 1 minuto.']
            ], 429));
    });

    // API general: 60 por minuto por token
    RateLimiter::for('api', function (Request $request) {
        return Limit::perMinute(60)->by($request->user()?->id ?? $request->ip());
    });

    // Sync offline: 10 por minuto (cada uno trae hasta 50 registros)
    RateLimiter::for('sync', function (Request $request) {
        return Limit::perMinute(10)->by($request->user()->id);
    });

    // Voz/IA: 30 por hora (evitar abuso de Claude API)
    RateLimiter::for('ai', function (Request $request) {
        return Limit::perHour(30)->by($request->user()->id);
    });
}
```

### 7.3 Caducidad de contraseñas

```php
// app/Http/Middleware/CheckPasswordExpiry.php

class CheckPasswordExpiry
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->password_changed_at) {
            $daysSinceChange = $user->password_changed_at->diffInDays(now());

            if ($daysSinceChange > 90) {
                return response()->json([
                    'error' => [
                        'code'    => 'PASSWORD_EXPIRED',
                        'message' => 'Tu contraseña expiró. Cámbiala para continuar.',
                    ]
                ], 403);
            }
        }

        return $next($request);
    }
}
```

### 7.4 Audit log automático (Observer global)

```php
// app/Observers/AuditObserver.php

class AuditObserver
{
    private function log(string $action, Model $model): void
    {
        // No auditar los propios audit_logs (loop infinito)
        if ($model instanceof AuditLog) return;

        $previous = $model->getOriginal();
        $current  = $model->getDirty();

        AuditLog::create([
            'organization_id' => $model->organization_id
                                 ?? Auth::user()?->organization_id,
            'user_id'         => Auth::id(),
            'action'          => $action,
            'auditable_type'  => get_class($model),
            'auditable_id'    => $model->getKey(),
            'changes'         => [
                'before' => $previous,
                'after'  => $current,
            ],
        ]);
        // El hash encadenado se calcula en el modelo AuditLog::creating()
    }

    public function created(Model $model): void  { $this->log('created', $model); }
    public function updated(Model $model): void  { $this->log('updated', $model); }
    public function deleted(Model $model): void  { $this->log('deleted', $model); }
}
```

---

## 8. Checklist de implementación (en orden)

- [ ] Crear `OrganizationScope` y trait `BelongsToOrganization`.
- [ ] Aplicar el trait a **todos** los modelos con datos de cliente (lista en §1.3).
- [ ] Instalar Spatie Laravel Permission y correr el seeder de roles/permisos.
- [ ] Agregar `HasRoles` al modelo `User`.
- [ ] Configurar Sanctum (expiración 480 min).
- [ ] Implementar `AuthController` (login, logout, me).
- [ ] Implementar middleware de roles en `routes/api.php`.
- [ ] Crear Policies para: `DailyReport`, `Well`, `Alert`, `VoiceLog`, `Asset`.
- [ ] Registrar Policies en `AuthServiceProvider`.
- [ ] Crear Form Requests para cada endpoint (no validar en Controllers).
- [ ] Crear API Resources para cada modelo expuesto (nunca exponer `organization_id`).
- [ ] Agregar headers de seguridad en Nginx.
- [ ] Configurar rate limiting por endpoint.
- [ ] Implementar `CheckPasswordExpiry` middleware.
- [ ] Implementar `AuditObserver` y registrarlo en `EventServiceProvider`.
- [ ] **Test crítico:** verificar que un usuario de Organización A **nunca** puede ver datos de Organización B, aunque adivine el ID.

---

*Fin del Doc 8.*
