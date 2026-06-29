import { useMemo } from 'react';
import { DEMO_WELLS } from '@/data/demoData';
import { C, hexA } from '@/lib/chart';
import { Activity, Radio, AlertTriangle, Brain } from 'lucide-react';

// ============================================================================
// PIEZAS TELEMETRÍA — banner del módulo + cerebro proactivo de gas-lock.
// Mismo molde que ESG: componentes "sin chrome", reutilizables sueltos o dentro
// del Tablero. Los gauges/SCADA/matriz/dynacard ya existen en SalaMonitoreo.
// El cerebro deriva su diagnóstico de los datos del pozo en alerta (no es fijo).
// ============================================================================

// Pozo en alerta (el caso gas-lock del demo: POZO-102H).
const alertWell = DEMO_WELLS.find((w) => w.status === 'alert') ?? DEMO_WELLS[0];
// Línea base de amperaje de los BEC sanos, para medir la desviación del pozo.
const becBaseAmp = (() => {
    const sanos = DEMO_WELLS.filter((w) => w.liftType === 'BEC' && w.status === 'active');
    return sanos.length ? sanos.reduce((s, w) => s + w.motorAmp, 0) / sanos.length : 42;
})();

// BANNER · identidad del módulo. El activo lo da el encabezado de la Sala.
export function TelemetriaBanner() {
    const enAlerta = !!alertWell.activeAlert;
    return (
        <div className="h-full w-full flex items-center justify-between gap-3 px-1">
            <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: hexA(C.blue, 0.13) }}>
                    <Radio size={15} style={{ color: C.blue }} />
                </div>
                <div className="min-w-0">
                    <div className="text-[12px] font-bold text-white leading-tight truncate">Ingeniería y Telemetría · Diagnóstico de Pozo</div>
                    <div className="text-[9px] text-[#9CA3AF] truncate">
                        Módulo 02 · Telemetría SCADA en vivo · Foco: <span style={{ color: C.yellow }}>{alertWell.name}</span> ({alertWell.liftType})
                    </div>
                </div>
            </div>
            {enAlerta && (
                <div className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 border flex-shrink-0"
                    style={{ borderColor: hexA(C.yellow, 0.3), backgroundColor: hexA(C.yellow, 0.1) }}>
                    <AlertTriangle size={12} style={{ color: C.yellow }} />
                    <span className="text-[10px] font-bold whitespace-nowrap" style={{ color: C.yellow }}>
                        {alertWell.name} · Gas-Lock
                    </span>
                </div>
            )}
        </div>
    );
}

// CEREBRO · recomendación de gas-lock derivada de los datos del pozo en alerta.
function buildGasLockRec() {
    const w = alertWell;
    const ampDelta = (((w.motorAmp - becBaseAmp) / becBaseAmp) * 100);
    const vibHigh = w.vibrationMms >= 0.75;     // umbral típico de vibración BEC
    const pipLow = w.pipPsi > 0 && w.pipPsi < 1000; // PIP por debajo de operación sana
    const targetHz = Math.max(45, Math.round(w.motorHz - 4)); // bajar al rango inferior
    const señales: string[] = [];
    if (pipLow) señales.push(`PIP en ${w.pipPsi} psi (baja)`);
    if (ampDelta > 5) señales.push(`amperaje +${ampDelta.toFixed(0)}% sobre los BEC sanos`);
    if (vibHigh) señales.push(`vibración ${w.vibrationMms} mm/s sobre umbral`);
    return {
        title: `Gas-lock probable en ${w.name}`,
        body: `${señales.join(' + ')} — patrón consistente con segregación de gas en la bomba electrocentrífuga.`,
        action: `Bajar la frecuencia del variador al rango inferior (≈${targetHz} Hz) y monitorear la recuperación de PIP en 30 min. Si no recupera, evaluar ciclo de purga del espacio anular.`,
        urgency: 'ALTA', confidence: 'Media',
    };
}

export function TelemetriaRecomendacionIA() {
    const rec = useMemo(buildGasLockRec, []);
    const accent = C.yellow;
    return (
        <div className="h-full w-full rounded-lg p-2.5 flex flex-col gap-1.5"
            style={{ background: `linear-gradient(135deg, ${hexA(accent, 0.10)}, ${hexA('#000', 0)})` }}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                    <Brain size={12} style={{ color: accent }} />
                    <span className="text-[8px] font-bold uppercase tracking-wider" style={{ color: accent }}>Recomendación IA · ML · Oilboards</span>
                </div>
                <div className="flex items-center gap-2 text-[8px] font-mono">
                    <span style={{ color: accent }}>Urgencia: {rec.urgency}</span>
                    <span className="text-[#6B7280]">Confianza: {rec.confidence}</span>
                </div>
            </div>
            <div className="text-[11px] font-bold text-white leading-tight flex items-center gap-1.5">
                <Activity size={12} style={{ color: accent }} /> {rec.title}
            </div>
            <div className="text-[9px] text-[#9CA3AF] leading-relaxed">{rec.body}</div>
            <div className="mt-auto pt-1 flex items-start gap-1.5 border-t border-[#1F2937]">
                <span className="text-[8px] font-bold mt-0.5" style={{ color: accent }}>→</span>
                <span className="text-[9px] font-semibold text-[#D1D5DB] leading-snug">{rec.action}</span>
            </div>
            <p className="text-[7px] text-[#4B5563] leading-tight">Sugerencia sujeta a validación del ingeniero responsable.</p>
        </div>
    );
}
