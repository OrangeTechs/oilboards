import { motion } from 'framer-motion';
import { Monitor, Wifi, LayoutGrid, ArrowRight } from 'lucide-react';
import { SectionLabel } from '@/Components/ui/primitives';

const bullets = [
    { icon: Monitor, text: 'Monitoreo en múltiples pantallas con URLs independientes por módulo' },
    { icon: Wifi, text: 'Sincronización instantánea vía WebSockets — actualización en vivo, sin recargar' },
    { icon: LayoutGrid, text: 'Layouts dinámicos arrastrables (drag & drop) por el Ingeniero en Jefe' },
];

// Mosaico de "pantallas" — teaser del video-wall
const tiles = [
    { c: 'col-span-3 row-span-2', color: '#10B981', label: 'MAPA', kind: 'map' },
    { c: 'col-span-2 row-span-2', color: '#3B82F6', label: 'POZOS', kind: 'grid' },
    { c: 'col-span-2 row-span-1', color: '#F59E0B', label: 'THP-102H', kind: 'line' },
    { c: 'col-span-2 row-span-1', color: '#10B981', label: 'PROD', kind: 'big' },
    { c: 'col-span-2 row-span-1', color: '#EF4444', label: 'ALERTAS', kind: 'alert' },
    { c: 'col-span-2 row-span-1', color: '#10B981', label: 'THP-101H', kind: 'line' },
    { c: 'col-span-1 row-span-1', color: '#10B981', label: 'Hz', kind: 'gauge' },
    { c: 'col-span-1 row-span-1', color: '#F59E0B', label: 'A', kind: 'gauge' },
    { c: 'col-span-2 row-span-1', color: '#8B5CF6', label: 'NPT', kind: 'donut' },
    { c: 'col-span-3 row-span-1', color: '#3B82F6', label: 'CNE', kind: 'bars' },
];

function TileContent({ kind, color }: { kind: string; color: string }) {
    if (kind === 'map') return (
        <div className="w-full h-full rounded bg-[#0a0f1c] relative overflow-hidden tech-grid">
            {/* trazas sutiles entre pozos */}
            <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                <path d="M30,40 L55,25 L70,60 L45,70 M70,60 L80,45" fill="none" stroke="#1f2a3d" strokeWidth="0.6" />
            </svg>
            {[[30, 40], [55, 25], [70, 60], [45, 70], [80, 45]].map(([x, y], i) => {
                const c = i === 1 ? '#F59E0B' : i === 3 ? '#EF4444' : '#10B981';
                return (
                    <span key={i} className="absolute rounded-full" style={{ left: `${x}%`, top: `${y}%`, width: 6, height: 6, transform: 'translate(-50%,-50%)', background: c, boxShadow: `0 0 8px ${c}, 0 0 2px ${c}` }} />
                );
            })}
        </div>
    );
    if (kind === 'grid') return (
        <div className="grid grid-cols-2 gap-1 w-full h-full">
            {[['#10B981', 78], ['#F59E0B', 55], ['#10B981', 88], ['#EF4444', 12], ['#3B82F6', 0], ['#10B981', 64]].map(([c, w], i) => (
                <div key={i} className="rounded-sm border-l-2 bg-[#101826] flex flex-col justify-center gap-[3px] px-1.5 overflow-hidden" style={{ borderColor: c as string }}>
                    <div className="h-[2px] rounded-full bg-white/15" style={{ width: '70%' }} />
                    <div className="h-[3px] rounded-full" style={{ width: `${Math.max(8, w as number)}%`, background: c as string, opacity: 0.85 }} />
                </div>
            ))}
        </div>
    );
    if (kind === 'line') return (
        <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
            <path d="M0,20 L15,16 L30,18 L45,12 L60,15 L75,9 L100,14 L100,30 L0,30 Z" fill={color} fillOpacity="0.14" />
            <polyline points="0,20 15,16 30,18 45,12 60,15 75,9 100,14" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
    if (kind === 'big') return (
        <div className="flex flex-col items-center justify-center h-full leading-none">
            <span className="font-mono font-bold text-sm" style={{ color }}>72,450</span>
            <span className="text-[6px] text-[#6B7280] mt-0.5">bbl · mes</span>
        </div>
    );
    if (kind === 'alert') return (
        <div className="flex items-center justify-center gap-1.5 h-full">
            <span className="font-mono font-extrabold text-lg pulse-dot" style={{ color }}>2</span>
            <span className="text-[6px] text-[#9CA3AF] leading-tight">activas<br />ahora</span>
        </div>
    );
    if (kind === 'gauge') {
        // arco semicircular tipo aguja
        const pct = color === '#F59E0B' ? 0.72 : 0.58;
        const a = Math.PI * (1 - pct);
        const nx = 18 + 12 * Math.cos(a), ny = 19 - 12 * Math.sin(a);
        return (
            <svg viewBox="0 0 36 22" className="w-full h-full">
                <path d="M5 19 A 13 13 0 0 1 31 19" fill="none" stroke="#2a3346" strokeWidth="3" strokeLinecap="round" />
                <path d={`M5 19 A 13 13 0 0 1 ${nx.toFixed(1)} ${ny.toFixed(1)}`} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
                <circle cx="18" cy="19" r="1.6" fill={color} />
            </svg>
        );
    }
    if (kind === 'donut') return (
        <div className="flex items-center justify-center h-full">
            <div className="relative w-9 h-9 rounded-full" style={{ background: `conic-gradient(${color} 0% 40%, #EF4444 40% 65%, #3B82F6 65% 85%, #374151 85% 100%)` }}>
                <div className="absolute inset-[32%] rounded-full bg-[#0B0F19]" />
            </div>
        </div>
    );
    if (kind === 'bars') return (
        <div className="flex items-end justify-around h-full gap-1 px-1 pb-0.5">
            {[60, 80, 70, 90, 75, 95].map((h, i) => (
                <div key={i} className="flex-1 rounded-t-[2px]" style={{ height: `${h}%`, background: `linear-gradient(to top, ${color}, ${color}99)` }} />
            ))}
        </div>
    );
    return null;
}

export default function SalasMonitoreo() {
    return (
        <section id="salas" className="relative py-24 overflow-hidden scroll-mt-20">
            <div className="absolute inset-0 bg-[#0a0e17]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[#3B82F6]/8 rounded-full blur-[120px]" />
            <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-14 items-center relative z-10">
                {/* Video wall mosaico */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.7 }}
                    className="relative"
                >
                    <div className="glass rounded-2xl p-3 glow-green">
                        <div className="flex items-center justify-between px-1 pb-2">
                            <span className="flex items-center gap-1.5 text-[10px] text-[#9CA3AF] uppercase tracking-widest">
                                <Monitor size={11} className="text-[#10B981]" /> Sala de Operaciones · video-wall
                            </span>
                            <span className="flex items-center gap-1 text-[9px] text-[#10B981]"><span className="w-1 h-1 rounded-full bg-[#10B981] pulse-dot" /> EN VIVO</span>
                        </div>
                        <div className="grid grid-cols-5 grid-rows-4 gap-1.5 h-[340px]" style={{ gridAutoFlow: 'dense' }}>
                            {tiles.map((t, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, scale: 0.96 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                                    className={`${t.c} bg-[#0B0F19] rounded-md border overflow-hidden flex flex-col shadow-[inset_0_0_12px_rgba(0,0,0,0.5)]`} style={{ borderColor: `${t.color}40` }}
                                >
                                    <div className="flex items-center justify-between px-1.5 py-[3px]" style={{ backgroundColor: `${t.color}14` }}>
                                        <span className="text-[7px] font-bold uppercase tracking-wider truncate" style={{ color: t.color }}>{t.label}</span>
                                        <span className="w-1 h-1 rounded-full flex-shrink-0 pulse-dot" style={{ backgroundColor: t.color }} />
                                    </div>
                                    <div className="flex-1 min-h-0 p-1.5"><TileContent kind={t.kind} color={t.color} /></div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                    <div className="absolute -top-3 -right-3 bg-[#10B981] text-white text-[11px] font-bold px-3 py-1.5 rounded-full glow-green">Sin hardware industrial</div>
                </motion.div>

                {/* Copy */}
                <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
                    <SectionLabel>Salas de Monitoreo Virtuales</SectionLabel>
                    <h2 className="text-3xl lg:text-4xl font-extrabold text-white leading-tight mt-4 mb-6">
                        Tu sala de control estilo NASA. <span className="text-gradient">Instalada en 48 horas.</span> Sin servidores locales.
                    </h2>
                    <p className="text-[#9CA3AF] text-base leading-relaxed mb-8">
                        Las salas tradicionales exigen computadoras industriales costosas y licencias por
                        pantalla. Con Oilboards conviertes cualquier oficina en un centro de control con
                        pantallas comerciales conectadas a internet — un mosaico de monitores en vivo.
                    </p>
                    <div className="space-y-4">
                        {bullets.map(({ icon: Icon, text }, i) => (
                            <motion.div key={i} initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.12 }} className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg glass flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <Icon size={15} className="text-[#10B981]" />
                                </div>
                                <p className="text-[#D1D5DB] text-sm leading-relaxed">{text}</p>
                            </motion.div>
                        ))}
                    </div>
                    <a href="/demo?screen=sala-monitoreo" className="mt-8 inline-flex items-center gap-2 glass hover:border-[#10B981] text-white font-semibold px-5 py-3 rounded-xl text-sm transition-all">
                        Ver la Sala de Monitoreo en la demo <ArrowRight size={16} />
                    </a>
                </motion.div>
            </div>
        </section>
    );
}
