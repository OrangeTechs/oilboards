import { useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Play, Sparkles, Check, FileJson, Volume2 } from 'lucide-react';
import { DEMO_VOICE_TRANSCRIPT, DEMO_VOICE_STRUCTURED } from '@/data/demoData';

type Stage = 'idle' | 'playing' | 'structuring' | 'done';

const AUDIO_SRC_MP3 = '/audio/bitacora-pozo-101h.mp3';
const AUDIO_SRC_M4A = '/audio/bitacora-pozo-101h.m4a';

export default function ConsolaVoz() {
    const [stage, setStage] = useState<Stage>('idle');
    const [saved, setSaved] = useState(false);
    const [audioPlaying, setAudioPlaying] = useState(false);
    const [progress, setProgress] = useState(0); // 0..1 avance del dictado
    const [dur, setDur] = useState(37);
    const audioRef = useRef<HTMLAudioElement>(null);
    const stageRef = useRef<Stage>('idle');
    const progRef = useRef(0);
    const synthRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const words = useMemo(() => DEMO_VOICE_TRANSCRIPT.split(' '), []);

    const setStageBoth = (s: Stage) => { stageRef.current = s; setStage(s); };

    // La transcripción se revela al ritmo del audio; cerca del final (92%) pasa a
    // estructuración y luego muestra el JSON. Así el proceso sigue al dictado real.
    const advance = (pr: number) => {
        pr = Math.max(0, Math.min(1, pr));
        progRef.current = pr;
        setProgress(pr);
        if (pr >= 0.92 && stageRef.current === 'playing') {
            setStageBoth('structuring');
            setAudioPlaying(false);
            window.setTimeout(() => { if (stageRef.current === 'structuring') setStageBoth('done'); }, 1300);
        }
    };

    // Respaldo: si el navegador bloquea el audio, simula el avance en ~13 s para
    // que la demo igual fluya (transcripción en vivo + JSON).
    const startSynthetic = () => {
        if (synthRef.current) return;
        setAudioPlaying(true);
        const start = Date.now();
        const SYN = 13000;
        synthRef.current = setInterval(() => {
            const pr = Math.min(1, (Date.now() - start) / SYN);
            advance(pr);
            if (pr >= 1 && synthRef.current) { clearInterval(synthRef.current); synthRef.current = null; }
        }, 120);
    };

    const run = () => {
        if (stage === 'structuring') return; // evita reentradas a medio proceso
        if (synthRef.current) { clearInterval(synthRef.current); synthRef.current = null; }
        setSaved(false);
        advance(0);
        setStageBoth('playing');

        const a = audioRef.current;
        if (a) {
            try { a.currentTime = 0; } catch { /* */ }
            const p = a.play();
            if (p && typeof p.then === 'function') p.then(() => { /* reproduciendo */ }).catch(() => startSynthetic());
        } else {
            startSynthetic();
        }
        // Seguro: si en 1.2 s el audio no avanzó, usa el respaldo simulado.
        window.setTimeout(() => { if (progRef.current === 0 && stageRef.current === 'playing') startSynthetic(); }, 1200);
    };

    const onTime = (e: React.SyntheticEvent<HTMLAudioElement>) => {
        const el = e.currentTarget;
        const d = el.duration || dur;
        if (synthRef.current) { clearInterval(synthRef.current); synthRef.current = null; } // el audio real manda
        advance(el.currentTime / d);
    };

    const transcriptShown = stage === 'done'
        ? DEMO_VOICE_TRANSCRIPT
        : words.slice(0, Math.ceil(progress * words.length)).join(' ');

    const showTranscript = stage !== 'idle';
    const showJson = stage === 'done';
    const busy = stage === 'playing' || stage === 'structuring';

    return (
        <div className="p-6 max-w-5xl">
            <div className="mb-6">
                <h2 className="text-lg font-bold text-white">Consola de Audio · Voz → IA</h2>
                <p className="text-sm text-[#9CA3AF]">El operador dicta el turno · El Motor de IA Oilboards transcribe y estructura el reporte automáticamente</p>
            </div>

            <div className="glass rounded-2xl p-6 mb-6">
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={run}
                            disabled={busy}
                            className="w-14 h-14 rounded-full bg-[#10B981] hover:bg-[#059669] disabled:opacity-60 flex items-center justify-center transition-colors flex-shrink-0"
                        >
                            {busy ? <Play size={22} className="text-white" /> : <Mic size={22} className="text-white" />}
                        </button>
                        <div>
                            <div className="text-sm font-semibold text-white">
                                {stage === 'idle' && 'Reproducir el dictado y procesarlo con IA'}
                                {stage === 'playing' && 'Reproduciendo dictado · transcribiendo en vivo…'}
                                {stage === 'structuring' && 'Estructurando con el Motor de IA…'}
                                {stage === 'done' && 'Reporte estructurado y listo · presiona para repetir'}
                            </div>
                            <div className="text-xs text-[#6B7280]">POZO-101H · Op. Antonio Pérez · Turno matutino</div>
                        </div>
                    </div>
                    {audioPlaying && (
                        <div className="flex items-end gap-1 h-8">
                            {[...Array(14)].map((_, i) => (
                                <motion.div key={i} className="w-1 bg-[#10B981] rounded-full"
                                    animate={{ height: ['20%', '100%', '40%', '80%', '20%'] }}
                                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.06 }} />
                            ))}
                        </div>
                    )}
                </div>

                {/* Audio oculto: lo controla SOLO el botón verde (mic). */}
                <audio
                    ref={audioRef}
                    preload="auto"
                    className="hidden"
                    onPlay={() => setAudioPlaying(true)}
                    onPause={() => { if (stageRef.current !== 'structuring') setAudioPlaying(false); }}
                    onEnded={() => { setAudioPlaying(false); advance(1); }}
                    onTimeUpdate={onTime}
                    onLoadedMetadata={(e) => setDur(e.currentTarget.duration || 37)}
                >
                    <source src={AUDIO_SRC_MP3} type="audio/mpeg" />
                    <source src={AUDIO_SRC_M4A} type="audio/mp4" />
                </audio>

                {/* Barra de progreso de lectura (indicador, sin botón propio) */}
                {stage !== 'idle' && (
                    <div className="mb-5">
                        <div className="flex items-center justify-between text-[11px] text-[#6B7280] mb-1.5">
                            <span className="flex items-center gap-1.5"><Volume2 size={13} className="text-[#10B981]" /> Dictado del operador · POZO-101H</span>
                            <span className="font-mono">{fmtTime(progress * dur)} / {fmtTime(dur)}</span>
                        </div>
                        <div className="h-1.5 bg-[#1F2937] rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-[#10B981] transition-[width] duration-150" style={{ width: `${progress * 100}%` }} />
                        </div>
                    </div>
                )}

                {/* Pasos */}
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { icon: Play, label: 'Audio', active: stage !== 'idle' },
                        { icon: FileJson, label: 'Transcripción', active: showTranscript && progress > 0.02 },
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
                {/* Transcripción — se va escribiendo al ritmo del audio */}
                <AnimatePresence>
                    {showTranscript && (
                        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <FileJson size={14} className="text-[#3B82F6]" />
                                <span className="text-sm font-semibold text-white">Transcripción en vivo</span>
                                {stage === 'playing' && <span className="ml-auto text-[10px] text-[#3B82F6] flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] pulse-dot" /> escuchando…</span>}
                            </div>
                            <p className="text-sm text-[#D1D5DB] leading-relaxed italic min-h-[7rem]">
                                "{transcriptShown}"{stage !== 'done' && <span className="inline-block w-1.5 h-4 bg-[#3B82F6] ml-0.5 align-middle animate-pulse" />}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* JSON */}
                <AnimatePresence>
                    {showJson && (
                        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-5">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <Sparkles size={14} className="text-[#10B981]" />
                                    <span className="text-sm font-semibold text-white">JSON estructurado por el Motor de IA</span>
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

function fmtTime(s: number) {
    if (!isFinite(s) || s < 0) s = 0;
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, '0')}`;
}
