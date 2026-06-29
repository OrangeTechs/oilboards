import ReactECharts from 'echarts-for-react';
import { Lock } from 'lucide-react';
import { DEMO_DOWNTIME, DEMO_NPT_BY_CATEGORY, NptCategory } from '@/data/demoData';
import { C, tooltipStyle } from '@/lib/chart';
import { Badge } from '@/Components/ui/primitives';

const CAT_COLOR: Record<NptCategory, string> = {
    mecanica: C.yellow, electrica: C.red, mantenimiento: C.blue, clima: C.purple, otro: C.faint,
};
const CAT_LABEL: Record<NptCategory, string> = {
    mecanica: 'Mecánica', electrica: 'Eléctrica', mantenimiento: 'Mantenimiento', clima: 'Clima', otro: 'Otro',
};

export default function BitacoraNpt() {
    const totalH = DEMO_NPT_BY_CATEGORY.reduce((s, c) => s + c.hours, 0);

    // PARETO — estándar de análisis de causa raíz de NPT (barras descendentes
    // + curva de % acumulado + guía 80/20). Sustituye al dona.
    const sortedNpt = [...DEMO_NPT_BY_CATEGORY].sort((a, b) => b.hours - a.hours);
    const cumPct = (() => { let cum = 0; return sortedNpt.map((c) => { cum += c.hours; return +((cum / totalH) * 100).toFixed(1); }); })();
    const paretoOption = {
        backgroundColor: 'transparent', grid: { left: 36, right: 40, top: 16, bottom: 28 },
        tooltip: { ...tooltipStyle, trigger: 'axis', formatter: (p: any) => `${p[0].axisValue}<br/>${p[0].value} h · acumulado ${p[1]?.value ?? ''}%` },
        xAxis: { type: 'category', data: sortedNpt.map((c) => c.category), axisLabel: { color: C.faint, fontSize: 9, interval: 0, rotate: 20 }, axisLine: { lineStyle: { color: C.border } }, axisTick: { show: false } },
        yAxis: [
            { type: 'value', name: 'horas', nameTextStyle: { color: C.faint, fontSize: 9 }, axisLabel: { color: C.faint, fontSize: 9 }, splitLine: { lineStyle: { color: C.grid } } },
            { type: 'value', max: 100, name: '% acum', nameTextStyle: { color: C.faint, fontSize: 9 }, axisLabel: { color: C.faint, fontSize: 9, formatter: '{value}%' }, splitLine: { show: false } },
        ],
        series: [
            { type: 'bar', barWidth: '50%', data: sortedNpt.map((c) => ({ value: c.hours, itemStyle: { color: c.color, borderRadius: [4, 4, 0, 0] } })) },
            { type: 'line', yAxisIndex: 1, data: cumPct, smooth: false, symbol: 'circle', symbolSize: 6, lineStyle: { color: '#fff', width: 2 }, itemStyle: { color: '#fff' },
              markLine: { silent: true, symbol: 'none', data: [{ yAxis: 80, lineStyle: { color: 'rgba(255,255,255,0.4)', type: 'dashed' }, label: { formatter: 'Regla 80/20', color: C.faint, fontSize: 9 } }] } },
        ],
    };

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-bold text-white">Bitácora de Paros y NPT</h2>
                    <p className="text-sm text-[#9CA3AF]">Registro append-only · respaldo inmutable para disputas con la empresa estatal</p>
                </div>
                <span className="flex items-center gap-1.5 text-xs glass px-3 py-1.5 rounded-full text-[#10B981]">
                    <Lock size={12} /> Registro inmutable
                </span>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Dona NPT por categoría */}
                <div className="glass rounded-2xl p-5">
                    <div className="flex items-baseline justify-between mb-2">
                        <span className="text-sm font-semibold text-white">Pareto de NPT por causa (mes)</span>
                        <span className="text-[11px] font-mono text-[#9CA3AF]">{totalH.toFixed(1)} h totales</span>
                    </div>
                    <ReactECharts option={paretoOption} style={{ height: 220 }} />
                    <div className="space-y-1.5 mt-3">
                        {DEMO_NPT_BY_CATEGORY.map((c) => (
                            <div key={c.category} className="flex items-center justify-between text-xs">
                                <span className="flex items-center gap-2 text-[#9CA3AF]">
                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} /> {c.category}
                                </span>
                                <span className="font-mono text-white">{c.hours} h</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tabla de paros */}
                <div className="lg:col-span-2 glass rounded-2xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-[#1F2937] flex items-center justify-between">
                        <span className="text-sm font-semibold text-white">Eventos de paro registrados</span>
                        <span className="text-xs text-[#6B7280]">{DEMO_DOWNTIME.length} eventos</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-[10px] uppercase tracking-wider text-[#6B7280] border-b border-[#1F2937]">
                                    <th className="text-left font-medium px-4 py-2">Pozo</th>
                                    <th className="text-left font-medium px-4 py-2">Inicio</th>
                                    <th className="text-left font-medium px-4 py-2">Fin</th>
                                    <th className="text-left font-medium px-4 py-2">Duración</th>
                                    <th className="text-left font-medium px-4 py-2">Causa</th>
                                </tr>
                            </thead>
                            <tbody>
                                {DEMO_DOWNTIME.map((e) => (
                                    <tr key={e.id} className="border-b border-[#1F2937]/50 hover:bg-[#1F2937]/30">
                                        <td className="px-4 py-3 font-semibold text-white whitespace-nowrap">{e.well}</td>
                                        <td className="px-4 py-3 font-mono text-xs text-[#9CA3AF] whitespace-nowrap">{e.startedAt}</td>
                                        <td className="px-4 py-3 font-mono text-xs text-[#9CA3AF] whitespace-nowrap">{e.endedAt ?? <span className="text-[#EF4444]">En curso</span>}</td>
                                        <td className="px-4 py-3 font-mono text-xs text-white whitespace-nowrap">{Math.floor(e.durationMin / 60)}h {e.durationMin % 60}m</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <Badge color={CAT_COLOR[e.category]}>{CAT_LABEL[e.category]}</Badge>
                                            </div>
                                            <div className="text-xs text-[#9CA3AF] mt-1 max-w-md">{e.rootCause}</div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
