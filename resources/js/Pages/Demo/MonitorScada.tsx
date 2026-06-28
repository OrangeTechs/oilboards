import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import ReactECharts from 'echarts-for-react';
import { DEMO_THP_SERIES } from '@/data/demoData';
import { tooltipStyle } from '@/lib/chart';

function GaugeChart({ value, min, max, name, unit, warning, danger, color }: {
    value: number; min: number; max: number; name: string; unit: string;
    warning: number; danger: number; color: string;
}) {
    const pct = (value - min) / (max - min);
    const isWarning = value >= warning;
    const isDanger = value >= danger;
    const activeColor = isDanger ? '#EF4444' : isWarning ? '#F59E0B' : '#10B981';

    const option = {
        backgroundColor: 'transparent',
        series: [{
            type: 'gauge',
            startAngle: 200,
            endAngle: -20,
            min,
            max,
            splitNumber: 5,
            radius: '85%',
            pointer: { itemStyle: { color: activeColor }, length: '60%', width: 4 },
            progress: { show: true, width: 8, itemStyle: { color: activeColor } },
            axisLine: { lineStyle: { width: 8, color: [[warning / max, '#374151'], [danger / max, '#374151'], [1, '#374151']] } },
            axisTick: { show: false },
            splitLine: { length: 8, lineStyle: { width: 1, color: '#374151' } },
            axisLabel: { color: '#6B7280', fontSize: 9 },
            detail: {
                valueAnimation: true,
                formatter: `{value} ${unit}`,
                color: activeColor,
                fontSize: 13,
                fontFamily: 'JetBrains Mono, monospace',
                fontWeight: 'bold',
                offsetCenter: [0, '30%'],
            },
            title: { color: '#9CA3AF', fontSize: 10, offsetCenter: [0, '55%'] },
            data: [{ value: Math.round(value * 10) / 10, name }],
        }],
    };

    return <ReactECharts option={option} style={{ height: 160, width: '100%' }} />;
}

export default function MonitorScada() {
    const [thpSeries, setThpSeries] = useState(DEMO_THP_SERIES.map(d => ({ ...d })));
    const [motorData, setMotorData] = useState({ hz: 52, amp: 48.3, vib: 0.87 });
    const tickRef = useRef(0);

    useEffect(() => {
        const timer = setInterval(() => {
            tickRef.current += 1;
            setMotorData(prev => ({
                hz: Math.max(45, Math.min(60, prev.hz + (Math.random() - 0.5) * 0.4)),
                amp: Math.max(44, Math.min(55, prev.amp + (Math.random() - 0.45) * 0.3)),
                vib: Math.max(0.6, Math.min(1.2, prev.vib + (Math.random() - 0.45) * 0.05)),
            }));
            // Advance the THP series by one point
            setThpSeries(prev => {
                const last = prev[prev.length - 1];
                const newThp = Math.max(250, last.thp - (1.5 + Math.random()));
                const hour = (tickRef.current % 24).toString().padStart(2, '0');
                const newPoint = { time: `${hour}:00`, thp: Math.round(newThp), flp: Math.round(newThp * 0.52), threshold: 280 };
                return [...prev.slice(1), newPoint];
            });
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    const chartOption = {
        backgroundColor: 'transparent',
        tooltip: {
            ...tooltipStyle,
            trigger: 'axis',
            formatter: (params: any[]) => {
                return `<div style="font-family: JetBrains Mono, monospace; font-size:11px">
                    <div style="color:#9CA3AF">${params[0].name}</div>
                    ${params.map((p: any) => `<div style="color:${p.color}">${p.seriesName}: ${p.value} psi</div>`).join('')}
                </div>`;
            },
        },
        legend: {
            data: ['THP (psi)', 'FLP (psi)', 'Umbral Alerta'],
            textStyle: { color: '#9CA3AF', fontSize: 10 },
            top: 0,
        },
        grid: { left: '3%', right: '4%', bottom: '3%', top: '14%', containLabel: true },
        xAxis: {
            type: 'category',
            data: thpSeries.map(d => d.time),
            axisLine: { lineStyle: { color: '#374151' } },
            axisLabel: { color: '#6B7280', fontSize: 10, interval: 3 },
            axisTick: { show: false },
        },
        yAxis: {
            type: 'value',
            min: 220,
            axisLine: { lineStyle: { color: '#374151' } },
            axisLabel: { color: '#6B7280', fontSize: 10, formatter: '{value}' },
            splitLine: { lineStyle: { color: '#1F2937' } },
        },
        series: [
            {
                name: 'THP (psi)',
                type: 'line',
                data: thpSeries.map(d => d.thp),
                smooth: true,
                symbol: 'none',
                lineStyle: { color: '#10B981', width: 2 },
                areaStyle: {
                    color: {
                        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [
                            { offset: 0, color: 'rgba(16,185,129,0.2)' },
                            { offset: 1, color: 'rgba(16,185,129,0)' },
                        ],
                    },
                },
                markArea: {
                    itemStyle: { color: 'rgba(239,68,68,0.06)' },
                    data: [[{ yAxis: 220 }, { yAxis: 280 }]],
                },
            },
            {
                name: 'FLP (psi)',
                type: 'line',
                data: thpSeries.map(d => d.flp),
                smooth: true,
                symbol: 'none',
                lineStyle: { color: '#3B82F6', width: 1.5, type: 'dashed' },
            },
            {
                name: 'Umbral Alerta',
                type: 'line',
                data: thpSeries.map(() => 280),
                symbol: 'none',
                lineStyle: { color: '#EF4444', width: 1, type: 'dotted' },
            },
        ],
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-white">Monitor SCADA</h2>
                    <p className="text-sm text-[#9CA3AF]">POZO-102H — Vista telemetría en tiempo real</p>
                </div>
                <div className="flex items-center gap-2 text-xs bg-[#F59E0B]/10 text-[#F59E0B] px-3 py-1.5 rounded-full border border-[#F59E0B]/30 pulse-dot">
                    ⚠️ Alerta activa — Gas-Lock Risk
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Main chart */}
                <div className="lg:col-span-2 glass rounded-2xl p-4">
                    <div className="text-xs text-[#9CA3AF] mb-3 font-semibold">
                        Presión de Cabezal vs. Presión de Línea — POZO-102H (24h)
                    </div>
                    <ReactECharts option={chartOption} style={{ height: 260 }} notMerge={true} />
                </div>

                {/* Alert panel */}
                <motion.div
                    animate={{ boxShadow: ['0 0 0 0px rgba(245,158,11,0.2)', '0 0 0 6px rgba(245,158,11,0)', '0 0 0 0px rgba(245,158,11,0)'] }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                    className="bg-[#111827]/80 border border-[#F59E0B]/50 glow-amber rounded-2xl p-5 space-y-4"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#F59E0B] uppercase tracking-wider">⚠️ Alerta Predictiva Activa</span>
                    </div>
                    <div className="border-t border-[#374151] pt-4 space-y-3 text-xs">
                        <div>
                            <div className="text-[#6B7280] font-semibold uppercase tracking-wider mb-0.5">Pozo</div>
                            <div className="text-white font-bold">POZO-102H · Gas-Lock Risk</div>
                        </div>
                        <div>
                            <div className="text-[#6B7280] font-semibold uppercase tracking-wider mb-0.5">Detectada</div>
                            <div className="text-[#9CA3AF]">08:32 AM · Hace 2h 15min</div>
                        </div>
                        <div className="flex gap-4">
                            <div>
                                <div className="text-[#6B7280] font-semibold uppercase tracking-wider mb-0.5">Urgencia</div>
                                <div className="text-[#EF4444] font-bold">ALTA</div>
                            </div>
                            <div>
                                <div className="text-[#6B7280] font-semibold uppercase tracking-wider mb-0.5">Confianza</div>
                                <div className="text-[#F59E0B] font-bold">Media</div>
                            </div>
                        </div>
                        <div className="border-t border-[#374151] pt-3">
                            <div className="text-[#6B7280] font-semibold uppercase tracking-wider mb-1">Diagnóstico</div>
                            <p className="text-[#D1D5DB] leading-relaxed">
                                La caída escalonada del 12% en THP combinada con picos de vibración
                                del motor en las últimas 6 horas es consistente con segregación
                                de gas en la bomba electrocentrífuga.
                            </p>
                        </div>
                        <div>
                            <div className="text-[#6B7280] font-semibold uppercase tracking-wider mb-1">Recomendación</div>
                            <p className="text-[#D1D5DB] leading-relaxed">
                                Revisar la frecuencia de operación del variador según el rango
                                indicado en el manual del equipo. Monitorear la respuesta de
                                presión de succión en los próximos 30 minutos.
                            </p>
                        </div>
                        <p className="text-[#6B7280] italic text-[10px]">
                            ⚠️ Sugerencia sujeta a validación del ingeniero responsable.
                        </p>
                    </div>
                    <div className="flex gap-2 pt-1">
                        <button className="flex-1 text-xs font-semibold text-white bg-[#10B981] py-2 rounded-lg hover:bg-[#059669] transition-colors">
                            ✓ Acusar recibo
                        </button>
                        <button className="flex-1 text-xs font-semibold text-[#9CA3AF] border border-[#374151] py-2 rounded-lg hover:text-[#EF4444] hover:border-[#EF4444] transition-colors">
                            ✗ Resolver
                        </button>
                    </div>
                </motion.div>
            </div>

            {/* Motor gauges */}
            <div className="glass rounded-2xl p-5">
                <div className="text-xs font-semibold text-[#9CA3AF] mb-4">Parámetros del Motor BEC — POZO-102H</div>
                <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                        <GaugeChart value={motorData.hz} min={30} max={70} name="Frecuencia" unit="Hz" warning={58} danger={65} color="#10B981" />
                    </div>
                    <div className="text-center">
                        <GaugeChart value={motorData.amp} min={30} max={65} name="Corriente" unit="A" warning={50} danger={58} color="#F59E0B" />
                    </div>
                    <div className="text-center">
                        <GaugeChart value={motorData.vib} min={0} max={1.5} name="Vibración" unit="mm/s" warning={0.75} danger={1.0} color="#EF4444" />
                    </div>
                </div>
            </div>
        </div>
    );
}
