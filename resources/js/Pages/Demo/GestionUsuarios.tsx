import { UserPlus, Shield } from 'lucide-react';
import { DEMO_USERS } from '@/data/demoData';
import { Badge } from '@/Components/ui/primitives';
import { C } from '@/lib/chart';

const ROLE_META: Record<string, { label: string; color: string; scope: string }> = {
    admin: { label: 'Admin / Director', color: C.purple, scope: 'Total: activos, widgets, exportar, salas' },
    ingeniero: { label: 'Ingeniero', color: C.blue, scope: 'Todo el activo · lectura técnica' },
    operador: { label: 'Operador', color: C.green, scope: 'Solo sus pozos asignados' },
};

const PERMS = [
    { area: 'Captura de reportes', operador: true, ingeniero: true, admin: true },
    { area: 'Telemetría / SCADA', operador: false, ingeniero: true, admin: true },
    { area: 'KPIs ejecutivos', operador: false, ingeniero: true, admin: true },
    { area: 'Exportar reportes', operador: false, ingeniero: true, admin: true },
    { area: 'Configurar salas / alertas', operador: false, ingeniero: false, admin: true },
    { area: 'Alta de usuarios y activos', operador: false, ingeniero: false, admin: true },
];

export default function GestionUsuarios() {
    return (
        <div className="p-6 max-w-5xl">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-bold text-white">Gestión de Usuarios y Roles</h2>
                    <p className="text-sm text-[#9CA3AF]">Control de acceso basado en roles (RBAC) · cada rol ve solo lo que le corresponde</p>
                </div>
                <button className="flex items-center gap-2 text-xs bg-[#10B981] hover:bg-[#059669] text-white font-semibold px-4 py-2 rounded-xl transition-colors">
                    <UserPlus size={14} /> Invitar usuario
                </button>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Usuarios */}
                <div className="glass rounded-2xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-[#1F2937] text-sm font-semibold text-white">Usuarios del activo</div>
                    <div className="divide-y divide-[#1F2937]/60">
                        {DEMO_USERS.map((u) => {
                            const meta = ROLE_META[u.role];
                            return (
                                <div key={u.id} className="px-5 py-3 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: `${meta.color}20`, color: meta.color }}>{u.initials}</div>
                                        <div>
                                            <div className="text-sm font-semibold text-white">{u.name}</div>
                                            <div className="text-xs text-[#6B7280]">{u.position}</div>
                                        </div>
                                    </div>
                                    <Badge color={meta.color}>{meta.label}</Badge>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Matriz de permisos */}
                <div className="glass rounded-2xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-[#1F2937] flex items-center gap-2">
                        <Shield size={14} className="text-[#8B5CF6]" />
                        <span className="text-sm font-semibold text-white">Matriz de permisos</span>
                    </div>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-[10px] uppercase tracking-wider text-[#6B7280] border-b border-[#1F2937]">
                                <th className="text-left font-medium px-4 py-2">Permiso</th>
                                <th className="text-center font-medium px-2 py-2">Oper.</th>
                                <th className="text-center font-medium px-2 py-2">Ing.</th>
                                <th className="text-center font-medium px-2 py-2">Admin</th>
                            </tr>
                        </thead>
                        <tbody>
                            {PERMS.map((p) => (
                                <tr key={p.area} className="border-b border-[#1F2937]/50">
                                    <td className="px-4 py-2.5 text-[#D1D5DB]">{p.area}</td>
                                    {(['operador', 'ingeniero', 'admin'] as const).map((r) => (
                                        <td key={r} className="text-center px-2 py-2.5">
                                            {p[r] ? <span className="text-[#10B981]">✓</span> : <span className="text-[#374151]">—</span>}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <p className="text-xs text-[#6B7280] mt-4">Implementado con Spatie Laravel Permission. El operador solo accede a los pozos que tiene asignados; el sidebar oculta los módulos sin permiso.</p>
        </div>
    );
}
