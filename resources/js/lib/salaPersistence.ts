// ============================================================================
// Persistencia de la Sala de Monitoreo — capa ABSTRAÍDA.
// Hoy: localStorage (demo sin login). Mañana: se cambia SOLO el cuerpo de estas
// funciones por llamadas a la API/DB (SQLite) sin tocar la UI.
//
// Dos niveles:
//   - Pantallas (screens): el set activo de la Sala (bloques + posiciones).
//   - Layouts/Presets: colecciones nombradas de pantallas, para cargar de un clic.
// ============================================================================

const SCHEMA = 2; // súbelo si cambia la forma de los datos → invalida saves viejos
const KEY_SCREENS = 'oilboards.sala.screens.v' + SCHEMA;
const KEY_PRESETS = 'oilboards.sala.presets.v' + SCHEMA;

export interface SavedScreen { name: string; layout: any[] }
export interface Preset { id: string; name: string; createdAt: number; screens: SavedScreen[] }

// ── Pantallas activas (nivel 1) ─────────────────────────────────────────────
export function loadScreens<T extends SavedScreen[]>(defaults: T): T {
    try {
        const raw = localStorage.getItem(KEY_SCREENS);
        if (!raw) return defaults;
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) return parsed as T;
    } catch { /* localStorage no disponible o JSON inválido → defaults */ }
    return defaults;
}

export function saveScreens(screens: SavedScreen[]) {
    try { localStorage.setItem(KEY_SCREENS, JSON.stringify(screens)); } catch { /* noop */ }
}

export function resetScreens() {
    try { localStorage.removeItem(KEY_SCREENS); } catch { /* noop */ }
}

// ── Layouts / Presets (nivel 2) ─────────────────────────────────────────────
export function loadPresets(): Preset[] {
    try {
        const raw = localStorage.getItem(KEY_PRESETS);
        if (raw) return JSON.parse(raw) as Preset[];
    } catch { /* noop */ }
    return [];
}

export function savePreset(name: string, screens: SavedScreen[]): Preset {
    const presets = loadPresets();
    const preset: Preset = { id: `p_${Date.now()}`, name, createdAt: Date.now(), screens: JSON.parse(JSON.stringify(screens)) };
    presets.push(preset);
    try { localStorage.setItem(KEY_PRESETS, JSON.stringify(presets)); } catch { /* noop */ }
    return preset;
}

export function deletePreset(id: string) {
    const presets = loadPresets().filter((p) => p.id !== id);
    try { localStorage.setItem(KEY_PRESETS, JSON.stringify(presets)); } catch { /* noop */ }
}
