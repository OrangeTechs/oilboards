import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DEMO_KPIS, DEMO_EVENTS, DemoEvent } from '@/data/demoData';
import { TrendingUp, Activity, AlertTriangle, Clock } from 'lucide-react';

const EVENT_ICONS: Record<DemoEvent['type'], string> = {
    ok: '✅',
    alert: '⚠️',
    down: '🔴',
    info: '🔵',
};

const EVENT_COLORS: Record<DemoEvent['type'], string> = {
    ok: 'text-[#10B981]',
    alert: 'text-[#F59E0B]',
    down: 'text-[#EF4444]',
    info: 'text-[#3B82F6]',
};

const newEvents: DemoEvent[] = [
    { time: '11:20', type: 'ok',    well: 'POZO-108', message: 'Inyección de inhibidor completada exitosamente' },
    { time: '11:38', type: 'alert', well: 'POZO-102H', message: 'THP bajó a 291 psi — umbral crítico próximo' },
    { time: '11:55', type: 'info',  well: 'POZO-103',  message: 'GOR aumentó 5% — revisión programada para el turno vespertino' },
];

export default function DashboardCampo() {
    const [events, setEvents] = useState([...DEMO_EVENTS].reverse());

    useEffect(() => {
        let i = 0;
        const timer = setInterval(() => {
            if (i >= newEvents.length) { clearInterval(timer); return; }
            // Capturar el evento ANTES de incrementar: el updater de setEvents corre
            // de forma diferida y, si leyera `i` ahí, ya estaría incrementado (leería
            // newEvents[i+1] → undefined en el último tick → crash).
            const next = newEvents[i];
            i++;
            setEvents(prev => [next, ...prev].slice(0, 9));
        }, 12000);
        return () => clearInterval(timer);
    }, []);

    const kpis = [
        {
            label: 'Producción Neta Hoy',
            value: '3,248 bbl',
            sub: '↑ 3.2% vs ayer',
            icon: TrendingUp,
            color: 'text-[#10B981]',
            subColor: 'text-[#10B981]',
        },
        {
            label: 'Uptime Global',
            value: '87.5%',
            sub: '6 de 8 pozos activos',
            icon: Activity,
            color: 'text-white',
            subColor: 'text-[#9CA3AF]',
        },
        {
            label: 'Alertas Activas',
            value: '2',
            sub: 'POZO-102H · POZO-104',
            icon: AlertTriangle,
            color: 'text-[#EF4444]',
            subColor: 'text-[#F59E0B]',
        },
        {
            label: 'NPT Acumulado Hoy',
            value: '4h 30min',
            sub: 'POZO-104 · Falla eléctrica',
            icon: Clock,
            color: 'text-[#F59E0B]',
            subColor: 'text-[#EF4444]',
        },
    ];

    return (
        <div className="p-6 space-y-6 max-w-5xl">
            {/* KPI cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {kpis.map(({ label, value, sub, icon: Icon, color, subColor }, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="glass rounded-2xl p-4"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-[#9CA3AF]">{label}</span>
                            <Icon size={15} className="text-[#4B5563]" />
                        </div>
                        <div className={`text-2xl font-bold font-mono ${color}`}>{value}</div>
                        <div className={`text-xs mt-1 ${subColor}`}>{sub}</div>
                    </motion.div>
                ))}
            </div>

            {/* Event feed */}
            <div className="glass rounded-2xl overflow-hidden">
                <div className="px-5 py-3 border-b border-[#1F2937] flex items-center justify-between">
                    <span className="text-sm font-semibold text-white">Bitácora de Eventos</span>
                    <span className="text-xs text-[#6B7280]">Actualización automática cada 15s</span>
                </div>
                <div className="divide-y divide-[#1F2937]/60">
                    <AnimatePresence>
                        {events.map((event, i) => (
                            <motion.div
                                key={`${event.time}-${event.well}-${i}`}
                                initial={{ opacity: 0, height: 0, y: -20 }}
                                animate={{ opacity: 1, height: 'auto', y: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.4 }}
                                className="flex items-start gap-3 px-5 py-3"
                            >
                                <span className="text-sm flex-shrink-0 mt-0.5">{EVENT_ICONS[event.type]}</span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="font-mono text-xs text-[#6B7280]">{event.time}</span>
                                        <span className={`text-xs font-semibold ${EVENT_COLORS[event.type]}`}>
                                            {event.well}
                                        </span>
                                    </div>
                                    <span className="text-sm text-[#D1D5DB]">{event.message}</span>
                                </div>
                                {i === 0 && (
                                    <span className="text-[9px] bg-[#10B981]/20 text-[#10B981] px-2 py-0.5 rounded flex-shrink-0">
                                        NUEVO
                                    </span>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            {/* Summary row */}
            <div className="grid sm:grid-cols-3 gap-4">
                {[
                    { label: 'Producción mes', value: `${DEMO_KPIS.netOilBblMonth.toLocaleString()} bbl`, sub: `+${DEMO_KPIS.netOilBblMonthVsTarget}% vs meta` },
                    { label: 'BSW promedio', value: `${DEMO_KPIS.bswAvgPct}%`, sub: 'Dentro del rango normal' },
                    { label: 'NPT del mes', value: `${DEMO_KPIS.nptHours}h`, sub: 'Acumulado junio 2026' },
                ].map((item, i) => (
                    <div key={i} className="glass rounded-2xl p-4">
                        <div className="text-xs text-[#6B7280] mb-1">{item.label}</div>
                        <div className="text-xl font-bold font-mono text-white">{item.value}</div>
                        <div className="text-xs text-[#9CA3AF] mt-1">{item.sub}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
