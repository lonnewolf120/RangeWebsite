"use client";

/**
 * ThreatGlobe — an interactive 3D holographic Earth for the live-range
 * section. Real continents rendered as ~6k glowing dots (Natural Earth
 * data baked into landDots.ts), wrapped in a fresnel atmosphere, with:
 *
 *  - attack pulses travelling along arcs between real landmass points,
 *    ending in an expanding impact ripple + vertical light beam
 *  - a hover-targeting HUD: point anywhere on the globe and a reticle
 *    locks onto the surface with live lat/lng coordinates
 *  - a faint lat/lng graticule and a latitude scan band, SOC-display style
 *  - pulsing "sensor" nodes linked by a mesh network with data packets
 *    travelling between them
 *  - three satellites tracing two inclined orbit rings
 *
 * The globe idles with a slow spin (slowing while you aim), tilts with
 * section scroll, and can be dragged to rotate. Self-contained <Canvas>,
 * mounted only near the viewport. Static under reduced motion; skipped
 * on low-core devices.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import { decodeLandDots } from "@/components/three/landDots";

const R = 1.6; // globe radius

/** lat/lng in degrees -> point on the globe surface. */
function latLngToVec3(lat: number, lng: number, radius = R): THREE.Vector3 {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lng + 180) * Math.PI) / 180;
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

/** Decoded land dot positions, shared by everything in this module. */
function useLandPoints(): THREE.Vector3[] {
  return useMemo(() => {
    const flat = decodeLandDots();
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < flat.length; i += 2) {
      pts.push(latLngToVec3(flat[i], flat[i + 1]));
    }
    return pts;
  }, []);
}

/* ------------------------------------------------------------------ */
/* Continents: shaded dot field                                        */
/* ------------------------------------------------------------------ */

const DOTS_VERTEX = /* glsl */ `
  attribute float aRand;
  varying float vLight;
  varying float vRand;
  uniform float uPx; // pixel-size scale factor (accounts for canvas + dpr)
  void main() {
    vec3 n = normalize(position);
    vec3 nView = normalize(normalMatrix * n);
    // Back-hemisphere falloff (the ocean sphere also depth-occludes)
    float facing = smoothstep(-0.25, 0.45, nView.z);
    // Fake key light from the upper-left — gives the sphere real shading
    vec3 lightDir = normalize(vec3(-0.55, 0.65, 0.55));
    float diff = 0.35 + 0.65 * max(dot(nView, lightDir), 0.0);
    vLight = facing * diff;
    vRand = aRand;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = uPx * (0.7 + 0.55 * aRand) / -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

const DOTS_FRAGMENT = /* glsl */ `
  varying float vLight;
  varying float vRand;
  uniform vec3 uLit;
  uniform vec3 uShadow;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.16, d);
    vec3 col = mix(uShadow, uLit, vLight);
    gl_FragColor = vec4(col, a * (0.25 + 0.75 * vLight));
  }
`;

function ContinentDots({ points }: { points: THREE.Vector3[] }) {
  const { size, gl } = useThree();

  const { positions, rands } = useMemo(() => {
    const positions = new Float32Array(points.length * 3);
    const rands = new Float32Array(points.length);
    points.forEach((p, i) => {
      positions[i * 3] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;
      rands[i] = Math.random();
    });
    return { positions, rands };
  }, [points]);

  const uniforms = useMemo(
    () => ({
      uPx: { value: 22 },
      uLit: { value: new THREE.Color("#5eead4") },
      uShadow: { value: new THREE.Color("#0f5132") },
    }),
    [],
  );

  // Point size tracks canvas size/dpr so dots stay crisp on any screen
  useEffect(() => {
    uniforms.uPx.value = size.height * gl.getPixelRatio() * 0.028;
  }, [size, gl, uniforms]);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aRand" args={[rands, 1]} />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={DOTS_VERTEX}
        fragmentShader={DOTS_FRAGMENT}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </points>
  );
}

/* ------------------------------------------------------------------ */
/* Ocean sphere + atmosphere + scan band                               */
/* ------------------------------------------------------------------ */

const ATMO_VERTEX = /* glsl */ `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/** Outer halo drawn on a BackSide shell — classic atmosphere glow. */
const ATMO_FRAGMENT = /* glsl */ `
  varying vec3 vNormal;
  uniform vec3 uColor;
  void main() {
    float intensity = pow(max(0.62 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0), 2.6);
    gl_FragColor = vec4(uColor, 1.0) * intensity;
  }
`;

/** Thin fresnel rim hugging the front of the sphere. */
const RIM_FRAGMENT = /* glsl */ `
  varying vec3 vNormal;
  uniform vec3 uColor;
  void main() {
    float fresnel = pow(1.0 - abs(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0))), 3.5);
    gl_FragColor = vec4(uColor * fresnel, fresnel * 0.85);
  }
`;

const SCAN_VERTEX = /* glsl */ `
  varying vec3 vPos;
  varying vec3 vNormal;
  void main() {
    vPos = position;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const SCAN_FRAGMENT = /* glsl */ `
  varying vec3 vPos;
  varying vec3 vNormal;
  uniform float uTime;
  uniform vec3 uColor;
  void main() {
    // Latitude band sweeping pole-to-pole; front hemisphere only
    float sweep = sin(uTime * 0.4) * ${(R * 0.85).toFixed(3)};
    float band = exp(-pow((vPos.y - sweep) * 5.0, 2.0));
    float facing = smoothstep(0.0, 0.5, vNormal.z);
    gl_FragColor = vec4(uColor, band * facing * 0.14);
  }
`;

/** Faint lat/lng grid lines — the "hologram wireframe" under everything. */
const GRID_FRAGMENT = /* glsl */ `
  varying vec3 vPos;
  varying vec3 vNormal;
  uniform vec3 uColor;
  void main() {
    vec3 n = normalize(vPos);
    float lat = asin(clamp(n.y, -1.0, 1.0));
    float lng = atan(n.z, n.x);
    const float SPACING = 0.5235988; // 30 degrees
    // Distance to the nearest grid multiple, in grid units
    float dLat = abs(fract(lat / SPACING + 0.5) - 0.5);
    float dLng = abs(fract(lng / SPACING + 0.5) - 0.5);
    float latLine = 1.0 - smoothstep(0.0, 0.05, dLat);
    // Longitude lines converge at the poles — fade them out there
    float lngLine = (1.0 - smoothstep(0.0, 0.05, dLng)) * cos(lat);
    float facing = smoothstep(0.05, 0.55, vNormal.z);
    gl_FragColor = vec4(uColor, (latLine + lngLine) * facing * 0.05);
  }
`;

function GlobeBody() {
  const scanUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: new THREE.Color("#34d399") },
    }),
    [],
  );
  useFrame(({ clock }) => {
    scanUniforms.uTime.value = clock.elapsedTime;
  });

  return (
    <group>
      {/* Ocean: deep, nearly-black blue that occludes the far side */}
      <mesh>
        <sphereGeometry args={[R * 0.992, 48, 48]} />
        <meshBasicMaterial color="#04121f" />
      </mesh>

      {/* Front fresnel rim */}
      <mesh>
        <sphereGeometry args={[R * 1.002, 48, 48]} />
        <shaderMaterial
          vertexShader={ATMO_VERTEX}
          fragmentShader={RIM_FRAGMENT}
          uniforms={{ uColor: { value: new THREE.Color("#2dd4bf") } }}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Graticule: faint lat/lng grid */}
      <mesh>
        <sphereGeometry args={[R * 1.0005, 64, 64]} />
        <shaderMaterial
          vertexShader={SCAN_VERTEX}
          fragmentShader={GRID_FRAGMENT}
          uniforms={{ uColor: { value: new THREE.Color("#2dd4bf") } }}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Scan band */}
      <mesh>
        <sphereGeometry args={[R * 1.006, 48, 48]} />
        <shaderMaterial
          vertexShader={SCAN_VERTEX}
          fragmentShader={SCAN_FRAGMENT}
          uniforms={scanUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Outer atmosphere halo */}
      <mesh scale={1.25}>
        <sphereGeometry args={[R, 48, 48]} />
        <shaderMaterial
          vertexShader={ATMO_VERTEX}
          fragmentShader={ATMO_FRAGMENT}
          uniforms={{ uColor: { value: new THREE.Color("#10b981") } }}
          transparent
          depthWrite={false}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Sensor nodes: pulsing dots on the continents                        */
/* ------------------------------------------------------------------ */

const NODE_VERTEX = /* glsl */ `
  attribute float aPhase;
  varying float vPulse;
  varying float vFacing;
  uniform float uTime;
  uniform float uPx;
  void main() {
    vec3 nView = normalize(normalMatrix * normalize(position));
    vFacing = smoothstep(-0.1, 0.5, nView.z);
    vPulse = 0.5 + 0.5 * sin(uTime * 1.6 + aPhase * 6.2831);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = uPx * (1.6 + vPulse * 1.2) / -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

const NODE_FRAGMENT = /* glsl */ `
  varying float vPulse;
  varying float vFacing;
  uniform vec3 uColor;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    float core = smoothstep(0.5, 0.1, d);
    float halo = exp(-d * d * 3.0) * 0.5;
    gl_FragColor = vec4(uColor, (core + halo * vPulse) * vFacing);
  }
`;

function SensorNodes({ nodes }: { nodes: THREE.Vector3[] }) {
  const { size, gl } = useThree();
  const { positions, phases } = useMemo(() => {
    const positions = new Float32Array(nodes.length * 3);
    const phases = new Float32Array(nodes.length);
    nodes.forEach((p, i) => {
      positions[i * 3] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;
      phases[i] = Math.random();
    });
    return { positions, phases };
  }, [nodes]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPx: { value: 22 },
      uColor: { value: new THREE.Color("#6ee7b7") },
    }),
    [],
  );
  useEffect(() => {
    uniforms.uPx.value = size.height * gl.getPixelRatio() * 0.028;
  }, [size, gl, uniforms]);
  useFrame(({ clock }) => {
    uniforms.uTime.value = clock.elapsedTime;
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aPhase" args={[phases, 1]} />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={NODE_VERTEX}
        fragmentShader={NODE_FRAGMENT}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* ------------------------------------------------------------------ */
/* Node links: a mesh network between sensors with travelling packets  */
/* ------------------------------------------------------------------ */

function NodeLinks({
  nodes,
  reducedMotion,
}: {
  nodes: THREE.Vector3[];
  reducedMotion: boolean;
}) {
  const packetAttr = useRef<THREE.BufferAttribute>(null);
  const packetVec = useMemo(() => new THREE.Vector3(), []);

  const { curves, lines, speeds, phases, packetPositions } = useMemo(() => {
    // Link each sensor to its nearest in-range neighbour — a sparse mesh
    // that reads as infrastructure, not spaghetti.
    const curves: THREE.QuadraticBezierCurve3[] = [];
    for (let i = 0; i < nodes.length && curves.length < 14; i++) {
      let best = -1;
      let bestD = Infinity;
      for (let j = i + 1; j < nodes.length; j++) {
        const d = nodes[i].distanceTo(nodes[j]);
        if (d > R * 0.22 && d < R * 0.95 && d < bestD) {
          best = j;
          bestD = d;
        }
      }
      if (best >= 0) {
        const mid = nodes[i]
          .clone()
          .add(nodes[best])
          .multiplyScalar(0.5)
          .normalize()
          .multiplyScalar(R * (1.03 + (bestD / R) * 0.06));
        curves.push(
          new THREE.QuadraticBezierCurve3(nodes[i], mid, nodes[best]),
        );
      }
    }

    const material = new THREE.LineBasicMaterial({
      color: "#2dd4bf",
      transparent: true,
      opacity: 0.13,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const lines = curves.map(
      (c) =>
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(c.getPoints(24)),
          material,
        ),
    );
    const speeds = curves.map(() => 0.12 + Math.random() * 0.22);
    const phases = curves.map(() => Math.random());
    const packetPositions = new Float32Array(curves.length * 3);
    return { curves, lines, speeds, phases, packetPositions };
  }, [nodes]);

  useEffect(
    () => () => {
      lines.forEach((l) => l.geometry.dispose());
      (lines[0]?.material as THREE.Material)?.dispose();
    },
    [lines],
  );

  // Data packets: one glowing bead sliding along each link.
  useFrame(({ clock }) => {
    if (reducedMotion || !packetAttr.current) return;
    const t = clock.elapsedTime;
    curves.forEach((curve, i) => {
      const u = (t * speeds[i] + phases[i]) % 1;
      curve.getPoint(u, packetVec);
      packetAttr.current!.setXYZ(i, packetVec.x, packetVec.y, packetVec.z);
    });
    packetAttr.current.needsUpdate = true;
  });

  return (
    <group>
      {lines.map((line, i) => (
        <primitive key={i} object={line} />
      ))}
      <points>
        <bufferGeometry>
          <bufferAttribute
            ref={packetAttr}
            attach="attributes-position"
            args={[packetPositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.045}
          sizeAttenuation
          color="#a7f3d0"
          transparent
          opacity={0.9}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Attack arcs: travelling pulse + impact ripple, endpoints on land    */
/* ------------------------------------------------------------------ */

const ARC_VERTEX = /* glsl */ `
  varying float vU;
  void main() {
    vU = uv.x; // runs 0..1 along the tube
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const ARC_FRAGMENT = /* glsl */ `
  varying float vU;
  uniform float uHead;  // pulse head position, 0..~1.2
  uniform float uFade;  // whole-arc fade in/out
  uniform vec3 uColor;
  void main() {
    float d = uHead - vU;
    // Sharp front, long luminous tail behind the head
    float pulse = d >= 0.0 ? exp(-d * 7.0) : exp(d * 90.0);
    // Faint trace of the full path once the pulse has passed
    float trace = 0.10 * smoothstep(0.0, 0.05, d);
    vec3 col = mix(uColor, vec3(1.0), pulse * 0.55);
    float a = (pulse + trace) * uFade;
    gl_FragColor = vec4(col, a);
  }
`;

const RIPPLE_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const RIPPLE_FRAGMENT = /* glsl */ `
  varying vec2 vUv;
  uniform float uT; // 0..1 ripple lifetime
  uniform vec3 uColor;
  void main() {
    float r = length(vUv - 0.5) * 2.0;
    float ring = exp(-pow((r - uT) * 9.0, 2.0));
    float a = ring * (1.0 - uT) * step(0.001, uT);
    gl_FragColor = vec4(uColor, a);
  }
`;

const ARC_COLORS = ["#34d399", "#fbbf24", "#f87171"];

function pickArcColor(): string {
  const roll = Math.random();
  return roll < 0.45 ? ARC_COLORS[0] : roll < 0.85 ? ARC_COLORS[1] : ARC_COLORS[2];
}

interface ArcSpec {
  curve: THREE.QuadraticBezierCurve3;
  end: THREE.Vector3;
  color: string;
  duration: number;
}

function makeArc(points: THREE.Vector3[]): ArcSpec {
  const a = points[Math.floor(Math.random() * points.length)];
  let b = points[Math.floor(Math.random() * points.length)];
  // Reject near-identical endpoints so arcs always travel somewhere
  let guard = 0;
  while (a.distanceTo(b) < R * 0.7 && guard++ < 10) {
    b = points[Math.floor(Math.random() * points.length)];
  }
  const mid = a
    .clone()
    .add(b)
    .multiplyScalar(0.5)
    .normalize()
    .multiplyScalar(R * (1.3 + (a.distanceTo(b) / (2 * R)) * 0.9));
  return {
    curve: new THREE.QuadraticBezierCurve3(a, mid, b),
    end: b,
    color: pickArcColor(),
    duration: 1.5 + Math.random() * 1.2,
  };
}

function AttackArc({
  points,
  seed,
  reducedMotion,
}: {
  points: THREE.Vector3[];
  seed: number;
  reducedMotion: boolean;
}) {
  const [gen, setGen] = useState(0);
  const t = useRef(-seed * 0.55); // negative = staggered start delay

  const spec = useMemo(() => makeArc(points), [points, gen]); // eslint-disable-line react-hooks/exhaustive-deps
  const tube = useMemo(
    () => new THREE.TubeGeometry(spec.curve, 64, 0.0085, 5, false),
    [spec],
  );
  useEffect(() => () => tube.dispose(), [tube]);

  const arcUniforms = useMemo(
    () => ({
      uHead: { value: reducedMotion ? 1 : 0 },
      uFade: { value: reducedMotion ? 0.45 : 0 },
      uColor: { value: new THREE.Color(spec.color) },
    }),
    [spec, reducedMotion],
  );
  const rippleUniforms = useMemo(
    () => ({
      uT: { value: 0 },
      uColor: { value: new THREE.Color(spec.color) },
    }),
    [spec],
  );

  // Ripple disk sits on the surface at the destination, facing outward
  const rippleQuat = useMemo(() => {
    const q = new THREE.Quaternion();
    q.setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      spec.end.clone().normalize(),
    );
    return q;
  }, [spec]);

  // Impact beam: a vertical light pillar shooting out of the surface
  const beamQuat = useMemo(() => {
    const q = new THREE.Quaternion();
    q.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      spec.end.clone().normalize(),
    );
    return q;
  }, [spec]);
  const beamMat = useRef<THREE.MeshBasicMaterial>(null);
  const beam = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (reducedMotion) return;
    t.current += delta;
    const tt = t.current;
    const D = spec.duration;

    if (tt < 0) return; // still in stagger delay

    arcUniforms.uHead.value = (tt / D) * 1.18;
    arcUniforms.uFade.value =
      THREE.MathUtils.smoothstep(tt, 0, 0.3) *
      (1 - THREE.MathUtils.smoothstep(tt, D + 0.55, D + 1.05));

    // Impact ripple fires as the head reaches the destination
    const arrive = D * 0.85;
    rippleUniforms.uT.value = THREE.MathUtils.clamp(
      (tt - arrive) / 0.8,
      0,
      1,
    );

    // Beam flash: snaps up at impact, decays over ~0.5s
    const bt = tt - arrive;
    const flash =
      bt < 0 ? 0 : Math.exp(-bt * 4.5) * THREE.MathUtils.smoothstep(bt, 0, 0.06);
    if (beamMat.current) beamMat.current.opacity = flash * 0.85;
    if (beam.current) beam.current.scale.set(1, 0.4 + flash, 1);

    // Cycle complete -> respawn with fresh endpoints and color
    if (tt > D + 1.15) {
      t.current = -Math.random() * 0.8;
      setGen((g) => g + 1);
    }
  });

  return (
    <group>
      <mesh geometry={tube}>
        <shaderMaterial
          vertexShader={ARC_VERTEX}
          fragmentShader={ARC_FRAGMENT}
          uniforms={arcUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh
        position={spec.end.clone().multiplyScalar(1.003)}
        quaternion={rippleQuat}
        scale={0.38}
      >
        <circleGeometry args={[1, 32]} />
        <shaderMaterial
          vertexShader={RIPPLE_VERTEX}
          fragmentShader={RIPPLE_FRAGMENT}
          uniforms={rippleUniforms}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      {/* Impact beam — anchored at the surface, scales up out of it */}
      <group ref={beam} position={spec.end} quaternion={beamQuat}>
        <mesh position={[0, 0.26, 0]}>
          <cylinderGeometry args={[0.006, 0.022, 0.52, 6, 1, true]} />
          <meshBasicMaterial
            ref={beamMat}
            color={spec.color}
            transparent
            opacity={0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Satellites tracing an inclined orbit                                */
/* ------------------------------------------------------------------ */

function Satellites({ reducedMotion }: { reducedMotion: boolean }) {
  const sat1 = useRef<THREE.Mesh>(null);
  const sat2 = useRef<THREE.Mesh>(null);
  const sat3 = useRef<THREE.Mesh>(null);
  const ORBIT_R = R * 1.45;
  const ORBIT_R2 = R * 1.62;

  useFrame(({ clock }) => {
    if (reducedMotion) return;
    const a = clock.elapsedTime * 0.28;
    sat1.current?.position.set(
      Math.cos(a) * ORBIT_R,
      0,
      Math.sin(a) * ORBIT_R,
    );
    sat2.current?.position.set(
      Math.cos(a + Math.PI) * ORBIT_R,
      0,
      Math.sin(a + Math.PI) * ORBIT_R,
    );
    // Third bird runs the outer ring the opposite way, slightly slower
    const b = -clock.elapsedTime * 0.19;
    sat3.current?.position.set(
      Math.cos(b) * ORBIT_R2,
      0,
      Math.sin(b) * ORBIT_R2,
    );
  });

  return (
    <group>
      <group rotation={[0.55, 0.2, 0.35]}>
        {/* Orbit path */}
        <mesh>
          <torusGeometry args={[ORBIT_R, 0.0022, 6, 128]} />
          <meshBasicMaterial color="#155e4e" transparent opacity={0.55} />
        </mesh>
        {/* The satellites themselves: small glowing beads */}
        {[sat1, sat2].map((ref, i) => (
          <mesh
            key={i}
            ref={ref}
            position={[i === 0 ? ORBIT_R : -ORBIT_R, 0, 0]}
          >
            <sphereGeometry args={[0.028, 10, 10]} />
            <meshBasicMaterial color="#a7f3d0" toneMapped={false} />
          </mesh>
        ))}
      </group>
      {/* Counter-inclined outer orbit */}
      <group rotation={[-0.72, 0.9, -0.15]}>
        <mesh>
          <torusGeometry args={[ORBIT_R2, 0.0018, 6, 128]} />
          <meshBasicMaterial color="#134e4a" transparent opacity={0.4} />
        </mesh>
        <mesh ref={sat3} position={[ORBIT_R2, 0, 0]}>
          <sphereGeometry args={[0.024, 10, 10]} />
          <meshBasicMaterial color="#5eead4" toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Hover targeting: reticle locked to the surface + live coordinates   */
/* ------------------------------------------------------------------ */

/** Mutable hover state — written by pointer events, read per-frame. */
interface HoverState {
  active: boolean;
  point: THREE.Vector3; // local to the spinning globe group, on the surface
}

const Z_AXIS = new THREE.Vector3(0, 0, 1);

function TargetReticle({
  hover,
  labelRef,
}: {
  hover: HoverState;
  labelRef: React.RefObject<HTMLDivElement | null>;
}) {
  const group = useRef<THREE.Group>(null);
  const spinner = useRef<THREE.Group>(null);
  const mats = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const fade = useRef(0);
  const normal = useMemo(() => new THREE.Vector3(), []);
  // Base opacity per material: [center dot, inner ring, 3 spinner arcs]
  const BASE = [0.95, 0.85, 0.6, 0.6, 0.6];

  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;

    fade.current = THREE.MathUtils.damp(
      fade.current,
      hover.active ? 1 : 0,
      7,
      delta,
    );
    const o = fade.current;
    g.visible = o > 0.02;
    if (!g.visible) return;

    if (hover.active) {
      normal.copy(hover.point).normalize();
      g.position.copy(hover.point).addScaledVector(normal, 0.006);
      g.quaternion.setFromUnitVectors(Z_AXIS, normal);
    }
    // Lock-on feel: reticle contracts as it fades in, arcs keep rotating
    g.scale.setScalar(1.35 - 0.35 * o);
    if (spinner.current) spinner.current.rotation.z += delta * 1.6;
    mats.current.forEach((m, i) => {
      if (m) m.opacity = BASE[i] * o;
    });
    if (labelRef.current?.parentElement) {
      labelRef.current.parentElement.style.opacity = o.toFixed(3);
    }
  });

  const setMat = (i: number) => (m: THREE.MeshBasicMaterial | null) => {
    mats.current[i] = m;
  };

  return (
    <group ref={group} visible={false}>
      {/* Center dot */}
      <mesh>
        <circleGeometry args={[0.014, 16]} />
        <meshBasicMaterial
          ref={setMat(0)}
          color="#6ee7b7"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      {/* Inner ring */}
      <mesh>
        <ringGeometry args={[0.05, 0.058, 40]} />
        <meshBasicMaterial
          ref={setMat(1)}
          color="#34d399"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Rotating outer arcs — the "scanning" part of the lock */}
      <group ref={spinner}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} rotation-z={(i * Math.PI * 2) / 3}>
            <ringGeometry args={[0.095, 0.103, 24, 1, 0, Math.PI * 0.42]} />
            <meshBasicMaterial
              ref={setMat(2 + i)}
              color="#2dd4bf"
              transparent
              opacity={0}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>
        ))}
      </group>
      {/* Live coordinate readout, anchored beside the reticle */}
      <Html
        position={[0.09, 0.09, 0.02]}
        style={{ pointerEvents: "none", opacity: 0 }}
        zIndexRange={[20, 0]}
      >
        <div
          ref={labelRef}
          className="whitespace-nowrap rounded border border-emerald-500/40 bg-black/75 px-2 py-1 font-mono text-[10px] tracking-[0.18em] text-emerald-300 backdrop-blur-sm"
        />
      </Html>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Assembly                                                            */
/* ------------------------------------------------------------------ */

function Globe({
  progressRef,
  reducedMotion,
}: {
  progressRef: React.RefObject<number>;
  reducedMotion: boolean;
}) {
  const globe = useRef<THREE.Group>(null);
  const spinSpeed = useRef(0.09);
  const landPoints = useLandPoints();
  const arcs = useMemo(() => Array.from({ length: 7 }, (_, i) => i), []);

  // Sensor node positions, shared by the pulsing dots and the link mesh
  const nodes = useMemo(() => {
    const picked: THREE.Vector3[] = [];
    for (let i = 0; i < 26; i++) {
      const p = landPoints[Math.floor(Math.random() * landPoints.length)];
      picked.push(p.clone().multiplyScalar(1.004));
    }
    return picked;
  }, [landPoints]);

  const hover = useRef<HoverState>({
    active: false,
    point: new THREE.Vector3(),
  }).current;
  const labelRef = useRef<HTMLDivElement>(null);
  const localPoint = useMemo(() => new THREE.Vector3(), []);

  const onPointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!globe.current) return;
    e.stopPropagation();
    localPoint.copy(e.point);
    globe.current.worldToLocal(localPoint);
    hover.point.copy(localPoint.normalize().multiplyScalar(R));
    hover.active = true;

    // Live lat/lng readout (inverse of latLngToVec3)
    if (labelRef.current) {
      const lat =
        90 -
        (Math.acos(THREE.MathUtils.clamp(hover.point.y / R, -1, 1)) * 180) /
          Math.PI;
      let lng =
        (Math.atan2(hover.point.z, -hover.point.x) * 180) / Math.PI - 180;
      if (lng < -180) lng += 360;
      labelRef.current.textContent = `LOCK ${Math.abs(lat).toFixed(1)}°${
        lat >= 0 ? "N" : "S"
      } · ${Math.abs(lng).toFixed(1)}°${lng >= 0 ? "E" : "W"}`;
    }
  };

  useFrame((_, delta) => {
    if (!globe.current || reducedMotion) return;
    // Idle spin eases toward near-stop while the user is aiming, so the
    // reticle stays under the cursor instead of drifting away.
    spinSpeed.current = THREE.MathUtils.damp(
      spinSpeed.current,
      hover.active ? 0.012 : 0.09,
      3,
      delta,
    );
    globe.current.rotation.y += delta * spinSpeed.current;
    // Section scroll progress tilts the globe (parallax with the page)
    globe.current.rotation.x = -0.28 + (progressRef.current ?? 0) * 0.4;
  });

  return (
    <group rotation={[-0.28, 0, 0]}>
      <group ref={globe} rotation={[0, 4.2, 0]}>
        <GlobeBody />
        <ContinentDots points={landPoints} />
        <SensorNodes nodes={nodes} />
        <NodeLinks nodes={nodes} reducedMotion={reducedMotion} />
        {arcs.map((seed) => (
          <AttackArc
            key={seed}
            points={landPoints}
            seed={seed + 1}
            reducedMotion={reducedMotion}
          />
        ))}
        {/* Invisible pick surface — the only raycast target in the scene */}
        <mesh
          visible={false}
          onPointerMove={onPointerMove}
          onPointerOut={() => {
            hover.active = false;
          }}
        >
          <sphereGeometry args={[R, 32, 32]} />
        </mesh>
        <TargetReticle hover={hover} labelRef={labelRef} />
      </group>
      {/* Satellites orbit outside the spinning globe group */}
      <Satellites reducedMotion={reducedMotion} />
    </group>
  );
}

export default function ThreatGlobe({
  progressRef,
  reducedMotion,
}: {
  progressRef: React.RefObject<number>;
  reducedMotion: boolean;
}) {
  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      camera={{ position: [0, 0.25, 4.35], fov: 50 }}
    >
      <Globe progressRef={progressRef} reducedMotion={reducedMotion} />
      {/* Drag to rotate; no zoom/pan so it can't fight page scroll */}
      {!reducedMotion && (
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          enableDamping
          dampingFactor={0.08}
          rotateSpeed={0.45}
        />
      )}
    </Canvas>
  );
}
