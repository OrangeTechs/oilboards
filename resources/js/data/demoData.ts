// ============================================================================
// OILBOARDS — Dataset del Demo (todo simulado, nivel petrolera)
// Centraliza TODOS los datos del demo. Nunca hardcodear en componentes.
// Modelado según docs/03_modelo-de-datos.md y docs/02_modulos-dashboard.md
// ============================================================================

export const DEMO_ORG = {
  name: 'Energía Sureste SA de CV',
  rfc: 'ESU240115AB3',
  plan: 'enterprise',
};

export const DEMO_ASSET = {
  name: 'Activo Litoral Tabasco',
  organization: 'Energía Sureste SA de CV',
  region: 'Marino · Sonda de Campeche',
  state: 'Tabasco / Campeche',
  // Centro del campo en la Sonda de Campeche (Golfo de México)
  latitude: 18.95,
  longitude: -92.45,
  timezone: 'America/Mexico_City',
  totalWells: 8,
  activeWells: 6,
};

// ----------------------------------------------------------------------------
// USUARIOS / ROLES (Spatie: operador / ingeniero / admin)
// ----------------------------------------------------------------------------
export const DEMO_USERS = [
  { id: 1, name: 'Ing. Carlos Mendoza',  position: 'Ingeniero de Producción', role: 'ingeniero', initials: 'CM' },
  { id: 2, name: 'Op. Antonio Pérez',    position: 'Operador de Campo',       role: 'operador',  initials: 'AP' },
  { id: 3, name: 'Ing. Laura Sánchez',   position: 'Superintendente',         role: 'admin',     initials: 'LS' },
  { id: 4, name: 'Op. Miguel Hernández', position: 'Operador de Campo',       role: 'operador',  initials: 'MH' },
];

export const CURRENT_USER = DEMO_USERS[0];

// ----------------------------------------------------------------------------
// POZOS
// ----------------------------------------------------------------------------
export type WellStatus = 'active' | 'alert' | 'down' | 'intervention';

export interface DemoWell {
  id: string;
  name: string;
  liftType: string;          // BEC / BM / Gas Lift / Natural
  status: WellStatus;
  latitude: number;
  longitude: number;
  netOilBbl: number;
  grossOilBbl: number;
  thpPsi: number;             // PT · Presión de Tubería (cabezal)
  pcPsi: number;              // PC · Presión de Revestimiento (anular). 0 = N/A
  flpPsi: number;
  tempC: number;              // Temperatura de cabezal
  tempLineaC: number;         // TT · Temperatura de línea (control de parafinas)
  bhpPsi: number;
  pipPsi: number;             // PIP · Presión de admisión de la bomba (BEC). Clave para gas-lock. 0 = N/A
  // --- Levantamiento artificial -------------------------------------------
  motorOn: boolean;           // ESTADO_MOTOR · aplica a BEC y BM
  motorHz: number;            // BEC · frecuencia del variador
  motorRpm: number;
  motorAmp: number;           // Corriente del motor (BEC o motor del balancín)
  spm: number;                // BM · carreras por minuto (Strokes Per Minute). 0 = N/A
  vibrationMms: number;
  bswPct: number;
  gasMmscfd: number;
  waterBbl: number;
  gor: number;
  productionHours: number;
  uptimePct: number;
  chokeSize: string;
  depthM: number;
  nptMinutes?: number;
  equipment?: { manufacturer: string; model: string };
  activeAlert?: {
    title: string;
    severity: string;
    urgency: string;
    detectedAt: string;
  };
}

export const DEMO_WELLS: DemoWell[] = [
  {
    id: 'pozo-101h', name: 'POZO-101H', liftType: 'BEC', status: 'active',
    latitude: 19.05, longitude: -92.45,
    netOilBbl: 320, grossOilBbl: 390, thpPsi: 342, pcPsi: 178, flpPsi: 180, tempC: 68, tempLineaC: 61, bhpPsi: 2480, pipPsi: 1240,
    motorOn: true, motorHz: 55, motorRpm: 3300, motorAmp: 42.1, spm: 0, vibrationMms: 0.42,
    bswPct: 18.0, gasMmscfd: 0.42, waterBbl: 70, gor: 1310, productionHours: 23.5, uptimePct: 95.8,
    chokeSize: '32/64"', depthM: 3420, equipment: { manufacturer: 'Schlumberger', model: 'REDA Maximus' },
  },
  {
    id: 'pozo-102h', name: 'POZO-102H', liftType: 'BEC', status: 'alert',
    latitude: 19.12, longitude: -92.52,
    netOilBbl: 285, grossOilBbl: 363, thpPsi: 298, pcPsi: 246, flpPsi: 175, tempC: 71, tempLineaC: 64, bhpPsi: 2310, pipPsi: 820,
    motorOn: true, motorHz: 52, motorRpm: 3120, motorAmp: 48.3, spm: 0, vibrationMms: 0.87,
    bswPct: 21.5, gasMmscfd: 0.51, waterBbl: 78, gor: 1490, productionHours: 21.2, uptimePct: 88.2,
    chokeSize: '28/64"', depthM: 3510, equipment: { manufacturer: 'Baker Hughes', model: 'Centrilift GC6100' },
    activeAlert: {
      title: 'Riesgo de bloqueo por gas (Gas-Lock)',
      severity: 'high', urgency: 'alta', detectedAt: '08:32 AM',
    },
  },
  {
    id: 'pozo-103', name: 'POZO-103', liftType: 'Gas Lift', status: 'active',
    latitude: 18.98, longitude: -92.38,
    netOilBbl: 180, grossOilBbl: 232, thpPsi: 210, pcPsi: 880, flpPsi: 140, tempC: 65, tempLineaC: 58, bhpPsi: 1980, pipPsi: 0,
    motorOn: false, motorHz: 0, motorRpm: 0, motorAmp: 0, spm: 0, vibrationMms: 0,
    bswPct: 22.3, gasMmscfd: 0.38, waterBbl: 52, gor: 1620, productionHours: 22.1, uptimePct: 92.1,
    chokeSize: '24/64"', depthM: 3120, equipment: { manufacturer: 'Weatherford', model: 'Gas Lift Valve' },
  },
  {
    id: 'pozo-104', name: 'POZO-104', liftType: 'BM', status: 'down',
    latitude: 19.20, longitude: -92.60,
    netOilBbl: 0, grossOilBbl: 0, thpPsi: 0, pcPsi: 0, flpPsi: 0, tempC: 40, tempLineaC: 38, bhpPsi: 0, pipPsi: 0,
    motorOn: false, motorHz: 0, motorRpm: 0, motorAmp: 0, spm: 0, vibrationMms: 0,
    bswPct: 0, gasMmscfd: 0, waterBbl: 0, gor: 0, productionHours: 19.5, uptimePct: 0,
    chokeSize: '—', depthM: 2890, nptMinutes: 270, equipment: { manufacturer: 'Lufkin', model: 'C-640D' },
  },
  {
    id: 'pozo-105h', name: 'POZO-105H', liftType: 'BEC', status: 'active',
    latitude: 19.15, longitude: -92.30,
    netOilBbl: 410, grossOilBbl: 487, thpPsi: 388, pcPsi: 196, flpPsi: 195, tempC: 72, tempLineaC: 66, bhpPsi: 2640, pipPsi: 1360,
    motorOn: true, motorHz: 58, motorRpm: 3480, motorAmp: 44.7, spm: 0, vibrationMms: 0.38,
    bswPct: 15.8, gasMmscfd: 0.58, waterBbl: 77, gor: 1190, productionHours: 23.8, uptimePct: 98.1,
    chokeSize: '36/64"', depthM: 3680, equipment: { manufacturer: 'Schlumberger', model: 'REDA Maximus' },
  },
  {
    id: 'pozo-106', name: 'POZO-106', liftType: 'Natural', status: 'active',
    latitude: 18.88, longitude: -92.48,
    netOilBbl: 95, grossOilBbl: 138, thpPsi: 156, pcPsi: 88, flpPsi: 98, tempC: 60, tempLineaC: 54, bhpPsi: 1650, pipPsi: 0,
    motorOn: false, motorHz: 0, motorRpm: 0, motorAmp: 0, spm: 0, vibrationMms: 0,
    bswPct: 31.2, gasMmscfd: 0.21, waterBbl: 43, gor: 1840, productionHours: 21.7, uptimePct: 90.5,
    chokeSize: '20/64"', depthM: 2740,
  },
  {
    id: 'pozo-107h', name: 'POZO-107H', liftType: 'Gas Lift', status: 'intervention',
    latitude: 19.02, longitude: -92.65,
    netOilBbl: 0, grossOilBbl: 0, thpPsi: 0, pcPsi: 0, flpPsi: 0, tempC: 38, tempLineaC: 36, bhpPsi: 0, pipPsi: 0,
    motorOn: false, motorHz: 0, motorRpm: 0, motorAmp: 0, spm: 0, vibrationMms: 0,
    bswPct: 0, gasMmscfd: 0, waterBbl: 0, gor: 0, productionHours: 0, uptimePct: 0,
    chokeSize: '—', depthM: 3340, equipment: { manufacturer: 'Weatherford', model: 'Gas Lift Valve' },
  },
  {
    id: 'pozo-108', name: 'POZO-108', liftType: 'BM', status: 'active',
    latitude: 19.25, longitude: -92.35,
    netOilBbl: 145, grossOilBbl: 193, thpPsi: 198, pcPsi: 112, flpPsi: 122, tempC: 63, tempLineaC: 57, bhpPsi: 1820, pipPsi: 0,
    motorOn: true, motorHz: 0, motorRpm: 0, motorAmp: 31.5, spm: 8.5, vibrationMms: 0.21,
    bswPct: 24.7, gasMmscfd: 0.28, waterBbl: 48, gor: 1410, productionHours: 22.9, uptimePct: 91.3,
    chokeSize: '26/64"', depthM: 2950, equipment: { manufacturer: 'Lufkin', model: 'C-456D' },
  },
];

// ----------------------------------------------------------------------------
// TANQUES DE ALMACENAMIENTO / PRUEBA
// La "zona dorada" de la PWA: medición física del inventario. El volumen neto
// del día se obtiene por diferencia de nivel (prueba de tanque), no por flujómetro.
// Nivel y aforo en cm para reflejar la medición con regla metálica del operador.
// ----------------------------------------------------------------------------
export type TankType = 'almacenamiento' | 'prueba';

export interface DemoTank {
  id: string;
  name: string;
  type: TankType;
  capacityBbl: number;
  diameterM: number;
  heightCm: number;
  factorBblPerCm: number;     // factor de aforo (capacity / heightCm)
  crudeLevelCm: number;       // LLE · nivel de crudo total medido
  waterInterfaceCm: number;   // LLI · nivel de interfase agua/crudo
  tempC: number;              // para corrección de volumen a 15.6 °C (60 °F)
  aysPct: number;             // %AyS de campo (vaso/centrífuga)
  levelOpenCm: number;        // nivel al inicio del periodo de medición
  levelCloseCm: number;       // nivel al cierre del periodo (prueba de tanque)
}

export const DEMO_TANKS: DemoTank[] = [
  { id: 'tq-101', name: 'TQ-101', type: 'almacenamiento', capacityBbl: 5000, diameterM: 9.15, heightCm: 1000, factorBblPerCm: 5.0,
    crudeLevelCm: 820, waterInterfaceCm: 140, tempC: 32.4, aysPct: 1.8, levelOpenCm: 705, levelCloseCm: 820 },
  { id: 'tq-102', name: 'TQ-102', type: 'almacenamiento', capacityBbl: 5000, diameterM: 9.15, heightCm: 1000, factorBblPerCm: 5.0,
    crudeLevelCm: 670, waterInterfaceCm: 110, tempC: 33.1, aysPct: 2.1, levelOpenCm: 560, levelCloseCm: 670 },
  { id: 'tq-201', name: 'TQ-201 · Prueba', type: 'prueba', capacityBbl: 500, diameterM: 3.05, heightCm: 700, factorBblPerCm: 0.5,
    crudeLevelCm: 240, waterInterfaceCm: 35, tempC: 31.8, aysPct: 1.5, levelOpenCm: 180, levelCloseCm: 240 },
];

// ----------------------------------------------------------------------------
// SEPARADORES
// En pozos sin flujómetro el volumen se calcula por prueba de tanque; el
// separador aporta presión de operación y, donde existe, flujo gas/líquido.
// ----------------------------------------------------------------------------
export interface DemoSeparator {
  id: string;
  name: string;
  stage: 'alta presión' | 'baja presión';
  pressurePsi: number;
  tempC: number;
  gasFlowMmscfd: number;
  liquidFlowBbld: number;
  wellIds: string[];
}

export const DEMO_SEPARATORS: DemoSeparator[] = [
  { id: 'sep-01', name: 'SEP-01 · AP', stage: 'alta presión', pressurePsi: 285, tempC: 58,
    gasFlowMmscfd: 1.85, liquidFlowBbld: 1180, wellIds: ['pozo-101h', 'pozo-102h', 'pozo-105h'] },
  { id: 'sep-02', name: 'SEP-02 · BP', stage: 'baja presión', pressurePsi: 95, tempC: 52,
    gasFlowMmscfd: 0.62, liquidFlowBbld: 640, wellIds: ['pozo-103', 'pozo-106', 'pozo-108'] },
];

// ----------------------------------------------------------------------------
// VARIABLES DERIVADAS — el valor agregado del software (se calculan, no se hardcodean)
// ----------------------------------------------------------------------------

/** Diferencial PT − PC. Salud de integridad del pozo (tubería rota si se invierte). */
export const wellDifferentialPsi = (w: DemoWell): number => w.thpPsi - w.pcPsi;

/** Carreras totales del día de un balancín (SPM × min × 24 h). */
export const pumpStrokesPerDay = (w: DemoWell): number => Math.round(w.spm * 60 * 24);

/** Eficiencia de bombeo en bbl por carrera. 0 si no es balancín en operación. */
export const pumpEfficiencyBblPerStroke = (w: DemoWell): number => {
  const strokes = pumpStrokesPerDay(w);
  return strokes > 0 ? +(w.netOilBbl / strokes).toFixed(4) : 0;
};

/** Volumen bruto del periodo por prueba de tanque (Δnivel × factor de aforo). */
export const tankGrossBbl = (t: DemoTank): number =>
  +((t.levelCloseCm - t.levelOpenCm) * t.factorBblPerCm).toFixed(1);

/** Volumen neto del periodo descontando %AyS (agua y sedimento). */
export const tankNetBbl = (t: DemoTank): number =>
  +(tankGrossBbl(t) * (1 - t.aysPct / 100)).toFixed(1);

/** Volumen neto del día del activo medido físicamente por los tanques. */
export const assetNetFromTanksBbl = (): number =>
  +DEMO_TANKS.reduce((sum, t) => sum + tankNetBbl(t), 0).toFixed(1);

// ----------------------------------------------------------------------------
// KPIs EJECUTIVOS
// ----------------------------------------------------------------------------
export const DEMO_KPIS = {
  netOilBblMonth: 72450,
  netOilBblMonthVsTarget: 4.1,
  netOilBblToday: 3248,
  netOilTodayVsYesterday: 3.2,
  uptimePct: 87.3,
  nptHours: 72.4,
  nptHoursToday: 4.5,
  bswAvgPct: 18.2,
  costPerBarrelUsd: 18.40,
  gasCommercialized: 95.8,
  activeAlerts: 2,
  wellsActive: 6,
  wellsTotal: 8,
};

// ----------------------------------------------------------------------------
// EVENTOS / TIMELINE (Dashboard de Campo)
// ----------------------------------------------------------------------------
export type EventType = 'ok' | 'alert' | 'down' | 'info';

export interface DemoEvent {
  time: string;
  type: EventType;
  well: string;
  message: string;
  user?: string;
}

export const DEMO_EVENTS: DemoEvent[] = [
  { time: '08:15', type: 'ok',    well: 'POZO-101H', message: 'Reporte matutino capturado', user: 'Op. Antonio Pérez' },
  { time: '08:32', type: 'alert', well: 'POZO-102H', message: 'ALERTA IA: Riesgo de gas-lock detectado' },
  { time: '09:00', type: 'down',  well: 'POZO-104',  message: 'Paro por falla eléctrica en tablero de control' },
  { time: '09:45', type: 'info',  well: 'POZO-107H', message: 'Inicio de reparación mayor programada' },
  { time: '10:30', type: 'ok',    well: 'POZO-105H', message: 'Reporte matutino capturado (voz → IA)' },
  { time: '11:05', type: 'alert', well: 'POZO-102H', message: 'THP cayó 8 psi adicionales — monitoreo activo' },
];

export const DEMO_EVENTS_STREAM: DemoEvent[] = [
  { time: '11:20', type: 'ok',    well: 'POZO-108', message: 'Inyección de inhibidor completada' },
  { time: '11:38', type: 'alert', well: 'POZO-102H', message: 'THP bajó a 291 psi — umbral crítico próximo' },
  { time: '11:55', type: 'info',  well: 'POZO-103',  message: 'GOR aumentó 5% — revisión vespertina programada' },
  { time: '12:10', type: 'ok',    well: 'POZO-106',  message: 'Reporte de mediodía capturado' },
];

// ----------------------------------------------------------------------------
// REPORTES DIARIOS (Módulo 1)
// ----------------------------------------------------------------------------
export interface DailyReport {
  wellId: string;
  wellName: string;
  liftType: string;
  grossOilBbl: number;
  bswPct: number;
  netOilBbl: number;
  gasMmscfd: number;
  waterBbl: number;
  productionHours: number;
  status: 'validated' | 'synced' | 'draft';
  source: 'manual' | 'voice' | 'scada';
  reportedBy: string;
  shift: string;
}

export const DEMO_DAILY_REPORTS: DailyReport[] = DEMO_WELLS.map((w) => ({
  wellId: w.id,
  wellName: w.name,
  liftType: w.liftType,
  grossOilBbl: w.grossOilBbl,
  bswPct: w.bswPct,
  netOilBbl: w.netOilBbl,
  gasMmscfd: w.gasMmscfd,
  waterBbl: w.waterBbl,
  productionHours: w.productionHours,
  status: w.status === 'down' || w.status === 'intervention' ? 'synced' : 'validated',
  source: w.id === 'pozo-105h' ? 'voice' : 'manual',
  reportedBy: w.id === 'pozo-104' ? 'Op. Miguel Hernández' : 'Op. Antonio Pérez',
  shift: 'Matutino',
}));

// ----------------------------------------------------------------------------
// BITÁCORA DE PAROS / NPT (append-only, inmutable)
// ----------------------------------------------------------------------------
export type NptCategory = 'mecanica' | 'electrica' | 'clima' | 'mantenimiento' | 'otro';

export interface DowntimeEvent {
  id: string;
  well: string;
  startedAt: string;
  endedAt: string | null;
  durationMin: number;
  category: NptCategory;
  rootCause: string;
  reportedBy: string;
}

export const DEMO_DOWNTIME: DowntimeEvent[] = [
  { id: 'npt-001', well: 'POZO-104',  startedAt: '24/06 09:00', endedAt: null,          durationMin: 270, category: 'electrica',     rootCause: 'Falla eléctrica en tablero de control — en reparación', reportedBy: 'Op. Miguel Hernández' },
  { id: 'npt-002', well: 'POZO-101H', startedAt: '24/06 03:00', endedAt: '24/06 07:00', durationMin: 240, category: 'mecanica',      rootCause: 'Cambio de empaquetadura en cabezal', reportedBy: 'Op. Antonio Pérez' },
  { id: 'npt-003', well: 'POZO-107H', startedAt: '23/06 14:00', endedAt: null,          durationMin: 1320, category: 'mantenimiento', rootCause: 'Reparación mayor programada — cambio de aparejo de producción', reportedBy: 'Ing. Carlos Mendoza' },
  { id: 'npt-004', well: 'POZO-102H', startedAt: '22/06 06:30', endedAt: '22/06 09:15', durationMin: 165, category: 'mecanica',      rootCause: 'Bloqueo por gas (gas-lock) — reducción de frecuencia del variador', reportedBy: 'Ing. Carlos Mendoza' },
  { id: 'npt-005', well: 'POZO-103',  startedAt: '21/06 18:00', endedAt: '21/06 20:30', durationMin: 150, category: 'clima',         rootCause: 'Suspensión por norte (vientos > 60 km/h en plataforma)', reportedBy: 'Op. Antonio Pérez' },
  { id: 'npt-006', well: 'POZO-108',  startedAt: '20/06 11:00', endedAt: '20/06 12:45', durationMin: 105, category: 'mantenimiento', rootCause: 'Mantenimiento preventivo de unidad de bombeo mecánico', reportedBy: 'Op. Miguel Hernández' },
  { id: 'npt-007', well: 'POZO-102H', startedAt: '15/04 02:00', endedAt: '15/04 10:00', durationMin: 480, category: 'mecanica',      rootCause: 'Bloqueo por gas (gas-lock) — evento histórico de referencia', reportedBy: 'Ing. Carlos Mendoza' },
];

export const DEMO_NPT_BY_CATEGORY = [
  { category: 'Mecánica',      hours: 31.5, color: '#F59E0B' },
  { category: 'Eléctrica',     hours: 18.2, color: '#EF4444' },
  { category: 'Mantenimiento', hours: 15.4, color: '#3B82F6' },
  { category: 'Clima',         hours: 5.1,  color: '#8B5CF6' },
  { category: 'Otro',          hours: 2.2,  color: '#6B7280' },
];

// ----------------------------------------------------------------------------
// INCIDENTES HSE / ENERGÍA
// ----------------------------------------------------------------------------
export interface HseIncident {
  id: string;
  well: string;
  type: string;
  severity: 'bajo' | 'medio' | 'alto';
  description: string;
  occurredAt: string;
  reportedBy: string;
}

export const DEMO_HSE: HseIncident[] = [
  { id: 'hse-001', well: 'POZO-106', type: 'Condición de riesgo', severity: 'medio', description: 'Pequeña fuga en brida de línea de descarga — contenida con material absorbente', occurredAt: '23/06 15:20', reportedBy: 'Op. Antonio Pérez' },
  { id: 'hse-002', well: 'Plataforma', type: 'Simulacro', severity: 'bajo', description: 'Simulacro de evacuación por hombre al agua — tiempo de respuesta 4:15 min', occurredAt: '22/06 10:00', reportedBy: 'Ing. Laura Sánchez' },
  { id: 'hse-003', well: 'POZO-104', type: 'Condición de riesgo', severity: 'medio', description: 'Tablero eléctrico con arco detectado — área acordonada, libranza emitida', occurredAt: '24/06 09:05', reportedBy: 'Op. Miguel Hernández' },
];

export const DEMO_DIESEL = [
  { day: '18/06', liters: 4820 }, { day: '19/06', liters: 5010 },
  { day: '20/06', liters: 4650 }, { day: '21/06', liters: 5240 },
  { day: '22/06', liters: 4980 }, { day: '23/06', liters: 5120 },
  { day: '24/06', liters: 4760 },
];

// ----------------------------------------------------------------------------
// DOSIFICACIÓN QUÍMICA
// ----------------------------------------------------------------------------
export interface ChemicalInjection {
  well: string;
  chemical: string;
  volumeGal: number;
  target: number;
}

export const DEMO_CHEMICAL: ChemicalInjection[] = [
  { well: 'POZO-101H', chemical: 'Inhibidor de corrosión', volumeGal: 12.4, target: 12.0 },
  { well: 'POZO-102H', chemical: 'Demulsificante',         volumeGal: 18.7, target: 15.0 },
  { well: 'POZO-103',  chemical: 'Inhibidor de incrustación', volumeGal: 9.8, target: 10.0 },
  { well: 'POZO-105H', chemical: 'Inhibidor de corrosión', volumeGal: 14.2, target: 14.0 },
  { well: 'POZO-106',  chemical: 'Demulsificante',         volumeGal: 7.5,  target: 8.0 },
  { well: 'POZO-108',  chemical: 'Inhibidor de incrustación', volumeGal: 6.9, target: 7.0 },
];

export const DEMO_CHEMICAL_TREND = [
  { day: '18/06', demul: 42, corr: 38, incr: 20 },
  { day: '19/06', demul: 45, corr: 36, incr: 22 },
  { day: '20/06', demul: 41, corr: 40, incr: 19 },
  { day: '21/06', demul: 48, corr: 37, incr: 21 },
  { day: '22/06', demul: 44, corr: 39, incr: 23 },
  { day: '23/06', demul: 46, corr: 41, incr: 20 },
  { day: '24/06', demul: 43, corr: 38, incr: 22 },
];

// ----------------------------------------------------------------------------
// METAS / CUMPLIMIENTO CNE-SENER
// ----------------------------------------------------------------------------
export const DEMO_MONTHLY_DATA = [
  { month: 'Ene', meta: 68000, real: 65200 },
  { month: 'Feb', meta: 68000, real: 67800 },
  { month: 'Mar', meta: 70000, real: 71400 },
  { month: 'Abr', meta: 70000, real: 69100 },
  { month: 'May', meta: 72000, real: 73200 },
  { month: 'Jun', meta: 70000, real: 72450 },
];

// ----------------------------------------------------------------------------
// BALANCE DE FISCALIZACIÓN (vs Pemex)
// ----------------------------------------------------------------------------
export interface FiscalizationRecord {
  date: string;
  producedBbl: number;
  deliveredBbl: number;
  differenceBbl: number;
}

export const DEMO_FISCALIZATION: FiscalizationRecord[] = [
  { date: '18/06', producedBbl: 3180, deliveredBbl: 3172, differenceBbl: -8 },
  { date: '19/06', producedBbl: 3240, deliveredBbl: 3235, differenceBbl: -5 },
  { date: '20/06', producedBbl: 3105, deliveredBbl: 3110, differenceBbl: 5 },
  { date: '21/06', producedBbl: 3298, deliveredBbl: 3290, differenceBbl: -8 },
  { date: '22/06', producedBbl: 3210, deliveredBbl: 3206, differenceBbl: -4 },
  { date: '23/06', producedBbl: 3265, deliveredBbl: 3261, differenceBbl: -4 },
  { date: '24/06', producedBbl: 3248, deliveredBbl: 3244, differenceBbl: -4 },
];

// ----------------------------------------------------------------------------
// CURVA DE DECLINACIÓN (Análisis de Yacimientos)
// histórico de producción neta del activo, 18 meses + pronóstico
// ----------------------------------------------------------------------------
export interface DeclinePoint {
  month: string;
  real: number | null;
  forecast: number | null;
}

export const DEMO_DECLINE: DeclinePoint[] = (() => {
  const months = ['Ene 25','Feb 25','Mar 25','Abr 25','May 25','Jun 25','Jul 25','Ago 25','Sep 25','Oct 25','Nov 25','Dic 25','Ene 26','Feb 26','Mar 26','Abr 26','May 26','Jun 26'];
  const qi = 3050; // tasa inicial bbl/d
  const di = 0.018; // declinación mensual
  const out: DeclinePoint[] = months.map((m, i) => {
    const base = qi * Math.exp(-di * i);
    const noise = Math.sin(i * 1.3) * 35;
    return { month: m, real: Math.round(base + noise), forecast: null };
  });
  // pronóstico (declinación exponencial) 6 meses adelante
  const lastIdx = months.length - 1;
  out[lastIdx].forecast = out[lastIdx].real;
  const fmonths = ['Jul 26','Ago 26','Sep 26','Oct 26','Nov 26','Dic 26'];
  fmonths.forEach((m, j) => {
    const i = lastIdx + 1 + j;
    const base = qi * Math.exp(-di * i);
    out.push({ month: m, real: null, forecast: Math.round(base) });
  });
  return out;
})();

// ----------------------------------------------------------------------------
// ALERTAS (con diagnóstico/recomendación estilo Claude — Doc 4)
// ----------------------------------------------------------------------------
export interface DemoAlert {
  id: string;
  well: string;
  source: 'threshold' | 'ml' | 'manual';
  severity: 'info' | 'warning' | 'critical';
  urgency: 'inmediata' | 'alta' | 'media' | 'baja';
  title: string;
  diagnosis: string;
  recommendation: string;
  estimatedNptImpact: string;
  dataConfidence: 'high' | 'medium' | 'low';
  relatedManualSection: string;
  monitoringIntervalMin: number;
  status: 'open' | 'acknowledged' | 'resolved';
  triggeredAt: string;
}

export const DEMO_ALERTS: DemoAlert[] = [
  {
    id: 'alert-102h',
    well: 'POZO-102H',
    source: 'ml',
    severity: 'critical',
    urgency: 'alta',
    title: 'Riesgo de bloqueo por gas (Gas-Lock) — POZO-102H',
    diagnosis: 'La caída escalonada del 12% en la presión de cabezal (THP) combinada con picos de vibración del motor en las últimas 6 horas es consistente con un proceso de segregación de gas en la bomba electrocentrífuga. Basado en el manual del equipo (Baker Hughes Centrilift) y el historial del pozo, este patrón precedió el bloqueo por gas registrado en la intervención del 15 de abril de 2026.',
    recommendation: 'Revisar la frecuencia de operación del variador y considerar reducirla temporalmente al rango inferior indicado en el manual del equipo para estabilizar la columna de fluido. Alternativamente, abrir la línea de ventilación del espacio anular según el procedimiento operativo del activo. Monitorear la respuesta de la presión de succión en los próximos 30 minutos.',
    estimatedNptImpact: 'Si no se atiende en las próximas 24 horas, el riesgo de paro total aumenta significativamente. El NPT estimado por un bloqueo de bomba en este activo oscila entre 8 y 48 horas de producción diferida.',
    dataConfidence: 'medium',
    relatedManualSection: 'Sección 4.3 — Diagnóstico de Gas-Lock en BEC',
    monitoringIntervalMin: 30,
    status: 'open',
    triggeredAt: '08:32 AM',
  },
  {
    id: 'alert-104',
    well: 'POZO-104',
    source: 'threshold',
    severity: 'critical',
    urgency: 'inmediata',
    title: 'Paro total por falla eléctrica — POZO-104',
    diagnosis: 'El pozo reporta 0 bbl/d y horas de producción interrumpidas desde las 09:00. La causa reportada en campo es una falla eléctrica en el tablero de control de la unidad de bombeo mecánico. Se detectó además una condición de riesgo HSE (arco eléctrico) en el mismo tablero.',
    recommendation: 'Mantener el área acordonada y la libranza eléctrica vigente hasta que la cuadrilla de mantenimiento eléctrico libere el tablero. Documentar la causa raíz para el respaldo de NPT. No reenergizar sin autorización del responsable de seguridad eléctrica.',
    estimatedNptImpact: 'NPT acumulado actual: 4h 30min. Producción diferida estimada ≈ 27 bbl por cada hora adicional de paro.',
    dataConfidence: 'high',
    relatedManualSection: 'Procedimiento de libranza eléctrica del activo',
    monitoringIntervalMin: 60,
    status: 'acknowledged',
    triggeredAt: '09:00 AM',
  },
];

export const DEMO_ALERT_RULES = [
  { id: 'rule-1', metric: 'thp',              operator: 'drop_pct', threshold: 10, severity: 'warning',  scope: 'Todos los pozos BEC', active: true },
  { id: 'rule-2', metric: 'vibration',        operator: '>',        threshold: 0.75, severity: 'warning',  scope: 'Todos los pozos BEC', active: true },
  { id: 'rule-3', metric: 'motor_amp',        operator: '>',        threshold: 50, severity: 'critical', scope: 'POZO-102H', active: true },
  { id: 'rule-4', metric: 'production_hours', operator: '<',        threshold: 20, severity: 'info',     scope: 'Todo el activo', active: true },
  { id: 'rule-5', metric: 'bsw_pct',          operator: '>',        threshold: 30, severity: 'warning',  scope: 'Todo el activo', active: true },
  { id: 'rule-6', metric: 'net_oil_bbl',      operator: '<',        threshold: 100, severity: 'info',    scope: 'POZO-106', active: false },
];

// ----------------------------------------------------------------------------
// AUDITORÍA INMUTABLE (hash encadenado)
// ----------------------------------------------------------------------------
export interface AuditLog {
  id: string;
  user: string;
  action: string;
  target: string;
  hash: string;
  previousHash: string;
  timestamp: string;
}

export const DEMO_AUDIT: AuditLog[] = [
  { id: 'a-006', user: 'Ing. Carlos Mendoza',  action: 'exported',  target: 'Reporte Diario de Operaciones (PDF)', hash: '9f2a4c…e71b', previousHash: '3d8b1a…c042', timestamp: '24/06 11:42:08' },
  { id: 'a-005', user: 'Op. Antonio Pérez',     action: 'created',   target: 'Reporte diario POZO-101H',           hash: '3d8b1a…c042', previousHash: '7c19fe…a930', timestamp: '24/06 08:15:33' },
  { id: 'a-004', user: 'Sistema (IA)',          action: 'created',   target: 'Alerta gas-lock POZO-102H',          hash: '7c19fe…a930', previousHash: '1b44dd…f217', timestamp: '24/06 08:32:01' },
  { id: 'a-003', user: 'Op. Miguel Hernández',  action: 'created',   target: 'Paro NPT POZO-104 (eléctrica)',      hash: '1b44dd…f217', previousHash: 'e90a23…7b5c', timestamp: '24/06 09:02:47' },
  { id: 'a-002', user: 'Ing. Laura Sánchez',    action: 'updated',   target: 'Meta de producción Junio 2026',      hash: 'e90a23…7b5c', previousHash: '0000…génesis', timestamp: '24/06 07:50:12' },
  { id: 'a-001', user: 'Ing. Carlos Mendoza',   action: 'login',     target: 'Sesión iniciada',                    hash: '0000…génesis', previousHash: '—', timestamp: '24/06 07:48:55' },
];

// ----------------------------------------------------------------------------
// LOG DE IA (control de costos — ai_interactions)
// ----------------------------------------------------------------------------
export const DEMO_AI_INTERACTIONS = {
  voiceStructuring: { calls: 2700, model: 'Motor IA Oilboards · Voz', costUsd: 0.81 },
  alertDiagnosis:   { calls: 50,   model: 'Motor IA Oilboards · Diagnóstico', costUsd: 0.60 },
  assistantChat:    { calls: 20,   model: 'Motor IA Oilboards · Asistente', costUsd: 0.60 },
  totalUsd: 2.01,
};

// ----------------------------------------------------------------------------
// ESTADO DE SINCRONIZACIÓN (offline)
// ----------------------------------------------------------------------------
export interface SyncDevice {
  device: string;
  user: string;
  lastSync: string;
  pending: number;
  status: 'success' | 'partial' | 'syncing' | 'offline';
}

export const DEMO_SYNC: SyncDevice[] = [
  { device: 'Galaxy Tab Active4 · #A7F2', user: 'Op. Antonio Pérez',    lastSync: 'Hace 2 min',  pending: 0, status: 'success' },
  { device: 'Galaxy Tab Active4 · #B19C', user: 'Op. Miguel Hernández', lastSync: 'Hace 18 min', pending: 3, status: 'partial' },
  { device: 'iPad 10ª gen · #C4E1',       user: 'Ing. Carlos Mendoza',  lastSync: 'En curso…',   pending: 1, status: 'syncing' },
  { device: 'Getac ZX10 · #D7A3',         user: 'Op. Antonio Pérez',    lastSync: 'Hace 3h 12m', pending: 7, status: 'offline' },
];

// ----------------------------------------------------------------------------
// CONSOLA DE VOZ → IA (Doc 4, Prompt 1)
// ----------------------------------------------------------------------------
export const DEMO_VOICE_TRANSCRIPT = `Buenos días, soy el Toño, operador del pozo ciento uno H, turno matutino del veinticuatro de junio. Producción del día trescientos noventa barriles brutos, BSW al dieciocho por ciento, veintitrés horas y media en producción. Tuvimos un paro de cuatro horas en la madrugada, de las tres a las siete, por cambio de empaquetadura. Gas asociado: cero punto cuarenta y dos millones de pies cúbicos. Novedad: la presión venía un poco inestable desde la noche anterior. Sin incidentes de seguridad. Eso es todo.`;

export const DEMO_VOICE_STRUCTURED = {
  report_date: '2026-06-24',
  shift: 'matutino',
  well_name: 'POZO-101H',
  gross_oil_bbl: 390.0,
  bsw_pct: 18.0,
  net_oil_bbl: null,
  gas_mmscfd: 0.42,
  water_bbl: 70.0,
  gor: null,
  production_hours: 23.5,
  diesel_consumed_l: null,
  downtime_events: [
    { started_at: '2026-06-24T03:00:00', ended_at: '2026-06-24T07:00:00', duration_minutes: 240, category: 'mecanica', root_cause: 'Cambio de empaquetadura en cabezal' },
  ],
  hse_incidents: [],
  chemical_injections: [],
  raw_mentions: ['El operador menciona que la presión venía inestable desde la noche anterior'],
  confidence: 'high',
};

// ----------------------------------------------------------------------------
// ASISTENTE IA — conversación de muestra (Doc 4, Prompt 3)
// ----------------------------------------------------------------------------
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  time: string;
}

export const DEMO_CHAT: ChatMessage[] = [
  {
    role: 'user',
    content: '¿Cuál es el procedimiento para diagnosticar un gas-lock en la BEC del POZO-102H?',
    time: '10:45 AM',
  },
  {
    role: 'assistant',
    content: `Según el manual de la bomba BEC instalada en POZO-102H (Baker Hughes Centrilift GC6100, Sección 4.3 — Diagnóstico de Gas-Lock), los síntomas típicos incluyen:

1. Caída progresiva en THP sin reducción de frecuencia del variador
2. Aumento en la corriente del motor
3. Picos de vibración por encima de 0.75 mm/s

El procedimiento recomendado es:
• Reducir la frecuencia al rango inferior del equipo (verificar placa del motor)
• Abrir la línea de ventilación del espacio anular si aplica
• Monitorear la recuperación de presión de succión en 30 minutos

⚠️ Esta información debe validarse con el personal calificado y los procedimientos operativos del activo antes de ejecutarse.`,
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

El patrón sugiere que el pozo es susceptible a gas-lock cuando el GOR supera 1,450 scf/bbl, condición que se presentó en ambos eventos. El GOR actual del pozo es de 1,490 scf/bbl.`,
    time: '10:47 AM',
  },
];

export const DEMO_CHAT_SUGGESTIONS = [
  '¿Qué pozos están en riesgo de falla esta semana?',
  'Resume el NPT del activo en junio',
  '¿Cuál es la curva de declinación del POZO-105H?',
  '¿Qué dice el manual sobre la vibración máxima de la BEC?',
];

// ----------------------------------------------------------------------------
// MANUALES (RAG)
// ----------------------------------------------------------------------------
export const DEMO_MANUALS = [
  { title: 'Manual BEC Baker Hughes Centrilift GC6100', equipment: 'POZO-102H', status: 'indexed', pages: 342 },
  { title: 'Manual BEC Schlumberger REDA Maximus',      equipment: 'POZO-101H, 105H', status: 'indexed', pages: 418 },
  { title: 'Manual Unidad BM Lufkin C-640D',            equipment: 'POZO-104', status: 'indexed', pages: 196 },
  { title: 'Procedimientos Operativos del Activo',       equipment: 'General', status: 'indexed', pages: 87 },
  { title: 'Manual Válvulas Gas Lift Weatherford',       equipment: 'POZO-103, 107H', status: 'pending', pages: 154 },
];

// ----------------------------------------------------------------------------
// CENTRO DE REPORTES / EXPORTACIÓN (Doc 7)
// ----------------------------------------------------------------------------
export const DEMO_EXPORTS = [
  { id: 'exp-1', type: 'Reporte Diario de Operaciones', format: 'PDF',   period: '24/06/2026',          status: 'ready',      by: 'Ing. Carlos Mendoza', at: 'Hace 5 min' },
  { id: 'exp-2', type: 'Reporte de Cumplimiento CNE',   format: 'Excel', period: 'Junio 2026',          status: 'ready',      by: 'Ing. Laura Sánchez',  at: 'Hace 1h' },
  { id: 'exp-3', type: 'Resumen de NPT',                format: 'PDF',   period: '01/06 – 24/06/2026',  status: 'ready',      by: 'Ing. Carlos Mendoza', at: 'Ayer' },
  { id: 'exp-4', type: 'Reporte Diario de Operaciones', format: 'Excel', period: '23/06/2026',          status: 'ready',      by: 'Ing. Carlos Mendoza', at: 'Ayer' },
];

export const DEMO_REPORT_TYPES = [
  { code: 'daily_operations', name: 'Reporte Diario de Operaciones', desc: 'Resumen ejecutivo, detalle por pozo, paros y NPT, incidentes HSE.', formats: ['PDF', 'Excel'], audience: 'Dirección · CNE/SENER' },
  { code: 'npt_summary',      name: 'Resumen de Tiempos No Operativos', desc: 'Todos los paros del período por causa, con costo de producción diferida.', formats: ['PDF', 'Excel'], audience: 'Dirección · empresa estatal' },
  { code: 'regulatory_cne',   name: 'Reporte de Cumplimiento CNE', desc: 'Meta vs. real por mes, % cumplimiento y estatus regulatorio.', formats: ['Excel'], audience: 'Regulador CNE/SENER' },
];

// ----------------------------------------------------------------------------
// SERIES DE TIEMPO (SCADA — THP/FLP 24h del POZO-102H)
// ----------------------------------------------------------------------------
export const DEMO_THP_SERIES = Array.from({ length: 24 }, (_, i) => {
  const hour = i;
  const baseThp = 342;
  const drop = hour >= 6 ? (hour - 6) * 3.5 : 0;
  const noise = Math.sin(i * 0.8) * 4;
  return {
    time: `${String(hour).padStart(2, '0')}:00`,
    thp: Math.round(baseThp - drop + noise),
    flp: Math.round(180 - drop * 0.3 + noise * 0.5),
    threshold: 280,
  };
});

// Sparkline helper — genera 6 puntos por pozo (últimas 6h)
export function sparklineFor(well: DemoWell): number[] {
  return Array.from({ length: 6 }, (_, i) => {
    const noise = Math.sin(i * 1.5 + well.thpPsi * 0.01) * 8;
    const trend = well.status === 'alert' ? -i * 3 : 0;
    return Math.max(10, 40 - noise + trend);
  });
}

export const STATUS_META: Record<WellStatus, { label: string; color: string }> = {
  active:       { label: 'ACTIVO',       color: '#10B981' },
  alert:        { label: 'ALERTA',       color: '#F59E0B' },
  down:         { label: 'PARADO',       color: '#EF4444' },
  intervention: { label: 'INTERVENCIÓN', color: '#3B82F6' },
};

// ─────────────────────────────────────────────────────────────────
// MÓDULO 04 — Midstream / Gestión de Ductos
// ─────────────────────────────────────────────────────────────────
export type PipelineStatus = 'normal' | 'warning' | 'alert';
export interface PipelineSegment {
  id: string; name: string;
  kmStart: number; kmEnd: number;
  coords: [number, number][]; // [lng, lat] pairs
  pressureBar: number;        // presión actual en bar
  nominalBar: number;         // presión nominal
  status: PipelineStatus;
}

export const DEMO_PIPELINE_META = {
  name: 'Gasoducto Litoral Tabasco – Carmen',
  operator: 'Energía Sureste SA de CV',
  totalKm: 82,
  capacityMMpcd: 280,
  inletStation: 'Est. Macuspana (Tabasco)',
  outletStation: 'Est. Carmen (Campeche)',
  fluid: 'Gas natural húmedo',
};

export const DEMO_PIPELINE_SEGMENTS: PipelineSegment[] = [
  {
    id: 'seg-01', name: 'Macuspana → Buenavista', kmStart: 0, kmEnd: 12,
    coords: [[-92.60, 18.00], [-92.42, 18.10]],
    pressureBar: 98, nominalBar: 95, status: 'normal',
  },
  {
    id: 'seg-02', name: 'Buenavista → Paraíso', kmStart: 12, kmEnd: 26,
    coords: [[-92.42, 18.10], [-92.18, 18.22]],
    pressureBar: 94, nominalBar: 95, status: 'normal',
  },
  {
    id: 'seg-03', name: 'Paraíso → Chiltepec', kmStart: 26, kmEnd: 42,
    coords: [[-92.18, 18.22], [-91.92, 18.38]],
    pressureBar: 91, nominalBar: 95, status: 'normal',
  },
  {
    id: 'seg-04', name: 'Chiltepec → Mactún', kmStart: 42, kmEnd: 57,
    coords: [[-91.92, 18.38], [-91.65, 18.50]],
    pressureBar: 72, nominalBar: 95, status: 'alert', // ← anomalía
  },
  {
    id: 'seg-05', name: 'Mactún → Frontera', kmStart: 57, kmEnd: 68,
    coords: [[-91.65, 18.50], [-91.48, 18.58]],
    pressureBar: 80, nominalBar: 95, status: 'warning',
  },
  {
    id: 'seg-06', name: 'Frontera → Isla del Carmen', kmStart: 68, kmEnd: 82,
    coords: [[-91.48, 18.58], [-91.82, 18.65]],
    pressureBar: 87, nominalBar: 95, status: 'normal',
  },
];

// Perfil de presión a lo largo del ducto (por km 0-82)
export const DEMO_PIPELINE_PRESSURE = Array.from({ length: 83 }, (_, km) => {
  let p = 98 - km * 0.07; // caída natural de 0.07 bar/km
  if (km >= 42 && km <= 57) {
    // caída anómala: 18 bar en 15 km
    const fraction = (km - 42) / 15;
    p -= fraction * 18;
  } else if (km > 57 && km <= 68) {
    // recuperación parcial
    const fraction = (km - 57) / 11;
    p = (72 - 12) + fraction * 8; // sube de 60 → 68 bar
  }
  return { km, bar: Math.round(p * 10) / 10 };
});

export const DEMO_PIPELINE_KPIS = {
  volTransportadoMMpcd: 214.6,
  presionEntradaBar: 98.2,
  presionSalidaBar: 87.1,
  balancePct: 94.3,        // % entregado vs inyectado
  perdidaMMpcd: 12.4,      // MMpcd "no contabilizados"
};

export const DEMO_PIPELINE_ALERT = {
  segmentId: 'seg-04',
  segmentName: 'Chiltepec – Mactún (KP-42 a KP-57)',
  caida: '18%',
  detectedAt: '10:14 AM',
  urgency: 'INMEDIATA',
  confidence: 'Alta',
  diagnosis: 'Caída de 18% en presión entre KP-42 y KP-57 inconsistente con el consumo programado por las centrales de CFE. La pérdida de 12.4 MMpcd supera en 3.8σ la varianza histórica del tramo.',
  recommendation: 'Despachar patrulla de inspección al tramo KP-42–KP-57 de inmediato. Notificar a ASEA conforme al Artículo 78 del RISEA. Considerar cierre de válvula de bloqueo V-42B hasta verificar integridad.',
  source: 'ML · Oilboards',
};

// ─────────────────────────────────────────────────────────────────
// MÓDULO 05 — EAM (Mantenimiento Predictivo de Activos Físicos)
// ─────────────────────────────────────────────────────────────────
export interface AssetHealth {
  id: string; name: string; type: string; well: string;
  daysToFailure: number; confidence: number; // 0-100
  lastMaintenanceDays: number; status: 'ok' | 'warn' | 'critical';
}

export const DEMO_ASSETS_HEALTH: AssetHealth[] = [
  { id: 'a-01', name: 'BEC Reda N4500',  type: 'Bomba Electrocentrífuga', well: 'POZO-102H', daysToFailure: 6,  confidence: 82, lastMaintenanceDays: 148, status: 'critical' },
  { id: 'a-02', name: 'Compresor C-12',  type: 'Compresor Recíproco',     well: 'POZO-103',  daysToFailure: 14, confidence: 71, lastMaintenanceDays: 87,  status: 'warn' },
  { id: 'a-03', name: 'BM Lufkin 640D',  type: 'Bomba Mecánica',          well: 'POZO-108',  daysToFailure: 22, confidence: 68, lastMaintenanceDays: 55,  status: 'warn' },
  { id: 'a-04', name: 'BEC Centrilift',  type: 'Bomba Electrocentrífuga', well: 'POZO-101H', daysToFailure: 35, confidence: 60, lastMaintenanceDays: 30,  status: 'ok' },
  { id: 'a-05', name: 'Válvula V-42B',   type: 'Válvula de Bloqueo',      well: 'Ducto',     daysToFailure: 41, confidence: 55, lastMaintenanceDays: 210, status: 'ok' },
  { id: 'a-06', name: 'Generador GEN-3', type: 'Generador Diésel',        well: 'Batería',   daysToFailure: 58, confidence: 72, lastMaintenanceDays: 12,  status: 'ok' },
  { id: 'a-07', name: 'VSD Siemens G120',type: 'Variador de Velocidad',   well: 'POZO-105H', daysToFailure: 72, confidence: 65, lastMaintenanceDays: 22,  status: 'ok' },
];

export interface SparePartItem {
  id: string; name: string; partNumber: string;
  warehouse: string; stock: number; unit: string;
  forAsset: string; status: 'available' | 'low' | 'out';
}

export const DEMO_INVENTORY: SparePartItem[] = [
  { id: 'sp-01', name: 'Sello mecánico BEC Reda N4500', partNumber: 'R-4500-SM-02', warehouse: 'Bodega Cd. del Carmen', stock: 2, unit: 'pza', forAsset: 'a-01', status: 'available' },
  { id: 'sp-02', name: 'Rodamiento SKF 6310-2RS',       partNumber: 'SKF-6310-2RS', warehouse: 'Bodega Cd. del Carmen', stock: 8, unit: 'pza', forAsset: 'a-01', status: 'available' },
  { id: 'sp-03', name: 'Cable de motor 4 AWG 5kV',      partNumber: 'CAB-4AWG-5KV', warehouse: 'Bodega Coatzacoalcos', stock: 45, unit: 'm', forAsset: 'a-01', status: 'available' },
  { id: 'sp-04', name: 'Válvula check 3" ANSI 600',     partNumber: 'VLV-3-A600',   warehouse: 'Bodega Cd. del Carmen', stock: 1, unit: 'pza', forAsset: 'a-03', status: 'low' },
  { id: 'sp-05', name: 'Anillos de pistón compresor C-12', partNumber: 'CP12-RNG-S', warehouse: 'En tránsito',          stock: 0, unit: 'kit', forAsset: 'a-02', status: 'out' },
];

export interface WorkOrder {
  id: string; folio: string; asset: string; well: string;
  type: 'predictiva' | 'correctiva' | 'programada';
  priority: 'alta' | 'media' | 'baja';
  status: 'abierta' | 'en_proceso' | 'completada';
  technician: string; createdAt: string; dueDate: string;
  aiGenerated: boolean;
}

export const DEMO_WORK_ORDERS: WorkOrder[] = [
  { id: 'wo-01', folio: 'OT-2026-0841', asset: 'BEC Reda N4500', well: 'POZO-102H', type: 'predictiva', priority: 'alta', status: 'abierta', technician: 'Ing. Roberto Sosa', createdAt: '24 Jun · 08:33', dueDate: '27 Jun', aiGenerated: true },
  { id: 'wo-02', folio: 'OT-2026-0840', asset: 'Compresor C-12', well: 'POZO-103', type: 'predictiva', priority: 'media', status: 'en_proceso', technician: 'Ing. Diana Cruz', createdAt: '23 Jun · 14:10', dueDate: '01 Jul', aiGenerated: true },
  { id: 'wo-03', folio: 'OT-2026-0835', asset: 'BM Lufkin 640D', well: 'POZO-104', type: 'correctiva', priority: 'alta', status: 'completada', technician: 'Ing. Marco Peralta', createdAt: '20 Jun · 09:00', dueDate: '24 Jun', aiGenerated: false },
  { id: 'wo-04', folio: 'OT-2026-0838', asset: 'Generador GEN-3', well: 'Batería', type: 'programada', priority: 'baja', status: 'abierta', technician: 'Ing. Fernanda López', createdAt: '22 Jun · 11:30', dueDate: '05 Jul', aiGenerated: false },
];

// ─────────────────────────────────────────────────────────────────
// MÓDULO 06 — ESG (Emisiones y Huella de Carbono)
// ─────────────────────────────────────────────────────────────────
export const DEMO_ESG_KPIS = {
  gasAprovechamientoPct: 95.8,
  gasQuemadoMMpcd: 0.89,
  co2eTodayTon: 12.4,
  co2eMonthTon: 318.6,
  intensidadKgCo2eBbl: 4.82,
  metanoTonMonth: 8.3,
  targetAprovechamientoPct: 98.0,   // meta CNE
  abrillantadorCo2eKg: 2.75,         // kg CO₂e por m³ gas quemado
};

export const DEMO_ESG_MONTHLY = [
  { month: 'Ene', aprovechamiento: 94.1, meta: 98.0, co2e: 388 },
  { month: 'Feb', aprovechamiento: 95.0, meta: 98.0, co2e: 352 },
  { month: 'Mar', aprovechamiento: 96.2, meta: 98.0, co2e: 310 },
  { month: 'Abr', aprovechamiento: 94.8, meta: 98.0, co2e: 367 },
  { month: 'May', aprovechamiento: 96.7, meta: 98.0, co2e: 295 },
  { month: 'Jun', aprovechamiento: 95.8, meta: 98.0, co2e: 319 },
];

export interface Co2ConversionEvent {
  well: string; date: string; nptHours: number;
  gasVentedMpcd: number; co2eTon: number; cause: string;
}

export const DEMO_CO2_EVENTS: Co2ConversionEvent[] = [
  { well: 'POZO-104',  date: '24 Jun', nptHours: 4.5,  gasVentedMpcd: 0.32, co2eTon: 1.9,  cause: 'Falla eléctrica tablero' },
  { well: 'POZO-107H', date: '21 Jun', nptHours: 18.0, gasVentedMpcd: 1.10, co2eTon: 6.6,  cause: 'Reparación mayor programada' },
  { well: 'POZO-102H', date: '15 Jun', nptHours: 8.0,  gasVentedMpcd: 0.55, co2eTon: 3.3,  cause: 'Gas-lock (evento previo)' },
  { well: 'POZO-103',  date: '08 Jun', nptHours: 2.0,  gasVentedMpcd: 0.12, co2eTon: 0.7,  cause: 'Ajuste de cabezal' },
];

// ----------------------------------------------------------------------------
// MÓDULO 07 · POZOS 3D — Modelo del subsuelo (wellbore navegable)
// Derivado de DEMO_WELLS para no contradecir la Matriz de Pozos. Geometría
// procedural (sin assets). Profundidades en metros; el componente 3D escala.
//   - trajectory: puntos {md, tvd, horiz} de la trayectoria (vertical → curva → lateral)
//   - casings:    sartas de revestimiento telescópicas (zapata = bottomMd)
//   - formations: estratos geológicos (yacimiento resaltado)
//   - equipment:  equipo de fondo según el tipo de levantamiento
//   - anomaly:    marcador a la profundidad relevante (solo pozos con evento)
// ----------------------------------------------------------------------------
export interface WellborePoint { md: number; tvd: number; horiz: number; }
export interface Casing { label: string; topMd: number; bottomMd: number; odIn: number; }
export interface Formation { name: string; topFrac: number; botFrac: number; color: string; reservoir?: boolean; }
export interface DownholeEquipment {
  kind: 'esp' | 'rod' | 'gaslift' | 'natural';
  label: string;
  md: number;                 // profundidad del equipo principal (bomba / No-go)
  mandrelMds?: number[];      // gas lift: profundidad de mandriles
}
export interface WellboreAnomaly {
  md: number; title: string; detail: string;
  severity: 'high' | 'medium' | 'down' | 'intervention'; color: string;
}
export interface Wellbore {
  wellId: string;
  isHorizontal: boolean;
  tdMd: number;               // profundidad total medida (MD)
  tdTvd: number;              // profundidad vertical verdadera (TVD)
  trajectory: WellborePoint[];
  casings: Casing[];
  formations: Formation[];
  equipment: DownholeEquipment;
  anomaly?: WellboreAnomaly;
}

// Estratos típicos de la cuenca (fracciones de la profundidad total) — el último
// es el yacimiento productor, resaltado en color.
const FORMATIONS: Formation[] = [
  { name: 'Sedimentos recientes', topFrac: 0.00, botFrac: 0.10, color: '#6b5b4a' },
  { name: 'Lutita superior',      topFrac: 0.10, botFrac: 0.33, color: '#4b5563' },
  { name: 'Arenisca',             topFrac: 0.33, botFrac: 0.52, color: '#8a7a5c' },
  { name: 'Caliza',               topFrac: 0.52, botFrac: 0.74, color: '#737d8c' },
  { name: 'Lutita sello',         topFrac: 0.74, botFrac: 0.88, color: '#374151' },
  { name: 'Yacimiento (arena productora)', topFrac: 0.88, botFrac: 1.00, color: '#10B981', reservoir: true },
];

function buildTrajectory(tvd: number, isHorizontal: boolean): { points: WellborePoint[]; tdMd: number } {
  const pts: WellborePoint[] = [];
  if (!isHorizontal) {
    // Pozo vertical: MD = TVD
    for (let i = 0; i <= 10; i++) {
      const d = (tvd * i) / 10;
      pts.push({ md: d, tvd: d, horiz: 0 });
    }
    return { points: pts, tdMd: tvd };
  }
  // Pozo horizontal: vertical → KOP → build de 90° → lateral en el yacimiento
  const kopTvd = tvd * 0.7;               // kick-off point
  const buildLen = tvd * 0.22;            // longitud de la sección de curvatura (radio largo)
  const lateralLen = tvd * 0.32;          // alcance lateral dentro del yacimiento
  let md = 0;
  // Tramo vertical hasta KOP
  for (let i = 0; i <= 7; i++) {
    const d = (kopTvd * i) / 7;
    pts.push({ md: d, tvd: d, horiz: 0 });
  }
  md = kopTvd;
  // Build section: cuarto de círculo de radio R hasta la horizontal
  const R = buildLen / (Math.PI / 2);
  const steps = 8;
  for (let i = 1; i <= steps; i++) {
    const ang = (Math.PI / 2) * (i / steps);     // 0 → 90°
    const tvdI = kopTvd + R * Math.sin(ang);
    const horizI = R * (1 - Math.cos(ang));
    md += (buildLen / steps);
    pts.push({ md, tvd: tvdI, horiz: horizI });
  }
  // Lateral horizontal dentro del yacimiento
  const baseTvd = pts[pts.length - 1].tvd;
  const baseHoriz = pts[pts.length - 1].horiz;
  for (let i = 1; i <= 6; i++) {
    const h = baseHoriz + (lateralLen * i) / 6;
    md += lateralLen / 6;
    pts.push({ md, tvd: baseTvd, horiz: h });
  }
  return { points: pts, tdMd: md };
}

function buildEquipment(w: DemoWell): DownholeEquipment {
  const lt = w.liftType;
  const td = w.depthM;
  if (lt === 'BEC') {
    return { kind: 'esp', label: `BEC · ${w.equipment?.model ?? 'Bomba electrocentrífuga'}`, md: td * 0.84 };
  }
  if (lt === 'BM') {
    return { kind: 'rod', label: `Balancín · bomba de fondo (${w.equipment?.model ?? 'BM'})`, md: td * 0.92 };
  }
  if (lt === 'Gas Lift') {
    return { kind: 'gaslift', label: 'Bombeo neumático · mandriles de inyección', md: td * 0.78,
      mandrelMds: [td * 0.30, td * 0.46, td * 0.60, td * 0.72] };
  }
  return { kind: 'natural', label: 'Flujo natural · aparejo de producción', md: td * 0.80 };
}

function buildAnomaly(w: DemoWell): WellboreAnomaly | undefined {
  const td = w.depthM;
  if (w.id === 'pozo-102h') {
    return { md: td * 0.84, severity: 'high', color: '#F59E0B',
      title: 'Riesgo de Gas-Lock en la BEC',
      detail: 'Segregación de gas a la profundidad de la bomba: caída escalonada de THP + picos de vibración. Revisar frecuencia del variador. Sujeto a validación del ingeniero responsable.' };
  }
  if (w.id === 'pozo-104') {
    return { md: td * 0.92, severity: 'down', color: '#EF4444',
      title: 'Pozo parado — falla eléctrica',
      detail: 'Tablero de control sin energía; bomba de fondo detenida. NPT en curso. Cuadrilla eléctrica en sitio.' };
  }
  if (w.id === 'pozo-107h') {
    return { md: td * 0.55, severity: 'intervention', color: '#3B82F6',
      title: 'Reparación mayor en curso',
      detail: 'Intervención programada con equipo de workover. Recuperación de aparejo de gas lift para cambio de mandriles.' };
  }
  return undefined;
}

export const DEMO_WELLBORES: Record<string, Wellbore> = Object.fromEntries(
  DEMO_WELLS.map((w) => {
    const isHorizontal = w.name.endsWith('H');
    const tvd = isHorizontal ? Math.round(w.depthM * 0.82) : w.depthM;  // MD>TVD en horizontales
    const { points, tdMd } = buildTrajectory(tvd, isHorizontal);
    const casings: Casing[] = [
      { label: 'Conductor 30"',      topMd: 0, bottomMd: Math.round(tvd * 0.03), odIn: 30 },
      { label: 'Superficial 13⅜"',   topMd: 0, bottomMd: Math.round(tvd * 0.24), odIn: 13.375 },
      { label: 'Intermedio 9⅝"',     topMd: 0, bottomMd: Math.round(tvd * 0.66), odIn: 9.625 },
      { label: 'Producción 7"',      topMd: 0, bottomMd: Math.round(tdMd * 0.97), odIn: 7 },
    ];
    return [w.id, {
      wellId: w.id, isHorizontal, tdMd: Math.round(tdMd), tdTvd: tvd,
      trajectory: points, casings, formations: FORMATIONS,
      equipment: buildEquipment(w), anomaly: buildAnomaly(w),
    } as Wellbore];
  })
);

// ----------------------------------------------------------------------------
// CARTA DINAMOMÉTRICA (dynacard) — diagnóstico estándar de bombeo mecánico.
// Carga del vástago pulido (lb) vs. posición (% de carrera). El lazo cerrado y
// su forma diagnostican el estado de la bomba de fondo (llenado, golpe de
// fluido, interferencia de gas, varilla partida). Carta de SUPERFICIE.
// Generada para POZO-108 (Lufkin C-456D, SPM 8.5) — llenado normal.
// ----------------------------------------------------------------------------
export interface DynaCard {
  well: string; model: string; spm: number; strokeIn: number;
  peakLoadLb: number; minLoadLb: number; diagnosis: string;
  points: [number, number][]; // [posición %, carga lb]
}

export const DEMO_DYNACARD: DynaCard = (() => {
  const N = 90;
  const Wr = 9200;   // peso flotante de varillas (lb) — meseta inferior (downstroke)
  const Wf = 4300;   // carga de fluido (lb) — se suma en upstroke
  const sstep = (a: number, b: number, x: number) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const pts: [number, number][] = [];
  for (let i = 0; i <= N; i++) {
    const ang = (Math.PI * 2 * i) / N;          // ciclo completo
    const pos = (1 - Math.cos(ang)) / 2;         // 0 abajo → 1 arriba → 0
    const up = Math.sin(ang) >= 0;               // mitad de subida vs bajada
    const noise = (Math.random() - 0.5) * Wf * 0.02;
    let load: number;
    if (up) {
      // Pickup de fluido cerca del fondo, leve descarga cerca del tope
      load = Wr + Wf * (sstep(0.04, 0.18, pos) - sstep(0.9, 1.0, pos) * 0.12) + noise;
    } else {
      // Downstroke: meseta inferior (sin carga de fluido), con leve curvatura
      load = Wr + Wf * (0.05 + sstep(0.0, 0.1, 1 - pos) * 0.04) + noise;
    }
    pts.push([Math.round(pos * 1000) / 10, Math.round(load)]);
  }
  const loads = pts.map((p) => p[1]);
  return {
    well: 'POZO-108', model: 'Lufkin C-456D', spm: 8.5, strokeIn: 120,
    peakLoadLb: Math.max(...loads), minLoadLb: Math.min(...loads),
    diagnosis: 'Llenado completo de bomba · sin golpe de fluido ni interferencia de gas',
    points: pts,
  };
})();
