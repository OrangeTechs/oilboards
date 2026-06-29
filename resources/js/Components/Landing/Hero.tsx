import { lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck, Activity, Droplet, AlertTriangle } from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import { SectionLabel } from '@/Components/ui/primitives';

const FieldMap = lazy(() => import('@/Components/Shared/FieldMap'));
import { useCounter, useStream } from '@/lib/useLive';
import { C, tooltipStyle, areaGradient } from '@/lib/chart';

const headline = ['Producción,', 'pozos', 'y', 'operaciones', '—', 'todo', 'en', 'un', 'centro', 'de', 'control.'];

function LiveThp() {
    const data = useStream(
        Array.from({ length: 30 }, (_, i) => 342 - Math.max(0, i - 12) * 2 + Math.sin(i) * 4),
        (last) => Math.max(280, last - 1 + (Math.random() - 0.4) * 5),
        2000,
    );
    const option = {
        backgroundColor: 'transparent',
        grid: { left: 0, right: 0, top: 6, bottom: 0 },
        xAxis: { type: 'category', show: false, data: data.map((_, i) => i), boundaryGap: false },
        yAxis: { type: 'value', show: false, min: 270, max: 360 },
        tooltip: { ...tooltipStyle, trigger: 'axis', formatter: (p: any) => `${Math.round(p[0].value)} psi` },
        series: [{
            type: 'line', data, smooth: true, symbol: 'none',
            lineStyle: { color: C.green, width: 2 },
            areaStyle: { color: areaGradient(C.green, 0.3) },
        }],
    };
    return <ReactECharts option={option} style={{ height: 56 }} notMerge />;
}

export default function Hero() {
    const produced = useCounter(3248, 2, 4000);

    return (
        <section className="relative overflow-hidden pt-[124px] pb-[72px] lg:pt-[142px] lg:pb-[88px]">
            <div className="absolute inset-0 tech-grid opacity-60" />
            <div className="absolute top-0 left-1/4 w-[700px] h-[500px] bg-[#10B981]/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-[600px] h-[400px] bg-[#3B82F6]/8 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center w-full relative z-10">
                {/* IZQUIERDA — copy */}
                <div>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-6">
                        <SectionLabel>Plataforma Operativa · México</SectionLabel>
                    </motion.div>

                    <h1 className="text-4xl lg:text-5xl xl:text-[3.4rem] font-extrabold leading-[1.05] mb-6 tracking-tight">
                        {headline.map((w, i) => (
                            <motion.span
                                key={i}
                                initial={{ opacity: 0, y: 18 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: 0.1 + i * 0.05 }}
                                className={`inline-block mr-[0.22em] ${i >= 8 ? 'text-gradient' : 'text-white'}`}
                            >
                                {w}
                            </motion.span>
                        ))}
                    </h1>

                    <motion.p
                        initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.75 }}
                        className="text-[#9CA3AF] text-lg leading-relaxed mb-8 max-w-xl"
                    >
                        Oilboards centraliza el reporte diario, la telemetría SCADA en tiempo real,
                        la IA predictiva y el cumplimiento CNE/SENER de todo tu activo — desde el
                        celular del operador en campo hasta tu sala de monitoreo.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.95 }}
                        className="flex flex-col sm:flex-row gap-4 items-start"
                    >
                        <a href="#cta" className="inline-flex items-center gap-2 bg-[#10B981] hover:bg-[#059669] text-white font-bold px-7 py-4 rounded-xl text-base transition-all hover:scale-105 glow-green">
                            Solicitar demo de 14 días <ArrowRight size={18} />
                        </a>
                        <a href="/demo" className="inline-flex items-center gap-2 glass hover:border-[#10B981] text-white font-semibold px-7 py-4 rounded-xl text-base transition-all">
                            Entrar a la demo en vivo →
                        </a>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 1.15 }}
                        className="mt-5 flex items-center gap-2 text-xs text-[#6B7280]"
                    >
                        <ShieldCheck size={14} className="text-[#10B981]" />
                        <span>Sin costos por usuario · Marco regulatorio CNE/SENER y la empresa estatal</span>
                    </motion.div>
                </div>

                {/* DERECHA — command deck en vivo */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="relative"
                >
                    <div className="glass rounded-3xl overflow-hidden shadow-2xl glow-green">
                        {/* barra superior */}
                        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1F2937]">
                            <div className="flex items-center gap-2">
                                <span className="text-sm">🛢️</span>
                                <span className="text-xs font-semibold text-white">Activo Litoral Tabasco</span>
                            </div>
                            <span className="flex items-center gap-1.5 text-[10px] text-[#10B981] font-semibold">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] pulse-dot" /> EN VIVO · Sonda de Campeche
                            </span>
                        </div>

                        {/* mapa en vivo */}
                        <div className="relative">
                            <Suspense fallback={<div className="h-[250px] bg-[#0B0F19] animate-pulse" />}>
                                <FieldMap height={250} interactive={false} />
                            </Suspense>
                            {/* overlay KPIs */}
                            <div className="absolute top-3 left-3 flex flex-col gap-2">
                                <div className="glass rounded-lg px-3 py-1.5">
                                    <div className="text-[9px] text-[#9CA3AF]">Producción hoy</div>
                                    <div className="text-sm font-bold font-mono text-[#10B981]">{produced.toLocaleString()} bbl</div>
                                </div>
                            </div>
                            <div className="absolute top-3 right-3 flex gap-2">
                                <div className="glass rounded-lg px-2.5 py-1.5 text-center">
                                    <div className="text-[9px] text-[#9CA3AF]">Activos</div>
                                    <div className="text-sm font-bold font-mono text-white">6/8</div>
                                </div>
                                <div className="glass rounded-lg px-2.5 py-1.5 text-center">
                                    <div className="text-[9px] text-[#9CA3AF]">Alertas</div>
                                    <div className="text-sm font-bold font-mono text-[#F59E0B]">2</div>
                                </div>
                            </div>
                        </div>

                        {/* telemetría en vivo */}
                        <div className="p-4 grid grid-cols-3 gap-3 border-t border-[#1F2937]">
                            <div className="col-span-2">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] text-[#9CA3AF]">THP POZO-102H</span>
                                    <span className="text-[10px] text-[#F59E0B] font-mono">cayendo ↓</span>
                                </div>
                                <LiveThp />
                            </div>
                            <div className="flex flex-col justify-center gap-2">
                                <div className="flex items-center gap-1.5">
                                    <Activity size={12} className="text-[#10B981]" />
                                    <span className="text-[10px] text-[#9CA3AF]">Uptime <span className="text-white font-mono font-bold">87.5%</span></span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Droplet size={12} className="text-[#3B82F6]" />
                                    <span className="text-[10px] text-[#9CA3AF]">BSW <span className="text-white font-mono font-bold">18.2%</span></span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* alerta flotante */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.4 }}
                        className="absolute -bottom-5 -left-6 glass rounded-xl p-3 max-w-[230px] glow-amber border-[#F59E0B]/50"
                    >
                        <div className="flex items-start gap-2">
                            <AlertTriangle size={16} className="text-[#F59E0B] mt-0.5 flex-shrink-0" />
                            <div>
                                <div className="text-[10px] font-bold text-[#F59E0B]">ALERTA IA · POZO-102H</div>
                                <div className="text-[9px] text-[#9CA3AF] mt-0.5">Riesgo de Gas-Lock. THP −12%, vibración 0.87 mm/s. Motor IA Oilboards.</div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
}
