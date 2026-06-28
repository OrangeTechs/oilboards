import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Bot, User } from 'lucide-react';
import Markdown from '@/Components/ui/Markdown';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    time: string;
}

const INITIAL_MESSAGES: Message[] = [
    {
        role: 'user',
        content: '¿Cuál es el procedimiento para diagnosticar un gas-lock en la BEC del POZO-102H?',
        time: '10:45 AM',
    },
    {
        role: 'assistant',
        content: `Según el manual de la bomba BEC instalada en POZO-102H (Sección 4.3 — Diagnóstico de Gas-Lock), los síntomas típicos incluyen:

1. Caída progresiva en THP sin reducción de frecuencia del variador
2. Aumento en la corriente del motor
3. Picos de vibración por encima de 0.75 mm/s

El procedimiento recomendado es:
• Reducir la frecuencia al rango inferior del equipo (verificar placa del motor)
• Abrir la línea de ventilación del espacio anular si aplica
• Monitorear la recuperación de presión de succión en 30 minutos

⚠️ Esta información debe validarse con el personal calificado antes de ejecutarse.`,
        time: '10:45 AM',
    },
    {
        role: 'user',
        content: '¿Cuántas veces ha tenido gas-lock este pozo en los últimos 6 meses?',
        time: '10:47 AM',
    },
    {
        role: 'assistant',
        content: `Según el historial de intervenciones del activo, POZO-102H ha registrado 2 eventos de gas-lock en los últimos 6 meses:

• 15 abril 2026: Gas-lock, duración 8h, resolución por reducción de frecuencia
• 28 febrero 2026: Gas-lock, duración 14h, requirió intervención de reparación menor

El patrón sugiere que el pozo es susceptible a gas-lock cuando el GOR supera 1,450 scf/bbl, condición que se presentó en ambos eventos.`,
        time: '10:47 AM',
    },
];

export default function AsistenteIA() {
    const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;
        const now = () => new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
        const userMsg: Message = { role: 'user', content: input, time: now() };
        const history = [...messages, userMsg];
        setMessages(history);
        setInput('');
        setLoading(true);

        try {
            const xsrf = document.cookie.split('; ').find(c => c.startsWith('XSRF-TOKEN='))?.split('=')[1];
            const res = await fetch('/assistant', {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    ...(xsrf ? { 'X-XSRF-TOKEN': decodeURIComponent(xsrf) } : {}),
                },
                body: JSON.stringify({
                    messages: history.map(m => ({ role: m.role, content: m.content })),
                }),
            });
            const data = await res.json();
            const text = data?.text || 'Disculpa, no pude generar una respuesta. Intenta de nuevo.';
            setMessages(prev => [...prev, { role: 'assistant', content: text, time: now() }]);
        } catch {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Tuve un problema de conexión. ¿Puedes intentar de nuevo?',
                time: now(),
            }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-56px)]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#1F2937] flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-[#3B82F6]/20 rounded-xl flex items-center justify-center">
                        <Bot size={18} className="text-[#3B82F6]" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-white">Asistente Técnico Virtual</h2>
                        <p className="text-xs text-[#6B7280]">Activo Litoral Tabasco · Responde sobre manuales, historial y procedimientos</p>
                    </div>
                    <div className="ml-auto flex items-center gap-1.5 text-xs text-[#10B981]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] pulse-dot" />
                        En línea
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                {messages.map((msg, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        {msg.role === 'assistant' && (
                            <div className="w-8 h-8 rounded-full bg-[#3B82F6]/20 flex items-center justify-center flex-shrink-0 mt-1">
                                <Bot size={14} className="text-[#3B82F6]" />
                            </div>
                        )}
                        <div className={`max-w-lg ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                            <div
                                className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                                    msg.role === 'user'
                                        ? 'bg-[#10B981]/20 text-white rounded-tr-sm whitespace-pre-line'
                                        : 'glass text-[#D1D5DB] rounded-tl-sm'
                                }`}
                            >
                                {msg.role === 'assistant' ? <Markdown text={msg.content} /> : msg.content}
                            </div>
                            <span className="text-[10px] text-[#6B7280] px-1">{msg.time}</span>
                        </div>
                        {msg.role === 'user' && (
                            <div className="w-8 h-8 rounded-full bg-[#10B981]/20 flex items-center justify-center flex-shrink-0 mt-1">
                                <User size={14} className="text-[#10B981]" />
                            </div>
                        )}
                    </motion.div>
                ))}

                {loading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex gap-3"
                    >
                        <div className="w-8 h-8 rounded-full bg-[#3B82F6]/20 flex items-center justify-center flex-shrink-0">
                            <Bot size={14} className="text-[#3B82F6]" />
                        </div>
                        <div className="glass rounded-2xl rounded-tl-sm px-4 py-3">
                            <div className="flex gap-1">
                                {[0, 0.15, 0.3].map((d, i) => (
                                    <motion.div
                                        key={i}
                                        animate={{ opacity: [0.3, 1, 0.3] }}
                                        transition={{ duration: 1, repeat: Infinity, delay: d }}
                                        className="w-2 h-2 rounded-full bg-[#3B82F6]"
                                    />
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-6 py-4 border-t border-[#1F2937] flex-shrink-0">
                <div className="flex gap-3">
                    <input
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                        placeholder="Escribe tu pregunta sobre el activo..."
                        className="flex-1 bg-[#0B0F19] border border-[#374151] text-white placeholder-[#6B7280] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#3B82F6] transition-colors"
                    />
                    <button
                        onClick={handleSend}
                        disabled={loading || !input.trim()}
                        className="bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 text-white px-4 rounded-xl transition-colors"
                    >
                        <Send size={16} />
                    </button>
                </div>
                <p className="text-[10px] text-[#4B5563] mt-2 text-center">
                    Demo — Respuestas reales requieren la configuración de manuales del activo
                </p>
            </div>
        </div>
    );
}
