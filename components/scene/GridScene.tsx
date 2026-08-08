"use client";

import { MeshReflectorMaterial, RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { usePlayerState } from "@/components/player";
import type { GridCellState, GridFrame } from "@/lib/types";

/** Canvas-relative pixel position of one cell, for the DOM label layer. */
export type CellScreenPosition = {
  index: number;
  x: number;
  y: number;
  /** Same REFERENCE_DISTANCE convention as the array scene's TileScreenPosition. */
  scale: number;
};

/**
 * Purely a visual accent — an OPTIONAL sub-block size the board is tinted by
 * (Sudoku's 3x3 boxes) and, in the 2D flat view, ruled with a heavier border.
 * The scene never uses this to decide any cell's STATE (that's `peer`,
 * computed by the trace) — it only decides which two idle colours a resting
 * cell alternates between. A future grid problem with no sub-block structure
 * (Search a 2D Matrix, say) simply omits it and gets a plain checkerboard.
 */
export type GridBoxSize = { rows: number; cols: number };

type GridSceneProps = {
  frames: GridFrame[];
  boxSize?: GridBoxSize;
  /** Same contract as ArrayMemoryScene's onTilePositions — mutated in place,
   *  read synchronously, never held onto. */
  onCellPositions?: (positions: CellScreenPosition[]) => void;
};

const CELL_SIZE = 0.82;
const CELL_HEIGHT = 0.22;
const CELL_GAP = 0.92;
const CELL_RADIUS = 0.05;
const LIFT_HEIGHT = 0.14;

// Same exponential-damping convention as ArrayMemoryScene.tsx: frame-rate
// independent, always retargets from wherever the value currently sits.
const DAMPING = 9;
const SETTLE_EPSILON = 0.002;
const REFERENCE_DISTANCE = 9;

// Two idle tones, alternated by checkerboard parity (by box when `boxSize` is
// given, else by plain (row+col) parity) — a static "this is a board" cue
// that costs no problem-specific parameterization, same spirit as G1's rule
// that the canvas reads only states and indices.
const COLOR_IDLE_A = new THREE.Color(0x14161d); // --color-surface-raised
const COLOR_IDLE_B = new THREE.Color(0x1a1d27); // one step lighter
const COLOR_ACTIVE = new THREE.Color(0x3ddcff); // --color-signal-cyan
const COLOR_DONE = new THREE.Color(0xa78bfa); // --color-signal-violet
const COLOR_CONFLICT = new THREE.Color(0xffb454); // --color-signal-amber — a flag, not a "match"
// Derived rather than a third hand-picked hex: always reads as "cyan family,
// dimmer" regardless of which idle tone the cell was resting at.
const COLOR_PEER = COLOR_IDLE_A.clone().lerp(COLOR_ACTIVE, 0.4);

const EMISSIVE_IDLE = 0.05;
const EMISSIVE_ACTIVE = 1.4;
const EMISSIVE_PEER = 0.4;
const EMISSIVE_DONE = 0.35;
const EMISSIVE_CONFLICT = 1.2;

function targetColorFor(state: GridCellState, idleBase: THREE.Color): THREE.Color {
  switch (state) {
    case "active":
      return COLOR_ACTIVE;
    case "peer":
      return COLOR_PEER;
    case "done":
      return COLOR_DONE;
    case "conflict":
      return COLOR_CONFLICT;
    case "idle":
    default:
      return idleBase;
  }
}

function targetEmissiveFor(state: GridCellState): number {
  switch (state) {
    case "active":
      return EMISSIVE_ACTIVE;
    case "peer":
      return EMISSIVE_PEER;
    case "done":
      return EMISSIVE_DONE;
    case "conflict":
      return EMISSIVE_CONFLICT;
    case "idle":
    default:
      return EMISSIVE_IDLE;
  }
}

function targetLiftFor(state: GridCellState): number {
  return state === "active" || state === "conflict" ? LIFT_HEIGHT : 0;
}

function colorNear(a: THREE.Color, b: THREE.Color, eps: number): boolean {
  return (
    Math.abs(a.r - b.r) < eps && Math.abs(a.g - b.g) < eps && Math.abs(a.b - b.b) < eps
  );
}

function cellWorldX(col: number, cols: number): number {
  const startX = -((cols - 1) * CELL_GAP) / 2;
  return startX + col * CELL_GAP;
}

function cellWorldZ(row: number, rows: number): number {
  const startZ = -((rows - 1) * CELL_GAP) / 2;
  return startZ + row * CELL_GAP;
}

/**
 * Mounted as a sibling of the cells, never a parent — same rationale as
 * ArrayMemoryScene's FrameCursor: subscribing to usePlayerState() here
 * re-renders only this null-returning component on step change, and the mesh
 * tree reads `frameRef` imperatively inside useFrame instead of taking the
 * frame as a prop.
 */
function FrameCursor({
  frames,
  frameRef,
}: {
  frames: GridFrame[];
  frameRef: RefObject<GridFrame>;
}) {
  const { step } = usePlayerState();
  useEffect(() => {
    frameRef.current = frames[Math.min(step, frames.length - 1)] ?? frameRef.current;
  }, [frames, step, frameRef]);
  return null;
}

function boxParity(row: number, col: number, boxSize: GridBoxSize | undefined): number {
  if (!boxSize) return (row + col) % 2;
  const boxRow = Math.floor(row / boxSize.rows);
  const boxCol = Math.floor(col / boxSize.cols);
  return (boxRow + boxCol) % 2;
}

function GridCells({
  rows,
  cols,
  boxSize,
  frameRef,
  onCellPositions,
}: {
  rows: number;
  cols: number;
  boxSize?: GridBoxSize;
  frameRef: RefObject<GridFrame>;
  onCellPositions?: (positions: CellScreenPosition[]) => void;
}) {
  const count = rows * cols;
  const groupRefs = useRef<(THREE.Group | null)[]>([]);
  const materialRefs = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const positions = useRef<CellScreenPosition[]>(
    Array.from({ length: count }, (_, index) => ({ index, x: 0, y: 0, scale: 1 })),
  );
  const projectionVector = useRef(new THREE.Vector3());

  const idleColors = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const row = Math.floor(i / cols);
        const col = i % cols;
        return boxParity(row, col, boxSize) === 0 ? COLOR_IDLE_A : COLOR_IDLE_B;
      }),
    [count, cols, boxSize],
  );

  useFrame((state, delta) => {
    const cells = frameRef.current.scene.cells;
    const alpha = 1 - Math.exp(-DAMPING * delta);
    let unsettled = false;

    for (let i = 0; i < count; i++) {
      const group = groupRefs.current[i];
      const material = materialRefs.current[i];
      if (!group || !material) continue;

      const cellState = cells[i] ?? "idle";
      const targetColor = targetColorFor(cellState, idleColors[i]);
      const targetEmissiveIntensity = targetEmissiveFor(cellState);
      const targetY = targetLiftFor(cellState);

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

      if (onCellPositions) {
        projectionVector.current.set(
          group.position.x,
          group.position.y + CELL_HEIGHT / 2,
          group.position.z,
        );
        const distance = state.camera.position.distanceTo(projectionVector.current);
        projectionVector.current.project(state.camera);
        const point = positions.current[i];
        point.x = (projectionVector.current.x * 0.5 + 0.5) * state.size.width;
        point.y = (-projectionVector.current.y * 0.5 + 0.5) * state.size.height;
        point.scale = REFERENCE_DISTANCE / Math.max(distance, 0.001);
      }
    }

    if (unsettled) state.invalidate();
    onCellPositions?.(positions.current);
  });

  return (
    <group>
      {Array.from({ length: count }, (_, i) => {
        const row = Math.floor(i / cols);
        const col = i % cols;
        return (
          <group
            key={i}
            position={[cellWorldX(col, cols), 0, cellWorldZ(row, rows)]}
            ref={(node) => {
              groupRefs.current[i] = node;
            }}
          >
            <RoundedBox args={[CELL_SIZE, CELL_HEIGHT, CELL_SIZE]} radius={CELL_RADIUS} smoothness={4}>
              <meshStandardMaterial
                ref={(node) => {
                  materialRefs.current[i] = node;
                }}
                color={idleColors[i]}
                emissive={idleColors[i]}
                emissiveIntensity={EMISSIVE_IDLE}
                roughness={0.35}
                metalness={0.3}
              />
            </RoundedBox>
          </group>
        );
      })}
    </group>
  );
}

const BEAM_RADIUS = 0.025;

/**
 * One straight beam between two flat cell indices, read fresh every frame
 * (never latched) — reused for both the transient comparison beam
 * (`scene.link`, cyan) and the persistent conflict beam (`scene.result`,
 * amber). Unlike ArrayMemoryScene's LookupBeam there is nothing to freeze:
 * both `link` and `result` name real cells directly, with no "miss has no
 * slot to aim at" case to resolve.
 */
function LinkBeam({
  frameRef,
  rows,
  cols,
  field,
  color,
  maxOpacity,
}: {
  frameRef: RefObject<GridFrame>;
  rows: number;
  cols: number;
  field: "link" | "result";
  color: THREE.Color;
  maxOpacity: number;
}) {
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

    const pair = frameRef.current.scene[field];
    const visible = pair !== null;
    const targetOpacity = visible ? maxOpacity : 0;

    if (visible && pair) {
      const topY = CELL_HEIGHT / 2 + LIFT_HEIGHT;
      const [a, b] = pair;
      const rowA = Math.floor(a / cols);
      const colA = a % cols;
      const rowB = Math.floor(b / cols);
      const colB = b % cols;
      currentStart.current.set(cellWorldX(colA, cols), topY, cellWorldZ(rowA, rows));
      currentEnd.current.set(cellWorldX(colB, cols), topY, cellWorldZ(rowB, rows));
    }

    currentOpacity.current = THREE.MathUtils.damp(currentOpacity.current, targetOpacity, DAMPING, delta);

    direction.current.subVectors(currentEnd.current, currentStart.current);
    const length = Math.max(direction.current.length(), 0.001);
    midpoint.current.copy(currentStart.current).addScaledVector(direction.current, 0.5);

    beam.position.copy(midpoint.current);
    beam.quaternion.setFromUnitVectors(upAxis.current, direction.current.clone().normalize());
    beam.scale.set(1, length, 1);
    beamMaterial.opacity = currentOpacity.current;

    if (Math.abs(currentOpacity.current - targetOpacity) > SETTLE_EPSILON) state.invalidate();
  });

  return (
    <mesh ref={beamRef}>
      <cylinderGeometry args={[BEAM_RADIUS, BEAM_RADIUS, 1, 8]} />
      <meshBasicMaterial
        ref={beamMaterialRef}
        color={color}
        transparent
        opacity={0}
        toneMapped={false}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

function ReflectiveGround() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -CELL_HEIGHT / 2 - 0.01, 0]}>
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
 * The shared learning-view scene for the grid-problem family — 2D board
 * problems with no honest 1D reading (Valid Sudoku, and any future
 * Arrays & Hashing / Matrix problem shaped like it).
 *
 * No camera choreography (contrast ArrayMemoryScene's F12 dolly): a board
 * this size fits entirely in one static establishing shot, so there is no
 * "active tile" to dolly toward the way a long array has. No memory wall
 * either — `peer` is the visual the array family's `slots` would have been;
 * it costs no second structure to render.
 */
export function GridScene({ frames, boxSize, onCellPositions }: GridSceneProps) {
  const frameRef = useRef<GridFrame>(frames[0]);
  const { rows, cols } = frames[0].scene;

  return (
    <>
      <FrameCursor frames={frames} frameRef={frameRef} />
      <GridCells
        rows={rows}
        cols={cols}
        boxSize={boxSize}
        frameRef={frameRef}
        onCellPositions={onCellPositions}
      />
      <LinkBeam
        frameRef={frameRef}
        rows={rows}
        cols={cols}
        field="link"
        color={COLOR_ACTIVE}
        maxOpacity={0.8}
      />
      <LinkBeam
        frameRef={frameRef}
        rows={rows}
        cols={cols}
        field="result"
        color={COLOR_CONFLICT}
        maxOpacity={0.9}
      />
      <ReflectiveGround />
    </>
  );
}
