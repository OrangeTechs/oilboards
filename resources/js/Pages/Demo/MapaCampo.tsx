import { useState } from 'react';
import { motion } from 'framer-motion';
import FieldMap from '@/Components/Shared/FieldMap';
import { DEMO_WELLS, DEMO_ASSET, STATUS_META, DemoWell } from '@/data/demoData';
import { StatusDot } from '@/Components/ui/primitives';

export default function MapaCampo() {
    const [selected, setSelected] = useState<DemoWell | null>(null);

    const counts = {
        active: DEMO_WELLS.filter((w) => w.status === 'active').length,
        alert: DEMO_WELLS.filter((w) => w.status === 'alert').length,
        down: DEMO_WELLS.filter((w) => w.status === 'down').length,
        intervention: DEMO_WELLS.filter((w) => w.status === 'intervention').length,
    };

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-bold text-white">Mapa del Campo</h2>
                    <p className="text-sm text-[#9CA3AF]">{DEMO_ASSET.name} · {DEMO_ASSET.region} · {DEMO_WELLS.length} pozos</p>
                </div>
                <div className="flex items-center gap-4">
                    {(['active', 'alert', 'intervention', 'down'] as const).map((s) => (
                        <span key={s} className="flex items-center gap-1.5 text-xs text-[#9CA3AF]">
                            <StatusDot color={STATUS_META[s].color} /> {STATUS_META[s].label} {counts[s]}
                        </span>
                    ))}
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 glass rounded-2xl overflow-hidden">
                    <FieldMap height={520} interactive onSelectWell={setSelected} />
                </div>

                <div className="space-y-3">
                    {selected ? (
                        <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="glass rounded-2xl p-5">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <StatusDot color={STATUS_META[selected.status].color} pulse={selected.status === 'alert'} />
                                    <span className="text-base font-bold text-white">{selected.name}</span>
                                </div>
                                <span className="text-xs text-[#6B7280]">{selected.liftType}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    ['Producción', selected.netOilBbl > 0 ? `${selected.netOilBbl} bbl/d` : '—'],
                                    ['THP', selected.thpPsi > 0 ? `${selected.thpPsi} psi` : '—'],
                                    ['BSW', `${selected.bswPct}%`],
                                    ['Profundidad', `${selected.depthM} m`],
                                    ['GOR', selected.gor > 0 ? `${selected.gor}` : '—'],
                                    ['Uptime', `${selected.uptimePct}%`],
                                ].map(([l, v]) => (
                                    <div key={l} className="bg-[#0B0F19] rounded-lg p-2.5">
                                        <div className="text-[10px] text-[#6B7280]">{l}</div>
                                        <div className="text-sm font-bold font-mono text-white">{v}</div>
                                    </div>
                                ))}
                            </div>
                            {selected.activeAlert && (
                                <div className="mt-3 bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-lg p-3">
                                    <div className="text-xs font-bold text-[#F59E0B]">⚠️ {selected.activeAlert.title}</div>
                                    <div className="text-[10px] text-[#9CA3AF] mt-0.5">Detectada {selected.activeAlert.detectedAt} · Urgencia {selected.activeAlert.urgency}</div>
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <div className="glass rounded-2xl p-5 text-center text-sm text-[#6B7280]">
                            Haz clic en un pozo del mapa para ver su detalle.
                        </div>
                    )}

                    <div className="glass rounded-2xl p-5">
                        <div className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider mb-3">Pozos del activo</div>
                        <div className="space-y-1">
                            {DEMO_WELLS.map((w) => (
                                <button key={w.id} onClick={() => setSelected(w)}
                                    className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-[#1F2937]/50 transition-colors">
                                    <span className="flex items-center gap-2 text-sm text-white">
                                        <StatusDot color={STATUS_META[w.status].color} pulse={w.status === 'alert'} /> {w.name}
                                    </span>
                                    <span className="text-xs font-mono text-[#9CA3AF]">{w.netOilBbl > 0 ? `${w.netOilBbl} bbl` : '—'}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
