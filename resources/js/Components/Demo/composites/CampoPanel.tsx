import { useMemo } from 'react';
import { DEMO_WELLS, DEMO_KPIS } from '@/data/demoData';
import { C, hexA } from '@/lib/chart';
import { ClipboardList, MapPin, AlertTriangle, CheckCircle, Brain } from 'lucide-react';

// ============================================================================
// PIEZAS CAMPO — banner del módulo + cerebro operativo del turno.
// Molde ESG/Telemetría/Dirección. Mapa/eventos/alertas/prodHoy/tanques/HSE ya
// existen en SalaMonitoreo. El cerebro deriva el estado del turno de los datos.
// ============================================================================

const detenidos = DEMO_WELLS.filter((w) => w.status === 'down' || w.status === 'intervention');
const parado = DEMO_WELLS.filter((w) => w.status === 'down')
    .sort((a, b) => (b.nptMinutes ?? 0) - (a.nptMinutes ?? 0))[0];
const enIntervencion = DEMO_WELLS.find((w) => w.status === 'intervention');
const fmtNpt = (min?: number) => {
    if (!min) return '—';
    const h = Math.floor(min / 60); const m = min % 60;
    return `${h}h ${m.toString().padStart(2, '0')}min`;
};

// BANNER · identidad del módulo.
export function CampoBanner() {
    const activos = DEMO_KPIS.wellsActive, total = DEMO_KPIS.wellsTotal;
    const todoBien = detenidos.length === 0;
    return (
        <div className="h-full w-full flex items-center justify-between gap-3 px-1">
            <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: hexA(C.green, 0.13) }}>
                    <ClipboardList size={15} style={{ color: C.green }} />
                </div>
                <div className="min-w-0">
                    <div className="text-[12px] font-bold text-white leading-tight truncate">Captura y Campo · Operación del Turno</div>
                    <div className="text-[9px] text-[#9CA3AF] truncate">
                        Módulo 01 · Reporte diario · Turno matutino
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 border flex-shrink-0"
                style={{ borderColor: hexA(todoBien ? C.green : C.yellow, 0.3), backgroundColor: hexA(todoBien ? C.green : C.yellow, 0.1) }}>
                {todoBien ? <CheckCircle size={12} style={{ color: C.green }} /> : <AlertTriangle size={12} style={{ color: C.yellow }} />}
                <span className="text-[10px] font-bold whitespace-nowrap" style={{ color: todoBien ? C.green : C.yellow }}>
                    {activos}/{total} pozos activos
                </span>
            </div>
        </div>
    );
}

// CEREBRO · estado operativo del turno derivado de los pozos.
function buildCampoRec() {
    const sinProducir = detenidos.length;
    const partes: string[] = [];
    if (parado) partes.push(`${parado.name} lleva ${fmtNpt(parado.nptMinutes)} parado (${(parado.activeAlert?.title ?? 'falla eléctrica en tablero').toLowerCase()})`);
    if (enIntervencion) partes.push(`${enIntervencion.name} en intervención mayor`);
    return {
        severity: sinProducir > 0 ? 'warn' as const : 'ok' as const,
        title: sinProducir > 0 ? `${sinProducir} pozos sin aportar producción este turno` : 'Turno operando con normalidad',
        body: partes.length
            ? `${partes.join(' · ')}. NPT acumulado hoy: ${DEMO_KPIS.nptHoursToday} h.`
            : `Los ${DEMO_KPIS.wellsActive} pozos activos reportan dentro de rango. NPT del día: ${DEMO_KPIS.nptHoursToday} h.`,
        action: parado
            ? `Confirmar cuadrilla en ${parado.name} y validar avance de la intervención${enIntervencion ? ` de ${enIntervencion.name}` : ''}. Cerrar la captura del reporte de los pozos pendientes del turno.`
            : 'Mantener la captura del turno al día y validar lecturas de tanque para el cierre de producción.',
    };
}

export function CampoRecomendacionIA() {
    const rec = useMemo(buildCampoRec, []);
    const accent = rec.severity === 'warn' ? C.yellow : C.green;
    return (
        <div className="h-full w-full rounded-lg p-2.5 flex flex-col gap-1.5"
            style={{ background: `linear-gradient(135deg, ${hexA(accent, 0.10)}, ${hexA('#000', 0)})` }}>
            <div className="flex items-center gap-1.5">
                <Brain size={12} style={{ color: accent }} />
                <span className="text-[8px] font-bold uppercase tracking-wider" style={{ color: accent }}>Recomendación IA · ML · Oilboards</span>
            </div>
            <div className="text-[11px] font-bold text-white leading-tight flex items-center gap-1.5">
                <MapPin size={12} style={{ color: accent }} /> {rec.title}
            </div>
            <div className="text-[9px] text-[#9CA3AF] leading-relaxed">{rec.body}</div>
            <div className="mt-auto pt-1 flex items-start gap-1.5 border-t border-[#1F2937]">
                <span className="text-[8px] font-bold mt-0.5" style={{ color: accent }}>→</span>
                <span className="text-[9px] font-semibold text-[#D1D5DB] leading-snug">{rec.action}</span>
            </div>
            <p className="text-[7px] text-[#4B5563] leading-tight">Sugerencia sujeta a validación del responsable del turno.</p>
        </div>
    );
}
