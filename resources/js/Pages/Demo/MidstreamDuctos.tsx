import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import {
    DEMO_PIPELINE_META, DEMO_PIPELINE_SEGMENTS, DEMO_PIPELINE_PRESSURE,
    DEMO_PIPELINE_KPIS, DEMO_PIPELINE_ALERT, PipelineSegment,
} from '@/data/demoData';
import { C, tooltipStyle, areaGradient } from '@/lib/chart';
import { AlertTriangle, TrendingDown, Gauge, GitBranch, Shield, ArrowRight, Radio } from 'lucide-react';
import PipelineMap from '@/Components/Shared/PipelineMap';

const SEG_COLORS: Record<string, string> = {
    normal: C.green, warning: C.yellow, alert: C.red,
};

// ── Gráfica perfil de presión
function PressureProfileChart() {
    const option = useMemo(() => ({
        backgroundColor: 'transparent',
        grid: { left: 40, right: 16, top: 24, bottom: 28 },
        tooltip: {
            ...tooltipStyle, trigger: 'axis',
            formatter: (p: any) => {
                const d = p[0];
                const isAlert = d.dataIndex >= 42 && d.dataIndex <= 57;
                return `<b>KP-${d.name}</b><br/>${d.value} bar${isAlert ? '<br/><span style="color:#EF4444">⚠ Anomalía detectada</span>' : ''}`;
            },
        },
        xAxis: {
            type: 'category',
            data: DEMO_PIPELINE_PRESSURE.map(p => p.km),
            axisLabel: { color: C.faint, fontSize: 9, interval: 9, formatter: (v: number) => `KP-${v}` },
            axisLine: { lineStyle: { color: C.border } }, axisTick: { show: false },
            name: 'Kilómetro de Poste (KP)', nameTextStyle: { color: C.faint, fontSize: 9 }, nameLocation: 'middle', nameGap: 20,
        },
        yAxis: {
            type: 'value', name: 'Presión (bar)', min: 55, max: 105,
            nameTextStyle: { color: C.faint, fontSize: 9 },
            axisLabel: { color: C.faint, fontSize: 9 },
            axisLine: { show: false }, splitLine: { lineStyle: { color: C.grid } },
        },
        visualMap: {
            show: false, dimension: 1,
            pieces: [
                { min: 85, color: C.green },
                { min: 70, max: 85, color: C.yellow },
                { max: 70, color: C.red },
            ],
        },
        series: [
            {
                type: 'line', smooth: 0.2,
                data: DEMO_PIPELINE_PRESSURE.map(p => p.bar),
                symbol: 'none', lineStyle: { width: 2 },
                areaStyle: { color: areaGradient(C.green, 0.15), opacity: 0.6 },
            },
            // Zona de alerta sombreada
            {
                type: 'line',
                data: DEMO_PIPELINE_PRESSURE.map(p => p.km >= 42 && p.km <= 57 ? 105 : null),
                symbol: 'none', lineStyle: { width: 0 },
                areaStyle: { color: 'rgba(239,68,68,0.08)' },
                silent: true,
            },
        ],
        markLine: {
            silent: true, symbol: 'none',
            data: [{ yAxis: 85, lineStyle: { color: C.yellow, type: 'dashed', width: 1 }, label: { formatter: 'Umbral mínimo 85 bar', color: C.yellow, fontSize: 9, position: 'insideEndTop' } }],
        },
    }), []);
    return <ReactECharts option={option} notMerge style={{ height: '100%', minHeight: 180 }} />;
}

// ── KPI card
function KpiCard({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string; sub?: string; color: string }) {
    return (
        <div className="bg-[#111827] rounded-xl border border-[#1F2937] p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}20` }}>
                <Icon size={18} style={{ color }} />
            </div>
            <div className="min-w-0">
                <div className="text-[10px] text-[#6B7280] uppercase tracking-wider truncate">{label}</div>
                <div className="text-xl font-bold font-mono text-white">{value}</div>
                {sub && <div className="text-[10px] text-[#6B7280]">{sub}</div>}
            </div>
        </div>
    );
}

export default function MidstreamDuctos() {
    return (
        <div className="p-5 space-y-5 bg-[#0B0F19] min-h-full">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 text-[10px] font-semibold text-[#10B981] uppercase tracking-[0.2em] mb-1">
                        <GitBranch size={12} /> Módulo 04 · Integridad de Ductos
                    </div>
                    <h1 className="text-xl font-bold text-white">{DEMO_PIPELINE_META.name}</h1>
                    <div className="text-sm text-[#9CA3AF] mt-0.5">
                        {DEMO_PIPELINE_META.inletStation} → {DEMO_PIPELINE_META.outletStation} · {DEMO_PIPELINE_META.totalKm} km · {DEMO_PIPELINE_META.fluid}
                    </div>
                </div>
                <div className="flex items-center gap-2 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-lg px-4 py-2">
                    <span className="w-2 h-2 rounded-full bg-[#EF4444] pulse-dot" />
                    <span className="text-[11px] font-bold text-[#EF4444]">1 ALERTA ACTIVA</span>
                </div>
            </div>

            {/* KPI row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard icon={Radio}       label="Vol. Transportado" value={`${DEMO_PIPELINE_KPIS.volTransportadoMMpcd} MMpcd`}   sub={`Capacidad: ${DEMO_PIPELINE_META.capacityMMpcd} MMpcd`} color={C.blue}   />
                <KpiCard icon={Gauge}       label="Presión Entrada"   value={`${DEMO_PIPELINE_KPIS.presionEntradaBar} bar`}          sub={DEMO_PIPELINE_META.inletStation}                          color={C.green}  />
                <KpiCard icon={TrendingDown}label="Presión Salida"    value={`${DEMO_PIPELINE_KPIS.presionSalidaBar} bar`}           sub="Est. Isla del Carmen"                                     color={C.yellow} />
                <KpiCard icon={Shield}      label="Balance Volumen"   value={`${DEMO_PIPELINE_KPIS.balancePct}%`}                    sub={`Pérdida: ${DEMO_PIPELINE_KPIS.perdidaMMpcd} MMpcd no contabilizados`} color={C.red} />
            </div>

            {/* Main content: map + profile + alert */}
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
                {/* Mapa */}
                <div className="xl:col-span-3 bg-[#111827] rounded-xl border border-[#1F2937] overflow-hidden" style={{ minHeight: 420 }}>
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1F2937]">
                        <span className="text-[11px] font-bold text-[#10B981] uppercase tracking-wider flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] pulse-dot" /> Mapa de Integridad del Ducto
                        </span>
                        <div className="flex items-center gap-3 text-[9px]">
                            {Object.entries(SEG_COLORS).map(([k, c]) => (
                                <span key={k} className="flex items-center gap-1" style={{ color: c }}>
                                    <span className="w-3 h-0.5 rounded-full" style={{ backgroundColor: c }} />
                                    {k === 'normal' ? 'Normal' : k === 'warning' ? 'Aviso' : 'Alerta'}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div style={{ height: 380 }}>
                        <PipelineMap />
                    </div>
                </div>

                {/* Right: pressure profile + IA alert */}
                <div className="xl:col-span-2 flex flex-col gap-4">
                    {/* Pressure profile */}
                    <div className="bg-[#111827] rounded-xl border border-[#1F2937] overflow-hidden flex-1">
                        <div className="px-4 py-2.5 border-b border-[#1F2937]">
                            <div className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider">Perfil de Presión a lo largo del Ducto</div>
                        </div>
                        <div className="p-2" style={{ height: 200 }}>
                            <PressureProfileChart />
                        </div>
                    </div>

                    {/* IA alert */}
                    <div className="bg-[#111827] rounded-xl border-2 border-[#EF4444]/50 overflow-hidden alert-pulse-red">
                        <div className="px-4 py-3 border-b border-[#EF4444]/20" style={{ backgroundColor: 'rgba(239,68,68,0.08)' }}>
                            <div className="flex items-center gap-2">
                                <AlertTriangle size={14} className="text-[#EF4444] flex-shrink-0" style={{ filter: 'drop-shadow(0 0 6px #EF4444)' }} />
                                <span className="text-[11px] font-bold text-[#EF4444] uppercase tracking-wider">Alerta Predictiva · Integridad</span>
                                <span className="ml-auto text-[9px] font-mono text-[#6B7280]">{DEMO_PIPELINE_ALERT.detectedAt}</span>
                            </div>
                            <div className="text-[13px] font-bold text-white mt-1">{DEMO_PIPELINE_ALERT.segmentName}</div>
                        </div>
                        <div className="p-4 space-y-3">
                            <div className="flex items-center gap-4 text-[10px]">
                                <span className="text-[#EF4444] font-bold">Urgencia: {DEMO_PIPELINE_ALERT.urgency}</span>
                                <span className="text-[#9CA3AF]">Confianza: {DEMO_PIPELINE_ALERT.confidence}</span>
                                <span className="text-[#6B7280] ml-auto">Fuente: {DEMO_PIPELINE_ALERT.source}</span>
                            </div>
                            <div>
                                <div className="text-[9px] font-semibold text-[#6B7280] uppercase tracking-wider mb-1">Diagnóstico</div>
                                <p className="text-[11px] text-[#D1D5DB] leading-relaxed">{DEMO_PIPELINE_ALERT.diagnosis}</p>
                            </div>
                            <div>
                                <div className="text-[9px] font-semibold text-[#6B7280] uppercase tracking-wider mb-1">Recomendación</div>
                                <p className="text-[11px] text-[#D1D5DB] leading-relaxed">{DEMO_PIPELINE_ALERT.recommendation}</p>
                            </div>
                            <p className="text-[9px] text-[#4B5563] leading-relaxed italic">⚠ Sugerencia sujeta a validación del ingeniero responsable. Referencia: Art. 78 RISEA / ASEA.</p>
                            <div className="flex gap-2 pt-1">
                                <button className="flex-1 py-1.5 text-[10px] font-bold bg-[#EF4444] text-white rounded-lg hover:bg-[#DC2626] transition-colors">
                                    Acusar Recibo
                                </button>
                                <button className="flex-1 py-1.5 text-[10px] font-bold border border-[#374151] text-[#9CA3AF] rounded-lg hover:text-white hover:border-[#6B7280] transition-colors">
                                    Ver Historial Tramo
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Segment table */}
            <div className="bg-[#111827] rounded-xl border border-[#1F2937] overflow-hidden">
                <div className="px-4 py-3 border-b border-[#1F2937]">
                    <div className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider">Estado por Segmento</div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[#1F2937]">
                                {['Segmento', 'KP Inicio', 'KP Fin', 'Presión Actual', 'Presión Nominal', 'Δ%', 'Estado'].map(h => (
                                    <th key={h} className="text-left text-[9px] font-semibold text-[#6B7280] uppercase tracking-wider px-4 py-2.5">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {DEMO_PIPELINE_SEGMENTS.map((seg) => {
                                const delta = ((seg.pressureBar - seg.nominalBar) / seg.nominalBar * 100).toFixed(1);
                                const color = SEG_COLORS[seg.status];
                                return (
                                    <tr key={seg.id} className="border-b border-[#1F2937]/50 hover:bg-[#1F2937]/30 transition-colors">
                                        <td className="px-4 py-2.5 text-[11px] font-semibold text-white">{seg.name}</td>
                                        <td className="px-4 py-2.5 text-[11px] font-mono text-[#9CA3AF]">KP-{seg.kmStart}</td>
                                        <td className="px-4 py-2.5 text-[11px] font-mono text-[#9CA3AF]">KP-{seg.kmEnd}</td>
                                        <td className="px-4 py-2.5 text-[12px] font-bold font-mono" style={{ color }}>{seg.pressureBar} bar</td>
                                        <td className="px-4 py-2.5 text-[11px] font-mono text-[#9CA3AF]">{seg.nominalBar} bar</td>
                                        <td className="px-4 py-2.5 text-[11px] font-mono" style={{ color: +delta < -5 ? C.red : +delta < 0 ? C.yellow : C.green }}>
                                            {+delta > 0 ? '+' : ''}{delta}%
                                        </td>
                                        <td className="px-4 py-2.5">
                                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${color}20`, color }}>
                                                {seg.status === 'normal' ? 'NORMAL' : seg.status === 'warning' ? 'AVISO' : 'ALERTA'}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
