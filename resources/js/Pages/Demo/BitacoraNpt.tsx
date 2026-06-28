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

    const pieOption = {
        backgroundColor: 'transparent',
        tooltip: { ...tooltipStyle, trigger: 'item', formatter: '{b}: {c} h ({d}%)' },
        series: [{
            type: 'pie', radius: ['58%', '82%'], center: ['50%', '50%'],
            avoidLabelOverlap: false, itemStyle: { borderColor: C.bg, borderWidth: 3 },
            label: { show: false }, labelLine: { show: false },
            data: DEMO_NPT_BY_CATEGORY.map((c) => ({ value: c.hours, name: c.category, itemStyle: { color: c.color } })),
        }],
    };

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-bold text-white">Bitácora de Paros y NPT</h2>
                    <p className="text-sm text-[#9CA3AF]">Registro append-only · respaldo inmutable para disputas con Pemex</p>
                </div>
                <span className="flex items-center gap-1.5 text-xs glass px-3 py-1.5 rounded-full text-[#10B981]">
                    <Lock size={12} /> Registro inmutable
                </span>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Dona NPT por categoría */}
                <div className="glass rounded-2xl p-5">
                    <div className="text-sm font-semibold text-white mb-2">NPT por causa (mes)</div>
                    <div className="relative">
                        <ReactECharts option={pieOption} style={{ height: 200 }} />
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <div className="text-2xl font-bold font-mono text-white">{totalH.toFixed(1)}</div>
                            <div className="text-[10px] text-[#6B7280]">horas NPT</div>
                        </div>
                    </div>
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
