import { motion } from 'framer-motion';
import { Clock, MonitorPlay, BrainCircuit, FileCheck2, Smartphone, Wallet, ShieldCheck, Check, X } from 'lucide-react';
import { SectionLabel } from '@/Components/ui/primitives';

const rows = [
    {
        icon: Clock,
        feature: 'Tiempo de despliegue',
        ob: { title: '48 horas', desc: 'Infraestructura en la nube lista para operar de inmediato.' },
        trad: { title: '3 a 6 meses', desc: 'Requiere instalación de servidores locales y configuración compleja.' },
    },
    {
        icon: MonitorPlay,
        feature: 'Monitoreo y salas de control',
        ob: { title: 'Salas virtuales instantáneas', desc: 'Funciona en pantallas comerciales vía URLs y WebSockets.' },
        trad: { title: 'Alta fricción', desc: 'Exige licencias costosas por pantalla y hardware industrial.' },
    },
    {
        icon: BrainCircuit,
        feature: 'Análisis de información',
        ob: { title: 'IA predictiva', desc: 'Motor híbrido (ML + Claude) que traduce datos a acciones en español claro.' },
        trad: { title: 'Historiadores pasivos', desc: 'Gráficas frías que solo dicen qué falló ayer, no qué fallará mañana.' },
    },
    {
        icon: FileCheck2,
        feature: 'Cumplimiento regulatorio',
        ob: { title: 'Nativo México', desc: 'Reportes CNE/SENER en un clic y balance exacto con Pemex.' },
        trad: { title: 'Nulo / rígido', desc: 'Requiere costosas consultorías externas para adaptar el sistema a las leyes locales.' },
    },
    {
        icon: Smartphone,
        feature: 'Operación en campo terrestre/marino',
        ob: { title: 'Captura móvil 100% offline', desc: 'Sincronización automática al detectar red celular o WiFi.' },
        trad: { title: 'Papel y Excel', desc: 'Dependencia total de bitácoras manuales y reportes atrasados por WhatsApp.' },
    },
    {
        icon: Wallet,
        feature: 'Esquema de inversión',
        ob: { title: 'Presupuesto 100% predecible', desc: 'Suscripción mensual por pozo activo (SaaS), sin cargos ocultos.' },
        trad: { title: 'Opaco', desc: 'Licenciamiento perpetuo masivo, cargos por usuario extra y soporte caro.' },
    },
    {
        icon: ShieldCheck,
        feature: 'Validación de riesgo',
        ob: { title: 'Piloto de 14 días sin costo', desc: 'En un pozo seleccionado antes de contratar.' },
        trad: { title: 'Cero flexibilidad', desc: 'Exigen contratos cerrados y firmas antes de ver el software.' },
    },
];

export default function Comparativa() {
    return (
        <section id="comparativa" className="relative py-24 overflow-hidden scroll-mt-20">
            <div className="absolute inset-0 bg-[#0a0e17]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-[#10B981]/8 rounded-full blur-[130px]" />

            <div className="max-w-6xl mx-auto px-6 relative z-10">
                <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
                    <SectionLabel>Oilboards vs. Software tradicional</SectionLabel>
                    <h2 className="text-3xl lg:text-5xl font-extrabold text-white mt-4 mb-4 tracking-tight">
                        No es un SCADA más. <span className="text-gradient">Es otra categoría.</span>
                    </h2>
                    <p className="text-[#9CA3AF] text-base max-w-2xl mx-auto">
                        Comparado con los proveedores tradicionales (SCADAs de Houston o Europa),
                        Oilboards opera en otra liga de velocidad, costo y cumplimiento.
                    </p>
                </motion.div>

                {/* Encabezados de columna */}
                <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1.4fr_1.4fr] gap-x-4 mb-3">
                    <div className="hidden lg:block" />
                    <div className="glass rounded-2xl glow-green border-[#10B981]/40 px-5 py-4 text-center relative">
                        <div className="text-lg font-extrabold text-white flex items-center justify-center gap-2">🚀 Oilboards</div>
                        <div className="text-[11px] text-[#10B981]">Plataforma operativa · México</div>
                    </div>
                    <div className="rounded-2xl border border-[#1F2937] bg-[#111827]/40 px-5 py-4 text-center">
                        <div className="text-lg font-bold text-[#9CA3AF] flex items-center justify-center gap-2">🏛️ Proveedores tradicionales</div>
                        <div className="text-[11px] text-[#6B7280]">SCADAs de Houston / Europa</div>
                    </div>
                </div>

                {/* Filas */}
                <div className="space-y-2">
                    {rows.map((r, i) => {
                        const Icon = r.icon;
                        return (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.06 }}
                                className="grid grid-cols-1 lg:grid-cols-[1.1fr_1.4fr_1.4fr] gap-x-4 gap-y-2 items-stretch"
                            >
                                {/* Feature */}
                                <div className="flex items-center gap-3 px-2 lg:px-4 py-3">
                                    <div className="w-9 h-9 rounded-lg glass flex items-center justify-center flex-shrink-0">
                                        <Icon size={16} className="text-[#10B981]" />
                                    </div>
                                    <span className="text-sm font-semibold text-white">{r.feature}</span>
                                </div>

                                {/* Oilboards */}
                                <div className="rounded-xl bg-[#10B981]/[0.07] border border-[#10B981]/25 px-4 py-3 flex items-start gap-2.5">
                                    <Check size={16} className="text-[#10B981] flex-shrink-0 mt-0.5" />
                                    <div>
                                        <div className="text-sm font-bold text-white">{r.ob.title}</div>
                                        <div className="text-xs text-[#9CA3AF] leading-snug mt-0.5">{r.ob.desc}</div>
                                    </div>
                                </div>

                                {/* Tradicional */}
                                <div className="rounded-xl border border-[#1F2937] bg-[#111827]/30 px-4 py-3 flex items-start gap-2.5">
                                    <X size={16} className="text-[#EF4444]/70 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <div className="text-sm font-semibold text-[#9CA3AF]">{r.trad.title}</div>
                                        <div className="text-xs text-[#6B7280] leading-snug mt-0.5">{r.trad.desc}</div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mt-12">
                    <a href="#cta" className="inline-flex items-center gap-2 bg-[#10B981] hover:bg-[#059669] text-white font-bold px-7 py-4 rounded-xl text-base transition-all hover:scale-105 glow-green">
                        Comprobar la diferencia en un piloto de 14 días →
                    </a>
                </motion.div>
            </div>
        </section>
    );
}
