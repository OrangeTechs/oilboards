import { useState } from 'react';
import { Head } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar, { Screen, SCREEN_DESC } from '@/Components/Demo/Sidebar';
import TopBar from '@/Components/Demo/TopBar';
import ChatWidget from '@/Components/ui/ChatWidget';

import DashboardCampo from './DashboardCampo';
import ReporteDiario from './ReporteDiario';
import ConsolaVoz from './ConsolaVoz';
import BitacoraNpt from './BitacoraNpt';
import InventarioHse from './InventarioHse';
import MatrizPozos from './MatrizPozos';
import MapaCampo from './MapaCampo';
import MonitorScada from './MonitorScada';
import DiagnosticoMotores from './DiagnosticoMotores';
import DosificacionQuimica from './DosificacionQuimica';
import KpisEjecutivos from './KpisEjecutivos';
import CumplimientoCne from './CumplimientoCne';
import BalanceFiscalizacion from './BalanceFiscalizacion';
import CurvaDeclinacion from './CurvaDeclinacion';
import AsistenteIA from './AsistenteIA';
import CentroReportes from './CentroReportes';
import ConfigAlertas from './ConfigAlertas';
import GestionUsuarios from './GestionUsuarios';
import Onboarding from './Onboarding';
import Auditoria from './Auditoria';
import Sincronizacion from './Sincronizacion';
import SalaMonitoreo from './SalaMonitoreo';
import MidstreamDuctos from './MidstreamDuctos';
import MantenimientoEam from './MantenimientoEam';
import EmisionesEsg from './EmisionesEsg';

const TITLES: Record<Screen, string> = {
    'dashboard-campo': 'Dashboard de Campo',
    'reporte-diario': 'Reporte Diario de Producción',
    'consola-voz': 'Consola de Audio · Voz → IA',
    'bitacora-npt': 'Bitácora de Paros y NPT',
    'inventario-hse': 'Inventario Operativo · HSE y Energía',
    'matriz-pozos': 'Matriz de Pozos',
    'mapa-campo': 'Mapa del Campo',
    'monitor-scada': 'Monitor SCADA / Telemetría',
    'diagnostico-motores': 'Diagnóstico de Motores',
    'dosificacion-quimica': 'Dosificación Química',
    'kpis-ejecutivos': 'KPIs Ejecutivos',
    'cumplimiento-cne': 'Monitoreo Regulatorio CNE',
    'balance-fiscalizacion': 'Balance de Fiscalización',
    'curva-declinacion': 'Curva de Declinación',
    'asistente-ia': 'Asistente IA',
    'centro-reportes': 'Centro de Reportes',
    'config-alertas': 'Configuración de Alertas',
    'gestion-usuarios': 'Gestión de Usuarios y Roles',
    'onboarding': 'Alta de Activo y Pozos',
    'auditoria': 'Historial / Auditoría',
    'sincronizacion': 'Estado de Sincronización',
    'midstream-ductos': 'Midstream / Integridad de Ductos',
    'mantenimiento-eam': 'Mantenimiento Predictivo (EAM)',
    'emisiones-esg': 'Emisiones y Huella de Carbono ESG',
    'sala-monitoreo': 'Sala de Monitoreo Virtual',
};

const SCREENS: Record<Screen, React.ComponentType<any>> = {
    'dashboard-campo': DashboardCampo,
    'reporte-diario': ReporteDiario,
    'consola-voz': ConsolaVoz,
    'bitacora-npt': BitacoraNpt,
    'inventario-hse': InventarioHse,
    'matriz-pozos': MatrizPozos,
    'mapa-campo': MapaCampo,
    'monitor-scada': MonitorScada,
    'diagnostico-motores': DiagnosticoMotores,
    'dosificacion-quimica': DosificacionQuimica,
    'kpis-ejecutivos': KpisEjecutivos,
    'cumplimiento-cne': CumplimientoCne,
    'balance-fiscalizacion': BalanceFiscalizacion,
    'curva-declinacion': CurvaDeclinacion,
    'asistente-ia': AsistenteIA,
    'centro-reportes': CentroReportes,
    'config-alertas': ConfigAlertas,
    'gestion-usuarios': GestionUsuarios,
    'onboarding': Onboarding,
    'auditoria': Auditoria,
    'sincronizacion': Sincronizacion,
    'midstream-ductos': MidstreamDuctos,
    'mantenimiento-eam': MantenimientoEam,
    'emisiones-esg': EmisionesEsg,
    'sala-monitoreo': SalaMonitoreo,
};

export default function DemoIndex() {
    const [screen, setScreen] = useState<Screen>(() => {
        if (typeof window !== 'undefined') {
            const s = new URLSearchParams(window.location.search).get('screen');
            if (s && s in SCREENS) return s as Screen;
        }
        return 'dashboard-campo';
    });
    const Screen = SCREENS[screen];

    return (
        <>
            <Head title="Demo Interactiva — Oilboards" />

            {screen !== 'sala-monitoreo' && (
                <div className="fixed top-0 left-0 right-0 z-[60] bg-[#111827] border-b border-[#374151] py-2 px-4 text-center">
                    <span className="text-xs text-[#9CA3AF]">
                        🎭 <span className="text-[#F59E0B] font-semibold">MODO DEMO</span> — Datos simulados para ilustración.{' '}
                        <a href="/#cta" className="text-[#10B981] hover:underline">Solicita tu prueba piloto con datos reales →</a>
                    </span>
                </div>
            )}

            <AnimatePresence>
                {screen === 'sala-monitoreo' && (
                    <SalaMonitoreo onExit={() => setScreen('dashboard-campo')} />
                )}
            </AnimatePresence>

            {screen !== 'sala-monitoreo' && (
                <div className="flex bg-[#0B0F19] min-h-screen pt-[33px]">
                    <Sidebar current={screen} onChange={setScreen} />
                    <div className="flex-1 flex flex-col min-w-0">
                        <TopBar title={TITLES[screen]} description={SCREEN_DESC[screen]} />
                        <main className="flex-1 overflow-y-auto">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={screen}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <Screen />
                                </motion.div>
                            </AnimatePresence>
                        </main>
                    </div>
                </div>
            )}

            {/* Asistente omnipresente: flota sobre todo el demo y sabe en qué pantalla estás. */}
            <ChatWidget section={{ title: TITLES[screen], desc: SCREEN_DESC[screen] }} />
        </>
    );
}
