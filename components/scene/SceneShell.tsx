"use client";

import dynamic from "next/dynamic";
import * as THREE from "three";
import { OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import {
  Suspense,
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  type ComponentRef,
  type ReactNode,
  type RefObject,
} from "react";

// `ssr: false` is only legal in a Client Component (this file is one) — Next
// throws a build error if it's used from a Server Component. The whole point
// is to keep WebGL/three init off the server render entirely.
const Canvas = dynamic(
  () => import("@react-three/fiber").then((mod) => mod.Canvas),
  { ssr: false },
);

export type SceneShellHandle = {
  /**
   * Damps the camera toward a new FOCUS point over subsequent frames — the
   * point OrbitControls looks at, not the camera's own position. The rig
   * keeps a fixed camera-to-focus offset (seeded from the initial camera
   * position and orbit target, or replaced wholesale by the optional
   * `offset` here) and moves both the focus and the camera by the same
   * amount, so this is a true dolly: whatever sits at the focus point stays
   * in the same place on screen instead of drifting as the camera slides.
   * Pass `offset` to also change the framing itself (F12's pull-back/tilt on
   * a match) — omitted, the rig keeps whatever offset is currently in play.
   *
   * No-ops while the user is mid-orbit — see `resumeAutoCamera`. Safe to
   * call in "demand" frameloop — it nudges the render loop itself.
   */
  moveTo: (
    x: number,
    y: number,
    z: number,
    offset?: [number, number, number],
  ) => void;
  /**
   * Clears the manual-orbit suspension: nothing is more irritating than a
   * camera that fights the user, so once they've grabbed OrbitControls
   * directly, `moveTo` calls are ignored until this is called (wire it to
   * the player's restart action).
   */
  resumeAutoCamera: () => void;
};

type SceneShellProps = {
  /** The bespoke per-problem scene (shapes + motion only — no text meshes). */
  children: ReactNode;
  /** Drives frameloop: "always" while true, "demand" otherwise. */
  isPlaying: boolean;
  /** Rendered instead of the Canvas when WebGL isn't available. */
  fallback: ReactNode;
  initialCameraPosition?: [number, number, number];
  orbitTarget?: [number, number, number];
};

const DAMPING = 4;
const SETTLE_EPSILON = 0.001;

type OrbitControlsHandle = ComponentRef<typeof OrbitControls>;
type CameraRigHandle = SceneShellHandle;

/**
 * Lives inside the Canvas. Holds a target FOCUS point and a camera-to-focus
 * offset, and damps both the real camera position and OrbitControls' own
 * `target` toward them every frame — moving the two together is what makes
 * this a dolly rather than a camera that slides while still looking at a
 * fixed point. Calls `invalidate()` itself so the move plays out under
 * frameloop="demand" without the caller needing to force "always".
 *
 * Skips entirely while `userOrbiting` is set (F12): OrbitControls owns the
 * camera fully once the user grabs it — three.js's OrbitControls.update()
 * recomputes camera.position from `target` plus its own internal spherical
 * state every frame regardless of who else touches the transform, so writing
 * here at the same time is exactly the "camera fights you" bug the feature
 * spec calls out, not a race that resolves itself.
 */
const CameraRig = forwardRef<
  CameraRigHandle,
  {
    orbitControlsRef: RefObject<OrbitControlsHandle | null>;
    /**
     * Owned by SceneShell, not this component: OrbitControls' `onStart`
     * (wired by the parent) sets it, this rig only ever reads and clears it.
     * A shared ref rather than React state because flipping it must never
     * cause a re-render — it's read every frame inside useFrame.
     */
    userOrbitingRef: RefObject<boolean>;
  }
>(function CameraRig({ orbitControlsRef, userOrbitingRef }, ref) {
  const { invalidate } = useThree();
  // Lazily seeded from the controls' own current target/offset (not
  // useThree()'s render-time snapshot) on the first tick, so there's
  // nothing to keep in sync with SceneShell's initial-position props.
  const focusTarget = useRef<THREE.Vector3 | null>(null);
  const cameraOffset = useRef<THREE.Vector3 | null>(null);

  useImperativeHandle(
    ref,
    () => ({
      moveTo: (x, y, z, offset) => {
        if (userOrbitingRef.current) return;
        (focusTarget.current ??= new THREE.Vector3()).set(x, y, z);
        if (offset)
          (cameraOffset.current ??= new THREE.Vector3()).set(
            offset[0],
            offset[1],
            offset[2],
          );
        invalidate();
      },
      resumeAutoCamera: () => {
        userOrbitingRef.current = false;
        invalidate();
      },
    }),
    [invalidate, userOrbitingRef],
  );

  // Reads `camera` off the frame-loop state rather than destructuring it from
  // useThree() at render time: react-hooks/immutability flags mutating a
  // value returned from a hook, but mutating Object3D transforms imperatively
  // inside useFrame — outside React's render/commit cycle entirely — is the
  // documented R3F pattern, not a purity violation.
  useFrame(({ camera }, delta) => {
    if (userOrbitingRef.current) return;
    const controls = orbitControlsRef.current;
    if (!controls) return;

    focusTarget.current ??= controls.target.clone();
    cameraOffset.current ??= camera.position.clone().sub(controls.target);

    const desiredCameraPosition = focusTarget.current
      .clone()
      .add(cameraOffset.current);

    if (
      controls.target.distanceTo(focusTarget.current) < SETTLE_EPSILON &&
      camera.position.distanceTo(desiredCameraPosition) < SETTLE_EPSILON
    ) {
      return;
    }

    controls.target.x = THREE.MathUtils.damp(
      controls.target.x,
      focusTarget.current.x,
      DAMPING,
      delta,
    );
    controls.target.y = THREE.MathUtils.damp(
      controls.target.y,
      focusTarget.current.y,
      DAMPING,
      delta,
    );
    controls.target.z = THREE.MathUtils.damp(
      controls.target.z,
      focusTarget.current.z,
      DAMPING,
      delta,
    );

    camera.position.x = THREE.MathUtils.damp(
      camera.position.x,
      desiredCameraPosition.x,
      DAMPING,
      delta,
    );
    camera.position.y = THREE.MathUtils.damp(
      camera.position.y,
      desiredCameraPosition.y,
      DAMPING,
      delta,
    );
    camera.position.z = THREE.MathUtils.damp(
      camera.position.z,
      desiredCameraPosition.z,
      DAMPING,
      delta,
    );

    invalidate();
  });

  return null;
});

/**
 * F15 — three.js's OrbitControls.connect() unconditionally sets the canvas's
 * own `touch-action` to "none" (see three-stdlib's OrbitControls.js), which
 * blocks native one-finger page scroll over the canvas regardless of the
 * `touches` config below. Overwriting it to "pan-y" restores native vertical
 * scroll; two-finger gestures still reach OrbitControls since "pan-y" only
 * reserves the vertical-pan gesture for the browser, not pinch/rotate.
 *
 * Reads `gl` off the frame-loop callback rather than destructuring it from
 * useThree() at render time, same rationale as CameraRig's `camera` above —
 * mutating a hook-returned value trips react-hooks/immutability, but a plain
 * useFrame callback argument isn't one. A one-shot ref guards the actual
 * mutation so it runs exactly once, not on every frame.
 */
function TouchActionFix() {
  const applied = useRef(false);
  useFrame((state) => {
    if (applied.current) return;
    state.gl.domElement.style.touchAction = "pan-y";
    applied.current = true;
  });
  return null;
}

function LightingRig() {
  return (
    <>
      <ambientLight intensity={0.35} />
      {/* key */}
      <directionalLight position={[4, 6, 5]} intensity={2.2} color="#e8eaf0" />
      {/* fill — dim, cool-tinted so it reads as bounce rather than a second key */}
      <directionalLight
        position={[-5, 2, -4]}
        intensity={0.4}
        color="#3ddcff"
      />
    </>
  );
}

/**
 * Exported for F16: ScenePanel decides between the Canvas and the flat view,
 * so it needs the same answer this shell does. Safe to call from both — it
 * creates and discards a throwaway canvas rather than reading shared state, and
 * both callers run it once in a lazy `useState` initializer.
 */
export function detectWebGLSupport(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl2") ?? canvas.getContext("webgl"))
    );
  } catch {
    return false;
  }
}

/**
 * Reusable Canvas frame every problem's bespoke scene mounts inside. Owns
 * lighting, camera damping, constrained orbit controls, and the WebGL
 * capability gate — the bespoke scene only ever supplies `children`.
 */
export const SceneShell = forwardRef<SceneShellHandle, SceneShellProps>(
  function SceneShell(
    {
      children,
      isPlaying,
      fallback,
      initialCameraPosition = [4, 3, 5],
      orbitTarget = [0, 0, 0],
    },
    ref,
  ) {
    const rigRef = useRef<CameraRigHandle>(null);
    const orbitControlsRef = useRef<OrbitControlsHandle>(null);
    // Shared with CameraRig as a plain ref, not React state: OrbitControls'
    // `onStart` fires on every drag/wheel interaction, and routing that
    // through state would re-render the whole scene tree on every tick of a
    // zoom gesture.
    const userOrbitingRef = useRef(false);
    // Lazy initializer: on the server this guards on `typeof window` and
    // assumes support (matching next/dynamic's own ssr:false no-op), and on
    // the client's first render it runs the real check immediately — no
    // effect, so no extra post-hydration render pass.
    const [webglSupported] = useState(detectWebGLSupport);

    useImperativeHandle(
      ref,
      () => ({
        moveTo: (x, y, z, offset) => rigRef.current?.moveTo(x, y, z, offset),
        resumeAutoCamera: () => rigRef.current?.resumeAutoCamera(),
      }),
      [],
    );

    if (!webglSupported) {
      return <>{fallback}</>;
    }

    return (
      <div className="h-full w-full">
        <Canvas
          frameloop={isPlaying ? "always" : "demand"}
          dpr={[1, 2]}
          camera={{ position: initialCameraPosition, fov: 45 }}
        >
          <Suspense fallback={null}>
            <LightingRig />
            <CameraRig
              ref={rigRef}
              orbitControlsRef={orbitControlsRef}
              userOrbitingRef={userOrbitingRef}
            />
            <OrbitControls
              ref={orbitControlsRef}
              target={orbitTarget}
              enablePan={false}
              minPolarAngle={Math.PI / 6}
              maxPolarAngle={Math.PI / 2.1}
              // minDistance={3}
              // maxDistance={12}
              enableDamping
              // F15: one finger scrolls the page (touches.ONE omitted -> falls
              // to OrbitControls' internal STATE.NONE default), two fingers orbit.
              touches={{ TWO: THREE.TOUCH.ROTATE }}
              onStart={() => {
                userOrbitingRef.current = true;
              }}
            />
            <TouchActionFix />
            {children}
          </Suspense>
        </Canvas>
      </div>
    );
  },
);
