import { useState } from 'react';
import { Plus, Bell } from 'lucide-react';
import { DEMO_ALERT_RULES } from '@/data/demoData';
import { Badge } from '@/Components/ui/primitives';
import { C } from '@/lib/chart';

const SEV_COLOR: Record<string, string> = { info: C.blue, warning: C.yellow, critical: C.red };
const OP_LABEL: Record<string, string> = { '<': 'menor que', '>': 'mayor que', drop_pct: 'cae más de' };
const METRIC_LABEL: Record<string, string> = {
    thp: 'Presión THP', vibration: 'Vibración', motor_amp: 'Corriente motor',
    production_hours: 'Horas producción', bsw_pct: 'BSW', net_oil_bbl: 'Producción neta',
};

export default function ConfigAlertas() {
    const [rules, setRules] = useState(DEMO_ALERT_RULES);
    const toggle = (id: string) => setRules((r) => r.map((x) => x.id === id ? { ...x, active: !x.active } : x));

    return (
        <div className="p-6 max-w-5xl">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-bold text-white">Configuración de Alertas</h2>
                    <p className="text-sm text-[#9CA3AF]">Umbrales que disparan alertas inteligentes — sin esperar al modelo predictivo</p>
                </div>
                <button className="flex items-center gap-2 text-xs bg-[#10B981] hover:bg-[#059669] text-white font-semibold px-4 py-2 rounded-xl transition-colors">
                    <Plus size={14} /> Nueva regla
                </button>
            </div>

            <div className="glass rounded-2xl overflow-hidden">
                <div className="px-5 py-3 border-b border-[#1F2937] flex items-center gap-2">
                    <Bell size={14} className="text-[#F59E0B]" />
                    <span className="text-sm font-semibold text-white">Reglas de umbral activas</span>
                </div>
                <div className="divide-y divide-[#1F2937]/60">
                    {rules.map((r) => (
                        <div key={r.id} className="px-5 py-4 flex items-center justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-semibold text-white">{METRIC_LABEL[r.metric]}</span>
                                    <Badge color={SEV_COLOR[r.severity]}>{r.severity}</Badge>
                                </div>
                                <div className="text-xs text-[#9CA3AF]">
                                    Avisar si <span className="font-mono text-white">{METRIC_LABEL[r.metric]}</span> {OP_LABEL[r.operator]} <span className="font-mono text-[#F59E0B]">{r.threshold}{r.operator === 'drop_pct' ? '%' : ''}</span> · {r.scope}
                                </div>
                            </div>
                            <button
                                onClick={() => toggle(r.id)}
                                className={`relative w-11 h-6 rounded-full transition-colors ${r.active ? 'bg-[#10B981]' : 'bg-[#374151]'}`}
                            >
                                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${r.active ? 'translate-x-5' : 'translate-x-0.5'}`} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <p className="text-xs text-[#6B7280] mt-4">
                Cuando una regla se dispara, la IA (Claude) genera el diagnóstico y la recomendación, y la alerta aparece en el centro de notificaciones y en la matriz de pozos.
            </p>
        </div>
    );
}
