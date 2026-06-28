# 🛢️ OILBOARDS — Doc 7: Spec de Exportación de Reportes

**Generación de PDF y Excel regulatorio · Para desarrollo backend**

| Campo | Valor |
|---|---|
| Versión | v0.1 |
| Propósito | Definir qué contiene cada tipo de reporte exportable, su formato exacto y cómo se genera |
| Librerías | DomPDF (PDF) + PhpSpreadsheet (Excel) vía Laravel |

> **Por qué importa.** "Reporte regulatorio con un clic" es literalmente el dolor #1 que vendes. Si el export se ve mal, tiene campos incorrectos o no coincide con lo que pide CNE/SENER, el cliente no lo adopta. Este documento define exactamente qué va en cada reporte.

---

## 1. Tipos de reporte en el MVP

| Código `type` | Nombre | Formato | Para quién |
|---|---|---|---|
| `daily_operations` | Reporte Diario de Operaciones | PDF + Excel | Dirección, CNE/SENER |
| `npt_summary` | Resumen de Tiempos No Operativos | PDF + Excel | Dirección, Pemex |
| `regulatory_cne` | Reporte de Cumplimiento CNE | Excel | Regulador (CNE/SENER) |

> `⚠️ TODO (negocio)`: Confirmar el formato exacto de reporte exigido por CNE/SENER bajo el Reglamento de la Ley del Sector Hidrocarburos (oct-2025). Los campos aquí son los estándar de la industria — ajustar si el regulador tiene formato específico.

---

## 2. Reporte Diario de Operaciones (`daily_operations`)

### 2.1 Contenido del PDF

**Encabezado (portada):**
- Logo de Oilboards + nombre de la organización
- Nombre del activo/campo
- Período reportado (fecha o rango)
- Fecha de generación
- Generado por (nombre del usuario)

**Sección 1 — Resumen Ejecutivo del Activo**
| Campo | Valor |
|---|---|
| Producción bruta total | X,XXX bbl |
| BSW promedio | XX.X % |
| **Producción neta total** | X,XXX bbl |
| Gas asociado total | X.XXX MMpcd |
| Agua producida total | X,XXX bbl |
| Horas totales en producción | XXX h |
| Uptime global del activo | XX.X % |
| NPT total | XX h XX min |
| Número de pozos activos | XX de XX |

**Sección 2 — Detalle por Pozo** (una fila por pozo)
| Pozo | Tipo levant. | Bruto bbl | BSW % | Neto bbl | Gas MMpcd | Agua bbl | Hrs prod. | Status |
|---|---|---|---|---|---|---|---|---|
| POZO-101H | BEC | 320.5 | 18.0 | 262.8 | 0.42 | 70.0 | 20.0 | Activo |

**Sección 3 — Paros y NPT del Período**
| Pozo | Inicio | Fin | Duración | Categoría | Causa raíz |
|---|---|---|---|---|---|
| POZO-101H | 24/06 03:00 | 24/06 07:00 | 4h 0min | Mecánica | Cambio empaquetadura |

**Sección 4 — Incidentes HSE**
Tabla de incidentes del período (si no hay: "Sin incidentes reportados en el período").

**Pie de página:**
- "Generado por Oilboards — oilboards.com"
- Timestamp de generación
- "Los datos contenidos en este reporte provienen de capturas operativas validadas. Oilboards no es responsable por errores en los datos de origen."

### 2.2 Contenido del Excel

Mismas secciones pero en hojas separadas:
- Hoja 1: Resumen ejecutivo
- Hoja 2: Detalle por pozo (con fórmulas: columna neto = bruto × (1 - BSW/100))
- Hoja 3: Paros y NPT
- Hoja 4: Incidentes HSE

---

## 3. Resumen de NPT (`npt_summary`)

**Contenido:**
- Tabla de todos los paros del período con: pozo, inicio, fin, duración, categoría, causa raíz.
- Gráfica de NPT por categoría (en Excel: gráfica de pie con los datos).
- Total de horas NPT por pozo.
- Costo estimado de producción diferida (si OPEX está configurado).

---

## 4. Reporte de Cumplimiento CNE (`regulatory_cne`)

**Contenido (Excel):**
- Columna A: Mes
- Columna B: Meta comprometida (bbl)
- Columna C: Producción real (bbl)
- Columna D: Cumplimiento % (= C/B × 100)
- Columna E: Status (En meta / Alerta / En riesgo)
- Gráfica de barras: meta vs. real por mes

> Este es el que más necesita validación con el regulador. Dejar la estructura flexible (configurable) para ajustar si CNE/SENER pide campos adicionales.

---

## 5. Implementación en Laravel

### 5.1 Librerías

```bash
composer require barryvdh/laravel-dompdf      # PDF
composer require phpoffice/phpspreadsheet      # Excel
```

### 5.2 ExportController

```php
// app/Http/Controllers/Api/ExportController.php

class ExportController extends Controller
{
    public function store(ExportRequest $request, Asset $asset): JsonResponse
    {
        $this->authorize('export_reports', $asset);

        $export = Export::create([
            'organization_id' => $request->user()->organization_id,
            'asset_id'        => $asset->id,
            'requested_by'    => $request->user()->id,
            'type'            => $request->type,
            'format'          => $request->format,
            'from'            => $request->from,
            'to'              => $request->to,
            'status'          => 'generating',
        ]);

        // Disparar Job asíncrono
        GenerateExport::dispatch($export);

        return response()->json([
            'data' => [
                'export_uuid' => $export->uuid,
                'status'      => 'generating',
                'message'     => 'El reporte se está generando.',
            ]
        ], 202);
    }
}
```

### 5.3 Job de generación

```php
// app/Jobs/GenerateExport.php

class GenerateExport implements ShouldQueue
{
    public function __construct(public Export $export) {}

    public function handle(): void
    {
        try {
            $filePath = match ($this->export->format) {
                'pdf'   => $this->generatePdf(),
                'excel' => $this->generateExcel(),
            };

            $this->export->update([
                'status'     => 'ready',
                'file_path'  => $filePath,
                'expires_at' => now()->addDay(),
            ]);

            // Notificar al usuario via Reverb
            broadcast(new ExportReady($this->export));

        } catch (\Exception $e) {
            $this->export->update(['status' => 'failed']);
            throw $e;
        }
    }

    private function generatePdf(): string
    {
        $data = $this->buildReportData();

        $pdf = Pdf::loadView(
            "exports.{$this->export->type}_pdf",
            $data
        )->setPaper('letter', 'landscape');

        $path = "exports/{$this->export->uuid}.pdf";
        Storage::put($path, $pdf->output());

        return $path;
    }

    private function generateExcel(): string
    {
        $spreadsheet = new Spreadsheet();
        $builder = new ExcelReportBuilder($spreadsheet, $this->export);
        $builder->build();

        $writer = new Xlsx($spreadsheet);
        $path   = "exports/{$this->export->uuid}.xlsx";

        Storage::put($path, $this->getSpreadsheetContent($writer));

        return $path;
    }

    private function buildReportData(): array
    {
        // Recolectar datos según el tipo de reporte y período
        $reports = DailyReport::with(['well', 'downtimeEvents', 'hseIncidents'])
            ->whereHas('well', fn($q) => $q->where('asset_id', $this->export->asset_id))
            ->whereBetween('report_date', [$this->export->from, $this->export->to])
            ->get();

        return [
            'asset'       => $this->export->asset,
            'organization'=> $this->export->asset->organization,
            'period_from' => $this->export->from,
            'period_to'   => $this->export->to,
            'reports'     => $reports,
            'generated_by'=> $this->export->requestedBy,
            'generated_at'=> now(),
        ];
    }
}
```

### 5.4 Vista Blade para PDF (`resources/views/exports/daily_operations_pdf.blade.php`)

```blade
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <style>
        body        { font-family: DejaVu Sans, sans-serif; font-size: 10px; color: #1a1a1a; }
        .header     { background: #0B0F19; color: white; padding: 15px; margin-bottom: 20px; }
        .logo       { font-size: 18px; font-weight: bold; color: #10B981; }
        h2          { color: #0B0F19; border-bottom: 2px solid #10B981; padding-bottom: 4px; }
        table       { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th          { background: #0B0F19; color: white; padding: 6px; text-align: left; }
        td          { padding: 5px 6px; border-bottom: 1px solid #e5e7eb; }
        tr:nth-child(even) { background: #f9fafb; }
        .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
        .kpi-card   { border: 1px solid #e5e7eb; padding: 10px; border-radius: 4px; }
        .kpi-value  { font-size: 20px; font-weight: bold; color: #10B981; }
        .footer     { position: fixed; bottom: 0; font-size: 8px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 4px; }
        .status-active   { color: #10B981; font-weight: bold; }
        .status-down     { color: #ef4444; font-weight: bold; }
        .status-warning  { color: #f59e0b; font-weight: bold; }
    </style>
</head>
<body>

<div class="header">
    <span class="logo">🛢️ OILBOARDS</span>
    <span style="float:right; font-size:12px;">
        {{ $organization->name }} · {{ $asset->name }}
    </span>
</div>

<h1 style="font-size:16px;">Reporte Diario de Operaciones</h1>
<p>Período: {{ \Carbon\Carbon::parse($period_from)->format('d/m/Y') }}
   al {{ \Carbon\Carbon::parse($period_to)->format('d/m/Y') }}</p>

{{-- Sección 1: Resumen --}}
<h2>1. Resumen Ejecutivo del Activo</h2>
<table>
    <tr>
        <th>Indicador</th><th>Valor</th>
        <th>Indicador</th><th>Valor</th>
    </tr>
    <tr>
        <td>Producción bruta total</td>
        <td><strong>{{ number_format($reports->sum('gross_oil_bbl'), 1) }} bbl</strong></td>
        <td>BSW promedio</td>
        <td>{{ number_format($reports->avg('bsw_pct'), 1) }} %</td>
    </tr>
    <tr>
        <td>Producción neta total</td>
        <td><strong style="color:#10B981;">{{ number_format($reports->sum('net_oil_bbl'), 1) }} bbl</strong></td>
        <td>Uptime global</td>
        <td>{{ number_format($reports->avg('production_hours') / 24 * 100, 1) }} %</td>
    </tr>
    <tr>
        <td>Gas asociado total</td>
        <td>{{ number_format($reports->sum('gas_mmscfd'), 3) }} MMpcd</td>
        <td>Pozos reportados</td>
        <td>{{ $reports->pluck('well_id')->unique()->count() }}</td>
    </tr>
</table>

{{-- Sección 2: Detalle por pozo --}}
<h2>2. Detalle por Pozo</h2>
<table>
    <thead>
        <tr>
            <th>Pozo</th><th>Levant.</th><th>Bruto bbl</th>
            <th>BSW %</th><th>Neto bbl</th><th>Gas MMpcd</th>
            <th>Agua bbl</th><th>Hrs prod.</th><th>Status</th>
        </tr>
    </thead>
    <tbody>
        @foreach($reports->groupBy('well_id') as $wellId => $wellReports)
        @php $well = $wellReports->first()->well; @endphp
        <tr>
            <td>{{ $well->name }}</td>
            <td>{{ $well->lift_type }}</td>
            <td>{{ number_format($wellReports->sum('gross_oil_bbl'), 1) }}</td>
            <td>{{ number_format($wellReports->avg('bsw_pct'), 1) }}</td>
            <td><strong>{{ number_format($wellReports->sum('net_oil_bbl'), 1) }}</strong></td>
            <td>{{ number_format($wellReports->sum('gas_mmscfd'), 3) }}</td>
            <td>{{ number_format($wellReports->sum('water_bbl'), 1) }}</td>
            <td>{{ number_format($wellReports->sum('production_hours'), 1) }}</td>
            <td class="status-{{ $well->current_status === 'Activo' ? 'active' : 'down' }}">
                {{ $well->current_status }}
            </td>
        </tr>
        @endforeach
    </tbody>
</table>

{{-- Sección 3: Paros --}}
<h2>3. Paros y Tiempos No Operativos (NPT)</h2>
@php
    $allDowntime = $reports->flatMap->downtimeEvents;
@endphp
@if($allDowntime->isEmpty())
    <p style="color:#6b7280;">Sin paros registrados en el período.</p>
@else
<table>
    <thead>
        <tr>
            <th>Pozo</th><th>Inicio</th><th>Fin</th>
            <th>Duración</th><th>Categoría</th><th>Causa raíz</th>
        </tr>
    </thead>
    <tbody>
        @foreach($allDowntime as $event)
        <tr>
            <td>{{ $event->well->name }}</td>
            <td>{{ \Carbon\Carbon::parse($event->started_at)->format('d/m H:i') }}</td>
            <td>{{ $event->ended_at ? \Carbon\Carbon::parse($event->ended_at)->format('d/m H:i') : 'En curso' }}</td>
            <td>{{ $event->duration_minutes ? floor($event->duration_minutes/60).'h '.($event->duration_minutes%60).'min' : '—' }}</td>
            <td>{{ ucfirst($event->category) }}</td>
            <td>{{ $event->root_cause }}</td>
        </tr>
        @endforeach
    </tbody>
</table>
@endif

<div class="footer">
    Generado por Oilboards (oilboards.com) · {{ now()->format('d/m/Y H:i') }} ·
    Generado por {{ $generated_by->name }} ·
    Los datos provienen de capturas operativas validadas.
    Oilboards no es responsable por errores en los datos de origen.
</div>

</body>
</html>
```

### 5.5 Tabla `exports` en la base de datos

```php
// database/migrations/create_exports_table.php

Schema::create('exports', function (Blueprint $table) {
    $table->id();
    $table->uuid('uuid')->unique();
    $table->foreignId('organization_id')->constrained();
    $table->foreignId('asset_id')->constrained();
    $table->foreignId('requested_by')->constrained('users');
    $table->string('type');   // daily_operations / npt_summary / regulatory_cne
    $table->string('format'); // pdf / excel
    $table->date('from');
    $table->date('to');
    $table->string('status'); // generating / ready / failed
    $table->string('file_path')->nullable();
    $table->timestamp('expires_at')->nullable();
    $table->timestamps();
});
```

---

## 6. Nomenclatura de archivos generados

```
exports/
  {uuid}.pdf    → Oilboards_ActicoSureste_20260601_20260624_operaciones.pdf
  {uuid}.xlsx   → Oilboards_ActivoSureste_20260601_20260624_operaciones.xlsx
```

Los archivos expiran en **24 horas** (configurar un job de limpieza con `php artisan schedule`).

---

## 7. Checklist de implementación

- [ ] Instalar `barryvdh/laravel-dompdf` y `phpoffice/phpspreadsheet`.
- [ ] Crear migración de tabla `exports`.
- [ ] Crear modelo `Export` con trait `BelongsToOrganization`.
- [ ] Crear `ExportController` con métodos `store`, `show`, `download`.
- [ ] Crear Job `GenerateExport` con `generatePdf()` y `generateExcel()`.
- [ ] Crear vistas Blade para cada tipo de reporte PDF.
- [ ] Crear clase `ExcelReportBuilder` para armar el spreadsheet.
- [ ] Registrar evento `ExportReady` para broadcast vía Reverb al usuario.
- [ ] Configurar limpieza de archivos expirados en el scheduler de Laravel.
- [ ] Configurar `Storage::disk('local')` o S3 para guardar los exports.
- [ ] **Test:** generar un PDF de prueba con datos reales y verificar que los cálculos de volumen neto coinciden con la DB.
- [ ] **Pendiente negocio:** validar campos exactos con CNE/SENER para `regulatory_cne`.

---

*Fin del Doc 7.*
