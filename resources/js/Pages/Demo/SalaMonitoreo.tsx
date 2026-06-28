import { useState, useMemo, useRef, useCallback, memo, ReactNode } from 'react';
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

interface LItem {
    i: string; x: number; y: number; w: number; h: number;
    label?: string;
    binding?: Binding;
    thresholds?: Thresholds;
}

import {
    X, Grid2x2, Pencil, Check, Monitor, RotateCcw, LayoutTemplate, LayoutGrid,
    Map, Activity, Gauge, Zap, Droplet, Droplets, TrendingUp, TrendingDown,
    Flame, AlertTriangle, List, BarChart3, PieChart, GripVertical,
    Settings, Plus, ChevronDown, ChevronRight, Layers,
    GitBranch, Wrench, ClipboardList, Leaf,
} from 'lucide-react';
import FieldMap from '@/Components/Shared/FieldMap';
import { Tooltip } from '@/Components/ui/Tooltip';
import { DEMO_WELLS, DEMO_EVENTS, DEMO_MONTHLY_DATA, DEMO_NPT_BY_CATEGORY, STATUS_META,
    DEMO_PIPELINE_KPIS, DEMO_PIPELINE_ALERT, DEMO_PIPELINE_SEGMENTS, DEMO_PIPELINE_PRESSURE,
    DEMO_ASSETS_HEALTH, DEMO_WORK_ORDERS,
    DEMO_ESG_KPIS, DEMO_ESG_MONTHLY,
    wellDifferentialPsi,
} from '@/data/demoData';
import { C, tooltipStyle, areaGradient } from '@/lib/chart';
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
        <div className={`h-full w-full rounded-lg border overflow-hidden flex flex-col ${alerting ? 'alert-pulse-red' : ''}`}
            style={{ borderColor: `${bColor}40`, backgroundColor: '#0B0F19' }}>
            <Tooltip content={desc ?? ''} side="top">
                <div className={`flex items-center justify-between px-2.5 py-1 border-b select-none ${editing ? 'drag-handle cursor-move' : ''}`}
                    style={{ borderColor: `${bColor}25`, backgroundColor: `${bColor}12` }}>
                    <span className="text-[9px] font-bold uppercase tracking-wider truncate flex items-center gap-1" style={{ color: bColor }}>
                        {alerting && <span className="w-1.5 h-1.5 rounded-full pulse-dot flex-shrink-0" style={{ backgroundColor: bColor }} />}
                        {label}
                    </span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                        {editing ? (
                            <>
                                <button onMouseDown={(e) => e.stopPropagation()} onClick={onConfig}
                                    className="text-[#6B7280] hover:text-[#10B981] transition-colors p-0.5 rounded">
                                    <Settings size={10} />
                                </button>
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
        series: [{ type: 'line', data, smooth: true, symbol: 'none', lineStyle: { color, width: 1.5 }, areaStyle: { color: areaGradient(color, 0.25) } }],
    }), [data, color]);
    return <ReactECharts option={option} notMerge={false} lazyUpdate style={{ height: '100%', minHeight: 30 }} />;
});

const GaugeW = memo(function GaugeW({ skey, base, max, color, label, unit, drift = 0, amp }: { skey: string; base: number; max: number; color: string; label: string; unit: string; drift?: number; amp?: number }) {
    const value = useSignal(skey, { base, amplitude: amp ?? max * 0.012, drift, min: 0, max });
    const v = Math.round(value * 10) / 10;
    // micro-oscilación: añade un segundo tick de ruido visual muy pequeño
    const noise = useSignal(`${skey}_noise`, { base: 0, amplitude: max * 0.004, drift: 0 });
    const vDisplay = Math.round((v + noise) * 10) / 10;
    const option = useMemo(() => ({
        backgroundColor: 'transparent',
        series: [{
            type: 'gauge', startAngle: 210, endAngle: -30, min: 0, max, radius: '92%',
            pointer: { itemStyle: { color }, width: 3, length: '55%' },
            progress: { show: true, width: 5, itemStyle: { color } },
            axisLine: { lineStyle: { width: 5, color: [[1, C.grid]] } },
            axisTick: { show: false }, splitLine: { show: false }, axisLabel: { show: false },
            detail: { valueAnimation: true, formatter: '{value}', color, fontSize: 15, fontWeight: 'bold', fontFamily: 'JetBrains Mono', offsetCenter: [0, '18%'] },
            title: { color: C.muted, fontSize: 8, offsetCenter: [0, '60%'] },
            data: [{ value: vDisplay, name: `${label} ${unit}` }],
        }],
    }), [vDisplay, max, color, label, unit]);
    return <ReactECharts option={option} notMerge={false} lazyUpdate style={{ height: '100%', minHeight: 70 }} />;
});

const CounterW = memo(function CounterW({ skey, start, step, color, sub }: { skey: string; start: number; step: number; color: string; sub: string }) {
    const v = useCounterSignal(skey, start, step);
    return (
        <div className="h-full flex flex-col items-center justify-center">
            <div className="text-2xl font-extrabold font-mono" style={{ color }}>{v.toLocaleString()}</div>
            <div className="text-[8px] text-[#9CA3AF] text-center">{sub}</div>
        </div>
    );
});
const StatW = memo(function StatW({ value, color, sub }: { value: string; color: string; sub: string }) {
    return (
        <div className="h-full flex flex-col items-center justify-center">
            <div className="text-2xl font-extrabold font-mono" style={{ color }}>{value}</div>
            <div className="text-[8px] text-[#9CA3AF] text-center">{sub}</div>
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
                    <div key={w.id} className="bg-[#111827] rounded border-l-2 px-2 py-1 flex flex-col justify-center min-h-0" style={{ borderColor: STATUS_META[w.status].color }}>
                        <div className="flex items-center justify-between">
                            <span className="text-[9px] font-bold text-white truncate">{w.name}</span>
                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: STATUS_META[w.status].color }} />
                        </div>
                        <span className="text-[10px] font-mono" style={{ color: STATUS_META[w.status].color }}>
                            {thp > 0 ? `${Math.round(thp)} psi` : w.status === 'down' ? 'PARADO' : 'INTERV.'}
                        </span>
                    </div>
                );
            })}
        </div>
    );
});
const AlertasW = memo(function AlertasW() {
    return (
        <div className="flex items-center gap-3 h-full">
            <div className="text-3xl font-extrabold font-mono text-[#EF4444] pulse-dot">2</div>
            <div className="text-[9px] text-[#9CA3AF] leading-tight">
                <div>⚠️ POZO-102H · Gas-Lock</div>
                <div>🔴 POZO-104 · Falla eléctrica</div>
            </div>
        </div>
    );
});
const EventosW = memo(function EventosW() {
    const events = useMemo(() => [...DEMO_EVENTS].reverse().slice(0, 6), []);
    return (
        <div className="space-y-1 overflow-hidden h-full">
            {events.map((e, i) => (
                <div key={i} className="flex items-start gap-1.5 text-[8px]">
                    <span className="font-mono text-[#6B7280] flex-shrink-0">{e.time}</span>
                    <span className="text-[#9CA3AF] truncate">{e.message}</span>
                </div>
            ))}
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
    const option = useMemo(() => ({
        backgroundColor: 'transparent',
        tooltip: { ...tooltipStyle, trigger: 'item', formatter: '{b}: {c}h' },
        series: [{ type: 'pie', radius: ['55%', '85%'], center: ['50%', '50%'], label: { show: false }, labelLine: { show: false }, itemStyle: { borderColor: C.bg, borderWidth: 2 }, data: DEMO_NPT_BY_CATEGORY.map((c) => ({ value: c.hours, name: c.category, itemStyle: { color: c.color } })) }],
    }), []);
    return <ReactECharts option={option} notMerge style={{ height: '100%', minHeight: 70 }} />;
});
const DeclinacionW = memo(function DeclinacionW() {
    const option = useMemo(() => ({
        backgroundColor: 'transparent', grid: { left: 0, right: 0, top: 4, bottom: 0 },
        xAxis: { type: 'category', show: false, data: Array.from({ length: 18 }, (_, i) => i) },
        yAxis: { type: 'value', show: false, scale: true },
        tooltip: { ...tooltipStyle, trigger: 'axis' },
        series: [{ type: 'line', data: Array.from({ length: 18 }, (_, i) => Math.round(3050 * Math.exp(-0.018 * i) + Math.sin(i) * 25)), smooth: true, symbol: 'none', lineStyle: { color: C.yellow, width: 1.5 }, areaStyle: { color: areaGradient(C.yellow, 0.2) } }],
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
        <div className="flex flex-col justify-center"><div className="text-base font-extrabold font-mono" style={{ color: c }}>{v}</div><div className="text-[7px] text-[#9CA3AF]">{s}</div></div>
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
                    <div key={s.id} className="flex items-center gap-1.5 bg-[#111827] rounded px-1.5 py-1 border-l-2" style={{ borderColor: col }}>
                        <span className="text-[8px] text-white truncate flex-1">{s.name}</span>
                        <span className="text-[8px] font-mono" style={{ color: col }}>{s.pressureBar} bar</span>
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
                    <div key={a.id} className="flex items-center gap-2 px-1.5 py-1 rounded bg-[#111827]">
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: col }} />
                        <span className="text-[8px] text-white truncate flex-1">{a.name}</span>
                        <span className="text-[8px] text-[#6B7280] truncate hidden sm:inline">{a.well}</span>
                        <span className="text-[9px] font-mono font-bold" style={{ color: col }}>{a.daysToFailure}d</span>
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
                <div key={w.id} className="flex items-center gap-2 px-1.5 py-1 rounded bg-[#111827]">
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
            type: 'gauge', startAngle: 210, endAngle: -30, min: 90, max: 100, radius: '92%',
            pointer: { itemStyle: { color: C.green }, width: 3, length: '55%' },
            progress: { show: true, width: 5, itemStyle: { color: C.green } },
            axisLine: { lineStyle: { width: 5, color: [[1, C.grid]] } },
            axisTick: { show: false }, splitLine: { show: false }, axisLabel: { show: false },
            detail: { valueAnimation: true, formatter: '{value}%', color: C.green, fontSize: 14, fontWeight: 'bold', fontFamily: 'JetBrains Mono', offsetCenter: [0, '18%'] },
            title: { color: C.muted, fontSize: 8, offsetCenter: [0, '62%'] },
            data: [{ value: Math.round(value * 10) / 10, name: `meta ${k.targetAprovechamientoPct}%` }],
        }],
    }), [value, k]);
    return <ReactECharts option={option} notMerge={false} lazyUpdate style={{ height: '100%', minHeight: 70 }} />;
});

const EsgCo2W = memo(function EsgCo2W() {
    const v = useCounterSignal('esg-co2-today', DEMO_ESG_KPIS.co2eTodayTon, 0.01);
    return (
        <div className="h-full flex flex-col items-center justify-center">
            <div className="text-2xl font-extrabold font-mono" style={{ color: C.yellow }}>{v.toFixed(1)}</div>
            <div className="text-[8px] text-[#9CA3AF] text-center">ton CO₂e hoy · {DEMO_ESG_KPIS.co2eMonthTon} mes</div>
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
// Registro de widgets
// ---------------------------------------------------------------------------
interface WidgetDef { title: string; color: string; w: number; h: number; render: () => ReactNode }
const WIDGETS: Record<string, WidgetDef> = {
    mapa:        { title: 'Mapa del Campo',          color: C.green,  w: 5, h: 4, render: () => <div className="h-full w-full"><FieldMap height="100%" interactive={false} /></div> },
    matriz:      { title: 'Matriz de Pozos',         color: C.blue,   w: 4, h: 4, render: () => <MatrizW /> },
    thp102:      { title: 'THP POZO-102H ↓',         color: C.yellow, w: 3, h: 2, render: () => <MiniLine skey="thp102" color={C.yellow} base={300} drift={1.2} /> },
    thp101:      { title: 'THP POZO-101H',           color: C.green,  w: 3, h: 2, render: () => <MiniLine skey="thp101" color={C.green}  base={342} /> },
    thp105:      { title: 'THP POZO-105H',           color: C.green,  w: 3, h: 2, render: () => <MiniLine skey="thp105" color={C.green}  base={388} /> },
    gaugeHz:     { title: 'Motor 102H · Hz',         color: C.green,  w: 2, h: 3, render: () => <GaugeW skey="gaugeHz"  base={52}   max={70}  color={C.green}  label="Frec" unit="Hz"   /> },
    gaugeAmp:    { title: 'Motor 102H · Amp',        color: C.yellow, w: 2, h: 3, render: () => <GaugeW skey="gaugeAmp" base={48}   max={65}  color={C.yellow} label="Corr" unit="A"    drift={0.04} /> },
    gaugeVib:    { title: 'Motor 102H · Vib',        color: C.red,    w: 2, h: 3, render: () => <GaugeW skey="gaugeVib" base={0.87} max={1.5} color={C.red}    label="Vib"  unit="mm/s" drift={0.002} amp={0.03} /> },
    prodMes:     { title: 'Producción del Mes',      color: C.green,  w: 3, h: 2, render: () => <CounterW skey="prodMes" start={72450} step={3} color="#fff"   sub="bbl netos · Jun 2026 · ↑4.1%" /> },
    prodHoy:     { title: 'Producción Hoy',          color: C.green,  w: 2, h: 2, render: () => <CounterW skey="prodHoy" start={3248}  step={1} color={C.green} sub="bbl" /> },
    uptime:      { title: 'Uptime Global',           color: C.green,  w: 3, h: 2, render: () => <StatW value="87.5%"  color="#fff"     sub="6/8 pozos activos" /> },
    gasComerc:   { title: 'Gas Comercializado',      color: C.green,  w: 3, h: 2, render: () => <StatW value="95.8%"  color={C.green}  sub="aprovechamiento" /> },
    bsw:         { title: 'BSW Promedio',            color: C.blue,   w: 3, h: 1, render: () => <StatW value="18.2%"  color={C.blue}   sub="agua y sedimento" /> },
    alertas:     { title: 'Alertas Activas',         color: C.red,    w: 4, h: 2, render: () => <AlertasW /> },
    eventos:     { title: 'Bitácora de Eventos',     color: C.blue,   w: 6, h: 2, render: () => <EventosW /> },
    cne:         { title: 'Cumplimiento CNE/SENER',  color: C.blue,   w: 5, h: 3, render: () => <CneW /> },
    npt:         { title: 'NPT por Causa',           color: C.purple, w: 4, h: 3, render: () => <NptW /> },
    declinacion: { title: 'Curva de Declinación',    color: C.yellow, w: 5, h: 2, render: () => <DeclinacionW /> },
    // Widgets binding-aware (configurables por pozo + variable)
    gaugeWell:   { title: 'Gauge · Por Pozo',        color: C.green,  w: 2, h: 3, render: () => <BoundGaugeW wellId="" variable="" /> },
    lineWell:    { title: 'Gráfica · Por Pozo',      color: C.blue,   w: 3, h: 2, render: () => <BoundLineW  wellId="" variable="" /> },
    multiLine:   { title: 'Comparar Pozos',          color: C.blue,   w: 6, h: 3, render: () => <MultiLineW  wellIds={[]} variable="thp" /> },
    // ── Módulo 04 · Ductos ──
    ductoPerfil:    { title: 'Perfil de Presión · Ducto', color: C.blue,   w: 6, h: 3, render: () => <DuctoPerfilW /> },
    ductoBalance:   { title: 'Balance del Ducto',         color: C.green,  w: 3, h: 2, render: () => <DuctoBalanceW /> },
    ductoAlerta:    { title: 'Alerta Huachicol / Fuga',   color: C.red,    w: 4, h: 3, render: () => <DuctoAlertaW /> },
    ductoSegmentos: { title: 'Tramos del Ducto',          color: C.blue,   w: 4, h: 3, render: () => <DuctoSegmentosW /> },
    // ── Módulo 05 · EAM ──
    eamSalud:       { title: 'Salud de Activos',          color: C.purple, w: 5, h: 3, render: () => <EamSaludW /> },
    eamFlujo:       { title: 'IA → Refacción → Orden',    color: C.purple, w: 4, h: 2, render: () => <EamFlujoW /> },
    eamOrdenes:     { title: 'Órdenes de Trabajo',        color: C.purple, w: 4, h: 2, render: () => <EamOrdenesW /> },
    // ── Módulo 06 · ESG ──
    esgAprov:       { title: 'Aprovechamiento de Gas',    color: C.green,  w: 2, h: 3, render: () => <EsgAprovGaugeW /> },
    esgCo2:         { title: 'CO₂e Emitido',              color: C.yellow, w: 3, h: 2, render: () => <EsgCo2W /> },
    esgIntensidad:  { title: 'Intensidad de Emisiones',   color: C.green,  w: 3, h: 1, render: () => <EsgIntensidadW /> },
    esgTendencia:   { title: 'Aprovechamiento vs Meta',   color: C.green,  w: 5, h: 3, render: () => <EsgTendenciaW /> },
};
const WIDGET_INFO: Record<string, { cat: string; Icon: any }> = {
    mapa:        { cat: 'Campo',      Icon: Map          },
    eventos:     { cat: 'Campo',      Icon: List         },
    alertas:     { cat: 'Campo',      Icon: AlertTriangle},
    prodHoy:     { cat: 'Campo',      Icon: Droplet      },
    matriz:      { cat: 'Telemetría', Icon: Grid2x2      },
    thp102:      { cat: 'Telemetría', Icon: Activity     },
    thp101:      { cat: 'Telemetría', Icon: Activity     },
    thp105:      { cat: 'Telemetría', Icon: Activity     },
    gaugeHz:     { cat: 'Telemetría', Icon: Gauge        },
    gaugeAmp:    { cat: 'Telemetría', Icon: Zap          },
    gaugeVib:    { cat: 'Telemetría', Icon: Activity     },
    prodMes:     { cat: 'Dirección',  Icon: TrendingUp   },
    uptime:      { cat: 'Dirección',  Icon: Activity     },
    cne:         { cat: 'Dirección',  Icon: BarChart3    },
    npt:         { cat: 'Dirección',  Icon: PieChart     },
    declinacion: { cat: 'Dirección',  Icon: TrendingDown },
    gasComerc:   { cat: 'Dirección',  Icon: Flame        },
    bsw:         { cat: 'Dirección',  Icon: Droplets     },
    gaugeWell:   { cat: 'Por Pozo',  Icon: Gauge        },
    lineWell:    { cat: 'Por Pozo',  Icon: Activity     },
    multiLine:   { cat: 'Por Pozo',  Icon: Layers       },
    ductoPerfil:    { cat: 'Ductos',       Icon: Activity      },
    ductoBalance:   { cat: 'Ductos',       Icon: GitBranch     },
    ductoAlerta:    { cat: 'Ductos',       Icon: AlertTriangle },
    ductoSegmentos: { cat: 'Ductos',       Icon: GitBranch     },
    eamSalud:       { cat: 'Mantenimiento', Icon: Wrench        },
    eamFlujo:       { cat: 'Mantenimiento', Icon: Wrench        },
    eamOrdenes:     { cat: 'Mantenimiento', Icon: ClipboardList },
    esgAprov:       { cat: 'ESG',           Icon: Leaf          },
    esgCo2:         { cat: 'ESG',           Icon: Flame         },
    esgIntensidad:  { cat: 'ESG',           Icon: Leaf          },
    esgTendencia:   { cat: 'ESG',           Icon: TrendingUp    },
};
const CATS = ['Campo', 'Telemetría', 'Dirección', 'Por Pozo', 'Ductos', 'Mantenimiento', 'ESG'];

// Descripción de una línea por bloque — usada en tooltips (paleta + bloque colocado).
const WIDGET_DESC: Record<string, string> = {
    mapa: 'Mapa del campo con los pozos y su estado por color.',
    matriz: 'Semáforo de los 8 pozos con su presión THP actual.',
    thp102: 'Tendencia de presión THP del POZO-102H (en alerta, cayendo).',
    thp101: 'Tendencia de presión THP del POZO-101H.',
    thp105: 'Tendencia de presión THP del POZO-105H.',
    gaugeHz: 'Frecuencia del variador del motor BEC del POZO-102H (Hz).',
    gaugeAmp: 'Corriente del motor del POZO-102H (A).',
    gaugeVib: 'Vibración del motor del POZO-102H (mm/s).',
    prodMes: 'Producción neta acumulada del mes.',
    prodHoy: 'Producción neta acumulada de hoy.',
    uptime: 'Uptime global del activo (pozos activos).',
    gasComerc: 'Porcentaje de gas comercializado (aprovechamiento).',
    bsw: 'BSW promedio del activo (agua y sedimento).',
    alertas: 'Alertas activas del activo en este momento.',
    eventos: 'Bitácora cronológica de eventos del turno.',
    cne: 'Cumplimiento CNE/SENER: meta vs. real por mes.',
    npt: 'Distribución del tiempo no productivo (NPT) por causa.',
    declinacion: 'Curva de declinación de producción.',
    gaugeWell: 'Gauge configurable: elige un pozo y una variable.',
    lineWell: 'Gráfica configurable: elige un pozo y una variable.',
    multiLine: 'Compara una variable de varios pozos en una sola gráfica.',
    ductoPerfil: 'Presión a lo largo del ducto; la zona roja marca la anomalía.',
    ductoBalance: 'Balance del ducto: volumen, entrega y pérdida no contabilizada.',
    ductoAlerta: 'Alerta de posible toma clandestina (huachicol) o fuga.',
    ductoSegmentos: 'Estado de cada tramo del ducto por color.',
    eamSalud: 'Días estimados a falla de cada activo físico.',
    eamFlujo: 'Flujo: predicción IA → refacción en bodega → orden de trabajo.',
    eamOrdenes: 'Órdenes de trabajo abiertas, con folio y estado.',
    esgAprov: 'Aprovechamiento de gas vs. meta CNE.',
    esgCo2: 'Toneladas de CO₂e emitidas hoy y en el mes.',
    esgIntensidad: 'Intensidad de emisiones (kg CO₂e por barril).',
    esgTendencia: 'Aprovechamiento de gas vs. meta en los últimos meses.',
};

const typeOf = (uid: string) => uid.split('@')[0];
const defOf  = (uid: string): WidgetDef | undefined => WIDGETS[typeOf(uid)];

// ---------------------------------------------------------------------------
// Layouts por defecto
// ---------------------------------------------------------------------------
const DEFAULT_SCREENS: { name: string; layout: LItem[] }[] = [
    {
        name: 'Pantalla 1 · Campo',
        layout: [
            { i: 'mapa', x: 0, y: 0, w: 5, h: 4 }, { i: 'matriz', x: 5, y: 0, w: 4, h: 4 },
            { i: 'prodMes', x: 9, y: 0, w: 3, h: 2 }, { i: 'alertas', x: 9, y: 2, w: 3, h: 2 },
            { i: 'eventos', x: 0, y: 4, w: 6, h: 2 }, { i: 'thp102', x: 6, y: 4, w: 3, h: 2 },
            { i: 'prodHoy', x: 9, y: 4, w: 3, h: 2 },
        ],
    },
    {
        name: 'Pantalla 2 · Telemetría',
        layout: [
            { i: 'thp102', x: 0, y: 0, w: 4, h: 2 }, { i: 'thp101', x: 4, y: 0, w: 4, h: 2 }, { i: 'thp105', x: 8, y: 0, w: 4, h: 2 },
            { i: 'gaugeHz', x: 0, y: 2, w: 3, h: 3 }, { i: 'gaugeAmp', x: 3, y: 2, w: 3, h: 3 }, { i: 'gaugeVib', x: 6, y: 2, w: 3, h: 3 },
            { i: 'matriz', x: 9, y: 2, w: 3, h: 3 },
        ],
    },
    {
        name: 'Pantalla 3 · Dirección',
        layout: [
            { i: 'prodMes', x: 0, y: 0, w: 4, h: 2 }, { i: 'cne', x: 4, y: 0, w: 5, h: 3 }, { i: 'uptime', x: 9, y: 0, w: 3, h: 2 },
            { i: 'npt', x: 0, y: 2, w: 4, h: 3 }, { i: 'declinacion', x: 4, y: 3, w: 5, h: 2 }, { i: 'gasComerc', x: 9, y: 2, w: 3, h: 2 },
            { i: 'bsw', x: 9, y: 4, w: 3, h: 1 }, { i: 'alertas', x: 0, y: 5, w: 4, h: 2 },
        ],
    },
    {
        name: 'Sala Ejecutiva · Midstream',
        layout: [
            // Fila superior — el gancho: integridad del ducto + alerta huachicol
            { i: 'ductoPerfil',    x: 0, y: 0, w: 8, h: 3 }, { i: 'ductoAlerta', x: 8, y: 0, w: 4, h: 3 },
            // Fila media — tramos + salud de activos + aprovechamiento de gas
            { i: 'ductoSegmentos', x: 0, y: 3, w: 4, h: 3 }, { i: 'eamSalud', x: 4, y: 3, w: 5, h: 3 }, { i: 'esgAprov', x: 9, y: 3, w: 3, h: 3 },
            // Fila inferior — balance del ducto + tendencia ESG + CO₂e en vivo
            { i: 'ductoBalance',   x: 0, y: 6, w: 4, h: 2 }, { i: 'esgTendencia', x: 4, y: 6, w: 5, h: 2 }, { i: 'esgCo2', x: 9, y: 6, w: 3, h: 2 },
        ],
    },
    { name: 'Custom 2', layout: [] },
    { name: 'Custom 3', layout: [] },
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
    const bound = resolveBoundWidget(item, def);
    if (bound) {
        return (
            <Frame label={bound.label} color={def.color} editing={editing} desc={desc}
                onRemove={onRemove} onConfig={onConfig}>
                {bound.body}
            </Frame>
        );
    }

    return (
        <Frame label={item.label || def.title} color={def.color} editing={editing} desc={desc}
            alerting={alerting} onRemove={onRemove} onConfig={onConfig}>
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
    const [tab, setTab] = useState<'data' | 'style'>('data');

    // Tab A state
    // El modo lo determina el tipo de bloque, no el usuario: multiLine compara
    // varios pozos; gaugeWell/lineWell son de un solo pozo. Así no hay combinación rota.
    const bindMode: 'well' | 'global' = type === 'multiLine' ? 'global' : 'well';
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

    // Tab B state
    const [label, setLabel] = useState(item.label ?? '');
    const [warnPct, setWarnPct]   = useState(item.thresholds?.warn   ?? 65);
    const [dangerPct, setDangerPct] = useState(item.thresholds?.danger ?? 85);

    const toggleWell = (id: string) =>
        setSelectedWells((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

    const handleSave = () => {
        const binding: Binding = bindMode === 'well'
            ? { mode: 'well', wellId, variable: wellVar }
            : { mode: 'global', variable: globalVar, wellIds: selectedWells };
        onSave({ label: label || undefined, binding, thresholds: { warn: warnPct, danger: dangerPct } });
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

            {/* Tabs */}
            <div className="flex border-b border-[#1F2937] flex-shrink-0">
                {(['data', 'style'] as const).map((t) => (
                    <button key={t} onClick={() => setTab(t)}
                        className={`flex-1 py-2 text-[10px] font-semibold transition-colors ${tab === t ? 'text-[#10B981] border-b-2 border-[#10B981]' : 'text-[#6B7280] hover:text-white'}`}>
                        {t === 'data' ? 'A · Origen del Dato' : 'B · Estilo y Umbrales'}
                    </button>
                ))}
            </div>

            {/* Tab A: Origen del Dato */}
            <div className="flex-1 overflow-y-auto">
                {tab === 'data' && (
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
                                <div>
                                    <label className="text-[9px] font-semibold text-[#9CA3AF] uppercase tracking-wider block mb-2">Pozos a incluir</label>
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
function MiniScreen({ name, layout, active, onClick }: { name: string; layout: LItem[]; active: boolean; onClick: () => void }) {
    const maxRow = Math.max(6, ...layout.map((l) => l.y + l.h), 0);
    return (
        <div role="button" tabIndex={0} onClick={onClick}
            className={`text-left rounded-lg overflow-hidden border bg-[#0B0F19] transition-all hover:scale-[1.01] cursor-pointer ${active ? 'border-[#10B981] glow-green' : 'border-[#1F2937] hover:border-[#374151]'}`}>
            <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-[#1F2937]">
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-white truncate"><Monitor size={11} className="text-[#10B981]" /> {name}</span>
                <span className="flex items-center gap-1 text-[8px] text-[#10B981]"><span className="w-1 h-1 rounded-full bg-[#10B981] pulse-dot" /> EN VIVO</span>
            </div>
            <div className="p-1.5">
                {layout.length === 0 ? (
                    <div className="flex items-center justify-center text-[10px] text-[#6B7280] tech-grid rounded" style={{ aspectRatio: '16/10' }}>Sin bloques</div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12,1fr)', gridTemplateRows: `repeat(${maxRow},1fr)`, gap: '4px', aspectRatio: '16/10' }}>
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
                )}
            </div>
        </div>
    );
}

function LiveClock() {
    const t = useScalarFromStore('__clock__', () => new Date().toLocaleTimeString('es-MX'));
    return <span className="text-xs font-mono text-[#9CA3AF] hidden xl:inline">{t}</span>;
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------
export default function SalaMonitoreo({ onExit }: { onExit: () => void }) {
    const [screens, setScreens] = useState(() => JSON.parse(JSON.stringify(DEFAULT_SCREENS)) as typeof DEFAULT_SCREENS);
    const [active, setActive]   = useState(0);
    const [editing, setEditing] = useState(false);
    const [wallOpen, setWallOpen] = useState(false);
    const [configUid, setConfigUid] = useState<string | null>(null);
    // Fase 3: renombrar tab
    const [renamingIdx, setRenamingIdx] = useState<number | null>(null);
    const [renameVal, setRenameVal]     = useState('');
    // Fase 3: fade al cambiar de pantalla
    const [fadeKey, setFadeKey] = useState(0);

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
            if (!el) { if (!dragMoved.current) addWidget(type); return; }
            const r = el.getBoundingClientRect();
            const inside = ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom;
            if (inside) {
                const pad = 8;
                const colW = (el.clientWidth - pad * 2) / 12;
                const x = Math.max(0, Math.min(11, Math.floor((ev.clientX - r.left - pad) / colW)));
                const y = Math.max(0, Math.floor((ev.clientY - r.top - pad + el.scrollTop) / (68 + 8)));
                addWidget(type, x, y);
            } else if (!dragMoved.current) {
                addWidget(type);
            }
        };
        document.addEventListener('pointermove', move);
        document.addEventListener('pointerup', up);
    }, [editing, addWidget]);

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
        const newName = `Custom ${screens.length - 2}`;
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
                    <span className="text-sm font-bold text-white flex-shrink-0 hidden sm:inline">Sala de Monitoreo</span>

                    {/* Tabs de pantallas — Fase 3: renombrables */}
                    <div className="flex items-center gap-1 ml-1 overflow-x-auto flex-nowrap">
                        {screens.map((s, i) => (
                            <div key={i} className="flex-shrink-0">
                                {renamingIdx === i ? (
                                    <input autoFocus value={renameVal} onChange={(e) => setRenameVal(e.target.value)}
                                        onBlur={commitRename} onKeyDown={(e) => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setRenamingIdx(null); }}
                                        className="text-[11px] bg-[#111827] border border-[#10B981] text-[#10B981] rounded-md px-2 py-0.5 w-28 focus:outline-none"
                                    />
                                ) : (
                                    <button onClick={() => switchScreen(i)} onDoubleClick={() => startRename(i)}
                                        className={`flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-md transition-colors whitespace-nowrap ${active === i ? 'bg-[#10B981]/15 text-[#10B981]' : 'text-[#9CA3AF] hover:text-white hover:bg-[#1F2937]'}`}>
                                        <Monitor size={10} /> {s.name}
                                    </button>
                                )}
                            </div>
                        ))}
                        {/* Fase 3: + Nueva pantalla */}
                        <button onClick={addScreen} title="Nueva pantalla"
                            className="flex-shrink-0 flex items-center gap-1 text-[11px] px-2 py-1 rounded-md text-[#6B7280] hover:text-[#10B981] hover:bg-[#1F2937] transition-colors">
                            <Plus size={12} />
                        </button>
                    </div>
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

            {/* Hint de modo monitoreo */}
            {!editing && (
                <div className="px-5 py-1.5 text-center text-[11px] text-[#6B7280] border-b border-[#1F2937]/50 flex-shrink-0">
                    💡 Pulsa <span className="text-[#10B981]">Personalizar</span> para arrastrar, configurar y agregar bloques. Doble clic en una pestaña para renombrarla.
                </div>
            )}

            {/* ── Área principal ─────────────────────────────────────────────── */}
            <div className="flex-1 relative overflow-hidden">
                {/* Drawer lateral */}
                {editing && (
                    <div className="absolute left-0 top-0 bottom-0 w-72 z-40 bg-[#0d1322]/95 backdrop-blur border-r border-[#1F2937] flex flex-col">
                        <div className="px-4 py-3 border-b border-[#1F2937]">
                            <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#10B981]">Bloques</div>
                            <div className="text-[10px] text-[#6B7280] mt-0.5">Arrástralos o haz clic · ⚙️ para configurar</div>
                            <div className="flex gap-2 mt-3">
                                <button onClick={tileScreen} className="flex-1 flex items-center justify-center gap-1.5 text-[11px] font-semibold bg-[#10B981] text-white px-3 py-1.5 rounded-md hover:bg-[#059669] transition-colors">
                                    <LayoutTemplate size={12} /> Organizar
                                </button>
                                <button onClick={resetScreen} title="Restablecer"
                                    className="flex items-center justify-center text-[#9CA3AF] hover:text-white border border-[#374151] px-2.5 py-1.5 rounded-md transition-colors">
                                    <RotateCcw size={12} />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 space-y-4">
                            {CATS.map((cat) => {
                                const ids = Object.keys(WIDGETS).filter((id) => WIDGET_INFO[id]?.cat === cat);
                                if (!ids.length) return null;
                                return (
                                    <div key={cat}>
                                        <div className="text-[9px] font-semibold text-[#6B7280] uppercase tracking-wider mb-2">{cat}</div>
                                        <div className="grid grid-cols-2 gap-2">
                                            {ids.map((id) => {
                                                const def  = WIDGETS[id];
                                                const Icon = WIDGET_INFO[id].Icon;
                                                return (
                                                    <Tooltip key={id} content={WIDGET_DESC[id] ?? def.title} side="right">
                                                        <div onPointerDown={(e) => beginDrag(id, e)}
                                                            className="group cursor-grab active:cursor-grabbing select-none rounded-lg border border-[#1F2937] bg-[#0B0F19] hover:border-[#374151] hover:bg-[#111827] p-2.5 transition-colors"
                                                            style={{ borderLeftColor: def.color, borderLeftWidth: 2, touchAction: 'none' }}>
                                                            <div className="flex items-center justify-between">
                                                                <Icon size={14} style={{ color: def.color }} />
                                                                <GripVertical size={10} className="text-[#374151] group-hover:text-[#6B7280]" />
                                                            </div>
                                                            <div className="text-[10px] text-[#D1D5DB] mt-1.5 leading-tight">{def.title}</div>
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
                    style={{ left: ghost.x, top: ghost.y, borderColor: WIDGETS[ghost.type]?.color ?? C.green, borderLeftWidth: 3 }}>
                    {(() => { const Icon = WIDGET_INFO[ghost.type]?.Icon; return Icon ? <Icon size={14} style={{ color: WIDGETS[ghost.type]?.color }} /> : null; })()}
                    <span className="text-[11px] text-white whitespace-nowrap">{WIDGETS[ghost.type]?.title}</span>
                </div>,
                document.body
            )}

            {/* Modal: pared de monitoreo */}
            {wallOpen && createPortal(
                <div className="fixed inset-0 z-[9999] bg-black/95 flex flex-col p-6">
                    <div className="flex items-center justify-between mb-5 flex-shrink-0">
                        <div>
                            <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#10B981]">Pared de Monitoreo</div>
                            <div className="text-lg font-bold text-white">Tu sala completa · {screens.length} pantallas</div>
                        </div>
                        <button onClick={() => setWallOpen(false)}
                            className="flex items-center gap-2 text-xs text-[#9CA3AF] hover:text-white border border-[#374151] hover:border-[#9CA3AF] px-3 py-1.5 rounded-lg transition-colors">
                            <X size={14} /> Cerrar
                        </button>
                    </div>
                    <div className="flex-1 grid grid-cols-2 lg:grid-cols-3 gap-4 content-center overflow-y-auto">
                        {screens.map((s, i) => (
                            <MiniScreen key={i} name={s.name} layout={s.layout} active={i === active}
                                onClick={() => { switchScreen(i); setWallOpen(false); }} />
                        ))}
                    </div>
                    <div className="text-center text-[11px] text-[#6B7280] mt-4 flex-shrink-0">
                        Cada pantalla se monta en un monitor distinto · haz clic para ir a ella · doble clic en la pestaña para renombrarla.
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
