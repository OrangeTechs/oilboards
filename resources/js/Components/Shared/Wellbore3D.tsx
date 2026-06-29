import { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Lightformer, Html, Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import type { Wellbore, WellboreAnomaly } from '@/data/demoData';

// ---------------------------------------------------------------------------
// Materiales (reflejan el Environment, mismo lenguaje que Well3D.tsx)
// ---------------------------------------------------------------------------
const steel = new THREE.MeshStandardMaterial({ color: '#9aa6b6', metalness: 1, roughness: 0.28 });
const darkSteel = new THREE.MeshStandardMaterial({ color: '#3a414c', metalness: 1, roughness: 0.45 });
const tubingMat = new THREE.MeshStandardMaterial({ color: '#c7d2e0', metalness: 1, roughness: 0.22 });

// Layout vertical de la escena: superficie en TOP, fondo del pozo en -TOP.
const TOP = 4.2;
const SPAN = 8.4; // altura total de la escena en unidades

interface Toggles { formations: boolean; casings: boolean; equipment: boolean; }

// Interpola {horiz, tvd} a una profundidad medida (MD) dada sobre la trayectoria.
function makeInterp(wb: Wellbore) {
  const t = wb.trajectory;
  return (md: number) => {
    if (md <= t[0].md) return { horiz: t[0].horiz, tvd: t[0].tvd };
    for (let i = 1; i < t.length; i++) {
      if (md <= t[i].md) {
        const a = t[i - 1], b = t[i];
        const f = (md - a.md) / (b.md - a.md || 1);
        return { horiz: a.horiz + (b.horiz - a.horiz) * f, tvd: a.tvd + (b.tvd - a.tvd) * f };
      }
    }
    const last = t[t.length - 1];
    return { horiz: last.horiz, tvd: last.tvd };
  };
}

function SceneContent({ wb, toggles, onPick }: { wb: Wellbore; toggles: Toggles; onPick: (a: WellboreAnomaly) => void }) {
  // Escala: normaliza la TVD total a SPAN unidades; horiz usa la misma escala.
  const scale = SPAN / wb.tdTvd;
  const xShift = -1.4;
  const yOf = (tvd: number) => TOP - tvd * scale;
  const xOf = (horiz: number) => horiz * scale + xShift;
  const interp = useMemo(() => makeInterp(wb), [wb]);
  const posOf = (md: number) => {
    const p = interp(md);
    return new THREE.Vector3(xOf(p.horiz), yOf(p.tvd), 0);
  };

  // Curva del pozo (aparejo de producción) a partir de la trayectoria
  const curve = useMemo(() => {
    const v = wb.trajectory.map((p) => new THREE.Vector3(xOf(p.horiz), yOf(p.tvd), 0));
    return new THREE.CatmullRomCurve3(v);
  }, [wb]);

  return (
    <group>
      {/* Estratos geológicos: losas semitransparentes detrás del pozo (corte) */}
      {toggles.formations && wb.formations.map((f) => {
        const topY = yOf(wb.tdTvd * f.topFrac);
        const botY = yOf(wb.tdTvd * f.botFrac);
        const h = topY - botY;
        const cy = (topY + botY) / 2;
        return (
          <group key={f.name}>
            <mesh position={[0.2, cy, -1.15]}>
              <boxGeometry args={[9, h, 3.2]} />
              <meshStandardMaterial color={f.color} transparent opacity={f.reservoir ? 0.42 : 0.26} roughness={0.95} metalness={0} />
            </mesh>
            {/* línea de tope de estrato */}
            <mesh position={[0.2, topY, 0.36]}>
              <boxGeometry args={[9, 0.012, 0.01]} />
              <meshBasicMaterial color={f.reservoir ? '#10B981' : '#4b5563'} />
            </mesh>
            <Billboard position={[4.9, cy, 0.4]}>
              <Text fontSize={0.17} color={f.reservoir ? '#34d399' : '#94a3b8'} anchorX="left" anchorY="middle" maxWidth={3}>
                {f.name}
              </Text>
            </Billboard>
          </group>
        );
      })}

      {/* Superficie + cabezal */}
      <mesh position={[xShift, TOP, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.9, 40]} />
        <meshStandardMaterial color="#1b2230" metalness={0.5} roughness={0.7} />
      </mesh>
      <mesh material={steel} position={[xShift, TOP + 0.18, 0]}>
        <cylinderGeometry args={[0.16, 0.2, 0.4, 20]} />
      </mesh>
      <mesh material={darkSteel} position={[xShift, TOP + 0.42, 0]}>
        <boxGeometry args={[0.5, 0.14, 0.5]} />
      </mesh>

      {/* Sartas de revestimiento telescópicas (verticales, hasta su zapata) */}
      {toggles.casings && wb.casings.map((c, i) => {
        const shoe = interp(c.bottomMd);
        const topY = TOP;
        const botY = yOf(shoe.tvd);
        const h = topY - botY;
        const r = 0.07 + i * 0.055;
        return (
          <group key={c.label}>
            <mesh position={[xShift, (topY + botY) / 2, 0]}>
              <cylinderGeometry args={[r, r, h, 24, 1, true]} />
              <meshStandardMaterial color="#7c8696" metalness={0.9} roughness={0.4} transparent opacity={0.5} side={THREE.DoubleSide} />
            </mesh>
            {/* zapata (collar) */}
            <mesh material={darkSteel} position={[xShift, botY, 0]}>
              <cylinderGeometry args={[r + 0.02, r + 0.02, 0.06, 24]} />
            </mesh>
          </group>
        );
      })}

      {/* Aparejo de producción siguiendo la trayectoria */}
      <mesh>
        <tubeGeometry args={[curve, 120, 0.05, 12, false]} />
        <primitive object={tubingMat} attach="material" />
      </mesh>

      {/* Equipo de fondo */}
      {toggles.equipment && <DownholeEquip wb={wb} posOf={posOf} />}

      {/* Marcador de anomalía (pulsante, clickeable) */}
      {wb.anomaly && <AnomalyMarker anomaly={wb.anomaly} pos={posOf(wb.anomaly.md)} onPick={onPick} />}

      {/* Riel de profundidad: marcas cada ~500 m sobre el eje vertical */}
      <DepthTicks tdTvd={wb.tdTvd} yOf={yOf} x={xShift - 2.4} />
    </group>
  );
}

function DownholeEquip({ wb, posOf }: { wb: Wellbore; posOf: (md: number) => THREE.Vector3 }) {
  const e = wb.equipment;
  const p = posOf(e.md);
  if (e.kind === 'esp') {
    // BEC: tren motor + sello + bomba
    return (
      <group position={p.toArray()}>
        <mesh material={steel} position={[0, 0.22, 0]}><cylinderGeometry args={[0.09, 0.09, 0.34, 16]} /></mesh>
        <mesh material={darkSteel} position={[0, -0.02, 0]}><cylinderGeometry args={[0.085, 0.085, 0.14, 16]} /></mesh>
        <mesh material={steel} position={[0, -0.26, 0]}><cylinderGeometry args={[0.1, 0.1, 0.34, 16]} /></mesh>
      </group>
    );
  }
  if (e.kind === 'rod') {
    // Balancín: sarta de varillas (vertical) + bomba de fondo
    const head = posOf(0);
    const h = head.y - p.y;
    return (
      <group>
        <mesh material={steel} position={[(head.x + p.x) / 2, (head.y + p.y) / 2, 0.06]}>
          <cylinderGeometry args={[0.022, 0.022, h, 8]} />
        </mesh>
        <mesh material={darkSteel} position={p.toArray()}><cylinderGeometry args={[0.07, 0.07, 0.3, 16]} /></mesh>
      </group>
    );
  }
  if (e.kind === 'gaslift') {
    return (
      <group>
        {(e.mandrelMds ?? []).map((md, i) => {
          const mp = posOf(md);
          return (
            <mesh key={i} material={steel} position={mp.toArray()} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.085, 0.022, 10, 20]} />
            </mesh>
          );
        })}
      </group>
    );
  }
  // natural: niple de asentamiento
  return (
    <mesh material={darkSteel} position={p.toArray()}><cylinderGeometry args={[0.07, 0.07, 0.18, 16]} /></mesh>
  );
}

function AnomalyMarker({ anomaly, pos, onPick }: { anomaly: WellboreAnomaly; pos: THREE.Vector3; onPick: (a: WellboreAnomaly) => void }) {
  const ref = useRef<THREE.Mesh>(null);
  const halo = useRef<THREE.Mesh>(null);
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    const k = 1 + Math.sin(t * 3) * 0.12;
    if (ref.current) ref.current.scale.setScalar(k);
    if (halo.current) {
      const g = (Math.sin(t * 3) + 1) / 2;
      halo.current.scale.setScalar(1.6 + g * 0.9);
      (halo.current.material as THREE.MeshBasicMaterial).opacity = 0.32 * (1 - g);
    }
  });
  return (
    <group position={pos.toArray()}>
      <mesh ref={halo}>
        <sphereGeometry args={[0.14, 16, 16]} />
        <meshBasicMaterial color={anomaly.color} transparent opacity={0.3} />
      </mesh>
      <mesh ref={ref} onClick={(e) => { e.stopPropagation(); onPick(anomaly); }} onPointerOver={(e) => (e.stopPropagation(), (document.body.style.cursor = 'pointer'))} onPointerOut={() => (document.body.style.cursor = 'auto')}>
        <sphereGeometry args={[0.14, 20, 20]} />
        <meshStandardMaterial color={anomaly.color} emissive={anomaly.color} emissiveIntensity={0.9} metalness={0.2} roughness={0.4} />
      </mesh>
      <Html distanceFactor={9} position={[0.3, 0.1, 0]} style={{ pointerEvents: 'none' }}>
        <div style={{ whiteSpace: 'nowrap', background: 'rgba(11,15,25,0.85)', border: `1px solid ${anomaly.color}`, color: anomaly.color, fontSize: 11, padding: '2px 7px', borderRadius: 6, fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>
          ⚠ {anomaly.title}
        </div>
      </Html>
    </group>
  );
}

function DepthTicks({ tdTvd, yOf, x }: { tdTvd: number; yOf: (t: number) => number; x: number }) {
  const ticks: number[] = [];
  for (let d = 0; d <= tdTvd; d += 500) ticks.push(d);
  if (ticks[ticks.length - 1] !== Math.round(tdTvd)) ticks.push(Math.round(tdTvd));
  return (
    <group>
      <mesh position={[x, (yOf(0) + yOf(tdTvd)) / 2, 0]}>
        <boxGeometry args={[0.008, yOf(0) - yOf(tdTvd), 0.008]} />
        <meshBasicMaterial color="#374151" />
      </mesh>
      {ticks.map((d) => (
        <group key={d} position={[x, yOf(d), 0]}>
          <mesh position={[0.08, 0, 0]}><boxGeometry args={[0.16, 0.006, 0.006]} /><meshBasicMaterial color="#4b5563" /></mesh>
          <Billboard position={[-0.12, 0, 0]}>
            <Text fontSize={0.16} color="#6B7280" anchorX="right" anchorY="middle">
              {d === 0 ? '0 m' : `${d.toLocaleString()} m`}
            </Text>
          </Billboard>
        </group>
      ))}
    </group>
  );
}

export default function Wellbore3D({ wellbore, toggles, onPick, height = 560 }: {
  wellbore: Wellbore;
  toggles: Toggles;
  onPick: (a: WellboreAnomaly) => void;
  height?: number | string;
}) {
  return (
    <div style={{ height, width: '100%' }}>
      <Canvas dpr={[1, 2]} camera={{ position: [6.2, 0.6, 7.4], fov: 36 }} gl={{ antialias: true }}>
        <color attach="background" args={['#0b101b']} />
        <fog attach="fog" args={['#0b101b', 16, 34]} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[6, 8, 6]} intensity={1.4} />
        <pointLight position={[-6, 0, 4]} intensity={14} color="#3B82F6" />
        <pointLight position={[5, 3, 5]} intensity={10} color="#9ec5ff" />
        <Suspense fallback={null}>
          <Environment resolution={256}>
            <Lightformer intensity={2.2} position={[0, 6, -6]} scale={[12, 8, 1]} color="#dce7ff" />
            <Lightformer intensity={1.3} position={[-6, 0, 3]} scale={[7, 8, 1]} color="#aecbff" />
            <Lightformer intensity={1.1} position={[6, 0, 3]} scale={[7, 8, 1]} color="#ffffff" />
          </Environment>
          <SceneContent wb={wellbore} toggles={toggles} onPick={onPick} />
        </Suspense>
        <OrbitControls
          enablePan={false}
          minDistance={5}
          maxDistance={16}
          target={[0, 0, 0]}
          autoRotate
          autoRotateSpeed={0.45}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 1.7}
        />
      </Canvas>
    </div>
  );
}
