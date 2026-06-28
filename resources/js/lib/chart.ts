// Tema oscuro Tesla-sleek compartido para ECharts

export const C = {
  green: '#10B981',
  red: '#EF4444',
  yellow: '#F59E0B',
  blue: '#3B82F6',
  purple: '#8B5CF6',
  text: '#F9FAFB',
  muted: '#9CA3AF',
  faint: '#6B7280',
  grid: '#1F2937',
  border: '#374151',
  bg: '#0B0F19',
  surface: '#111827',
};

export const tooltipStyle = {
  backgroundColor: 'rgba(11,15,25,0.95)',
  borderColor: C.border,
  borderWidth: 1,
  textStyle: { color: C.text, fontSize: 12, fontFamily: 'JetBrains Mono, monospace' },
  extraCssText: 'border-radius:10px; box-shadow:0 10px 40px -10px rgba(0,0,0,0.8); backdrop-filter: blur(8px);',
};

export const axisX = (extra: object = {}) => ({
  type: 'category',
  axisLine: { lineStyle: { color: C.border } },
  axisLabel: { color: C.faint, fontSize: 10 },
  axisTick: { show: false },
  ...extra,
});

export const axisY = (extra: object = {}) => ({
  type: 'value',
  axisLine: { show: false },
  axisLabel: { color: C.faint, fontSize: 10 },
  splitLine: { lineStyle: { color: C.grid } },
  ...extra,
});

export function areaGradient(hex: string, topOpacity = 0.28) {
  return {
    type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
    colorStops: [
      { offset: 0, color: hexA(hex, topOpacity) },
      { offset: 1, color: hexA(hex, 0) },
    ],
  };
}

export function hexA(hex: string, a: number) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

export const baseGrid = { left: 8, right: 16, top: 28, bottom: 8, containLabel: true };
