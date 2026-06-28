import ReactECharts from 'echarts-for-react';
import { DEMO_CHEMICAL, DEMO_CHEMICAL_TREND } from '@/data/demoData';
import { C, tooltipStyle, axisX, axisY, baseGrid } from '@/lib/chart';

export default function DosificacionQuimica() {
    const trendOption = {
        backgroundColor: 'transparent', grid: baseGrid,
        legend: { data: ['Demulsificante', 'Inhibidor corrosión', 'Inhibidor incrustación'], textStyle: { color: C.muted, fontSize: 10 }, top: 0 },
        tooltip: { ...tooltipStyle, trigger: 'axis' },
        xAxis: axisX({ data: DEMO_CHEMICAL_TREND.map((d) => d.day) }),
        yAxis: axisY({ axisLabel: { color: C.faint, fontSize: 10, formatter: '{value} gal' } }),
        series: [
            { name: 'Demulsificante', type: 'line', data: DEMO_CHEMICAL_TREND.map((d) => d.demul), smooth: true, symbol: 'none', lineStyle: { color: C.green, width: 2 } },
            { name: 'Inhibidor corrosión', type: 'line', data: DEMO_CHEMICAL_TREND.map((d) => d.corr), smooth: true, symbol: 'none', lineStyle: { color: C.blue, width: 2 } },
            { name: 'Inhibidor incrustación', type: 'line', data: DEMO_CHEMICAL_TREND.map((d) => d.incr), smooth: true, symbol: 'none', lineStyle: { color: C.purple, width: 2 } },
        ],
    };

    return (
        <div className="p-6">
            <div className="mb-6">
                <h2 className="text-lg font-bold text-white">Dosificación Química</h2>
                <p className="text-sm text-[#9CA3AF]">Control de inyección de demulsificantes e inhibidores de corrosión/incrustación</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                <div className="glass rounded-2xl p-5">
                    <div className="text-sm font-semibold text-white mb-3">Consumo por químico (7 días)</div>
                    <ReactECharts option={trendOption} style={{ height: 240 }} />
                </div>

                <div className="glass rounded-2xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-[#1F2937] text-sm font-semibold text-white">Dosificación de hoy vs. objetivo</div>
                    <div className="divide-y divide-[#1F2937]/60">
                        {DEMO_CHEMICAL.map((c, i) => {
                            const pct = (c.volumeGal / c.target) * 100;
                            const over = c.volumeGal > c.target * 1.1;
                            return (
                                <div key={i} className="px-5 py-3">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <div>
                                            <span className="text-sm font-semibold text-white">{c.well}</span>
                                            <span className="text-xs text-[#6B7280] ml-2">{c.chemical}</span>
                                        </div>
                                        <span className={`text-sm font-mono font-bold ${over ? 'text-[#F59E0B]' : 'text-white'}`}>
                                            {c.volumeGal} / {c.target} gal
                                        </span>
                                    </div>
                                    <div className="h-1.5 bg-[#0B0F19] rounded-full overflow-hidden">
                                        <div className="h-full rounded-full" style={{ width: `${Math.min(140, pct)}%`, backgroundColor: over ? C.yellow : C.green }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
