import { motion } from 'framer-motion';
import { Scale, FileCheck, Clock } from 'lucide-react';

const pillars = [
    {
        icon: Scale,
        title: 'Validación de Volumen Neto',
        description: 'Cálculo automático del volumen neto que coincide con los balances de la empresa productiva del Estado (exploración y comercialización). Cero discrepancias, cero fricciones.',
    },
    {
        icon: FileCheck,
        title: 'Cumplimiento CNE/SENER',
        description: 'Exporta tus reportes en los formatos exigidos por el regulador vigente en un clic. Sin transcripción manual, sin riesgo de errores humanos.',
    },
    {
        icon: Clock,
        title: 'Auditoría de NPT',
        description: 'Respaldo histórico inmutable de cada evento de paro. Documenta causas, duración y resolución para resolver disputas con la empresa estatal o subcontratistas.',
    },
];

export default function Regulatorio() {
    return (
        <section id="regulatorio" className="relative py-24 overflow-hidden scroll-mt-20">
            <div className="absolute inset-0 bg-[#0a0e17]" />
            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-14"
                >
                    <div className="text-[#10B981] text-xs font-semibold tracking-[0.25em] uppercase mb-4">
                        Cumplimiento Regulatorio
                    </div>
                    <h2 className="text-3xl lg:text-4xl font-extrabold text-white max-w-3xl mx-auto mb-4 leading-tight tracking-tight">
                        Cero errores humanos. Conciliaciones con la empresa estatal sin fricciones y <span className="text-gradient">reportes CNE en un clic.</span>
                    </h2>
                    <p className="text-[#9CA3AF] text-base max-w-2xl mx-auto">
                        En el sector energético de México, un reporte con datos erróneos detiene
                        tus pagos o activa penalizaciones multimillonarias. Oilboards blinda tu
                        operación automatizando el cumplimiento regulatorio.
                    </p>
                </motion.div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {pillars.map(({ icon: Icon, title, description }, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: i * 0.15 }}
                            className="glass rounded-2xl p-6 hover:border-[#10B981]/30 transition-colors"
                        >
                            <div className="w-12 h-12 bg-[#10B981]/10 rounded-xl flex items-center justify-center mb-5">
                                <Icon size={22} className="text-[#10B981]" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-3">{title}</h3>
                            <p className="text-[#9CA3AF] text-sm leading-relaxed">{description}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Regulatory logos strip */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7, delay: 0.5 }}
                    className="mt-12 pt-8 border-t border-[#374151] flex flex-wrap justify-center gap-8 text-sm text-[#6B7280]"
                >
                    {['CNE / SENER', 'ASEA', 'Empresa productiva del Estado', 'Transportista', 'Comercializadora'].map((entity, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#374151]" />
                            <span>{entity}</span>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
