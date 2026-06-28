import ReactECharts from 'echarts-for-react';
import { ShieldAlert, Fuel } from 'lucide-react';
import { DEMO_HSE, DEMO_DIESEL } from '@/data/demoData';
import { C, tooltipStyle, axisX, axisY, areaGradient, baseGrid } from '@/lib/chart';
import { Badge } from '@/Components/ui/primitives';

const SEV_COLOR: Record<string, string> = { bajo: C.green, medio: C.yellow, alto: C.red };

export default function InventarioHse() {
    const dieselOption = {
        backgroundColor: 'transparent',
        grid: baseGrid,
        tooltip: { ...tooltipStyle, trigger: 'axis', formatter: (p: any) => `${p[0].name}: ${p[0].value.toLocaleString()} L` },
        xAxis: axisX({ data: DEMO_DIESEL.map((d) => d.day) }),
        yAxis: axisY({ axisLabel: { color: C.faint, fontSize: 10, formatter: (v: number) => `${v / 1000}k` } }),
        series: [{
            type: 'bar', data: DEMO_DIESEL.map((d) => d.liters), barMaxWidth: 26,
            itemStyle: { color: areaGradient(C.blue, 1), borderRadius: [4, 4, 0, 0] },
        }],
    };

    const totalDiesel = DEMO_DIESEL.reduce((s, d) => s + d.liters, 0);

    return (
        <div className="p-6">
            <div className="mb-6">
                <h2 className="text-lg font-bold text-white">Inventario Operativo · HSE y Energía</h2>
                <p className="text-sm text-[#9CA3AF]">Consumo de diésel de generadores e incidentes de seguridad y ambiente</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Diésel */}
                <div className="glass rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Fuel size={15} className="text-[#3B82F6]" />
                            <span className="text-sm font-semibold text-white">Consumo de diésel (7 días)</span>
                        </div>
                        <div className="text-right">
                            <div className="text-lg font-bold font-mono text-white">{totalDiesel.toLocaleString()} L</div>
                            <div className="text-[10px] text-[#6B7280]">acumulado semana</div>
                        </div>
                    </div>
                    <ReactECharts option={dieselOption} style={{ height: 220 }} />
                </div>

                {/* HSE incidentes */}
                <div className="glass rounded-2xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-[#1F2937] flex items-center gap-2">
                        <ShieldAlert size={15} className="text-[#F59E0B]" />
                        <span className="text-sm font-semibold text-white">Incidentes HSE del período</span>
                    </div>
                    <div className="divide-y divide-[#1F2937]/60">
                        {DEMO_HSE.map((inc) => (
                            <div key={inc.id} className="px-5 py-4">
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold text-white">{inc.well}</span>
                                        <Badge color={SEV_COLOR[inc.severity]}>{inc.severity}</Badge>
                                    </div>
                                    <span className="text-xs text-[#6B7280] font-mono">{inc.occurredAt}</span>
                                </div>
                                <div className="text-xs text-[#3B82F6] mb-1">{inc.type}</div>
                                <p className="text-sm text-[#D1D5DB]">{inc.description}</p>
                                <div className="text-[10px] text-[#6B7280] mt-1">Reportado por {inc.reportedBy}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
