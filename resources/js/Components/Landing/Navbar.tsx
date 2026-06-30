import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <motion.nav
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
                scrolled
                    ? 'glass border-b border-[#1F2937]'
                    : 'bg-transparent'
            }`}
        >
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                <a href="/" className="flex items-center" aria-label="Oilboards">
                    <img src="/logo.png" alt="Oilboards" className="h-[37px] w-auto" />
                </a>

                <div className="hidden lg:flex items-center gap-5 text-sm text-[#9CA3AF]">
                    <a href="#producto" className="hover:text-white transition-colors">Producto</a>
                    <a href="#salas" className="hover:text-white transition-colors">Salas</a>
                    <a href="#modulos" className="hover:text-white transition-colors">Módulos</a>
                    <a href="#flujo" className="hover:text-white transition-colors">Flujo</a>
                    <a href="#regulatorio" className="hover:text-white transition-colors">Regulatorio</a>
                    <a href="#ia" className="hover:text-white transition-colors">IA</a>
                    <a href="#comparativa" className="hover:text-white transition-colors">Comparativa</a>
                    <a href="#precios" className="hover:text-white transition-colors">Precios</a>
                </div>

                <a
                    href="/demo"
                    className="inline-flex items-center gap-2 bg-[#10B981] hover:bg-[#059669] text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors"
                >
                    Demo
                </a>
            </div>
        </motion.nav>
    );
}
