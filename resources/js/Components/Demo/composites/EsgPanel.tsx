import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import {
    DEMO_ESG_KPIS, DEMO_ESG_MONTHLY, DEMO_CO2_EVENTS,
} from '@/data/demoData';
import { C, tooltipStyle, areaGradient, axisX, axisY, hexA } from '@/lib/chart';
import {
    Leaf, Flame, Wind, TrendingUp, Shield, CheckCircle, AlertTriangle, Brain,
} from 'lucide-react';

// ============================================================================
// PIEZAS ESG — fuente única de verdad (datos Y dibujo).
// Cada sub-pieza es un componente presentacional "sin marco" (chrome-less):
//   • Suelta en el catálogo de la Sala  → el Frame le pone título y borde.
//   • Dentro del Tablero ESG compuesto  → se envuelve en una tarjeta diseñada.
// Mismo componente, distinta envoltura. Mueve el "velocímetro" a donde quieras;
// sigue siendo el tablero del auto.
// ============================================================================

const K = DEMO_ESG_KPIS;
const totalCo2 = DEMO_CO2_EVENTS.reduce((s, e) => s + e.co2eTon, 0);

// ── CEREBRO · recomendación derivada de los datos (ML + Claude, simulado) ────
function buildRecommendation() {
    const gap = +(K.targetAprovechamientoPct - K.gasAprovechamientoPct).toFixed(1);
    const worst = [...DEMO_CO2_EVENTS].sort((a, b) => b.co2eTon - a.co2eTon)[0];
    const pctFromWorst = ((worst.co2eTon / totalCo2) * 100).toFixed(0);
    if (gap > 0) {
        return {
            severity: 'warn' as const,
            title: `Aprovechamiento ${gap}% bajo la meta CNE`,
            body: `El venteo asociado a paros explica ${totalCo2.toFixed(1)} ton CO₂e este mes; ` +
                `el evento de ${worst.well} (${worst.cause.toLowerCase()}) concentra el ${pctFromWorst}%. ` +
                `Recortar el NPT de ese equipo cerraría la brecha contra la meta del 98%.`,
            action: `Priorizar ${worst.well} en mantenimiento predictivo (EAM) y documentar el venteo ante ASEA.`,
        };
    }
    return {
        severity: 'ok' as const,
        title: 'Cumple meta CNE de aprovechamiento',
        body: `Aprovechamiento ${K.gasAprovechamientoPct}% sobre la meta del ${K.targetAprovechamientoPct}%. ` +
            `Intensidad ${K.intensidadKgCo2eBbl} kg CO₂e/bbl, dentro del umbral regulatorio.`,
        action: 'Mantener el plan de venteo controlado y el reporte mensual al corriente.',
    };
}

// ── helpers de presentación ─────────────────────────────────────────────────
function Kpi({ icon: Icon, label, value, unit, color, trend }: {
    icon: any; label: string; value: string; unit: string; color: string; trend?: string;
}) {
    return (
        <div className="bg-[#0B0F19] rounded-lg border border-[#1F2937] px-2.5 py-2 flex flex-col gap-1 min-w-0">
            <div className="flex items-center justify-between">
                <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0" style={{ backgroundColor: hexA(color, 0.13) }}>
                    <Icon size={11} style={{ color }} />
                </div>
                {trend && <span className="text-[7px] font-bold px-1 py-0.5 rounded truncate" style={{ backgroundColor: hexA(C.green, 0.13), color: C.green }}>{trend}</span>}
            </div>
            <div className="min-w-0">
                <div className="text-[7px] text-[#6B7280] uppercase tracking-wider truncate">{label}</div>
                <div className="text-base font-bold font-mono text-white leading-none truncate">
                    {value}<span className="text-[8px] font-normal text-[#6B7280] ml-0.5">{unit}</span>
                </div>
            </div>
        </div>
    );
}

function SectionTitle({ icon: Icon, children, right }: { icon: any; children: any; right?: any }) {
    return (
        <div className="flex items-center justify-between mb-1.5">
            <div className="text-[8px] font-bold text-[#9CA3AF] uppercase tracking-wider flex items-center gap-1">
                <Icon size={10} /> {children}
            </div>
            {right}
        </div>
    );
}

// Tarjeta usada SOLO dentro del compuesto para envolver una pieza con título.
function Card({ children, className = '', style }: { children: any; className?: string; style?: any }) {
    return <div className={`bg-[#0B0F19] rounded-lg border border-[#1F2937] p-2 ${className}`} style={style}>{children}</div>;
}

// ============================================================================
// SUB-PIEZAS EXPORTADAS (reutilizables como widgets sueltos)
// ============================================================================

// BANNER · identidad del módulo (1ª pieza del Tablero). El activo lo da el
// encabezado de la Sala; aquí va el módulo + marco regulatorio + estatus.
export function EsgBanner() {
    const cumple = K.gasAprovechamientoPct >= K.targetAprovechamientoPct;
    return (
        <div className="h-full w-full flex items-center justify-between gap-3 px-1">
            <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: hexA(C.green, 0.13) }}>
                    <Leaf size={15} style={{ color: C.green }} />
                </div>
                <div className="min-w-0">
                    <div className="text-[12px] font-bold text-white leading-tight truncate">Emisiones y Huella de Carbono ESG</div>
                    <div className="text-[9px] text-[#9CA3AF] truncate">
                        Módulo 06 · Marco regulatorio <span style={{ color: C.green }}>CNE/SENER</span> + <span style={{ color: C.blue }}>ASEA</span>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 border flex-shrink-0"
                style={{ borderColor: hexA(cumple ? C.green : C.yellow, 0.3), backgroundColor: hexA(cumple ? C.green : C.yellow, 0.1) }}>
                {cumple ? <CheckCircle size={12} style={{ color: C.green }} /> : <AlertTriangle size={12} style={{ color: C.yellow }} />}
                <span className="text-[10px] font-bold whitespace-nowrap" style={{ color: cumple ? C.green : C.yellow }}>
                    {cumple ? 'Cumple Meta CNE' : 'Bajo Meta CNE'}
                </span>
            </div>
        </div>
    );
}

// CAPA 1 · QUÉ — tira de KPIs
export function EsgKpiStrip() {
    return (
        <div className="h-full w-full grid grid-cols-3 sm:grid-cols-5 gap-1.5 content-center">
            <Kpi icon={TrendingUp} label="Gas Aprovechado" value={`${K.gasAprovechamientoPct}`} unit="%" color={C.green} trend={`${(K.gasAprovechamientoPct - K.targetAprovechamientoPct).toFixed(1)}% vs meta`} />
            <Kpi icon={Flame} label="Quemado/Venteado" value={`${K.gasQuemadoMMpcd}`} unit="MMpcd" color={C.red} />
            <Kpi icon={Wind} label="CO₂e Hoy" value={`${K.co2eTodayTon}`} unit="ton" color={C.yellow} />
            <Kpi icon={Leaf} label="CO₂e Mes" value={`${K.co2eMonthTon}`} unit="ton" color={C.blue} />
            <Kpi icon={Wind} label="Intensidad" value={`${K.intensidadKgCo2eBbl}`} unit="kg/bbl" color={C.purple} />
        </div>
    );
}

// CAPA 2 · CÓMO — aprovechamiento vs meta
export function EsgAprovechamientoChart() {
    const option = useMemo(() => ({
        backgroundColor: 'transparent',
        grid: { left: 30, right: 8, top: 8, bottom: 16 },
        tooltip: {
            ...tooltipStyle, trigger: 'axis',
            formatter: (p: any) => {
                const aprov = p.find((x: any) => x.seriesName === 'Real')?.value ?? 0;
                const meta = p.find((x: any) => x.seriesName === 'Meta')?.value ?? 0;
                const diff = (aprov - meta).toFixed(1);
                return `<b>${p[0].name} 2026</b><br/>Real: <b>${aprov}%</b><br/>Meta CNE: ${meta}%<br/>Δ <span style="color:${+diff < 0 ? C.red : C.green}">${diff}%</span>`;
            },
        },
        xAxis: { ...axisX({ data: DEMO_ESG_MONTHLY.map(d => d.month), axisLabel: { color: C.faint, fontSize: 8 } }) },
        yAxis: { ...axisY({ min: 91, max: 100, axisLabel: { formatter: '{value}%', color: C.faint, fontSize: 8 } }) },
        series: [
            { name: 'Meta', type: 'line', symbol: 'none', data: DEMO_ESG_MONTHLY.map(d => d.meta), lineStyle: { color: C.yellow, type: 'dashed', width: 1.5 }, itemStyle: { color: C.yellow } },
            { name: 'Real', type: 'line', smooth: 0.3, symbol: 'circle', symbolSize: 5, data: DEMO_ESG_MONTHLY.map(d => d.aprovechamiento), lineStyle: { color: C.green, width: 2 }, itemStyle: { color: C.green }, areaStyle: { color: areaGradient(C.green, 0.2) } },
        ],
    }), []);
    return <ReactECharts option={option} notMerge style={{ height: '100%', width: '100%' }} />;
}

// CAPA 2 · CÓMO — CO₂e mensual
export function EsgCo2Chart() {
    const option = useMemo(() => ({
        backgroundColor: 'transparent',
        grid: { left: 30, right: 8, top: 12, bottom: 16 },
        tooltip: { ...tooltipStyle, trigger: 'axis', formatter: (p: any) => `<b>${p[0].name} 2026</b><br/>CO₂e: <b>${p[0].value} ton</b>` },
        xAxis: { ...axisX({ data: DEMO_ESG_MONTHLY.map(d => d.month), axisLabel: { color: C.faint, fontSize: 8 } }) },
        yAxis: { ...axisY({ min: 250, axisLabel: { formatter: '{value}t', color: C.faint, fontSize: 8 } }) },
        series: [{ type: 'bar', data: DEMO_ESG_MONTHLY.map(d => d.co2e), barWidth: '50%', itemStyle: { color: C.blue, borderRadius: [3, 3, 0, 0] } }],
    }), []);
    return <ReactECharts option={option} notMerge style={{ height: '100%', width: '100%' }} />;
}

// CAPA 3 · POR QUÉ — tabla causa-raíz NPT → CO₂e
export function EsgCausaRaiz() {
    return (
        <div className="h-full w-full overflow-auto">
            <table className="w-full">
                <thead>
                    <tr className="border-b border-[#1F2937]">
                        {['Pozo', 'Fecha', 'NPT', 'Gas Venteado', 'CO₂e', 'Causa'].map(h => (
                            <th key={h} className="text-left text-[7px] font-semibold text-[#6B7280] uppercase tracking-wider px-1.5 py-1">{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {DEMO_CO2_EVENTS.map((ev, i) => (
                        <tr key={i} className="border-b border-[#1F2937]/50">
                            <td className="px-1.5 py-1 text-[9px] font-bold font-mono text-white">{ev.well}</td>
                            <td className="px-1.5 py-1 text-[8px] text-[#9CA3AF]">{ev.date}</td>
                            <td className="px-1.5 py-1 text-[9px] font-mono text-[#9CA3AF]">{ev.nptHours}h</td>
                            <td className="px-1.5 py-1 text-[9px] font-mono text-[#F59E0B]">{ev.gasVentedMpcd} Mpcd</td>
                            <td className="px-1.5 py-1 text-[9px] font-bold font-mono text-[#EF4444]">{ev.co2eTon} ton</td>
                            <td className="px-1.5 py-1 text-[8px] text-[#9CA3AF] truncate">{ev.cause}</td>
                        </tr>
                    ))}
                    <tr className="bg-[#1F2937]/40">
                        <td colSpan={4} className="px-1.5 py-1 text-[8px] font-bold text-[#6B7280] text-right">TOTAL JUNIO 2026</td>
                        <td className="px-1.5 py-1 text-[10px] font-bold font-mono text-[#EF4444]">{totalCo2.toFixed(1)} ton</td>
                        <td />
                    </tr>
                </tbody>
            </table>
        </div>
    );
}

// CAPA 4 · QUÉ HAGO — cumplimiento regulatorio
export function EsgCompliance() {
    const items = [
        { reg: 'CNE/SENER', item: 'Aprovechamiento de gas ≥ 98%', value: `${K.gasAprovechamientoPct}%`, ok: K.gasAprovechamientoPct >= 98 },
        { reg: 'CNE/SENER', item: 'Reporte mensual de producción', value: 'Enviado · 01 Jun', ok: true },
        { reg: 'ASEA', item: 'Inventario de emisiones (Res. 003)', value: 'Actualizado · Jun', ok: true },
        { reg: 'ASEA', item: 'Registro de eventos de quema/venteo', value: `${DEMO_CO2_EVENTS.length} eventos`, ok: true },
        { reg: 'CNE/SENER', item: 'Intensidad ≤ 8 kg CO₂e/bbl', value: `${K.intensidadKgCo2eBbl}`, ok: true },
    ];
    return (
        <div className="h-full w-full overflow-auto space-y-1">
            {items.map((c, i) => (
                <div key={i} className="flex items-center gap-2 px-1.5 py-1 rounded bg-[#111827] border border-[#1F2937]">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${c.ok ? 'bg-[#10B981]/20' : 'bg-[#EF4444]/20'}`}>
                        {c.ok ? <CheckCircle size={9} className="text-[#10B981]" /> : <AlertTriangle size={9} className="text-[#EF4444]" />}
                    </div>
                    <span className="text-[7px] font-bold px-1 py-0.5 rounded flex-shrink-0" style={{ backgroundColor: c.reg === 'ASEA' ? hexA(C.blue, 0.13) : hexA(C.green, 0.13), color: c.reg === 'ASEA' ? C.blue : C.green }}>{c.reg}</span>
                    <span className="text-[8px] text-[#D1D5DB] truncate flex-1">{c.item}</span>
                    <span className="text-[8px] text-[#6B7280] flex-shrink-0">{c.value}</span>
                </div>
            ))}
        </div>
    );
}

// CAPA 4 · QUÉ HAGO — recomendación IA (el cerebro)
export function EsgRecomendacionIA() {
    const rec = useMemo(buildRecommendation, []);
    const accent = rec.severity === 'warn' ? C.yellow : C.green;
    return (
        <div className="h-full w-full rounded-lg p-2.5 flex flex-col gap-1.5"
            style={{ background: `linear-gradient(135deg, ${hexA(accent, 0.10)}, ${hexA('#000', 0)})` }}>
            <div className="flex items-center gap-1.5">
                <Brain size={12} style={{ color: accent }} />
                <span className="text-[8px] font-bold uppercase tracking-wider" style={{ color: accent }}>Recomendación IA · ML · Oilboards</span>
            </div>
            <div className="text-[11px] font-bold text-white leading-tight">{rec.title}</div>
            <div className="text-[9px] text-[#9CA3AF] leading-relaxed">{rec.body}</div>
            <div className="mt-auto pt-1 flex items-start gap-1.5 border-t border-[#1F2937]">
                <span className="text-[8px] font-bold mt-0.5" style={{ color: accent }}>→</span>
                <span className="text-[9px] font-semibold text-[#D1D5DB] leading-snug">{rec.action}</span>
            </div>
            <p className="text-[7px] text-[#4B5563] leading-tight">Sugerencia sujeta a validación del ingeniero responsable.</p>
        </div>
    );
}

// ============================================================================
// TABLERO ESG COMPUESTO — reúne las MISMAS sub-piezas en un layout diseñado.
// ============================================================================
export default function EsgPanel() {
    return (
        <div className="h-full w-full overflow-auto pr-0.5 flex flex-col gap-2.5 text-white">
            {/* CAPA 1 */}
            <div className="flex-shrink-0"><EsgKpiStrip /></div>

            {/* CAPA 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 flex-shrink-0">
                <Card className="lg:col-span-2" style={{ minHeight: 150 }}>
                    <SectionTitle icon={TrendingUp} right={<span className="text-[7px] text-[#6B7280]"><span className="text-[#10B981]">━</span> Real <span className="text-[#F59E0B]">┄</span> Meta 98%</span>}>
                        Aprovechamiento de Gas vs Meta CNE
                    </SectionTitle>
                    <div style={{ height: 130 }}><EsgAprovechamientoChart /></div>
                </Card>
                <Card style={{ minHeight: 150 }}>
                    <SectionTitle icon={Leaf}>CO₂e Mensual (ton)</SectionTitle>
                    <div style={{ height: 130 }}><EsgCo2Chart /></div>
                </Card>
            </div>

            {/* CAPA 3 */}
            <Card className="flex-shrink-0">
                <SectionTitle icon={Flame} right={<span className="text-[8px] font-bold font-mono text-[#EF4444]">Total: {totalCo2.toFixed(1)} ton</span>}>
                    Conversión Paros → Emisiones CO₂e
                </SectionTitle>
                <EsgCausaRaiz />
            </Card>

            {/* CAPA 4 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 flex-shrink-0">
                <Card>
                    <SectionTitle icon={Shield}>Cumplimiento Regulatorio</SectionTitle>
                    <EsgCompliance />
                </Card>
                <div className="rounded-lg border" style={{ borderColor: hexA(C.yellow, 0.4) }}>
                    <EsgRecomendacionIA />
                </div>
            </div>
        </div>
    );
}
