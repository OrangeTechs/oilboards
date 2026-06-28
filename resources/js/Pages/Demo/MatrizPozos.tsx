import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DEMO_WELLS, DemoWell, WellStatus } from '@/data/demoData';
import { X } from 'lucide-react';

const STATUS_LABELS: Record<WellStatus, string> = {
    active: 'ACTIVO',
    alert: 'ALERTA',
    down: 'PARADO',
    intervention: 'INTERVENCIÓN',
};

const STATUS_COLORS: Record<WellStatus, string> = {
    active: 'text-[#10B981] bg-[#10B981]/10',
    alert: 'text-[#F59E0B] bg-[#F59E0B]/10',
    down: 'text-[#EF4444] bg-[#EF4444]/10',
    intervention: 'text-[#3B82F6] bg-[#3B82F6]/10',
};

const BORDER_COLORS: Record<WellStatus, string> = {
    active: 'border-l-[#10B981]',
    alert: 'border-l-[#F59E0B]',
    down: 'border-l-[#EF4444]',
    intervention: 'border-l-[#3B82F6]',
};

const BG_TINT: Record<WellStatus, string> = {
    active: '',
    alert: 'bg-[#F59E0B]/[0.03]',
    down: 'bg-[#EF4444]/[0.03]',
    intervention: 'bg-[#3B82F6]/[0.03]',
};

function Sparkline({ thp, status }: { thp: number; status: WellStatus }) {
    const color = status === 'alert' ? '#F59E0B' : status === 'down' ? '#EF4444' : '#10B981';
    const points = Array.from({ length: 6 }, (_, i) => {
        const noise = Math.sin(i * 1.5 + thp * 0.01) * 8;
        const trend = status === 'alert' ? -i * 3 : 0;
        return Math.max(10, 40 - noise + trend);
    });
    const max = Math.max(...points);
    const min = Math.min(...points);
    const range = max - min || 1;
    const w = 80;
    const h = 30;
    const pts = points.map((v, i) => `${(i / (points.length - 1)) * w},${h - ((v - min) / range) * (h - 4) - 2}`).join(' ');

    return (
        <svg width={w} height={h} className="overflow-visible">
            <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

export default function MatrizPozos() {
    const [wells, setWells] = useState<DemoWell[]>(DEMO_WELLS);
    const [selected, setSelected] = useState<DemoWell | null>(null);

    useEffect(() => {
        const timer = setInterval(() => {
            setWells(prev => prev.map(w => {
                if (w.id === 'pozo-102h' && w.thpPsi > 260) {
                    return { ...w, thpPsi: w.thpPsi - (2 + Math.random() * 1), motorAmp: Math.min(55, w.motorAmp + 0.2) };
                }
                return w;
            }));
        }, 8000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="p-6">
            <div className="mb-6">
                <h2 className="text-lg font-bold text-white">Matriz de Pozos</h2>
                <p className="text-sm text-[#9CA3AF]">Activo Litoral Tabasco · 8 pozos · Tiempo real simulado</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {wells.map((well, i) => (
                    <motion.button
                        key={well.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.07 }}
                        onClick={() => setSelected(well)}
                        className={`text-left glass rounded-xl border-l-4 p-4 hover:border-opacity-100 transition-all hover:scale-[1.02] ${BORDER_COLORS[well.status]} ${BG_TINT[well.status]}`}
                    >
                        <div className="flex items-start justify-between mb-2">
                            <div>
                                <div className="text-sm font-bold text-white">{well.name}</div>
                                <div className="text-xs text-[#6B7280]">{well.liftType}</div>
                            </div>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${STATUS_COLORS[well.status]} ${well.status === 'alert' ? 'pulse-dot' : ''}`}>
                                {STATUS_LABELS[well.status]}
                            </span>
                        </div>

                        <div className="mb-2">
                            <div className="text-2xl font-bold font-mono text-white">
                                {well.netOilBbl > 0 ? `${well.netOilBbl}` : '—'}
                            </div>
                            <div className="text-xs text-[#6B7280]">{well.netOilBbl > 0 ? 'bbl/d' : well.status === 'down' ? `NPT: ${well.nptMinutes ? `${Math.floor(well.nptMinutes/60)}h ${well.nptMinutes%60}min` : '—'}` : 'En intervención'}</div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-xs text-[#9CA3AF]">
                                    THP: <span className="font-mono font-semibold text-white">{well.thpPsi > 0 ? `${Math.round(well.thpPsi)} psi` : '—'}</span>
                                </div>
                            </div>
                            {well.thpPsi > 0 && (
                                <Sparkline thp={well.thpPsi} status={well.status} />
                            )}
                        </div>

                        {well.activeAlert && (
                            <div className="mt-2 text-[9px] text-[#F59E0B] bg-[#F59E0B]/10 px-2 py-1 rounded">
                                ⚠️ {well.activeAlert.title.slice(0, 30)}...
                            </div>
                        )}
                    </motion.button>
                ))}
            </div>

            {/* Modal */}
            <AnimatePresence>
                {selected && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
                        onClick={() => setSelected(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="glass rounded-2xl p-6 max-w-md w-full"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-5">
                                <div>
                                    <div className="text-lg font-bold text-white">{selected.name}</div>
                                    <div className="text-sm text-[#9CA3AF]">{selected.liftType} · {STATUS_LABELS[selected.status]}</div>
                                </div>
                                <button onClick={() => setSelected(null)} className="text-[#6B7280] hover:text-white">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { label: 'Producción neta', value: `${selected.netOilBbl} bbl/d` },
                                    { label: 'THP', value: `${Math.round(selected.thpPsi)} psi` },
                                    { label: 'FLP', value: `${Math.round(selected.flpPsi)} psi` },
                                    { label: 'Temperatura', value: `${selected.tempC}°C` },
                                    { label: 'BSW', value: `${selected.bswPct}%` },
                                    { label: 'Uptime', value: `${selected.uptimePct}%` },
                                    ...(selected.motorHz > 0 ? [
                                        { label: 'Frecuencia motor', value: `${selected.motorHz} Hz` },
                                        { label: 'Corriente motor', value: `${selected.motorAmp} A` },
                                        { label: 'Vibración', value: `${selected.vibrationMms} mm/s` },
                                    ] : []),
                                ].map((row, i) => (
                                    <div key={i} className="bg-[#0B0F19] rounded-lg p-3">
                                        <div className="text-[10px] text-[#6B7280]">{row.label}</div>
                                        <div className="text-sm font-bold font-mono text-white mt-0.5">{row.value}</div>
                                    </div>
                                ))}
                            </div>

                            {selected.activeAlert && (
                                <div className="mt-4 bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-xl p-4">
                                    <div className="text-xs font-bold text-[#F59E0B] mb-1">⚠️ Alerta Activa</div>
                                    <div className="text-sm text-[#FCD34D]">{selected.activeAlert.title}</div>
                                    <div className="text-xs text-[#9CA3AF] mt-1">Detectada: {selected.activeAlert.detectedAt} · Urgencia: {selected.activeAlert.urgency}</div>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
