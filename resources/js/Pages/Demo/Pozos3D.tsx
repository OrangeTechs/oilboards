import { Suspense, lazy, useMemo, useState } from 'react';
import { Layers, Box, Wrench, Mountain, Rotate3d, X } from 'lucide-react';
import { DEMO_WELLS, DEMO_WELLBORES, type WellboreAnomaly } from '@/data/demoData';

const Wellbore3D = lazy(() => import('@/Components/Shared/Wellbore3D'));

const STATUS_LABEL: Record<string, { txt: string; color: string }> = {
  active: { txt: 'Activo', color: '#10B981' },
  alert: { txt: 'Alerta', color: '#F59E0B' },
  down: { txt: 'Parado', color: '#EF4444' },
  intervention: { txt: 'Intervención', color: '#3B82F6' },
};

export default function Pozos3D() {
  const [wellId, setWellId] = useState(DEMO_WELLS[1].id); // arranca en POZO-102H (con anomalía)
  const [toggles, setToggles] = useState({ formations: true, casings: true, equipment: true });
  const [picked, setPicked] = useState<WellboreAnomaly | null>(null);

  const well = useMemo(() => DEMO_WELLS.find((w) => w.id === wellId)!, [wellId]);
  const wb = DEMO_WELLBORES[wellId];
  const st = STATUS_LABEL[well.status];

  const selectWell = (id: string) => { setWellId(id); setPicked(null); };

  const tog = (k: keyof typeof toggles) => setToggles((t) => ({ ...t, [k]: !t[k] }));

  const ToggleBtn = ({ k, icon: Icon, label }: { k: keyof typeof toggles; icon: any; label: string }) => (
    <button
      onClick={() => tog(k)}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${toggles[k] ? 'bg-[#10B981]/15 border-[#10B981]/40 text-[#10B981]' : 'bg-[#1F2937]/40 border-[#374151] text-[#6B7280] hover:text-[#9CA3AF]'}`}
    >
      <Icon size={13} /> {label}
    </button>
  );

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Box size={18} className="text-[#3B82F6]" /> Gemelo Digital del Subsuelo · Pozos 3D
          </h2>
          <p className="text-sm text-[#9CA3AF]">Trayectoria, revestimientos, estratigrafía y equipo de fondo. Arrastra para orbitar · rueda para acercar.</p>
        </div>
        <select
          value={wellId}
          onChange={(e) => selectWell(e.target.value)}
          className="bg-[#0B0F19] border border-[#374151] text-white rounded-xl px-4 py-2 text-sm font-mono focus:outline-none focus:border-[#10B981]"
        >
          {DEMO_WELLS.map((w) => (
            <option key={w.id} value={w.id}>{w.name} · {w.liftType}</option>
          ))}
        </select>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-5">
        {/* Escena 3D */}
        <div className="glass rounded-2xl overflow-hidden relative">
          {/* Toggles de capas */}
          <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-2">
            <ToggleBtn k="formations" icon={Mountain} label="Estratos" />
            <ToggleBtn k="casings" icon={Layers} label="Revestimientos" />
            <ToggleBtn k="equipment" icon={Wrench} label="Equipo de fondo" />
          </div>
          {/* Badge de estado */}
          <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{ backgroundColor: `${st.color}1A`, color: st.color, border: `1px solid ${st.color}55` }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: st.color }} /> {st.txt}
          </div>
          {/* Hint de rotación */}
          <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 text-[10px] text-[#6B7280]">
            <Rotate3d size={12} /> Gira automáticamente · interactúa para controlar
          </div>

          <Suspense fallback={<div className="h-[560px] flex items-center justify-center text-sm text-[#6B7280]">Cargando gemelo 3D…</div>}>
            <Wellbore3D wellbore={wb} toggles={toggles} onPick={setPicked} height={560} />
          </Suspense>
        </div>

        {/* Panel lateral */}
        <div className="space-y-4">
          {/* Ficha del pozo */}
          <div className="glass rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="font-mono font-bold text-white">{well.name}</div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1F2937] text-[#9CA3AF]">{well.liftType}</span>
            </div>
            <div className="grid grid-cols-2 gap-y-2.5 gap-x-3 text-sm">
              <Metric label="Trayectoria" value={wb.isHorizontal ? 'Horizontal' : 'Vertical'} />
              <Metric label="Prof. medida (MD)" value={`${wb.tdMd.toLocaleString()} m`} mono />
              <Metric label="Prof. vertical (TVD)" value={`${wb.tdTvd.toLocaleString()} m`} mono />
              <Metric label="Producción" value={`${well.netOilBbl} bbl/d`} mono />
              <Metric label="THP (PT)" value={`${well.thpPsi} psi`} mono />
              <Metric label="PC (anular)" value={well.pcPsi ? `${well.pcPsi} psi` : '—'} mono />
            </div>
          </div>

          {/* Revestimientos */}
          <div className="glass rounded-2xl p-4">
            <div className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider mb-2.5">Diseño de revestimientos</div>
            <div className="space-y-1.5">
              {wb.casings.map((c) => (
                <div key={c.label} className="flex items-center justify-between text-xs">
                  <span className="text-[#E5E7EB]">{c.label}</span>
                  <span className="font-mono text-[#6B7280]">zapata {c.bottomMd.toLocaleString()} m</span>
                </div>
              ))}
            </div>
          </div>

          {/* Equipo de fondo */}
          <div className="glass rounded-2xl p-4">
            <div className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider mb-2">Equipo de fondo</div>
            <div className="text-sm text-white">{wb.equipment.label}</div>
            <div className="text-xs font-mono text-[#6B7280] mt-0.5">@ {Math.round(wb.equipment.md).toLocaleString()} m MD</div>
          </div>

          {/* Anomalía / diagnóstico */}
          {wb.anomaly ? (
            <button
              onClick={() => setPicked(wb.anomaly!)}
              className="w-full text-left glass rounded-2xl p-4 border"
              style={{ borderColor: `${wb.anomaly.color}55` }}
            >
              <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: wb.anomaly.color }}>
                ⚠ {wb.anomaly.title}
              </div>
              <div className="text-xs font-mono text-[#6B7280] mt-1">@ {Math.round(wb.anomaly.md).toLocaleString()} m MD · clic para detalle</div>
            </button>
          ) : (
            <div className="glass rounded-2xl p-4 text-sm text-[#10B981] flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" /> Sin anomalías de fondo detectadas.
            </div>
          )}
        </div>
      </div>

      {/* Modal de detalle de anomalía */}
      {picked && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4" onClick={() => setPicked(null)}>
          <div className="glass rounded-2xl p-6 max-w-md w-full border" style={{ borderColor: `${picked.color}66` }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-3">
              <div className="text-base font-bold flex items-center gap-2" style={{ color: picked.color }}>⚠ {picked.title}</div>
              <button onClick={() => setPicked(null)} className="text-[#6B7280] hover:text-white"><X size={18} /></button>
            </div>
            <div className="text-xs font-mono text-[#6B7280] mb-3">{well.name} · @ {Math.round(picked.md).toLocaleString()} m MD</div>
            <p className="text-sm text-[#E5E7EB] leading-relaxed">{picked.detail}</p>
            <div className="mt-4 text-[11px] text-[#9CA3AF] border-t border-[#374151] pt-3">
              ⚠️ Sugerencia generada por el Motor de IA Oilboards (ML). Sujeta a validación del ingeniero responsable del activo.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-[10px] text-[#6B7280]">{label}</div>
      <div className={`text-[#E5E7EB] ${mono ? 'font-mono' : ''}`}>{value}</div>
    </div>
  );
}
