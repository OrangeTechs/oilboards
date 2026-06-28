import ReactECharts from 'echarts-for-react';
import { FileSpreadsheet } from 'lucide-react';
import { DEMO_MONTHLY_DATA } from '@/data/demoData';
import { C, tooltipStyle, axisX, axisY, baseGrid } from '@/lib/chart';
import { Badge } from '@/Components/ui/primitives';

export default function CumplimientoCne() {
    const option = {
        backgroundColor: 'transparent', grid: { ...baseGrid, top: 36 },
        legend: { data: ['Meta comprometida', 'Producción real'], textStyle: { color: C.muted, fontSize: 11 }, top: 0 },
        tooltip: { ...tooltipStyle, trigger: 'axis' },
        xAxis: axisX({ data: DEMO_MONTHLY_DATA.map((d) => d.month) }),
        yAxis: axisY({ min: 60000, axisLabel: { color: C.faint, fontSize: 10, formatter: (v: number) => `${(v / 1000).toFixed(0)}k` } }),
        series: [
            { name: 'Meta comprometida', type: 'bar', data: DEMO_MONTHLY_DATA.map((d) => d.meta), barMaxWidth: 28, itemStyle: { color: C.blue, borderRadius: [4, 4, 0, 0], opacity: 0.65 } },
            { name: 'Producción real', type: 'bar', data: DEMO_MONTHLY_DATA.map((d) => d.real), barMaxWidth: 28, itemStyle: { color: C.green, borderRadius: [4, 4, 0, 0] } },
            { name: 'Umbral 80%', type: 'line', data: DEMO_MONTHLY_DATA.map((d) => d.meta * 0.8), symbol: 'none', lineStyle: { color: C.red, width: 1.5, type: 'dashed' }, silent: true },
        ],
    };

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-bold text-white">Monitoreo Regulatorio · CNE / SENER</h2>
                    <p className="text-sm text-[#9CA3AF]">Producción real vs. plan comprometido ante el regulador vigente</p>
                </div>
                <button className="flex items-center gap-2 text-xs bg-[#10B981] hover:bg-[#059669] text-white font-semibold px-4 py-2 rounded-xl transition-colors">
                    <FileSpreadsheet size={14} /> Exportar reporte CNE (Excel)
                </button>
            </div>

            <div className="glass rounded-2xl p-5 mb-6">
                <div className="text-sm font-semibold text-white mb-3">Cumplimiento mensual 2026</div>
                <ReactECharts option={option} style={{ height: 280 }} />
            </div>

            <div className="glass rounded-2xl overflow-hidden">
                <div className="px-5 py-3 border-b border-[#1F2937] text-sm font-semibold text-white">Detalle por mes</div>
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-[10px] uppercase tracking-wider text-[#6B7280] border-b border-[#1F2937]">
                            <th className="text-left font-medium px-5 py-2">Mes</th>
                            <th className="text-right font-medium px-5 py-2">Meta (bbl)</th>
                            <th className="text-right font-medium px-5 py-2">Real (bbl)</th>
                            <th className="text-right font-medium px-5 py-2">Cumplimiento</th>
                            <th className="text-right font-medium px-5 py-2">Estatus</th>
                        </tr>
                    </thead>
                    <tbody>
                        {DEMO_MONTHLY_DATA.map((d) => {
                            const pct = (d.real / d.meta) * 100;
                            const status = pct >= 100 ? ['En meta', C.green] : pct >= 80 ? ['Alerta', C.yellow] : ['En riesgo', C.red];
                            return (
                                <tr key={d.month} className="border-b border-[#1F2937]/50 hover:bg-[#1F2937]/30">
                                    <td className="px-5 py-3 font-semibold text-white">{d.month} 2026</td>
                                    <td className="px-5 py-3 text-right font-mono text-[#9CA3AF]">{d.meta.toLocaleString()}</td>
                                    <td className="px-5 py-3 text-right font-mono text-white">{d.real.toLocaleString()}</td>
                                    <td className={`px-5 py-3 text-right font-mono font-bold`} style={{ color: status[1] }}>{pct.toFixed(1)}%</td>
                                    <td className="px-5 py-3 text-right"><Badge color={status[1] as string}>{status[0]}</Badge></td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
