"use client";

/**
 * BlackHoleScene — scroll-driven 3D black hole hero for Cyber Range.
 *
 * Scroll architecture: the hero is a 400vh wrapper in NORMAL page flow with
 * a sticky 100vh canvas inside. Scroll progress (0..1) is derived from the
 * wrapper's position each frame and damped — so the hero and the rest of
 * the page share one continuous native scroll, no nested scroller.
 *
 * Visual composition (no particles — light around an event horizon):
 *  - Event horizon: pure black unlit sphere — the shadow stays perfectly dark
 *  - Accretion disk: continuous luminous gas, fully shader-driven —
 *    boiling ISCO edge, turbulent filaments, orbiting hot-spot flares,
 *    relativistic beaming
 *  - Lensed halo: a tight white ring of bent light circling the
 *    shadow, breathing organically, doppler-bright, flaring as it feeds
 *  - Infall veil: gas streamlines visibly spiralling down into the hole
 *  - Photon ring: light packets whipping around the horizon both ways
 *  - Infall streams: comet-like light trails spiralling into the hole
 *  - Dim drifting starfield + plunge-scaled chromatic aberration
 *
 * The dolly accelerates all the way to the horizon: the scene stays at
 * full brightness for as long as any part of the disk/rim is visible,
 * and the darkness at the end comes from the black sphere itself
 * geometrically filling the frame — not from a fade. A safety overlay
 * only kicks in after the horizon already covers the screen.
 *
 * Fallbacks: prefers-reduced-motion -> static scene, no dolly/rotation;
 * hardwareConcurrency < 4 -> 2D gradient + card grid, no WebGL.
 */

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, Stars } from "@react-three/drei";
import {
  ChromaticAberration,
  EffectComposer,
  Vignette,
} from "@react-three/postprocessing";
import type { ChromaticAberrationEffect } from "postprocessing";

/* ------------------------------------------------------------------ */
/* Data                                                                */
/* ------------------------------------------------------------------ */

interface Course {
  id: string;
  name: string;
  description: string;
  duration: string;
}

const COURSES: Course[] = [
  {
    id: "ceh",
    name: "CEH v13",
    description:
      "Certified Ethical Hacker. Hands-on offensive security across 20 modules — recon, exploitation, privilege escalation.",
    duration: "12 days · 96 hrs",
  },
  {
    id: "sapt",
    name: "SAPT",
    description:
      "Security Assessment & Penetration Testing. Full-scope engagements against live network and web targets in the range.",
    duration: "8 weeks",
  },
  {
    id: "oscp",
    name: "OSCP Prep",
    description:
      "Try-harder bootcamp: buffer overflows, Active Directory attack paths, and exam-style lab machines with reporting.",
    duration: "10 weeks",
  },
];

/* Scene tuning constants */
const CORE_RADIUS = 1.5;
const DISK_INNER = 2.3; // inner edge of the accretion disk (ISCO-ish)
const DISK_OUTER = 6.5; // outer edge of the accretion disk
const PHOTON_RING_RADIUS = 1.95; // thin bright ring between horizon and disk
const CARD_RADIUS = 4.6;
const CARD_Y_OFFSETS = [1.05, 0.55, 1.3];
// Near-edge-on start: the disk foreshortens into a thin blazing band
// crossing the shadow, with the lensed arcs above/below — the signature
// composition of the NASA/EHT visualizations.
const CAM_START = { y: 1.15, z: 13 };
// The dolly ends just outside the horizon: at z=1.7 the black sphere's
// angular size exceeds the screen diagonal, so the sphere itself swallows
// the frame — the scene stays fully bright until the horizon covers it.
const CAM_END = { y: 0.04, z: 1.7 };
const CAM_STATIC = { y: 1.0, z: 9.5 }; // reduced-motion composition
const PLUNGE_END = 0.92; // progress where the dolly reaches the horizon
// Safety blackout only: by the time these fire the horizon has already
// geometrically filled the screen, so nothing bright ever fades out.
const BLACKOUT_START = 0.955;
const BLACKOUT_FULL = 0.995;

/** Shared per-hero scroll state, written once per frame by ScrollDriver. */
interface HeroScrollState {
  progress: number; // damped — drives the camera and shaders
  raw: number; // undamped — used so fast flicks still exit on black
}

/* ------------------------------------------------------------------ */
/* Device / preference hooks                                           */
/* ------------------------------------------------------------------ */

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

/* ------------------------------------------------------------------ */
/* Scroll driver: native page scroll -> damped progress + DOM overlays */
/* ------------------------------------------------------------------ */

/**
 * Trapezoid window: 0 before `a`, ramps up a->b, holds 1 b->c, ramps
 * down c->d, 0 after. Used to fade overlay stages in and out as the
 * camera falls toward the core.
 */
function stageWindow(
  p: number,
  a: number,
  b: number,
  c: number,
  d: number,
): number {
  const rise = (p - a) / (b - a);
  const fall = 1 - (p - c) / (d - c);
  return THREE.MathUtils.clamp(Math.min(rise, fall), 0, 1);
}

/** Fade windows for the three overlay stages (see STAGE_CONTENT below). */
const STAGE_WINDOWS: [number, number, number, number][] = [
  [-0.1, 0.0, 0.08, 0.16], // title card — visible at rest, gone early
  [0.2, 0.28, 0.38, 0.47], // mid-dolly statement
  [0.49, 0.57, 0.66, 0.74], // certification tracks caption (cards visible)
];

function ScrollDriver({
  state,
  wrapperRef,
  stageRefs,
  blackoutRef,
  reducedMotion,
}: {
  state: HeroScrollState;
  wrapperRef: RefObject<HTMLDivElement | null>;
  stageRefs: RefObject<(HTMLDivElement | null)[]>;
  blackoutRef: RefObject<HTMLDivElement | null>;
  reducedMotion: boolean;
}) {
  useFrame((_, delta) => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    // Raw progress: how far the sticky viewport has travelled through
    // the 400vh wrapper (0 at top, 1 when the wrapper scrolls out).
    const rect = wrapper.getBoundingClientRect();
    const total = rect.height - window.innerHeight;
    const raw =
      total > 0 ? THREE.MathUtils.clamp(-rect.top / total, 0, 1) : 0;
    state.raw = raw;

    // Damp so fast wheel flicks glide instead of snapping. Lower lambda
    // = floatier, more "weightless" tracking of the scroll position.
    state.progress = reducedMotion
      ? 0
      : THREE.MathUtils.damp(state.progress, raw, 2.6, delta);

    const p = state.progress;

    // Overlay stages: fade + drift each block of copy through its window.
    stageRefs.current?.forEach((el, i) => {
      if (!el) return;
      const [a, b, c, d] = STAGE_WINDOWS[i];
      const opacity =
        reducedMotion ? (i === 0 ? 1 : 0) : stageWindow(p, a, b, c, d);
      el.style.opacity = opacity.toFixed(3);
      el.style.transform = `translateY(${((1 - opacity) * 18).toFixed(2)}px)`;
    });

    // Safety blackout: the horizon has already swallowed the frame by
    // BLACKOUT_START, so this never dims anything visible. The raw-progress
    // term guarantees a black exit even when a fast flick outruns damping.
    if (blackoutRef.current) {
      const o = reducedMotion
        ? 0
        : Math.max(
            THREE.MathUtils.smoothstep(p, BLACKOUT_START, BLACKOUT_FULL),
            THREE.MathUtils.smoothstep(state.raw, 0.97, 1.0),
          );
      blackoutRef.current.style.opacity = o.toFixed(3);
    }
  });
  return null;
}

/* ------------------------------------------------------------------ */
/* Camera dolly                                                        */
/* ------------------------------------------------------------------ */

function CameraRig({
  state,
  reducedMotion,
}: {
  state: HeroScrollState;
  reducedMotion: boolean;
}) {
  // Damped pointer parallax so the scene leans toward the cursor
  const px = useRef(0);
  const py = useRef(0);

  useFrame(({ camera, pointer, clock }, delta) => {
    if (reducedMotion) {
      camera.position.set(0, CAM_STATIC.y, CAM_STATIC.z);
      camera.lookAt(0, 0, 0);
      return;
    }

    const p = state.progress;
    const t = clock.elapsedTime;

    // The dolly completes at PLUNGE_END (not 1.0) so the camera is
    // already buried in the core while the blackout finishes; pow(1.35)
    // makes it accelerate — "falling in", not a constant-speed push.
    const fall = Math.pow(
      THREE.MathUtils.clamp(p / PLUNGE_END, 0, 1),
      1.35,
    );
    const z = THREE.MathUtils.lerp(CAM_START.z, CAM_END.z, fall);
    const y = THREE.MathUtils.lerp(CAM_START.y, CAM_END.y, fall);

    // Idle life: the camera is never parked. A slow two-axis drift plus
    // damped pointer parallax keep the scene breathing at rest; both
    // influences die off as the plunge takes over.
    const rest = 1 - fall;
    px.current = THREE.MathUtils.damp(px.current, pointer.x * 0.5, 2.5, delta);
    py.current = THREE.MathUtils.damp(py.current, -pointer.y * 0.28, 2.5, delta);
    const driftX = (Math.sin(t * 0.23) * 0.22 + px.current) * rest;
    const driftY = (Math.cos(t * 0.17) * 0.14 + py.current) * rest;

    // Infall spiral: a lateral swing that dies out near the horizon plus
    // a slow roll — a body spiralling in, not sliding down a rail.
    const swirl = Math.sin(fall * Math.PI) * 0.55;
    camera.position.set(swirl + driftX, y + driftY, z);
    camera.lookAt(0, 0, 0);
    camera.rotateZ(fall * 0.25);

    // FOV stretches during the plunge — the classic "speed" cue.
    const perspective = camera as THREE.PerspectiveCamera;
    const targetFov = THREE.MathUtils.lerp(
      50,
      68,
      THREE.MathUtils.smoothstep(p, 0.55, PLUNGE_END),
    );
    if (Math.abs(perspective.fov - targetFov) > 0.01) {
      perspective.fov = targetFov;
      perspective.updateProjectionMatrix();
    }
  });

  return null;
}

/* ------------------------------------------------------------------ */
/* Tilted, precessing disk system                                      */
/* ------------------------------------------------------------------ */

/**
 * Feeding flare: every ~9s the whole system surges briefly, like a clump
 * of matter tearing apart at the ISCO. Shared by the disk and the rim so
 * they brighten together.
 */
function feedingFlare(t: number): number {
  const ft = (t % 9) / 9;
  return Math.exp(-Math.pow((ft - 0.12) * 14, 2)) * 0.45;
}

/**
 * The disk system sits at the iconic oblique angle (never dead-flat in
 * the frame) and precesses almost imperceptibly — the geometry itself
 * is alive, not just the textures on it.
 */
function TiltedSystem({
  reducedMotion,
  children,
}: {
  reducedMotion: boolean;
  children: ReactNode;
}) {
  const group = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!group.current || reducedMotion) return;
    const t = clock.elapsedTime;
    group.current.rotation.x = 0.16 + Math.sin(t * 0.11) * 0.025;
    group.current.rotation.z = -0.06 + Math.cos(t * 0.07) * 0.03;
  });
  return (
    <group ref={group} rotation={[0.16, 0, -0.06]}>
      {children}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Event horizon: black core + photon ring                             */
/* ------------------------------------------------------------------ */

/**
 * Photon ring: light orbiting just outside the horizon at near-c. Two
 * bright packets whip around the ring in opposite directions over a
 * shimmering base — orbiting light, not a painted circle.
 */
const PHOTON_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const PHOTON_FRAGMENT = /* glsl */ `
  varying vec2 vUv;
  uniform float uTime;
  void main() {
    float u = vUv.x; // 0..1 around the ring
    float p1 = fract(uTime * 0.45);
    float p2 = fract(-uTime * 0.34 + 0.37);
    // Wrapped distance from each racing packet
    float d1 = abs(fract(u - p1 + 0.5) - 0.5);
    float d2 = abs(fract(u - p2 + 0.5) - 0.5);
    float pulses = exp(-d1 * d1 * 160.0) * 1.1 + exp(-d2 * d2 * 220.0) * 0.8;
    // High-frequency shimmer so the ring never reads as a solid tube
    float flicker = 0.88 + 0.24 * sin(uTime * 6.0 + u * 44.0);
    float b = (0.55 + pulses) * flicker;
    vec3 col = mix(vec3(1.0, 0.85, 0.62), vec3(1.0), pulses * 0.5);
    gl_FragColor = vec4(col * b * 2.0, clamp(b, 0.0, 1.0));
  }
`;

function EventHorizon() {
  const photonUniforms = useMemo(() => ({ uTime: { value: 0 } }), []);

  useFrame(({ clock }) => {
    photonUniforms.uTime.value = clock.elapsedTime;
  });

  return (
    <group>
      {/* The hole itself — unlit, pure black, swallows everything behind it.
          No fresnel shell over it: the shadow stays perfectly dark and the
          halo alone rings it with light. */}
      <mesh>
        <sphereGeometry args={[CORE_RADIUS, 64, 64]} />
        <meshBasicMaterial color="#000000" toneMapped={false} />
      </mesh>

      {/* Photon ring: packets of light racing around the horizon */}
      <mesh rotation-x={Math.PI / 2}>
        <torusGeometry args={[PHOTON_RING_RADIUS, 0.02, 8, 200]} />
        <shaderMaterial
          vertexShader={PHOTON_VERTEX}
          fragmentShader={PHOTON_FRAGMENT}
          uniforms={photonUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Lensed halo: gravitationally bent light ringing the shadow          */
/* ------------------------------------------------------------------ */

/**
 * A camera-facing ring that fakes gravitational lensing: light from the
 * disk behind the hole is bent around the shadow, so the silhouette is
 * ringed by a thin bright "Einstein ring" plus a wider soft glow — the
 * signature look of a real black hole photograph.
 */
const HALO_FRAGMENT = /* glsl */ `
  varying vec2 vPos;
  uniform float uRadius;    // ring radius, just outside the shadow
  uniform float uIntensity;
  uniform float uPhase;     // slow drift for the lensed gas texture

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }
  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y);
  }

  void main() {
    float r = length(vPos);
    float theta = atan(vPos.y, vPos.x); // pi/2 = screen up
    float up = sin(theta);

    // Organic blaze radius: the light hugs the shadow, but its radius
    // breathes with angle and drifts with the flow — no fixed circles.
    float wob  = vnoise(vec2(theta * 3.0 + uPhase * 0.3, 7.7)) - 0.5;
    float wob2 = vnoise(vec2(theta * 6.0 - uPhase * 0.8, 2.3)) - 0.5;
    float ringR = uRadius * (1.0 + wob * 0.10 + wob2 * 0.04);

    // The blaze is wider above/below (the far-side disk folded over and
    // under the shadow) and tighter at the sides — one continuous ring
    // of bent light circling the shadow.
    float fold = 0.55 + 0.45 * abs(up);
    float width = mix(6.5, 3.2, fold);

    float dr = r - ringR;
    // Sharp bright core plus a soft inward-facing edge toward the
    // shadow. No outward skirt: the gaussian core alone decays smoothly
    // to zero past the ring, so nothing golden bleeds outward.
    float core = exp(-dr * dr * width * width);
    float skirtIn = exp(min(dr, 0.0) * 9.0) * 0.35;
    float blaze = core + skirtIn * fold;

    // Brighter where the fold crosses over the top, still present below
    blaze *= 0.75 + 0.45 * smoothstep(-0.2, 0.8, up);

    // Doppler crescent: gas approaching on the left blazes, the
    // receding right side dims — the EHT asymmetry.
    float beam = 0.55 + 1.05 * pow(0.5 - 0.5 * cos(theta), 1.5);

    // Gas texture streaming ALONG the blaze — the bent light visibly
    // flows in the disk's orbital direction instead of just flickering.
    float gas = 0.72 + 0.28 * vnoise(vec2(theta * 6.0 - uPhase * 1.6, r * 5.0));

    // White/cream throughout — no shift toward orange with radius; the
    // ring fades to transparent, never to gold.
    vec3 col = vec3(1.0, 0.93, 0.78);

    float a = blaze * beam * gas;
    // Guaranteed smooth fade to 0 well inside the mesh's outer edge
    a *= 1.0 - smoothstep(uRadius * 1.45, uRadius * 2.1, r);
    gl_FragColor = vec4(col * a * uIntensity, a);
  }
`;

function LensedHalo({ state }: { state: HeroScrollState }) {
  const mesh = useRef<THREE.Mesh>(null);
  const uniforms = useMemo(
    () => ({
      uRadius: { value: CORE_RADIUS * 1.18 },
      uIntensity: { value: 1.6 },
      uPhase: { value: 0 },
    }),
    [],
  );

  // Billboard: the halo always faces the camera, like lensing does.
  useFrame(({ camera, clock }, delta) => {
    mesh.current?.lookAt(camera.position);
    uniforms.uPhase.value += delta * 0.55; // light streaming along the arcs
    // Lensed light intensifies on approach until the sphere occludes it,
    // and surges with each feeding flare — the ring is the living light.
    uniforms.uIntensity.value =
      (2.3 + 1.4 * THREE.MathUtils.smoothstep(state.progress, 0.5, 0.88)) *
      (1 + feedingFlare(clock.elapsedTime) * 0.7);
  });

  return (
    <mesh ref={mesh}>
      <ringGeometry args={[CORE_RADIUS * 0.9, CORE_RADIUS * 2.4, 128, 1]} />
      <shaderMaterial
        vertexShader={DISK_VERTEX}
        fragmentShader={HALO_FRAGMENT}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

/* ------------------------------------------------------------------ */
/* Accretion disk: continuous luminous gas, fully shader-driven        */
/* ------------------------------------------------------------------ */

const DISK_VERTEX = /* glsl */ `
  varying vec2 vPos; // local XY on the ring plane, in world units
  void main() {
    vPos = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const DISK_FRAGMENT = /* glsl */ `
  varying vec2 vPos;
  uniform float uPhase;  // accumulated disk rotation (radians)
  uniform float uTime;   // wall-clock time driving flicker and flares
  uniform float uInner;
  uniform float uOuter;
  uniform float uBoost;  // brightness swell during the plunge

  // --- value noise + fbm: cheap turbulent gas texture -----------------
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }
  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f); // smooth interpolation
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * vnoise(p);
      p *= 2.13;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    float r = length(vPos);
    float theta = atan(vPos.y, vPos.x);

    // The ISCO boils: the disk's inner edge is displaced by slow noise
    // instead of ending on a hard mathematical circle.
    float inner = uInner
      + (vnoise(vec2(theta * 2.5 + uPhase * 0.35, uTime * 0.3)) - 0.5) * 0.24;
    float t = clamp((r - inner) / (uOuter - inner), 0.0, 1.0);

    // Keplerian-style differential rotation: inner gas orbits faster
    // (angular speed ~ r^-1.5). Shearing an isotropic noise field this
    // way naturally winds it into the spiral streaks a real accretion
    // disk shows — the realism comes from the physics, not the texture.
    float ang = uPhase * pow(uInner / r, 1.5);
    float c = cos(ang);
    float s = sin(ang);
    vec2 q = mat2(c, -s, s, c) * vPos;

    // Broad bands + ridged filaments — sharp bright threads of hot gas
    // rather than soft blotches.
    float bands = fbm(q * 0.85 + vec2(0.0, uPhase * 0.05));
    float ridge = 1.0 - abs(2.0 * fbm(q * 2.4 - vec2(uPhase * 0.02, 0.0)) - 1.0);
    ridge = ridge * ridge * ridge;
    float gas = 0.42 + 0.75 * (bands * 0.55 + ridge * 0.45);

    // Scintillation: fast subtle shimmer, like light through turbulence —
    // this is what makes the disk radiate instead of sitting still.
    gas *= 0.86 + 0.28 * vnoise(vec2(theta * 6.0 + uTime * 1.6, r * 5.0 - uTime * 0.7));

    // Banding broken into flow-aligned arcs: the phase is heavily
    // distorted by the sheared turbulence, so no perfect circle survives
    // — just organic streaks following the gas.
    gas *= 0.80 + 0.20 * sin(r * 16.0 + (bands - 0.5) * 22.0 - uPhase * 0.6);

    // Transient hot spots: flares that orbit at their local Keplerian
    // speed, brightening and dying on staggered cycles.
    float spots = 0.0;
    for (int i = 0; i < 3; i++) {
      float fi = float(i);
      float sr = uInner + 0.3 + fi * 0.85;             // orbit radius
      float sa = uPhase * pow(uInner / sr, 1.5) + fi * 2.09; // orbit angle
      float dTh = atan(sin(theta - sa), cos(theta - sa));    // wrapped delta
      float d2 = dTh * dTh * 2.5 + (r - sr) * (r - sr) * 7.0;
      float life = 0.5 + 0.5 * sin(uTime * (0.5 + fi * 0.21) + fi * 4.19);
      spots += exp(-d2 * 3.5) * life * life;
    }

    // Temperature ramp, pure blackbody like the photographs: white-hot
    // at the ISCO -> amber -> orange -> deep ember red dying to black.
    vec3 cWhite = vec3(1.00, 0.97, 0.90);
    vec3 cHot   = vec3(1.00, 0.80, 0.50);
    vec3 cMid   = vec3(1.00, 0.48, 0.15);
    vec3 cCool  = vec3(0.42, 0.10, 0.02);
    vec3 col = mix(cWhite, cHot, smoothstep(0.0, 0.16, t));
    col = mix(col, cMid,  smoothstep(0.16, 0.50, t));
    col = mix(col, cCool, smoothstep(0.50, 1.0, t));

    // Radial brightness: blazing at the ISCO, dying toward the rim.
    float radial = pow(1.0 - t, 2.2);
    // Soften both edges so the disk never ends in a hard line.
    radial *= smoothstep(0.0, 0.03, t);
    radial *= 1.0 - smoothstep(0.80, 1.0, t);

    // Relativistic beaming: gas approaching on the LEFT of the frame
    // blazes white-hot, the receding right side dims and reddens — the
    // asymmetric crescent every real black hole image shows.
    float appr = -cos(theta);
    float beam = 0.5 + 1.0 * pow(0.5 + 0.5 * appr, 2.0);
    col = mix(col, vec3(1.0, 0.97, 0.9), max(appr, 0.0) * 0.4);
    col = mix(col, col * vec3(0.85, 0.5, 0.32), max(-appr, 0.0) * 0.45);

    float brightness = radial * gas * beam * (1.0 + spots * 2.4);
    gl_FragColor = vec4(col * brightness * 1.8 * uBoost, clamp(brightness, 0.0, 1.0));
  }
`;

function AccretionDisk({
  state,
  reducedMotion,
}: {
  state: HeroScrollState;
  reducedMotion: boolean;
}) {
  const speed = useRef(0);
  const uniforms = useMemo(
    () => ({
      uPhase: { value: 0 },
      uTime: { value: 0 },
      uInner: { value: DISK_INNER },
      uOuter: { value: DISK_OUTER },
      uBoost: { value: 1 },
    }),
    [],
  );

  useFrame(({ clock }, delta) => {
    uniforms.uTime.value = clock.elapsedTime;
    // Angular speed rises as the camera falls in; damped so speed
    // changes are never abrupt.
    const target = reducedMotion ? 0 : 0.32 + state.progress * 1.2;
    speed.current = THREE.MathUtils.damp(speed.current, target, 2, delta);
    uniforms.uPhase.value += speed.current * delta;
    // The gas blazes hotter as the camera dives — brightness climbs, never
    // fades — and surges with each feeding flare.
    uniforms.uBoost.value =
      (1 + 0.6 * THREE.MathUtils.smoothstep(state.progress, 0.5, 0.92)) *
      (1 + feedingFlare(clock.elapsedTime));
  });

  return (
    // Flat ring lying on the XZ plane, drawn on both sides
    <mesh rotation-x={-Math.PI / 2}>
      <ringGeometry args={[DISK_INNER, DISK_OUTER, 256, 1]} />
      <shaderMaterial
        vertexShader={DISK_VERTEX}
        fragmentShader={DISK_FRAGMENT}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

/* ------------------------------------------------------------------ */
/* Infall veil: gas spiralling from the disk's inner edge into the hole */
/* ------------------------------------------------------------------ */

/**
 * Inside the ISCO nothing orbits stably — gas plunges. Log-spiral
 * streamlines advected inward over time make the flow of matter INTO
 * the hole visible: the disk feeds it, the horizon swallows it.
 */
const VEIL_FRAGMENT = /* glsl */ `
  varying vec2 vPos;
  uniform float uTime;
  uniform float uInner;
  uniform float uOuter;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }
  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y);
  }

  void main() {
    float r = length(vPos);
    float theta = atan(vPos.y, vPos.x);
    float t = clamp((r - uInner) / (uOuter - uInner), 0.0, 1.0);

    // Contours of (theta + k·ln r + c·time) sweep inward as time runs —
    // spiral streamlines that visibly rush toward the horizon.
    float spiral = theta * 3.0 + log(r) * 10.0 + uTime * 2.3;
    float streak = pow(0.5 + 0.5 * sin(spiral), 3.0);
    // A second, faster counter-spiral so the flow reads as a torrent of
    // separate streams, not one rotating texture.
    float spiral2 = theta * 5.0 + log(r) * 14.0 + uTime * 3.1;
    streak = streak * 0.7 + pow(0.5 + 0.5 * sin(spiral2), 4.0) * 0.45;
    float n = vnoise(vec2(theta * 4.0 - uTime * 0.5, r * 8.0 + uTime * 1.5));
    float a = streak * (0.35 + 0.65 * n);

    // Fed by the disk at the outer edge, thinning as it plunges
    a *= smoothstep(0.0, 0.3, t) * (0.2 + 0.8 * t) * 0.75;

    vec3 col = mix(vec3(1.0, 0.50, 0.22), vec3(1.0, 0.85, 0.60), t);
    gl_FragColor = vec4(col * a * 1.4, a);
  }
`;

function InfallVeil() {
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uInner: { value: CORE_RADIUS * 1.05 },
      uOuter: { value: DISK_INNER + 0.25 },
    }),
    [],
  );
  useFrame(({ clock }) => {
    uniforms.uTime.value = clock.elapsedTime;
  });
  return (
    <mesh rotation-x={-Math.PI / 2}>
      <ringGeometry
        args={[CORE_RADIUS * 1.05, DISK_INNER + 0.25, 192, 1]}
      />
      <shaderMaterial
        vertexShader={DISK_VERTEX}
        fragmentShader={VEIL_FRAGMENT}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

/* ------------------------------------------------------------------ */
/* Infall streams: streaks of light spiralling INTO the horizon        */
/* ------------------------------------------------------------------ */

/**
 * The visible "being swallowed" effect: comet-like trails of light that
 * approach from space, wind around the hole ever faster, and slip below
 * the horizon — the head literally disappears into the black sphere
 * (which depth-occludes it). Each stream respawns on a fresh random
 * trajectory, so the feeding never repeats.
 */
const STREAM_VERTEX = /* glsl */ `
  varying float vU;
  void main() {
    vU = uv.x; // 0..1 along the trail
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const STREAM_FRAGMENT = /* glsl */ `
  varying float vU;
  uniform float uHead;  // head position along the trail
  uniform float uFade;  // whole-trail fade in/out
  uniform vec3 uColor;
  void main() {
    float d = uHead - vU;
    // Sharp bright head, long luminous tail stretching behind it
    float pulse = d >= 0.0 ? exp(-d * 5.5) : exp(d * 120.0);
    vec3 col = mix(uColor, vec3(1.0), pulse * 0.6);
    float a = pulse * uFade;
    gl_FragColor = vec4(col * a * 2.2, a);
  }
`;

const STREAM_COLORS = ["#ffd9a0", "#ffb066", "#fff1d6"];

interface StreamSpec {
  curve: THREE.CatmullRomCurve3;
  duration: number;
  color: string;
}

function makeStream(): StreamSpec {
  const a0 = Math.random() * Math.PI * 2;
  const turns = 1.3 + Math.random() * 1.3; // how many times it wraps
  const r0 = 5.5 + Math.random() * 2.5; // spawn distance
  const lift = (Math.random() - 0.5) * 3.2; // start above/below the disk
  const pts: THREE.Vector3[] = [];
  const N = 40;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    // Ends INSIDE the sphere so the head visibly slips below the horizon
    const r = THREE.MathUtils.lerp(r0, CORE_RADIUS * 0.9, t);
    const ang = a0 + turns * Math.PI * 2 * t * t; // winds faster near the hole
    const y = lift * Math.pow(1 - t, 1.6); // sinks toward the disk plane
    pts.push(new THREE.Vector3(Math.cos(ang) * r, y, Math.sin(ang) * r));
  }
  return {
    curve: new THREE.CatmullRomCurve3(pts),
    duration: 2.2 + Math.random() * 1.8,
    color: STREAM_COLORS[Math.floor(Math.random() * STREAM_COLORS.length)],
  };
}

function InfallStream({ seed }: { seed: number }) {
  const [gen, setGen] = useState(0);
  const t = useRef(-seed * 0.9); // negative = staggered start delay

  const spec = useMemo(() => makeStream(), [gen]); // eslint-disable-line react-hooks/exhaustive-deps
  const tube = useMemo(
    () => new THREE.TubeGeometry(spec.curve, 80, 0.015, 5, false),
    [spec],
  );
  useEffect(() => () => tube.dispose(), [tube]);

  const uniforms = useMemo(
    () => ({
      uHead: { value: 0 },
      uFade: { value: 0 },
      uColor: { value: new THREE.Color(spec.color) },
    }),
    [spec],
  );

  useFrame((_, delta) => {
    t.current += delta;
    const tt = t.current;
    const D = spec.duration;
    if (tt < 0) return; // still waiting to spawn

    // The head accelerates as it falls — gravity, not a conveyor belt
    uniforms.uHead.value = Math.pow(Math.min(tt / D, 1), 1.5) * 1.12;
    uniforms.uFade.value =
      THREE.MathUtils.smoothstep(tt, 0, 0.5) *
      (1 - THREE.MathUtils.smoothstep(tt, D * 0.96, D + 0.35));

    // Swallowed -> respawn on a fresh trajectory after a beat
    if (tt > D + 0.6) {
      t.current = -Math.random() * 1.4;
      setGen((g) => g + 1);
    }
  });

  return (
    <mesh geometry={tube}>
      <shaderMaterial
        vertexShader={STREAM_VERTEX}
        fragmentShader={STREAM_FRAGMENT}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

function InfallStreams({ reducedMotion }: { reducedMotion: boolean }) {
  const seeds = useMemo(() => Array.from({ length: 6 }, (_, i) => i + 1), []);
  if (reducedMotion) return null;
  return (
    <group>
      {seeds.map((seed) => (
        <InfallStream key={seed} seed={seed} />
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Starfield with slow drift                                           */
/* ------------------------------------------------------------------ */

function StarField({
  state,
  reducedMotion,
}: {
  state: HeroScrollState;
  reducedMotion: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const drift = useRef(0);
  useFrame((_, delta) => {
    if (!group.current || reducedMotion) return;
    drift.current += 0.008 * delta; // barely perceptible ambient drift
    // Scroll parallax: the sky pans on a different curve than the
    // camera dolly, so foreground and background separate in depth.
    group.current.rotation.y = drift.current + state.progress * 0.45;
    group.current.rotation.x = state.progress * 0.12;
  });
  return (
    <group ref={group}>
      <Stars
        radius={90}
        depth={50}
        count={2400}
        factor={2.5}
        saturation={0}
        fade
        speed={reducedMotion ? 0 : 0.9}
      />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Plunge-scaled chromatic aberration                                  */
/* ------------------------------------------------------------------ */

/**
 * A whisper of chromatic aberration at rest that grows as the camera
 * falls in — light literally splitting apart the deeper you go.
 */
function PlungeAberration({ state }: { state: HeroScrollState }) {
  const ref = useRef<ChromaticAberrationEffect | null>(null);
  const offset = useMemo(() => new THREE.Vector2(0.0004, 0.0007), []);
  useFrame(() => {
    const k = 1 + 5 * THREE.MathUtils.smoothstep(state.progress, 0.5, 0.92);
    ref.current?.offset.set(0.0004 * k, 0.0007 * k);
  });
  return (
    <ChromaticAberration
      ref={ref}
      offset={offset}
      radialModulation
      modulationOffset={0.15}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Course cards in orbit                                               */
/* ------------------------------------------------------------------ */

function CourseCardContent({ course }: { course: Course }) {
  return (
    <div className="w-[200px] rounded-xl border border-emerald-500/40 bg-zinc-950/70 p-4 backdrop-blur-md">
      <h3 className="text-sm font-semibold tracking-wide text-emerald-400">
        {course.name}
      </h3>
      <p className="mt-1.5 text-[11px] leading-relaxed text-zinc-400">
        {course.description}
      </p>
      <p className="mt-2.5 font-mono text-[10px] tracking-wider text-emerald-500/80">
        {course.duration}
      </p>
    </div>
  );
}

function OrbitCards({
  state,
  reducedMotion,
}: {
  state: HeroScrollState;
  reducedMotion: boolean;
}) {
  const orbit = useRef<THREE.Group>(null);
  const cardGroups = useRef<(THREE.Group | null)[]>([]);
  const cardEls = useRef<(HTMLDivElement | null)[]>([]);
  const reveal = useRef<number[]>(COURSES.map(() => (reducedMotion ? 1 : 0)));
  const worldPos = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, delta) => {
    if (!orbit.current) return;
    const p = state.progress;

    if (!reducedMotion) {
      orbit.current.rotation.y += 0.06 * delta; // slow parent orbit
    }

    COURSES.forEach((_, i) => {
      const cardGroup = cardGroups.current[i];
      const el = cardEls.current[i];
      if (!cardGroup || !el) return;

      // Counter-rotate so world orientation stays fixed (readable text).
      cardGroup.rotation.y = -orbit.current!.rotation.y;

      // Reveal window: fade in mid-dolly, fade back out before the
      // final plunge so the blackout arrives on a clean frame.
      const threshold = 0.26 + i * 0.1;
      const fadeIn = THREE.MathUtils.clamp((p - threshold) / 0.11, 0, 1);
      const fadeOut = THREE.MathUtils.clamp((p - 0.66) / 0.09, 0, 1);
      const target = reducedMotion ? 1 : fadeIn * (1 - fadeOut);
      reveal.current[i] = THREE.MathUtils.damp(
        reveal.current[i],
        target,
        3.5,
        delta,
      );

      // DOM can't be occluded by the sphere, so dim far-side cards.
      cardGroup.getWorldPosition(worldPos);
      const backFade = THREE.MathUtils.clamp((worldPos.z + 2.8) / 3.6, 0.12, 1);

      const v = reveal.current[i];
      el.style.opacity = (v * backFade).toFixed(3);
      el.style.transform = `scale(${(0.7 + 0.3 * v).toFixed(3)})`;
    });
  });

  return (
    <group ref={orbit}>
      {COURSES.map((course, i) => {
        // Evenly spaced around the ring; -90° start puts card 0 in front
        const angle = -Math.PI / 2 + (i / COURSES.length) * Math.PI * 2;
        const x = Math.cos(angle) * CARD_RADIUS;
        const z = Math.sin(angle) * CARD_RADIUS;
        return (
          <group
            key={course.id}
            position={[x, CARD_Y_OFFSETS[i], z]}
            ref={(node) => {
              cardGroups.current[i] = node;
            }}
          >
            {/* Low zIndexRange keeps cards *under* the blackout overlay */}
            <Html
              transform
              distanceFactor={4}
              center
              zIndexRange={[10, 0]}
              style={{ pointerEvents: "none" }}
            >
              <div
                ref={(node) => {
                  cardEls.current[i] = node;
                }}
                style={{ opacity: reducedMotion ? 1 : 0 }}
              >
                <CourseCardContent course={course} />
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Overlay copy stages (plain DOM, faded by ScrollDriver)              */
/* ------------------------------------------------------------------ */

interface Stage {
  placement: string; // flex classes controlling where the copy sits
  node: ReactNode;
}

/**
 * Soft dark plate behind stage copy so text stays readable over the
 * bright disk — a blurred radial scrim, not a hard box.
 */
function StageScrim({ children }: { children: ReactNode }) {
  return (
    <div className="relative px-6 [text-shadow:0_2px_24px_rgba(0,0,0,0.95),0_0_8px_rgba(0,0,0,0.8)]">
      <div
        aria-hidden
        className="absolute -inset-x-20 -inset-y-12 -z-10 rounded-[50%] bg-black/60 blur-3xl"
      />
      {children}
    </div>
  );
}

const STAGE_CONTENT: Stage[] = [
  {
    placement: "items-center justify-center text-center",
    node: (
      <StageScrim>
        <p className="mb-4 font-mono text-xs uppercase tracking-[0.4em] text-emerald-500">
          MIST · Advanced Computing &amp; Cybersecurity Lab
        </p>
        <h1 className="text-5xl font-bold tracking-tight text-zinc-100 md:text-7xl">
          CYBER RANGE
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm text-zinc-300 md:text-base">
          Live-fire cybersecurity training. Real adversaries, real
          infrastructure, zero consequences.
        </p>
        <p className="mt-16 animate-pulse font-mono text-[10px] uppercase tracking-[0.35em] text-zinc-500">
          Scroll to explore
        </p>
      </StageScrim>
    ),
  },
  {
    // Wide, centered statement — reads as a headline, not a column
    placement: "items-center justify-center text-center",
    node: (
      <div className="mx-auto max-w-2xl">
        <StageScrim>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-100 md:text-5xl">
            Train where the pressure is real.
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-sm leading-relaxed text-zinc-300 md:text-base">
            An internet-isolated range with live adversaries — every exercise
            ends in a working exploit or a hardened system.
          </p>
        </StageScrim>
      </div>
    ),
  },
  {
    // Bottom-centered caption while the course cards orbit above
    placement: "items-end justify-center pb-[10vh] text-center",
    node: (
      <div className="mx-auto max-w-3xl">
        <StageScrim>
          <p className="font-mono text-xs uppercase tracking-[0.35em] text-emerald-500">
            Certification tracks
          </p>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-zinc-100 md:text-4xl">
            CEH v13 · SAPT · OSCP Prep
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-zinc-300">
            Three tracks, one core: hands-on hours on the range.
          </p>
        </StageScrim>
      </div>
    ),
  },
];

/* ------------------------------------------------------------------ */
/* Low-power 2D fallback                                               */
/* ------------------------------------------------------------------ */

function LiteHero() {
  return (
    <section className="relative w-full overflow-hidden bg-black">
      {/* Faked black hole: layered radial gradients + glow shadows */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 38%, rgba(255,154,60,0.16) 0%, transparent 28%), radial-gradient(circle at 50% 38%, rgba(34,211,238,0.08) 0%, transparent 46%)",
        }}
      />
      <div className="pointer-events-none absolute left-1/2 top-[38%] h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black shadow-[0_0_50px_18px_rgba(255,154,60,0.35),0_0_140px_60px_rgba(34,211,238,0.12)]" />

      <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center gap-12 px-6 py-24">
        <div className="text-center">
          <p className="mb-4 font-mono text-xs uppercase tracking-[0.4em] text-emerald-500">
            MIST · Advanced Computing &amp; Cybersecurity Lab
          </p>
          <h1 className="text-5xl font-bold tracking-tight text-zinc-100 md:text-7xl">
            CYBER RANGE
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm text-zinc-400 md:text-base">
            Live-fire cybersecurity training. Real adversaries, real
            infrastructure, zero consequences.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          {COURSES.map((course) => (
            <CourseCardContent key={course.id} course={course} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Main export                                                         */
/* ------------------------------------------------------------------ */

export default function BlackHoleScene() {
  const reducedMotion = usePrefersReducedMotion();
  // null until we can read navigator on the client (avoids hydration issues)
  const [tier, setTier] = useState<"full" | "lite" | null>(null);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const stageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const blackoutRef = useRef<HTMLDivElement>(null);
  // Mutable scroll state shared by every animated part of the scene
  const scrollState = useRef<HeroScrollState>({ progress: 0, raw: 0 }).current;

  useEffect(() => {
    const cores = navigator.hardwareConcurrency ?? 8;
    setTier(cores < 4 ? "lite" : "full");
  }, []);

  if (tier === null) {
    // Same height as the real hero so the page doesn't jump on mount
    return <div className="h-[500vh] w-full bg-black" aria-hidden />;
  }

  if (tier === "lite") {
    return <LiteHero />;
  }

  return (
    // 500vh of normal page scroll; the canvas stays pinned for all of it.
    // Native scroll = perfectly continuous hand-off into the content below,
    // and the final ~50vh plays out on a fully black screen.
    <div
      ref={wrapperRef}
      className={`relative ${reducedMotion ? "h-screen" : "h-[500vh]"}`}
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-black">
        <Canvas
          dpr={[1, 2]}
          gl={{ antialias: true }}
          camera={{ position: [0, CAM_START.y, CAM_START.z], fov: 50 }}
        >
          <color attach="background" args={["#000000"]} />
          <ScrollDriver
            state={scrollState}
            wrapperRef={wrapperRef}
            stageRefs={stageRefs}
            blackoutRef={blackoutRef}
            reducedMotion={reducedMotion}
          />
          <CameraRig state={scrollState} reducedMotion={reducedMotion} />
          <TiltedSystem reducedMotion={reducedMotion}>
            <EventHorizon />
            <LensedHalo state={scrollState} />
            <AccretionDisk state={scrollState} reducedMotion={reducedMotion} />
            <InfallVeil />
            <InfallStreams reducedMotion={reducedMotion} />
          </TiltedSystem>
          <StarField state={scrollState} reducedMotion={reducedMotion} />
          <OrbitCards state={scrollState} reducedMotion={reducedMotion} />
          <EffectComposer>
            {/* No wide-radius bloom: it wrapped the scene in a sphere of
                dim light. The shaders draw their own glow (halo skirts,
                rim fresnel, trail tails), so the light stays where the
                geometry puts it. */}
            <PlungeAberration state={scrollState} />
            {/* Gentle tunnel framing — darkens corners, never the core */}
            <Vignette eskil={false} offset={0.16} darkness={0.45} />
          </EffectComposer>
        </Canvas>

        {/* Copy stages that pop up while the camera falls in.
            Opacity/translate are written by ScrollDriver every frame. */}
        {STAGE_CONTENT.map((stage, i) => (
          <div
            key={i}
            ref={(node) => {
              stageRefs.current[i] = node;
            }}
            className={`pointer-events-none absolute inset-0 z-30 flex ${stage.placement}`}
            style={{ opacity: i === 0 ? 1 : 0 }}
          >
            {stage.node}
          </div>
        ))}

        {/* Blackout: the event horizon swallows the screen, and the rest
            of the page emerges from the darkness as scrolling continues. */}
        <div
          ref={blackoutRef}
          aria-hidden
          className="pointer-events-none absolute inset-0 z-20 bg-black"
          style={{ opacity: 0 }}
        />
      </div>
    </div>
  );
}
