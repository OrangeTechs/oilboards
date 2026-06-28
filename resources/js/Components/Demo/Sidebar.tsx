import { ClipboardList, Radio, BarChart3, Monitor, ChevronDown, Cog, GitBranch, Wrench, Leaf } from 'lucide-react';
import { Tooltip } from '@/Components/ui/Tooltip';

export type Screen =
    | 'dashboard-campo' | 'reporte-diario' | 'consola-voz' | 'bitacora-npt' | 'inventario-hse'
    | 'matriz-pozos' | 'mapa-campo' | 'monitor-scada' | 'diagnostico-motores' | 'dosificacion-quimica'
    | 'kpis-ejecutivos' | 'cumplimiento-cne' | 'balance-fiscalizacion' | 'curva-declinacion' | 'asistente-ia'
    | 'centro-reportes' | 'config-alertas' | 'auditoria' | 'sincronizacion'
    | 'onboarding' | 'gestion-usuarios'
    | 'midstream-ductos' | 'mantenimiento-eam' | 'emisiones-esg'
    | 'sala-monitoreo';

interface Props {
    current: Screen;
    onChange: (s: Screen) => void;
}

const groups: { label: string; icon: any; color: string; items: { id: Screen; label: string }[] }[] = [
    {
        label: 'Captura y Campo', icon: ClipboardList, color: '#10B981',
        items: [
            { id: 'dashboard-campo', label: 'Dashboard de Campo' },
            { id: 'reporte-diario', label: 'Reporte Diario' },
            { id: 'consola-voz', label: 'Consola de Voz → IA' },
            { id: 'bitacora-npt', label: 'Bitácora de Paros / NPT' },
            { id: 'inventario-hse', label: 'Inventario HSE / Energía' },
        ],
    },
    {
        label: 'Ingeniería y Telemetría', icon: Radio, color: '#3B82F6',
        items: [
            { id: 'matriz-pozos', label: 'Matriz de Pozos' },
            { id: 'mapa-campo', label: 'Mapa del Campo' },
            { id: 'monitor-scada', label: 'Monitor SCADA' },
            { id: 'diagnostico-motores', label: 'Diagnóstico de Motores' },
            { id: 'dosificacion-quimica', label: 'Dosificación Química' },
        ],
    },
    {
        label: 'Dirección y Estrategia', icon: BarChart3, color: '#F59E0B',
        items: [
            { id: 'kpis-ejecutivos', label: 'KPIs Ejecutivos' },
            { id: 'cumplimiento-cne', label: 'Cumplimiento CNE' },
            { id: 'balance-fiscalizacion', label: 'Balance Fiscalización' },
            { id: 'curva-declinacion', label: 'Curva de Declinación' },
            { id: 'asistente-ia', label: 'Asistente IA' },
        ],
    },
    {
        label: 'Midstream / Ductos', icon: GitBranch, color: '#EC4899',
        items: [
            { id: 'midstream-ductos', label: 'Midstream / Ductos' },
        ],
    },
    {
        label: 'Mantenimiento (EAM)', icon: Wrench, color: '#F59E0B',
        items: [
            { id: 'mantenimiento-eam', label: 'Mantenimiento (EAM)' },
        ],
    },
    {
        label: 'Emisiones ESG', icon: Leaf, color: '#10B981',
        items: [
            { id: 'emisiones-esg', label: 'Emisiones ESG' },
        ],
    },
    {
        label: 'Sistema', icon: Cog, color: '#8B5CF6',
        items: [
            { id: 'centro-reportes', label: 'Centro de Reportes' },
            { id: 'config-alertas', label: 'Configuración de Alertas' },
            { id: 'gestion-usuarios', label: 'Usuarios y Roles' },
            { id: 'onboarding', label: 'Alta de Activo y Pozos' },
            { id: 'auditoria', label: 'Auditoría' },
            { id: 'sincronizacion', label: 'Sincronización' },
        ],
    },
];

// Descripción de una línea por pantalla — usada en tooltips (sidebar + encabezado).
export const SCREEN_DESC: Record<Screen, string> = {
    'dashboard-campo': 'Resumen operativo del día: producción, uptime, alertas y bitácora de eventos en vivo.',
    'reporte-diario': 'Captura del reporte diario por pozo: aceite, BSW, gas, horas y causa de paro.',
    'consola-voz': 'El operador dicta su reporte por voz y la IA lo estructura en datos listos para el sistema.',
    'bitacora-npt': 'Registro de paros (NPT) con causa raíz, duración y responsable, para auditoría.',
    'inventario-hse': 'Inventario operativo, consumo de diésel/energía y eventos de seguridad (HSE).',
    'matriz-pozos': 'Semáforo de todos los pozos del activo con producción y presión de un vistazo.',
    'mapa-campo': 'Ubicación de los pozos con su estado y telemetría sobre el mapa del campo.',
    'monitor-scada': 'Telemetría SCADA en vivo: presiones THP/FLP, gauges de motor y alerta predictiva.',
    'diagnostico-motores': 'Salud del motor (BEC/balancín): frecuencia, corriente y vibración con histórico.',
    'dosificacion-quimica': 'Inyección de químicos (inhibidores de parafina, corrosión, escala) por pozo.',
    'kpis-ejecutivos': 'Tablero ejecutivo: producción del mes, uptime, NPT, costo por barril y gas.',
    'cumplimiento-cne': 'Cumplimiento CNE/SENER: meta comprometida vs. producción real por mes.',
    'balance-fiscalizacion': 'Conciliación de volumen neto vendible vs. balances de Pemex para fiscalización.',
    'curva-declinacion': 'Curva de declinación de producción del activo para planear intervenciones.',
    'asistente-ia': 'Asistente técnico que responde sobre manuales, historial de fallas y procedimientos.',
    'centro-reportes': 'Generación y descarga de reportes (PDF/Excel) para dirección y regulador.',
    'config-alertas': 'Reglas de alertas: qué variable, qué umbral y a qué pozos aplica cada una.',
    'gestion-usuarios': 'Usuarios, roles y permisos (operador, ingeniero, dirección) del activo.',
    'onboarding': 'Alta inicial del activo y sus pozos: datos, levantamiento e integración SCADA.',
    'auditoria': 'Historial inmutable de cambios y eventos para auditoría y disputas.',
    'sincronizacion': 'Estado de sincronización de la app móvil offline con la nube.',
    'midstream-ductos': 'Integridad de ductos: presión por kilómetro y detección de fugas/huachicol con IA.',
    'mantenimiento-eam': 'Mantenimiento predictivo: predice fallas, revisa refacciones y genera órdenes.',
    'emisiones-esg': 'Huella de carbono: aprovechamiento de gas, CO₂e y cumplimiento ESG para auditoría.',
    'sala-monitoreo': 'Arma tu video-wall arrastrando bloques de cualquier módulo. Pantallas en vivo.',
};

export default function Sidebar({ current, onChange }: Props) {
    return (
        <aside className="w-64 flex-shrink-0 bg-[#0B0F19] border-r border-[#1F2937] flex flex-col h-screen sticky top-0">
            <div className="px-5 py-4 border-b border-[#1F2937]">
                <div className="flex items-center">
                    <img src="/logo.png" alt="Oilboards" className="h-7 w-auto" />
                </div>
                <button className="mt-3 w-full flex items-center justify-between glass rounded-lg px-3 py-2 text-xs text-[#9CA3AF] hover:text-white transition-colors">
                    <span className="truncate">Activo Litoral Tabasco</span>
                    <ChevronDown size={12} className="flex-shrink-0 ml-1" />
                </button>
            </div>

            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
                {groups.map((g) => {
                    const GroupIcon = g.icon;
                    return (
                        <div key={g.label}>
                            <div className="flex items-center gap-2 px-2 mb-1.5">
                                <GroupIcon size={12} style={{ color: g.color }} />
                                <span className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider">{g.label}</span>
                            </div>
                            {g.items.map((item) => {
                                const active = current === item.id;
                                return (
                                    <Tooltip key={item.id} content={SCREEN_DESC[item.id]} side="right">
                                        <button
                                            onClick={() => onChange(item.id)}
                                            className={`w-full text-left flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[13px] transition-colors mb-0.5 ${active ? 'text-white font-medium' : 'text-[#9CA3AF] hover:text-white hover:bg-[#1F2937]/50'}`}
                                            style={active ? { backgroundColor: `${g.color}1A` } : {}}
                                        >
                                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: active ? g.color : 'transparent' }} />
                                            {item.label}
                                        </button>
                                    </Tooltip>
                                );
                            })}
                        </div>
                    );
                })}

                <div>
                    <Tooltip content={SCREEN_DESC['sala-monitoreo']} side="right">
                        <button
                            onClick={() => onChange('sala-monitoreo')}
                            className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors bg-gradient-to-r from-[#10B981]/15 to-[#3B82F6]/15 text-white hover:from-[#10B981]/25 hover:to-[#3B82F6]/25"
                        >
                            <Monitor size={15} /> Sala de Monitoreo
                        </button>
                    </Tooltip>
                </div>
            </nav>

            <div className="px-4 py-3 border-t border-[#1F2937]">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#10B981]/20 flex items-center justify-center text-xs font-bold text-[#10B981]">CM</div>
                    <div className="min-w-0">
                        <div className="text-xs font-semibold text-white truncate">Ing. Carlos Mendoza</div>
                        <div className="text-[10px] text-[#6B7280]">Ingeniero · DEMO</div>
                    </div>
                </div>
            </div>
        </aside>
    );
}
