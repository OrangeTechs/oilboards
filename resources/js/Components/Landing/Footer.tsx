export default function Footer() {
    return (
        <footer className="bg-[#0B0F19] border-t border-[#1F2937] py-12">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
                    <div className="lg:col-span-2">
                        <div className="mb-3">
                            <img src="/logo.png" alt="Oilboards" className="h-8 w-auto" />
                        </div>
                        <p className="text-[#6B7280] text-sm leading-relaxed max-w-xs">
                            Plataforma operativa petrolera · México<br />
                            Centraliza, monitorea y optimiza tu activo.
                        </p>
                    </div>
                    <div>
                        <div className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-4">Producto</div>
                        <div className="space-y-2">
                            {['Módulo Campo', 'Módulo Telemetría', 'Módulo Dirección', 'Sala de Monitoreo', 'IA Predictiva'].map(l => (
                                <a key={l} href="#producto" className="block text-sm text-[#9CA3AF] hover:text-white transition-colors">{l}</a>
                            ))}
                        </div>
                    </div>
                    <div>
                        <div className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-4">Empresa</div>
                        <div className="space-y-2">
                            {[
                                { label: 'Demo interactiva', href: '/demo' },
                                { label: 'Precios', href: '#precios' },
                                { label: 'Aviso de Privacidad', href: '#' },
                                { label: 'Términos de Servicio', href: '#' },
                            ].map(l => (
                                <a key={l.label} href={l.href} className="block text-sm text-[#9CA3AF] hover:text-white transition-colors">{l.label}</a>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="border-t border-[#1F2937] pt-8 space-y-3">
                    <p className="text-xs text-[#4B5563] text-center">
                        © 2026 Orange Technologies SA de CV. Todos los derechos reservados.
                    </p>
                    <p className="text-xs text-[#4B5563] text-center max-w-2xl mx-auto leading-relaxed">
                        Oilboards no es responsable por decisiones operativas tomadas con base en las
                        recomendaciones del sistema de IA. Toda sugerencia debe ser validada por
                        personal calificado antes de su ejecución en campo.
                    </p>
                </div>
            </div>
        </footer>
    );
}
