import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Lightformer, MeshReflectorMaterial } from '@react-three/drei';
import * as THREE from 'three';

// ---- Materiales realistas (reflejos del Environment) ----
const steel = new THREE.MeshStandardMaterial({ color: '#6a7483', metalness: 1, roughness: 0.26 });
const midSteel = new THREE.MeshStandardMaterial({ color: '#525b69', metalness: 1, roughness: 0.34 });
const darkSteel = new THREE.MeshStandardMaterial({ color: '#2b313b', metalness: 1, roughness: 0.42 });
const boltMat = new THREE.MeshStandardMaterial({ color: '#3a414c', metalness: 1, roughness: 0.5 });

// Anillo de tornillos sobre una brida
function Bolts({ y, radius, count = 10 }: { y: number; radius: number; count?: number }) {
    return (
        <group position={[0, y, 0]}>
            {Array.from({ length: count }).map((_, i) => {
                const a = (i / count) * Math.PI * 2;
                return (
                    <mesh key={i} material={boltMat} position={[Math.cos(a) * radius, 0, Math.sin(a) * radius]}>
                        <cylinderGeometry args={[0.045, 0.045, 0.1, 6]} />
                    </mesh>
                );
            })}
        </group>
    );
}

// Volante de válvula (handwheel) — todo en el plano XY (eje = Z), orientado por quien lo usa
function HandWheel() {
    return (
        <group>
            {/* aro (ring alrededor de Z) */}
            <mesh material={midSteel} castShadow>
                <torusGeometry args={[0.26, 0.04, 14, 36]} />
            </mesh>
            {/* rayos en el mismo plano XY */}
            {[0, 1, 2].map((i) => (
                <mesh key={i} material={midSteel} rotation={[0, 0, (i * Math.PI) / 3]}>
                    <boxGeometry args={[0.5, 0.04, 0.04]} />
                </mesh>
            ))}
            {/* cubo central (alineado al eje Z) */}
            <mesh material={steel} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.07, 0.07, 0.12, 16]} /></mesh>
            {/* vástago hacia la válvula (eje -Z) */}
            <mesh material={steel} position={[0, 0, -0.14]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.035, 0.035, 0.28, 12]} />
            </mesh>
        </group>
    );
}

function ChristmasTree() {
    return (
        <group position={[0, -1.05, 0]}>
            {/* Brida base + tornillos */}
            <mesh material={darkSteel} position={[0, 0.09, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[0.95, 1.0, 0.18, 40]} />
            </mesh>
            <Bolts y={0.2} radius={0.82} count={12} />

            {/* Carrete inferior (casing head) */}
            <mesh material={steel} position={[0, 0.55, 0]} castShadow>
                <cylinderGeometry args={[0.5, 0.5, 0.7, 36]} />
            </mesh>
            <mesh material={midSteel} position={[0, 0.95, 0]}><cylinderGeometry args={[0.66, 0.66, 0.09, 40]} /></mesh>
            <Bolts y={0.99} radius={0.56} count={10} />

            {/* Cuerpo de válvula maestra (con alas) */}
            <mesh material={steel} position={[0, 1.35, 0]} castShadow>
                <cylinderGeometry args={[0.46, 0.46, 0.62, 36]} />
            </mesh>

            {/* Alas (wing valves) izquierda y derecha */}
            {[-1, 1].map((dir) => (
                <group key={dir} position={[0, 1.35, 0]}>
                    <mesh material={midSteel} position={[dir * 0.55, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
                        <cylinderGeometry args={[0.16, 0.16, 0.7, 24]} />
                    </mesh>
                    <mesh material={darkSteel} position={[dir * 0.92, 0, 0]} castShadow>
                        <boxGeometry args={[0.34, 0.4, 0.4]} />
                    </mesh>
                    {/* volante orientado hacia afuera */}
                    <group position={[dir * 1.2, 0, 0]} rotation={[0, dir > 0 ? Math.PI / 2 : -Math.PI / 2, 0]}>
                        <HandWheel />
                    </group>
                    {/* tramo de tubería de salida */}
                    <mesh material={steel} position={[dir * 0.92, -0.45, 0]}><cylinderGeometry args={[0.1, 0.1, 0.5, 16]} /></mesh>
                </group>
            ))}

            {/* Brida superior + carrete superior */}
            <mesh material={midSteel} position={[0, 1.74, 0]}><cylinderGeometry args={[0.6, 0.6, 0.09, 40]} /></mesh>
            <Bolts y={1.78} radius={0.5} count={10} />
            <mesh material={steel} position={[0, 2.05, 0]} castShadow><cylinderGeometry args={[0.4, 0.4, 0.55, 36]} /></mesh>

            {/* Volante superior (swab valve) */}
            <mesh material={steel} position={[0, 2.4, 0]}><cylinderGeometry args={[0.3, 0.3, 0.18, 28]} /></mesh>
            <group position={[0, 2.68, 0]} rotation={[-Math.PI / 2, 0, 0]}><HandWheel /></group>
        </group>
    );
}

export default function Well3D({ height = 380, className = '' }: { height?: number | string; className?: string }) {
    return (
        <div className={className} style={{ height, width: '100%' }}>
            <Canvas shadows dpr={[1, 2]} camera={{ position: [4.6, 1.6, 5.2], fov: 32 }} gl={{ antialias: true }}>
                <color attach="background" args={['#0b101b']} />
                <fog attach="fog" args={['#0b101b', 12, 26]} />

                <ambientLight intensity={0.4} />
                <directionalLight position={[6, 9, 4]} intensity={1.7} castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004} />
                <pointLight position={[-5, 3, -2]} intensity={10} color="#10B981" />
                <pointLight position={[5, 2, 5]} intensity={18} color="#9ec5ff" />

                <Suspense fallback={null}>
                    <Environment resolution={256}>
                        <Lightformer intensity={2.4} position={[0, 6, -6]} scale={[12, 6, 1]} color="#dce7ff" />
                        <Lightformer intensity={1.4} position={[-6, 2, 2]} scale={[6, 6, 1]} color="#aecbff" />
                        <Lightformer intensity={1.2} position={[6, 1, 3]} scale={[6, 6, 1]} color="#ffffff" />
                        <Lightformer intensity={0.7} position={[0, -3, 2]} scale={[12, 6, 1]} color="#1b2436" />
                    </Environment>

                    <ChristmasTree />

                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.3, 0]}>
                        <planeGeometry args={[40, 40]} />
                        <MeshReflectorMaterial
                            mirror={0}
                            blur={[300, 90]} resolution={1024} mixBlur={1} mixStrength={45}
                            roughness={0.82} depthScale={1.1} minDepthThreshold={0.4} maxDepthThreshold={1.2}
                            color="#0b101b" metalness={0.6}
                        />
                    </mesh>
                </Suspense>

                <OrbitControls
                    enableZoom={false}
                    enablePan={false}
                    autoRotate
                    autoRotateSpeed={0.6}
                    target={[0, 0.3, 0]}
                    minPolarAngle={Math.PI / 3.6}
                    maxPolarAngle={Math.PI / 2.05}
                />
            </Canvas>
        </div>
    );
}
