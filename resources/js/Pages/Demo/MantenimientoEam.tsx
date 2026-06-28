import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import {
    DEMO_ASSETS_HEALTH, DEMO_INVENTORY, DEMO_WORK_ORDERS, AssetHealth, SparePartItem, WorkOrder,
} from '@/data/demoData';
import { C, tooltipStyle } from '@/lib/chart';
import {
    Wrench, BrainCircuit, Package, ClipboardList, AlertTriangle,
    CheckCircle, Clock, ArrowRight, TrendingDown, Zap,
} from 'lucide-react';

// ── Barra de salud de activo
function HealthBar({ days, maxDays = 90 }: { days: number; maxDays?: number }) {
    const pct = Math.min(100, (days / maxDays) * 100);
    const color = days <= 10 ? C.red : days <= 20 ? C.yellow : C.green;
    return (
        <div className="flex items-center gap-2 w-full">
            <div className="flex-1 h-1.5 bg-[#1F2937] rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
            </div>
            <span className="text-[10px] font-mono flex-shrink-0 w-12 text-right" style={{ color }}>
                {days}d
            </span>
        </div>
    );
}

// ── Gauge de días a falla
function DaysToFailureGauge({ asset }: { asset: AssetHealth }) {
    const color = asset.status === 'critical' ? C.red : asset.status === 'warn' ? C.yellow : C.green;
    const option = useMemo(() => ({
        backgroundColor: 'transparent',
        series: [{
            type: 'gauge', startAngle: 200, endAngle: -20, min: 0, max: 90, radius: '90%',
            pointer: { itemStyle: { color }, width: 3, length: '55%' },
            progress: { show: true, width: 6, itemStyle: { color } },
            axisLine: { lineStyle: { width: 6, color: [[1, C.grid]] } },
            axisTick: { show: false }, splitLine: { show: false }, axisLabel: { show: false },
            detail: { valueAnimation: true, formatter: '{value}d', color, fontSize: 16, fontWeight: 'bold', fontFamily: 'JetBrains Mono', offsetCenter: [0, '15%'] },
            title: { color: C.muted, fontSize: 9, offsetCenter: [0, '55%'] },
            data: [{ value: asset.daysToFailure, name: 'días a falla' }],
        }],
    }), [asset.daysToFailure, color]);
    return <ReactECharts option={option} notMerge style={{ height: 130, width: '100%' }} />;
}

// ── Tarjeta de predicción crítica
function PredictionCard({ asset }: { asset: AssetHealth }) {
    const inventory = DEMO_INVENTORY.filter(i => i.forAsset === asset.id);
    const workOrder = DEMO_WORK_ORDERS.find(w => w.well === asset.well && w.aiGenerated);
    const color = asset.status === 'critical' ? C.red : C.yellow;

    return (
        <div className="bg-[#111827] rounded-xl border-2 overflow-hidden" style={{ borderColor: `${color}40` }}>
            <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: `${color}20`, backgroundColor: `${color}0D` }}>
                <div className="flex items-center gap-2">
                    <BrainCircuit size={14} style={{ color }} />
                    <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color }}>
                        {asset.status === 'critical' ? '⚡ Predicción Crítica' : '⚠️ Predicción — Aviso'}
                    </span>
                </div>
                <span className="text-[9px] font-mono text-[#6B7280]">Confianza: {asset.confidence}%</span>
            </div>
            <div className="p-4 space-y-4">
                <div className="flex gap-4">
                    <div style={{ width: 140, flexShrink: 0 }}>
                        <DaysToFailureGauge asset={asset} />
                    </div>
                    <div className="flex-1 space-y-2">
                        <div>
                            <div className="text-[9px] text-[#6B7280] uppercase tracking-wider">Activo</div>
                            <div className="text-[13px] font-bold text-white">{asset.name}</div>
                            <div className="text-[11px] text-[#9CA3AF]">{asset.type} · {asset.well}</div>
                        </div>
                        <div>
                            <div className="text-[9px] text-[#6B7280] uppercase tracking-wider">Último mantenimiento</div>
                            <div className="text-[11px] text-[#9CA3AF]">Hace {asset.lastMaintenanceDays} días</div>
                        </div>
                    </div>
                </div>

                {/* Flujo: Predicción → Inventario → OT */}
                <div className="flex items-stretch gap-2">
                    {/* Step 1 */}
                    <div className="flex-1 bg-[#0B0F19] rounded-lg p-2.5 border border-[#374151]">
                        <div className="flex items-center gap-1.5 mb-1.5">
                            <BrainCircuit size={10} className="text-[#8B5CF6]" />
                            <span className="text-[8px] font-bold text-[#8B5CF6] uppercase tracking-wider">1 · IA Predice</span>
                        </div>
                        <div className="text-[10px] text-[#D1D5DB] leading-snug">Falla en ~{asset.daysToFailure}d</div>
                    </div>
                    <div className="flex items-center text-[#374151]"><ArrowRight size={12} /></div>
                    {/* Step 2 */}
                    <div className="flex-1 bg-[#0B0F19] rounded-lg p-2.5 border border-[#374151]">
                        <div className="flex items-center gap-1.5 mb-1.5">
                            <Package size={10} style={{ color: inventory[0]?.status === 'available' ? C.green : C.red }} />
                            <span className="text-[8px] font-bold uppercase tracking-wider" style={{ color: inventory[0]?.status === 'available' ? C.green : C.red }}>
                                2 · Inventario
                            </span>
                        </div>
                        <div className="text-[10px] text-[#D1D5DB] leading-snug">
                            {inventory.length > 0
                                ? `${inventory.filter(i => i.status === 'available').length}/${inventory.length} disponibles`
                                : 'Sin refacciones asignadas'}
                        </div>
                    </div>
                    <div className="flex items-center text-[#374151]"><ArrowRight size={12} /></div>
                    {/* Step 3 */}
                    <div className="flex-1 bg-[#0B0F19] rounded-lg p-2.5 border border-[#374151]">
                        <div className="flex items-center gap-1.5 mb-1.5">
                            <ClipboardList size={10} style={{ color: workOrder ? C.green : C.faint }} />
                            <span className="text-[8px] font-bold uppercase tracking-wider" style={{ color: workOrder ? C.green : C.faint }}>
                                3 · Orden de Trabajo
                            </span>
                        </div>
                        <div className="text-[10px] text-[#D1D5DB] leading-snug">
                            {workOrder ? workOrder.folio : 'Sin OT'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Status pill
const WO_STATUS = {
    abierta:    { label: 'ABIERTA',     color: C.yellow },
    en_proceso: { label: 'EN PROCESO',  color: C.blue   },
    completada: { label: 'COMPLETADA',  color: C.green  },
};
const WO_PRIORITY = {
    alta:  { label: 'ALTA',  color: C.red    },
    media: { label: 'MEDIA', color: C.yellow },
    baja:  { label: 'BAJA',  color: C.green  },
};
const WO_TYPE = {
    predictiva: { label: 'Predictiva IA', color: C.purple },
    correctiva: { label: 'Correctiva',    color: C.red    },
    programada: { label: 'Programada',    color: C.blue   },
};

export default function MantenimientoEam() {
    const criticalAssets = DEMO_ASSETS_HEALTH.filter(a => a.status === 'critical');
    const warnAssets     = DEMO_ASSETS_HEALTH.filter(a => a.status === 'warn');

    return (
        <div className="p-5 space-y-5 bg-[#0B0F19] min-h-full">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 text-[10px] font-semibold text-[#10B981] uppercase tracking-[0.2em] mb-1">
                        <Wrench size={12} /> Módulo 05 · Mantenimiento Predictivo EAM
                    </div>
                    <h1 className="text-xl font-bold text-white">Gestión de Activos Físicos</h1>
                    <p className="text-sm text-[#9CA3AF] mt-0.5">Activo Litoral Tabasco · {DEMO_ASSETS_HEALTH.length} activos monitoreados</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-lg px-3 py-1.5">
                        <AlertTriangle size={12} className="text-[#EF4444]" />
                        <span className="text-[11px] font-bold text-[#EF4444]">{criticalAssets.length} CRÍTICO</span>
                    </div>
                    <div className="flex items-center gap-2 bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-lg px-3 py-1.5">
                        <Clock size={12} className="text-[#F59E0B]" />
                        <span className="text-[11px] font-bold text-[#F59E0B]">{warnAssets.length} AVISO</span>
                    </div>
                </div>
            </div>

            {/* Predicciones críticas */}
            <div>
                <div className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-3">
                    Predicciones Activas — Flujo Automático IA → Inventario → Orden de Trabajo
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {DEMO_ASSETS_HEALTH.filter(a => a.status !== 'ok').map(asset => (
                        <PredictionCard key={asset.id} asset={asset} />
                    ))}
                </div>
            </div>

            {/* Tabla salud de activos */}
            <div className="bg-[#111827] rounded-xl border border-[#1F2937] overflow-hidden">
                <div className="px-4 py-3 border-b border-[#1F2937] flex items-center justify-between">
                    <div className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider">
                        Salud de Activos — Todos los Equipos
                    </div>
                    <span className="text-[9px] text-[#6B7280]">Días estimados a falla · actualizado por IA cada 6h</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[#1F2937]">
                                {['Activo', 'Tipo', 'Pozo/Ubicación', 'Días a Falla', 'Confianza', 'Últ. Mantenimiento', 'Estado'].map(h => (
                                    <th key={h} className="text-left text-[9px] font-semibold text-[#6B7280] uppercase tracking-wider px-4 py-2.5">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {DEMO_ASSETS_HEALTH.map((a) => {
                                const color = a.status === 'critical' ? C.red : a.status === 'warn' ? C.yellow : C.green;
                                return (
                                    <tr key={a.id} className="border-b border-[#1F2937]/50 hover:bg-[#1F2937]/30 transition-colors">
                                        <td className="px-4 py-2.5 text-[11px] font-semibold text-white">{a.name}</td>
                                        <td className="px-4 py-2.5 text-[10px] text-[#9CA3AF]">{a.type}</td>
                                        <td className="px-4 py-2.5 text-[11px] font-mono text-[#9CA3AF]">{a.well}</td>
                                        <td className="px-4 py-2.5 min-w-32"><HealthBar days={a.daysToFailure} /></td>
                                        <td className="px-4 py-2.5 text-[11px] font-mono text-[#9CA3AF]">{a.confidence}%</td>
                                        <td className="px-4 py-2.5 text-[10px] text-[#9CA3AF]">Hace {a.lastMaintenanceDays}d</td>
                                        <td className="px-4 py-2.5">
                                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${color}20`, color }}>
                                                {a.status === 'critical' ? 'CRÍTICO' : a.status === 'warn' ? 'AVISO' : 'OK'}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Órdenes de trabajo + Inventario en columnas */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                {/* Órdenes de trabajo */}
                <div className="bg-[#111827] rounded-xl border border-[#1F2937] overflow-hidden">
                    <div className="px-4 py-3 border-b border-[#1F2937] flex items-center justify-between">
                        <div className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider flex items-center gap-2">
                            <ClipboardList size={12} /> Órdenes de Trabajo
                        </div>
                        <span className="text-[9px] text-[#6B7280]">{DEMO_WORK_ORDERS.filter(w => w.status !== 'completada').length} activas</span>
                    </div>
                    <div className="p-3 space-y-2">
                        {DEMO_WORK_ORDERS.map((wo) => {
                            const st = WO_STATUS[wo.status];
                            const pr = WO_PRIORITY[wo.priority];
                            const tp = WO_TYPE[wo.type];
                            return (
                                <div key={wo.id} className="bg-[#0B0F19] rounded-lg border border-[#1F2937] p-3 hover:border-[#374151] transition-colors">
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[11px] font-bold font-mono text-white">{wo.folio}</span>
                                                {wo.aiGenerated && (
                                                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: `${C.purple}20`, color: C.purple }}>IA</span>
                                                )}
                                            </div>
                                            <div className="text-[10px] text-[#9CA3AF] mt-0.5">{wo.asset} · {wo.well}</div>
                                        </div>
                                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0" style={{ backgroundColor: `${st.color}20`, color: st.color }}>
                                            {st.label}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-[9px] text-[#6B7280]">
                                        <span style={{ color: pr.color }}>● {pr.label}</span>
                                        <span style={{ color: tp.color }}>{tp.label}</span>
                                        <span className="ml-auto">{wo.technician}</span>
                                        <span>Límite: {wo.dueDate}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Inventario de refacciones */}
                <div className="bg-[#111827] rounded-xl border border-[#1F2937] overflow-hidden">
                    <div className="px-4 py-3 border-b border-[#1F2937] flex items-center justify-between">
                        <div className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider flex items-center gap-2">
                            <Package size={12} /> Inventario de Refacciones
                        </div>
                        <span className="text-[9px] text-[#6B7280]">Bodegas vinculadas</span>
                    </div>
                    <div className="p-3 space-y-2">
                        {DEMO_INVENTORY.map((sp) => {
                            const color = sp.status === 'available' ? C.green : sp.status === 'low' ? C.yellow : C.red;
                            const icon = sp.status === 'available' ? <CheckCircle size={12} /> : sp.status === 'low' ? <AlertTriangle size={12} /> : <AlertTriangle size={12} />;
                            return (
                                <div key={sp.id} className="bg-[#0B0F19] rounded-lg border border-[#1F2937] p-3 hover:border-[#374151] transition-colors">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[11px] font-semibold text-white truncate">{sp.name}</div>
                                            <div className="text-[9px] font-mono text-[#6B7280] mt-0.5">{sp.partNumber}</div>
                                        </div>
                                        <div className="flex items-center gap-1.5 flex-shrink-0" style={{ color }}>
                                            {icon}
                                            <span className="text-[10px] font-bold">
                                                {sp.stock} {sp.unit}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1.5 text-[9px] text-[#6B7280]">
                                        <span>{sp.warehouse}</span>
                                        <span className="ml-auto font-bold" style={{ color }}>
                                            {sp.status === 'available' ? 'DISPONIBLE' : sp.status === 'low' ? 'STOCK BAJO' : 'SIN STOCK — En tránsito'}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
