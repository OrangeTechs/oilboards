import { useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { DEMO_DECLINE, DEMO_WELLS } from '@/data/demoData';
import { C, tooltipStyle, axisX, axisY, areaGradient, baseGrid } from '@/lib/chart';

export default function CurvaDeclinacion() {
    const [scope] = useState('Activo completo');
    const months = DEMO_DECLINE.map((d) => d.month);

    const option = {
        backgroundColor: 'transparent', grid: { ...baseGrid, top: 36 },
        legend: { data: ['Producción histórica', 'Pronóstico (declinación)'], textStyle: { color: C.muted, fontSize: 11 }, top: 0 },
        tooltip: { ...tooltipStyle, trigger: 'axis' },
        dataZoom: [{ type: 'inside' }, { type: 'slider', height: 16, bottom: 0, backgroundColor: C.surface, fillerColor: 'rgba(16,185,129,0.15)', borderColor: C.border, textStyle: { color: C.faint, fontSize: 9 } }],
        xAxis: axisX({ data: months, axisLabel: { color: C.faint, fontSize: 9, interval: 1 } }),
        // Escala SEMI-LOG (tasa en log, tiempo lineal): la convención de análisis
        // de declinación. En semi-log, la declinación exponencial es una recta,
        // y así se estiman qi/Di y se extrapola el pronóstico.
        yAxis: {
            type: 'log', min: 1800, max: 3400,
            name: 'bbl/d · escala semi-log', nameTextStyle: { color: C.faint, fontSize: 10 },
            axisLine: { show: false },
            axisLabel: { color: C.faint, fontSize: 10, formatter: (v: number) => Math.round(v).toLocaleString() },
            splitLine: { lineStyle: { color: C.grid } },
        },
        series: [
            { name: 'Producción histórica', type: 'line', data: DEMO_DECLINE.map((d) => d.real), smooth: false, symbol: 'none', lineStyle: { color: C.green, width: 2.5 }, connectNulls: false },
            { name: 'Pronóstico (declinación)', type: 'line', data: DEMO_DECLINE.map((d) => d.forecast), smooth: false, symbol: 'none', lineStyle: { color: C.yellow, width: 2, type: 'dashed' }, connectNulls: true },
        ],
    };

    const lastReal = DEMO_DECLINE.filter((d) => d.real !== null).slice(-1)[0]?.real ?? 0;
    const lastForecast = DEMO_DECLINE.filter((d) => d.forecast !== null).slice(-1)[0]?.forecast ?? 0;
    const declinePct = (((lastReal - lastForecast) / lastReal) * 100).toFixed(1);

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-bold text-white">Análisis de Yacimientos · Curva de Declinación</h2>
                    <p className="text-sm text-[#9CA3AF]">Histórico + pronóstico · escala semi-log (la declinación exponencial se lee como recta)</p>
                </div>
                <select className="bg-[#0B0F19] border border-[#374151] text-white rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#10B981]">
                    <option>{scope}</option>
                    {DEMO_WELLS.map((w) => <option key={w.id}>{w.name}</option>)}
                </select>
            </div>

            <div className="grid sm:grid-cols-3 gap-4 mb-6">
                <div className="glass rounded-2xl p-4">
                    <div className="text-xs text-[#9CA3AF]">Tasa actual</div>
                    <div className="text-2xl font-bold font-mono text-[#10B981]">{lastReal?.toLocaleString()}</div>
                    <div className="text-[10px] text-[#6B7280]">bbl/d (Jun 26)</div>
                </div>
                <div className="glass rounded-2xl p-4">
                    <div className="text-xs text-[#9CA3AF]">Pronóstico Dic 26</div>
                    <div className="text-2xl font-bold font-mono text-[#F59E0B]">{lastForecast?.toLocaleString()}</div>
                    <div className="text-[10px] text-[#6B7280]">bbl/d (estimado)</div>
                </div>
                <div className="glass rounded-2xl p-4">
                    <div className="text-xs text-[#9CA3AF]">Declinación proyectada (6m)</div>
                    <div className="text-2xl font-bold font-mono text-white">{declinePct}%</div>
                    <div className="text-[10px] text-[#6B7280]">≈ 1.8%/mes</div>
                </div>
            </div>

            <div className="glass rounded-2xl p-5">
                <ReactECharts option={option} style={{ height: 340 }} />
            </div>
        </div>
    );
}
