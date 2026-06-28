import { motion } from 'framer-motion';
import ReactECharts from 'echarts-for-react';
import { DEMO_KPIS, DEMO_MONTHLY_DATA, DEMO_WELLS } from '@/data/demoData';
import { TrendingUp, Activity, AlertTriangle, Droplets, DollarSign, Flame } from 'lucide-react';
import { tooltipStyle } from '@/lib/chart';

const kpis = [
    {
        icon: TrendingUp,
        label: 'Producción neta del mes',
        value: '72,450 bbl',
        sub: `↑ ${DEMO_KPIS.netOilBblMonthVsTarget}% vs meta`,
        color: 'text-[#10B981]',
        subColor: 'text-[#10B981]',
    },
    {
        icon: Activity,
        label: 'Uptime global',
        value: `${DEMO_KPIS.uptimePct}%`,
        sub: '6 de 8 pozos activos',
        color: 'text-white',
        subColor: 'text-[#9CA3AF]',
    },
    {
        icon: AlertTriangle,
        label: 'NPT acumulado',
        value: `${DEMO_KPIS.nptHours}h`,
        sub: 'junio 2026',
        color: 'text-[#F59E0B]',
        subColor: 'text-[#9CA3AF]',
    },
    {
        icon: Droplets,
        label: 'BSW promedio',
        value: `${DEMO_KPIS.bswAvgPct}%`,
        sub: 'Dentro de rango',
        color: 'text-[#3B82F6]',
        subColor: 'text-[#9CA3AF]',
    },
    {
        icon: DollarSign,
        label: 'Costo por barril',
        value: `$${DEMO_KPIS.costPerBarrelUsd}`,
        sub: 'USD/bbl',
        color: 'text-white',
        subColor: 'text-[#9CA3AF]',
    },
    {
        icon: Flame,
        label: 'Gas comercializado',
        value: `${DEMO_KPIS.gasCommercialized}%`,
        sub: 'Aprovechamiento',
        color: 'text-[#10B981]',
        subColor: 'text-[#10B981]',
    },
];

export default function KpisEjecutivos() {
    const chartOption = {
        backgroundColor: 'transparent',
        tooltip: {
            ...tooltipStyle,
            trigger: 'axis',
        },
        legend: {
            data: ['Meta', 'Producción real'],
            textStyle: { color: '#9CA3AF', fontSize: 10 },
            top: 0,
        },
        grid: { left: '3%', right: '4%', bottom: '3%', top: '14%', containLabel: true },
        xAxis: {
            type: 'category',
            data: DEMO_MONTHLY_DATA.map(d => d.month),
            axisLine: { lineStyle: { color: '#374151' } },
            axisLabel: { color: '#6B7280', fontSize: 11 },
            axisTick: { show: false },
        },
        yAxis: {
            type: 'value',
            min: 60000,
            axisLabel: {
                color: '#6B7280',
                fontSize: 10,
                formatter: (v: number) => `${(v / 1000).toFixed(0)}k`,
            },
            splitLine: { lineStyle: { color: '#1F2937' } },
            axisLine: { lineStyle: { color: '#374151' } },
        },
        series: [
            {
                name: 'Meta',
                type: 'bar',
                data: DEMO_MONTHLY_DATA.map(d => d.meta),
                barMaxWidth: 28,
                itemStyle: { color: '#3B82F6', borderRadius: [4, 4, 0, 0], opacity: 0.7 },
            },
            {
                name: 'Producción real',
                type: 'bar',
                data: DEMO_MONTHLY_DATA.map(d => d.real),
                barMaxWidth: 28,
                itemStyle: { color: '#10B981', borderRadius: [4, 4, 0, 0] },
            },
            {
                name: 'Umbral mínimo (80%)',
                type: 'line',
                data: DEMO_MONTHLY_DATA.map(d => d.meta * 0.8),
                symbol: 'none',
                lineStyle: { color: '#EF4444', width: 1.5, type: 'dashed' },
                markLine: {
                    silent: true,
                    data: [{ type: 'average', name: 'Umbral 80%' }],
                },
            },
        ],
    };

    const totalProduccion = DEMO_WELLS.reduce((s, w) => s + w.netOilBbl, 0);

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-white">KPIs Ejecutivos</h2>
                    <p className="text-sm text-[#9CA3AF]">Activo Litoral Tabasco · Junio 2026</p>
                </div>
                <button className="text-xs text-[#10B981] border border-[#10B981]/30 hover:border-[#10B981] px-3 py-1.5 rounded-lg transition-colors">
                    Exportar CNE/SENER →
                </button>
            </div>

            {/* KPI grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {kpis.map(({ icon: Icon, label, value, sub, color, subColor }, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className="glass rounded-2xl p-5"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs text-[#6B7280]">{label}</span>
                            <Icon size={15} className="text-[#4B5563]" />
                        </div>
                        <div className={`text-3xl font-extrabold font-mono ${color}`}>{value}</div>
                        <div className={`text-xs mt-1.5 ${subColor}`}>{sub}</div>
                    </motion.div>
                ))}
            </div>

            {/* Compliance chart */}
            <div className="glass rounded-2xl p-5">
                <div className="text-sm font-semibold text-white mb-1">Cumplimiento CNE/SENER — 2026</div>
                <div className="text-xs text-[#9CA3AF] mb-4">Producción real vs. meta comprometida · Umbral mínimo 80%</div>
                <ReactECharts option={chartOption} style={{ height: 220 }} />
            </div>

            {/* Wells ranking table */}
            <div className="glass rounded-2xl overflow-hidden">
                <div className="px-5 py-3 border-b border-[#374151]">
                    <span className="text-sm font-semibold text-white">Ranking de Producción por Pozo</span>
                </div>
                <div className="divide-y divide-[#374151]/50">
                    {[...DEMO_WELLS]
                        .sort((a, b) => b.netOilBbl - a.netOilBbl)
                        .map((well, i) => {
                            const pct = totalProduccion > 0 ? (well.netOilBbl / totalProduccion * 100) : 0;
                            const statusColors: Record<string, string> = {
                                active: 'text-[#10B981]',
                                alert: 'text-[#F59E0B]',
                                down: 'text-[#EF4444]',
                                intervention: 'text-[#3B82F6]',
                            };
                            return (
                                <div key={well.id} className="flex items-center gap-4 px-5 py-3">
                                    <span className="text-xs font-mono text-[#6B7280] w-5">{i + 1}</span>
                                    <span className="text-sm font-semibold text-white w-24">{well.name}</span>
                                    <span className="text-xs text-[#6B7280] w-20">{well.liftType}</span>
                                    <div className="flex-1">
                                        <div className="h-1.5 bg-[#374151] rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-[#10B981] rounded-full"
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                    </div>
                                    <span className={`text-sm font-bold font-mono w-20 text-right ${statusColors[well.status]}`}>
                                        {well.netOilBbl > 0 ? `${well.netOilBbl} bbl` : '—'}
                                    </span>
                                    <span className="text-xs text-[#6B7280] w-10 text-right">
                                        {pct > 0 ? `${pct.toFixed(1)}%` : '—'}
                                    </span>
                                </div>
                            );
                        })}
                </div>
            </div>
        </div>
    );
}
