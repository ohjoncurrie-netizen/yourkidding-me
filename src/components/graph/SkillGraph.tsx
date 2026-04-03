"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Billboard, Text, Stars } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { useRef, useMemo, useState, useCallback, useEffect } from "react";
import * as THREE from "three";
import { useVibeStore, Vibe } from "@/store/vibeStore";
import { motion, AnimatePresence } from "framer-motion";

/* ── Types ──────────────────────────────────────────────── */
interface SkillConfig {
  id: string;
  label: string;
  orbitRadius: number;
  orbitSpeed: number;
  startAngle: number;
  inclination: number; // tilt of orbit plane (radians)
  size: number;
  desc: string;
}

interface ProjectConfig {
  id: string;
  label: string;
  parentId: string;
  moonRadius: number;
  moonSpeed: number;
  startAngle: number;
  size: number;
  url: string;
  desc: string;
  stack: string[];
}

interface SelectedNode {
  id: string;
  label: string;
  type: "core" | "skill" | "project";
  desc: string;
  url?: string;
  stack?: string[];
  related?: string[];
}

/* ── Data ───────────────────────────────────────────────── */
const SKILLS: SkillConfig[] = [
  { id: "react",      label: "React",        orbitRadius: 2.6, orbitSpeed: 0.38, startAngle: 0,              inclination: 0.08,  size: 0.22, desc: "Component architecture, hooks, RSC. Primary UI layer." },
  { id: "nodejs",     label: "Node.js",      orbitRadius: 2.6, orbitSpeed: 0.28, startAngle: Math.PI * 0.6,  inclination: -0.1,  size: 0.22, desc: "REST APIs, websockets, background jobs." },
  { id: "python",     label: "Python",       orbitRadius: 3.4, orbitSpeed: 0.22, startAngle: Math.PI * 1.1,  inclination: 0.14,  size: 0.20, desc: "Scraping, data pipelines, automation." },
  { id: "postgres",   label: "PostgreSQL",   orbitRadius: 3.4, orbitSpeed: 0.18, startAngle: Math.PI * 1.6,  inclination: -0.12, size: 0.20, desc: "Schema design, indexing, full-text search." },
  { id: "typescript", label: "TypeScript",   orbitRadius: 4.1, orbitSpeed: 0.16, startAngle: Math.PI * 0.3,  inclination: 0.06,  size: 0.18, desc: "Strict typing, generics, utility types." },
  { id: "nextjs",     label: "Next.js",      orbitRadius: 4.1, orbitSpeed: 0.20, startAngle: Math.PI * 0.9,  inclination: -0.05, size: 0.18, desc: "SSR, App Router, edge runtime, ISR." },
  { id: "webgl",      label: "WebGL",        orbitRadius: 4.7, orbitSpeed: 0.14, startAngle: Math.PI * 1.4,  inclination: 0.18,  size: 0.17, desc: "Shader pipelines, canvas filters, Three.js." },
  { id: "stripe",     label: "Stripe",       orbitRadius: 4.7, orbitSpeed: 0.12, startAngle: Math.PI * 0.05, inclination: -0.16, size: 0.16, desc: "Payment intents, webhooks, Connect." },
];

const PROJECTS: ProjectConfig[] = [
  {
    id: "hoteldeposit", label: "HotelDeposit", parentId: "nextjs",
    moonRadius: 0.9, moonSpeed: 1.1, startAngle: 0, size: 0.26,
    url: "hoteldeposit.com",
    desc: "Booking & deposit platform. Stripe-powered transactions with real-time API visibility.",
    stack: ["Next.js", "PostgreSQL", "Stripe", "Node.js"],
  },
  {
    id: "montanablotter", label: "MontanaBlotter", parentId: "python",
    moonRadius: 0.85, moonSpeed: 0.85, startAngle: Math.PI, size: 0.26,
    url: "montanablotter.com",
    desc: "Montana news aggregator. Automated web-scraping pipeline with live data visualization.",
    stack: ["Python", "Scrapy", "PostgreSQL", "React"],
  },
  {
    id: "onlyzits", label: "OnlyZits", parentId: "webgl",
    moonRadius: 0.75, moonSpeed: 1.4, startAngle: Math.PI * 0.5, size: 0.26,
    url: "onlyzits.com",
    desc: "Gen-Z media platform. WebGL filters + media processing served at scale.",
    stack: ["React", "WebGL", "Node.js", "FFmpeg"],
  },
];

/* ── Vibe colors ────────────────────────────────────────── */
const PALETTE: Record<Vibe, { sun: string; skill: string; project: string; edge: string; bloom: string }> = {
  corporate: { sun: "#ffffff", skill: "#888888", project: "#444444", edge: "#666666", bloom: "#ffffff" },
  data:      { sun: "#00ff88", skill: "#00bfff", project: "#ff6b00", edge: "#00ff88", bloom: "#00ff88" },
  chaos:     { sun: "#ff2d78", skill: "#ffe600", project: "#00f5d4", edge: "#ff2d78", bloom: "#ff2d78" },
};

/* ── Helpers ────────────────────────────────────────────── */
function orbitPosition(
  radius: number,
  angle: number,
  inclination: number,
  center = new THREE.Vector3()
): THREE.Vector3 {
  const x = center.x + radius * Math.cos(angle);
  const z = center.z + radius * Math.sin(angle);
  const y = center.y + radius * Math.sin(angle) * Math.tan(inclination);
  return new THREE.Vector3(x, y, z);
}

/* ── OrbitalRing ────────────────────────────────────────── */
function OrbitalRing({ radius, inclination, color }: { radius: number; inclination: number; color: string }) {
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 128; i++) {
      const a = (i / 128) * Math.PI * 2;
      pts.push(orbitPosition(radius, a, inclination));
    }
    return pts;
  }, [radius, inclination]);

  const geometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);

  return (
    <lineLoop geometry={geometry}>
      <lineBasicMaterial color={color} transparent opacity={0.07} />
    </lineLoop>
  );
}

/* ── DynamicEdge ────────────────────────────────────────── */
function DynamicEdge({
  fromRef,
  toRef,
  color,
}: {
  fromRef: React.RefObject<THREE.Object3D | null>;
  toRef: React.RefObject<THREE.Object3D | null>;
  color: string;
}) {
  const posArray = useMemo(() => new Float32Array(6), []);

  const lineObject = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(posArray, 3));
    const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.25 });
    return new THREE.Line(geo, mat);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update color when vibe changes
  useEffect(() => {
    const mat = lineObject.material as THREE.LineBasicMaterial;
    mat.color.set(color);
  }, [color, lineObject]);

  useFrame(() => {
    if (!fromRef.current || !toRef.current) return;
    const from = new THREE.Vector3();
    const to = new THREE.Vector3();
    fromRef.current.getWorldPosition(from);
    toRef.current.getWorldPosition(to);
    posArray[0] = from.x; posArray[1] = from.y; posArray[2] = from.z;
    posArray[3] = to.x;   posArray[4] = to.y;   posArray[5] = to.z;
    lineObject.geometry.attributes.position.needsUpdate = true;
  });

  return <primitive object={lineObject} />;
}

/* ── Sun ────────────────────────────────────────────────── */
function Sun({
  color,
  isActive,
  onSelect,
}: {
  color: string;
  isActive: boolean;
  onSelect: (node: SelectedNode) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!meshRef.current) return;
    const t = Date.now() * 0.001;
    const base = isActive ? 1 + 0.12 * Math.sin(t * 2.5) : 1 + 0.04 * Math.sin(t);
    meshRef.current.scale.setScalar(base);
  });

  return (
    <group ref={groupRef}>
      <mesh
        ref={meshRef}
        onClick={() =>
          onSelect({
            id: "you",
            label: "YOU",
            type: "core",
            desc: "Full-stack developer. yourkidding.me.",
            related: SKILLS.map((s) => s.label),
          })
        }
      >
        <sphereGeometry args={[0.45, 64, 64]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isActive ? 1.5 : 0.8}
          roughness={0.1}
          metalness={0.5}
        />
      </mesh>
      <Billboard>
        <Text position={[0, 0.7, 0]} fontSize={0.18} color={color} anchorX="center">
          YOU
        </Text>
        {isActive && (
          <Text position={[0, 0.95, 0]} fontSize={0.1} color={color} anchorX="center">
            ● LIVE
          </Text>
        )}
      </Billboard>
    </group>
  );
}

/* ── SkillPlanet ────────────────────────────────────────── */
function SkillPlanet({
  config,
  color,
  edgeColor,
  sunRef,
  onRef,
  onSelect,
}: {
  config: SkillConfig;
  color: string;
  edgeColor: string;
  sunRef: React.RefObject<THREE.Object3D | null>;
  onRef: (id: string, ref: React.RefObject<THREE.Object3D | null>) => void;
  onSelect: (node: SelectedNode) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const angleRef = useRef(config.startAngle);

  useEffect(() => {
    onRef(config.id, groupRef as React.RefObject<THREE.Object3D | null>);
  }, [config.id, onRef]);

  useFrame((_, delta) => {
    angleRef.current += config.orbitSpeed * delta;
    const pos = orbitPosition(config.orbitRadius, angleRef.current, config.inclination);
    groupRef.current?.position.copy(pos);
  });

  return (
    <>
      <OrbitalRing radius={config.orbitRadius} inclination={config.inclination} color={edgeColor} />
      <DynamicEdge fromRef={sunRef} toRef={groupRef as React.RefObject<THREE.Object3D | null>} color={edgeColor} />
      <group ref={groupRef}>
        <mesh
          onClick={(e) => {
            e.stopPropagation();
            onSelect({
              id: config.id,
              label: config.label,
              type: "skill",
              desc: config.desc,
              related: PROJECTS.filter((p) => p.parentId === config.id).map((p) => p.label),
            });
          }}
        >
          <sphereGeometry args={[config.size, 32, 32]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.4}
            roughness={0.3}
            metalness={0.6}
          />
        </mesh>
        <Billboard>
          <Text position={[0, config.size + 0.15, 0]} fontSize={0.13} color={color} anchorX="center">
            {config.label}
          </Text>
        </Billboard>
      </group>
    </>
  );
}

/* ── ProjectMoon ────────────────────────────────────────── */
function ProjectMoon({
  config,
  parentRef,
  color,
  edgeColor,
  onRef,
  onSelect,
}: {
  config: ProjectConfig;
  parentRef: React.RefObject<THREE.Object3D | null> | null;
  color: string;
  edgeColor: string;
  onRef: (id: string, ref: React.RefObject<THREE.Object3D | null>) => void;
  onSelect: (node: SelectedNode) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const angleRef = useRef(config.startAngle);

  useEffect(() => {
    onRef(config.id, groupRef as React.RefObject<THREE.Object3D | null>);
  }, [config.id, onRef]);

  useFrame((_, delta) => {
    if (!parentRef?.current) return;
    angleRef.current += config.moonSpeed * delta;
    const parentPos = new THREE.Vector3();
    parentRef.current.getWorldPosition(parentPos);
    const pos = new THREE.Vector3(
      parentPos.x + config.moonRadius * Math.cos(angleRef.current),
      parentPos.y + config.moonRadius * 0.3 * Math.sin(angleRef.current * 1.3),
      parentPos.z + config.moonRadius * Math.sin(angleRef.current)
    );
    groupRef.current?.position.copy(pos);
  });

  return (
    <>
      <DynamicEdge fromRef={parentRef!} toRef={groupRef as React.RefObject<THREE.Object3D | null>} color={edgeColor} />
      <group ref={groupRef}>
        <mesh
          onClick={(e) => {
            e.stopPropagation();
            onSelect({
              id: config.id,
              label: config.label,
              type: "project",
              desc: config.desc,
              url: config.url,
              stack: config.stack,
            });
          }}
        >
          <sphereGeometry args={[config.size, 32, 32]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.5}
            roughness={0.2}
            metalness={0.8}
          />
        </mesh>
        <Billboard>
          <Text position={[0, config.size + 0.15, 0]} fontSize={0.13} color={color} anchorX="center">
            {config.label}
          </Text>
        </Billboard>
      </group>
    </>
  );
}

/* ── Scene ──────────────────────────────────────────────── */
function Scene({
  isActive,
  vibe,
  onSelect,
}: {
  isActive: boolean;
  vibe: Vibe;
  onSelect: (node: SelectedNode) => void;
}) {
  const colors = PALETTE[vibe];
  const sunRef = useRef<THREE.Group>(null);
  const nodeRefs = useRef<Record<string, React.RefObject<THREE.Object3D | null>>>({});

  const registerRef = useCallback((id: string, ref: React.RefObject<THREE.Object3D | null>) => {
    nodeRefs.current[id] = ref;
  }, []);

  return (
    <>
      <ambientLight intensity={0.15} />
      <pointLight position={[0, 0, 0]} intensity={2} color={colors.sun} distance={20} decay={2} />
      <pointLight position={[8, 6, 8]} intensity={0.4} />

      <Stars radius={40} depth={30} count={800} factor={2} fade speed={0.5} />

      {/* Sun */}
      <group ref={sunRef}>
        <Sun color={colors.sun} isActive={isActive} onSelect={onSelect} />
      </group>

      {/* Skill planets */}
      {SKILLS.map((s) => (
        <SkillPlanet
          key={s.id}
          config={s}
          color={colors.skill}
          edgeColor={colors.edge}
          sunRef={sunRef as React.RefObject<THREE.Object3D | null>}
          onRef={registerRef}
          onSelect={onSelect}
        />
      ))}

      {/* Project moons */}
      {PROJECTS.map((p) => (
        <ProjectMoon
          key={p.id}
          config={p}
          parentRef={nodeRefs.current[p.parentId] ?? null}
          color={colors.project}
          edgeColor={colors.edge}
          onRef={registerRef}
          onSelect={onSelect}
        />
      ))}

      <EffectComposer>
        <Bloom
          intensity={vibe === "corporate" ? 0.3 : 1.4}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
      </EffectComposer>

      <OrbitControls
        enablePan={false}
        minDistance={4}
        maxDistance={18}
        autoRotate
        autoRotateSpeed={0.3}
        enableDamping
        dampingFactor={0.05}
      />
    </>
  );
}

/* ── Info Panel ─────────────────────────────────────────── */
function InfoPanel({
  node,
  onClose,
  vibe,
}: {
  node: SelectedNode;
  onClose: () => void;
  vibe: Vibe;
}) {
  const colors = PALETTE[vibe];
  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className="absolute top-4 right-4 w-64 rounded-xl border p-4 backdrop-blur-md z-10"
      style={{
        borderColor: colors.skill,
        background: "rgba(0,0,0,0.75)",
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-[10px] tracking-widest uppercase opacity-50 mb-0.5">
            {node.type}
          </p>
          <h3 className="font-bold text-base" style={{ color: colors.sun }}>
            {node.label}
          </h3>
          {node.url && (
            <p className="text-[10px] opacity-40 mt-0.5">{node.url}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-lg opacity-40 hover:opacity-100 leading-none"
        >
          ×
        </button>
      </div>

      <p className="text-xs opacity-70 leading-relaxed mb-3">{node.desc}</p>

      {node.stack && (
        <div className="flex flex-wrap gap-1 mb-3">
          {node.stack.map((s) => (
            <span
              key={s}
              className="text-[9px] px-1.5 py-0.5 rounded border"
              style={{ borderColor: colors.skill, color: colors.skill }}
            >
              {s}
            </span>
          ))}
        </div>
      )}

      {node.related && node.related.length > 0 && (
        <div>
          <p className="text-[9px] tracking-widest uppercase opacity-40 mb-1">
            connected to
          </p>
          <p className="text-xs opacity-60">{node.related.join(" · ")}</p>
        </div>
      )}
    </motion.div>
  );
}

/* ── Main export ────────────────────────────────────────── */
export default function SkillGraph({ isActive = false }: { isActive?: boolean }) {
  const { vibe } = useVibeStore();
  const [selected, setSelected] = useState<SelectedNode | null>(null);

  return (
    <div className="relative w-full h-[540px] rounded-xl overflow-hidden"
      style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <Canvas
        camera={{ position: [7, 4, 9], fov: 48 }}
        gl={{ antialias: true, alpha: true }}
        onPointerMissed={() => setSelected(null)}
      >
        <Scene isActive={isActive} vibe={vibe} onSelect={setSelected} />
      </Canvas>

      <AnimatePresence>
        {selected && (
          <InfoPanel
            key={selected.id}
            node={selected}
            onClose={() => setSelected(null)}
            vibe={vibe}
          />
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="absolute bottom-3 left-4 flex gap-4 text-[10px] tracking-widest uppercase opacity-40">
        <span>● skill</span>
        <span>● project</span>
        <span>drag to orbit</span>
      </div>
    </div>
  );
}
