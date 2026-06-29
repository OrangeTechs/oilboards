import { useSyncExternalStore } from 'react';
import { DEMO_WELLS } from '@/data/demoData';

// ============================================================================
// Selección de pozo del Tablero Telemetría — estado COMPARTIDO entre sus bloques
// independientes (banner, gauges, SCADA, recomendación). Los bloques viven sueltos
// en el grid, sin un padre común, así que la selección vive en este store externo
// (mismo patrón que liveStore). Cambiar el pozo en el banner actualiza todos.
// ============================================================================

const defaultId = DEMO_WELLS.find((w) => w.status === 'alert')?.id ?? DEMO_WELLS[0].id;
let current = defaultId;
const listeners = new Set<() => void>();

export function setTelemWell(id: string) {
    if (id === current) return;
    current = id;
    listeners.forEach((l) => l());
}

export function useTelemWellId(): string {
    return useSyncExternalStore(
        (cb) => { listeners.add(cb); return () => { listeners.delete(cb); }; },
        () => current,
        () => current,
    );
}

export function getTelemWellId() { return current; }
