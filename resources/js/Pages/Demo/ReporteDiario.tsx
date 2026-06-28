import { useState } from 'react';
import { motion } from 'framer-motion';
import { Cloud, CloudOff, Check, Mic, Smartphone } from 'lucide-react';
import { DEMO_WELLS } from '@/data/demoData';

export default function ReporteDiario() {
    const [well, setWell] = useState('POZO-101H');
    const [gross, setGross] = useState('390');
    const [bsw, setBsw] = useState('18.0');
    const [gas, setGas] = useState('0.42');
    const [water, setWater] = useState('70');
    const [hours, setHours] = useState('23.5');
    const [diesel, setDiesel] = useState('');
    const [saved, setSaved] = useState(false);

    const net = (parseFloat(gross || '0') * (1 - parseFloat(bsw || '0') / 100)).toFixed(1);

    const field = (label: string, value: string, set: (v: string) => void, unit: string, ph = '') => (
        <div>
            <label className="block text-xs text-[#9CA3AF] mb-1.5">{label}</label>
            <div className="relative">
                <input
                    type="number" value={value} placeholder={ph}
                    onChange={(e) => { set(e.target.value); setSaved(false); }}
                    className="w-full bg-[#0B0F19] border border-[#374151] text-white font-mono rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#10B981] transition-colors"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#6B7280]">{unit}</span>
            </div>
        </div>
    );

    return (
        <div className="p-6 max-w-5xl">
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h2 className="text-lg font-bold text-white">Reporte Diario de Producción</h2>
                    <p className="text-sm text-[#9CA3AF]">Captura por pozo · optimizado para campo · funciona offline</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 text-xs glass px-3 py-1.5 rounded-full text-[#10B981]">
                        <Smartphone size={13} /> Modo campo
                    </span>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Formulario */}
                <div className="lg:col-span-2 glass rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <label className="block text-xs text-[#9CA3AF] mb-1.5">Pozo</label>
                            <select
                                value={well} onChange={(e) => setWell(e.target.value)}
                                className="bg-[#0B0F19] border border-[#374151] text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#10B981]"
                            >
                                {DEMO_WELLS.map((w) => <option key={w.id}>{w.name}</option>)}
                            </select>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-[#9CA3AF]">Fecha · Turno</div>
                            <div className="text-sm text-white font-medium">24/06/2026 · Matutino</div>
                        </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                        {field('Aceite bruto', gross, setGross, 'bbl/d')}
                        {field('BSW', bsw, setBsw, '%')}
                        {field('Gas asociado', gas, setGas, 'MMpcd')}
                        {field('Agua producida', water, setWater, 'bbl/d')}
                        {field('Horas en producción', hours, setHours, 'h')}
                        {field('Diésel consumido', diesel, setDiesel, 'L', 'opcional')}
                    </div>

                    <div className="mt-5 flex items-center gap-3">
                        <button
                            onClick={() => setSaved(true)}
                            className="flex items-center gap-2 bg-[#10B981] hover:bg-[#059669] text-white font-semibold px-5 py-3 rounded-xl text-sm transition-colors"
                        >
                            <Check size={16} /> Guardar reporte
                        </button>
                        <button className="flex items-center gap-2 glass hover:border-[#3B82F6] text-[#9CA3AF] hover:text-white px-5 py-3 rounded-xl text-sm transition-colors">
                            <Mic size={16} /> Dictar por voz
                        </button>
                    </div>
                </div>

                {/* Cálculo en vivo + estado offline */}
                <div className="space-y-4">
                    <motion.div
                        key={net}
                        initial={{ scale: 0.97 }} animate={{ scale: 1 }}
                        className="glass rounded-2xl p-5 glow-green"
                    >
                        <div className="text-xs text-[#9CA3AF] mb-1">Volumen Neto (cálculo automático)</div>
                        <div className="text-4xl font-extrabold font-mono text-[#10B981]">{net}</div>
                        <div className="text-xs text-[#6B7280] mt-1">bbl/d · = bruto × (1 − BSW/100)</div>
                        <div className="mt-3 pt-3 border-t border-[#1F2937] text-[10px] text-[#6B7280] font-mono">
                            {gross || 0} × (1 − {bsw || 0}/100) = {net}
                        </div>
                    </motion.div>

                    <div className="glass rounded-2xl p-5">
                        <div className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider mb-3">Estado de guardado</div>
                        {saved ? (
                            <div className="flex items-center gap-2 text-sm text-[#10B981]">
                                <Cloud size={16} /> Guardado y sincronizado
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-sm text-[#F59E0B]">
                                <CloudOff size={16} /> Guardado local — pendiente de sincronizar
                            </div>
                        )}
                        <p className="text-[10px] text-[#6B7280] mt-2 leading-relaxed">
                            En campo sin señal, el reporte se guarda en el dispositivo y se sincroniza
                            automáticamente al recuperar conexión. Nunca se pierde un dato.
                        </p>
                    </div>

                    <div className="glass rounded-2xl p-5">
                        <div className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider mb-2">Validaciones</div>
                        <div className="space-y-1.5 text-xs">
                            <div className="flex items-center gap-2 text-[#10B981]"><Check size={12} /> BSW dentro de rango (&lt;30%)</div>
                            <div className="flex items-center gap-2 text-[#10B981]"><Check size={12} /> Horas de producción válidas</div>
                            <div className="flex items-center gap-2 text-[#10B981]"><Check size={12} /> Sin reporte duplicado hoy</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
