import { useEffect, useRef, useState } from 'react';

// Contador que sube en intervalos (simula producción acumulada)
export function useCounter(start: number, step: number, intervalMs: number) {
    const [val, setVal] = useState(start);
    useEffect(() => {
        const t = setInterval(() => setVal((v) => v + step), intervalMs);
        return () => clearInterval(t);
    }, [step, intervalMs]);
    return val;
}

// Serie que crece/se desplaza (simula stream SCADA)
export function useStream(initial: number[], next: (last: number) => number, intervalMs: number) {
    const [data, setData] = useState(initial);
    useEffect(() => {
        const t = setInterval(() => {
            setData((d) => [...d.slice(1), next(d[d.length - 1])]);
        }, intervalMs);
        return () => clearInterval(t);
    }, [next, intervalMs]);
    return data;
}

// Valor que fluctúa alrededor de una base (simula sensor en vivo)
export function useJitter(base: number, amplitude: number, intervalMs: number, drift = 0) {
    const [val, setVal] = useState(base);
    const driftRef = useRef(0);
    useEffect(() => {
        const t = setInterval(() => {
            driftRef.current += drift;
            setVal(base + driftRef.current + (Math.random() - 0.5) * amplitude);
        }, intervalMs);
        return () => clearInterval(t);
    }, [base, amplitude, intervalMs, drift]);
    return val;
}
