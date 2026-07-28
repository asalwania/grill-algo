"use client";

import { MeshReflectorMaterial, RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { usePlayerState } from "@/components/player";
import type { SceneShellHandle } from "./SceneShell";
import type { ArrayMemoryFrame, TileState } from "@/lib/types";

/** Canvas-relative pixel position of one tile, for F9's DOM label layer. */
export type TileScreenPosition = {
  index: number;
  x: number;
  y: number;
  /**
   * 1 at REFERENCE_DISTANCE from the camera, shrinking as the tile recedes
   * (camera dolly during F12's choreography, or manual zoom). F9 drives its
   * label font-size/fade off this instead of anything derived from x/y,
   * since screen position alone can't distinguish "far from camera" from
   * "near the canvas edge".
   */
  scale: number;
};

/** Canvas-relative pixel position of one memory slot frame, for F10's DOM
 *  label layer — the slot's key/value entry is rendered as text there, never
 *  on the canvas. */
export type SlotScreenPosition = {
  index: number;
  x: number;
  y: number;
  scale: number;
  /** Pre-formatted "key: value" for this slot's current entry, or null while
   *  the slot is empty — LabelLayer hides the label rather than show stale
   *  text left over from before the slot was cleared. */
  text: string | null;
};

type ArrayMemorySceneProps = {
  /** Frames for the currently selected approach — the caller has already
   *  resolved `problem.frames[caseId][approach]`, so this component only ever
   *  reads `step` off player state. */
  frames: ArrayMemoryFrame[];
  /**
   * Called on every rendered frame with each tile's projected screen
   * position. The array is mutated in place and passed by the same
   * reference every call — consumers must read it synchronously, not hold
   * onto it, matching F9's "direct style writes, not React state" contract.
   */
  onTilePositions?: (positions: TileScreenPosition[]) => void;
  /**
   * Same contract as onTilePositions, for the memory wall's slots (F10).
   * Called every frame regardless of approach (F13's wall mounts for all of
   * them, sunk out of view for the memoryless ones) — every slot's `text` is
   * simply null while sunk, since those frames never populate scene.slots.
   */
  onSlotPositions?: (positions: SlotScreenPosition[]) => void;
  /**
   * F12 — the SceneShell ref the mounting page attaches to `<SceneShell>`.
   * Undefined is a valid, silent no-op (camera choreography simply doesn't
   * run) rather than a required wiring, since SceneShell's ref only exists
   * outside the Canvas, in whichever component renders both.
   */
  cameraRig?: RefObject<SceneShellHandle | null>;
};

const TILE_WIDTH = 1;
const TILE_HEIGHT = 0.6;
const TILE_DEPTH = 1;
const TILE_GAP = 1.5;
const TILE_RADIUS = 0.08;
const LIFT_HEIGHT = 0.18;

// Exponential damping rate, shared by colour, emissive and position — higher
// is snappier. Applied as `1 - exp(-DAMPING * delta)` so it is frame-rate
// independent and, unlike a fixed-duration tween, always retargets from
// wherever the value currently sits — required for scrubbing.
const DAMPING = 9;
const SETTLE_EPSILON = 0.002;

// Camera distance at which a tile's label renders at its natural (scale 1)
// size — roughly SceneShell's default initialCameraPosition magnitude, i.e.
// the distance the whole scene is composed to be read at.
const REFERENCE_DISTANCE = 9;

const SLOT_WIDTH = 0.85;
const SLOT_HEIGHT = 0.5;
const SLOT_DEPTH = 0.12;
const SLOT_GAP = 0.68;
const SLOT_RADIUS = 0.06;
// Behind the array row (tiles sit at z=0), clear of their LIFT_HEIGHT lift.
const WALL_Z = -2.6;

const EMPTY_SLOT_SCALE = 0.72;
const FILLED_SLOT_SCALE = 1;

// Spring, not damped: F10's one deliberate exception to "damped useFrame for
// 3D" (AGENTS.md) — insertion should feel punchy, so the slot overshoots
// FILLED_SLOT_SCALE before settling. SPRING_DAMPING sits below critical
// (2 * sqrt(SPRING_STIFFNESS) ≈ 32) so the overshoot actually happens.
const SPRING_STIFFNESS = 260;
const SPRING_DAMPING = 16;
// Explicit-Euler spring integration isn't unconditionally stable for large
// steps, and frameloop="demand" can hand us one after the canvas sat idle —
// clamp so a resumed scrub can't make the spring blow up.
const MAX_SPRING_DELTA = 1 / 30;

// Design-token hexes (app/globals.css) as THREE.Color instances rather than
// CSS strings: three@0.185's Color.setStyle only parses the comma form of
// hsl()/rgb() and silently no-ops on space-separated CSS (see SP1 doc) — a
// failure mode this constructor sidesteps entirely.
const COLOR_IDLE = new THREE.Color(0x14161d); // --color-surface-raised
const COLOR_ACTIVE = new THREE.Color(0x3ddcff); // --color-signal-cyan
const COLOR_DONE = new THREE.Color(0xa78bfa); // --color-signal-violet, dimmed via emissive
const COLOR_MATCH = new THREE.Color(0x4ade80); // --color-signal-green

const EMISSIVE_IDLE = 0.05;
const EMISSIVE_ACTIVE = 1.4;
const EMISSIVE_DONE = 0.35;
const EMISSIVE_MATCH = 1.1;

function targetColorFor(state: TileState): THREE.Color {
  switch (state) {
    case "active":
      return COLOR_ACTIVE;
    case "done":
      return COLOR_DONE;
    case "match":
      return COLOR_MATCH;
    case "idle":
    default:
      return COLOR_IDLE;
  }
}

function targetEmissiveFor(state: TileState): number {
  switch (state) {
    case "active":
      return EMISSIVE_ACTIVE;
    case "done":
      return EMISSIVE_DONE;
    case "match":
      return EMISSIVE_MATCH;
    case "idle":
    default:
      return EMISSIVE_IDLE;
  }
}

function targetLiftFor(state: TileState): number {
  return state === "active" || state === "match" ? LIFT_HEIGHT : 0;
}

function colorNear(a: THREE.Color, b: THREE.Color, eps: number): boolean {
  return (
    Math.abs(a.r - b.r) < eps &&
    Math.abs(a.g - b.g) < eps &&
    Math.abs(a.b - b.b) < eps
  );
}

/**
 * Whether the given approach's frames ever populate `scene.slots` — i.e.
 * whether this approach has a memory structure for the wall to represent.
 *
 * This, not the approach NAME, is what the scene keys its wall on. The scene
 * has no business knowing that "optimized" means a hash map while "sorted" and
 * "brute" mean no memory at all; it only needs to know whether there is
 * anything to raise. That is also what keeps this file problem-agnostic as
 * approaches are added.
 */
function framesUseMemory(frames: ArrayMemoryFrame[]): boolean {
  return frames.some((frame) => frame.scene.slots.length > 0);
}

/**
 * Mounted as a sibling of the tiles, never a parent. Subscribing to
 * usePlayerState() here re-renders only this null-returning component on
 * step change — the mesh tree below reads `frameRef` imperatively inside
 * useFrame instead of taking the frame as a prop, so it never re-renders.
 *
 * Also mirrors the discrete `wallUp` flag into `wallUpRef` (F13) — same
 * rationale as `frameRef`: the flag itself is fine to cross Context (it's
 * discrete, not interpolated), but the mesh tree below only ever reads it
 * imperatively, so this is still the one place a step/approach change
 * re-renders anything.
 */
function FrameCursor({
  frames,
  wallUp,
  frameRef,
  wallUpRef,
}: {
  frames: ArrayMemoryFrame[];
  wallUp: boolean;
  frameRef: RefObject<ArrayMemoryFrame>;
  wallUpRef: RefObject<boolean>;
}) {
  const { step } = usePlayerState();
  useEffect(() => {
    frameRef.current = frames[Math.min(step, frames.length - 1)] ?? frameRef.current;
  }, [frames, step, frameRef]);
  useEffect(() => {
    wallUpRef.current = wallUp;
  }, [wallUp, wallUpRef]);
  return null;
}

// F12 tunables. CRUISE_OFFSET reuses SceneShell's own establishing angle
// ([4, 3, 5], SceneShell.tsx's initialCameraPosition default) as the camera's
// fixed offset from its focus point while dollying, so the choreography
// never invents a second angle model — it only ever moves the focus point
// SceneShell's rig looks from that same angle. MATCH_OFFSET is that same
// vector pulled back and tilted (more Y than X/Z) for the final frame.
const CRUISE_OFFSET: [number, number, number] = [2.5, 3.5, 8];
const MATCH_OFFSET: [number, number, number] = [3.4, 4.8, 9.5];
// Fraction of the way from the active tile toward the next one the focus
// leads by — shows where the scan is heading, not just where it sits.
const CAMERA_LEAD = 0.4;

// Focus points sit BELOW the tile row (which lives at y≈0), so the whole
// composition renders in the upper portion of the canvas — the lower-left,
// where the floating VariablesPanel sits, stays clear of the tiles instead of
// the panel overlapping the array on taller frames. A pure vertical pan: the
// camera offset is unchanged, so the viewing angle is identical.
const FOCUS_Y = -0.6;

function tileWorldX(index: number, count: number): number {
  const startX = -((count - 1) * TILE_GAP) / 2;
  return startX + index * TILE_GAP;
}

function computeCruiseFocus(activeIndex: number, count: number): [number, number, number] {
  const current = tileWorldX(activeIndex, count);
  const lead = tileWorldX(Math.min(activeIndex + 1, count - 1), count);
  return [THREE.MathUtils.lerp(current, lead, CAMERA_LEAD), FOCUS_Y, 0];
}

/** Frames both matched tiles; also brings the wall into the shot when one
 *  exists, by aiming the focus point at the midpoint between the tile row
 *  (z=0) and the wall (z=WALL_Z) rather than just at the tiles. */
function computeMatchFocus(
  result: [number, number],
  count: number,
  hasWall: boolean,
): [number, number, number] {
  const midX = (tileWorldX(result[0], count) + tileWorldX(result[1], count)) / 2;
  return hasWall ? [midX, FOCUS_Y + 0.3, WALL_Z / 2] : [midX, FOCUS_Y, 0];
}

/**
 * F12 — wires SceneShell's camera rig to the player. Like FrameCursor, this
 * drives an imperative target from an effect keyed on `step` rather than a
 * per-frame subscription: the focus point only needs to change once per
 * step (or on restart), and SceneShell's own rig owns the per-frame damping.
 */
function CameraChoreography({
  frames,
  count,
  hasWall,
  cameraRig,
}: {
  frames: ArrayMemoryFrame[];
  count: number;
  hasWall: boolean;
  cameraRig?: RefObject<SceneShellHandle | null>;
}) {
  const { step, restartNonce } = usePlayerState();
  // Last real (non-null) active tile index. Holds the camera in place across
  // the one-frame gap between "tile lights" and "cursor set" (F1's staggered
  // staging, AGENTS.md) instead of snapping back to the establishing shot and
  // immediately forward again.
  const lastActiveIndex = useRef(0);

  // Declared before the moveTo effect below so that on a real restart — which
  // always resets `step` to 0 in the same dispatch, so both effects fire in
  // the same commit — the suspension clears first and the moveTo this render
  // issues isn't silently dropped by a still-set flag. React runs a
  // component's effects in declaration order on every commit.
  useEffect(() => {
    cameraRig?.current?.resumeAutoCamera();
  }, [restartNonce, cameraRig]);

  useEffect(() => {
    const rig = cameraRig?.current;
    if (!rig) return;
    const frame = frames[Math.min(step, frames.length - 1)];
    if (!frame) return;

    if (frame.scene.result) {
      const [x, y, z] = computeMatchFocus(frame.scene.result, count, hasWall);
      rig.moveTo(x, y, z, MATCH_OFFSET);
      return;
    }

    // `link`'s second index is a tile index only when there is no wall — with
    // one it is a wall-slot index (lib/types.ts), so `cursor` is the only
    // tile-space signal there (F1's note, AGENTS.md).
    const activeIndex = hasWall
      ? frame.scene.cursor
      : frame.scene.link
        ? frame.scene.link[1]
        : frame.scene.cursor;

    if (activeIndex === null) {
      if (step === 0) {
        // Nothing has been touched yet: the whole-array establishing shot,
        // not a dolly toward a tile that isn't active.
        rig.moveTo(0, FOCUS_Y, 0, CRUISE_OFFSET);
        lastActiveIndex.current = 0;
      } else {
        const [x, y, z] = computeCruiseFocus(lastActiveIndex.current, count);
        rig.moveTo(x, y, z, CRUISE_OFFSET);
      }
      return;
    }

    lastActiveIndex.current = activeIndex;
    const [x, y, z] = computeCruiseFocus(activeIndex, count);
    rig.moveTo(x, y, z, CRUISE_OFFSET);
  }, [step, frames, count, hasWall, cameraRig]);

  return null;
}

// F13 tunables. DAMPING chosen so the transition reaches 95% of its target in
// ~700ms (the prompt's figure): 1 - e^(-4.3 * 0.7) ≈ 0.95. It is genuinely
// damped, not a fixed-duration tween — toggling back mid-transition retargets
// from wherever `progressRef` currently sits, same contract as every other
// damped value in this file.
const APPROACH_TRANSITION_DAMPING = 4.3;
// How far below the ground plane the wall sinks for a memoryless approach.
// Comfortably clear of the reflective ground and the default camera framing,
// so "raises out of the ground plane" reads as emerging from nothing rather
// than sliding up from a visible stack of slots.
const WALL_SUNK_Y = -3.2;

/**
 * F13 — the single source of truth for "how far up is the memory wall."
 * Everything the approach toggle animates (the wall's rise, the lookup beam's
 * fade-in, the tile-to-tile beams' fade-out) reads the SAME damped value here
 * rather than each re-deriving its own, so they move in lockstep instead of
 * drifting out of sync with each other.
 *
 * A continuous, interpolated value — so, per AGENTS.md, it lives only in this
 * ref, never in Context. `wallUpRef` (written by FrameCursor from the
 * discrete, Context-safe flag) is the only thing crossing the Canvas
 * boundary; this component turns that flag into the damped 0..1 float every
 * other scene component reads imperatively.
 *
 * Note this is keyed on "does this approach remember anything", not on which
 * approach it is — so a third, memoryless approach (sort-and-scan) resolves to
 * 0 and shares brute force's staging with no extra case to write.
 */
function MemoryTransition({
  wallUpRef,
  progressRef,
}: {
  wallUpRef: RefObject<boolean>;
  progressRef: RefObject<number>;
}) {
  useFrame((state, delta) => {
    const target = wallUpRef.current ? 1 : 0;
    progressRef.current = THREE.MathUtils.damp(
      progressRef.current,
      target,
      APPROACH_TRANSITION_DAMPING,
      delta,
    );
    if (Math.abs(progressRef.current - target) > SETTLE_EPSILON) state.invalidate();
  });
  return null;
}

function ArrayTiles({
  count,
  frameRef,
  onTilePositions,
}: {
  count: number;
  frameRef: RefObject<ArrayMemoryFrame>;
  onTilePositions?: (positions: TileScreenPosition[]) => void;
}) {
  const groupRefs = useRef<(THREE.Group | null)[]>([]);
  const materialRefs = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const positions = useRef<TileScreenPosition[]>(
    Array.from({ length: count }, (_, index) => ({ index, x: 0, y: 0, scale: 1 })),
  );
  const projectionVector = useRef(new THREE.Vector3());

  const startX = -((count - 1) * TILE_GAP) / 2;

  useFrame((state, delta) => {
    const tiles = frameRef.current.scene.tiles;
    const alpha = 1 - Math.exp(-DAMPING * delta);
    let unsettled = false;

    for (let i = 0; i < count; i++) {
      const group = groupRefs.current[i];
      const material = materialRefs.current[i];
      if (!group || !material) continue;

      const tileState = tiles[i] ?? "idle";
      const targetColor = targetColorFor(tileState);
      const targetEmissiveIntensity = targetEmissiveFor(tileState);
      const targetY = targetLiftFor(tileState);

      if (
        !colorNear(material.color, targetColor, SETTLE_EPSILON) ||
        Math.abs(material.emissiveIntensity - targetEmissiveIntensity) > SETTLE_EPSILON ||
        Math.abs(group.position.y - targetY) > SETTLE_EPSILON
      ) {
        unsettled = true;
      }

      material.color.lerp(targetColor, alpha);
      material.emissive.lerp(targetColor, alpha);
      material.emissiveIntensity = THREE.MathUtils.damp(
        material.emissiveIntensity,
        targetEmissiveIntensity,
        DAMPING,
        delta,
      );
      group.position.y = THREE.MathUtils.damp(group.position.y, targetY, DAMPING, delta);

      if (onTilePositions) {
        projectionVector.current.set(
          group.position.x,
          group.position.y + TILE_HEIGHT / 2,
          group.position.z,
        );
        // Distance must be read before .project() below, which overwrites
        // the vector in place with NDC coordinates.
        const distance = state.camera.position.distanceTo(projectionVector.current);
        projectionVector.current.project(state.camera);
        const point = positions.current[i];
        point.x = (projectionVector.current.x * 0.5 + 0.5) * state.size.width;
        point.y = (-projectionVector.current.y * 0.5 + 0.5) * state.size.height;
        point.scale = REFERENCE_DISTANCE / Math.max(distance, 0.001);
      }
    }

    // Demand frameloop only renders on invalidate(); keep nudging it while
    // any tile is still mid-transition so scrubbing never freezes a tween
    // partway (mirrors SceneShell's CameraRig).
    if (unsettled) state.invalidate();

    onTilePositions?.(positions.current);
  });

  return (
    <group>
      {Array.from({ length: count }, (_, i) => (
        <group
          key={i}
          position={[startX + i * TILE_GAP, 0, 0]}
          ref={(node) => {
            groupRefs.current[i] = node;
          }}
        >
          <RoundedBox args={[TILE_WIDTH, TILE_HEIGHT, TILE_DEPTH]} radius={TILE_RADIUS} smoothness={4}>
            <meshStandardMaterial
              ref={(node) => {
                materialRefs.current[i] = node;
              }}
              color={COLOR_IDLE}
              emissive={COLOR_IDLE}
              emissiveIntensity={EMISSIVE_IDLE}
              roughness={0.35}
              metalness={0.3}
            />
          </RoundedBox>
        </group>
      ))}
    </group>
  );
}

/**
 * The memory wall behind the array. Sized to `nums.length` — the most entries
 * the structure could ever hold — not to the current frame's slot count, so
 * empty capacity is visible as bare frames from the first frame onward.
 *
 * Mounted for EVERY approach (F13): capacity is problem-level, not
 * approach-level, because the wall's existence is what the toggle animates.
 * A memoryless approach's frames never populate scene.slots, so every slot
 * simply reads as empty while sunk.
 */
function MemoryWall({
  capacity,
  frameRef,
  progressRef,
  onSlotPositions,
}: {
  capacity: number;
  frameRef: RefObject<ArrayMemoryFrame>;
  progressRef: RefObject<number>;
  onSlotPositions?: (positions: SlotScreenPosition[]) => void;
}) {
  const wallGroupRef = useRef<THREE.Group>(null);
  const groupRefs = useRef<(THREE.Group | null)[]>([]);
  const materialRefs = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const springValues = useRef<number[]>(
    Array.from({ length: capacity }, () => EMPTY_SLOT_SCALE),
  );
  const springVelocities = useRef<number[]>(Array.from({ length: capacity }, () => 0));
  const positions = useRef<SlotScreenPosition[]>(
    Array.from({ length: capacity }, (_, index) => ({
      index,
      x: 0,
      y: 0,
      scale: 1,
      text: null,
    })),
  );
  const projectionVector = useRef(new THREE.Vector3());

  const wallTopY = ((capacity - 1) * SLOT_GAP) / 2;

  useFrame((state, delta) => {
    if (capacity === 0) return;
    const wallGroup = wallGroupRef.current;
    if (wallGroup) {
      // Directly from `progressRef`, not re-damped here — it is already the
      // damped value (MemoryTransition owns that), and LookupBeam derives
      // its own slot-Y target with the same lerp so the beam always points
      // at where the wall actually is, not its resting position.
      wallGroup.position.y = THREE.MathUtils.lerp(WALL_SUNK_Y, 0, progressRef.current);
    }
    const wallOffsetY = wallGroup?.position.y ?? 0;
    const slots = frameRef.current.scene.slots;
    const springDelta = Math.min(delta, MAX_SPRING_DELTA);
    const alpha = 1 - Math.exp(-DAMPING * delta);
    let unsettled = false;

    for (let i = 0; i < capacity; i++) {
      const group = groupRefs.current[i];
      const material = materialRefs.current[i];
      if (!group || !material) continue;

      const entry = slots[i] ?? null;
      // Filled slots glow violet (F10) — reusing the array tile's "done"
      // colour/emissive rather than inventing a second violet.
      const targetColor = entry ? COLOR_DONE : COLOR_IDLE;
      const targetEmissiveIntensity = entry ? EMISSIVE_DONE : EMISSIVE_IDLE;
      const targetScale = entry ? FILLED_SLOT_SCALE : EMPTY_SLOT_SCALE;

      material.color.lerp(targetColor, alpha);
      material.emissive.lerp(targetColor, alpha);
      material.emissiveIntensity = THREE.MathUtils.damp(
        material.emissiveIntensity,
        targetEmissiveIntensity,
        DAMPING,
        delta,
      );

      const displacement = targetScale - springValues.current[i];
      const acceleration =
        displacement * SPRING_STIFFNESS - springVelocities.current[i] * SPRING_DAMPING;
      springVelocities.current[i] += acceleration * springDelta;
      springValues.current[i] += springVelocities.current[i] * springDelta;
      group.scale.setScalar(springValues.current[i]);

      if (
        !colorNear(material.color, targetColor, SETTLE_EPSILON) ||
        Math.abs(material.emissiveIntensity - targetEmissiveIntensity) > SETTLE_EPSILON ||
        Math.abs(springValues.current[i] - targetScale) > SETTLE_EPSILON ||
        Math.abs(springVelocities.current[i]) > SETTLE_EPSILON
      ) {
        unsettled = true;
      }

      if (onSlotPositions) {
        projectionVector.current.set(
          group.position.x,
          group.position.y + wallOffsetY + SLOT_HEIGHT / 2,
          group.position.z,
        );
        const distance = state.camera.position.distanceTo(projectionVector.current);
        projectionVector.current.project(state.camera);
        const point = positions.current[i];
        point.x = (projectionVector.current.x * 0.5 + 0.5) * state.size.width;
        point.y = (-projectionVector.current.y * 0.5 + 0.5) * state.size.height;
        point.scale = REFERENCE_DISTANCE / Math.max(distance, 0.001);
        point.text = entry ? `${entry.key}: ${entry.value}` : null;
      }
    }

    if (unsettled) state.invalidate();
    onSlotPositions?.(positions.current);
  });

  if (capacity === 0) return null;

  return (
    <group ref={wallGroupRef} position={[0, WALL_SUNK_Y, 0]}>
      {Array.from({ length: capacity }, (_, i) => (
        <group
          key={i}
          position={[0, wallTopY - i * SLOT_GAP, WALL_Z]}
          ref={(node) => {
            groupRefs.current[i] = node;
          }}
        >
          <RoundedBox args={[SLOT_WIDTH, SLOT_HEIGHT, SLOT_DEPTH]} radius={SLOT_RADIUS} smoothness={4}>
            <meshStandardMaterial
              ref={(node) => {
                materialRefs.current[i] = node;
              }}
              color={COLOR_IDLE}
              emissive={COLOR_IDLE}
              emissiveIntensity={EMISSIVE_IDLE}
              roughness={0.4}
              metalness={0.25}
            />
          </RoundedBox>
        </group>
      ))}
    </group>
  );
}

// F11 tunables. The core beam and its two end-glows are additive-blended
// THREE.MeshBasicMaterial, not a Bloom post-processing pass: real Bloom via
// @react-three/postprocessing costs ~183KB gzip (bundlephobia, v3.0.4,
// including its `postprocessing` dependency) for a one-shot hit flash on a
// single problem page — not worth the bundle weight here.
const BEAM_RADIUS = 0.03;
const BEAM_MAX_OPACITY_HIT = 0.9;
const BEAM_MAX_OPACITY_MISS = 0.45;
// How far past the wall plane a miss's target point sits, so the beam reads
// as passing through the gap rather than stopping dead at it.
const BEAM_MISS_OVERSHOOT = 0.5;
const GLOW_RADIUS = 0.14;
const GLOW_MAX_SCALE = 2.2;
// Instantaneous velocity kick applied to the flash spring on a hit — reuses
// MemoryWall's SPRING_STIFFNESS/SPRING_DAMPING (already tuned underdamped)
// but drives it as a one-shot pulse toward 0 rather than a move to a target:
// releasing the spring from rest with this velocity peaks its displacement
// at roughly FLASH_KICK / omega_d ≈ 1, i.e. a flash that reads as a full pop.
const FLASH_KICK = 14;

/**
 * F11 — the lookup beam. Travels from the tile currently probing the memory
 * structure up to the wall slot its key would occupy (or, on a miss, the next
 * still-empty slot the coming `store` step is about to fill). Landing on a hit
 * flashes both ends green via the spring kick above; missing dissipates past
 * the gap instead of landing solid.
 *
 * The hit/miss determination is frozen the moment `scene.probe` changes, not
 * re-derived every frame: on a miss, the very next frame's `store` step
 * pushes a new entry into that same slot index, and re-running
 * `slots.findIndex` against the post-push array would misreport a miss as a
 * hit. `scene.probe`'s own doc comment prescribes this resolution once; this
 * component just has to remember the answer instead of asking again.
 *
 * Single persistent mesh set whose endpoints are damped THREE.Vector3s
 * (AGENTS.md: "a single reusable mesh ... not a new mesh per step") — never
 * recreated per frame or per step.
 *
 * Mounted for every approach (F13), matching MemoryWall's own capacity —
 * `targetOpacity` is additionally scaled by `progressRef` so this beam fades
 * in alongside the wall's rise instead of popping the instant the approach
 * flag flips. In practice `probe` is null throughout every memoryless
 * approach's frames anyway, so this only ever matters during the transition
 * window itself.
 */
function LookupBeam({
  capacity,
  frameRef,
  count,
  progressRef,
}: {
  capacity: number;
  frameRef: RefObject<ArrayMemoryFrame>;
  count: number;
  progressRef: RefObject<number>;
}) {
  const wallTopY = ((capacity - 1) * SLOT_GAP) / 2;
  const startX = -((count - 1) * TILE_GAP) / 2;

  const beamRef = useRef<THREE.Mesh>(null);
  const beamMaterialRef = useRef<THREE.MeshBasicMaterial>(null);
  const tileGlowRef = useRef<THREE.Mesh>(null);
  const tileGlowMaterialRef = useRef<THREE.MeshBasicMaterial>(null);
  const slotGlowRef = useRef<THREE.Mesh>(null);
  const slotGlowMaterialRef = useRef<THREE.MeshBasicMaterial>(null);

  // Endpoints the beam mesh is oriented/scaled from every frame. Left in
  // place (not reset) while hidden, so a fading beam dissipates where it
  // last pointed rather than snapping back to the origin.
  const currentStart = useRef(new THREE.Vector3());
  const currentEnd = useRef(new THREE.Vector3());
  const currentOpacity = useRef(0);
  const direction = useRef(new THREE.Vector3());
  const midpoint = useRef(new THREE.Vector3());
  const upAxis = useRef(new THREE.Vector3(0, 1, 0));

  const lastProbe = useRef<number | null>(null);
  const frozenSlotIndex = useRef(0);
  const frozenIsHit = useRef(false);
  const flashValue = useRef(0);
  const flashVelocity = useRef(0);

  useFrame((state, delta) => {
    if (capacity === 0) return;
    const beam = beamRef.current;
    const beamMaterial = beamMaterialRef.current;
    const tileGlow = tileGlowRef.current;
    const tileGlowMaterial = tileGlowMaterialRef.current;
    const slotGlow = slotGlowRef.current;
    const slotGlowMaterial = slotGlowMaterialRef.current;
    if (
      !beam ||
      !beamMaterial ||
      !tileGlow ||
      !tileGlowMaterial ||
      !slotGlow ||
      !slotGlowMaterial
    ) {
      return;
    }

    const { probe, cursor, slots } = frameRef.current.scene;
    let unsettled = false;

    if (probe !== lastProbe.current) {
      if (probe !== null) {
        const hit = slots.findIndex((slot) => slot.key === probe);
        frozenIsHit.current = hit !== -1;
        frozenSlotIndex.current = hit !== -1 ? hit : slots.length;
        if (frozenIsHit.current) flashVelocity.current = FLASH_KICK;
      }
      lastProbe.current = probe;
    }

    const visible = probe !== null && cursor !== null;
    const targetOpacity =
      (visible ? (frozenIsHit.current ? BEAM_MAX_OPACITY_HIT : BEAM_MAX_OPACITY_MISS) : 0) *
      progressRef.current;

    if (visible && cursor !== null) {
      // Anchored at the active tile's fully-lifted top, not ArrayTiles' live
      // (also-damped) lift — the beam's own damping toward this target still
      // produces a smooth ease-in, just not pixel-identical to the tile's.
      currentStart.current.set(startX + cursor * TILE_GAP, TILE_HEIGHT / 2 + LIFT_HEIGHT, 0);
      // Wall's own current sink offset (F13) — same lerp MemoryWall applies
      // to its wrapping group, so the beam always lands on the slot's actual
      // position, not its fully-risen resting position.
      const wallOffsetY = THREE.MathUtils.lerp(WALL_SUNK_Y, 0, progressRef.current);
      const slotY = wallTopY - frozenSlotIndex.current * SLOT_GAP + wallOffsetY;
      const targetZ = frozenIsHit.current ? WALL_Z : WALL_Z - BEAM_MISS_OVERSHOOT;
      currentEnd.current.set(0, slotY, targetZ);
    }

    currentOpacity.current = THREE.MathUtils.damp(currentOpacity.current, targetOpacity, DAMPING, delta);

    // One-shot spring pulse: released from 0 with a velocity kick (only on a
    // hit) and always targeting 0, so it overshoots away from rest and rings
    // back down — a flash, not a move-to-target tween.
    const flashDelta = Math.min(delta, MAX_SPRING_DELTA);
    const flashAcceleration =
      -flashValue.current * SPRING_STIFFNESS - flashVelocity.current * SPRING_DAMPING;
    flashVelocity.current += flashAcceleration * flashDelta;
    flashValue.current += flashVelocity.current * flashDelta;
    const flash = Math.max(0, flashValue.current);

    direction.current.subVectors(currentEnd.current, currentStart.current);
    const length = Math.max(direction.current.length(), 0.001);
    midpoint.current.copy(currentStart.current).addScaledVector(direction.current, 0.5);

    beam.position.copy(midpoint.current);
    beam.quaternion.setFromUnitVectors(upAxis.current, direction.current.clone().normalize());
    beam.scale.set(1, length, 1);
    beamMaterial.opacity = currentOpacity.current;
    beamMaterial.color.copy(COLOR_ACTIVE).lerp(COLOR_MATCH, Math.min(flash, 1));

    tileGlow.position.copy(currentStart.current);
    slotGlow.position.copy(currentEnd.current);
    const glowScale = 1 + flash * (GLOW_MAX_SCALE - 1);
    tileGlow.scale.setScalar(glowScale);
    slotGlow.scale.setScalar(glowScale);
    tileGlowMaterial.opacity = currentOpacity.current * flash;
    slotGlowMaterial.opacity = currentOpacity.current * flash;

    if (
      Math.abs(currentOpacity.current - targetOpacity) > SETTLE_EPSILON ||
      Math.abs(flashValue.current) > SETTLE_EPSILON ||
      Math.abs(flashVelocity.current) > SETTLE_EPSILON
    ) {
      unsettled = true;
    }

    if (unsettled) state.invalidate();
  });

  if (capacity === 0) return null;

  return (
    <group>
      <mesh ref={beamRef}>
        <cylinderGeometry args={[BEAM_RADIUS, BEAM_RADIUS, 1, 8]} />
        <meshBasicMaterial
          ref={beamMaterialRef}
          color={COLOR_ACTIVE}
          transparent
          opacity={0}
          toneMapped={false}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh ref={tileGlowRef}>
        <sphereGeometry args={[GLOW_RADIUS, 12, 12]} />
        <meshBasicMaterial
          ref={tileGlowMaterialRef}
          color={COLOR_MATCH}
          transparent
          opacity={0}
          toneMapped={false}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh ref={slotGlowRef}>
        <sphereGeometry args={[GLOW_RADIUS, 12, 12]} />
        <meshBasicMaterial
          ref={slotGlowMaterialRef}
          color={COLOR_MATCH}
          transparent
          opacity={0}
          toneMapped={false}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

const COMPARE_BEAM_MAX_OPACITY = 0.8;

/**
 * F13 — the memoryless approaches' per-frame comparison beam. Connects the two
 * tiles `scene.link` names this frame, tile-to-tile along the ground row rather
 * than tile-to-wall (there is no wall to aim at — `slots` is always `[]` in
 * those traces, per lib/types.ts's doc on `link`'s dual meaning). Serves brute
 * force's every-pair scan and sort-and-scan's neighbour comparison alike; both
 * are just "two tiles, one line."
 *
 * Unlike LookupBeam there is nothing to freeze: `link` is only ever non-null
 * on the exact frame it describes (the generators clear it back to null
 * between comparisons), so reading it fresh every tick is correct as-is.
 *
 * `targetOpacity` is scaled by `1 - progressRef.current` — the mirror image
 * of LookupBeam's scaling — so this beam fades out exactly as the tile-to-
 * wall beam fades in, "collapsing" the two into one as the toggle completes.
 */
function CompareBeam({
  frameRef,
  count,
  progressRef,
}: {
  frameRef: RefObject<ArrayMemoryFrame>;
  count: number;
  progressRef: RefObject<number>;
}) {
  const startX = -((count - 1) * TILE_GAP) / 2;

  const beamRef = useRef<THREE.Mesh>(null);
  const beamMaterialRef = useRef<THREE.MeshBasicMaterial>(null);
  const currentStart = useRef(new THREE.Vector3());
  const currentEnd = useRef(new THREE.Vector3());
  const currentOpacity = useRef(0);
  const direction = useRef(new THREE.Vector3());
  const midpoint = useRef(new THREE.Vector3());
  const upAxis = useRef(new THREE.Vector3(0, 1, 0));

  useFrame((state, delta) => {
    const beam = beamRef.current;
    const beamMaterial = beamMaterialRef.current;
    if (!beam || !beamMaterial) return;

    const { kind } = frameRef.current;
    const { link, slots } = frameRef.current.scene;
    // Guard on `slots.length === 0` (not just `link !== null`) so this never
    // fires on a wall-bearing approach's one link-bearing frame, where link's
    // second index is a wall-slot index, not a tile index (lib/types.ts).
    const visible = link !== null && slots.length === 0;
    const targetOpacity = (visible ? COMPARE_BEAM_MAX_OPACITY : 0) * (1 - progressRef.current);

    if (visible && link !== null) {
      const tileTopY = TILE_HEIGHT / 2 + LIFT_HEIGHT;
      currentStart.current.set(startX + link[0] * TILE_GAP, tileTopY, 0);
      currentEnd.current.set(startX + link[1] * TILE_GAP, tileTopY, 0);
    }

    currentOpacity.current = THREE.MathUtils.damp(currentOpacity.current, targetOpacity, DAMPING, delta);

    direction.current.subVectors(currentEnd.current, currentStart.current);
    const length = Math.max(direction.current.length(), 0.001);
    midpoint.current.copy(currentStart.current).addScaledVector(direction.current, 0.5);

    beam.position.copy(midpoint.current);
    beam.quaternion.setFromUnitVectors(upAxis.current, direction.current.clone().normalize());
    beam.scale.set(1, length, 1);
    beamMaterial.opacity = currentOpacity.current;
    beamMaterial.color.copy(COLOR_ACTIVE).lerp(COLOR_MATCH, kind === "match" ? 1 : 0);

    if (Math.abs(currentOpacity.current - targetOpacity) > SETTLE_EPSILON) state.invalidate();
  });

  return (
    <mesh ref={beamRef}>
      <cylinderGeometry args={[BEAM_RADIUS, BEAM_RADIUS, 1, 8]} />
      <meshBasicMaterial
        ref={beamMaterialRef}
        color={COLOR_ACTIVE}
        transparent
        opacity={0}
        toneMapped={false}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

const CRISSCROSS_BEAM_RADIUS = 0.02;
const CRISSCROSS_MAX_OPACITY = 0.4;
// Distinct lift per beam so several simultaneous tile-to-tile lines read as
// a fanned crisscross instead of one straight line hidden behind another —
// every pair shares the same X span (tiles sit in a single row on z=0).
const CRISSCROSS_LIFTS = [1.1, 0.75, 1.4, 0.45];

/**
 * F13's decorative "crisscross beams" — the visual brute force never shows
 * during ordinary playback (CompareBeam already covers that; this is purely
 * the toggle's showpiece). A fixed set of tile-to-tile arcs whose opacity is
 * `4 * progress * (1 - progress)`: zero at both resting states (wall down,
 * wall up) and peaking only mid-transition, so switching either direction
 * reads as the same beams blooming and then collapsing into LookupBeam's
 * single vertical line — no separate one-shot state needed, because that
 * shape falls straight out of the same `progressRef` everything else in this
 * file already reads.
 */
function CrissCrossBeams({
  count,
  progressRef,
}: {
  count: number;
  progressRef: RefObject<number>;
}) {
  const pairs = useMemo(() => {
    const result: [number, number][] = [];
    for (let i = 0; i < Math.floor(count / 2); i++) {
      const j = count - 1 - i;
      if (j > i) result.push([i, j]);
    }
    return result;
  }, [count]);

  const startX = -((count - 1) * TILE_GAP) / 2;
  const beamRefs = useRef<(THREE.Mesh | null)[]>([]);
  const materialRefs = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const start = useRef(new THREE.Vector3());
  const end = useRef(new THREE.Vector3());
  const direction = useRef(new THREE.Vector3());
  const midpoint = useRef(new THREE.Vector3());
  const upAxis = useRef(new THREE.Vector3(0, 1, 0));

  useFrame((state) => {
    const progress = progressRef.current;
    const opacity = 4 * progress * (1 - progress) * CRISSCROSS_MAX_OPACITY;

    for (let p = 0; p < pairs.length; p++) {
      const beam = beamRefs.current[p];
      const material = materialRefs.current[p];
      if (!beam || !material) continue;

      const [i, j] = pairs[p];
      const lift = CRISSCROSS_LIFTS[p % CRISSCROSS_LIFTS.length];
      start.current.set(startX + i * TILE_GAP, TILE_HEIGHT / 2 + lift, 0);
      end.current.set(startX + j * TILE_GAP, TILE_HEIGHT / 2 + lift, 0);

      direction.current.subVectors(end.current, start.current);
      const length = Math.max(direction.current.length(), 0.001);
      midpoint.current.copy(start.current).addScaledVector(direction.current, 0.5);

      beam.position.copy(midpoint.current);
      beam.quaternion.setFromUnitVectors(upAxis.current, direction.current.clone().normalize());
      beam.scale.set(1, length, 1);
      material.opacity = opacity;
    }

    if (opacity > SETTLE_EPSILON) state.invalidate();
  });

  if (pairs.length === 0) return null;

  return (
    <group>
      {pairs.map((pair, p) => (
        <mesh
          key={`${pair[0]}-${pair[1]}`}
          ref={(node) => {
            beamRefs.current[p] = node;
          }}
        >
          <cylinderGeometry args={[CRISSCROSS_BEAM_RADIUS, CRISSCROSS_BEAM_RADIUS, 1, 8]} />
          <meshBasicMaterial
            ref={(node) => {
              materialRefs.current[p] = node;
            }}
            color={COLOR_ACTIVE}
            transparent
            opacity={0}
            toneMapped={false}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
}

function ReflectiveGround() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -TILE_HEIGHT / 2 - 0.01, 0]}>
      <planeGeometry args={[40, 40]} />
      <MeshReflectorMaterial
        resolution={512}
        mixBlur={1}
        mixStrength={0.35}
        blur={[300, 100]}
        depthScale={0}
        minDepthThreshold={0.85}
        maxDepthThreshold={1.2}
        color="#0a0b0f"
        metalness={0.4}
        roughness={1}
        mirror={0}
      />
    </mesh>
  );
}

/**
 * The shared learning-view scene for the "one array, optionally one remembered
 * structure behind it" family — every Arrays & Hashing problem, not just Two
 * Sum.
 *
 * Nothing here is problem-specific, and that is not an accident: AGENTS.md's
 * hard rule confines every word and number to the DOM layer, so all this
 * component ever reads are tile STATES and INDICES. It never touches a value,
 * a key, a target or a label. Making it generic therefore cost no
 * parameterization at all — the only thing that had to change was keying the
 * wall on "do these frames use memory" rather than on the approach's name.
 */
export function ArrayMemoryScene({
  frames,
  onTilePositions,
  onSlotPositions,
  cameraRig,
}: ArrayMemorySceneProps) {
  const frameRef = useRef<ArrayMemoryFrame>(frames[0]);
  // Only the LENGTH of `nums` is invariant across a trace (lib/types.ts) — a
  // sort-based approach reorders the values themselves — and length is all
  // the geometry needs, since every tile's position comes from its index.
  const count = frames[0].scene.nums.length;

  // Capacity is problem-level, not approach-level: the wall mounts for every
  // approach so its rise/sink can animate across a switch (F13), sized to the
  // most entries the structure could ever hold.
  const capacity = count;

  // Whether THIS render's frames carry a memory structure at all. Derived
  // fresh each render rather than from the approach name, so a new memoryless
  // approach needs no case added here. FrameCursor mirrors it into a ref for
  // the mesh tree; `progressRef` is seeded from it so the first render starts
  // at the resting state instead of animating in from the wrong one.
  const wallUp = framesUseMemory(frames);
  const wallUpRef = useRef<boolean>(wallUp);
  const progressRef = useRef(wallUp ? 1 : 0);

  return (
    <>
      <FrameCursor
        frames={frames}
        wallUp={wallUp}
        frameRef={frameRef}
        wallUpRef={wallUpRef}
      />
      <MemoryTransition wallUpRef={wallUpRef} progressRef={progressRef} />
      <CameraChoreography
        frames={frames}
        count={count}
        hasWall={wallUp}
        cameraRig={cameraRig}
      />
      <ArrayTiles count={count} frameRef={frameRef} onTilePositions={onTilePositions} />
      <MemoryWall
        capacity={capacity}
        frameRef={frameRef}
        progressRef={progressRef}
        onSlotPositions={onSlotPositions}
      />
      <LookupBeam
        capacity={capacity}
        frameRef={frameRef}
        count={count}
        progressRef={progressRef}
      />
      <CompareBeam frameRef={frameRef} count={count} progressRef={progressRef} />
      <CrissCrossBeams count={count} progressRef={progressRef} />
      <ReflectiveGround />
    </>
  );
}
