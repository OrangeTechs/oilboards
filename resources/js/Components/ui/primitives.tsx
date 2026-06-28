import { ReactNode } from 'react';
import { motion } from 'framer-motion';

// ---- Panel: contenedor base estilo control room ----
export function Panel({
    children, className = '', title, action, glow = false,
}: { children: ReactNode; className?: string; title?: string; action?: ReactNode; glow?: boolean }) {
    return (
        <div className={`bg-[#111827]/80 border border-[#1F2937] rounded-2xl ${glow ? 'glow-green' : ''} ${className}`}>
            {title && (
                <div className="flex items-center justify-between px-5 py-3 border-b border-[#1F2937]">
                    <span className="text-sm font-semibold text-white">{title}</span>
                    {action}
                </div>
            )}
            {children}
        </div>
    );
}

// ---- SectionLabel: eyebrow neón ----
export function SectionLabel({ children }: { children: ReactNode }) {
    return (
        <span className="text-[#10B981] text-xs font-semibold tracking-[0.25em] uppercase">
            {children}
        </span>
    );
}

// ---- StatCard: KPI ----
export function StatCard({
    label, value, sub, accent = 'white', icon, delay = 0,
}: {
    label: string; value: string; sub?: string;
    accent?: 'green' | 'red' | 'amber' | 'blue' | 'white';
    icon?: ReactNode; delay?: number;
}) {
    const colors: Record<string, string> = {
        green: 'text-[#10B981]', red: 'text-[#EF4444]', amber: 'text-[#F59E0B]',
        blue: 'text-[#3B82F6]', white: 'text-white',
    };
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay }}
            className="bg-[#111827]/80 border border-[#1F2937] rounded-2xl p-4 hover:border-[#374151] transition-colors"
        >
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[#9CA3AF]">{label}</span>
                {icon && <span className="text-[#4B5563]">{icon}</span>}
            </div>
            <div className={`text-2xl font-bold font-mono ${colors[accent]}`}>{value}</div>
            {sub && <div className="text-xs text-[#6B7280] mt-1">{sub}</div>}
        </motion.div>
    );
}

// ---- StatusDot: punto de semáforo ----
export function StatusDot({ color, pulse = false, size = 8 }: { color: string; pulse?: boolean; size?: number }) {
    return (
        <span className="relative inline-flex" style={{ width: size, height: size }}>
            {pulse && (
                <span
                    className="absolute inline-flex rounded-full opacity-75 map-pin-ring"
                    style={{ width: size, height: size, backgroundColor: color }}
                />
            )}
            <span className="relative inline-flex rounded-full" style={{ width: size, height: size, backgroundColor: color }} />
        </span>
    );
}

// ---- Badge ----
export function Badge({ children, color = '#10B981', pulse = false }: { children: ReactNode; color?: string; pulse?: boolean }) {
    return (
        <span
            className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide ${pulse ? 'pulse-dot' : ''}`}
            style={{ color, backgroundColor: `${color}1A` }}
        >
            {children}
        </span>
    );
}

// ---- Sparkline SVG ----
export function Sparkline({ data, color, width = 84, height = 30 }: { data: number[]; color: string; width?: number; height?: number }) {
    if (!data.length) return null;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const pts = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * (height - 4) - 2}`).join(' ');
    return (
        <svg width={width} height={height} className="overflow-visible">
            <defs>
                <linearGradient id={`spark-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}
