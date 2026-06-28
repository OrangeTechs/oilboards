import { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { DEMO_WELLS } from '@/data/demoData';
import { C, tooltipStyle, axisX, axisY, areaGradient, baseGrid } from '@/lib/chart';

const becWells = DEMO_WELLS.filter((w) => w.liftType === 'BEC');

function Gauge({ value, min, max, label, unit, warn, danger }: { value: number; min: number; max: number; label: string; unit: string; warn: number; danger: number }) {
    const color = value >= danger ? C.red : value >= warn ? C.yellow : C.green;
    const option = {
        backgroundColor: 'transparent',
        series: [{
            type: 'gauge', startAngle: 210, endAngle: -30, min, max, radius: '90%',
            pointer: { itemStyle: { color }, width: 4, length: '55%' },
            progress: { show: true, width: 8, itemStyle: { color } },
            axisLine: { lineStyle: { width: 8, color: [[warn / max, C.grid], [danger / max, C.grid], [1, C.grid]] } },
            axisTick: { show: false }, splitLine: { length: 8, lineStyle: { width: 1, color: C.border } },
            axisLabel: { color: C.faint, fontSize: 8, distance: 12 },
            detail: { valueAnimation: true, formatter: `{value} ${unit}`, color, fontSize: 14, fontWeight: 'bold', fontFamily: 'JetBrains Mono, monospace', offsetCenter: [0, '36%'] },
            title: { color: C.muted, fontSize: 10, offsetCenter: [0, '62%'] },
            data: [{ value: Math.round(value * 10) / 10, name: label }],
        }],
    };
    return <ReactECharts option={option} style={{ height: 150 }} notMerge />;
}

export default function DiagnosticoMotores() {
    const [sel, setSel] = useState(becWells.find((w) => w.status === 'alert')?.id ?? becWells[0].id);
    const well = becWells.find((w) => w.id === sel)!;
    const [m, setM] = useState({ hz: well.motorHz, amp: well.motorAmp, vib: well.vibrationMms });

    useEffect(() => {
        setM({ hz: well.motorHz, amp: well.motorAmp, vib: well.vibrationMms });
        const t = setInterval(() => {
            setM((prev) => ({
                hz: Math.max(45, Math.min(60, prev.hz + (Math.random() - 0.5) * 0.4)),
                amp: Math.max(40, Math.min(55, prev.amp + (Math.random() - 0.45) * 0.3)),
                vib: Math.max(0.3, Math.min(1.1, prev.vib + (Math.random() - 0.45) * 0.04)),
            }));
        }, 4000);
        return () => clearInterval(t);
    }, [sel]);

    const ampHistory = Array.from({ length: 24 }, (_, i) => Math.round((well.motorAmp + Math.sin(i * 0.6) * 2 + (i > 16 ? (i - 16) * 0.4 : 0)) * 10) / 10);
    const histOption = {
        backgroundColor: 'transparent', grid: baseGrid,
        tooltip: { ...tooltipStyle, trigger: 'axis', formatter: (p: any) => `${p[0].value} A` },
        xAxis: axisX({ data: ampHistory.map((_, i) => `${String(i).padStart(2, '0')}:00`), axisLabel: { color: C.faint, fontSize: 9, interval: 3 } }),
        yAxis: axisY({ min: 38 }),
        series: [{ type: 'line', data: ampHistory, smooth: true, symbol: 'none', lineStyle: { color: C.yellow, width: 2 }, areaStyle: { color: areaGradient(C.yellow, 0.2) } }],
    };

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-bold text-white">Diagnóstico de Motores (BEC)</h2>
                    <p className="text-sm text-[#9CA3AF]">Variables eléctricas de motores de fondo · integridad del equipo</p>
                </div>
                <select value={sel} onChange={(e) => setSel(e.target.value)}
                    className="bg-[#0B0F19] border border-[#374151] text-white rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#10B981]">
                    {becWells.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
            </div>

            <div className="grid lg:grid-cols-3 gap-6 mb-6">
                <div className="glass rounded-2xl p-5"><Gauge value={m.hz} min={30} max={70} label="Frecuencia variador" unit="Hz" warn={58} danger={65} /></div>
                <div className="glass rounded-2xl p-5"><Gauge value={m.amp} min={30} max={65} label="Corriente motor" unit="A" warn={50} danger={58} /></div>
                <div className="glass rounded-2xl p-5"><Gauge value={m.vib} min={0} max={1.5} label="Vibración" unit="mm/s" warn={0.75} danger={1.0} /></div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 glass rounded-2xl p-5">
                    <div className="text-sm font-semibold text-white mb-3">Corriente del motor — últimas 24h</div>
                    <ReactECharts option={histOption} style={{ height: 220 }} />
                </div>
                <div className="glass rounded-2xl p-5">
                    <div className="text-sm font-semibold text-white mb-3">Ficha del equipo</div>
                    <div className="space-y-2 text-sm">
                        {[
                            ['Fabricante', well.equipment?.manufacturer ?? '—'],
                            ['Modelo', well.equipment?.model ?? '—'],
                            ['RPM', well.motorRpm ? `${well.motorRpm}` : '—'],
                            ['Profundidad', `${well.depthM} m`],
                            ['Status', well.status === 'alert' ? 'En alerta' : 'Normal'],
                        ].map(([l, v]) => (
                            <div key={l} className="flex items-center justify-between border-b border-[#1F2937]/60 pb-2">
                                <span className="text-[#9CA3AF]">{l}</span>
                                <span className="font-mono text-white">{v}</span>
                            </div>
                        ))}
                    </div>
                    <p className="mt-3 text-[10px] text-[#6B7280] leading-relaxed">⚠️ El variador se ajusta en Hz; las RPM son resultado. Rangos nominales según placa del motor.</p>
                </div>
            </div>
        </div>
    );
}
