import { useMemo, useState } from 'react';
import { DEMO_WELLS } from '@/data/demoData';
import { C, hexA } from '@/lib/chart';
import { useTelemWellId, setTelemWell } from '@/lib/telemSelection';
import { Activity, Radio, AlertTriangle, CheckCircle, Brain, ChevronDown } from 'lucide-react';

// ============================================================================
// PIEZAS TELEMETRÍA — banner con SELECTOR DE POZO + cerebro adaptativo.
// El pozo en foco vive en un store compartido (telemSelection); el banner lo
// cambia y todos los bloques del tablero (gauges, SCADA, matriz, recomendación)
// lo siguen. Los gauges/SCADA/matriz viven en SalaMonitoreo y leen el mismo store.
// ============================================================================

const becBaseAmp = (() => {
    const sanos = DEMO_WELLS.filter((w) => w.liftType === 'BEC' && w.status === 'active');
    return sanos.length ? sanos.reduce((s, w) => s + w.motorAmp, 0) / sanos.length : 42;
})();

const STATUS_TXT: Record<string, { label: string; color: string }> = {
    active: { label: 'Operando', color: C.green },
    alert: { label: 'Gas-Lock', color: C.yellow },
    down: { label: 'Parado', color: C.red },
    intervention: { label: 'Intervención', color: C.blue },
};

// BANNER · identidad del módulo + selector del pozo en foco.
export function TelemetriaBanner() {
    const wellId = useTelemWellId();
    const w = DEMO_WELLS.find((x) => x.id === wellId) ?? DEMO_WELLS[0];
    const [open, setOpen] = useState(false);
    const st = STATUS_TXT[w.status] ?? STATUS_TXT.active;
    return (
        <div className="h-full w-full flex items-center justify-between gap-3 px-1">
            <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: hexA(C.blue, 0.13) }}>
                    <Radio size={15} style={{ color: C.blue }} />
                </div>
                <div className="min-w-0">
                    <div className="text-[12px] font-bold text-white leading-tight truncate">Ingeniería y Telemetría · Diagnóstico de Pozo</div>
                    <div className="text-[9px] text-[#9CA3AF] truncate">Módulo 02 · Telemetría SCADA en vivo · Diagnóstico por pozo</div>
                </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
                {/* Selector de pozo en foco */}
                <div className="relative">
                    <button onClick={() => setOpen((o) => !o)}
                        className="flex items-center gap-1.5 rounded-lg border border-[#374151] hover:border-[#9CA3AF] px-2.5 py-1 transition-colors">
                        <span className="text-[8px] text-[#6B7280] uppercase tracking-wider">Foco</span>
                        <span className="text-[11px] font-bold text-white">{w.name}</span>
                        <span className="text-[9px] font-mono" style={{ color: st.color }}>· {st.label}</span>
                        <ChevronDown size={12} className="text-[#6B7280]" />
                    </button>
                    {open && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                            <div className="absolute right-0 top-full mt-1 w-56 bg-[#0B0F19] border border-[#1F2937] rounded-lg shadow-2xl z-50 p-1 max-h-72 overflow-auto">
                                <div className="px-2 py-1 text-[8px] font-bold text-[#6B7280] uppercase tracking-wider">Pozo en foco</div>
                                {DEMO_WELLS.map((p) => {
                                    const ps = STATUS_TXT[p.status] ?? STATUS_TXT.active;
                                    const active = p.id === wellId;
                                    return (
                                        <button key={p.id} onClick={() => { setTelemWell(p.id); setOpen(false); }}
                                            className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-left ${active ? 'bg-[#10B981]/10' : 'hover:bg-[#1F2937]'}`}>
                                            <span className="flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ps.color }} />
                                                <span className="text-[11px] font-semibold" style={{ color: active ? C.green : '#D1D5DB' }}>{p.name}</span>
                                                <span className="text-[8px] text-[#6B7280]">{p.liftType}</span>
                                            </span>
                                            <span className="text-[8px] font-mono" style={{ color: ps.color }}>{ps.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
                {/* Pastilla de estatus del pozo en foco */}
                <div className="hidden lg:flex items-center gap-1.5 rounded-lg px-2.5 py-1 border" style={{ borderColor: hexA(st.color, 0.3), backgroundColor: hexA(st.color, 0.1) }}>
                    {w.status === 'active' ? <CheckCircle size={12} style={{ color: st.color }} /> : <AlertTriangle size={12} style={{ color: st.color }} />}
                    <span className="text-[10px] font-bold whitespace-nowrap" style={{ color: st.color }}>{w.name} · {st.label}</span>
                </div>
            </div>
        </div>
    );
}

// CEREBRO · recomendación ADAPTATIVA según el pozo en foco.
function buildRec(w: typeof DEMO_WELLS[0]) {
    if (w.status === 'down') {
        return { accent: C.red, urgency: 'ALTA', confidence: 'Alta',
            title: `${w.name} parado — sin producción`,
            body: `El pozo no aporta este turno. Cada hora parado es producción diferida y, en BEC/BM, riesgo de daño por arranques en frío.`,
            action: `Confirmar cuadrilla y causa raíz del paro; restablecer en cuanto sea seguro y registrar el NPT.` };
    }
    if (w.status === 'intervention') {
        return { accent: C.blue, urgency: 'MEDIA', confidence: 'Alta',
            title: `${w.name} en intervención mayor`,
            body: `Equipo intervenido; sin telemetría de producción mientras dure la maniobra.`,
            action: `Dar seguimiento al avance de la intervención y validar pruebas de arranque antes de reincorporar a producción.` };
    }
    const ampDelta = ((w.motorAmp - becBaseAmp) / becBaseAmp) * 100;
    const vibHigh = w.vibrationMms >= 0.75;
    const pipLow = w.pipPsi > 0 && w.pipPsi < 1000;
    if (w.liftType === 'BEC' && (vibHigh || pipLow)) {
        const targetHz = Math.max(45, Math.round(w.motorHz - 4));
        const señales: string[] = [];
        if (pipLow) señales.push(`PIP en ${w.pipPsi} psi (baja)`);
        if (ampDelta > 5) señales.push(`amperaje +${ampDelta.toFixed(0)}% sobre los BEC sanos`);
        if (vibHigh) señales.push(`vibración ${w.vibrationMms} mm/s sobre umbral`);
        return { accent: C.yellow, urgency: 'ALTA', confidence: 'Media',
            title: `Gas-lock probable en ${w.name}`,
            body: `${señales.join(' + ')} — patrón consistente con segregación de gas en la bomba electrocentrífuga.`,
            action: `Bajar la frecuencia del variador al rango inferior (≈${targetHz} Hz) y monitorear la recuperación de PIP en 30 min. Si no recupera, evaluar ciclo de purga del espacio anular.` };
    }
    return { accent: C.green, urgency: 'BAJA', confidence: 'Alta',
        title: `${w.name} opera dentro de rango`,
        body: `THP ${w.thpPsi} psi${w.pipPsi ? ` · PIP ${w.pipPsi} psi` : ''} · vibración ${w.vibrationMms} mm/s · ${w.motorAmp} A — sin anomalías relevantes (${w.liftType}).`,
        action: `Mantener el monitoreo del turno. Sin acción correctiva requerida en este momento.` };
}

export function TelemetriaRecomendacionIA() {
    const wellId = useTelemWellId();
    const w = DEMO_WELLS.find((x) => x.id === wellId) ?? DEMO_WELLS[0];
    const rec = useMemo(() => buildRec(w), [w]);
    return (
        <div className="h-full w-full rounded-lg p-2.5 flex flex-col gap-1.5"
            style={{ background: `linear-gradient(135deg, ${hexA(rec.accent, 0.10)}, ${hexA('#000', 0)})` }}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                    <Brain size={12} style={{ color: rec.accent }} />
                    <span className="text-[8px] font-bold uppercase tracking-wider" style={{ color: rec.accent }}>Recomendación IA · ML · Oilboards</span>
                </div>
                <div className="flex items-center gap-2 text-[8px] font-mono">
                    <span style={{ color: rec.accent }}>Urgencia: {rec.urgency}</span>
                    <span className="text-[#6B7280]">Confianza: {rec.confidence}</span>
                </div>
            </div>
            <div className="text-[11px] font-bold text-white leading-tight flex items-center gap-1.5">
                <Activity size={12} style={{ color: rec.accent }} /> {rec.title}
            </div>
            <div className="text-[9px] text-[#9CA3AF] leading-relaxed">{rec.body}</div>
            <div className="mt-auto pt-1 flex items-start gap-1.5 border-t border-[#1F2937]">
                <span className="text-[8px] font-bold mt-0.5" style={{ color: rec.accent }}>→</span>
                <span className="text-[9px] font-semibold text-[#D1D5DB] leading-snug">{rec.action}</span>
            </div>
            <p className="text-[7px] text-[#4B5563] leading-tight">Sugerencia sujeta a validación del ingeniero responsable.</p>
        </div>
    );
}
