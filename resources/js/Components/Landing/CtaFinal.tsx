import { useState, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, ArrowRight, CheckCircle } from 'lucide-react';
import axios from 'axios';

const BLOCKED_DOMAINS = ['gmail.', 'hotmail.', 'yahoo.', 'outlook.', 'live.', 'icloud.'];

function validateEmail(email: string): string | null {
    if (!email.includes('@')) return 'Correo inválido';
    const domain = email.split('@')[1]?.toLowerCase() ?? '';
    for (const blocked of BLOCKED_DOMAINS) {
        if (domain.startsWith(blocked) || domain.includes(blocked)) {
            return 'Por favor usa tu correo corporativo (no Gmail, Hotmail, Yahoo, etc.)';
        }
    }
    return null;
}

export default function CtaFinal() {
    const [form, setForm] = useState({
        name: '', email: '', company: '', position: '', wells_count: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setErrors(prev => ({ ...prev, [e.target.name]: '' }));
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!form.name.trim()) newErrors.name = 'Campo requerido';
        if (!form.email.trim()) {
            newErrors.email = 'Campo requerido';
        } else {
            const emailErr = validateEmail(form.email);
            if (emailErr) newErrors.email = emailErr;
        }
        if (!form.company.trim()) newErrors.company = 'Campo requerido';
        if (!form.position.trim()) newErrors.position = 'Campo requerido';
        if (!form.wells_count) newErrors.wells_count = 'Selecciona una opción';
        return newErrors;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const newErrors = validate();
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setLoading(true);
        try {
            const token = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content;
            await axios.post('/leads', form, {
                headers: { 'X-CSRF-TOKEN': token },
            });
            setSuccess(true);
        } catch (err: any) {
            if (err.response?.data?.errors) {
                const serverErrors: Record<string, string> = {};
                Object.entries(err.response.data.errors).forEach(([k, v]) => {
                    serverErrors[k] = (v as string[])[0];
                });
                setErrors(serverErrors);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <section id="cta" className="py-24 bg-gradient-to-br from-[#064E3B] via-[#065F46] to-[#047857]">
            <div className="max-w-3xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-10"
                >
                    <h2 className="text-3xl lg:text-4xl font-extrabold text-white mb-4 leading-tight">
                        Detén los paros imprevistos. Asegura tu producción hoy mismo.
                    </h2>
                    <p className="text-[#D1FAE5] text-base">
                        Comienza tu prueba piloto de 14 días sin costo en un pozo seleccionado
                        y experimenta el poder de Oilboards.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="bg-[#0B0F19]/80 backdrop-blur rounded-2xl border border-white/10 p-8"
                >
                    {success ? (
                        <div className="text-center py-8">
                            <CheckCircle size={48} className="text-[#10B981] mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-white mb-2">¡Solicitud recibida!</h3>
                            <p className="text-[#9CA3AF] text-sm max-w-sm mx-auto">
                                Un consultor técnico de Oilboards se pondrá en contacto contigo
                                en menos de 24 horas hábiles.
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[#D1D5DB] mb-1">
                                        Nombre completo
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={form.name}
                                        onChange={handleChange}
                                        placeholder="Ing. Nombre Apellido"
                                        className="w-full bg-[#1F2937] border border-[#374151] text-white placeholder-[#6B7280] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#10B981] transition-colors"
                                    />
                                    {errors.name && <p className="text-[#EF4444] text-xs mt-1">{errors.name}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#D1D5DB] mb-1">
                                        Correo corporativo
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={form.email}
                                        onChange={handleChange}
                                        placeholder="nombre@empresa.com.mx"
                                        className="w-full bg-[#1F2937] border border-[#374151] text-white placeholder-[#6B7280] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#10B981] transition-colors"
                                    />
                                    {errors.email && <p className="text-[#EF4444] text-xs mt-1">{errors.email}</p>}
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[#D1D5DB] mb-1">
                                        Empresa / Operadora
                                    </label>
                                    <input
                                        type="text"
                                        name="company"
                                        value={form.company}
                                        onChange={handleChange}
                                        placeholder="Hokchi Energy, Tecpetrol..."
                                        className="w-full bg-[#1F2937] border border-[#374151] text-white placeholder-[#6B7280] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#10B981] transition-colors"
                                    />
                                    {errors.company && <p className="text-[#EF4444] text-xs mt-1">{errors.company}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#D1D5DB] mb-1">
                                        Puesto / Cargo
                                    </label>
                                    <input
                                        type="text"
                                        name="position"
                                        value={form.position}
                                        onChange={handleChange}
                                        placeholder="Director de Operaciones"
                                        className="w-full bg-[#1F2937] border border-[#374151] text-white placeholder-[#6B7280] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#10B981] transition-colors"
                                    />
                                    {errors.position && <p className="text-[#EF4444] text-xs mt-1">{errors.position}</p>}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[#D1D5DB] mb-1">
                                    ¿Cuántos pozos activos opera?
                                </label>
                                <select
                                    name="wells_count"
                                    value={form.wells_count}
                                    onChange={handleChange}
                                    className="w-full bg-[#1F2937] border border-[#374151] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#10B981] transition-colors"
                                >
                                    <option value="" className="text-[#6B7280]">Selecciona un rango</option>
                                    <option value="1-5">1 – 5 pozos</option>
                                    <option value="6-20">6 – 20 pozos</option>
                                    <option value="Más de 20">Más de 20 pozos</option>
                                </select>
                                {errors.wells_count && <p className="text-[#EF4444] text-xs mt-1">{errors.wells_count}</p>}
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-2 bg-[#10B981] hover:bg-[#059669] disabled:opacity-60 text-white font-bold px-6 py-4 rounded-xl text-base transition-all hover:scale-[1.02] shadow-lg shadow-[#10B981]/20 mt-2"
                            >
                                {loading ? 'Enviando...' : 'Iniciar Prueba Piloto Gratis'}
                                {!loading && <ArrowRight size={18} />}
                            </button>

                            <div className="flex items-center justify-center gap-2 text-xs text-[#9CA3AF]">
                                <ShieldCheck size={14} className="text-[#10B981]" />
                                <span>🔒 Tus datos están protegidos. Un consultor técnico te contactará en menos de 24 horas.</span>
                            </div>
                        </form>
                    )}
                </motion.div>
            </div>
        </section>
    );
}
