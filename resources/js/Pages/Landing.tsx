import { Head } from '@inertiajs/react';
import Navbar from '@/Components/Landing/Navbar';
import Hero from '@/Components/Landing/Hero';
import MissionControl from '@/Components/Landing/MissionControl';
import SalasMonitoreo from '@/Components/Landing/SalasMonitoreo';
import LosTresModulos from '@/Components/Landing/LosTresModulos';
import FlujoDatos from '@/Components/Landing/FlujoDatos';
import Regulatorio from '@/Components/Landing/Regulatorio';
import LaIA from '@/Components/Landing/LaIA';
import Comparativa from '@/Components/Landing/Comparativa';
import Precios from '@/Components/Landing/Precios';
import CtaFinal from '@/Components/Landing/CtaFinal';
import Footer from '@/Components/Landing/Footer';
import ChatWidget from '@/Components/ui/ChatWidget';

export default function Landing() {
    return (
        <>
            <Head>
                <title>Oilboards — Plataforma Operativa Petrolera · México</title>
                <meta name="description" content="Centraliza el reporte diario de pozos, el monitoreo SCADA en tiempo real y los KPIs operativos de tu activo. Diseñado para operadores petroleros en México." />
            </Head>

            <div className="min-h-screen bg-[#0B0F19] text-white">
                <Navbar />
                <Hero />
                <MissionControl />
                <SalasMonitoreo />
                <LosTresModulos />
                <FlujoDatos />
                <Regulatorio />
                <LaIA />
                <Comparativa />
                <Precios />
                <CtaFinal />
                <Footer />
                <ChatWidget />
            </div>
        </>
    );
}
