import { Shield, Link2 } from 'lucide-react';
import { DEMO_AUDIT } from '@/data/demoData';
import { C } from '@/lib/chart';

const ACTION_COLOR: Record<string, string> = {
    created: C.green, updated: C.yellow, exported: C.blue, login: C.faint,
};

export default function Auditoria() {
    return (
        <div className="p-6 max-w-4xl">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-bold text-white">Historial / Auditoría</h2>
                    <p className="text-sm text-[#9CA3AF]">Bitácora inmutable con hash encadenado · a prueba de manipulación</p>
                </div>
                <span className="flex items-center gap-1.5 text-xs glass px-3 py-1.5 rounded-full text-[#10B981]">
                    <Shield size={12} /> Cadena íntegra
                </span>
            </div>

            <div className="glass rounded-2xl p-5">
                <div className="relative">
                    {DEMO_AUDIT.map((log, i) => (
                        <div key={log.id} className="flex gap-4 pb-5 last:pb-0">
                            {/* línea de tiempo */}
                            <div className="flex flex-col items-center">
                                <div className="w-3 h-3 rounded-full flex-shrink-0 mt-1" style={{ backgroundColor: ACTION_COLOR[log.action] }} />
                                {i < DEMO_AUDIT.length - 1 && <div className="w-px flex-1 bg-[#374151] my-1" />}
                            </div>
                            <div className="flex-1 pb-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-white">
                                        <span className="font-semibold">{log.user}</span>{' '}
                                        <span className="text-[#9CA3AF]">· {log.action}</span>
                                    </span>
                                    <span className="text-xs text-[#6B7280] font-mono">{log.timestamp}</span>
                                </div>
                                <div className="text-sm text-[#D1D5DB] mt-0.5">{log.target}</div>
                                <div className="flex items-center gap-2 mt-1.5 text-[10px] font-mono text-[#6B7280]">
                                    <Link2 size={10} className="text-[#10B981]" />
                                    <span>hash: <span className="text-[#10B981]">{log.hash}</span></span>
                                    <span>← prev: {log.previousHash}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <p className="text-xs text-[#6B7280] mt-4 leading-relaxed">
                Cada registro incluye el hash SHA-256 del registro anterior, formando una cadena
                tamper-evident. Alterar cualquier evento rompe la cadena — es el respaldo inmutable
                que sostiene las disputas de pago con la empresa estatal.
            </p>
        </div>
    );
}
