// ---------------------------------------------------------------------------
// Store de tiempo real ÚNICO para la Sala de Monitoreo.
//
// Un solo intervalo maestro avanza TODAS las señales simuladas. Cada widget se
// suscribe (vía useSyncExternalStore) SOLO al valor que le interesa, por lo que
// un tick de la aguja del 102H no re-renderiza el grid completo. Esto es lo que
// elimina el parpadeo/congelamiento durante el modo edición y el drag/drop.
// ---------------------------------------------------------------------------
import { useSyncExternalStore } from 'react';

type Listener = () => void;

interface Signal {
    value: number;
    base: number;
    amplitude: number;   // ruido por tick (micro-oscilación)
    drift: number;       // tendencia por tick
    min?: number;
    max?: number;
}

interface SeriesSignal {
    values: number[];
    next: (last: number) => number;
}

const TICK_MS = 1000; // intervalo maestro

const signals = new Map<string, Signal>();
const series = new Map<string, SeriesSignal>();
const counters = new Map<string, { value: number; step: number }>();

// Snapshot inmutable por clave: useSyncExternalStore necesita identidad estable
// hasta que el valor cambie de verdad.
const scalarSnap = new Map<string, number>();
const seriesSnap = new Map<string, number[]>();

const listeners = new Map<string, Set<Listener>>();
let masterTimer: ReturnType<typeof setInterval> | null = null;
let refCount = 0;

function emit(key: string) {
    const set = listeners.get(key);
    if (set) set.forEach((l) => l());
}

function tick() {
    signals.forEach((s, key) => {
        let v = s.base + (s.value - s.base) + s.drift + (Math.random() - 0.5) * s.amplitude;
        // acumula drift en value
        v = s.value + s.drift + (Math.random() - 0.5) * s.amplitude;
        if (s.min !== undefined) v = Math.max(s.min, v);
        if (s.max !== undefined) v = Math.min(s.max, v);
        s.value = v;
        scalarSnap.set(key, Math.round(v * 100) / 100);
        emit(key);
    });
    series.forEach((s, key) => {
        const last = s.values[s.values.length - 1];
        s.values = [...s.values.slice(1), s.next(last)];
        seriesSnap.set(key, s.values.map((v) => Math.round(v)));
        emit(key);
    });
    counters.forEach((c, key) => {
        c.value += c.step;
        scalarSnap.set(key, Math.round(c.value));
        emit(key);
    });
    derivedKeys.forEach((key) => emit(key));
}

function ensureTimer() {
    refCount += 1;
    if (!masterTimer) masterTimer = setInterval(tick, TICK_MS);
}
function releaseTimer() {
    refCount -= 1;
    if (refCount <= 0 && masterTimer) {
        clearInterval(masterTimer);
        masterTimer = null;
        refCount = 0;
    }
}

function subscribe(key: string, fn: Listener): () => void {
    let set = listeners.get(key);
    if (!set) { set = new Set(); listeners.set(key, set); }
    set.add(fn);
    ensureTimer();
    return () => {
        set!.delete(fn);
        releaseTimer();
    };
}

// --- Registro de señales (idempotente) ---------------------------------------
function registerSignal(key: string, cfg: Omit<Signal, 'value'> & { value?: number }) {
    if (!signals.has(key)) {
        const s: Signal = { value: cfg.value ?? cfg.base, ...cfg };
        signals.set(key, s);
        scalarSnap.set(key, Math.round(s.value * 100) / 100);
    }
}
function registerSeries(key: string, initial: number[], next: (last: number) => number) {
    if (!series.has(key)) {
        series.set(key, { values: initial, next });
        seriesSnap.set(key, initial.map((v) => Math.round(v)));
    }
}
function registerCounter(key: string, start: number, step: number) {
    if (!counters.has(key)) {
        counters.set(key, { value: start, step });
        scalarSnap.set(key, Math.round(start));
    }
}

// --- Hooks -------------------------------------------------------------------
export function useSignal(key: string, cfg: { base: number; amplitude: number; drift?: number; min?: number; max?: number }): number {
    registerSignal(key, { base: cfg.base, amplitude: cfg.amplitude, drift: cfg.drift ?? 0, min: cfg.min, max: cfg.max });
    return useSyncExternalStore(
        (fn) => subscribe(key, fn),
        () => scalarSnap.get(key) ?? cfg.base,
        () => Math.round(cfg.base * 100) / 100,
    );
}

export function useSeries(key: string, initial: number[], next: (last: number) => number): number[] {
    registerSeries(key, initial, next);
    const initialSnap = seriesSnap.get(key)!;
    return useSyncExternalStore(
        (fn) => subscribe(key, fn),
        () => seriesSnap.get(key) ?? initialSnap,
        () => initialSnap,
    );
}

export function useCounterSignal(key: string, start: number, step: number): number {
    registerCounter(key, start, step);
    return useSyncExternalStore(
        (fn) => subscribe(key, fn),
        () => scalarSnap.get(key) ?? start,
        () => start,
    );
}

// Suscripción de solo-lectura a una señal ya registrada (para umbrales/alertas).
// No crea la señal — si no existe devuelve 0.
export function useSignalSnapshot(key: string): number {
    return useSyncExternalStore(
        (fn) => subscribe(key, fn),
        () => scalarSnap.get(key) ?? 0,
        () => 0,
    );
}
const EMPTY_SERIES: number[] = [];
export function useSeriesSnapshot(key: string): number[] {
    return useSyncExternalStore(
        (fn) => subscribe(key, fn),
        () => seriesSnap.get(key) ?? EMPTY_SERIES,
        () => EMPTY_SERIES,
    );
}

// Valor arbitrario derivado, recalculado en cada tick maestro (ej. reloj).
// No crea intervalos propios: se cuelga del timer maestro vía la clave dada.
const derivedSnap = new Map<string, string>();
const derivedKeys = new Set<string>();
export function useScalarFromStore(key: string, compute: () => string): string {
    if (!derivedSnap.has(key)) derivedSnap.set(key, compute());
    derivedKeys.add(key);
    return useSyncExternalStore(
        (fn) => subscribe(key, () => { derivedSnap.set(key, compute()); fn(); }),
        () => derivedSnap.get(key) ?? compute(),
        () => derivedSnap.get(key) ?? compute(),
    );
}
