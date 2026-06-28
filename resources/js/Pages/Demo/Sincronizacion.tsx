import { Smartphone, Wifi, WifiOff, RefreshCw, Check } from 'lucide-react';
import { DEMO_SYNC } from '@/data/demoData';
import { C } from '@/lib/chart';

const STATUS_META: Record<string, { label: string; color: string; icon: any }> = {
    success: { label: 'Sincronizado', color: C.green, icon: Check },
    partial: { label: 'Parcial', color: C.yellow, icon: RefreshCw },
    syncing: { label: 'Sincronizando', color: C.blue, icon: RefreshCw },
    offline: { label: 'Sin conexión', color: C.red, icon: WifiOff },
};

export default function Sincronizacion() {
    const totalPending = DEMO_SYNC.reduce((s, d) => s + d.pending, 0);
    const online = DEMO_SYNC.filter((d) => d.status !== 'offline').length;

    return (
        <div className="p-6 max-w-4xl">
            <div className="mb-6">
                <h2 className="text-lg font-bold text-white">Estado de Sincronización</h2>
                <p className="text-sm text-[#9CA3AF]">Dispositivos de campo y datos pendientes de sincronizar · garantía de cero pérdida</p>
            </div>

            <div className="grid sm:grid-cols-3 gap-4 mb-6">
                <div className="glass rounded-2xl p-4">
                    <div className="text-xs text-[#9CA3AF]">Dispositivos en línea</div>
                    <div className="text-2xl font-bold font-mono text-[#10B981]">{online}/{DEMO_SYNC.length}</div>
                </div>
                <div className="glass rounded-2xl p-4">
                    <div className="text-xs text-[#9CA3AF]">Registros pendientes</div>
                    <div className="text-2xl font-bold font-mono text-[#F59E0B]">{totalPending}</div>
                </div>
                <div className="glass rounded-2xl p-4">
                    <div className="text-xs text-[#9CA3AF]">Última sincronización</div>
                    <div className="text-2xl font-bold font-mono text-white">Hace 2 min</div>
                </div>
            </div>

            <div className="glass rounded-2xl overflow-hidden">
                <div className="px-5 py-3 border-b border-[#1F2937] text-sm font-semibold text-white">Dispositivos de campo</div>
                <div className="divide-y divide-[#1F2937]/60">
                    {DEMO_SYNC.map((d, i) => {
                        const meta = STATUS_META[d.status];
                        const Icon = meta.icon;
                        return (
                            <div key={i} className="px-5 py-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-[#0B0F19] flex items-center justify-center">
                                        <Smartphone size={16} className="text-[#9CA3AF]" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-semibold text-white">{d.device}</div>
                                        <div className="text-xs text-[#6B7280]">{d.user} · {d.lastSync}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    {d.pending > 0 && (
                                        <span className="text-xs text-[#F59E0B] font-mono">{d.pending} pendientes</span>
                                    )}
                                    <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: meta.color }}>
                                        <Icon size={13} className={d.status === 'syncing' ? 'animate-spin' : ''} /> {meta.label}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <p className="text-xs text-[#6B7280] mt-4 leading-relaxed">
                Los reportes capturados sin señal se guardan localmente (IndexedDB) y entran a una cola
                de sincronización. Al recuperar conexión, se envían automáticamente al servidor. El
                operador siempre ve si un dato está guardado, en cola o sincronizado.
            </p>
        </div>
    );
}
