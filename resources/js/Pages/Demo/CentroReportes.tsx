import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, FileSpreadsheet, Download, Loader2, Check } from 'lucide-react';
import { DEMO_REPORT_TYPES, DEMO_EXPORTS } from '@/data/demoData';

export default function CentroReportes() {
    const [generating, setGenerating] = useState<string | null>(null);
    const [done, setDone] = useState<string | null>(null);

    const generate = async (code: string) => {
        setGenerating(code); setDone(null);
        await new Promise((r) => setTimeout(r, 2000));
        setGenerating(null); setDone(code);
    };

    return (
        <div className="p-6">
            <div className="mb-6">
                <h2 className="text-lg font-bold text-white">Centro de Reportes y Exportación</h2>
                <p className="text-sm text-[#9CA3AF]">Genera reportes regulatorios con un clic · PDF y Excel · formato CNE/SENER</p>
            </div>

            <div className="grid lg:grid-cols-3 gap-4 mb-8">
                {DEMO_REPORT_TYPES.map((rt) => (
                    <div key={rt.code} className="glass rounded-2xl p-5 flex flex-col">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-9 h-9 rounded-lg bg-[#10B981]/10 flex items-center justify-center">
                                <FileText size={16} className="text-[#10B981]" />
                            </div>
                            <span className="text-[10px] text-[#6B7280]">{rt.audience}</span>
                        </div>
                        <div className="text-sm font-bold text-white mb-1">{rt.name}</div>
                        <p className="text-xs text-[#9CA3AF] leading-relaxed flex-1">{rt.desc}</p>
                        <div className="mt-4 flex items-center gap-2">
                            <button
                                onClick={() => generate(rt.code)}
                                disabled={generating === rt.code}
                                className="flex items-center gap-1.5 bg-[#10B981] hover:bg-[#059669] disabled:opacity-60 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
                            >
                                {generating === rt.code ? <Loader2 size={13} className="animate-spin" /> : done === rt.code ? <Check size={13} /> : <Download size={13} />}
                                {generating === rt.code ? 'Generando…' : done === rt.code ? 'Listo' : 'Generar'}
                            </button>
                            <div className="flex gap-1">
                                {rt.formats.map((f) => (
                                    <span key={f} className="text-[9px] text-[#6B7280] border border-[#374151] px-1.5 py-0.5 rounded">{f}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="glass rounded-2xl overflow-hidden">
                <div className="px-5 py-3 border-b border-[#1F2937] text-sm font-semibold text-white">Reportes generados recientemente</div>
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-[10px] uppercase tracking-wider text-[#6B7280] border-b border-[#1F2937]">
                            <th className="text-left font-medium px-5 py-2">Reporte</th>
                            <th className="text-left font-medium px-5 py-2">Formato</th>
                            <th className="text-left font-medium px-5 py-2">Período</th>
                            <th className="text-left font-medium px-5 py-2">Generado por</th>
                            <th className="text-right font-medium px-5 py-2">Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        {DEMO_EXPORTS.map((e) => (
                            <motion.tr key={e.id} className="border-b border-[#1F2937]/50 hover:bg-[#1F2937]/30">
                                <td className="px-5 py-3 font-medium text-white">{e.type}</td>
                                <td className="px-5 py-3">
                                    <span className="flex items-center gap-1.5 text-xs text-[#9CA3AF]">
                                        {e.format === 'PDF' ? <FileText size={13} className="text-[#EF4444]" /> : <FileSpreadsheet size={13} className="text-[#10B981]" />}
                                        {e.format}
                                    </span>
                                </td>
                                <td className="px-5 py-3 text-xs text-[#9CA3AF]">{e.period}</td>
                                <td className="px-5 py-3 text-xs text-[#9CA3AF]">{e.by} · {e.at}</td>
                                <td className="px-5 py-3 text-right">
                                    <button className="inline-flex items-center gap-1.5 text-xs text-[#10B981] hover:text-white transition-colors">
                                        <Download size={13} /> Descargar
                                    </button>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
