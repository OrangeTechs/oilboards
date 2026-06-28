import { motion } from 'framer-motion';
import { Check, ArrowRight } from 'lucide-react';

const features = [
    'Hasta 40 pozos activos por campo',
    'Usuarios e instalaciones de app móvil ilimitadas',
    'Integración con sistemas SCADA existentes',
    'Motor de IA Predictiva completo (ML + Claude)',
    'Soporte técnico prioritario 24/7',
    'Salas de Monitoreo Virtuales',
    'Módulo de cumplimiento CNE/SENER',
    'Exportación automática de reportes a Pemex',
];

export default function Precios() {
    return (
        <section id="precios" className="relative py-24 overflow-hidden scroll-mt-20">
            <div className="absolute inset-0 bg-[#0B0F19]" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-[#10B981]/8 rounded-full blur-[130px]" />
            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-14"
                >
                    <div className="text-[#10B981] text-xs font-semibold tracking-[0.25em] uppercase mb-4">
                        Precios
                    </div>
                    <h2 className="text-3xl lg:text-5xl font-extrabold text-white mb-4 tracking-tight">
                        Un plan fijo. <span className="text-gradient">Presupuestos 100% predecibles.</span>
                    </h2>
                    <p className="text-[#9CA3AF] text-base max-w-xl mx-auto">
                        Sin cobros por usuario extra, sin penalizaciones por expandir tu campo.
                    </p>
                </motion.div>

                <div className="max-w-3xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="relative glass rounded-3xl overflow-hidden glow-green"
                    >
                        {/* Top accent line */}
                        <div className="h-1 bg-gradient-to-r from-[#10B981] via-[#059669] to-[#047857]" />

                        <div className="p-8 lg:p-12">
                            {/* Badge */}
                            <div className="flex items-center justify-between mb-6">
                                <span className="inline-flex items-center gap-2 bg-[#1F2937] border border-[#374151] text-[#F9FAFB] text-xs font-bold px-4 py-2 rounded-full uppercase tracking-widest">
                                    Enterprise por Activo
                                </span>
                                <span className="text-xs text-[#10B981] font-semibold bg-[#10B981]/10 px-3 py-1 rounded-full">
                                    Prueba piloto 14 días sin costo
                                </span>
                            </div>

                            <div className="grid lg:grid-cols-2 gap-8">
                                {/* Pricing */}
                                <div>
                                    <div className="mb-6">
                                        <div className="text-[#9CA3AF] text-sm mb-1">Fee de implementación (pago único)</div>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-4xl font-extrabold text-white font-mono">USD</span>
                                            <span className="text-[#9CA3AF] text-sm">a cotizar</span>
                                        </div>
                                        <div className="text-xs text-[#6B7280] mt-1">
                                            Configuración, integración SCADA, carga de manuales en IA, capacitación
                                        </div>
                                    </div>

                                    <div className="h-px bg-[#374151] mb-6" />

                                    <div>
                                        <div className="text-[#9CA3AF] text-sm mb-1">Suscripción mensual</div>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-4xl font-extrabold text-[#10B981] font-mono">USD</span>
                                            <span className="text-[#9CA3AF] text-sm">a cotizar / mes</span>
                                        </div>
                                        <div className="text-xs text-[#6B7280] mt-1">
                                            Suscripción anual por activo · esquema 100% predecible
                                        </div>
                                    </div>

                                    <a
                                        href="#cta"
                                        className="mt-8 flex items-center justify-center gap-2 bg-[#10B981] hover:bg-[#059669] text-white font-bold px-6 py-4 rounded-xl text-base transition-all hover:scale-105 shadow-lg shadow-[#10B981]/20 w-full"
                                    >
                                        Iniciar Prueba Piloto de 14 días
                                        <ArrowRight size={18} />
                                    </a>
                                    <p className="text-xs text-[#6B7280] text-center mt-3">
                                        La prueba piloto es sin costo en un pozo seleccionado de tu activo.
                                    </p>
                                </div>

                                {/* Features */}
                                <div>
                                    <div className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-4">
                                        Incluye
                                    </div>
                                    <div className="space-y-3">
                                        {features.map((f, i) => (
                                            <div key={i} className="flex items-center gap-3">
                                                <div className="w-5 h-5 rounded-full bg-[#10B981]/20 flex items-center justify-center flex-shrink-0">
                                                    <Check size={11} className="text-[#10B981]" />
                                                </div>
                                                <span className="text-sm text-[#D1D5DB]">{f}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Comparison note */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        className="text-center text-xs text-[#6B7280] mt-6"
                    >
                        ¿Quieres comparar con tu costo actual de NPT evitable?{' '}
                        <a href="#cta" className="text-[#10B981] hover:underline">Solicita el análisis ROI →</a>
                    </motion.p>
                </div>
            </div>
        </section>
    );
}
