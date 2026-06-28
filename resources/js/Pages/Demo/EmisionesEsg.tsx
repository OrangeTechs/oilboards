import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import {
    DEMO_ESG_KPIS, DEMO_ESG_MONTHLY, DEMO_CO2_EVENTS,
} from '@/data/demoData';
import { C, tooltipStyle, areaGradient, axisX, axisY } from '@/lib/chart';
import { Leaf, Flame, Wind, TrendingUp, Shield, FileText, CheckCircle, AlertTriangle } from 'lucide-react';

// ── KPI card
function EsgKpiCard({
    icon: Icon, label, value, unit, sub, color, trend,
}: { icon: any; label: string; value: string; unit: string; sub?: string; color: string; trend?: string }) {
    return (
        <div className="bg-[#111827] rounded-xl border border-[#1F2937] p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
                    <Icon size={15} style={{ color }} />
                </div>
                {trend && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: `${C.green}20`, color: C.green }}>{trend}</span>
                )}
            </div>
            <div>
                <div className="text-[10px] text-[#6B7280] uppercase tracking-wider">{label}</div>
                <div className="text-2xl font-bold font-mono text-white leading-tight">{value}<span className="text-sm font-normal text-[#6B7280] ml-1">{unit}</span></div>
                {sub && <div className="text-[9px] text-[#6B7280] mt-0.5">{sub}</div>}
            </div>
        </div>
    );
}

// ── Aprovechamiento vs meta chart
function AprovechamientoChart() {
    const option = useMemo(() => ({
        backgroundColor: 'transparent',
        grid: { left: 40, right: 16, top: 24, bottom: 28 },
        tooltip: {
            ...tooltipStyle, trigger: 'axis',
            formatter: (p: any) => {
                const month = p[0].name;
                const aprov = p.find((x: any) => x.seriesName === 'Real')?.value ?? 0;
                const meta  = p.find((x: any) => x.seriesName === 'Meta CNE')?.value ?? 0;
                const diff  = (aprov - meta).toFixed(1);
                return `<b>${month} 2026</b><br/>Aprovechamiento real: <b>${aprov}%</b><br/>Meta CNE: ${meta}%<br/>Diferencia: <span style="color:${+diff < 0 ? C.red : C.green}">${diff}%</span>`;
            },
        },
        xAxis: { ...axisX({ data: DEMO_ESG_MONTHLY.map(d => d.month) }) },
        yAxis: { ...axisY({ min: 91, max: 100, axisLabel: { formatter: '{value}%', color: C.faint, fontSize: 9 } }) },
        series: [
            {
                name: 'Meta CNE', type: 'line', symbol: 'none',
                data: DEMO_ESG_MONTHLY.map(d => d.meta),
                lineStyle: { color: C.yellow, type: 'dashed', width: 1.5 },
                itemStyle: { color: C.yellow },
            },
            {
                name: 'Real', type: 'line', smooth: 0.3, symbol: 'circle', symbolSize: 6,
                data: DEMO_ESG_MONTHLY.map(d => d.aprovechamiento),
                lineStyle: { color: C.green, width: 2 },
                itemStyle: { color: C.green },
                areaStyle: { color: areaGradient(C.green, 0.2) },
            },
        ],
        legend: {
            data: ['Real', 'Meta CNE'], top: 2, right: 8,
            textStyle: { color: C.muted, fontSize: 9 },
            itemWidth: 16, itemHeight: 8,
        },
    }), []);
    return <ReactECharts option={option} notMerge style={{ height: '100%', minHeight: 220 }} />;
}

// ── CO₂e por mes chart
function Co2Chart() {
    const option = useMemo(() => ({
        backgroundColor: 'transparent',
        grid: { left: 40, right: 16, top: 24, bottom: 28 },
        tooltip: { ...tooltipStyle, trigger: 'axis', formatter: (p: any) => `<b>${p[0].name} 2026</b><br/>CO₂e: <b>${p[0].value} ton</b>` },
        xAxis: { ...axisX({ data: DEMO_ESG_MONTHLY.map(d => d.month) }) },
        yAxis: { ...axisY({ min: 250, axisLabel: { formatter: '{value} t', color: C.faint, fontSize: 9 } }) },
        series: [{
            type: 'bar', data: DEMO_ESG_MONTHLY.map(d => d.co2e),
            barWidth: '50%', itemStyle: { color: C.blue, borderRadius: [4, 4, 0, 0] },
            label: { show: true, position: 'top', color: C.muted, fontSize: 8, formatter: '{c}t' },
        }],
    }), []);
    return <ReactECharts option={option} notMerge style={{ height: '100%', minHeight: 200 }} />;
}

export default function EmisionesEsg() {
    const totalCo2 = DEMO_CO2_EVENTS.reduce((s, e) => s + e.co2eTon, 0);

    return (
        <div className="p-5 space-y-5 bg-[#0B0F19] min-h-full">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 text-[10px] font-semibold text-[#10B981] uppercase tracking-[0.2em] mb-1">
                        <Leaf size={12} /> Módulo 06 · Emisiones y Huella de Carbono ESG
                    </div>
                    <h1 className="text-xl font-bold text-white">Monitoreo de Emisiones y Sustentabilidad</h1>
                    <p className="text-sm text-[#9CA3AF] mt-0.5">
                        Marco regulatorio: <span className="text-[#10B981]">CNE/SENER</span> + <span className="text-[#3B82F6]">ASEA</span> · Activo Litoral Tabasco · Jun 2026
                    </p>
                </div>
                <div className={`flex items-center gap-2 rounded-lg px-4 py-2 border ${DEMO_ESG_KPIS.gasAprovechamientoPct >= DEMO_ESG_KPIS.targetAprovechamientoPct ? 'bg-[#10B981]/10 border-[#10B981]/30' : 'bg-[#F59E0B]/10 border-[#F59E0B]/30'}`}>
                    {DEMO_ESG_KPIS.gasAprovechamientoPct >= DEMO_ESG_KPIS.targetAprovechamientoPct
                        ? <CheckCircle size={13} className="text-[#10B981]" />
                        : <AlertTriangle size={13} className="text-[#F59E0B]" />}
                    <span className={`text-[11px] font-bold ${DEMO_ESG_KPIS.gasAprovechamientoPct >= DEMO_ESG_KPIS.targetAprovechamientoPct ? 'text-[#10B981]' : 'text-[#F59E0B]'}`}>
                        {DEMO_ESG_KPIS.gasAprovechamientoPct >= DEMO_ESG_KPIS.targetAprovechamientoPct ? 'Cumple Meta CNE' : 'Bajo Meta CNE'}
                    </span>
                </div>
            </div>

            {/* KPI row */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <EsgKpiCard icon={TrendingUp} label="Gas Aprovechado" value={`${DEMO_ESG_KPIS.gasAprovechamientoPct}`} unit="%" sub={`Meta CNE: ${DEMO_ESG_KPIS.targetAprovechamientoPct}%`} color={C.green} trend={`${(DEMO_ESG_KPIS.gasAprovechamientoPct - DEMO_ESG_KPIS.targetAprovechamientoPct).toFixed(1)}% vs meta`} />
                <EsgKpiCard icon={Flame}      label="Gas Quemado/Venteado" value={`${DEMO_ESG_KPIS.gasQuemadoMMpcd}`} unit="MMpcd" sub="Quema en antorcha" color={C.red} />
                <EsgKpiCard icon={Wind}       label="CO₂e Hoy" value={`${DEMO_ESG_KPIS.co2eTodayTon}`} unit="ton" sub="Emisiones del día" color={C.yellow} />
                <EsgKpiCard icon={Leaf}       label="CO₂e Mes" value={`${DEMO_ESG_KPIS.co2eMonthTon}`} unit="ton" sub="Acumulado jun 2026" color={C.blue} />
                <EsgKpiCard icon={Wind}       label="Intensidad" value={`${DEMO_ESG_KPIS.intensidadKgCo2eBbl}`} unit="kg/bbl" sub="CO₂e por barril" color={C.purple} />
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                {/* Aprovechamiento chart */}
                <div className="xl:col-span-2 bg-[#111827] rounded-xl border border-[#1F2937] overflow-hidden">
                    <div className="px-4 py-3 border-b border-[#1F2937] flex items-center justify-between">
                        <div className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider">
                            Aprovechamiento de Gas vs Meta CNE — Enero a Junio 2026
                        </div>
                        <div className="flex items-center gap-2 text-[9px] text-[#6B7280]">
                            <span className="w-3 h-0.5 bg-[#10B981] inline-block rounded" /> Real
                            <span className="w-3 h-0.5 bg-[#F59E0B] inline-block rounded border-dashed" /> Meta 98%
                        </div>
                    </div>
                    <div className="p-3" style={{ height: 250 }}>
                        <AprovechamientoChart />
                    </div>
                </div>

                {/* CO₂e chart */}
                <div className="bg-[#111827] rounded-xl border border-[#1F2937] overflow-hidden">
                    <div className="px-4 py-3 border-b border-[#1F2937]">
                        <div className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider">CO₂e Mensual (ton)</div>
                    </div>
                    <div className="p-3" style={{ height: 250 }}>
                        <Co2Chart />
                    </div>
                </div>
            </div>

            {/* Bottom row: CO₂ by downtime + compliance panel */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                {/* Conversión Paro → CO₂ */}
                <div className="bg-[#111827] rounded-xl border border-[#1F2937] overflow-hidden">
                    <div className="px-4 py-3 border-b border-[#1F2937] flex items-center justify-between">
                        <div className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider flex items-center gap-2">
                            <Flame size={12} /> Conversión Paros → Emisiones CO₂e (Jun 2026)
                        </div>
                        <span className="text-[10px] font-bold font-mono text-[#EF4444]">Total: {totalCo2.toFixed(1)} ton</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-[#1F2937]">
                                    {['Pozo', 'Fecha', 'NPT', 'Gas Venteado', 'CO₂e', 'Causa'].map(h => (
                                        <th key={h} className="text-left text-[9px] font-semibold text-[#6B7280] uppercase tracking-wider px-4 py-2.5">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {DEMO_CO2_EVENTS.map((ev, i) => (
                                    <tr key={i} className="border-b border-[#1F2937]/50 hover:bg-[#1F2937]/30 transition-colors">
                                        <td className="px-4 py-2.5 text-[11px] font-bold font-mono text-white">{ev.well}</td>
                                        <td className="px-4 py-2.5 text-[10px] text-[#9CA3AF]">{ev.date}</td>
                                        <td className="px-4 py-2.5 text-[11px] font-mono text-[#9CA3AF]">{ev.nptHours}h</td>
                                        <td className="px-4 py-2.5 text-[11px] font-mono text-[#F59E0B]">{ev.gasVentedMpcd} Mpcd</td>
                                        <td className="px-4 py-2.5 text-[12px] font-bold font-mono text-[#EF4444]">{ev.co2eTon} ton</td>
                                        <td className="px-4 py-2.5 text-[10px] text-[#9CA3AF]">{ev.cause}</td>
                                    </tr>
                                ))}
                                <tr className="bg-[#1F2937]/50">
                                    <td colSpan={4} className="px-4 py-2.5 text-[10px] font-bold text-[#6B7280] text-right">TOTAL JUNIO 2026</td>
                                    <td className="px-4 py-2.5 text-[13px] font-bold font-mono text-[#EF4444]">{totalCo2.toFixed(1)} ton</td>
                                    <td />
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Panel de auditoría */}
                <div className="bg-[#111827] rounded-xl border border-[#1F2937] overflow-hidden">
                    <div className="px-4 py-3 border-b border-[#1F2937] flex items-center gap-2">
                        <Shield size={12} className="text-[#10B981]" />
                        <div className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider">Panel de Cumplimiento Regulatorio</div>
                    </div>
                    <div className="p-4 space-y-3">
                        {/* Compliance items */}
                        {[
                            { reg: 'CNE/SENER', item: 'Aprovechamiento de gas ≥ 98%', value: `${DEMO_ESG_KPIS.gasAprovechamientoPct}%`, ok: DEMO_ESG_KPIS.gasAprovechamientoPct >= 98 },
                            { reg: 'CNE/SENER', item: 'Reporte mensual de producción', value: 'Enviado · 01 Jun', ok: true },
                            { reg: 'ASEA',      item: 'Inventario de emisiones (Res. 003)', value: 'Actualizado · Jun 2026', ok: true },
                            { reg: 'ASEA',      item: 'Registro de eventos de quema/venteo', value: `${DEMO_CO2_EVENTS.length} eventos documentados`, ok: true },
                            { reg: 'CNE/SENER', item: 'Intensidad de emisiones ≤ 8 kg CO₂e/bbl', value: `${DEMO_ESG_KPIS.intensidadKgCo2eBbl} kg/bbl`, ok: true },
                            { reg: 'ASEA',      item: 'Plan de Gestión de Integridad vigente', value: 'Vigente · Feb 2027', ok: true },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-[#0B0F19] border border-[#1F2937]">
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${item.ok ? 'bg-[#10B981]/20' : 'bg-[#EF4444]/20'}`}>
                                    {item.ok
                                        ? <CheckCircle size={12} className="text-[#10B981]" />
                                        : <AlertTriangle size={12} className="text-[#EF4444]" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[8px] font-bold px-1 py-0.5 rounded" style={{ backgroundColor: item.reg === 'ASEA' ? `${C.blue}20` : `${C.green}20`, color: item.reg === 'ASEA' ? C.blue : C.green }}>
                                            {item.reg}
                                        </span>
                                        <span className="text-[10px] text-[#D1D5DB] truncate">{item.item}</span>
                                    </div>
                                    <div className="text-[9px] text-[#6B7280] mt-0.5">{item.value}</div>
                                </div>
                            </div>
                        ))}

                        <button className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 text-[11px] font-bold text-[#10B981] border border-[#10B981]/40 rounded-lg hover:bg-[#10B981]/10 transition-colors">
                            <FileText size={13} /> Exportar Reporte ESG · Jun 2026
                        </button>
                        <p className="text-[9px] text-[#4B5563] text-center leading-relaxed">
                            Formato compatible con reportes CNE/SENER y ASEA. Incluye factores de conversión CO₂e según IPCC AR6.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
