import { motion } from 'framer-motion';
import { Smartphone, PenLine, RadioTower, Brain, LayoutDashboard, FileSpreadsheet, ArrowRight } from 'lucide-react';

// Sección "Cómo llegan tus datos a Oilboards" — responde la pregunta del director:
// "¿cómo entra mi dato a esto?". 3 vías de captura → capa de IA → Oilboards.
const fuentes = [
    {
        icon: Smartphone,
        tag: 'CAMPO',
        title: 'App móvil + Dictado por voz',
        description: 'El operador captura su reporte offline o lo dicta por voz. La IA lo transcribe y lo estructura automáticamente — sin transcripción manual.',
        meta: 'Producción · BSW · horas · paros · HSE',
    },
    {
        icon: PenLine,
        tag: 'OFICINA',
        title: 'Captura manual del staff',
        description: 'El ingeniero ajusta, concilia y complementa desde formularios web lo que no viene de campo ni de los sensores.',
        meta: 'Ajustes · conciliaciones · notas',
    },
    {
        icon: RadioTower,
        tag: 'AUTOMÁTICO',
        title: 'Telemetría / SCADA',
        description: 'Integración con tus PLCs y RTUs existentes. Presiones y datos de motor en tiempo real — sin alterar tu infraestructura actual.',
        meta: 'THP · FLP · PIP · Hz · Amp · vibración',
    },
];

export default function FlujoDatos() {
    return (
        <section id="flujo" className="relative py-24 overflow-hidden scroll-mt-20">
            <div className="absolute inset-0 bg-[#0B0F19]" />
            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-14"
                >
                    <div className="text-[#10B981] text-xs font-semibold tracking-[0.25em] uppercase mb-4">
                        Flujo de Operación
                    </div>
                    <h2 className="text-3xl lg:text-4xl font-extrabold text-white max-w-3xl mx-auto mb-4 leading-tight tracking-tight">
                        Tus datos llegan a Oilboards desde donde ya operas. <span className="text-gradient">Sin cambiar tu infraestructura.</span>
                    </h2>
                    <p className="text-[#9CA3AF] text-base max-w-2xl mx-auto">
                        Tres vías de captura convergen en una sola plataforma: el campo, la oficina y
                        tus sensores. La inteligencia artificial las interpreta y las convierte en
                        decisiones.
                    </p>
                </motion.div>

                {/* 3 fuentes de dato */}
                <div className="grid lg:grid-cols-3 gap-6">
                    {fuentes.map(({ icon: Icon, tag, title, description, meta }, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: i * 0.12 }}
                            className="glass rounded-2xl p-6 hover:border-[#10B981]/30 transition-colors flex flex-col"
                        >
                            <div className="flex items-center justify-between mb-5">
                                <div className="w-12 h-12 bg-[#10B981]/10 rounded-xl flex items-center justify-center">
                                    <Icon size={22} className="text-[#10B981]" />
                                </div>
                                <span className="text-[10px] font-bold tracking-[0.2em] text-[#6B7280]">{tag}</span>
                            </div>
                            <h3 className="text-lg font-bold text-white mb-3">{title}</h3>
                            <p className="text-[#9CA3AF] text-sm leading-relaxed mb-4 flex-1">{description}</p>
                            <div className="text-[11px] font-mono text-[#6B7280] border-t border-[#374151] pt-3">{meta}</div>
                        </motion.div>
                    ))}
                </div>

                {/* Flujo: fuentes → IA → Oilboards */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="mt-10 glass rounded-2xl p-6 lg:p-8"
                >
                    <div className="flex flex-col lg:flex-row items-stretch gap-4">
                        <div className="flex-1 rounded-xl border border-[#374151] bg-[#111827]/60 p-5 text-center flex flex-col items-center justify-center">
                            <div className="text-[10px] font-bold tracking-[0.2em] text-[#6B7280] mb-2">LAS 3 VÍAS</div>
                            <div className="text-sm text-[#D1D5DB]">Campo · Oficina · SCADA</div>
                            <div className="text-[11px] text-[#6B7280] mt-1">meten el dato crudo</div>
                        </div>

                        <div className="flex items-center justify-center text-[#10B981]">
                            <ArrowRight size={24} className="rotate-90 lg:rotate-0" />
                        </div>

                        <div className="flex-1 rounded-xl border border-[#3B82F6]/30 bg-[#3B82F6]/5 p-5 text-center flex flex-col items-center justify-center">
                            <div className="w-10 h-10 bg-[#3B82F6]/10 rounded-lg flex items-center justify-center mb-2">
                                <Brain size={20} className="text-[#3B82F6]" />
                            </div>
                            <div className="text-sm font-bold text-white">Capa de IA</div>
                            <div className="text-[11px] text-[#6B7280] mt-1">estructura, detecta anomalías y recomienda</div>
                        </div>

                        <div className="flex items-center justify-center text-[#10B981]">
                            <ArrowRight size={24} className="rotate-90 lg:rotate-0" />
                        </div>

                        <div className="flex-1 rounded-xl border border-[#10B981]/30 bg-[#10B981]/5 p-5 text-center flex flex-col items-center justify-center">
                            <div className="w-10 h-10 bg-[#10B981]/10 rounded-lg flex items-center justify-center mb-2">
                                <LayoutDashboard size={20} className="text-[#10B981]" />
                            </div>
                            <div className="text-sm font-bold text-white">Oilboards</div>
                            <div className="text-[11px] text-[#6B7280] mt-1">tableros, Sala de Monitoreo y reportes CNE</div>
                        </div>
                    </div>

                    {/* Nota de importación / onboarding */}
                    <div className="mt-6 pt-5 border-t border-[#374151] flex items-center justify-center gap-3 text-center">
                        <FileSpreadsheet size={16} className="text-[#9CA3AF] flex-shrink-0" />
                        <p className="text-sm text-[#9CA3AF]">
                            ¿Tu histórico vive en Excel? <span className="text-white font-semibold">Lo migramos en el onboarding</span> — más integración por API con tus sistemas actuales.
                        </p>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
