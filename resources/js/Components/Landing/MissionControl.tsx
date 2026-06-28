import { lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import ReactECharts from 'echarts-for-react';
import { SectionLabel } from '@/Components/ui/primitives';

const Well3D = lazy(() => import('@/Components/Shared/Well3D'));
import { useStream, useJitter } from '@/lib/useLive';
import { C, tooltipStyle, areaGradient, axisX, axisY, baseGrid } from '@/lib/chart';

function PressureChart() {
    const thp = useStream(
        Array.from({ length: 40 }, (_, i) => 342 - Math.max(0, i - 18) * 1.8 + Math.sin(i * 0.7) * 5),
        (last) => Math.max(282, last - 0.8 + (Math.random() - 0.42) * 6),
        1800,
    );
    const flp = thp.map((v) => Math.round(v * 0.52 + 8));
    const option = {
        backgroundColor: 'transparent',
        grid: { ...baseGrid, top: 30 },
        legend: { data: ['THP', 'FLP'], textStyle: { color: C.muted, fontSize: 10 }, top: 0, right: 0 },
        tooltip: { ...tooltipStyle, trigger: 'axis' },
        xAxis: axisX({ show: false, data: thp.map((_, i) => i), boundaryGap: false }),
        yAxis: axisY({ min: 130, max: 360 }),
        series: [
            { name: 'THP', type: 'line', data: thp.map((v) => Math.round(v)), smooth: true, symbol: 'none', lineStyle: { color: C.green, width: 2 }, areaStyle: { color: areaGradient(C.green, 0.22) } },
            { name: 'FLP', type: 'line', data: flp, smooth: true, symbol: 'none', lineStyle: { color: C.blue, width: 1.5, type: 'dashed' } },
            { name: 'Umbral', type: 'line', data: thp.map(() => 280), symbol: 'none', lineStyle: { color: C.red, width: 1, type: 'dotted' }, silent: true },
        ],
    };
    return <ReactECharts option={option} style={{ height: 200 }} notMerge />;
}

function MiniGauge({ value, min, max, label, unit, warn, danger }: { value: number; min: number; max: number; label: string; unit: string; warn: number; danger: number }) {
    const color = value >= danger ? C.red : value >= warn ? C.yellow : C.green;
    const option = {
        backgroundColor: 'transparent',
        series: [{
            type: 'gauge', startAngle: 210, endAngle: -30, min, max, radius: '92%',
            pointer: { itemStyle: { color }, width: 3, length: '55%' },
            progress: { show: true, width: 6, itemStyle: { color } },
            axisLine: { lineStyle: { width: 6, color: [[1, C.grid]] } },
            axisTick: { show: false }, splitLine: { show: false }, axisLabel: { show: false },
            detail: { valueAnimation: true, formatter: `{value} ${unit}`, color, fontSize: 12, fontWeight: 'bold', fontFamily: 'JetBrains Mono, monospace', offsetCenter: [0, '38%'] },
            title: { color: C.muted, fontSize: 9, offsetCenter: [0, '70%'] },
            data: [{ value: Math.round(value * 10) / 10, name: label }],
        }],
    };
    return <ReactECharts option={option} style={{ height: 110 }} notMerge />;
}

export default function MissionControl() {
    const hz = useJitter(52, 0.6, 3000);
    const amp = useJitter(48.3, 0.5, 3000, 0.05);
    const vib = useJitter(0.87, 0.06, 3000, 0.003);

    return (
        <section id="producto" className="relative pt-10 pb-24 overflow-hidden scroll-mt-20">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0d1320] to-transparent" />
            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
                    <SectionLabel>Telemetría en tiempo real</SectionLabel>
                    <h2 className="text-3xl lg:text-5xl font-extrabold text-white mt-4 mb-4 tracking-tight">
                        Cada pozo de tu activo, <span className="text-gradient">vivo y al milisegundo.</span>
                    </h2>
                    <p className="text-[#9CA3AF] text-base max-w-2xl mx-auto">
                        Presiones THP/FLP cruzadas, gauges de motor BEC, y la IA que detecta la falla
                        antes de que pare el pozo. Lo que ven tus ingenieros, sin Excel de por medio.
                    </p>
                </motion.div>

                <div className="grid lg:grid-cols-2 gap-8 items-stretch">
                    {/* 3D */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}
                        className="glass rounded-3xl overflow-hidden relative"
                    >
                        <div className="absolute top-4 left-4 z-10">
                            <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#10B981]">Cabezal del pozo</div>
                            <div className="text-xs font-semibold text-white mt-0.5">POZO-102H</div>
                            <div className="text-[10px] text-[#9CA3AF]">Árbol de válvulas · BEC</div>
                        </div>
                        <div className="absolute top-4 right-4 z-10">
                            <span className="flex items-center gap-1.5 text-[10px] text-[#F59E0B] glass px-2 py-1 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] pulse-dot" /> ALERTA
                            </span>
                        </div>
                        <Suspense fallback={<div className="h-[420px] flex items-center justify-center text-xs text-[#6B7280]">Cargando visualización 3D…</div>}>
                            <Well3D height={420} />
                        </Suspense>
                        <div className="absolute bottom-4 left-4 right-4 grid grid-cols-3 gap-2 z-10">
                            {[
                                { l: 'THP', v: '298 psi' },
                                { l: 'Temp. cabezal', v: '71 °C' },
                                { l: 'Choke', v: '28/64"' },
                            ].map((s) => (
                                <div key={s.l} className="glass rounded-lg px-2 py-1.5 text-center">
                                    <div className="text-[9px] text-[#9CA3AF]">{s.l}</div>
                                    <div className="text-xs font-bold font-mono text-white">{s.v}</div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Charts */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}
                        className="flex flex-col gap-6"
                    >
                        <div className="glass rounded-3xl p-5 flex-1">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-semibold text-white">Presión de cabezal vs. línea</span>
                                <span className="text-[10px] text-[#10B981] flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#10B981] pulse-dot" />stream SCADA</span>
                            </div>
                            <PressureChart />
                        </div>
                        <div className="glass rounded-3xl p-5">
                            <div className="text-sm font-semibold text-white mb-2">Motor BEC — en vivo</div>
                            <div className="grid grid-cols-3 gap-2">
                                <MiniGauge value={hz} min={30} max={70} label="Frecuencia" unit="Hz" warn={58} danger={65} />
                                <MiniGauge value={amp} min={30} max={65} label="Corriente" unit="A" warn={50} danger={58} />
                                <MiniGauge value={vib} min={0} max={1.5} label="Vibración" unit="mm/s" warn={0.75} danger={1.0} />
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
