# ReImage

Pixels of one image fly across and rebuild another one. Nothing lost, nothing recolored.

Next.js + TypeScript + WebGL2. Everything runs in the browser, images never leave it.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
```

## How it works

1. Both images are cropped square and shrunk to an N×N grid.
2. `src/lib/engine/assign.ts` decides which source pixel goes where: brightness rank to rank first,
   then batches of pair swaps that bring colors closer to the target (Lab space). Runs in a web worker.
3. `src/lib/engine/morph.ts` gives every particle a launch order and an arc. Particles keep their identity,
   so morphs can chain.
4. `src/lib/engine/renderer.ts` draws every pixel as a gl point, the flight is computed in the vertex shader,
   so the trajectory constructor updates live.

`public/demo/` — procedural demo images plus two photos (evening and day) used as the default pair.

## Deploy

Import the repo on vercel.com, defaults are fine.
