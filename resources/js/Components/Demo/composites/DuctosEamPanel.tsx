import { DEMO_PIPELINE_KPIS, DEMO_PIPELINE_ALERT, DEMO_ASSETS_HEALTH } from '@/data/demoData';
import { C, hexA } from '@/lib/chart';
import { GitBranch, Wrench, AlertTriangle, CheckCircle } from 'lucide-react';

// ============================================================================
// BANNERS de los tableros Ductos (04) y EAM (05). Sus cerebros ya existen como
// bloques (ductoAlerta = huachicol/fuga, eamFlujo = IA→refacción→orden), por eso
// aquí solo va la identidad del módulo. Mismo molde que los demás banners.
// ============================================================================

// MÓDULO 04 · MIDSTREAM / DUCTOS
export function DuctosBanner() {
    const hayAlerta = !!DEMO_PIPELINE_ALERT;
    return (
        <div className="h-full w-full flex items-center justify-between gap-3 px-1">
            <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: hexA(C.blue, 0.13) }}>
                    <GitBranch size={15} style={{ color: C.blue }} />
                </div>
                <div className="min-w-0">
                    <div className="text-[12px] font-bold text-white leading-tight truncate">Midstream / Ductos · Integridad y Custodia</div>
                    <div className="text-[9px] text-[#9CA3AF] truncate">
                        Módulo 04 · Balance de transporte · Marco <span style={{ color: C.blue }}>ASEA</span> · Balance {DEMO_PIPELINE_KPIS.balancePct}%
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 border flex-shrink-0"
                style={{ borderColor: hexA(hayAlerta ? C.red : C.green, 0.3), backgroundColor: hexA(hayAlerta ? C.red : C.green, 0.1) }}>
                {hayAlerta ? <AlertTriangle size={12} style={{ color: C.red }} /> : <CheckCircle size={12} style={{ color: C.green }} />}
                <span className="text-[10px] font-bold whitespace-nowrap" style={{ color: hayAlerta ? C.red : C.green }}>
                    {hayAlerta ? `Posible toma · caída ${DEMO_PIPELINE_ALERT.caida}` : 'Ducto íntegro'}
                </span>
            </div>
        </div>
    );
}

// MÓDULO 05 · MANTENIMIENTO (EAM)
export function EamBanner() {
    const criticos = DEMO_ASSETS_HEALTH.filter((a) => a.status === 'critical').length;
    const hayCriticos = criticos > 0;
    return (
        <div className="h-full w-full flex items-center justify-between gap-3 px-1">
            <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: hexA(C.purple, 0.13) }}>
                    <Wrench size={15} style={{ color: C.purple }} />
                </div>
                <div className="min-w-0">
                    <div className="text-[12px] font-bold text-white leading-tight truncate">Mantenimiento (EAM) · Confiabilidad de Activos</div>
                    <div className="text-[9px] text-[#9CA3AF] truncate">
                        Módulo 05 · Mantenimiento predictivo · Predicción → Refacción → Orden
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 border flex-shrink-0"
                style={{ borderColor: hexA(hayCriticos ? C.red : C.green, 0.3), backgroundColor: hexA(hayCriticos ? C.red : C.green, 0.1) }}>
                {hayCriticos ? <AlertTriangle size={12} style={{ color: C.red }} /> : <CheckCircle size={12} style={{ color: C.green }} />}
                <span className="text-[10px] font-bold whitespace-nowrap" style={{ color: hayCriticos ? C.red : C.green }}>
                    {hayCriticos ? `${criticos} activo${criticos > 1 ? 's' : ''} crítico${criticos > 1 ? 's' : ''}` : 'Activos sanos'}
                </span>
            </div>
        </div>
    );
}
