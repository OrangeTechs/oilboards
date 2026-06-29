import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { DEMO_KPIS, DEMO_MONTHLY_DATA, DEMO_NPT_BY_CATEGORY } from '@/data/demoData';
import { C, tooltipStyle, areaGradient, axisX, axisY, hexA } from '@/lib/chart';
import { BarChart3, TrendingUp, AlertTriangle, CheckCircle, Brain } from 'lucide-react';

// ============================================================================
// PIEZAS DIRECCIÓN — banner + pronóstico de cierre de mes (nuevo) + cerebro.
// Molde ESG/Telemetría: componentes "sin chrome", reutilizables sueltos o en el
// Tablero. KPIs/CNE/NPT/declinación/fiscalización ya existen en SalaMonitoreo.
// ============================================================================

const mes = DEMO_MONTHLY_DATA[DEMO_MONTHLY_DATA.length - 1]; // mes actual (Jun)
const metaMes = mes.meta;                                   // meta comprometida
const realClose = DEMO_KPIS.netOilBblMonth;                 // proyección de cierre
const closeVsMeta = ((realClose - metaMes) / metaMes) * 100;
const DIM = 30;                                             // días del mes
const TODAY = 24;                                           // día representativo (fechas dinámicas: pendiente global)
// Causa #1 de NPT (Pareto) para el cerebro.
const nptTop = [...DEMO_NPT_BY_CATEGORY].sort((a, b) => b.hours - a.hours)[0];

// BANNER · identidad del módulo.
export function DireccionBanner() {
    const cumple = closeVsMeta >= 0;
    return (
        <div className="h-full w-full flex items-center justify-between gap-3 px-1">
            <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: hexA(C.purple, 0.13) }}>
                    <BarChart3 size={15} style={{ color: C.purple }} />
                </div>
                <div className="min-w-0">
                    <div className="text-[12px] font-bold text-white leading-tight truncate">Dirección y Estrategia · Resumen Ejecutivo</div>
                    <div className="text-[9px] text-[#9CA3AF] truncate">
                        Módulo 03 · KPIs del activo · Cumplimiento <span style={{ color: C.green }}>CNE/SENER</span>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 border flex-shrink-0"
                style={{ borderColor: hexA(cumple ? C.green : C.yellow, 0.3), backgroundColor: hexA(cumple ? C.green : C.yellow, 0.1) }}>
                {cumple ? <CheckCircle size={12} style={{ color: C.green }} /> : <AlertTriangle size={12} style={{ color: C.yellow }} />}
                <span className="text-[10px] font-bold whitespace-nowrap" style={{ color: cumple ? C.green : C.yellow }}>
                    Cierre {cumple ? '+' : ''}{closeVsMeta.toFixed(1)}% vs meta
                </span>
            </div>
        </div>
    );
}

// NUEVO · Pronóstico de cierre de mes: acumulado real → proyección vs meta.
export function DireccionPronostico() {
    const option = useMemo(() => {
        const dias = Array.from({ length: DIM }, (_, i) => i + 1);
        const cumMeta = dias.map((d) => Math.round((metaMes * d) / DIM));
        // Real acumulado hasta hoy (ligeramente sobre meta), null después.
        const real = dias.map((d) => d <= TODAY ? Math.round((realClose * d) / DIM * (0.99 + Math.sin(d / 4) * 0.01)) : null);
        // Proyección desde hoy al cierre (línea punteada).
        const proy = dias.map((d) => d >= TODAY ? Math.round((realClose * d) / DIM) : null);
        return {
            backgroundColor: 'transparent',
            grid: { left: 44, right: 12, top: 22, bottom: 18 },
            tooltip: { ...tooltipStyle, trigger: 'axis', valueFormatter: (v: any) => v == null ? '—' : `${(v / 1000).toFixed(1)}k bbl` },
            legend: { data: ['Real', 'Proyección', 'Meta'], top: 0, right: 6, textStyle: { color: C.muted, fontSize: 8 }, itemWidth: 14, itemHeight: 6 },
            xAxis: { ...axisX({ data: dias.map((d) => `${d}`), axisLabel: { color: C.faint, fontSize: 7, interval: 4 } }) },
            yAxis: { ...axisY({ axisLabel: { formatter: (v: number) => `${(v / 1000).toFixed(0)}k`, color: C.faint, fontSize: 8 } }) },
            series: [
                { name: 'Meta', type: 'line', symbol: 'none', data: cumMeta, lineStyle: { color: C.yellow, type: 'dashed', width: 1.5 }, itemStyle: { color: C.yellow } },
                { name: 'Real', type: 'line', symbol: 'none', data: real, smooth: true, lineStyle: { color: C.green, width: 2.5 }, itemStyle: { color: C.green }, areaStyle: { color: areaGradient(C.green, 0.18) } },
                { name: 'Proyección', type: 'line', symbol: 'none', data: proy, smooth: true, lineStyle: { color: C.green, width: 1.5, type: 'dotted' }, itemStyle: { color: C.green } },
            ],
        };
    }, []);
    return <ReactECharts option={option} notMerge style={{ height: '100%', width: '100%' }} />;
}

// CEREBRO · proyección de cierre + causa raíz de la brecha.
function buildDireccionRec() {
    const cumple = closeVsMeta >= 0;
    return {
        severity: cumple ? 'ok' as const : 'warn' as const,
        title: `Proyección de cierre: ${realClose.toLocaleString()} bbl (${cumple ? '+' : ''}${closeVsMeta.toFixed(1)}% vs meta)`,
        body: `Al ritmo actual el activo ${cumple ? 'supera' : 'queda bajo'} la meta de ${metaMes.toLocaleString()} bbl. ` +
            `El NPT por causa "${nptTop.category}" (${nptTop.hours} h) es el mayor detractor de producción del periodo.`,
        action: cumple
            ? `Sostener el plan y atacar el NPT de "${nptTop.category}" para ampliar el margen sobre meta y bajar el costo por barril (hoy $${DEMO_KPIS.costPerBarrelUsd}/bbl).`
            : `Priorizar la reducción del NPT de "${nptTop.category}" para cerrar la brecha contra la meta CNE comprometida.`,
    };
}

export function DireccionRecomendacionIA() {
    const rec = useMemo(buildDireccionRec, []);
    const accent = rec.severity === 'warn' ? C.yellow : C.green;
    return (
        <div className="h-full w-full rounded-lg p-2.5 flex flex-col gap-1.5"
            style={{ background: `linear-gradient(135deg, ${hexA(accent, 0.10)}, ${hexA('#000', 0)})` }}>
            <div className="flex items-center gap-1.5">
                <Brain size={12} style={{ color: accent }} />
                <span className="text-[8px] font-bold uppercase tracking-wider" style={{ color: accent }}>Recomendación IA · ML · Oilboards</span>
            </div>
            <div className="text-[11px] font-bold text-white leading-tight flex items-center gap-1.5">
                <TrendingUp size={12} style={{ color: accent }} /> {rec.title}
            </div>
            <div className="text-[9px] text-[#9CA3AF] leading-relaxed">{rec.body}</div>
            <div className="mt-auto pt-1 flex items-start gap-1.5 border-t border-[#1F2937]">
                <span className="text-[8px] font-bold mt-0.5" style={{ color: accent }}>→</span>
                <span className="text-[9px] font-semibold text-[#D1D5DB] leading-snug">{rec.action}</span>
            </div>
            <p className="text-[7px] text-[#4B5563] leading-tight">Sugerencia sujeta a validación del responsable del activo.</p>
        </div>
    );
}
