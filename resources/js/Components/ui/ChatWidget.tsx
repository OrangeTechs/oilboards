import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot } from 'lucide-react';
import Markdown from '@/Components/ui/Markdown';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

const GREETING =
    '👋 ¡Hola! Soy el **Asistente IA de Oilboards**. Pregúntame qué monitorea la plataforma, cómo funcionan los módulos o la Sala de Monitoreo Virtual.';

// Persistencia en la sesión del navegador → conversación continua entre secciones,
// entre landing y demo, e incluso al recargar. (Permitido en el droplet real.)
const MSG_KEY = 'oilboards_chat_v1';
const OPEN_KEY = 'oilboards_chat_open';
const GREET_KEY = 'oilboards_chat_greeted';
const hasWindow = typeof window !== 'undefined';

function loadMessages(): Message[] {
    if (hasWindow) {
        try {
            const s = sessionStorage.getItem(MSG_KEY);
            if (s) { const arr = JSON.parse(s); if (Array.isArray(arr) && arr.length) return arr; }
        } catch { /* ignora */ }
    }
    return [{ role: 'assistant', content: GREETING }];
}

export default function ChatWidget({ section }: { section?: { title: string; desc: string } }) {
    const [open, setOpen] = useState(() => hasWindow && sessionStorage.getItem(OPEN_KEY) === '1');
    const [showBubble, setShowBubble] = useState(false);
    const [unread, setUnread] = useState(0);
    const [messages, setMessages] = useState<Message[]>(loadMessages);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const greeted = useRef(hasWindow && sessionStorage.getItem(GREET_KEY) === '1');

    // Guarda la conversación y el estado abierto en la sesión.
    useEffect(() => {
        if (hasWindow) { try { sessionStorage.setItem(MSG_KEY, JSON.stringify(messages)); } catch { /* */ } }
    }, [messages]);
    useEffect(() => {
        if (hasWindow) { try { sessionStorage.setItem(OPEN_KEY, open ? '1' : '0'); } catch { /* */ } }
    }, [open]);

    // Proactivo: a los 6s asoma el saludo + badge, una sola vez por sesión.
    useEffect(() => {
        if (greeted.current) return;
        const t = setTimeout(() => {
            if (!open && !greeted.current) {
                greeted.current = true;
                if (hasWindow) { try { sessionStorage.setItem(GREET_KEY, '1'); } catch { /* */ } }
                setShowBubble(true);
                setUnread(1);
            }
        }, 6000);
        return () => clearTimeout(t);
    }, [open]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, open]);

    const openPanel = () => {
        setOpen(true);
        setShowBubble(false);
        setUnread(0);
    };

    const send = async (explicit?: string) => {
        const text = (explicit ?? input).trim();
        if (!text || loading) return;
        const history = [...messages, { role: 'user' as const, content: text }];
        setMessages(history);
        if (!explicit) setInput('');
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
                    context: section ? `${section.title} — ${section.desc}` : undefined,
                }),
            });
            const data = await res.json();
            setMessages(prev => [...prev, { role: 'assistant', content: data?.text || 'Disculpa, intenta de nuevo.' }]);
        } catch {
            setMessages(prev => [...prev, { role: 'assistant', content: 'Tuve un problema de conexión. ¿Puedes intentar de nuevo?' }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-5 right-5 z-[70] flex flex-col items-end gap-3">
            {/* Panel de chat */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.96 }}
                        transition={{ duration: 0.2 }}
                        className="w-[min(92vw,380px)] h-[min(70vh,560px)] rounded-2xl border border-[#1F2937] bg-[#0B0F19] shadow-2xl flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="px-4 py-3 border-b border-[#1F2937] flex items-center gap-3 bg-gradient-to-r from-[#10B981]/10 to-[#3B82F6]/10">
                            <div className="w-9 h-9 rounded-xl bg-[#3B82F6]/20 flex items-center justify-center">
                                <Bot size={18} className="text-[#3B82F6]" />
                            </div>
                            <div className="min-w-0">
                                <div className="text-sm font-bold text-white">Asistente IA de Oilboards</div>
                                <div className="text-[11px] text-[#10B981] flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] pulse-dot" /> En línea
                                </div>
                            </div>
                            <button onClick={() => setOpen(false)} className="ml-auto text-[#6B7280] hover:text-white transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Indicador de ubicación: el asistente sabe en qué pantalla estás */}
                        {section && (
                            <div className="px-4 py-1.5 border-b border-[#1F2937] bg-[#10B981]/[0.04] text-[10px] text-[#9CA3AF] flex items-center gap-1.5">
                                <span className="text-[#10B981]">📍</span>
                                Estás en: <span className="text-[#D1D5DB] font-medium truncate">{section.title}</span>
                            </div>
                        )}

                        {/* Mensajes */}
                        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                            {messages.map((m, i) => (
                                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                                        m.role === 'user'
                                            ? 'bg-[#10B981]/20 text-white rounded-tr-sm whitespace-pre-line'
                                            : 'bg-[#111827] border border-[#1F2937] text-[#D1D5DB] rounded-tl-sm'
                                    }`}>
                                        {m.role === 'assistant' ? <Markdown text={m.content} /> : m.content}
                                    </div>
                                </div>
                            ))}
                            {loading && (
                                <div className="flex justify-start">
                                    <div className="bg-[#111827] border border-[#1F2937] rounded-2xl rounded-tl-sm px-3.5 py-3">
                                        <div className="flex gap-1">
                                            {[0, 0.15, 0.3].map((d, i) => (
                                                <motion.div key={i} animate={{ opacity: [0.3, 1, 0.3] }}
                                                    transition={{ duration: 1, repeat: Infinity, delay: d }}
                                                    className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={bottomRef} />
                        </div>

                        {/* Sugerencia contextual: orienta sobre la sección actual */}
                        {section && !loading && (
                            <div className="px-3 pt-2 -mb-1">
                                <button
                                    onClick={() => send('¿Qué puedo ver y hacer en esta sección? Oriéntame brevemente.')}
                                    className="text-[11px] text-[#10B981] border border-[#10B981]/30 hover:border-[#10B981] hover:bg-[#10B981]/10 rounded-full px-3 py-1 transition-colors"
                                >
                                    💡 ¿Qué veo en esta sección?
                                </button>
                            </div>
                        )}

                        {/* Input */}
                        <div className="px-3 py-3 border-t border-[#1F2937] flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                                placeholder="Escribe tu pregunta…"
                                className="flex-1 bg-[#111827] border border-[#374151] rounded-xl px-3.5 py-2.5 text-[13px] text-white placeholder-[#6B7280] focus:outline-none focus:border-[#10B981]"
                            />
                            <button onClick={() => send()} disabled={loading || !input.trim()}
                                className="w-10 h-10 rounded-xl bg-[#10B981] text-white flex items-center justify-center hover:bg-[#059669] transition-colors disabled:opacity-40">
                                <Send size={16} />
                            </button>
                        </div>
                        <div className="px-4 pb-2 text-[9px] text-[#4B5563] text-center">
                            Asistente IA · sujeto a validación por personal calificado
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Burbuja proactiva de saludo */}
            <AnimatePresence>
                {showBubble && !open && (
                    <motion.button
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        onClick={openPanel}
                        className="max-w-[260px] text-left rounded-2xl rounded-br-sm bg-[#111827] border border-[#1F2937] px-4 py-3 shadow-xl hover:border-[#10B981]/50 transition-colors"
                    >
                        <div className="text-[13px] text-[#D1D5DB] leading-snug">
                            👋 Soy el <span className="font-semibold text-white">Asistente IA de Oilboards</span>. Pregúntame lo que quieras.
                        </div>
                        <div className="text-[10px] text-[#10B981] mt-1 font-semibold">Toca para chatear →</div>
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Botón flotante */}
            <button
                onClick={() => (open ? setOpen(false) : openPanel())}
                aria-label="Abrir asistente"
                className="relative w-14 h-14 rounded-full bg-gradient-to-br from-[#10B981] to-[#059669] text-white flex items-center justify-center shadow-2xl shadow-[#10B981]/30 hover:scale-105 transition-transform"
            >
                <AnimatePresence mode="wait" initial={false}>
                    {open
                        ? <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}><X size={24} /></motion.span>
                        : <motion.span key="c" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}><MessageCircle size={24} /></motion.span>}
                </AnimatePresence>
                {unread > 0 && !open && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#EF4444] text-[11px] font-bold flex items-center justify-center border-2 border-[#0B0F19] pulse-dot">
                        {unread}
                    </span>
                )}
            </button>
        </div>
    );
}
