import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardList, Radio, BarChart3, GitBranch, Wrench, Leaf } from 'lucide-react';

const modules = [
    {
        icon: ClipboardList,
        number: '01',
        title: 'Reporte Diario de Producción',
        tag: 'Captura y Campo',
        color: '#10B981',
        description: 'Captura desde celular sin señal, consolidación automática al reconectarse y cálculo de volumen neto sin intervención manual.',
        variables: [
            'Aceite neto (bbl/d)',
            'BSW (%)',
            'Volumen neto',
            'Gas asociado (Mscf/d)',
            'GOR (scf/bbl)',
            'Horas en producción',
            'Causa y duración de paro',
            'Consumo de diésel',
            'Eventos HSE',
        ],
        visual: (
            <div className="bg-[#0B0F19] rounded-xl border border-[#374151] p-4 space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-xs text-[#9CA3AF]">Reporte de Campo · POZO-101H</span>
                    <span className="text-xs bg-[#10B981]/20 text-[#10B981] px-2 py-0.5 rounded">Capturado ✓</span>
                </div>
                {[
                    { field: 'Aceite neto', value: '320 bbl/d', ok: true },
                    { field: 'BSW', value: '18.0%', ok: true },
                    { field: 'GOR', value: '1,220 scf/bbl', ok: true },
                    { field: 'Horas prod.', value: '23.5 h', ok: true },
                    { field: 'Eventos HSE', value: 'Ninguno', ok: true },
                ].map((row, i) => (
                    <div key={i} className="flex justify-between items-center py-1.5 border-b border-[#374151]/50">
                        <span className="text-xs text-[#9CA3AF]">{row.field}</span>
                        <span className={`text-xs font-mono font-semibold ${row.ok ? 'text-white' : 'text-[#EF4444]'}`}>{row.value}</span>
                    </div>
                ))}
                <div className="flex items-center gap-2 pt-1">
                    <div className="w-6 h-6 rounded-full bg-[#10B981]/20 flex items-center justify-center">
                        <span className="text-[10px]">🎙</span>
                    </div>
                    <span className="text-xs text-[#6B7280]">Nota de voz → IA → estructurado automáticamente</span>
                </div>
            </div>
        ),
    },
    {
        icon: Radio,
        number: '02',
        title: 'Monitoreo de Pozos y Telemetría',
        tag: 'Ingeniería y Telemetría',
        color: '#3B82F6',
        description: 'Vista en tiempo real de todos los pozos del activo. Integración con sistemas SCADA existentes sin alterar la infraestructura actual.',
        variables: [
            'THP (psi)',
            'FLP (psi)',
            'Temperatura de cabezal (°C)',
            'Hz/RPM/Amperaje del motor',
            'Status del pozo (semáforo)',
            'BHP (psi)',
            'Inyección de químicos (L/d)',
            'Vibración del motor (mm/s)',
        ],
        visual: (
            <div className="bg-[#0B0F19] rounded-xl border border-[#374151] p-4 space-y-3">
                <div className="text-xs text-[#9CA3AF] mb-2">Monitoreo en tiempo real — 08 pozos</div>
                <div className="grid grid-cols-2 gap-2">
                    {[
                        { name: 'POZO-101H', thp: '342 psi', status: 'active' },
                        { name: 'POZO-102H', thp: '298 psi ↓', status: 'alert' },
                        { name: 'POZO-105H', thp: '388 psi', status: 'active' },
                        { name: 'POZO-104',  thp: 'PARADO',   status: 'down' },
                    ].map((w, i) => {
                        const colors: Record<string, string> = {
                            active: '#10B981', alert: '#F59E0B', down: '#EF4444',
                        };
                        const c = colors[w.status] || '#10B981';
                        return (
                            <div key={i} className="bg-[#1F2937] rounded-lg p-2 border-l-2" style={{ borderColor: c }}>
                                <div className="text-[10px] font-semibold text-white">{w.name}</div>
                                <div className="text-xs font-mono mt-0.5" style={{ color: c }}>{w.thp}</div>
                            </div>
                        );
                    })}
                </div>
                <div className="bg-[#1F2937] rounded-lg p-2 border border-[#F59E0B]/30">
                    <div className="text-[9px] text-[#F59E0B] font-semibold">⚠️ Alerta activa — POZO-102H</div>
                    <div className="text-[8px] text-[#9CA3AF] mt-0.5">Riesgo gas-lock · THP cayendo</div>
                </div>
            </div>
        ),
    },
    {
        icon: BarChart3,
        number: '03',
        title: 'KPIs Ejecutivos y Estrategia',
        tag: 'Dirección y Estrategia',
        color: '#F59E0B',
        description: 'Dashboard para dirección. Cumplimiento CNE/SENER, curva de declinación y asistente IA en español claro — sin necesidad de Excel.',
        variables: [
            'Producción total (Mbd)',
            'Balance vs. Pemex',
            'Pronóstico vs. real',
            'Eficiencia operativa (%)',
            'Costo por barril (USD)',
            'Aprovechamiento de gas (%)',
            'Cumplimiento CNE/SENER',
            'Curva de declinación',
        ],
        visual: (
            <div className="bg-[#0B0F19] rounded-xl border border-[#374151] p-4 space-y-3">
                <div className="text-xs text-[#9CA3AF]">KPIs Junio 2026 — Activo Litoral Tabasco</div>
                <div className="grid grid-cols-2 gap-2">
                    {[
                        { label: 'Prod. neta mes', value: '72,450 bbl', up: true },
                        { label: 'Uptime global', value: '87.3%', up: true },
                        { label: 'Costo/barril', value: '$18.40 USD', up: false },
                        { label: 'Cumplimiento CNE', value: '104%', up: true },
                    ].map((k, i) => (
                        <div key={i} className="bg-[#1F2937] rounded-lg p-2">
                            <div className="text-[9px] text-[#6B7280]">{k.label}</div>
                            <div className="flex items-center justify-between mt-1">
                                <span className="text-sm font-bold font-mono text-white">{k.value}</span>
                                <span className={`text-[9px] font-semibold ${k.up ? 'text-[#10B981]' : 'text-[#9CA3AF]'}`}>
                                    {k.up ? '↑' : '↔'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex items-center justify-between text-xs">
                    <span className="text-[#9CA3AF]">Exportar reporte CNE/SENER</span>
                    <span className="text-[#10B981] font-semibold cursor-pointer hover:underline">→ Descargar PDF</span>
                </div>
            </div>
        ),
    },
    {
        icon: GitBranch,
        number: '04',
        title: 'Midstream e Integridad de Ductos',
        tag: 'Midstream / Anti-Huachicol',
        color: '#EC4899',
        description: 'Monitoreo de gasoductos y oleoductos en tiempo real. Detección automática de caídas de presión anómalas — la primera línea de defensa contra el huachicol.',
        variables: [
            'Presión por kilómetro (bar)',
            'Perfil de presión KP-0 a KP-82',
            'Balance de volumen entrada vs. salida',
            'Alerta de caída anómala (% desviación)',
            'Estaciones de compresión (estado/Hz)',
            'Temperatura de línea (°C)',
            'Volumen transportado (MMpcd)',
        ],
        visual: (
            <div className="bg-[#0B0F19] rounded-xl border border-[#374151] p-4 space-y-3">
                <div className="text-xs text-[#9CA3AF] mb-1">Gasoducto Litoral Tabasco – Carmen · 82 km</div>
                <div className="space-y-1.5">
                    {[
                        { seg: 'KP-00 a KP-12', bar: 98, ok: true },
                        { seg: 'KP-12 a KP-28', bar: 95, ok: true },
                        { seg: 'KP-28 a KP-42', bar: 90, ok: true },
                        { seg: 'KP-42 a KP-57', bar: 72, ok: false },
                        { seg: 'KP-57 a KP-70', bar: 88, ok: true },
                    ].map((s, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <span className="text-[9px] text-[#6B7280] w-24 flex-shrink-0">{s.seg}</span>
                            <div className="flex-1 bg-[#1F2937] rounded-full h-1.5">
                                <div className="h-1.5 rounded-full transition-all" style={{ width: `${s.bar}%`, backgroundColor: s.ok ? '#10B981' : '#EF4444' }} />
                            </div>
                            <span className={`text-[10px] font-mono font-bold w-12 text-right ${s.ok ? 'text-[#9CA3AF]' : 'text-[#EF4444]'}`}>{s.bar} bar</span>
                        </div>
                    ))}
                </div>
                <div className="bg-[#EF4444]/10 border border-[#EF4444]/40 rounded-lg p-2">
                    <div className="text-[9px] text-[#EF4444] font-bold">🚨 ALERTA — KP-42 a KP-57</div>
                    <div className="text-[8px] text-[#9CA3AF] mt-0.5">Caída de presión 18% · Posible extracción no autorizada</div>
                </div>
            </div>
        ),
    },
    {
        icon: Wrench,
        number: '05',
        title: 'Mantenimiento Predictivo (EAM)',
        tag: 'Gestión de Activos',
        color: '#8B5CF6',
        description: 'IA que predice fallas de equipos antes de que ocurran. Del diagnóstico automático a la orden de trabajo — sin intervención del ingeniero en el flujo.',
        variables: [
            'Días estimados a falla (ML)',
            'Confianza del modelo (%)',
            'Historial de intervenciones',
            'Inventario de refacciones en almacén',
            'Órdenes de trabajo (OT) auto-generadas',
            'Costo estimado de la intervención',
            'Prioridad y tipo de mantenimiento',
        ],
        visual: (
            <div className="bg-[#0B0F19] rounded-xl border border-[#374151] p-4 space-y-3">
                <div className="text-xs text-[#9CA3AF] mb-1">Estado de activos críticos</div>
                {[
                    { name: 'BEC Reda N4500', well: 'POZO-102H', days: 6, conf: 82, critical: true },
                    { name: 'Compresor C-12', well: 'POZO-103',  days: 14, conf: 71, critical: false },
                    { name: 'BM Weatherford', well: 'POZO-108',  days: 28, conf: 65, critical: false },
                ].map((a, i) => (
                    <div key={i} className="flex items-center gap-3 bg-[#1F2937] rounded-lg p-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold font-mono ${a.critical ? 'bg-[#EF4444]/20 text-[#EF4444]' : 'bg-[#F59E0B]/20 text-[#F59E0B]'}`}>
                            {a.days}d
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-[10px] font-semibold text-white truncate">{a.name}</div>
                            <div className="text-[9px] text-[#6B7280]">{a.well} · Confianza {a.conf}%</div>
                        </div>
                        <div className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${a.critical ? 'bg-[#EF4444]/20 text-[#EF4444]' : 'bg-[#F59E0B]/20 text-[#F59E0B]'}`}>
                            {a.critical ? 'CRÍTICO' : 'AVISO'}
                        </div>
                    </div>
                ))}
                <div className="flex items-center gap-2 pt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6] flex-shrink-0" />
                    <span className="text-[9px] text-[#6B7280]">OT auto-generada para POZO-102H · Pendiente autorización</span>
                </div>
            </div>
        ),
    },
    {
        icon: Leaf,
        number: '06',
        title: 'Emisiones y Huella de Carbono ESG',
        tag: 'Sustentabilidad / ESG',
        color: '#10B981',
        description: 'Monitoreo de aprovechamiento de gas, quema en antorcha y emisiones CO₂e. Cumplimiento CNE/SENER y ASEA — reportes regulatorios en un clic.',
        variables: [
            'Aprovechamiento de gas (%)',
            'Gas quemado/venteado (MMpcd)',
            'Emisiones CO₂e (ton/mes)',
            'Intensidad de emisiones (kg CO₂e/bbl)',
            'Conversión paros → CO₂e',
            'Cumplimiento ASEA (Res. 003)',
            'Exportación a reporte CNE/SENER',
        ],
        visual: (
            <div className="bg-[#0B0F19] rounded-xl border border-[#374151] p-4 space-y-3">
                <div className="text-xs text-[#9CA3AF] mb-1">Jun 2026 — Activo Litoral Tabasco</div>
                <div className="grid grid-cols-2 gap-2">
                    {[
                        { label: 'Gas aprovechado', value: '95.8%', meta: '98.0% meta CNE', warn: true },
                        { label: 'CO₂e mes', value: '318.6 ton', meta: 'Acumulado jun', warn: false },
                        { label: 'Gas quemado', value: '0.89 MMpcd', meta: 'Quema antorcha', warn: false },
                        { label: 'Intensidad', value: '4.82 kg/bbl', meta: 'CO₂e por barril', warn: false },
                    ].map((k, i) => (
                        <div key={i} className="bg-[#1F2937] rounded-lg p-2">
                            <div className="text-[9px] text-[#6B7280]">{k.label}</div>
                            <div className={`text-sm font-bold font-mono mt-0.5 ${k.warn ? 'text-[#F59E0B]' : 'text-white'}`}>{k.value}</div>
                            <div className="text-[8px] text-[#6B7280]">{k.meta}</div>
                        </div>
                    ))}
                </div>
                <div className="flex items-center justify-between text-xs">
                    <span className="text-[#9CA3AF]">Exportar reporte ASEA</span>
                    <span className="text-[#10B981] font-semibold cursor-pointer hover:underline">→ Descargar PDF</span>
                </div>
            </div>
        ),
    },
];

export default function LosTresModulos() {
    const [active, setActive] = useState(0);

    return (
        <section id="modulos" className="relative py-24 overflow-hidden scroll-mt-20">
            <div className="absolute inset-0 bg-[#0B0F19]" />
            <div className="absolute top-0 right-1/4 w-[600px] h-[400px] bg-[#10B981]/6 rounded-full blur-[130px]" />
            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-14"
                >
                    <div className="text-[#10B981] text-xs font-semibold tracking-[0.25em] uppercase mb-4">
                        Seis Módulos Integrados
                    </div>
                    <h2 className="text-3xl lg:text-5xl font-extrabold text-white mb-4 tracking-tight">
                        Todo lo que opera <span className="text-gradient">un activo petrolero.</span>
                    </h2>
                    <p className="text-[#9CA3AF] text-base max-w-2xl mx-auto">
                        Desde la captura en campo hasta el cumplimiento regulatorio y la huella de carbono.
                        Sin Excel intermedios, sin PDFs perdidos, sin reportes duplicados.
                    </p>
                </motion.div>

                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Tabs */}
                    <div className="lg:w-80 flex-shrink-0 space-y-1.5">
                        {modules.map((mod, i) => {
                            const Icon = mod.icon;
                            const isActive = active === i;
                            return (
                                <button
                                    key={i}
                                    onClick={() => setActive(i)}
                                    className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                                        isActive
                                            ? 'glass border-opacity-50'
                                            : 'bg-[#111827]/60 border-[#1F2937] hover:border-[#374151]'
                                    }`}
                                    style={isActive ? { borderColor: `${mod.color}60` } : {}}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: isActive ? `${mod.color}20` : '#37415180' }}>
                                            <Icon size={16} style={{ color: isActive ? mod.color : '#6B7280' }} />
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-bold" style={{ color: isActive ? mod.color : '#6B7280' }}>
                                                MÓDULO {mod.number}
                                            </div>
                                            <div className={`text-[13px] font-semibold leading-tight ${isActive ? 'text-white' : 'text-[#9CA3AF]'}`}>
                                                {mod.tag}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Content panel */}
                    <div className="flex-1">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={active}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                                className="glass rounded-2xl p-6"
                            >
                                <div className="grid lg:grid-cols-2 gap-6">
                                    <div>
                                        <div className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: modules[active].color }}>
                                            Módulo {modules[active].number}
                                        </div>
                                        <h3 className="text-xl font-extrabold text-white mb-3">
                                            {modules[active].title}
                                        </h3>
                                        <p className="text-[#9CA3AF] text-sm leading-relaxed mb-5">
                                            {modules[active].description}
                                        </p>
                                        <div className="space-y-2">
                                            <div className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-2">
                                                Variables incluidas
                                            </div>
                                            {modules[active].variables.map((v, i) => (
                                                <div key={i} className="flex items-center gap-2 text-sm text-[#D1D5DB]">
                                                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: modules[active].color }} />
                                                    {v}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        {modules[active].visual}
                                    </div>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </section>
    );
}
