import { motion } from 'framer-motion';
import { Cpu, Brain } from 'lucide-react';

export default function LaIA() {
    return (
        <section id="ia" className="relative py-24 overflow-hidden scroll-mt-20">
            <div className="absolute inset-0 bg-gradient-to-b from-[#0B0F19] to-[#0a0e17]" />
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-[#F59E0B]/6 rounded-full blur-[130px]" />
            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-14"
                >
                    <div className="text-[#10B981] text-xs font-semibold tracking-[0.25em] uppercase mb-4">
                        Inteligencia Artificial
                    </div>
                    <h2 className="text-3xl lg:text-4xl font-extrabold text-white max-w-3xl mx-auto leading-tight mb-4">
                        El software tradicional te dice qué pasó ayer.{' '}
                        <span className="text-[#F59E0B]">Oilboards te dice qué va a fallar mañana.</span>
                    </h2>
                    <p className="text-[#9CA3AF] text-base max-w-2xl mx-auto">
                        Nuestro motor híbrido de Inteligencia Artificial transforma los datos fríos
                        en acciones preventivas para proteger tu producción y reducir el NPT.
                    </p>
                </motion.div>

                <div className="grid lg:grid-cols-2 gap-8 mb-12">
                    {/* Block 1 — ML */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="glass rounded-2xl p-6"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-[#10B981]/10 rounded-xl flex items-center justify-center">
                                <Cpu size={20} className="text-[#10B981]" />
                            </div>
                            <div>
                                <div className="text-xs text-[#10B981] font-bold uppercase tracking-wider">Capa 1</div>
                                <div className="text-white font-bold">El Analista Numérico</div>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {[
                                'Algoritmos estadísticos escanean presiones y temperaturas 24/7',
                                'Detectan micro-desviaciones invisibles al ojo humano',
                                'Costo computacional mínimo — corre en nuestros servidores',
                            ].map((item, i) => (
                                <div key={i} className="flex items-start gap-2 text-sm text-[#9CA3AF]">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] flex-shrink-0 mt-1.5" />
                                    {item}
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 bg-[#0B0F19] rounded-lg p-3 font-mono text-xs text-[#10B981]">
                            Motor propietario de detección de anomalías
                        </div>
                    </motion.div>

                    {/* Block 2 — Ingeniero Virtual */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="glass rounded-2xl p-6"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-[#3B82F6]/10 rounded-xl flex items-center justify-center">
                                <Brain size={20} className="text-[#3B82F6]" />
                            </div>
                            <div>
                                <div className="text-xs text-[#3B82F6] font-bold uppercase tracking-wider">Capa 2</div>
                                <div className="text-white font-bold">El Ingeniero Virtual</div>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {[
                                'Traduce alertas numéricas en recomendaciones técnicas en español claro',
                                'Procesa bitácoras de voz del operador y las estructura automáticamente',
                                'Tus datos son 100% privados — nunca se usan para entrenar modelos públicos',
                            ].map((item, i) => (
                                <div key={i} className="flex items-start gap-2 text-sm text-[#9CA3AF]">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] flex-shrink-0 mt-1.5" />
                                    {item}
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 bg-[#0B0F19] rounded-lg p-3 font-mono text-xs text-[#3B82F6]">
                            Motor de IA Oilboards · Capa cognitiva
                        </div>
                    </motion.div>
                </div>

                {/* Alert card */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="max-w-lg mx-auto"
                >
                    <motion.div
                        animate={{ boxShadow: ['0 0 0 0px rgba(245,158,11,0.3)', '0 0 0 8px rgba(245,158,11,0)', '0 0 0 0px rgba(245,158,11,0)'] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="bg-[#1F2937] border border-[#F59E0B] rounded-2xl p-6"
                    >
                        {/* iPhone-style notification header */}
                        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-[#374151]">
                            <div className="w-10 h-10 bg-[#F59E0B]/20 rounded-xl flex items-center justify-center text-xl">
                                ⚠️
                            </div>
                            <div className="flex-1">
                                <div className="text-white font-bold text-sm">ALERTA PREDICTIVA — POZO-101H</div>
                                <div className="text-[#9CA3AF] text-xs">Riesgo de bloqueo por gas (Gas-Lock)</div>
                            </div>
                            <div className="text-xs text-[#6B7280]">ahora</div>
                        </div>

                        <div className="space-y-3 text-sm">
                            <div>
                                <div className="text-[#6B7280] text-xs font-semibold uppercase tracking-wider mb-1">Diagnóstico</div>
                                <p className="text-[#D1D5DB] text-sm leading-relaxed">
                                    La caída del 12% en THP combinada con picos de vibración indica
                                    segregación de gas en la bomba electrocentrífuga.
                                </p>
                            </div>
                            <div>
                                <div className="text-[#6B7280] text-xs font-semibold uppercase tracking-wider mb-1">Recomendación</div>
                                <p className="text-[#D1D5DB] text-sm leading-relaxed">
                                    Revisar frecuencia del variador según procedimiento operativo
                                    del activo. Monitorear en 30 min.
                                </p>
                            </div>
                            <div className="flex items-center gap-4 pt-2">
                                <span className="flex items-center gap-1.5 text-xs">
                                    <span className="w-2 h-2 rounded-full bg-[#EF4444] inline-block" />
                                    <span className="text-[#9CA3AF]">Urgencia: <span className="text-[#EF4444] font-semibold">ALTA</span></span>
                                </span>
                                <span className="flex items-center gap-1.5 text-xs">
                                    <span className="w-2 h-2 rounded-full bg-[#F59E0B] inline-block" />
                                    <span className="text-[#9CA3AF]">Confianza: <span className="text-[#F59E0B] font-semibold">Media</span></span>
                                </span>
                                <span className="text-xs text-[#6B7280]">ML · Oilboards</span>
                            </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-[#374151] flex gap-2">
                            <button className="flex-1 text-xs font-semibold text-white bg-[#10B981] py-2 rounded-lg hover:bg-[#059669] transition-colors">
                                ✓ Acusar recibo
                            </button>
                            <button className="flex-1 text-xs font-semibold text-[#9CA3AF] border border-[#374151] py-2 rounded-lg hover:border-[#EF4444] hover:text-[#EF4444] transition-colors">
                                ✗ Resolver
                            </button>
                        </div>

                        <p className="text-[9px] text-[#6B7280] mt-3 text-center">
                            ⚠️ Sugerencia sujeta a validación del ingeniero responsable.
                        </p>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
}
