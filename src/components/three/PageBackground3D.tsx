"use client";

/**
 * PageBackground3D — a fixed, full-viewport 3D layer behind the whole
 * page (rendered once in layout.tsx). A deep starfield and a few soft
 * nebula glows slowly rotate and drift as you scroll, so the 3D
 * experience continues past the hero all the way to the footer. Scroll
 * progress is damped, giving the page a gentle sense of travelling
 * through space. The sky also parallaxes slightly toward the cursor,
 * and the occasional shooting star streaks across the deep field.
 *
 * Deliberately cheap: one points draw call + a handful of gradient
 * quads, no post-processing, dpr capped at 1.5. Skipped entirely on
 * low-core devices; static under prefers-reduced-motion.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";

/* ------------------------------------------------------------------ */
/* Nebula: a soft radial glow on a large quad                          */
/* ------------------------------------------------------------------ */

const NEBULA_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const NEBULA_FRAGMENT = /* glsl */ `
  varying vec2 vUv;
  uniform vec3 uColor;
  uniform float uAlpha;
  void main() {
    // Gaussian falloff from the quad center = soft cloud of light
    float d = length(vUv - 0.5) * 2.0;
    float a = exp(-d * d * 3.5) * uAlpha;
    gl_FragColor = vec4(uColor, a);
  }
`;

function Nebula({
  position,
  scale,
  color,
  alpha,
}: {
  position: [number, number, number];
  scale: number;
  color: string;
  alpha: number;
}) {
  const uniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color(color) },
      uAlpha: { value: alpha },
    }),
    [color, alpha],
  );
  return (
    <mesh position={position} scale={scale}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        vertexShader={NEBULA_VERTEX}
        fragmentShader={NEBULA_FRAGMENT}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

/* ------------------------------------------------------------------ */
/* Shooting stars: thin additive streaks that cross the deep field     */
/* ------------------------------------------------------------------ */

const STREAK_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Bright head at u=1 fading into a long tail, feathered across v
const STREAK_FRAGMENT = /* glsl */ `
  varying vec2 vUv;
  uniform float uAlpha;
  void main() {
    float tail = pow(vUv.x, 3.0);
    float edge = 1.0 - abs(vUv.y - 0.5) * 2.0;
    gl_FragColor = vec4(vec3(0.85, 1.0, 0.98), tail * edge * uAlpha);
  }
`;

/** Randomize a meteor's path: a downward diagonal deep in the field. */
function spawnFlight(f: {
  duration: number;
  distance: number;
  start: THREE.Vector3;
  dir: THREE.Vector3;
}) {
  f.duration = 0.9 + Math.random() * 0.9;
  f.distance = 24 + Math.random() * 18;
  f.start.set(
    -14 - Math.random() * 14,
    4 + Math.random() * 14,
    -26 - Math.random() * 16,
  );
  f.dir
    .set(1, -(0.2 + Math.random() * 0.5), (Math.random() - 0.5) * 0.3)
    .normalize();
}

function ShootingStar({ initialDelay }: { initialDelay: number }) {
  const mesh = useRef<THREE.Mesh>(null);
  const flight = useRef({
    t: -initialDelay, // negative = waiting to launch
    duration: 1.2,
    distance: 30,
    start: new THREE.Vector3(-20, 10, -30),
    dir: new THREE.Vector3(1, -0.3, 0).normalize(),
    spawned: false,
  });

  const uniforms = useMemo(() => ({ uAlpha: { value: 0 } }), []);

  useFrame((_, delta) => {
    const m = mesh.current;
    if (!m) return;
    const f = flight.current;
    f.t += delta;

    if (f.t < 0) return; // still waiting

    if (!f.spawned) {
      // First launch: pick a real path now that the mesh exists
      spawnFlight(f);
      m.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), f.dir);
      f.spawned = true;
    }

    if (f.t >= f.duration) {
      // Flight over: pick a fresh path and wait 4–12 s before relaunch
      f.t = -(4 + Math.random() * 8);
      spawnFlight(f);
      m.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), f.dir);
      uniforms.uAlpha.value = 0;
      m.position.set(0, 0, -999);
      return;
    }

    const p = f.t / f.duration;
    m.position.copy(f.start).addScaledVector(f.dir, p * f.distance);
    // Fade in fast, burn, fade out — classic meteor envelope
    uniforms.uAlpha.value = Math.sin(p * Math.PI) * 0.9;
  });

  return (
    <mesh ref={mesh} position={[0, 0, -999]}>
      <planeGeometry args={[7, 0.07]} />
      <shaderMaterial
        vertexShader={STREAK_VERTEX}
        fragmentShader={STREAK_FRAGMENT}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

/* ------------------------------------------------------------------ */
/* Star shell + scroll-driven drift + pointer parallax                 */
/* ------------------------------------------------------------------ */

const STAR_COUNT = 1400;

function DriftingSpace({ reducedMotion }: { reducedMotion: boolean }) {
  const group = useRef<THREE.Group>(null);
  const progress = useRef(0);
  // Normalized cursor (-1..1), tracked on window because the canvas is
  // pointer-events-none. Damped in useFrame for a weighty parallax.
  const pointer = useRef({ x: 0, y: 0, dx: 0, dy: 0 });

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(STAR_COUNT * 3);
    const colors = new Float32Array(STAR_COUNT * 3);
    const tint = new THREE.Color();
    for (let i = 0; i < STAR_COUNT; i++) {
      // Random point on a thick spherical shell around the camera
      const radius = 25 + Math.random() * 40;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      // Mostly white stars, a few warm/cool outliers, varied brightness
      const roll = Math.random();
      if (roll > 0.92) tint.set("#7dd3fc");
      else if (roll > 0.86) tint.set("#fcd34d");
      else tint.set("#e4e4e7");
      const brightness = 0.35 + Math.random() * 0.65;
      colors[i * 3] = tint.r * brightness;
      colors[i * 3 + 1] = tint.g * brightness;
      colors[i * 3 + 2] = tint.b * brightness;
    }
    return { positions, colors };
  }, []);

  useFrame((state, delta) => {
    if (!group.current || reducedMotion) return;

    // Page scroll progress 0..1 across the ENTIRE document, damped so
    // the sky glides rather than tracking the wheel 1:1.
    const doc = document.documentElement;
    const max = doc.scrollHeight - window.innerHeight;
    const raw = max > 0 ? window.scrollY / max : 0;
    progress.current = THREE.MathUtils.damp(progress.current, raw, 2.5, delta);

    // Damped pointer parallax: the sky leans gently toward the cursor.
    const ptr = pointer.current;
    ptr.dx = THREE.MathUtils.damp(ptr.dx, ptr.x, 2, delta);
    ptr.dy = THREE.MathUtils.damp(ptr.dy, ptr.y, 2, delta);

    // Scrolling down slowly pans the whole sky: a half-turn of yaw, a
    // slight pitch, and a vertical drift — plus an idle ambient rotation
    // and the pointer parallax on top.
    const p = progress.current;
    group.current.rotation.y =
      p * Math.PI * 0.5 + state.clock.elapsedTime * 0.004 + ptr.dx * 0.06;
    group.current.rotation.x = p * 0.18 + ptr.dy * 0.04;
    group.current.position.y = -p * 5;
  });

  return (
    <group ref={group}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.09}
          vertexColors
          transparent
          opacity={0.8}
          depthWrite={false}
          sizeAttenuation
        />
      </points>

      {/* Very dim colored glows drifting among the stars */}
      <Nebula position={[-18, 6, -30]} scale={34} color="#10b981" alpha={0.05} />
      <Nebula position={[16, -10, -35]} scale={40} color="#22d3ee" alpha={0.04} />
      <Nebula position={[6, 14, -42]} scale={30} color="#f59e0b" alpha={0.03} />
      <Nebula position={[-10, -18, -38]} scale={36} color="#10b981" alpha={0.035} />

      {/* Occasional meteors streaking through the deep field */}
      {!reducedMotion && (
        <>
          <ShootingStar initialDelay={3} />
          <ShootingStar initialDelay={9} />
          <ShootingStar initialDelay={16} />
        </>
      )}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Main export                                                         */
/* ------------------------------------------------------------------ */

export default function PageBackground3D() {
  const [enabled, setEnabled] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const cores = navigator.hardwareConcurrency ?? 8;
    setEnabled(cores >= 4);
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  if (!enabled) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10"
    >
      <Canvas
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: false }}
        camera={{ position: [0, 0, 1], fov: 60 }}
      >
        <color attach="background" args={["#000000"]} />
        <DriftingSpace reducedMotion={reducedMotion} />
      </Canvas>
    </div>
  );
}
