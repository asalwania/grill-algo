"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";

type CountValue = { count: number };

const CountContext = createContext<CountValue>({ count: 0 });

/**
 * Lives inside the Canvas — i.e. inside R3F's own reconciler tree, not the DOM
 * tree. It reads the *same* context object the DOM button writes to.
 */
function ContextColouredMesh() {
  const { count } = useContext(CountContext);
  // three's Color.setStyle only parses the COMMA form of hsl(). The modern
  // space-separated CSS form silently no-ops and leaves the colour unchanged.
  const colour = `hsl(${(count * 40) % 360}, 80%, 55%)`;
  console.log("ContextColouredMesh render", { count, colour });
  return (
    <mesh rotation={[0.4, 0.8, 0]}>
      <boxGeometry args={[1.6, 1.6, 1.6]} />
      <meshStandardMaterial color={colour} />
    </mesh>
  );
}

export default function ContextCanvasPage() {
  const [count, setCount] = useState(0);
  // `count` is a discrete integer, so it is legal to send across Context here.
  const value = useMemo(() => ({ count }), [count]);

  return (
    <CountContext.Provider value={value}>
      <main className="flex flex-col items-start gap-6 p-8">
        <button
          type="button"
          onClick={() => setCount((c) => c + 1)}
          className="rounded border border-white/20 px-4 py-2 font-mono text-sm"
        >
          increment — count is {count}
        </button>

        <div className="h-96 w-96 rounded border border-white/10">
          <Canvas camera={{ position: [3, 3, 3], fov: 45 }}>
            <ambientLight intensity={0.6} />
            <directionalLight position={[3, 4, 6]} intensity={2.5} />
            <ContextColouredMesh />
          </Canvas>
        </div>
      </main>
    </CountContext.Provider>
  );
}
