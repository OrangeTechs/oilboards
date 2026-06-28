import ReactECharts from 'echarts-for-react';
import { DEMO_FISCALIZATION } from '@/data/demoData';
import { C, tooltipStyle, axisX, axisY, baseGrid } from '@/lib/chart';

export default function BalanceFiscalizacion() {
    const totalProd = DEMO_FISCALIZATION.reduce((s, r) => s + r.producedBbl, 0);
    const totalDel = DEMO_FISCALIZATION.reduce((s, r) => s + r.deliveredBbl, 0);
    const totalDiff = totalDel - totalProd;

    const option = {
        backgroundColor: 'transparent', grid: { ...baseGrid, top: 32 },
        legend: { data: ['Producido', 'Entregado/Fiscalizado'], textStyle: { color: C.muted, fontSize: 11 }, top: 0 },
        tooltip: { ...tooltipStyle, trigger: 'axis' },
        xAxis: axisX({ data: DEMO_FISCALIZATION.map((d) => d.date) }),
        yAxis: axisY({ min: 3000, axisLabel: { color: C.faint, fontSize: 10, formatter: (v: number) => `${(v / 1000).toFixed(1)}k` } }),
        series: [
            { name: 'Producido', type: 'line', data: DEMO_FISCALIZATION.map((d) => d.producedBbl), smooth: true, symbol: 'circle', symbolSize: 5, lineStyle: { color: C.green, width: 2 } },
            { name: 'Entregado/Fiscalizado', type: 'line', data: DEMO_FISCALIZATION.map((d) => d.deliveredBbl), smooth: true, symbol: 'circle', symbolSize: 5, lineStyle: { color: C.blue, width: 2, type: 'dashed' } },
        ],
    };

    return (
        <div className="p-6">
            <div className="mb-6">
                <h2 className="text-lg font-bold text-white">Balance de Fiscalización y Venta</h2>
                <p className="text-sm text-[#9CA3AF]">Conciliación de volumen producido vs. fiscalizado y entregado a Pemex</p>
            </div>

            <div className="grid sm:grid-cols-3 gap-4 mb-6">
                <div className="glass rounded-2xl p-4">
                    <div className="text-xs text-[#9CA3AF]">Producido (7 días)</div>
                    <div className="text-2xl font-bold font-mono text-[#10B981]">{totalProd.toLocaleString()}</div>
                    <div className="text-[10px] text-[#6B7280]">bbl</div>
                </div>
                <div className="glass rounded-2xl p-4">
                    <div className="text-xs text-[#9CA3AF]">Entregado/Fiscalizado</div>
                    <div className="text-2xl font-bold font-mono text-[#3B82F6]">{totalDel.toLocaleString()}</div>
                    <div className="text-[10px] text-[#6B7280]">bbl</div>
                </div>
                <div className="glass rounded-2xl p-4">
                    <div className="text-xs text-[#9CA3AF]">Diferencia acumulada</div>
                    <div className="text-2xl font-bold font-mono text-white">{totalDiff} <span className="text-sm text-[#9CA3AF]">bbl</span></div>
                    <div className="text-[10px] text-[#10B981]">{((Math.abs(totalDiff) / totalProd) * 100).toFixed(2)}% · dentro de tolerancia</div>
                </div>
            </div>

            <div className="glass rounded-2xl p-5 mb-6">
                <div className="text-sm font-semibold text-white mb-3">Producido vs. fiscalizado</div>
                <ReactECharts option={option} style={{ height: 240 }} />
            </div>

            <div className="glass rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-[10px] uppercase tracking-wider text-[#6B7280] border-b border-[#1F2937]">
                            <th className="text-left font-medium px-5 py-2">Fecha</th>
                            <th className="text-right font-medium px-5 py-2">Producido (bbl)</th>
                            <th className="text-right font-medium px-5 py-2">Entregado (bbl)</th>
                            <th className="text-right font-medium px-5 py-2">Diferencia</th>
                        </tr>
                    </thead>
                    <tbody>
                        {DEMO_FISCALIZATION.map((r) => (
                            <tr key={r.date} className="border-b border-[#1F2937]/50 hover:bg-[#1F2937]/30">
                                <td className="px-5 py-3 font-semibold text-white">{r.date}</td>
                                <td className="px-5 py-3 text-right font-mono text-[#9CA3AF]">{r.producedBbl.toLocaleString()}</td>
                                <td className="px-5 py-3 text-right font-mono text-[#9CA3AF]">{r.deliveredBbl.toLocaleString()}</td>
                                <td className={`px-5 py-3 text-right font-mono font-bold ${r.differenceBbl < 0 ? 'text-[#F59E0B]' : 'text-[#10B981]'}`}>{r.differenceBbl > 0 ? '+' : ''}{r.differenceBbl}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
