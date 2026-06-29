import { useState, useMemo, useRef, useEffect, useCallback, memo, lazy, Suspense, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import GridLayout, { WidthProvider, Layout } from 'react-grid-layout';
import ReactECharts from 'echarts-for-react';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const RGL = WidthProvider(GridLayout);

// ---------------------------------------------------------------------------
// Tipos de datos extendidos
// ---------------------------------------------------------------------------
interface WellBinding   { mode: 'well';   wellId: string; variable: string; }
interface GlobalBinding { mode: 'global'; variable: string; wellIds: string[]; }
type Binding = WellBinding | GlobalBinding;

interface Thresholds { warn: number; danger: number; } // 0-100 % del max

// Config del Comparador de Pozos (el diferenciador): misma variable, varios
// pozos, 3 formas de verlo. La variable + pozos viven en binding (global).
type CompareMode = 'overlay' | 'mosaico' | 'ranking';
type CompareNorm = 'abs' | 'pctAvg' | 'delta';
interface CompareCfg { mode: CompareMode; norm: CompareNorm; alarmSort: boolean; }

interface LItem {
    i: string; x: number; y: number; w: number; h: number;
    label?: string;
    binding?: Binding;
    thresholds?: Thresholds;
    compare?: CompareCfg;
}

import {
    X, Grid2x2, Pencil, Check, Monitor, RotateCcw, LayoutTemplate, LayoutGrid,
    Map, Activity, Gauge, Zap, Droplet, Droplets, TrendingUp, TrendingDown,
    Flame, AlertTriangle, List, BarChart3, PieChart, GripVertical,
    Settings, Plus, ChevronDown, ChevronRight, Layers,
    GitBranch, Wrench, ClipboardList, Leaf, Box, Shield, Search, Trash2, ChevronLeft, Brain, Radio,
} from 'lucide-react';
import FieldMap from '@/Components/Shared/FieldMap';
import PipelineMap from '@/Components/Shared/PipelineMap';
const Wellbore3D = lazy(() => import('@/Components/Shared/Wellbore3D'));
import {
    EsgBanner, EsgKpiStrip, EsgCo2Chart, EsgCausaRaiz, EsgCompliance, EsgRecomendacionIA,
} from '@/Components/Demo/composites/EsgPanel';
import {
    TelemetriaBanner, TelemetriaRecomendacionIA,
} from '@/Components/Demo/composites/TelemetriaPanel';
import {
    DireccionBanner, DireccionPronostico, DireccionRecomendacionIA,
} from '@/Components/Demo/composites/DireccionPanel';
import {
    CampoBanner, CampoRecomendacionIA,
} from '@/Components/Demo/composites/CampoPanel';
import {
    DuctosBanner, EamBanner,
} from '@/Components/Demo/composites/DuctosEamPanel';
import { Tooltip } from '@/Components/ui/Tooltip';
import { DEMO_ASSET, DEMO_WELLS, DEMO_EVENTS, DEMO_MONTHLY_DATA, DEMO_NPT_BY_CATEGORY, STATUS_META,
    DEMO_PIPELINE_KPIS, DEMO_PIPELINE_ALERT, DEMO_PIPELINE_SEGMENTS, DEMO_PIPELINE_PRESSURE,
    DEMO_ASSETS_HEALTH, DEMO_WORK_ORDERS,
    DEMO_ESG_KPIS, DEMO_ESG_MONTHLY, DEMO_WELLBORES,
    DEMO_TANKS, DEMO_THP_SERIES, DEMO_FISCALIZATION, DEMO_CHEMICAL, DEMO_DIESEL, DEMO_HSE, DEMO_DYNACARD,
    wellDifferentialPsi,
} from '@/data/demoData';
import { C, tooltipStyle, areaGradient, hexA } from '@/lib/chart';
import { useSignal, useSeries, useCounterSignal, useScalarFromStore, useSignalSnapshot, useSeriesSnapshot } from '@/lib/liveStore';

// ---------------------------------------------------------------------------
// Catálogo de variables disponibles para el Selector de Datos
// ---------------------------------------------------------------------------
// Variables comparables a nivel pozo, agrupadas por dominio operativo.
// El `group` alimenta los <optgroup> del selector de datos.
const WELL_VARIABLES: { id: string; label: string; unit: string; max: number; group: string }[] = [
    // Cabezal del pozo
    { id: 'thp',       label: 'Presión THP (PT)',       unit: 'psi',  max: 500,  group: 'Cabezal' },
    { id: 'pc',        label: 'Presión Casing (PC)',    unit: 'psi',  max: 1000, group: 'Cabezal' },
    { id: 'diff',      label: 'Diferencial PT − PC',    unit: 'psi',  max: 500,  group: 'Cabezal' },
    { id: 'flp',       label: 'Presión FLP',            unit: 'psi',  max: 300,  group: 'Cabezal' },
    { id: 'tempLinea', label: 'Temp. de Línea',         unit: '°C',   max: 100,  group: 'Cabezal' },
    // Levantamiento artificial
    { id: 'motorHz',   label: 'Frecuencia Motor (BEC)', unit: 'Hz',   max: 70,   group: 'Levantamiento' },
    { id: 'motorAmp',  label: 'Corriente Motor',        unit: 'A',    max: 65,   group: 'Levantamiento' },
    { id: 'spm',       label: 'Carreras/min (Balancín)',unit: 'cpm',  max: 15,   group: 'Levantamiento' },
    { id: 'vib',       label: 'Vibración',              unit: 'mm/s', max: 1.5,  group: 'Levantamiento' },
    // Producción
    { id: 'netOil',    label: 'Producción Neta',        unit: 'bbl/d',max: 500,  group: 'Producción' },
    { id: 'bsw',       label: 'BSW',                    unit: '%',    max: 100,  group: 'Producción' },
];
const WELL_VAR_GROUPS = ['Cabezal', 'Levantamiento', 'Producción'];

// Metadatos de cada variable para widgets binding-aware (gauge / línea / comparación)
const VAR_META: Record<string, { label: string; unit: string; max: number; drift?: number; amplitude?: number; getBase: (w: typeof DEMO_WELLS[0]) => number }> = {
    thp:       { label: 'THP',     unit: 'psi',   max: 500,  drift: -0.15, getBase: w => w.thpPsi       },
    pc:        { label: 'PC',      unit: 'psi',   max: 1000,               getBase: w => w.pcPsi        },
    diff:      { label: 'ΔP',      unit: 'psi',   max: 500,                getBase: w => wellDifferentialPsi(w) },
    flp:       { label: 'FLP',     unit: 'psi',   max: 300,                getBase: w => w.flpPsi       },
    tempLinea: { label: 'T.Línea', unit: '°C',    max: 100,                getBase: w => w.tempLineaC   },
    motorHz:   { label: 'Frec.',   unit: 'Hz',    max: 70,                 getBase: w => w.motorHz      },
    motorAmp:  { label: 'Corr.',   unit: 'A',     max: 65,   drift: 0.02,  getBase: w => w.motorAmp     },
    spm:       { label: 'SPM',     unit: 'cpm',   max: 15,                 getBase: w => w.spm          },
    vib:       { label: 'Vib.',    unit: 'mm/s',  max: 1.5,  drift: 0.001, amplitude: 0.03, getBase: w => w.vibrationMms },
    bsw:       { label: 'BSW',     unit: '%',     max: 100,                getBase: w => w.bswPct       },
    netOil:    { label: 'Prod.',   unit: 'bbl/d', max: 500,                getBase: w => w.netOilBbl    },
};

// Helper: opciones agrupadas en <optgroup> para los selectores de variable de pozo.
function WellVarOptions() {
    return (
        <>
            {WELL_VAR_GROUPS.map((g) => (
                <optgroup key={g} label={g}>
                    {WELL_VARIABLES.filter((v) => v.group === g).map((v) => (
                        <option key={v.id} value={v.id}>{v.label} ({v.unit})</option>
                    ))}
                </optgroup>
            ))}
        </>
    );
}

// Mapea tipo de widget → clave en liveStore para leer valor en vivo (umbrales)
const WIDGET_SIGNAL: Record<string, { key: string; max: number; series?: boolean }> = {
    gaugeHz:  { key: 'gaugeHz',  max: 70  },
    gaugeAmp: { key: 'gaugeAmp', max: 65  },
    gaugeVib: { key: 'gaugeVib', max: 1.5 },
    thp102:   { key: 'thp102',   max: 400, series: true },
    thp101:   { key: 'thp101',   max: 400, series: true },
    thp105:   { key: 'thp105',   max: 400, series: true },
};

// ---------------------------------------------------------------------------
// Frame — recibe alerting prop para el pulso rojo
// ---------------------------------------------------------------------------
const Frame = memo(function Frame({
    label, color, editing, alerting, desc, onRemove, onConfig, children,
}: {
    label: string; color: string; editing: boolean; alerting?: boolean; desc?: string;
    onRemove?: () => void; onConfig?: () => void; children: ReactNode;
}) {
    const bColor = alerting ? '#EF4444' : color;
    return (
        <div className={`widget-surface h-full w-full rounded-lg overflow-hidden flex flex-col ${alerting ? 'alert-pulse-red' : ''}`}
            style={{ ['--wc' as any]: bColor }}>
            <Tooltip content={desc ?? ''} side="top">
                <div className={`flex items-center justify-between px-2.5 py-1 border-b select-none ${editing ? 'drag-handle cursor-move' : ''}`}
                    style={{ borderColor: `${bColor}30`, background: `linear-gradient(180deg, ${bColor}1f, ${bColor}08)` }}>
                    <span className="text-[9px] font-bold uppercase tracking-wider truncate flex items-center gap-1" style={{ color: bColor }}>
                        {alerting && <span className="w-1.5 h-1.5 rounded-full pulse-dot flex-shrink-0" style={{ backgroundColor: bColor }} />}
                        {label}
                    </span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                        {editing ? (
                            <>
                                {onConfig && (
                                    <button onMouseDown={(e) => e.stopPropagation()} onClick={onConfig}
                                        className="text-[#6B7280] hover:text-[#10B981] transition-colors p-0.5 rounded">
                                        <Settings size={10} />
                                    </button>
                                )}
                                <button onMouseDown={(e) => e.stopPropagation()} onClick={onRemove}
                                    className="text-[#6B7280] hover:text-[#EF4444] transition-colors p-0.5 rounded">
                                    <X size={11} />
                                </button>
                            </>
                        ) : (
                            <span className="flex items-center gap-1 text-[7px]" style={{ color: bColor }}>
                                <span className="w-1 h-1 rounded-full pulse-dot" style={{ backgroundColor: bColor }} />
                                {alerting ? 'ALERTA' : 'EN VIVO'}
                            </span>
                        )}
                    </div>
                </div>
            </Tooltip>
            <div className="flex-1 min-h-0 p-2">{children}</div>
        </div>
    );
});

// ---------------------------------------------------------------------------
// Widgets en vivo (mismos que antes, con micro-oscilación mejorada)
// ---------------------------------------------------------------------------
const MiniLine = memo(function MiniLine({ skey, color, base, drift = 0 }: { skey: string; color: string; base: number; drift?: number }) {
    const data = useSeries(
        skey,
        Array.from({ length: 24 }, (_, i) => base + Math.sin(i * 0.6) * 6 - (drift > 0 ? Math.max(0, i - 12) * drift : 0)),
        (last) => Math.max(base * 0.7, last + (Math.random() - 0.5 - (drift > 0 ? 0.2 : 0)) * 5),
    );
    const option = useMemo(() => ({
        backgroundColor: 'transparent', grid: { left: 0, right: 0, top: 2, bottom: 0 },
        xAxis: { type: 'category', show: false, data: data.map((_, i) => i), boundaryGap: false },
        yAxis: { type: 'value', show: false, scale: true },
        tooltip: { ...tooltipStyle, trigger: 'axis', formatter: (p: any) => `${Math.round(p[0].value)} psi` },
        series: [{
            type: 'line', data, smooth: true, symbol: 'circle', symbolSize: 0, showSymbol: false,
            lineStyle: { color, width: 2, shadowColor: hexA(color, 0.65), shadowBlur: 0 },
            areaStyle: { color: areaGradient(color, 0.32) },
            endLabel: { show: true, formatter: () => '●', color, fontSize: 10, offset: [-2, 0], textShadowColor: hexA(color, 0.9), textShadowBlur: 8 },
        }],
    }), [data, color]);
    return <ReactECharts option={option} notMerge={false} lazyUpdate style={{ height: '100%', minHeight: 30 }} />;
});

const GaugeW = memo(function GaugeW({ skey, base, max, color, label, unit, drift = 0, amp }: { skey: string; base: number; max: number; color: string; label: string; unit: string; drift?: number; amp?: number }) {
    const value = useSignal(skey, { base, amplitude: amp ?? max * 0.012, drift, min: 0, max });
    const v = Math.round(value * 10) / 10;
    // micro-oscilación: añade un segundo tick de ruido visual muy pequeño
    const noise = useSignal(`${skey}_noise`, { base: 0, amplitude: max * 0.004, drift: 0 });
    const vDisplay = Math.round((v + noise) * 10) / 10;
    // Reinterpretado: arco limpio relleno (sin aguja ni dientes). Punta redondeada
    // con glow + número grande al centro. Estética tablero / mission-control.
    const option = useMemo(() => ({
        backgroundColor: 'transparent',
        series: [{
            type: 'gauge', startAngle: 222, endAngle: -42, min: 0, max, radius: '96%',
            pointer: { show: false }, anchor: { show: false },
            axisTick: { show: false }, splitLine: { show: false }, axisLabel: { show: false },
            axisLine: { roundCap: true, lineStyle: { width: 10, color: [[1, '#1b2430']] } },
            progress: { show: true, width: 10, roundCap: true, itemStyle: {
                color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 1, colorStops: [{ offset: 0, color: hexA(color, 0.5) }, { offset: 1, color }] },
                shadowColor: hexA(color, 0.7), shadowBlur: 0,
            } },
            detail: { valueAnimation: true, formatter: '{value}', color: '#fff', fontSize: 20, fontWeight: 'bolder', fontFamily: 'JetBrains Mono', offsetCenter: [0, '6%'] },
            title: { color: C.muted, fontSize: 9, offsetCenter: [0, '38%'] },
            data: [{ value: vDisplay, name: `${label} ${unit}` }],
        }],
    }), [vDisplay, max, color, label, unit]);
    return (
        <div className="metric-well h-full w-full" style={{ ['--mc' as any]: color }}>
            <ReactECharts option={option} notMerge={false} lazyUpdate style={{ height: '100%', minHeight: 70 }} />
        </div>
    );
});

const CounterW = memo(function CounterW({ skey, start, step, color, sub }: { skey: string; start: number; step: number; color: string; sub: string }) {
    const v = useCounterSignal(skey, start, step);
    return (
        <div className="metric-well h-full flex flex-col items-center justify-center gap-1" style={{ ['--mc' as any]: color }}>
            <div className="metric-num text-3xl" style={{ ['--mc' as any]: color }}>{v.toLocaleString()}</div>
            <div className="text-[8px] text-[#9CA3AF] text-center leading-tight">{sub}</div>
        </div>
    );
});
const StatW = memo(function StatW({ value, color, sub }: { value: string; color: string; sub: string }) {
    return (
        <div className="metric-well h-full flex flex-col items-center justify-center gap-1" style={{ ['--mc' as any]: color }}>
            <div className="metric-num text-3xl" style={{ ['--mc' as any]: color }}>{value}</div>
            <div className="text-[8px] text-[#9CA3AF] text-center leading-tight">{sub}</div>
        </div>
    );
});
const MatrizW = memo(function MatrizW() {
    const thp102 = useSignal('matriz-thp102', { base: 298, amplitude: 1.2, drift: -0.4, min: 262, max: 300 });
    return (
        <div className="grid grid-cols-2 gap-1.5 h-full">
            {DEMO_WELLS.map((w) => {
                const thp = w.id === 'pozo-102h' ? thp102 : w.thpPsi;
                return (
                    <div key={w.id} className="row-3d border-l-2 px-2 py-1 flex flex-col justify-center min-h-0 relative overflow-hidden" style={{ borderColor: STATUS_META[w.status].color, boxShadow: `inset 6px 0 12px -6px ${hexA(STATUS_META[w.status].color, 0.5)}` }}>
                        <div className="flex items-center justify-between">
                            <span className="text-[9px] font-bold text-white truncate">{w.name}</span>
                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 dot-halo" style={{ backgroundColor: STATUS_META[w.status].color, ['--hc' as any]: hexA(STATUS_META[w.status].color, 0.6) }} />
                        </div>
                        <span className="text-[11px] font-mono font-bold" style={{ color: STATUS_META[w.status].color, textShadow: `0 0 8px ${hexA(STATUS_META[w.status].color, 0.5)}` }}>
                            {thp > 0 ? `${Math.round(thp)} psi` : w.status === 'down' ? 'PARADO' : 'INTERV.'}
                        </span>
                    </div>
                );
            })}
        </div>
    );
});
const Well3DW = memo(function Well3DW() {
    return (
        <div className="h-full w-full">
            <Suspense fallback={<div className="h-full w-full flex items-center justify-center text-[10px] text-[#6B7280]">Cargando 3D…</div>}>
                <Wellbore3D wellbore={DEMO_WELLBORES['pozo-102h']} toggles={{ formations: true, casings: true, equipment: true }} onPick={() => {}} height="100%" />
            </Suspense>
        </div>
    );
});
const AlertasW = memo(function AlertasW() {
    return (
        <div className="flex items-center gap-3 h-full">
            <div className="metric-well flex items-center justify-center px-2" style={{ ['--mc' as any]: C.red }}>
                <div className="metric-num text-4xl" style={{ ['--mc' as any]: C.red }}>2</div>
            </div>
            <div className="flex-1 space-y-1">
                <div className="row-3d flex items-center gap-1.5 px-1.5 py-1 text-[9px]" style={{ boxShadow: `inset 4px 0 10px -6px ${hexA(C.yellow, 0.6)}` }}>
                    <span className="w-1.5 h-1.5 rounded-full dot-halo" style={{ backgroundColor: C.yellow, ['--hc' as any]: hexA(C.yellow, 0.6) }} />
                    <span className="text-white font-semibold">POZO-102H</span><span className="text-[#9CA3AF]">· Gas-Lock</span>
                </div>
                <div className="row-3d flex items-center gap-1.5 px-1.5 py-1 text-[9px]" style={{ boxShadow: `inset 4px 0 10px -6px ${hexA(C.red, 0.6)}` }}>
                    <span className="w-1.5 h-1.5 rounded-full dot-halo" style={{ backgroundColor: C.red, ['--hc' as any]: hexA(C.red, 0.6) }} />
                    <span className="text-white font-semibold">POZO-104</span><span className="text-[#9CA3AF]">· Falla eléctrica</span>
                </div>
            </div>
        </div>
    );
});
const EventosW = memo(function EventosW() {
    const events = useMemo(() => [...DEMO_EVENTS].reverse().slice(0, 6), []);
    const typeCol: Record<string, string> = { ok: C.green, alert: C.yellow, down: C.red, info: C.blue };
    return (
        <div className="space-y-1 overflow-hidden h-full">
            {events.map((e, i) => {
                const col = typeCol[e.type] ?? C.faint;
                return (
                    <div key={i} className="row-3d flex items-center gap-1.5 text-[8px] px-1.5 py-1">
                        <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ backgroundColor: col, boxShadow: `0 0 6px ${col}` }} />
                        <span className="font-mono text-[#6B7280] flex-shrink-0">{e.time}</span>
                        <span className="text-[#D1D5DB] truncate">{e.message}</span>
                    </div>
                );
            })}
        </div>
    );
});
const CneW = memo(function CneW() {
    const option = useMemo(() => ({
        backgroundColor: 'transparent', grid: { left: 2, right: 2, top: 6, bottom: 14 },
        xAxis: { type: 'category', data: DEMO_MONTHLY_DATA.map((d) => d.month), axisLabel: { color: C.faint, fontSize: 7 }, axisLine: { lineStyle: { color: C.border } }, axisTick: { show: false } },
        yAxis: { type: 'value', show: false, min: 60000 },
        tooltip: { ...tooltipStyle, trigger: 'axis' },
        series: [
            { type: 'bar', data: DEMO_MONTHLY_DATA.map((d) => d.meta), barWidth: 5, itemStyle: { color: C.blue, opacity: 0.6, borderRadius: [2, 2, 0, 0] } },
            { type: 'bar', data: DEMO_MONTHLY_DATA.map((d) => d.real), barWidth: 5, itemStyle: { color: C.green, borderRadius: [2, 2, 0, 0] } },
        ],
    }), []);
    return <ReactECharts option={option} notMerge style={{ height: '100%', minHeight: 70 }} />;
});
const NptW = memo(function NptW() {
    // PARETO (estándar de análisis de causa raíz): barras descendentes por horas
    // + curva de % acumulado + línea guía 80/20.
    const option = useMemo(() => {
        const sorted = [...DEMO_NPT_BY_CATEGORY].sort((a, b) => b.hours - a.hours);
        const total = sorted.reduce((s, c) => s + c.hours, 0);
        let cum = 0; const cumPct = sorted.map((c) => { cum += c.hours; return +((cum / total) * 100).toFixed(1); });
        return {
            backgroundColor: 'transparent', grid: { left: 4, right: 28, top: 10, bottom: 16 },
            tooltip: { ...tooltipStyle, trigger: 'axis', formatter: (p: any) => `${p[0].axisValue}<br/>${p[0].value} h · acum ${p[1]?.value ?? ''}%` },
            xAxis: { type: 'category', data: sorted.map((c) => c.category), axisLabel: { color: C.faint, fontSize: 7, interval: 0 }, axisLine: { lineStyle: { color: C.border } }, axisTick: { show: false } },
            yAxis: [
                { type: 'value', axisLabel: { color: C.faint, fontSize: 7 }, splitLine: { lineStyle: { color: C.grid, opacity: 0.4 } } },
                { type: 'value', max: 100, axisLabel: { color: hexA('#fff', 0.6), fontSize: 7, formatter: '{value}%' }, splitLine: { show: false } },
            ],
            series: [
                { type: 'bar', data: sorted.map((c) => ({ value: c.hours, itemStyle: { color: c.color, borderRadius: [3, 3, 0, 0] } })), barWidth: '55%' },
                { type: 'line', yAxisIndex: 1, data: cumPct, smooth: false, symbol: 'circle', symbolSize: 4, lineStyle: { color: '#fff', width: 1.5 }, itemStyle: { color: '#fff' },
                  markLine: { silent: true, symbol: 'none', data: [{ yAxis: 80, lineStyle: { color: hexA('#fff', 0.4), type: 'dashed', width: 1 }, label: { formatter: '80%', color: C.faint, fontSize: 7 } }] } },
            ],
        };
    }, []);
    return <ReactECharts option={option} notMerge style={{ height: '100%', minHeight: 70 }} />;
});
const DeclinacionW = memo(function DeclinacionW() {
    // Semi-log: tasa en escala logarítmica (convención de análisis de declinación).
    const option = useMemo(() => ({
        backgroundColor: 'transparent', grid: { left: 0, right: 0, top: 4, bottom: 0 },
        xAxis: { type: 'category', show: false, data: Array.from({ length: 18 }, (_, i) => i) },
        yAxis: { type: 'log', show: false, min: 2000, max: 3200 },
        tooltip: { ...tooltipStyle, trigger: 'axis', formatter: (p: any) => `${Math.round(p[0].value).toLocaleString()} bbl/d` },
        series: [{ type: 'line', data: Array.from({ length: 18 }, (_, i) => Math.round(3050 * Math.exp(-0.018 * i) + Math.sin(i) * 25)), smooth: false, symbol: 'none', lineStyle: { color: C.yellow, width: 2, shadowColor: hexA(C.yellow, 0.5), shadowBlur: 0 } }],
    }), []);
    return <ReactECharts option={option} notMerge style={{ height: '100%', minHeight: 30 }} />;
});

// ---------------------------------------------------------------------------
// Widgets binding-aware (leen item.binding para saber pozo + variable)
// ---------------------------------------------------------------------------
function BoundGaugeW({ wellId, variable }: { wellId: string; variable: string }) {
    const well = DEMO_WELLS.find(w => w.id === wellId);
    const meta = VAR_META[variable];
    if (!well || !meta) return (
        <div className="h-full flex flex-col items-center justify-center gap-1 text-[#4B5563]">
            <Settings size={16} />
            <span className="text-[9px]">Click ⚙️ para configurar</span>
        </div>
    );
    const skey = `bound_${wellId}_${variable}`;
    const color = well.status === 'alert' ? C.yellow : well.status === 'down' ? C.red : C.green;
    return <GaugeW skey={skey} base={meta.getBase(well)} max={meta.max} color={color}
        label={meta.label} unit={meta.unit} drift={meta.drift ?? 0} amp={meta.amplitude} />;
}

function BoundLineW({ wellId, variable }: { wellId: string; variable: string }) {
    const well = DEMO_WELLS.find(w => w.id === wellId);
    const meta = VAR_META[variable];
    if (!well || !meta) return (
        <div className="h-full flex flex-col items-center justify-center gap-1 text-[#4B5563]">
            <Settings size={14} />
            <span className="text-[9px]">Click ⚙️ para configurar</span>
        </div>
    );
    const skey = `bound_${wellId}_${variable}`;
    const color = well.status === 'alert' ? C.yellow : well.status === 'down' ? C.red : C.green;
    return <MiniLine skey={skey} color={color} base={meta.getBase(well)} drift={meta.drift ?? 0} />;
}

function MultiLineW({ wellIds, variable }: { wellIds: string[]; variable: string }) {
    const meta = VAR_META[variable];
    const wells = wellIds.map(id => DEMO_WELLS.find(w => w.id === id)).filter(Boolean) as typeof DEMO_WELLS;
    if (!meta || wells.length === 0) return (
        <div className="h-full flex flex-col items-center justify-center gap-1 text-[#4B5563]">
            <Settings size={14} />
            <span className="text-[9px]">Click ⚙️ para configurar pozos</span>
        </div>
    );
    const COLORS = [C.green, C.yellow, C.blue, C.red, C.purple, '#EC4899', '#06B6D4', '#84CC16'];
    // Registra una serie por pozo y construye la opción
    const seriesData = wells.map((w, idx) => {
        const skey = `bound_${w.id}_${variable}`;
        const base = meta.getBase(w);
        const color = COLORS[idx % COLORS.length];
        return { w, skey, base, color };
    });

    // Necesitamos un componente interno que use los hooks
    return <MultiLineInner seriesData={seriesData} meta={meta} />;
}

function MultiLineInner({ seriesData, meta }: {
    seriesData: { w: typeof DEMO_WELLS[0]; skey: string; base: number; color: string }[];
    meta: typeof VAR_META[string];
}) {
    const mk = (n: number, phase: number) => (last: number) => Math.max(0, last + (Math.random() - 0.5 - (meta.drift ?? 0)) * 5);
    const init = (n: number, phase: number) => Array.from({length:24}, (_,i) => (seriesData[n]?.base ?? 0) + Math.sin(i * phase) * 4);
    const series0 = useSeries(seriesData[0]?.skey ?? '__none__', init(0,0.5), mk(0,0.5));
    const series1 = useSeries(seriesData[1]?.skey ?? '__none__', init(1,0.7), mk(1,0.7));
    const series2 = useSeries(seriesData[2]?.skey ?? '__none__', init(2,0.3), mk(2,0.3));
    const series3 = useSeries(seriesData[3]?.skey ?? '__none__', init(3,0.9), mk(3,0.9));
    const series4 = useSeries(seriesData[4]?.skey ?? '__none__', init(4,0.4), mk(4,0.4));
    const series5 = useSeries(seriesData[5]?.skey ?? '__none__', init(5,0.6), mk(5,0.6));
    const series6 = useSeries(seriesData[6]?.skey ?? '__none__', init(6,0.8), mk(6,0.8));
    const series7 = useSeries(seriesData[7]?.skey ?? '__none__', init(7,0.2), mk(7,0.2));

    const allSeries = [series0,series1,series2,series3,series4,series5,series6,series7];

    const option = useMemo(() => ({
        backgroundColor: 'transparent',
        grid: { left: 0, right: 0, top: 16, bottom: 0 },
        legend: {
            data: seriesData.map(s => s.w.name),
            top: 0, textStyle: { color: C.faint, fontSize: 8 },
            itemWidth: 12, itemHeight: 4,
        },
        xAxis: { type: 'category', show: false, data: Array.from({length:24},(_,i)=>i), boundaryGap: false },
        yAxis: { type: 'value', show: false, scale: true },
        tooltip: { ...tooltipStyle, trigger: 'axis', formatter: (p: any) => p.map((x: any) => `<span style="color:${x.color}">● ${x.seriesName}: ${Math.round(x.value)} ${meta.unit}</span>`).join('<br/>') },
        series: seriesData.map((s, idx) => ({
            name: s.w.name, type: 'line', smooth: true, symbol: 'none',
            data: allSeries[idx] ?? [],
            lineStyle: { color: s.color, width: 1.5 },
            itemStyle: { color: s.color },
        })),
    }), [seriesData, allSeries, meta]);

    return <ReactECharts option={option} notMerge={false} lazyUpdate style={{ height: '100%', minHeight: 60 }} />;
}

// ===========================================================================
// COMPARADOR DE POZOS — el diferenciador. Misma variable, varios pozos, en vivo.
// 3 modos: Overlay (tendencia) · Mosaico (small-multiples) · Ranking (leaderboard)
// Escala compartida, normalización y orden por alarma.
// ===========================================================================
const CMP_COLORS = [C.green, C.blue, C.yellow, C.purple, '#EC4899', '#06B6D4', '#84CC16', C.red];

// Sparkline SVG ligero (sin instancia de ECharts) con dominio compartido.
function Spark({ vals, min, max, color, h = 26 }: { vals: number[]; min: number; max: number; color: string; h?: number }) {
    const span = (max - min) || 1;
    const n = vals.length;
    const pts = vals.map((v, i) => [(i / (n - 1)) * 100, h - ((v - min) / span) * h]);
    const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
    const area = `${line} L100,${h} L0,${h} Z`;
    const gid = useMemo(() => `g${Math.random().toString(36).slice(2, 8)}`, []);
    return (
        <svg viewBox={`0 0 100 ${h}`} preserveAspectRatio="none" className="w-full" style={{ height: h }}>
            <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.35" /><stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient></defs>
            <path d={area} fill={`url(#${gid})`} />
            <path d={line} fill="none" stroke={color} strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
            <circle cx={pts[n - 1][0]} cy={pts[n - 1][1]} r="1.8" fill={color} />
        </svg>
    );
}

function ComparadorW({ wellIds, variable, mode, norm, alarmSort, thresholds }: {
    wellIds: string[]; variable: string; mode: CompareMode; norm: CompareNorm; alarmSort: boolean; thresholds?: Thresholds;
}) {
    const meta = VAR_META[variable];
    const W = DEMO_WELLS;
    // Registrar SIEMPRE las 8 series (reglas de hooks); luego filtrar las elegidas.
    const amp = meta ? Math.max(meta.max * 0.012, 0.02) : 5;
    const baseOf = (idx: number) => meta ? meta.getBase(W[idx]) : 0;
    // Pozos parados/sin base (parado/intervención → base 0) quedan planos en 0;
    // los activos oscilan en vivo. Así la comparación es realista.
    // Caminata con reversión a la media (sin reversión los valores se disparan
    // con el tiempo). Se mantiene en una banda realista [0.6×, 1.4×] de la base.
    const mk = (idx: number) => { const b = baseOf(idx); return (last: number) => {
        if (b <= 0) return 0;
        const noise = (Math.random() - 0.5 - (meta?.drift ?? 0)) * amp;
        const revert = (b - last) * 0.06;
        return Math.max(b * 0.6, Math.min(b * 1.4, last + noise + revert));
    }; };
    const init = (idx: number, phase: number) => { const b = baseOf(idx); return Array.from({ length: 24 }, (_, i) => b <= 0 ? 0 : b + Math.sin(i * phase + idx) * (meta ? meta.max * 0.01 : 2)); };
    const s0 = useSeries(`cmp_${W[0].id}_${variable}`, init(0, 0.45), mk(0));
    const s1 = useSeries(`cmp_${W[1].id}_${variable}`, init(1, 0.62), mk(1));
    const s2 = useSeries(`cmp_${W[2].id}_${variable}`, init(2, 0.38), mk(2));
    const s3 = useSeries(`cmp_${W[3].id}_${variable}`, init(3, 0.71), mk(3));
    const s4 = useSeries(`cmp_${W[4].id}_${variable}`, init(4, 0.52), mk(4));
    const s5 = useSeries(`cmp_${W[5].id}_${variable}`, init(5, 0.66), mk(5));
    const s6 = useSeries(`cmp_${W[6].id}_${variable}`, init(6, 0.44), mk(6));
    const s7 = useSeries(`cmp_${W[7].id}_${variable}`, init(7, 0.58), mk(7));
    const all = [s0, s1, s2, s3, s4, s5, s6, s7];

    if (!meta || wellIds.length === 0) return (
        <div className="h-full flex flex-col items-center justify-center gap-1 text-[#4B5563]">
            <Layers size={16} /><span className="text-[9px]">Click ⚙️ para elegir variable y pozos</span>
        </div>
    );

    const warn = thresholds?.warn ?? 65, danger = thresholds?.danger ?? 85;
    // Nivel de alarma por VALOR ABSOLUTO real (no normalizado): 2=crítico,1=aviso,0=ok
    const levelOf = (curr: number) => {
        const pct = meta.max > 0 ? (curr / meta.max) * 100 : 0;
        return pct >= danger ? 2 : pct >= warn ? 1 : 0;
    };
    const toneOf = (lvl: number, w: typeof W[0]) => lvl === 2 ? C.red : lvl === 1 ? C.yellow : w.status === 'down' ? C.red : w.status === 'intervention' ? C.blue : C.green;

    let rows = W.map((w, idx) => {
        const series = all[idx];
        const curr = series[series.length - 1];
        const base = series[0];
        const lvl = levelOf(curr);
        return { w, idx, series, curr, base, lvl, color: CMP_COLORS[idx % CMP_COLORS.length], tone: toneOf(lvl, w) };
    }).filter((r) => wellIds.includes(r.w.id));

    // Promedio del campo (sobre los pozos elegidos) — base de la normalización
    // "% del promedio": comparación justa entre pozos de distinto tamaño.
    const groupAvg = Math.max(1, rows.reduce((s, r) => s + r.curr, 0) / Math.max(1, rows.length));

    // Normalización aplicada a series y al valor mostrado
    const normSeries = (s: number[]) => norm === 'pctAvg' ? s.map((v) => (v / groupAvg) * 100) : norm === 'delta' ? s.map((v) => v - s[0]) : s;
    const dispVal = (r: { curr: number; base: number }) => norm === 'pctAvg' ? (r.curr / groupAvg) * 100 : norm === 'delta' ? (r.curr - r.base) : r.curr;
    const unit = norm === 'pctAvg' ? '%' : meta.unit;
    const fmt = (v: number) => norm === 'delta' ? `${v >= 0 ? '+' : ''}${Math.round(v)}` : `${Math.round(v * 10) / 10}`;

    if (alarmSort) rows = [...rows].sort((a, b) => b.lvl - a.lvl || b.curr - a.curr);
    else if (mode === 'ranking') rows = [...rows].sort((a, b) => b.curr - a.curr);

    // Dominio compartido (sobre series normalizadas de los pozos elegidos)
    const allNorm = rows.flatMap((r) => normSeries(r.series));
    const gMin = Math.min(...allNorm), gMax = Math.max(...allNorm);

    // ── OVERLAY ───────────────────────────────────────────────────────────
    if (mode === 'overlay') {
        const option = {
            backgroundColor: 'transparent', grid: { left: 4, right: 8, top: 18, bottom: 4 },
            legend: { data: rows.map((r) => r.w.name), top: 0, textStyle: { color: C.faint, fontSize: 8 }, itemWidth: 10, itemHeight: 4, type: 'scroll' },
            tooltip: { ...tooltipStyle, trigger: 'axis', formatter: (p: any) => p.map((x: any) => `<span style="color:${x.color}">● ${x.seriesName}: ${fmt(x.value)} ${unit}</span>`).join('<br/>') },
            xAxis: { type: 'category', show: false, data: Array.from({ length: 24 }, (_, i) => i), boundaryGap: false },
            yAxis: { type: 'value', show: false, scale: true },
            series: rows.map((r) => ({
                name: r.w.name, type: 'line', smooth: true, symbol: 'none', data: normSeries(r.series),
                lineStyle: { color: r.color, width: r.lvl === 2 ? 2.6 : 1.8 },
                itemStyle: { color: r.color },
            })),
            ...(norm === 'abs' && thresholds ? { } : {}),
        };
        return <ReactECharts option={option} notMerge lazyUpdate style={{ height: '100%', minHeight: 60 }} />;
    }

    // ── MOSAICO (small multiples, escala compartida) ──────────────────────
    if (mode === 'mosaico') {
        const cols = rows.length <= 2 ? rows.length : rows.length <= 6 ? 3 : 4;
        return (
            <div className="h-full w-full grid gap-1.5 overflow-auto" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}>
                {rows.map((r) => (
                    <div key={r.w.id} className={`row-3d px-1.5 py-1 flex flex-col justify-between min-h-0 ${r.lvl === 2 ? 'alert-pulse-red' : ''}`}
                        style={{ boxShadow: `inset 0 0 0 1px ${hexA(r.tone, 0.35)}` }}>
                        <div className="flex items-center justify-between">
                            <span className="text-[8px] font-bold text-white truncate">{r.w.name}</span>
                            <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ backgroundColor: r.tone, boxShadow: `0 0 5px ${r.tone}` }} />
                        </div>
                        <div className="font-mono font-bold text-[12px] leading-none" style={{ color: r.tone, textShadow: `0 0 8px ${hexA(r.tone, 0.5)}` }}>
                            {fmt(dispVal(r))}<span className="text-[7px] text-[#6B7280] ml-0.5">{unit}</span>
                        </div>
                        <Spark vals={normSeries(r.series)} min={gMin} max={gMax} color={r.tone} h={20} />
                    </div>
                ))}
            </div>
        );
    }

    // ── RANKING (leaderboard) ─────────────────────────────────────────────
    return (
        <div className="h-full w-full flex flex-col gap-1 overflow-auto">
            {rows.map((r, i) => (
                <div key={r.w.id} className={`row-3d flex items-center gap-2 px-2 py-1 ${r.lvl === 2 ? 'alert-pulse-red' : ''}`}
                    style={{ boxShadow: `inset 4px 0 10px -6px ${hexA(r.tone, 0.6)}` }}>
                    <span className="text-[9px] font-mono text-[#6B7280] w-3 flex-shrink-0">{i + 1}</span>
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: r.tone, boxShadow: `0 0 6px ${r.tone}` }} />
                    <span className="text-[9px] font-semibold text-white w-16 flex-shrink-0 truncate">{r.w.name}</span>
                    <div className="flex-1 min-w-0 opacity-90"><Spark vals={normSeries(r.series)} min={gMin} max={gMax} color={r.tone} h={16} /></div>
                    <span className="text-[11px] font-mono font-bold flex-shrink-0 w-14 text-right" style={{ color: r.tone, textShadow: `0 0 8px ${hexA(r.tone, 0.5)}` }}>
                        {fmt(dispVal(r))}<span className="text-[7px] text-[#6B7280] ml-0.5">{unit}</span>
                    </span>
                    {(() => { const d = r.curr - r.base; const dc = d >= 0 ? C.green : C.red; return (
                        <span className="delta-chip flex-shrink-0" style={{ ['--dc' as any]: dc }}>{d >= 0 ? '▲' : '▼'}{Math.abs(Math.round(d))}</span>
                    ); })()}
                </div>
            ))}
        </div>
    );
}

// ---------------------------------------------------------------------------
// MÓDULO 04 · DUCTOS — integridad y midstream
// ---------------------------------------------------------------------------
const DuctoPerfilW = memo(function DuctoPerfilW() {
    const option = useMemo(() => ({
        backgroundColor: 'transparent', grid: { left: 6, right: 6, top: 10, bottom: 16 },
        xAxis: { type: 'category', data: DEMO_PIPELINE_PRESSURE.map(d => d.km),
            axisLabel: { color: C.faint, fontSize: 7, interval: 13, formatter: (v: string) => `KP${v}` },
            axisLine: { lineStyle: { color: C.border } }, axisTick: { show: false } },
        yAxis: { type: 'value', show: false, scale: true },
        tooltip: { ...tooltipStyle, trigger: 'axis', formatter: (p: any) => `KP-${p[0].axisValue} · ${p[0].value} bar` },
        series: [{
            type: 'line', data: DEMO_PIPELINE_PRESSURE.map(d => d.bar), smooth: true, symbol: 'none',
            lineStyle: { color: C.blue, width: 2 }, areaStyle: { color: areaGradient(C.blue, 0.18) },
            markArea: { silent: true, itemStyle: { color: 'rgba(239,68,68,0.12)' }, data: [[{ xAxis: '42' }, { xAxis: '57' }]] },
        }],
    }), []);
    return <ReactECharts option={option} notMerge style={{ height: '100%', minHeight: 80 }} />;
});

const DuctoBalanceW = memo(function DuctoBalanceW() {
    const k = DEMO_PIPELINE_KPIS;
    const Cell = ({ v, c, s }: { v: string; c: string; s: string }) => (
        <div className="row-3d flex flex-col justify-center px-2 py-1"><div className="metric-num text-lg" style={{ ['--mc' as any]: c }}>{v}</div><div className="text-[7px] text-[#9CA3AF] leading-tight">{s}</div></div>
    );
    return (
        <div className="h-full grid grid-cols-2 gap-1.5">
            <Cell v={`${k.volTransportadoMMpcd}`} c="#fff" s="MMpcd transportado" />
            <Cell v={`${k.balancePct}%`} c={C.green} s="balance entrega" />
            <Cell v={`${k.presionEntradaBar}→${k.presionSalidaBar}`} c={C.muted} s="entrada → salida (bar)" />
            <Cell v={`${k.perdidaMMpcd}`} c={C.red} s="MMpcd no contabilizado" />
        </div>
    );
});

const DuctoAlertaW = memo(function DuctoAlertaW() {
    const a = DEMO_PIPELINE_ALERT;
    return (
        <div className="h-full flex flex-col gap-1 overflow-hidden">
            <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full pulse-dot" style={{ backgroundColor: C.red }} />
                <span className="text-[10px] font-bold" style={{ color: C.red }}>Posible toma clandestina</span>
            </div>
            <div className="text-[8px] text-[#9CA3AF]">{a.segmentName} · caída {a.caida}</div>
            <div className="text-[8px] text-[#D1D5DB] leading-snug flex-1 overflow-hidden">{a.diagnosis}</div>
            <div className="flex items-center justify-between text-[7px] pt-0.5 border-t border-[#1F2937]">
                <span style={{ color: C.red }}>Urgencia: {a.urgency}</span>
                <span className="text-[#6B7280]">{a.source}</span>
            </div>
        </div>
    );
});

const DuctoSegmentosW = memo(function DuctoSegmentosW() {
    return (
        <div className="h-full flex flex-col gap-1 overflow-hidden">
            {DEMO_PIPELINE_SEGMENTS.map((s) => {
                const col = s.status === 'alert' ? C.red : s.status === 'warning' ? C.yellow : C.green;
                return (
                    <div key={s.id} className="row-3d flex items-center gap-1.5 px-1.5 py-1 border-l-2" style={{ borderColor: col, boxShadow: `inset 5px 0 10px -6px ${hexA(col, 0.5)}` }}>
                        <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ backgroundColor: col, boxShadow: `0 0 6px ${col}` }} />
                        <span className="text-[8px] text-white truncate flex-1">{s.name}</span>
                        <span className="text-[9px] font-mono font-bold" style={{ color: col, textShadow: `0 0 6px ${hexA(col, 0.5)}` }}>{s.pressureBar} bar</span>
                    </div>
                );
            })}
        </div>
    );
});

// ---------------------------------------------------------------------------
// MÓDULO 05 · EAM — mantenimiento predictivo
// ---------------------------------------------------------------------------
const EamSaludW = memo(function EamSaludW() {
    return (
        <div className="h-full flex flex-col gap-0.5 overflow-auto">
            {DEMO_ASSETS_HEALTH.map((a) => {
                const col = a.status === 'critical' ? C.red : a.status === 'warn' ? C.yellow : C.green;
                return (
                    <div key={a.id} className="row-3d flex items-center gap-2 px-1.5 py-1" style={{ boxShadow: `inset 4px 0 10px -6px ${hexA(col, 0.5)}` }}>
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: col, boxShadow: `0 0 6px ${col}` }} />
                        <span className="text-[8px] text-white truncate flex-1">{a.name}</span>
                        <span className="text-[8px] text-[#6B7280] truncate hidden sm:inline">{a.well}</span>
                        <span className="text-[9px] font-mono font-bold" style={{ color: col, textShadow: `0 0 6px ${hexA(col, 0.5)}` }}>{a.daysToFailure}d</span>
                    </div>
                );
            })}
        </div>
    );
});

const EamFlujoW = memo(function EamFlujoW() {
    const a = DEMO_ASSETS_HEALTH.find((x) => x.status === 'critical') ?? DEMO_ASSETS_HEALTH[0];
    const wo = DEMO_WORK_ORDERS[0];
    const Step = ({ label, value, color }: { label: string; value: string; color: string }) => (
        <div className="flex-1 flex flex-col items-center text-center">
            <div className="text-[7px] text-[#6B7280] uppercase tracking-wide">{label}</div>
            <div className="text-[8px] font-semibold mt-0.5" style={{ color }}>{value}</div>
        </div>
    );
    return (
        <div className="h-full flex flex-col justify-center gap-2">
            <div className="text-[9px] font-bold text-white text-center">{a.name} · {a.well}</div>
            <div className="flex items-center gap-1">
                <Step label="Predicción IA" value={`Falla en ${a.daysToFailure}d`} color={C.red} />
                <ChevronRight size={10} className="text-[#374151]" />
                <Step label="Refacción" value="En bodega ✓" color={C.green} />
                <ChevronRight size={10} className="text-[#374151]" />
                <Step label="Orden" value={wo.folio} color={C.blue} />
            </div>
            <div className="text-[7px] text-[#6B7280] text-center">Bodega Cd. del Carmen · OT autogenerada por IA</div>
        </div>
    );
});

const EamOrdenesW = memo(function EamOrdenesW() {
    const statusCol: Record<string, string> = { abierta: C.yellow, en_proceso: C.blue, completada: C.green };
    return (
        <div className="h-full flex flex-col gap-1 overflow-auto">
            {DEMO_WORK_ORDERS.map((w) => (
                <div key={w.id} className="row-3d flex items-center gap-2 px-1.5 py-1">
                    <span className="text-[8px] font-mono text-white">{w.folio}</span>
                    <span className="text-[7px] text-[#6B7280] truncate flex-1">{w.asset}</span>
                    {w.aiGenerated && <span className="text-[6px] px-1 rounded" style={{ backgroundColor: 'rgba(16,185,129,0.15)', color: C.green }}>IA</span>}
                    <span className="text-[7px] capitalize" style={{ color: statusCol[w.status] }}>{w.status.replace('_', ' ')}</span>
                </div>
            ))}
        </div>
    );
});

// ---------------------------------------------------------------------------
// MÓDULO 06 · ESG — emisiones y huella de carbono
// ---------------------------------------------------------------------------
const EsgAprovGaugeW = memo(function EsgAprovGaugeW() {
    const k = DEMO_ESG_KPIS;
    const value = useSignal('esg-aprov', { base: k.gasAprovechamientoPct, amplitude: 0.15, drift: 0, min: 90, max: 100 });
    const option = useMemo(() => ({
        backgroundColor: 'transparent',
        series: [{
            type: 'gauge', startAngle: 222, endAngle: -42, min: 90, max: 100, radius: '96%',
            pointer: { show: false }, anchor: { show: false },
            axisTick: { show: false }, splitLine: { show: false }, axisLabel: { show: false },
            axisLine: { roundCap: true, lineStyle: { width: 10, color: [[1, '#1b2430']] } },
            progress: { show: true, width: 10, roundCap: true, itemStyle: {
                color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 1, colorStops: [{ offset: 0, color: hexA(C.green, 0.5) }, { offset: 1, color: C.green }] },
                shadowColor: hexA(C.green, 0.7), shadowBlur: 0,
            } },
            detail: { valueAnimation: true, formatter: '{value}%', color: '#fff', fontSize: 18, fontWeight: 'bolder', fontFamily: 'JetBrains Mono', offsetCenter: [0, '6%'] },
            title: { color: C.muted, fontSize: 9, offsetCenter: [0, '38%'] },
            data: [{ value: Math.round(value * 10) / 10, name: `meta ${k.targetAprovechamientoPct}%` }],
        }],
    }), [value, k]);
    return <ReactECharts option={option} notMerge={false} lazyUpdate style={{ height: '100%', minHeight: 70 }} />;
});

const EsgCo2W = memo(function EsgCo2W() {
    const v = useCounterSignal('esg-co2-today', DEMO_ESG_KPIS.co2eTodayTon, 0.01);
    return (
        <div className="metric-well h-full flex flex-col items-center justify-center gap-1" style={{ ['--mc' as any]: C.yellow }}>
            <div className="metric-num text-3xl" style={{ ['--mc' as any]: C.yellow }}>{v.toFixed(1)}</div>
            <div className="text-[8px] text-[#9CA3AF] text-center leading-tight">ton CO₂e hoy · {DEMO_ESG_KPIS.co2eMonthTon} mes</div>
        </div>
    );
});

const EsgIntensidadW = memo(function EsgIntensidadW() {
    return <StatW value={`${DEMO_ESG_KPIS.intensidadKgCo2eBbl}`} color={C.green} sub="kg CO₂e / bbl · intensidad" />;
});

const EsgTendenciaW = memo(function EsgTendenciaW() {
    const option = useMemo(() => ({
        backgroundColor: 'transparent', grid: { left: 2, right: 2, top: 8, bottom: 14 },
        xAxis: { type: 'category', data: DEMO_ESG_MONTHLY.map((d) => d.month), axisLabel: { color: C.faint, fontSize: 7 }, axisLine: { lineStyle: { color: C.border } }, axisTick: { show: false } },
        yAxis: { type: 'value', show: false, min: 92, max: 100 },
        tooltip: { ...tooltipStyle, trigger: 'axis' },
        series: [
            { name: 'Aprov.', type: 'line', data: DEMO_ESG_MONTHLY.map((d) => d.aprovechamiento), smooth: true, symbol: 'none', lineStyle: { color: C.green, width: 2 }, areaStyle: { color: areaGradient(C.green, 0.2) } },
            { name: 'Meta', type: 'line', data: DEMO_ESG_MONTHLY.map((d) => d.meta), smooth: false, symbol: 'none', lineStyle: { color: C.red, width: 1, type: 'dashed' } },
        ],
    }), []);
    return <ReactECharts option={option} notMerge style={{ height: '100%', minHeight: 70 }} />;
});

// ---------------------------------------------------------------------------
// Widgets nuevos — cobertura de los 6 módulos en la Sala
// ---------------------------------------------------------------------------

// Mapa del ducto con toma clandestina (huachicol)
const DuctoMapaW = memo(function DuctoMapaW() {
    return <div className="h-full w-full"><PipelineMap interactive={false} /></div>;
});

// Monitor SCADA · THP/FLP doble eje 24h con umbral de alerta
const ScadaDualW = memo(function ScadaDualW() {
    const live = useSignal('scada-thp102', { base: 298, amplitude: 1.2, drift: -0.35, min: 262, max: 300 });
    const option = useMemo(() => {
        const thp = DEMO_THP_SERIES.map((d, i) => i === DEMO_THP_SERIES.length - 1 ? Math.round(live) : d.thp);
        return {
            backgroundColor: 'transparent', grid: { left: 30, right: 30, top: 22, bottom: 18 },
            legend: { data: ['THP', 'FLP'], textStyle: { color: C.faint, fontSize: 8 }, top: 0, itemWidth: 10, itemHeight: 4 },
            tooltip: { ...tooltipStyle, trigger: 'axis' },
            xAxis: { type: 'category', data: DEMO_THP_SERIES.map((d) => d.time), axisLabel: { color: C.faint, fontSize: 7, interval: 3 }, axisLine: { lineStyle: { color: C.border } }, axisTick: { show: false } },
            yAxis: [
                { type: 'value', scale: true, axisLabel: { color: hexA(C.green, 0.7), fontSize: 7 }, splitLine: { lineStyle: { color: C.grid, opacity: 0.4 } } },
                { type: 'value', scale: true, axisLabel: { color: hexA(C.blue, 0.7), fontSize: 7 }, splitLine: { show: false } },
            ],
            series: [
                { name: 'THP', type: 'line', data: thp, smooth: true, symbol: 'none', lineStyle: { color: C.green, width: 2, shadowColor: hexA(C.green, 0.6), shadowBlur: 0 }, areaStyle: { color: areaGradient(C.green, 0.28) },
                  markArea: { silent: true, itemStyle: { color: 'rgba(239,68,68,0.10)' }, data: [[{ xAxis: '06:00' }, { xAxis: '23:00' }]] },
                  markLine: { silent: true, symbol: 'none', data: [{ yAxis: 280, lineStyle: { color: C.red, type: 'dashed', width: 1 }, label: { formatter: 'umbral 280', color: C.red, fontSize: 7 } }] } },
                { name: 'FLP', type: 'line', yAxisIndex: 1, data: DEMO_THP_SERIES.map((d) => d.flp), smooth: true, symbol: 'none', lineStyle: { color: C.blue, width: 1.8, shadowColor: hexA(C.blue, 0.5), shadowBlur: 0 } },
            ],
        };
    }, [live]);
    return <ReactECharts option={option} notMerge={false} lazyUpdate style={{ height: '100%', minHeight: 120 }} />;
});

// Monitor de Tanques · nivel de crudo + interfase de agua + %AyS
const TanquesW = memo(function TanquesW() {
    return (
        <div className="h-full flex flex-col gap-2 justify-center overflow-auto">
            {DEMO_TANKS.map((t) => {
                const totalPct = (t.crudeLevelCm / t.heightCm) * 100;
                const waterPct = (t.waterInterfaceCm / t.heightCm) * 100;
                const oilPct = totalPct - waterPct;
                return (
                    <div key={t.id} className="row-3d px-2 py-1.5">
                        <div className="flex items-center justify-between text-[9px] mb-1">
                            <span className="text-white font-semibold">{t.name}</span>
                            <span className="font-mono text-[#9CA3AF]">{Math.round(totalPct)}% · {t.aysPct}% AyS</span>
                        </div>
                        <div className="bar-3d h-2.5 flex">
                            <span style={{ width: `${waterPct}%`, ['--bc' as any]: C.blue, background: `linear-gradient(90deg, ${hexA(C.blue, 0.7)}, ${C.blue})`, boxShadow: `0 0 8px ${C.blue}`, borderRadius: 0 }} />
                            <span style={{ width: `${oilPct}%`, ['--bc' as any]: C.yellow, background: `linear-gradient(90deg, ${hexA('#b45309', 0.9)}, ${C.yellow})`, boxShadow: `0 0 8px ${hexA(C.yellow, 0.8)}`, borderRadius: 0 }} />
                        </div>
                        <div className="flex justify-between text-[7px] text-[#6B7280] mt-0.5">
                            <span>💧 agua {t.waterInterfaceCm} cm</span>
                            <span>🛢️ crudo {t.crudeLevelCm - t.waterInterfaceCm} cm</span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
});

// Balance de Fiscalización · producido vs entregado (vs Pemex)
const FiscalW = memo(function FiscalW() {
    const last = DEMO_FISCALIZATION[DEMO_FISCALIZATION.length - 1];
    const option = useMemo(() => ({
        backgroundColor: 'transparent', grid: { left: 4, right: 4, top: 20, bottom: 14 },
        legend: { data: ['Producido', 'Entregado'], textStyle: { color: C.faint, fontSize: 8 }, top: 0, itemWidth: 10, itemHeight: 4 },
        tooltip: { ...tooltipStyle, trigger: 'axis' },
        xAxis: { type: 'category', data: DEMO_FISCALIZATION.map((d) => d.date), axisLabel: { color: C.faint, fontSize: 7 }, axisLine: { lineStyle: { color: C.border } }, axisTick: { show: false } },
        yAxis: { type: 'value', show: false, scale: true },
        series: [
            { name: 'Producido', type: 'line', data: DEMO_FISCALIZATION.map((d) => d.producedBbl), smooth: true, symbol: 'none', lineStyle: { color: C.green, width: 2, shadowColor: hexA(C.green, 0.5), shadowBlur: 0 }, areaStyle: { color: areaGradient(C.green, 0.22) } },
            { name: 'Entregado', type: 'line', data: DEMO_FISCALIZATION.map((d) => d.deliveredBbl), smooth: true, symbol: 'none', lineStyle: { color: C.blue, width: 1.6, type: 'dashed' } },
        ],
    }), []);
    return (
        <div className="h-full flex flex-col">
            <div className="flex-1 min-h-0"><ReactECharts option={option} notMerge style={{ height: '100%', minHeight: 70 }} /></div>
            <div className="flex items-center justify-between px-1 pt-1 border-t border-[#1F2937] text-[8px]">
                <span className="text-[#9CA3AF]">Δ vs. estatal hoy</span>
                <span className="font-mono font-bold" style={{ color: Math.abs(last.differenceBbl) <= 10 ? C.green : C.yellow }}>{last.differenceBbl > 0 ? '+' : ''}{last.differenceBbl} bbl</span>
            </div>
        </div>
    );
});

// Dosificación Química · inyección por pozo vs objetivo
const QuimicaW = memo(function QuimicaW() {
    return (
        <div className="h-full flex flex-col gap-1 justify-center overflow-auto">
            {DEMO_CHEMICAL.map((c) => {
                const ratio = c.volumeGal / c.target;
                const col = ratio > 1.15 ? C.yellow : ratio < 0.85 ? C.red : C.green;
                return (
                    <div key={c.well} className="row-3d px-2 py-1">
                        <div className="flex items-center justify-between text-[8px]">
                            <span className="text-white font-semibold">{c.well}</span>
                            <span className="font-mono" style={{ color: col }}>{c.volumeGal} / {c.target} gal</span>
                        </div>
                        <div className="bar-3d h-1.5 mt-0.5" style={{ ['--bc' as any]: col }}>
                            <span style={{ width: `${Math.min(100, ratio * 100)}%` }} />
                        </div>
                        <div className="text-[7px] text-[#6B7280] mt-0.5">{c.chemical}</div>
                    </div>
                );
            })}
        </div>
    );
});

// Inventario HSE / Energía · diésel + incidentes de seguridad
const HseEnergiaW = memo(function HseEnergiaW() {
    const sevCol: Record<string, string> = { alto: C.red, medio: C.yellow, bajo: C.green };
    const option = useMemo(() => ({
        backgroundColor: 'transparent', grid: { left: 4, right: 4, top: 6, bottom: 14 },
        tooltip: { ...tooltipStyle, trigger: 'axis', formatter: (p: any) => `${p[0].name}<br/>${p[0].value.toLocaleString()} L diésel` },
        xAxis: { type: 'category', data: DEMO_DIESEL.map((d) => d.day), axisLabel: { color: C.faint, fontSize: 7 }, axisLine: { lineStyle: { color: C.border } }, axisTick: { show: false } },
        yAxis: { type: 'value', show: false, scale: true },
        series: [{ type: 'bar', data: DEMO_DIESEL.map((d) => d.liters), barWidth: '55%', itemStyle: { color: areaGradient(C.yellow, 0.9), borderRadius: [3, 3, 0, 0] } }],
    }), []);
    return (
        <div className="h-full flex flex-col gap-1">
            <div className="text-[8px] text-[#6B7280] uppercase tracking-wider">Consumo de diésel (L/día)</div>
            <div className="flex-1 min-h-0"><ReactECharts option={option} notMerge style={{ height: '100%', minHeight: 50 }} /></div>
            <div className="space-y-0.5 border-t border-[#1F2937] pt-1">
                {DEMO_HSE.slice(0, 2).map((h) => (
                    <div key={h.id} className="flex items-center gap-1.5 text-[8px]">
                        <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ backgroundColor: sevCol[h.severity], boxShadow: `0 0 5px ${sevCol[h.severity]}` }} />
                        <span className="text-[#D1D5DB] truncate">{h.well} · {h.type}</span>
                    </div>
                ))}
            </div>
        </div>
    );
});

// Bitácora NPT · tiempo no productivo por causa (tabla con barras)
const NptTablaW = memo(function NptTablaW() {
    const total = DEMO_NPT_BY_CATEGORY.reduce((s, c) => s + c.hours, 0);
    const max = Math.max(...DEMO_NPT_BY_CATEGORY.map((c) => c.hours));
    return (
        <div className="h-full flex flex-col gap-1 justify-center">
            {DEMO_NPT_BY_CATEGORY.map((c) => (
                <div key={c.category} className="row-3d px-2 py-1">
                    <div className="flex items-center justify-between text-[8px] mb-0.5">
                        <span className="text-white">{c.category}</span>
                        <span className="font-mono" style={{ color: c.color }}>{c.hours} h · {Math.round((c.hours / total) * 100)}%</span>
                    </div>
                    <div className="bar-3d h-1.5" style={{ ['--bc' as any]: c.color }}>
                        <span style={{ width: `${(c.hours / max) * 100}%` }} />
                    </div>
                </div>
            ))}
        </div>
    );
});

// Carta Dinamométrica (dynacard) · diagnóstico estándar de bombeo mecánico
const DynacardW = memo(function DynacardW() {
    const d = DEMO_DYNACARD;
    // Trazador que recorre el ciclo en vivo
    const phase = useCounterSignal('dyna-idx', 0, 2);
    const idx = Math.floor(phase) % d.points.length;
    const option = useMemo(() => ({
        backgroundColor: 'transparent', grid: { left: 38, right: 10, top: 10, bottom: 24 },
        tooltip: { ...tooltipStyle, trigger: 'item', formatter: (p: any) => `Pos ${p.value[0]}% · ${Math.round(p.value[1]).toLocaleString()} lb` },
        xAxis: { type: 'value', min: 0, max: 100, name: '% carrera', nameLocation: 'middle', nameGap: 16, nameTextStyle: { color: C.faint, fontSize: 8 }, axisLabel: { color: C.faint, fontSize: 7 }, axisLine: { lineStyle: { color: C.border } }, splitLine: { show: false } },
        yAxis: { type: 'value', scale: true, name: 'carga (lb)', nameTextStyle: { color: C.faint, fontSize: 8 }, axisLabel: { color: C.faint, fontSize: 7, formatter: (v: number) => `${(v / 1000).toFixed(0)}k` }, splitLine: { lineStyle: { color: C.grid, opacity: 0.4 } } },
        series: [
            { type: 'line', data: d.points, smooth: 0.25, symbol: 'none', lineStyle: { color: C.green, width: 2, shadowColor: hexA(C.green, 0.6), shadowBlur: 0 }, areaStyle: { color: hexA(C.green, 0.08) } },
            { type: 'scatter', data: [d.points[idx]], symbolSize: 8, itemStyle: { color: '#fff', borderColor: C.green, borderWidth: 2 }, z: 5 },
        ],
    }), [idx, d]);
    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-between text-[8px] mb-0.5 px-1">
                <span className="text-[#9CA3AF]">{d.well} · {d.model} · {d.spm} SPM</span>
                <span className="font-mono text-[#6B7280]">{(d.peakLoadLb / 1000).toFixed(1)}k / {(d.minLoadLb / 1000).toFixed(1)}k lb</span>
            </div>
            <div className="flex-1 min-h-0"><ReactECharts option={option} notMerge={false} lazyUpdate style={{ height: '100%', minHeight: 90 }} /></div>
            <div className="flex items-center gap-1.5 text-[8px] px-1 pt-0.5 border-t border-[#1F2937]">
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: C.green, boxShadow: `0 0 5px ${C.green}` }} />
                <span className="text-[#D1D5DB] truncate">{d.diagnosis}</span>
            </div>
        </div>
    );
});

// ---------------------------------------------------------------------------
// Registro de widgets
// ---------------------------------------------------------------------------
interface WidgetDef { title: string; color: string; w: number; h: number; render: () => ReactNode; noConfig?: boolean }
const WIDGETS: Record<string, WidgetDef> = {
    mapa:        { title: 'Mapa del Campo',          color: C.green,  w: 5, h: 4, render: () => <div className="h-full w-full"><FieldMap height="100%" interactive={false} /></div> },
    matriz:      { title: 'Matriz de Pozos',         color: C.blue,   w: 4, h: 4, render: () => <MatrizW /> },
    well3d:      { title: 'Pozo 3D · POZO-102H',     color: C.blue,   w: 4, h: 4, render: () => <Well3DW /> },
    scadaDual:   { title: 'SCADA · THP/FLP 24h',     color: C.green,  w: 5, h: 3, render: () => <ScadaDualW /> },
    tanques:     { title: 'Monitor de Tanques',      color: C.yellow, w: 4, h: 3, render: () => <TanquesW /> },
    quimica:     { title: 'Dosificación Química',    color: C.blue,   w: 4, h: 3, render: () => <QuimicaW /> },
    dynacard:    { title: 'Carta Dinamométrica',     color: C.green,  w: 4, h: 3, render: () => <DynacardW /> },
    ductoMapa:   { title: 'Mapa del Ducto · Huachicol', color: C.red, w: 5, h: 4, render: () => <DuctoMapaW /> },
    fiscal:      { title: 'Balance de Fiscalización', color: C.green, w: 4, h: 3, render: () => <FiscalW /> },
    hseEnergia:  { title: 'Inventario HSE / Energía', color: C.yellow, w: 4, h: 3, render: () => <HseEnergiaW /> },
    nptTabla:    { title: 'Bitácora NPT por Causa',  color: C.purple, w: 4, h: 3, render: () => <NptTablaW /> },
    thp102:      { title: 'THP POZO-102H ↓',         color: C.yellow, w: 3, h: 2, render: () => <MiniLine skey="thp102" color={C.yellow} base={300} drift={1.2} /> },
    thp101:      { title: 'THP POZO-101H',           color: C.green,  w: 3, h: 2, render: () => <MiniLine skey="thp101" color={C.green}  base={342} /> },
    thp105:      { title: 'THP POZO-105H',           color: C.green,  w: 3, h: 2, render: () => <MiniLine skey="thp105" color={C.green}  base={388} /> },
    gaugeHz:     { title: 'Motor 102H · Hz',         color: C.green,  w: 2, h: 3, render: () => <GaugeW skey="gaugeHz"  base={52}   max={70}  color={C.green}  label="Frec" unit="Hz"   /> },
    gaugeAmp:    { title: 'Motor 102H · Amp',        color: C.yellow, w: 2, h: 3, render: () => <GaugeW skey="gaugeAmp" base={48}   max={65}  color={C.yellow} label="Corr" unit="A"    drift={0.04} /> },
    gaugeVib:    { title: 'Motor 102H · Vib',        color: C.red,    w: 2, h: 3, render: () => <GaugeW skey="gaugeVib" base={0.87} max={1.5} color={C.red}    label="Vib"  unit="mm/s" drift={0.002} amp={0.03} /> },
    gaugePIP:    { title: 'PIP · POZO-102H ↓',       color: C.red,    w: 2, h: 3, render: () => <GaugeW skey="gaugePIP" base={820}  max={2000} color={C.red}   label="PIP"  unit="psi"  drift={-0.6} amp={4} /> },
    telemBanner: { title: 'Encabezado · Telemetría', color: C.blue,   w: 12, h: 1, noConfig: true, render: () => <TelemetriaBanner /> },
    telemRecomendIA: { title: 'Recomendación IA · Gas-Lock', color: C.yellow, w: 7, h: 3, noConfig: true, render: () => <TelemetriaRecomendacionIA /> },
    prodMes:     { title: 'Producción del Mes',      color: C.green,  w: 3, h: 2, render: () => <CounterW skey="prodMes" start={72450} step={3} color="#fff"   sub="bbl netos · Jun 2026 · ↑4.1%" /> },
    prodHoy:     { title: 'Producción Hoy',          color: C.green,  w: 2, h: 2, render: () => <CounterW skey="prodHoy" start={3248}  step={1} color={C.green} sub="bbl" /> },
    uptime:      { title: 'Uptime Global',           color: C.green,  w: 3, h: 2, render: () => <StatW value="87.5%"  color="#fff"     sub="6/8 pozos activos" /> },
    gasComerc:   { title: 'Gas Comercializado',      color: C.green,  w: 3, h: 2, render: () => <StatW value="95.8%"  color={C.green}  sub="aprovechamiento" /> },
    bsw:         { title: 'BSW Promedio',            color: C.blue,   w: 3, h: 1, render: () => <StatW value="18.2%"  color={C.blue}   sub="agua y sedimento" /> },
    alertas:     { title: 'Alertas Activas',         color: C.red,    w: 4, h: 2, render: () => <AlertasW /> },
    eventos:     { title: 'Bitácora de Eventos',     color: C.blue,   w: 6, h: 2, render: () => <EventosW /> },
    campoBanner: { title: 'Encabezado · Campo',      color: C.green,  w: 12, h: 1, noConfig: true, render: () => <CampoBanner /> },
    campoRecomendIA: { title: 'Recomendación IA · Campo', color: C.green, w: 5, h: 2, noConfig: true, render: () => <CampoRecomendacionIA /> },
    cne:         { title: 'Cumplimiento CNE/SENER',  color: C.blue,   w: 5, h: 3, render: () => <CneW /> },
    npt:         { title: 'NPT por Causa',           color: C.purple, w: 4, h: 3, render: () => <NptW /> },
    declinacion: { title: 'Curva de Declinación',    color: C.yellow, w: 5, h: 2, render: () => <DeclinacionW /> },
    dirBanner:   { title: 'Encabezado · Dirección',  color: C.purple, w: 12, h: 1, noConfig: true, render: () => <DireccionBanner /> },
    dirPronostico: { title: 'Pronóstico vs Real',    color: C.green,  w: 6, h: 3, render: () => <DireccionPronostico /> },
    dirRecomendIA: { title: 'Recomendación IA · Dirección', color: C.purple, w: 7, h: 3, noConfig: true, render: () => <DireccionRecomendacionIA /> },
    // Widgets binding-aware (configurables por pozo + variable)
    gaugeWell:   { title: 'Gauge · Por Pozo',        color: C.green,  w: 2, h: 3, render: () => <BoundGaugeW wellId="" variable="" /> },
    lineWell:    { title: 'Gráfica · Por Pozo',      color: C.blue,   w: 3, h: 2, render: () => <BoundLineW  wellId="" variable="" /> },
    multiLine:   { title: 'Comparar Pozos',          color: C.blue,   w: 6, h: 3, render: () => <MultiLineW  wellIds={[]} variable="thp" /> },
    comparador:  { title: 'Comparador de Pozos',     color: C.purple, w: 6, h: 4, render: () => <ComparadorW wellIds={[]} variable="thp" mode="mosaico" norm="abs" alarmSort /> },
    // ── Módulo 04 · Ductos ──
    ductoPerfil:    { title: 'Perfil de Presión · Ducto', color: C.blue,   w: 6, h: 3, render: () => <DuctoPerfilW /> },
    ductoBalance:   { title: 'Balance del Ducto',         color: C.green,  w: 3, h: 2, render: () => <DuctoBalanceW /> },
    ductoAlerta:    { title: 'Alerta Huachicol / Fuga',   color: C.red,    w: 4, h: 3, render: () => <DuctoAlertaW /> },
    ductoSegmentos: { title: 'Tramos del Ducto',          color: C.blue,   w: 4, h: 3, render: () => <DuctoSegmentosW /> },
    ductosBanner:   { title: 'Encabezado · Ductos',       color: C.blue,   w: 12, h: 1, noConfig: true, render: () => <DuctosBanner /> },
    // ── Módulo 05 · EAM ──
    eamSalud:       { title: 'Salud de Activos',          color: C.purple, w: 5, h: 3, render: () => <EamSaludW /> },
    eamFlujo:       { title: 'IA → Refacción → Orden',    color: C.purple, w: 4, h: 2, render: () => <EamFlujoW /> },
    eamOrdenes:     { title: 'Órdenes de Trabajo',        color: C.purple, w: 4, h: 2, render: () => <EamOrdenesW /> },
    eamBanner:      { title: 'Encabezado · Mantenimiento', color: C.purple, w: 12, h: 1, noConfig: true, render: () => <EamBanner /> },
    // ── Módulo 06 · ESG ──
    esgAprov:       { title: 'Aprovechamiento de Gas',    color: C.green,  w: 2, h: 3, render: () => <EsgAprovGaugeW /> },
    esgCo2:         { title: 'CO₂e Emitido',              color: C.yellow, w: 3, h: 2, render: () => <EsgCo2W /> },
    esgIntensidad:  { title: 'Intensidad de Emisiones',   color: C.green,  w: 3, h: 1, render: () => <EsgIntensidadW /> },
    esgTendencia:   { title: 'Aprovechamiento vs Meta',   color: C.green,  w: 5, h: 3, render: () => <EsgTendenciaW /> },
    // Sub-piezas del Tablero ESG — mismas que componen el compuesto, sueltas.
    esgBanner:      { title: 'Encabezado · Emisiones ESG', color: C.green, w: 12, h: 1, noConfig: true, render: () => <EsgBanner /> },
    esgKpis:        { title: 'KPIs de Emisiones',         color: C.green,  w: 6, h: 2, render: () => <EsgKpiStrip /> },
    esgCo2Chart:    { title: 'CO₂e Mensual',             color: C.blue,   w: 5, h: 3, render: () => <EsgCo2Chart /> },
    esgCausaRaiz:   { title: 'Paros → CO₂e (causa-raíz)', color: C.red,    w: 5, h: 3, render: () => <EsgCausaRaiz /> },
    esgCompliance:  { title: 'Cumplimiento CNE/ASEA',     color: C.green,  w: 4, h: 3, render: () => <EsgCompliance /> },
    esgRecomendIA:  { title: 'Recomendación IA · ESG',    color: C.yellow, w: 4, h: 3, render: () => <EsgRecomendacionIA /> },
};
const WIDGET_INFO: Record<string, { cat: string; Icon: any }> = {
    mapa:        { cat: 'Campo',      Icon: Map          },
    eventos:     { cat: 'Campo',      Icon: List         },
    alertas:     { cat: 'Campo',      Icon: AlertTriangle},
    prodHoy:     { cat: 'Campo',      Icon: Droplet      },
    matriz:      { cat: 'Telemetría', Icon: Grid2x2      },
    well3d:      { cat: 'Telemetría', Icon: Box          },
    scadaDual:   { cat: 'Telemetría', Icon: Activity     },
    tanques:     { cat: 'Telemetría', Icon: Droplets     },
    quimica:     { cat: 'Telemetría', Icon: Droplet      },
    dynacard:    { cat: 'Telemetría', Icon: Activity     },
    ductoMapa:   { cat: 'Ductos',     Icon: Map          },
    fiscal:      { cat: 'Dirección',  Icon: Shield       },
    hseEnergia:  { cat: 'Campo',      Icon: Flame        },
    campoBanner: { cat: 'Campo',      Icon: ClipboardList},
    campoRecomendIA: { cat: 'Campo',  Icon: Brain        },
    nptTabla:    { cat: 'Dirección',  Icon: PieChart     },
    thp102:      { cat: 'Telemetría', Icon: Activity     },
    thp101:      { cat: 'Telemetría', Icon: Activity     },
    thp105:      { cat: 'Telemetría', Icon: Activity     },
    gaugeHz:     { cat: 'Telemetría', Icon: Gauge        },
    gaugeAmp:    { cat: 'Telemetría', Icon: Zap          },
    gaugeVib:    { cat: 'Telemetría', Icon: Activity     },
    gaugePIP:    { cat: 'Telemetría', Icon: Gauge        },
    telemBanner: { cat: 'Telemetría', Icon: Radio        },
    telemRecomendIA: { cat: 'Telemetría', Icon: Brain    },
    prodMes:     { cat: 'Dirección',  Icon: TrendingUp   },
    uptime:      { cat: 'Dirección',  Icon: Activity     },
    cne:         { cat: 'Dirección',  Icon: BarChart3    },
    npt:         { cat: 'Dirección',  Icon: PieChart     },
    declinacion: { cat: 'Dirección',  Icon: TrendingDown },
    dirBanner:   { cat: 'Dirección',  Icon: BarChart3    },
    dirPronostico: { cat: 'Dirección', Icon: TrendingUp  },
    dirRecomendIA: { cat: 'Dirección', Icon: Brain       },
    gasComerc:   { cat: 'Dirección',  Icon: Flame        },
    bsw:         { cat: 'Dirección',  Icon: Droplets     },
    gaugeWell:   { cat: 'Por Pozo',  Icon: Gauge        },
    lineWell:    { cat: 'Por Pozo',  Icon: Activity     },
    multiLine:   { cat: 'Por Pozo',  Icon: Layers       },
    comparador:  { cat: 'Por Pozo',  Icon: Grid2x2      },
    ductoPerfil:    { cat: 'Ductos',       Icon: Activity      },
    ductoBalance:   { cat: 'Ductos',       Icon: GitBranch     },
    ductoAlerta:    { cat: 'Ductos',       Icon: AlertTriangle },
    ductoSegmentos: { cat: 'Ductos',       Icon: GitBranch     },
    ductosBanner:   { cat: 'Ductos',       Icon: GitBranch     },
    eamSalud:       { cat: 'Mantenimiento', Icon: Wrench        },
    eamFlujo:       { cat: 'Mantenimiento', Icon: Wrench        },
    eamOrdenes:     { cat: 'Mantenimiento', Icon: ClipboardList },
    eamBanner:      { cat: 'Mantenimiento', Icon: Wrench        },
    esgAprov:       { cat: 'ESG',           Icon: Leaf          },
    esgCo2:         { cat: 'ESG',           Icon: Flame         },
    esgIntensidad:  { cat: 'ESG',           Icon: Leaf          },
    esgTendencia:   { cat: 'ESG',           Icon: TrendingUp    },
    esgBanner:      { cat: 'ESG',           Icon: Leaf          },
    esgKpis:        { cat: 'ESG',           Icon: Leaf          },
    esgCo2Chart:    { cat: 'ESG',           Icon: BarChart3     },
    esgCausaRaiz:   { cat: 'ESG',           Icon: Flame         },
    esgCompliance:  { cat: 'ESG',           Icon: Shield        },
    esgRecomendIA:  { cat: 'ESG',           Icon: Brain         },
};
const CATS = ['Campo', 'Telemetría', 'Dirección', 'Por Pozo', 'Ductos', 'Mantenimiento', 'ESG'];

// Descripción de una línea por bloque — usada en tooltips (paleta + bloque colocado).
const WIDGET_DESC: Record<string, string> = {
    mapa: 'Mapa del campo con los pozos y su estado por color.',
    matriz: 'Semáforo de los 8 pozos con su presión THP actual.',
    well3d: 'Gemelo digital 3D del subsuelo del POZO-102H: trayectoria, revestimientos y equipo de fondo.',
    scadaDual: 'Telemetría SCADA: THP (verde) y FLP (azul) de 24h con umbral de alerta del POZO-102H.',
    tanques: 'Monitor de tanques: nivel de crudo, interfase de agua y %AyS de TQ-101/102/201.',
    quimica: 'Dosificación química por pozo: inyección real vs. objetivo de inhibidores.',
    dynacard: 'Carta dinamométrica del balancín: carga vs. posición — diagnóstico de la bomba de fondo.',
    ductoMapa: 'Mapa de integridad del ducto con tramos por color y alerta de toma clandestina (huachicol).',
    fiscal: 'Balance de fiscalización: volumen producido vs. entregado a la empresa estatal y diferencia.',
    hseEnergia: 'Inventario energético: consumo de diésel diario y últimos eventos HSE.',
    nptTabla: 'Tiempo no productivo (NPT) desglosado por causa raíz, en horas y porcentaje.',
    thp102: 'Tendencia de presión THP del POZO-102H (en alerta, cayendo).',
    thp101: 'Tendencia de presión THP del POZO-101H.',
    thp105: 'Tendencia de presión THP del POZO-105H.',
    gaugeHz: 'Frecuencia del variador del motor BEC del POZO-102H (Hz).',
    gaugeAmp: 'Corriente del motor del POZO-102H (A).',
    gaugeVib: 'Vibración del motor del POZO-102H (mm/s).',
    gaugePIP: 'Presión de admisión de la bomba (PIP) del POZO-102H — la variable clave del gas-lock (cayendo).',
    telemBanner: 'Encabezado del Tablero Telemetría: módulo, telemetría en vivo y pozo en foco.',
    telemRecomendIA: 'Diagnóstico IA de gas-lock derivado de PIP + amperaje + vibración del pozo en alerta.',
    prodMes: 'Producción neta acumulada del mes.',
    prodHoy: 'Producción neta acumulada de hoy.',
    uptime: 'Uptime global del activo (pozos activos).',
    gasComerc: 'Porcentaje de gas comercializado (aprovechamiento).',
    bsw: 'BSW promedio del activo (agua y sedimento).',
    alertas: 'Alertas activas del activo en este momento.',
    eventos: 'Bitácora cronológica de eventos del turno.',
    campoBanner: 'Encabezado del Tablero Campo: módulo, turno y pozos activos.',
    campoRecomendIA: 'Estado operativo del turno: pozos parados/intervención y prioridad de acción.',
    cne: 'Cumplimiento CNE/SENER: meta vs. real por mes.',
    npt: 'Distribución del tiempo no productivo (NPT) por causa.',
    declinacion: 'Curva de declinación de producción.',
    dirBanner: 'Encabezado del Tablero Dirección: módulo, KPIs del activo y estatus de cierre vs meta.',
    dirPronostico: 'Pronóstico de cierre de mes: acumulado real + proyección vs meta comprometida.',
    dirRecomendIA: 'Recomendación IA de dirección: proyección de cierre y causa raíz de la brecha.',
    gaugeWell: 'Gauge configurable: elige un pozo y una variable.',
    lineWell: 'Gráfica configurable: elige un pozo y una variable.',
    multiLine: 'Compara una variable de varios pozos en una sola gráfica.',
    comparador: 'EL diferenciador: misma variable, varios pozos, 3 vistas (Overlay/Mosaico/Ranking) con escala compartida y orden por alarma.',
    ductoPerfil: 'Presión a lo largo del ducto; la zona roja marca la anomalía.',
    ductoBalance: 'Balance del ducto: volumen, entrega y pérdida no contabilizada.',
    ductoAlerta: 'Alerta de posible toma clandestina (huachicol) o fuga.',
    ductoSegmentos: 'Estado de cada tramo del ducto por color.',
    eamSalud: 'Días estimados a falla de cada activo físico.',
    eamFlujo: 'Flujo: predicción IA → refacción en bodega → orden de trabajo.',
    eamOrdenes: 'Órdenes de trabajo abiertas, con folio y estado.',
    ductosBanner: 'Encabezado del Tablero Ductos: módulo, balance de transporte y estatus de integridad.',
    eamBanner: 'Encabezado del Tablero Mantenimiento: módulo, predictivo y activos críticos.',
    esgAprov: 'Aprovechamiento de gas vs. meta CNE.',
    esgCo2: 'Toneladas de CO₂e emitidas hoy y en el mes.',
    esgIntensidad: 'Intensidad de emisiones (kg CO₂e por barril).',
    esgTendencia: 'Aprovechamiento de gas vs. meta en los últimos meses.',
    esgBanner: 'Encabezado del Tablero ESG: módulo, marco regulatorio (CNE/SENER + ASEA) y estatus de meta.',
    esgKpis: 'Tira de KPIs de emisiones: gas aprovechado, quemado, CO₂e hoy/mes e intensidad.',
    esgCo2Chart: 'Toneladas de CO₂e emitidas por mes (barras).',
    esgCausaRaiz: 'Tabla causa-raíz: cómo cada paro (NPT) se convierte en gas venteado y toneladas de CO₂e.',
    esgCompliance: 'Estatus de cumplimiento ante CNE/SENER y ASEA.',
    esgRecomendIA: 'Recomendación de la IA derivada de los datos de emisiones (ML · Oilboards).',
};

const typeOf = (uid: string) => uid.split('@')[0];
const defOf  = (uid: string): WidgetDef | undefined => WIDGETS[typeOf(uid)];

// ---------------------------------------------------------------------------
// GRUPOS (Tableros) — NO son un bloque sellado. Al insertar un grupo se sueltan
// sus bloques individuales ya acomodados e interconectados; después cada uno es
// un bloque normal (mover / redimensionar / quitar). dx/dy = offset relativo al
// punto de inserción dentro de una rejilla de 12 columnas.
// ---------------------------------------------------------------------------
interface GroupItem { i: string; dx: number; dy: number; w: number; h: number; binding?: Binding; compare?: CompareCfg }
interface GroupDef { title: string; color: string; cat: string; Icon: any; desc: string; w: number; h: number; items: GroupItem[] }
const GROUPS: Record<string, GroupDef> = {
    ductosTablero: {
        title: 'Tablero Ductos · Completo', color: C.blue, cat: 'Ductos', Icon: LayoutTemplate, w: 12, h: 9,
        desc: 'Inserta el Tablero de Ductos: encabezado, mapa del ducto, alerta de toma clandestina (cerebro), tramos, perfil de presión y balance. Cada bloque independiente.',
        items: [
            { i: 'ductosBanner',   dx: 0, dy: 0, w: 12, h: 1 },
            { i: 'ductoMapa',      dx: 0, dy: 1, w: 5,  h: 4 },
            { i: 'ductoAlerta',    dx: 5, dy: 1, w: 4,  h: 4 },
            { i: 'ductoSegmentos', dx: 9, dy: 1, w: 3,  h: 4 },
            { i: 'ductoPerfil',    dx: 0, dy: 5, w: 9,  h: 3 },
            { i: 'ductoBalance',   dx: 9, dy: 5, w: 3,  h: 3 },
        ],
    },
    eamTablero: {
        title: 'Tablero Mantenimiento · Completo', color: C.purple, cat: 'Mantenimiento', Icon: LayoutTemplate, w: 12, h: 8,
        desc: 'Inserta el Tablero de Mantenimiento (EAM): encabezado, salud de activos, flujo IA→refacción→orden (cerebro) y órdenes de trabajo. Cada bloque independiente.',
        items: [
            { i: 'eamBanner',  dx: 0, dy: 0, w: 12, h: 1 },
            { i: 'eamSalud',   dx: 0, dy: 1, w: 7,  h: 6 },
            { i: 'eamFlujo',   dx: 7, dy: 1, w: 5,  h: 3 },
            { i: 'eamOrdenes', dx: 7, dy: 4, w: 5,  h: 3 },
        ],
    },
    campoTablero: {
        title: 'Tablero Campo · Completo', color: C.green, cat: 'Campo', Icon: LayoutTemplate, w: 12, h: 10,
        desc: 'Inserta el Tablero de Campo: encabezado, mapa del campo, matriz de pozos, producción del día, alertas, bitácora de eventos, tanques, inventario HSE y la recomendación IA del turno. Cada bloque independiente.',
        items: [
            { i: 'campoBanner',     dx: 0, dy: 0, w: 12, h: 1 },
            { i: 'mapa',            dx: 0, dy: 1, w: 5,  h: 4 },
            { i: 'matriz',          dx: 5, dy: 1, w: 4,  h: 4 },
            { i: 'prodHoy',         dx: 9, dy: 1, w: 3,  h: 2 },
            { i: 'alertas',         dx: 9, dy: 3, w: 3,  h: 2 },
            { i: 'eventos',         dx: 0, dy: 5, w: 5,  h: 3 },
            { i: 'tanques',         dx: 5, dy: 5, w: 4,  h: 3 },
            { i: 'hseEnergia',      dx: 9, dy: 5, w: 3,  h: 3 },
            { i: 'campoRecomendIA', dx: 0, dy: 8, w: 12, h: 2 },
        ],
    },
    direccionTablero: {
        title: 'Tablero Dirección · Completo', color: C.purple, cat: 'Dirección', Icon: LayoutTemplate, w: 12, h: 12,
        desc: 'Inserta el Tablero de Dirección: encabezado, KPIs ejecutivos, cumplimiento CNE, pronóstico de cierre vs meta, NPT Pareto, curva de declinación, balance de fiscalización y la recomendación IA. Cada bloque independiente.',
        items: [
            { i: 'dirBanner',     dx: 0,  dy: 0, w: 12, h: 1 },
            { i: 'prodMes',       dx: 0,  dy: 1, w: 3,  h: 2 },
            { i: 'uptime',        dx: 3,  dy: 1, w: 3,  h: 2 },
            { i: 'gasComerc',     dx: 6,  dy: 1, w: 3,  h: 2 },
            { i: 'bsw',           dx: 9,  dy: 1, w: 3,  h: 2 },
            { i: 'cne',           dx: 0,  dy: 3, w: 6,  h: 3 },
            { i: 'dirPronostico', dx: 6,  dy: 3, w: 6,  h: 3 },
            { i: 'npt',           dx: 0,  dy: 6, w: 4,  h: 4 },
            { i: 'declinacion',   dx: 4,  dy: 6, w: 3,  h: 4 },
            { i: 'dirRecomendIA', dx: 7,  dy: 6, w: 5,  h: 4 },
            { i: 'fiscal',        dx: 0,  dy: 10, w: 12, h: 2 },
        ],
    },
    telemetriaTablero: {
        title: 'Tablero Telemetría · Completo', color: C.blue, cat: 'Telemetría', Icon: LayoutTemplate, w: 12, h: 10,
        desc: 'Inserta el Tablero de Telemetría: encabezado, matriz de pozos, SCADA THP/FLP, gauges del motor (Hz/Amp/Vib) + PIP, carta dinamométrica y el diagnóstico IA de gas-lock. Cada bloque queda independiente.',
        items: [
            { i: 'telemBanner',     dx: 0,  dy: 0, w: 12, h: 1 },
            { i: 'matriz',          dx: 0,  dy: 1, w: 4,  h: 5 },
            { i: 'scadaDual',       dx: 4,  dy: 1, w: 8,  h: 3 },
            { i: 'gaugeHz',         dx: 4,  dy: 4, w: 2,  h: 3 },
            { i: 'gaugeAmp',        dx: 6,  dy: 4, w: 2,  h: 3 },
            { i: 'gaugeVib',        dx: 8,  dy: 4, w: 2,  h: 3 },
            { i: 'gaugePIP',        dx: 10, dy: 4, w: 2,  h: 3 },
            { i: 'dynacard',        dx: 0,  dy: 6, w: 5,  h: 4 },
            { i: 'telemRecomendIA', dx: 5,  dy: 7, w: 7,  h: 3 },
        ],
    },
    esgTablero: {
        title: 'Tablero ESG · Completo', color: C.green, cat: 'ESG', Icon: LayoutTemplate, w: 12, h: 10,
        desc: 'Inserta de un jalón el Tablero ESG ya acomodado: encabezado del módulo, KPIs, aprovechamiento vs meta CNE, CO₂e mensual, tabla causa-raíz NPT→CO₂e, cumplimiento y recomendación IA. Cada bloque queda independiente para mover o quitar.',
        items: [
            { i: 'esgBanner',     dx: 0, dy: 0, w: 12, h: 1 },
            { i: 'esgKpis',       dx: 0, dy: 1, w: 12, h: 2 },
            { i: 'esgTendencia',  dx: 0, dy: 3, w: 7,  h: 3 },
            { i: 'esgCo2Chart',   dx: 7, dy: 3, w: 5,  h: 3 },
            { i: 'esgCausaRaiz',  dx: 0, dy: 6, w: 7,  h: 4 },
            { i: 'esgCompliance', dx: 7, dy: 6, w: 5,  h: 2 },
            { i: 'esgRecomendIA', dx: 7, dy: 8, w: 5,  h: 2 },
        ],
    },
};

// Helpers de paleta — funcionan tanto para bloques (WIDGETS) como para grupos.
const palInfo  = (id: string) => WIDGET_INFO[id] ?? (GROUPS[id] ? { cat: GROUPS[id].cat, Icon: GROUPS[id].Icon } : undefined);
const palColor = (id: string) => WIDGETS[id]?.color ?? GROUPS[id]?.color;
const palTitle = (id: string) => WIDGETS[id]?.title ?? GROUPS[id]?.title ?? id;
const palDesc  = (id: string) => WIDGET_DESC[id] ?? GROUPS[id]?.desc ?? '';

// ---------------------------------------------------------------------------
// Layouts por defecto
// ---------------------------------------------------------------------------
const ALL_WELL_IDS = DEMO_WELLS.map((w) => w.id);
const DEFAULT_SCREENS: { name: string; layout: LItem[] }[] = [
    {
        // CAMPO (operador / superintendente de campo): panorama operativo del día.
        name: 'Tablero Campo',
        layout: [
            { i: 'campoBanner', x: 0, y: 0, w: 12, h: 1 },
            { i: 'mapa', x: 0, y: 1, w: 5, h: 4 }, { i: 'matriz', x: 5, y: 1, w: 4, h: 4 },
            { i: 'prodHoy', x: 9, y: 1, w: 3, h: 2 }, { i: 'alertas', x: 9, y: 3, w: 3, h: 2 },
            { i: 'eventos', x: 0, y: 5, w: 5, h: 3 }, { i: 'tanques', x: 5, y: 5, w: 4, h: 3 },
            { i: 'hseEnergia', x: 9, y: 5, w: 3, h: 3 },
            { i: 'campoRecomendIA', x: 0, y: 8, w: 12, h: 2 },
        ],
    },
    {
        // INGENIERÍA Y TELEMETRÍA (ingeniero de producción): Tablero completo con
        // banner, matriz, SCADA, gauges del motor + PIP, dynacard y cerebro gas-lock.
        name: 'Tablero Telemetría',
        layout: [
            { i: 'telemBanner', x: 0, y: 0, w: 12, h: 1 },
            { i: 'matriz', x: 0, y: 1, w: 4, h: 5 },
            { i: 'scadaDual', x: 4, y: 1, w: 8, h: 3 },
            { i: 'gaugeHz', x: 4, y: 4, w: 2, h: 3 }, { i: 'gaugeAmp', x: 6, y: 4, w: 2, h: 3 },
            { i: 'gaugeVib', x: 8, y: 4, w: 2, h: 3 }, { i: 'gaugePIP', x: 10, y: 4, w: 2, h: 3 },
            { i: 'dynacard', x: 0, y: 6, w: 5, h: 4 },
            { i: 'telemRecomendIA', x: 5, y: 7, w: 7, h: 3 },
        ],
    },
    {
        // DIRECCIÓN Y ESTRATEGIA (director del activo): Tablero completo con banner,
        // KPIs, cumplimiento CNE, pronóstico de cierre, NPT Pareto, declinación y cerebro.
        name: 'Tablero Dirección',
        layout: [
            { i: 'dirBanner', x: 0, y: 0, w: 12, h: 1 },
            { i: 'prodMes', x: 0, y: 1, w: 3, h: 2 }, { i: 'uptime', x: 3, y: 1, w: 3, h: 2 }, { i: 'gasComerc', x: 6, y: 1, w: 3, h: 2 }, { i: 'bsw', x: 9, y: 1, w: 3, h: 2 },
            { i: 'cne', x: 0, y: 3, w: 6, h: 3 }, { i: 'dirPronostico', x: 6, y: 3, w: 6, h: 3 },
            { i: 'npt', x: 0, y: 6, w: 4, h: 4 }, { i: 'declinacion', x: 4, y: 6, w: 3, h: 4 }, { i: 'dirRecomendIA', x: 7, y: 6, w: 5, h: 4 },
            { i: 'fiscal', x: 0, y: 10, w: 12, h: 2 },
        ],
    },
    // "Mi Sala" — pantalla vacía para que el usuario arme la suya (arrastra tableros
    // completos ESG/Ductos/EAM como grupos insertables, o bloques sueltos).
    { name: 'Mi Sala', layout: [] },
];

// ---------------------------------------------------------------------------
// resolveBoundWidget — resuelve pozo(s) + variable desde item.binding para los
// 3 widgets configurables. Devuelve { label, body } o null si no es binding-aware.
// Compartido por WidgetItem (vista edición) y MiniScreen (Ver pared) para que
// ambas vistas rendericen lo mismo.
// ---------------------------------------------------------------------------
function resolveBoundWidget(item: LItem, def: WidgetDef): { label: string; body: ReactNode } | null {
    const type = typeOf(item.i);
    const b = item.binding;
    if (type === 'gaugeWell' || type === 'lineWell') {
        const wellId   = b?.mode === 'well' ? b.wellId   : '';
        const variable = b?.mode === 'well' ? b.variable : '';
        const well = DEMO_WELLS.find(w => w.id === wellId);
        const meta = VAR_META[variable];
        const label = item.label || (well && meta ? `${well.name} · ${meta.label}` : def.title);
        const body = type === 'gaugeWell'
            ? <BoundGaugeW wellId={wellId} variable={variable} />
            : <BoundLineW  wellId={wellId} variable={variable} />;
        return { label, body };
    }
    if (type === 'multiLine') {
        const wellIds  = b?.mode === 'global' ? b.wellIds  : [];
        const variable = b?.mode === 'global' ? b.variable : 'thp';
        const meta = VAR_META[variable];
        const label = item.label || (meta ? `Comparar · ${meta.label} (${wellIds.length} pozos)` : def.title);
        return { label, body: <MultiLineW wellIds={wellIds} variable={variable} /> };
    }
    if (type === 'comparador') {
        const wellIds  = b?.mode === 'global' ? b.wellIds  : DEMO_WELLS.map((w) => w.id);
        const variable = b?.mode === 'global' ? b.variable : 'thp';
        const cmp = item.compare ?? { mode: 'mosaico' as CompareMode, norm: 'abs' as CompareNorm, alarmSort: true };
        const meta = VAR_META[variable];
        const modeLabel = cmp.mode === 'overlay' ? 'Overlay' : cmp.mode === 'ranking' ? 'Ranking' : 'Mosaico';
        const label = item.label || (meta ? `Comparador · ${meta.label} (${wellIds.length}) · ${modeLabel}` : def.title);
        return { label, body: <ComparadorW wellIds={wellIds} variable={variable} mode={cmp.mode} norm={cmp.norm} alarmSort={cmp.alarmSort} thresholds={item.thresholds} /> };
    }
    return null;
}

// ---------------------------------------------------------------------------
// WidgetItem — wrapper reactivo que resuelve alertas por umbral
// ---------------------------------------------------------------------------
function WidgetItem({ item, editing, onRemove, onConfig }: { item: LItem; editing: boolean; onRemove: () => void; onConfig: () => void; }) {
    const type = typeOf(item.i);
    const def  = defOf(item.i);
    const sig  = WIDGET_SIGNAL[type];

    const scalarVal = useSignalSnapshot(sig?.key ?? '__none__');
    const seriesArr = useSeriesSnapshot(sig?.series ? (sig.key ?? '__none__') : '__none__');
    const currentVal = sig?.series ? (seriesArr[seriesArr.length - 1] ?? 0) : scalarVal;
    const alerting = !!(item.thresholds && sig && sig.max > 0 && (currentVal / sig.max) * 100 >= item.thresholds.danger);

    if (!def) return null;

    const desc = WIDGET_DESC[type];
    const cfg = def.noConfig ? undefined : onConfig;
    const bound = resolveBoundWidget(item, def);
    if (bound) {
        return (
            <Frame label={bound.label} color={def.color} editing={editing} desc={desc}
                onRemove={onRemove} onConfig={cfg}>
                {bound.body}
            </Frame>
        );
    }

    return (
        <Frame label={item.label || def.title} color={def.color} editing={editing} desc={desc}
            alerting={alerting} onRemove={onRemove} onConfig={cfg}>
            {def.render()}
        </Frame>
    );
}

// ---------------------------------------------------------------------------
// Panel de configuración de widget (Fase 2: Selector de Datos + Umbrales)
// ---------------------------------------------------------------------------
function WidgetConfigPanel({
    item, onClose, onSave,
}: { item: LItem; onClose: () => void; onSave: (patch: Partial<LItem>) => void; }) {
    const type = typeOf(item.i);
    const def  = defOf(item.i);
    // Qué es realmente configurable en este bloque:
    //  - dataConfigurable: lee item.binding (pozo + variable) → gaugeWell/lineWell/multiLine
    //  - thresholdConfigurable: tiene señal en vivo → el semáforo de umbrales surte efecto
    const isComparador = type === 'comparador';
    const dataConfigurable = type === 'gaugeWell' || type === 'lineWell' || type === 'multiLine' || isComparador;
    const thresholdConfigurable = !!WIDGET_SIGNAL[type] || isComparador;
    const [tab, setTab] = useState<'data' | 'style'>(dataConfigurable ? 'data' : 'style');

    // Tab A state
    // El modo lo determina el tipo de bloque, no el usuario: multiLine/comparador
    // comparan varios pozos; gaugeWell/lineWell son de un solo pozo.
    const bindMode: 'well' | 'global' = (type === 'multiLine' || isComparador) ? 'global' : 'well';
    const [wellId, setWellId] = useState<string>(
        item.binding?.mode === 'well' ? item.binding.wellId : DEMO_WELLS[0].id
    );
    const [wellVar, setWellVar] = useState<string>(
        item.binding?.mode === 'well' ? item.binding.variable : WELL_VARIABLES[0].id
    );
    const [globalVar, setGlobalVar] = useState<string>(
        item.binding?.mode === 'global' ? item.binding.variable : WELL_VARIABLES[0].id
    );
    const [selectedWells, setSelectedWells] = useState<string[]>(
        item.binding?.mode === 'global' ? item.binding.wellIds : DEMO_WELLS.map((w) => w.id)
    );

    // Comparador state
    const [cmpMode, setCmpMode] = useState<CompareMode>(item.compare?.mode ?? 'mosaico');
    const [cmpNorm, setCmpNorm] = useState<CompareNorm>(item.compare?.norm ?? 'abs');
    const [cmpAlarmSort, setCmpAlarmSort] = useState<boolean>(item.compare?.alarmSort ?? true);

    // Tab B state
    const [label, setLabel] = useState(item.label ?? '');
    const [warnPct, setWarnPct]   = useState(item.thresholds?.warn   ?? 65);
    const [dangerPct, setDangerPct] = useState(item.thresholds?.danger ?? 85);

    const toggleWell = (id: string) =>
        setSelectedWells((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

    // Atajos de alcance para el comparador (todo el campo / por tipo / activos)
    const scopePresets: { label: string; ids: string[] }[] = [
        { label: 'Todos', ids: DEMO_WELLS.map((w) => w.id) },
        { label: 'BEC', ids: DEMO_WELLS.filter((w) => w.liftType === 'BEC').map((w) => w.id) },
        { label: 'Balancines', ids: DEMO_WELLS.filter((w) => w.liftType === 'BM').map((w) => w.id) },
        { label: 'Activos', ids: DEMO_WELLS.filter((w) => w.status === 'active' || w.status === 'alert').map((w) => w.id) },
    ];

    const handleSave = () => {
        // La etiqueta aplica a todos. El binding solo a los binding-aware; los
        // umbrales solo a los que tienen señal en vivo. Así no escribimos
        // configuración que el bloque ignora (que era el "no aplica nada").
        const patch: Partial<LItem> = { label: label || undefined };
        if (dataConfigurable) {
            patch.binding = bindMode === 'well'
                ? { mode: 'well', wellId, variable: wellVar }
                : { mode: 'global', variable: globalVar, wellIds: selectedWells };
        }
        if (thresholdConfigurable) patch.thresholds = { warn: warnPct, danger: dangerPct };
        if (isComparador) patch.compare = { mode: cmpMode, norm: cmpNorm, alarmSort: cmpAlarmSort };
        onSave(patch);
        onClose();
    };

    return (
        <div className="absolute right-0 top-0 bottom-0 w-80 z-50 bg-[#0B0F19] border-l border-[#1F2937] flex flex-col shadow-2xl">
            {/* Header */}
            <div className="px-4 py-3 border-b border-[#1F2937] flex items-center justify-between flex-shrink-0">
                <div>
                    <div className="flex items-center gap-2">
                        <Settings size={12} className="text-[#10B981]" />
                        <span className="text-[11px] font-bold text-white">Configurar Bloque</span>
                    </div>
                    <div className="text-[9px] text-[#6B7280] mt-0.5 truncate">{def?.title}</div>
                </div>
                <button onClick={onClose} className="text-[#6B7280] hover:text-white transition-colors">
                    <X size={14} />
                </button>
            </div>

            {/* Tabs — la pestaña de datos solo aparece si el bloque la usa */}
            <div className="flex border-b border-[#1F2937] flex-shrink-0">
                {(['data', 'style'] as const).filter((t) => t === 'style' || dataConfigurable).map((t) => (
                    <button key={t} onClick={() => setTab(t)}
                        className={`flex-1 py-2 text-[10px] font-semibold transition-colors ${tab === t ? 'text-[#10B981] border-b-2 border-[#10B981]' : 'text-[#6B7280] hover:text-white'}`}>
                        {t === 'data' ? 'A · Origen del Dato' : dataConfigurable ? 'B · Estilo y Umbrales' : 'Estilo'}
                    </button>
                ))}
            </div>

            {/* Tab A: Origen del Dato */}
            <div className="flex-1 overflow-y-auto">
                {tab === 'data' && dataConfigurable && (
                    <div className="p-4 space-y-4">
                        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-[#10B981]/[0.07] border border-[#10B981]/20">
                            {bindMode === 'global'
                                ? <Layers size={13} className="text-[#10B981] flex-shrink-0" />
                                : <Activity size={13} className="text-[#10B981] flex-shrink-0" />}
                            <span className="text-[10px] font-semibold text-[#10B981]">
                                {bindMode === 'global' ? 'Compara varios pozos en una gráfica' : 'Muestra un solo pozo'}
                            </span>
                        </div>

                        {bindMode === 'well' ? (
                            <>
                                <div>
                                    <label className="text-[9px] font-semibold text-[#9CA3AF] uppercase tracking-wider block mb-1.5">Pozo</label>
                                    <div className="relative">
                                        <select value={wellId} onChange={(e) => setWellId(e.target.value)}
                                            className="w-full bg-[#111827] border border-[#374151] text-[11px] text-white rounded-md px-3 py-2 appearance-none cursor-pointer focus:outline-none focus:border-[#10B981]">
                                            {DEMO_WELLS.map((w) => (
                                                <option key={w.id} value={w.id}>{w.name} · {STATUS_META[w.status]?.label ?? w.status}</option>
                                            ))}
                                        </select>
                                        <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[9px] font-semibold text-[#9CA3AF] uppercase tracking-wider block mb-1.5">Variable</label>
                                    <div className="relative">
                                        <select value={wellVar} onChange={(e) => setWellVar(e.target.value)}
                                            className="w-full bg-[#111827] border border-[#374151] text-[11px] text-white rounded-md px-3 py-2 appearance-none cursor-pointer focus:outline-none focus:border-[#10B981]">
                                            <WellVarOptions />
                                        </select>
                                        <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none" />
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div>
                                    <label className="text-[9px] font-semibold text-[#9CA3AF] uppercase tracking-wider block mb-1.5">Variable a comparar</label>
                                    <div className="relative">
                                        <select value={globalVar} onChange={(e) => setGlobalVar(e.target.value)}
                                            className="w-full bg-[#111827] border border-[#374151] text-[11px] text-white rounded-md px-3 py-2 appearance-none cursor-pointer focus:outline-none focus:border-[#10B981]">
                                            <WellVarOptions />
                                        </select>
                                        <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none" />
                                    </div>
                                </div>

                                {isComparador && (
                                    <>
                                        <div>
                                            <label className="text-[9px] font-semibold text-[#9CA3AF] uppercase tracking-wider block mb-1.5">Vista</label>
                                            <div className="grid grid-cols-3 gap-1">
                                                {([['overlay', 'Overlay'], ['mosaico', 'Mosaico'], ['ranking', 'Ranking']] as [CompareMode, string][]).map(([m, lbl]) => (
                                                    <button key={m} onClick={() => setCmpMode(m)}
                                                        className={`py-1.5 text-[10px] font-semibold rounded-md border transition-colors ${cmpMode === m ? 'bg-[#8B5CF6]/20 border-[#8B5CF6]/50 text-[#a78bfa]' : 'bg-[#111827] border-[#374151] text-[#6B7280] hover:text-white'}`}>
                                                        {lbl}
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="text-[8px] text-[#4B5563] mt-1">
                                                {cmpMode === 'overlay' ? 'Tendencia: todos los pozos superpuestos en una gráfica.' : cmpMode === 'mosaico' ? 'Small-multiples: un mini-panel por pozo, escala compartida.' : 'Leaderboard: ranking vivo por valor, con Δ y sparkline.'}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-semibold text-[#9CA3AF] uppercase tracking-wider block mb-1.5">Normalización</label>
                                            <div className="grid grid-cols-3 gap-1">
                                                {([['abs', 'Absoluto'], ['pctAvg', '% prom.'], ['delta', 'Δ 24h']] as [CompareNorm, string][]).map(([nrm, lbl]) => (
                                                    <button key={nrm} onClick={() => setCmpNorm(nrm)}
                                                        className={`py-1.5 text-[10px] font-semibold rounded-md border transition-colors ${cmpNorm === nrm ? 'bg-[#8B5CF6]/20 border-[#8B5CF6]/50 text-[#a78bfa]' : 'bg-[#111827] border-[#374151] text-[#6B7280] hover:text-white'}`}>
                                                        {lbl}
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="text-[8px] text-[#4B5563] mt-1">
                                                {cmpNorm === 'abs' ? 'Valor real en sus unidades.' : cmpNorm === 'pctAvg' ? 'Cada pozo como % del promedio del campo (100% = promedio). Comparación justa entre pozos de distinto tamaño.' : 'Cambio respecto a hace 24 h.'}
                                            </div>
                                        </div>
                                        <button onClick={() => setCmpAlarmSort((v) => !v)}
                                            className={`w-full flex items-center justify-between px-3 py-2 rounded-md border transition-colors ${cmpAlarmSort ? 'bg-[#EF4444]/10 border-[#EF4444]/40' : 'bg-[#111827] border-[#374151]'}`}>
                                            <span className="text-[10px] font-semibold flex items-center gap-1.5" style={{ color: cmpAlarmSort ? C.red : C.faint }}>
                                                <AlertTriangle size={11} /> Pozos en alarma primero
                                            </span>
                                            <span className={`w-7 h-4 rounded-full relative transition-colors ${cmpAlarmSort ? 'bg-[#EF4444]' : 'bg-[#374151]'}`}>
                                                <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${cmpAlarmSort ? 'left-3.5' : 'left-0.5'}`} />
                                            </span>
                                        </button>
                                    </>
                                )}

                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-[9px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Pozos a incluir</label>
                                        {isComparador && (
                                            <div className="flex gap-1">
                                                {scopePresets.map((p) => (
                                                    <button key={p.label} onClick={() => setSelectedWells(p.ids)}
                                                        className="text-[8px] px-1.5 py-0.5 rounded border border-[#374151] text-[#9CA3AF] hover:text-white hover:border-[#6B7280] transition-colors">
                                                        {p.label}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-1.5">
                                        {DEMO_WELLS.map((w) => {
                                            const checked = selectedWells.includes(w.id);
                                            return (
                                                <label key={w.id} className="flex items-center gap-2.5 cursor-pointer group">
                                                    <div onClick={() => toggleWell(w.id)}
                                                        className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${checked ? 'bg-[#10B981] border-[#10B981]' : 'border-[#374151] group-hover:border-[#6B7280]'}`}>
                                                        {checked && <Check size={10} className="text-white" />}
                                                    </div>
                                                    <span className="text-[10px] text-[#D1D5DB] group-hover:text-white transition-colors">{w.name}</span>
                                                    <span className="text-[8px] ml-auto flex-shrink-0" style={{ color: STATUS_META[w.status]?.color }}>● {STATUS_META[w.status]?.label ?? w.status}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Tab B: Estilo y Umbrales */}
                {tab === 'style' && (
                    <div className="p-4 space-y-5">
                        <div>
                            <label className="text-[9px] font-semibold text-[#9CA3AF] uppercase tracking-wider block mb-1.5">Etiqueta personalizada</label>
                            <input
                                type="text" value={label} onChange={(e) => setLabel(e.target.value)}
                                placeholder={def?.title ?? 'Nombre del bloque'}
                                className="w-full bg-[#111827] border border-[#374151] text-[11px] text-white rounded-md px-3 py-2 focus:outline-none focus:border-[#10B981] placeholder-[#4B5563]"
                            />
                            <div className="text-[8px] text-[#4B5563] mt-1">Deja vacío para usar el nombre automático.</div>
                        </div>

                        {thresholdConfigurable ? (
                        <div>
                            <div className="text-[9px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-3">Semáforo de alertas</div>

                            {/* Barra visual de semáforo */}
                            <div className="relative h-5 rounded-full mb-4 overflow-hidden" style={{
                                background: `linear-gradient(to right, #10B981 0%, #10B981 ${warnPct}%, #F59E0B ${warnPct}%, #F59E0B ${dangerPct}%, #EF4444 ${dangerPct}%, #EF4444 100%)`
                            }}>
                                <div className="absolute inset-0 flex items-center justify-between px-2">
                                    <span className="text-[7px] font-bold text-white/80">NORMAL</span>
                                    <span className="text-[7px] font-bold text-white/80">AVISO</span>
                                    <span className="text-[7px] font-bold text-white/80">CRÍTICO</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[9px] text-[#F59E0B] font-semibold flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-[#F59E0B]" /> Umbral de Aviso
                                        </span>
                                        <span className="text-[10px] font-mono text-[#F59E0B]">{warnPct}%</span>
                                    </div>
                                    <input type="range" min={10} max={90} value={warnPct}
                                        onChange={(e) => { const v = +e.target.value; setWarnPct(v); if (v >= dangerPct) setDangerPct(Math.min(100, v + 5)); }}
                                        className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-[#F59E0B] bg-[#1F2937]" />
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[9px] text-[#EF4444] font-semibold flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-[#EF4444]" /> Umbral Crítico
                                        </span>
                                        <span className="text-[10px] font-mono text-[#EF4444]">{dangerPct}%</span>
                                    </div>
                                    <input type="range" min={15} max={100} value={dangerPct}
                                        onChange={(e) => { const v = +e.target.value; setDangerPct(v); if (v <= warnPct) setWarnPct(Math.max(5, v - 5)); }}
                                        className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-[#EF4444] bg-[#1F2937]" />
                                </div>
                            </div>
                            <div className="text-[8px] text-[#4B5563] mt-2 leading-relaxed">
                                Cuando el valor en vivo supere el umbral crítico, el bloque mostrará un borde rojo pulsante.
                            </div>
                        </div>
                        ) : (
                            <div className="text-[10px] text-[#6B7280] bg-[#111827] border border-[#1F2937] rounded-md px-3 py-2 leading-relaxed">
                                Este bloque muestra datos fijos del activo. Su semáforo de alertas no es configurable; puedes renombrarlo arriba.
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Footer guardar */}
            <div className="px-4 py-3 border-t border-[#1F2937] flex gap-2 flex-shrink-0">
                <button onClick={onClose} className="flex-1 py-2 text-[10px] font-semibold text-[#6B7280] border border-[#374151] rounded-lg hover:text-white hover:border-[#6B7280] transition-colors">
                    Cancelar
                </button>
                <button onClick={handleSave} className="flex-1 py-2 text-[10px] font-semibold bg-[#10B981] text-white rounded-lg hover:bg-[#059669] transition-colors">
                    Aplicar cambios
                </button>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Miniatura de pantalla (vista de pared)
// ---------------------------------------------------------------------------
function MiniScreen({ name, layout, active, onClick, index, total, onMove }: {
    name: string; layout: LItem[]; active: boolean; onClick: () => void;
    index?: number; total?: number; onMove?: (from: number, to: number) => void;
}) {
    const maxRow = Math.max(6, ...layout.map((l) => l.y + l.h), 0);
    const canReorder = onMove && typeof index === 'number' && (total ?? 1) > 1;
    // Render fiel: dibujamos a tamaño "diseño" (12 cols × filas a ROW px, igual
    // proporción que el grid real) y escalamos con transform según el ancho real.
    // Así los bloques mantienen su proporción y el contenido (gauges/gráficas/
    // tablas) escala con ellos en vez de desbordarse en celdas diminutas.
    const previewRef = useRef<HTMLDivElement>(null);
    const [previewW, setPreviewW] = useState(0);
    useEffect(() => {
        const el = previewRef.current;
        if (!el) return;
        const ro = new ResizeObserver(([e]) => setPreviewW(e.contentRect.width));
        ro.observe(el);
        return () => ro.disconnect();
    }, []);
    const DESIGN_W = 1200, ROW = 70, GAP = 6;
    const innerH = maxRow * ROW + (maxRow - 1) * GAP;
    const scale = previewW ? previewW / DESIGN_W : 0;
    return (
        <div role="button" tabIndex={0} onClick={onClick}
            className={`text-left rounded-lg overflow-hidden border bg-[#0B0F19] transition-all hover:scale-[1.01] cursor-pointer ${active ? 'border-[#10B981] glow-green' : 'border-[#1F2937] hover:border-[#374151]'}`}>
            <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-[#1F2937]">
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-white truncate min-w-0"><Monitor size={11} className="text-[#10B981] flex-shrink-0" /> <span className="truncate">{name}</span></span>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                    {canReorder && (
                        <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                            <button disabled={index === 0} onClick={() => onMove!(index!, index! - 1)} title="Mover a la izquierda"
                                className="p-0.5 rounded text-[#6B7280] hover:text-white hover:bg-[#1F2937] disabled:opacity-25 disabled:hover:bg-transparent transition-colors"><ChevronLeft size={13} /></button>
                            <button disabled={index === (total ?? 1) - 1} onClick={() => onMove!(index!, index! + 1)} title="Mover a la derecha"
                                className="p-0.5 rounded text-[#6B7280] hover:text-white hover:bg-[#1F2937] disabled:opacity-25 disabled:hover:bg-transparent transition-colors"><ChevronRight size={13} /></button>
                        </div>
                    )}
                    <span className="flex items-center gap-1 text-[8px] text-[#10B981]"><span className="w-1 h-1 rounded-full bg-[#10B981] pulse-dot" /> EN VIVO</span>
                </div>
            </div>
            <div className="p-1.5">
                {layout.length === 0 ? (
                    <div className="flex items-center justify-center text-[10px] text-[#6B7280] tech-grid rounded" style={{ aspectRatio: '16/10' }}>Sin bloques</div>
                ) : (
                    <div ref={previewRef} className="relative overflow-hidden" style={{ height: scale ? innerH * scale : undefined, aspectRatio: scale ? undefined : '16/10' }}>
                        <div style={{
                            position: 'absolute', top: 0, left: 0, width: DESIGN_W, height: innerH,
                            transform: `scale(${scale})`, transformOrigin: 'top left',
                            display: 'grid', gridTemplateColumns: 'repeat(12,1fr)', gridTemplateRows: `repeat(${maxRow}, ${ROW}px)`, gap: `${GAP}px`,
                        }}>
                            {layout.map((item) => {
                                const def = defOf(item.i);
                                if (!def) return null;
                                const bound = resolveBoundWidget(item, def);
                                return (
                                    <div key={item.i} className="min-h-0 min-w-0"
                                        style={{ gridColumn: `${item.x + 1} / span ${item.w}`, gridRow: `${item.y + 1} / span ${item.h}` }}>
                                        <Frame label={bound ? bound.label : (item.label || def.title)} color={def.color} editing={false} desc={WIDGET_DESC[typeOf(item.i)]}>
                                            {bound ? bound.body : def.render()}
                                        </Frame>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function LiveClock() {
    const t = useScalarFromStore('__clock__', () => new Date().toLocaleTimeString('es-MX'));
    return <span className="text-xs font-mono text-[#9CA3AF] hidden xl:inline">{t}</span>;
}

// Fecha real de hoy, capitalizada (ej. "Sábado 29 jun 2026"). Se recalcula cada
// tick del reloj, así que rueda sola a la medianoche.
function todayLabel(): string {
    const s = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
    return s.charAt(0).toUpperCase() + s.slice(1);
}

// Contexto de la Sala: ANCLA todo a un activo. Selector listo para multi-activo
// (hoy un solo campo + Campo B "próximamente"). Muestra la fecha real de hoy.
function AssetContext() {
    // Suscribirse al reloj para que la fecha quede viva (rollover a medianoche).
    useScalarFromStore('__clock__', () => new Date().toLocaleTimeString('es-MX'));
    const [open, setOpen] = useState(false);
    const fecha = todayLabel();
    return (
        <div className="flex items-center gap-2 min-w-0">
            <div className="relative flex-shrink-0">
                <button onClick={() => setOpen((o) => !o)}
                    className="flex items-center gap-1.5 rounded-lg border border-[#10B981]/30 bg-[#10B981]/5 hover:bg-[#10B981]/10 px-2.5 py-1 transition-colors">
                    <Droplet size={12} className="text-[#10B981] flex-shrink-0" />
                    <span className="text-[12px] font-semibold text-white whitespace-nowrap">{DEMO_ASSET.name}</span>
                    <ChevronDown size={12} className="text-[#6B7280] flex-shrink-0" />
                </button>
                {open && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                        <div className="absolute left-0 top-full mt-1 w-72 bg-[#0B0F19] border border-[#1F2937] rounded-lg shadow-2xl z-50 p-1">
                            <div className="px-2.5 py-1 text-[8px] font-bold text-[#6B7280] uppercase tracking-wider">Activo monitoreado</div>
                            <button onClick={() => setOpen(false)}
                                className="w-full text-left px-2.5 py-2 rounded-md bg-[#10B981]/10 border border-[#10B981]/20">
                                <div className="flex items-center justify-between">
                                    <span className="text-[12px] font-semibold text-white">{DEMO_ASSET.name}</span>
                                    <Check size={13} className="text-[#10B981]" />
                                </div>
                                <div className="text-[9px] text-[#6B7280] mt-0.5">{DEMO_ASSET.region} · {DEMO_ASSET.totalWells} pozos · {DEMO_ASSET.activeWells} activos</div>
                            </button>
                            <div className="px-2.5 py-2 mt-0.5 rounded-md opacity-50 cursor-not-allowed">
                                <div className="flex items-center justify-between">
                                    <span className="text-[12px] text-[#9CA3AF]">Campo B · Onshore</span>
                                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-[#374151] text-[#9CA3AF]">PRÓXIMAMENTE</span>
                                </div>
                                <div className="text-[9px] text-[#4B5563] mt-0.5">Multi-activo en el plan corporativo</div>
                            </div>
                        </div>
                    </>
                )}
            </div>
            <span className="text-[11px] text-[#6B7280] whitespace-nowrap hidden md:inline">{fecha}</span>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------
export default function SalaMonitoreo({ onExit }: { onExit: () => void }) {
    const [screens, setScreens] = useState(() => JSON.parse(JSON.stringify(DEFAULT_SCREENS)) as typeof DEFAULT_SCREENS);
    const [active, setActive]   = useState(0);
    const [editing, setEditing] = useState(false);
    // Entrada cinematográfica: al abrir la Sala se muestra "la pared" (overview de
    // todas las salas) — vende el concepto de centro de control multi-pantalla.
    const [wallOpen, setWallOpen] = useState(true);
    const [screensDrawerOpen, setScreensDrawerOpen] = useState(false);
    const [configUid, setConfigUid] = useState<string | null>(null);
    // Fase 3: renombrar tab
    const [renamingIdx, setRenamingIdx] = useState<number | null>(null);
    const [renameVal, setRenameVal]     = useState('');
    // Fase 3: fade al cambiar de pantalla
    const [fadeKey, setFadeKey] = useState(0);
    // Buscador/filtro de bloques en el drawer
    const [widgetQuery, setWidgetQuery] = useState('');

    const current  = screens[active];
    const uidSeq   = useRef(100); // arrancar en 100 para no chocar con ids de DEFAULT_SCREENS
    const gridScrollRef = useRef<HTMLDivElement>(null);
    const [ghost, setGhost] = useState<{ type: string; x: number; y: number } | null>(null);
    const dragMoved = useRef(false);

    // --- Arrastre propio tipo Notion ------------------------------------------
    // x/y opcionales: si no se indican (clic en la paleta), el bloque cae al
    // fondo del contenido actual. Con compactType={null} no hay auto-acomodo,
    // así que la posición debe ser real (no el y=99 sentinela de antes).
    const addWidget = useCallback((type: string, x?: number, y?: number) => {
        const def = WIDGETS[type];
        if (!def) return;
        const uid = `${type}@${uidSeq.current++}`;
        setScreens((prev) => prev.map((s, i) => {
            if (i !== active) return s;
            const bottom = s.layout.reduce((m, l) => Math.max(m, l.y + l.h), 0);
            const nx = Math.min(x ?? 0, 12 - def.w);
            const ny = y ?? bottom;
            return { ...s, layout: [...s.layout, { i: uid, x: Math.max(0, nx), y: ny, w: def.w, h: def.h }] };
        }));
    }, [active]);

    // Inserta un GRUPO: suelta todos sus bloques individuales ya posicionados.
    const addGroup = useCallback((groupType: string, x?: number, y?: number) => {
        const g = GROUPS[groupType];
        if (!g) return;
        setScreens((prev) => prev.map((s, i) => {
            if (i !== active) return s;
            const bottom = s.layout.reduce((m, l) => Math.max(m, l.y + l.h), 0);
            const baseX = Math.max(0, Math.min(x ?? 0, 12 - g.w));
            const baseY = y ?? bottom;
            const items: LItem[] = g.items.map((it) => ({
                i: `${it.i}@${uidSeq.current++}`,
                x: Math.max(0, Math.min(12 - it.w, baseX + it.dx)), y: baseY + it.dy, w: it.w, h: it.h,
                ...(it.binding ? { binding: it.binding } : {}),
                ...(it.compare ? { compare: it.compare } : {}),
            }));
            return { ...s, layout: [...s.layout, ...items] };
        }));
    }, [active]);

    // Despachador: rutea a grupo o bloque según el tipo.
    const insert = useCallback((type: string, x?: number, y?: number) => {
        if (GROUPS[type]) addGroup(type, x, y); else addWidget(type, x, y);
    }, [addGroup, addWidget]);

    const beginDrag = useCallback((type: string, e: React.PointerEvent) => {
        if (!editing) return;
        e.preventDefault();
        dragMoved.current = false;
        setGhost({ type, x: e.clientX, y: e.clientY });
        const move = (ev: PointerEvent) => {
            if (Math.abs(ev.movementX) + Math.abs(ev.movementY) > 0) dragMoved.current = true;
            setGhost((g) => (g ? { ...g, x: ev.clientX, y: ev.clientY } : g));
        };
        const up = (ev: PointerEvent) => {
            document.removeEventListener('pointermove', move);
            document.removeEventListener('pointerup', up);
            setGhost(null);
            const el = gridScrollRef.current;
            if (!el) { if (!dragMoved.current) insert(type); return; }
            const r = el.getBoundingClientRect();
            const inside = ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom;
            if (inside) {
                const pad = 8;
                const colW = (el.clientWidth - pad * 2) / 12;
                const x = Math.max(0, Math.min(11, Math.floor((ev.clientX - r.left - pad) / colW)));
                const y = Math.max(0, Math.floor((ev.clientY - r.top - pad + el.scrollTop) / (68 + 8)));
                insert(type, x, y);
            } else if (!dragMoved.current) {
                insert(type);
            }
        };
        document.addEventListener('pointermove', move);
        document.addEventListener('pointerup', up);
    }, [editing, insert]);

    // --- Operaciones de layout ------------------------------------------------
    const updateLayout = (layout: LItem[]) =>
        setScreens((prev) => prev.map((s, i) => i === active ? { ...s, layout } : s));

    const removeWidget = (uid: string) =>
        setScreens((prev) => prev.map((s, i) => i === active ? { ...s, layout: s.layout.filter((l) => l.i !== uid) } : s));

    const updateWidgetConfig = (uid: string, patch: Partial<LItem>) =>
        setScreens((prev) => prev.map((s, i) => i === active
            ? { ...s, layout: s.layout.map((l) => l.i === uid ? { ...l, ...patch } : l) } : s));

    const resetScreen = () =>
        setScreens((prev) => prev.map((s, i) => i === active ? JSON.parse(JSON.stringify(DEFAULT_SCREENS[active] ?? { name: s.name, layout: [] })) : s));

    // Vaciar por completo la pantalla actual (distinto de Restablecer, que regresa al default)
    const clearScreen = () => { setConfigUid(null); setScreens((prev) => prev.map((s, i) => i === active ? { ...s, layout: [] } : s)); };

    // Reordenar pantallas (en el Wall): mueve la pantalla `from` a la posición `to`
    // y mantiene `active` apuntando a la misma pantalla tras el reordenamiento.
    const moveScreen = (from: number, to: number) => {
        if (to < 0 || to >= screens.length) return;
        setScreens((prev) => { const arr = [...prev]; const [m] = arr.splice(from, 1); arr.splice(to, 0, m); return arr; });
        setActive((a) => a === from ? to : (from < a && to >= a) ? a - 1 : (from > a && to <= a) ? a + 1 : a);
    };

    const tileScreen = () => {
        setScreens((prev) => prev.map((s, i) => {
            if (i !== active) return s;
            const ids = s.layout.map((l) => l.i);
            const n   = ids.length;
            if (n === 0) return s;
            const cols  = n <= 1 ? 1 : n <= 2 ? 2 : n <= 6 ? 3 : 4;
            const baseW = Math.floor(12 / cols);
            const cellH = Math.max(2, Math.floor(10 / Math.ceil(n / cols)));
            const layout = ids.map((id, idx) => {
                const col = idx % cols;
                const row = Math.floor(idx / cols);
                const w   = col === cols - 1 ? 12 - baseW * (cols - 1) : baseW;
                return { ...s.layout.find((l) => l.i === id)!, x: col * baseW, y: row * cellH, w, h: cellH };
            });
            return { ...s, layout };
        }));
    };

    // Fase 3: agregar nueva pantalla
    const addScreen = () => {
        const newName = `Mi Sala ${screens.length - 2}`;
        setScreens((prev) => [...prev, { name: newName, layout: [] }]);
        const newIdx = screens.length;
        setFadeKey((k) => k + 1);
        setActive(newIdx);
    };

    // Fase 3: renombrar pantalla
    const startRename = (i: number) => { setRenamingIdx(i); setRenameVal(screens[i].name); };
    const commitRename = () => {
        if (renamingIdx !== null && renameVal.trim()) {
            setScreens((prev) => prev.map((s, i) => i === renamingIdx ? { ...s, name: renameVal.trim() } : s));
        }
        setRenamingIdx(null);
    };

    const switchScreen = (i: number) => { setFadeKey((k) => k + 1); setActive(i); };

    // Eliminar pantalla (mínimo 1). Ajusta el índice activo.
    const removeScreen = (i: number) => {
        if (screens.length <= 1) return;
        setScreens((prev) => prev.filter((_, idx) => idx !== i));
        setActive((a) => (i < a ? a - 1 : Math.min(a, screens.length - 2)));
        setFadeKey((k) => k + 1);
    };

    const handleLayoutChange = (l: Layout[]) => {
        if (!editing) return;
        const norm = l.filter((it) => it.i !== '__drop__').map((it) => {
            const existing = current.layout.find((x) => x.i === it.i);
            return { ...(existing ?? {}), i: it.i, x: it.x, y: it.y, w: it.w, h: it.h } as LItem;
        });
        const cur  = current.layout;
        const same = norm.length === cur.length && norm.every((n) => {
            const c = cur.find((x) => x.i === n.i);
            return c && c.x === n.x && c.y === n.y && c.w === n.w && c.h === n.h;
        });
        if (!same) updateLayout(norm);
    };

    const configItem = configUid ? current.layout.find((l) => l.i === configUid) : null;

    // Grid guía (solo en edición): nº de filas a dibujar = fondo del contenido + colchón.
    const guideRows = Math.max(8, current.layout.reduce((m, l) => Math.max(m, l.y + l.h), 0) + 3);

    return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
            {/* ── Header ─────────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-[#1F2937] flex-shrink-0 gap-2">
                <div className="flex items-center gap-2 min-w-0">
                    <Grid2x2 size={15} className="text-[#10B981] flex-shrink-0" />
                    <span className="text-sm font-bold text-white flex-shrink-0 hidden md:inline">Sala de Monitoreo</span>

                    {/* Selector de pantalla actual → abre el drawer de pantallas */}
                    <button onClick={() => setScreensDrawerOpen((o) => !o)}
                        className={`flex items-center gap-1.5 text-[12px] px-2.5 py-1 rounded-lg border transition-colors ml-1 ${screensDrawerOpen ? 'border-[#10B981]/50 bg-[#10B981]/10 text-[#10B981]' : 'border-[#374151] text-white hover:border-[#9CA3AF]'}`}>
                        <Monitor size={12} className="text-[#10B981]" />
                        <span className="font-semibold whitespace-nowrap max-w-[180px] truncate">{current.name}</span>
                        <span className="text-[9px] text-[#6B7280]">{active + 1}/{screens.length}</span>
                        <ChevronDown size={12} className="text-[#6B7280]" />
                    </button>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                    <LiveClock />
                    <button onClick={() => setWallOpen(true)}
                        className="flex items-center gap-1.5 text-xs text-[#9CA3AF] hover:text-white border border-[#374151] hover:border-[#9CA3AF] px-2.5 py-1.5 rounded-lg transition-colors">
                        <LayoutGrid size={12} /> Ver pared
                    </button>
                    {editing && (
                        <button onClick={resetScreen}
                            className="flex items-center gap-1.5 text-xs text-[#9CA3AF] hover:text-white border border-[#374151] px-2.5 py-1.5 rounded-lg transition-colors">
                            <RotateCcw size={11} /> Restablecer
                        </button>
                    )}
                    <button onClick={() => { setEditing((e) => !e); setConfigUid(null); }}
                        className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${editing ? 'bg-[#10B981] text-white' : 'text-[#10B981] border border-[#10B981]/40 hover:bg-[#10B981]/10'}`}>
                        {editing ? <><Check size={12} /> Listo</> : <><Pencil size={12} /> Personalizar</>}
                    </button>
                    <button onClick={onExit}
                        className="flex items-center gap-1.5 text-xs text-[#9CA3AF] hover:text-white border border-[#374151] hover:border-[#9CA3AF] px-3 py-1.5 rounded-lg transition-colors">
                        <X size={13} /> Salir
                    </button>
                </div>
            </div>

            {/* Barra de contexto — ANCLA la Sala a un activo + fecha real de hoy */}
            <div className="flex items-center justify-between px-4 py-1.5 border-b border-[#1F2937]/60 flex-shrink-0 bg-[#0B0F19]">
                <AssetContext />
                <span className="text-[10px] text-[#4B5563] hidden sm:inline">Operadora: {DEMO_ASSET.organization}</span>
            </div>

            {/* Hint de modo monitoreo */}
            {!editing && (
                <div className="px-5 py-1.5 text-center text-[11px] text-[#6B7280] border-b border-[#1F2937]/50 flex-shrink-0">
                    💡 Pulsa <span className="text-[#10B981]">Personalizar</span> para arrastrar, configurar y agregar bloques. Abre <span className="text-[#10B981]">Pantallas</span> (arriba) para cambiar de sala, renombrar o crear nuevas.
                </div>
            )}

            {/* ── Área principal ─────────────────────────────────────────────── */}
            <div className="flex-1 relative overflow-hidden">
                {/* Drawer derecho de PANTALLAS — lista con mini-previews, reordenar, renombrar, +nueva */}
                {screensDrawerOpen && (
                    <>
                        <div className="absolute inset-0 z-30 bg-black/40" onClick={() => setScreensDrawerOpen(false)} />
                        <div className="absolute right-0 top-0 bottom-0 w-80 z-40 bg-[#0d1322]/95 backdrop-blur border-l border-[#1F2937] flex flex-col shadow-2xl">
                            <div className="px-4 py-3 border-b border-[#1F2937] flex items-center justify-between flex-shrink-0">
                                <div>
                                    <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#10B981]">Pantallas</div>
                                    <div className="text-[9px] text-[#6B7280] mt-0.5">{screens.length} salas · clic para abrir</div>
                                </div>
                                <button onClick={() => setScreensDrawerOpen(false)} className="text-[#6B7280] hover:text-white transition-colors"><X size={15} /></button>
                            </div>
                            <div className="flex-1 overflow-auto p-3 space-y-3">
                                {screens.map((s, i) => (
                                    <div key={i} className={`rounded-lg border transition-colors ${active === i ? 'border-[#10B981]/60' : 'border-[#1F2937]'}`}>
                                        <div className="flex items-center justify-between px-2 py-1.5 gap-1">
                                            {renamingIdx === i ? (
                                                <input autoFocus value={renameVal} onChange={(e) => setRenameVal(e.target.value)}
                                                    onBlur={commitRename} onKeyDown={(e) => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setRenamingIdx(null); }}
                                                    className="text-[11px] bg-[#111827] border border-[#10B981] text-[#10B981] rounded px-1.5 py-0.5 w-full focus:outline-none" />
                                            ) : (
                                                <button onClick={() => switchScreen(i)} className="flex items-center gap-1.5 text-[11px] font-semibold truncate min-w-0 flex-1 text-left"
                                                    style={{ color: active === i ? C.green : '#D1D5DB' }}>
                                                    <Monitor size={11} className="flex-shrink-0" /> <span className="truncate">{s.name}</span>
                                                </button>
                                            )}
                                            <div className="flex items-center gap-0.5 flex-shrink-0">
                                                <button disabled={i === 0} onClick={() => moveScreen(i, i - 1)} title="Subir"
                                                    className="p-0.5 rounded text-[#6B7280] hover:text-white hover:bg-[#1F2937] disabled:opacity-25"><ChevronLeft size={12} className="rotate-90" /></button>
                                                <button disabled={i === screens.length - 1} onClick={() => moveScreen(i, i + 1)} title="Bajar"
                                                    className="p-0.5 rounded text-[#6B7280] hover:text-white hover:bg-[#1F2937] disabled:opacity-25"><ChevronRight size={12} className="rotate-90" /></button>
                                                <button onClick={() => startRename(i)} title="Renombrar"
                                                    className="p-0.5 rounded text-[#6B7280] hover:text-[#10B981] hover:bg-[#1F2937]"><Pencil size={11} /></button>
                                                <button disabled={screens.length <= 1} onClick={() => removeScreen(i)} title="Eliminar pantalla"
                                                    className="p-0.5 rounded text-[#6B7280] hover:text-[#EF4444] hover:bg-[#1F2937] disabled:opacity-25"><Trash2 size={11} /></button>
                                            </div>
                                        </div>
                                        <div className="px-2 pb-2">
                                            <MiniScreen name={s.name} layout={s.layout} active={active === i} onClick={() => switchScreen(i)} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="px-3 py-3 border-t border-[#1F2937] flex-shrink-0">
                                <button onClick={addScreen}
                                    className="w-full flex items-center justify-center gap-1.5 py-2 text-[11px] font-semibold text-[#10B981] border border-[#10B981]/40 rounded-lg hover:bg-[#10B981]/10 transition-colors">
                                    <Plus size={13} /> Nueva pantalla
                                </button>
                            </div>
                        </div>
                    </>
                )}
                {/* Drawer lateral */}
                {editing && (
                    <div className="absolute left-0 top-0 bottom-0 w-72 z-40 bg-[#0d1322]/95 backdrop-blur border-r border-[#1F2937] flex flex-col">
                        <div className="px-4 py-3 border-b border-[#1F2937]">
                            <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#10B981]">Bloques</div>
                            <div className="text-[10px] text-[#6B7280] mt-0.5">Arrástralos o haz clic · ⚙️ para configurar</div>
                            <div className="flex gap-2 mt-3">
                                <button onClick={tileScreen} title="Acomodar en mosaico" className="flex-1 flex items-center justify-center gap-1.5 text-[11px] font-semibold bg-[#10B981] text-white px-3 py-1.5 rounded-md hover:bg-[#059669] transition-colors">
                                    <LayoutTemplate size={12} /> Organizar
                                </button>
                                <button onClick={resetScreen} title="Restablecer al diseño por defecto"
                                    className="flex items-center justify-center text-[#9CA3AF] hover:text-white border border-[#374151] px-2.5 py-1.5 rounded-md transition-colors">
                                    <RotateCcw size={12} />
                                </button>
                                <button onClick={clearScreen} title="Vaciar pantalla (quitar todos los bloques)"
                                    className="flex items-center justify-center text-[#9CA3AF] hover:text-[#EF4444] border border-[#374151] hover:border-[#EF4444]/50 px-2.5 py-1.5 rounded-md transition-colors">
                                    <Trash2 size={12} />
                                </button>
                            </div>
                            {/* Buscador / filtro de bloques */}
                            <div className="relative mt-2">
                                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none" />
                                <input
                                    value={widgetQuery} onChange={(e) => setWidgetQuery(e.target.value)}
                                    placeholder="Buscar bloque…"
                                    className="w-full bg-[#0B0F19] border border-[#374151] text-[11px] text-white rounded-md pl-8 pr-7 py-1.5 focus:outline-none focus:border-[#10B981] placeholder-[#4B5563]"
                                />
                                {widgetQuery && (
                                    <button onClick={() => setWidgetQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-white">
                                        <X size={11} />
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 space-y-4">
                            {(() => {
                                const q = widgetQuery.trim().toLowerCase();
                                const matches = (id: string) => !q || WIDGETS[id].title.toLowerCase().includes(q) || (WIDGET_DESC[id] ?? '').toLowerCase().includes(q);
                                const total = Object.keys(WIDGETS).filter((id) => WIDGET_INFO[id] && matches(id)).length;
                                if (total === 0) return <div className="text-[10px] text-[#6B7280] text-center py-6">Sin bloques que coincidan con “{widgetQuery}”.</div>;
                                return null;
                            })()}
                            {CATS.map((cat) => {
                                const q = widgetQuery.trim().toLowerCase();
                                const matches = (id: string) => !q || palTitle(id).toLowerCase().includes(q) || palDesc(id).toLowerCase().includes(q);
                                // Grupos (tableros) primero, luego los bloques sueltos de la categoría.
                                const groupIds  = Object.keys(GROUPS).filter((id) => GROUPS[id].cat === cat && matches(id));
                                const widgetIds = Object.keys(WIDGETS).filter((id) => WIDGET_INFO[id]?.cat === cat && matches(id));
                                const ids = [...groupIds, ...widgetIds];
                                if (!ids.length) return null;
                                return (
                                    <div key={cat}>
                                        <div className="text-[9px] font-semibold text-[#6B7280] uppercase tracking-wider mb-2">{cat}</div>
                                        <div className="grid grid-cols-2 gap-2">
                                            {ids.map((id) => {
                                                const isGroup = !!GROUPS[id];
                                                const Icon = palInfo(id)!.Icon;
                                                const color = palColor(id)!;
                                                return (
                                                    <Tooltip key={id} content={palDesc(id) || palTitle(id)} side="right">
                                                        <div onPointerDown={(e) => beginDrag(id, e)}
                                                            className={`group cursor-grab active:cursor-grabbing select-none rounded-lg border bg-[#0B0F19] hover:bg-[#111827] p-2.5 transition-colors ${isGroup ? 'border-[#10B981]/40 hover:border-[#10B981]/70 col-span-2' : 'border-[#1F2937] hover:border-[#374151]'}`}
                                                            style={{ borderLeftColor: color, borderLeftWidth: 2, touchAction: 'none' }}>
                                                            <div className="flex items-center justify-between">
                                                                <Icon size={14} style={{ color }} />
                                                                {isGroup
                                                                    ? <span className="text-[7px] font-bold px-1 py-0.5 rounded" style={{ backgroundColor: `${C.green}20`, color: C.green }}>6 EN 1 · TABLERO</span>
                                                                    : <GripVertical size={10} className="text-[#374151] group-hover:text-[#6B7280]" />}
                                                            </div>
                                                            <div className="text-[10px] text-[#D1D5DB] mt-1.5 leading-tight">{palTitle(id)}</div>
                                                            {isGroup && <div className="text-[8px] text-[#6B7280] mt-0.5 leading-tight">Suelta 6 bloques independientes, ya acomodados.</div>}
                                                        </div>
                                                    </Tooltip>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                            <div className="text-[9px] text-[#4B5563] text-center pt-1 pb-2">Copias ilimitadas del mismo bloque.</div>
                        </div>
                    </div>
                )}

                {/* Grid canvas — Fase 3: fade-in al cambiar pantalla */}
                <div ref={gridScrollRef}
                    className={`h-full overflow-auto p-2 relative ${editing ? 'ml-72' : ''} ${ghost ? 'ring-2 ring-[#10B981]/30 ring-inset rounded' : ''}`}>
                    {editing && current.layout.length === 0 && (
                        <div className="absolute inset-3 rounded-xl border-2 border-dashed border-[#1F2937] flex flex-col items-center justify-center text-center pointer-events-none">
                            <LayoutGrid size={28} className="text-[#374151] mb-3" />
                            <div className="text-sm text-[#6B7280]">Pantalla vacía</div>
                            <div className="text-xs text-[#4B5563] mt-1">Arrastra o haz clic en un bloque del panel para agregarlo.</div>
                        </div>
                    )}

                    {/* Grid guía: misma geometría que RGL (12 cols · filas 68px · gap 8px · padding 8px) */}
                    {editing && (
                        <div className="absolute pointer-events-none z-0 grid gap-2"
                            style={{ top: 8, left: 8, right: 8, padding: 8, gridTemplateColumns: 'repeat(12, 1fr)', gridAutoRows: '68px' }}>
                            {Array.from({ length: guideRows * 12 }).map((_, i) => (
                                <div key={i} className="rounded-md border border-dashed border-[#10B981]/[0.08] bg-[#10B981]/[0.015]" />
                            ))}
                        </div>
                    )}

                    <div key={fadeKey} className="screen-fade-in h-full relative z-10">
                        <RGL
                            className="layout"
                            layout={current.layout}
                            cols={12}
                            rowHeight={68}
                            margin={[8, 8]}
                            isDraggable={editing}
                            isResizable={editing}
                            draggableHandle=".drag-handle"
                            isDroppable={false}
                            onLayoutChange={handleLayoutChange}
                            compactType={null}
                            preventCollision={true}
                            useCSSTransforms
                            measureBeforeMount={false}
                        >
                            {current.layout.map((item) => (
                                <div key={item.i}>
                                    <WidgetItem
                                        item={item}
                                        editing={editing}
                                        onRemove={() => { removeWidget(item.i); if (configUid === item.i) setConfigUid(null); }}
                                        onConfig={() => setConfigUid(item.i)}
                                    />
                                </div>
                            ))}
                        </RGL>
                    </div>
                </div>

                {/* Panel de configuración deslizante (Fase 2) */}
                {editing && configItem && (
                    <WidgetConfigPanel
                        item={configItem}
                        onClose={() => setConfigUid(null)}
                        onSave={(patch) => updateWidgetConfig(configItem.i, patch)}
                    />
                )}
            </div>

            {/* Fantasma de arrastre */}
            {ghost && createPortal(
                <div className="fixed z-[10000] pointer-events-none -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-[#111827]/95 backdrop-blur px-3 py-2 shadow-2xl flex items-center gap-2"
                    style={{ left: ghost.x, top: ghost.y, borderColor: palColor(ghost.type) ?? C.green, borderLeftWidth: 3 }}>
                    {(() => { const Icon = palInfo(ghost.type)?.Icon; return Icon ? <Icon size={14} style={{ color: palColor(ghost.type) }} /> : null; })()}
                    <span className="text-[11px] text-white whitespace-nowrap">{palTitle(ghost.type)}</span>
                </div>,
                document.body
            )}

            {/* Modal: pared de monitoreo */}
            {wallOpen && createPortal(
                <div className="fixed inset-0 z-[9999] bg-black/95 flex flex-col p-6">
                    <div className="flex items-center justify-between mb-5 flex-shrink-0">
                        <div>
                            <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#10B981]">Centro de Control · {DEMO_ASSET.name}</div>
                            <div className="text-lg font-bold text-white">{screens.length} salas de monitoreo · elige una para entrar</div>
                        </div>
                        <button onClick={() => setWallOpen(false)}
                            className="flex items-center gap-2 text-xs text-[#9CA3AF] hover:text-white border border-[#374151] hover:border-[#9CA3AF] px-3 py-1.5 rounded-lg transition-colors">
                            <X size={14} /> Cerrar
                        </button>
                    </div>
                    <div className="flex-1 grid grid-cols-2 lg:grid-cols-3 gap-4 content-center overflow-y-auto">
                        {screens.map((s, i) => (
                            <MiniScreen key={i} name={s.name} layout={s.layout} active={i === active}
                                index={i} total={screens.length} onMove={moveScreen}
                                onClick={() => { switchScreen(i); setWallOpen(false); }} />
                        ))}
                    </div>
                    <div className="text-center text-[11px] text-[#6B7280] mt-4 flex-shrink-0">
                        Cada pantalla se monta en un monitor distinto · clic para entrar a una sala · ◀ ▶ para reordenar.
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
