import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Play, Sparkles, Check, FileJson } from 'lucide-react';
import { DEMO_VOICE_TRANSCRIPT, DEMO_VOICE_STRUCTURED } from '@/data/demoData';

type Stage = 'idle' | 'playing' | 'transcribing' | 'structuring' | 'done';

// Coloca tu grabación en public/audio/ con este nombre (mp3 o m4a).
// Si el archivo no existe, el pipeline cae a la simulación por tiempo y nada se rompe.
const AUDIO_SRC_MP3 = '/audio/bitacora-pozo-101h.mp3';
const AUDIO_SRC_M4A = '/audio/bitacora-pozo-101h.m4a';

export default function ConsolaVoz() {
    const [stage, setStage] = useState<Stage>('idle');
    const [saved, setSaved] = useState(false);
    const [audioBlocked, setAudioBlocked] = useState(false);
    const audioRef = useRef<HTMLAudioElement>(null);

    // Tras el audio (o su fallback), corre transcripción → estructuración.
    const runPipeline = async () => {
        setStage('transcribing');
        await wait(1600);
        setStage('structuring');
        await wait(1900);
        setStage('done');
    };

    // IMPORTANTE: play() debe invocarse de inmediato dentro del gesto del clic
    // para que el navegador no lo bloquee por autoplay. Por eso run() NO es async
    // y no hace nada asíncrono antes de a.play().
    const run = () => {
        if (stage !== 'idle' && stage !== 'done') return;
        setSaved(false);
        setAudioBlocked(false);
        setStage('playing');

        const a = audioRef.current;
        if (!a) { void wait(4500).then(runPipeline); return; }

        try { a.currentTime = 0; } catch { /* */ }
        const p = a.play();

        if (p && typeof p.then === 'function') {
            p.then(() => {
                a.onended = () => { void runPipeline(); };
                a.onerror = () => { void runPipeline(); };
            }).catch(() => {
                // Autoplay bloqueado por el navegador: muestra control nativo y
                // sigue el pipeline simulado para que la demo no se quede pegada.
                setAudioBlocked(true);
                void wait(3500).then(runPipeline);
            });
        } else {
            a.onended = () => { void runPipeline(); };
        }
    };

    const showTranscript = ['transcribing', 'structuring', 'done'].includes(stage);
    const showJson = stage === 'done';
    const busy = stage === 'playing' || stage === 'transcribing' || stage === 'structuring';

    return (
        <div className="p-6 max-w-5xl">
            <div className="mb-6">
                <h2 className="text-lg font-bold text-white">Consola de Audio · Voz → IA</h2>
                <p className="text-sm text-[#9CA3AF]">El operador dicta el turno · Whisper transcribe · Claude estructura el reporte automáticamente</p>
            </div>

            {/* audio real — oculto normalmente; si el navegador bloquea el autoplay,
                se muestra con controles nativos para reproducir con un clic manual. */}
            <audio
                ref={audioRef}
                preload="auto"
                controls={audioBlocked}
                className={audioBlocked ? 'w-full mb-4' : 'hidden'}
            >
                <source src={AUDIO_SRC_MP3} type="audio/mpeg" />
                <source src={AUDIO_SRC_M4A} type="audio/mp4" />
            </audio>
            {audioBlocked && (
                <p className="text-[11px] text-[#F59E0B] -mt-2 mb-4">El navegador bloqueó la reproducción automática · presiona ▶ arriba para escuchar el dictado.</p>
            )}

            {/* Pipeline */}
            <div className="glass rounded-2xl p-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={run}
                            disabled={busy}
                            className="w-14 h-14 rounded-full bg-[#10B981] hover:bg-[#059669] disabled:opacity-60 flex items-center justify-center transition-colors flex-shrink-0"
                        >
                            {stage === 'playing'
                                ? <Play size={22} className="text-white" />
                                : <Mic size={22} className="text-white" />}
                        </button>
                        <div>
                            <div className="text-sm font-semibold text-white">
                                {stage === 'idle' && 'Reproduce el dictado del operador'}
                                {stage === 'playing' && 'Reproduciendo dictado del turno…'}
                                {stage === 'transcribing' && 'Transcribiendo (Whisper)…'}
                                {stage === 'structuring' && 'Estructurando con Claude…'}
                                {stage === 'done' && 'Reporte estructurado y listo · presiona para repetir'}
                            </div>
                            <div className="text-xs text-[#6B7280]">POZO-101H · Op. Antonio Pérez · Turno matutino</div>
                        </div>
                    </div>
                    {stage === 'playing' && (
                        <div className="flex items-end gap-1 h-8">
                            {[...Array(14)].map((_, i) => (
                                <motion.div key={i} className="w-1 bg-[#10B981] rounded-full"
                                    animate={{ height: ['20%', '100%', '40%', '80%', '20%'] }}
                                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.06 }} />
                            ))}
                        </div>
                    )}
                </div>

                {/* Pasos */}
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { icon: Play, label: 'Audio', active: stage !== 'idle' },
                        { icon: FileJson, label: 'Transcripción', active: showTranscript },
                        { icon: Sparkles, label: 'JSON estructurado (IA)', active: showJson },
                    ].map((s, i) => {
                        const Icon = s.icon;
                        return (
                            <div key={i} className={`rounded-xl p-3 border text-center transition-colors ${s.active ? 'border-[#10B981]/40 bg-[#10B981]/5' : 'border-[#1F2937] bg-[#0B0F19]'}`}>
                                <Icon size={16} className={`mx-auto mb-1 ${s.active ? 'text-[#10B981]' : 'text-[#4B5563]'}`} />
                                <div className={`text-[10px] ${s.active ? 'text-white' : 'text-[#6B7280]'}`}>{s.label}</div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Transcripción */}
                <AnimatePresence>
                    {showTranscript && (
                        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <FileJson size={14} className="text-[#3B82F6]" />
                                <span className="text-sm font-semibold text-white">Transcripción cruda</span>
                            </div>
                            <p className="text-sm text-[#D1D5DB] leading-relaxed italic">"{DEMO_VOICE_TRANSCRIPT}"</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* JSON */}
                <AnimatePresence>
                    {showJson && (
                        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-5 glow-green">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <Sparkles size={14} className="text-[#10B981]" />
                                    <span className="text-sm font-semibold text-white">JSON estructurado por Claude</span>
                                </div>
                                <span className="text-[10px] bg-[#10B981]/20 text-[#10B981] px-2 py-0.5 rounded">confianza: alta</span>
                            </div>
                            <pre className="text-[11px] text-[#A7F3D0] font-mono leading-relaxed overflow-x-auto bg-[#0B0F19] rounded-lg p-3 max-h-72 overflow-y-auto">
{JSON.stringify(DEMO_VOICE_STRUCTURED, null, 2)}
                            </pre>
                            <div className="mt-3 flex items-center gap-2 flex-wrap">
                                <button
                                    onClick={() => setSaved(true)}
                                    disabled={saved}
                                    className={`flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg transition-colors ${saved ? 'bg-[#10B981]/15 text-[#10B981] cursor-default' : 'bg-[#10B981] text-white hover:bg-[#059669]'}`}
                                >
                                    <Check size={13} /> {saved ? 'Guardado en el Reporte Diario' : 'Validar y guardar'}
                                </button>
                                {!saved && (
                                    <span className="text-[10px] text-[#6B7280]">El ingeniero valida antes de guardar · el volumen neto lo calcula el sistema</span>
                                )}
                                {saved && (
                                    <motion.span
                                        initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                                        className="text-[10px] text-[#10B981] flex items-center gap-1"
                                    >
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] pulse-dot" />
                                        Reporte del POZO-101H · turno matutino guardado · 24 jun 2026
                                    </motion.span>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

function wait(ms: number) { return new Promise((r) => setTimeout(r, ms)); }
