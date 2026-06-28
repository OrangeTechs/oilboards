import { Bell, Wifi, Info } from 'lucide-react';
import { Tooltip } from '@/Components/ui/Tooltip';

interface Props {
    title: string;
    description?: string;
}

export default function TopBar({ title, description }: Props) {
    return (
        <div className="h-14 bg-[#111827] border-b border-[#1F2937] flex items-center justify-between px-6 flex-shrink-0">
            <div>
                <div className="flex items-center gap-1.5">
                    <h1 className="text-sm font-semibold text-white">{title}</h1>
                    {description && (
                        <Tooltip content={description} side="bottom">
                            <button aria-label="¿Qué muestra esta pantalla?" className="text-[#6B7280] hover:text-[#10B981] transition-colors">
                                <Info size={13} />
                            </button>
                        </Tooltip>
                    )}
                </div>
                <p className="text-xs text-[#6B7280]">Lunes 24 junio 2026 · Turno matutino</p>
            </div>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-xs text-[#10B981]">
                    <Wifi size={13} />
                    <span>En línea</span>
                </div>
                <div className="relative">
                    <Bell size={18} className="text-[#9CA3AF]" />
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#EF4444] rounded-full text-[9px] font-bold text-white flex items-center justify-center pulse-dot">
                        2
                    </span>
                </div>
                <a
                    href="/"
                    className="text-xs text-[#10B981] hover:text-white transition-colors border border-[#10B981]/30 hover:border-[#10B981] px-3 py-1.5 rounded-lg"
                >
                    ← Volver al sitio
                </a>
            </div>
        </div>
    );
}
