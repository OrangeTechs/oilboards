import { Check, MapPin, Database, Cpu, Users } from 'lucide-react';
import { DEMO_ASSET, DEMO_WELLS, STATUS_META } from '@/data/demoData';
import { StatusDot } from '@/Components/ui/primitives';

const STEPS = [
    { icon: MapPin, label: 'Datos del activo', done: true },
    { icon: Database, label: 'Alta de pozos', done: true },
    { icon: Cpu, label: 'Integración SCADA', done: true },
    { icon: Users, label: 'Asignar operadores', done: false },
];

export default function Onboarding() {
    return (
        <div className="p-6 max-w-5xl">
            <div className="mb-6">
                <h2 className="text-lg font-bold text-white">Alta de Activo y Pozos</h2>
                <p className="text-sm text-[#9CA3AF]">Configuración inicial del campo · da de alta pozos, levantamiento y operadores</p>
            </div>

            {/* Progreso */}
            <div className="glass rounded-2xl p-5 mb-6">
                <div className="flex items-center justify-between">
                    {STEPS.map((s, i) => {
                        const Icon = s.icon;
                        return (
                            <div key={i} className="flex items-center flex-1 last:flex-none">
                                <div className="flex flex-col items-center gap-1.5">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${s.done ? 'bg-[#10B981]' : 'bg-[#1F2937] border border-[#374151]'}`}>
                                        {s.done ? <Check size={18} className="text-white" /> : <Icon size={16} className="text-[#9CA3AF]" />}
                                    </div>
                                    <span className={`text-[10px] ${s.done ? 'text-white' : 'text-[#6B7280]'}`}>{s.label}</span>
                                </div>
                                {i < STEPS.length - 1 && <div className={`flex-1 h-px mx-2 ${s.done ? 'bg-[#10B981]' : 'bg-[#374151]'}`} />}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Datos del activo */}
                <div className="glass rounded-2xl p-5">
                    <div className="text-sm font-semibold text-white mb-3">Datos del activo</div>
                    <div className="space-y-3 text-sm">
                        {[
                            ['Organización', DEMO_ASSET.organization],
                            ['Activo', DEMO_ASSET.name],
                            ['Región', DEMO_ASSET.region],
                            ['Zona horaria', 'America/Mexico_City'],
                            ['Pozos', `${DEMO_ASSET.totalWells}`],
                        ].map(([l, v]) => (
                            <div key={l}>
                                <div className="text-[10px] text-[#6B7280]">{l}</div>
                                <div className="text-white">{v}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Pozos dados de alta */}
                <div className="lg:col-span-2 glass rounded-2xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-[#1F2937] flex items-center justify-between">
                        <span className="text-sm font-semibold text-white">Pozos dados de alta</span>
                        <button className="text-xs text-[#10B981] hover:text-white transition-colors">+ Agregar pozo</button>
                    </div>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-[10px] uppercase tracking-wider text-[#6B7280] border-b border-[#1F2937]">
                                <th className="text-left font-medium px-5 py-2">Pozo</th>
                                <th className="text-left font-medium px-5 py-2">Levantamiento</th>
                                <th className="text-left font-medium px-5 py-2">Profundidad</th>
                                <th className="text-left font-medium px-5 py-2">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {DEMO_WELLS.map((w) => (
                                <tr key={w.id} className="border-b border-[#1F2937]/50 hover:bg-[#1F2937]/30">
                                    <td className="px-5 py-2.5 font-semibold text-white">{w.name}</td>
                                    <td className="px-5 py-2.5 text-[#9CA3AF]">{w.liftType}</td>
                                    <td className="px-5 py-2.5 font-mono text-xs text-[#9CA3AF]">{w.depthM} m</td>
                                    <td className="px-5 py-2.5">
                                        <span className="flex items-center gap-2 text-xs" style={{ color: STATUS_META[w.status].color }}>
                                            <StatusDot color={STATUS_META[w.status].color} /> {STATUS_META[w.status].label}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
