# ReImage — site

Next.js + TypeScript + WebGL2 version of the same effect, made for the portfolio.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
```

- `src/lib/engine/assign.ts` — port of `reimage/assign.py`, runs in a web worker
- `src/lib/engine/morph.ts` — start delays / arcs, particles keep identity so morphs can chain
- `src/lib/engine/renderer.ts` — every pixel is a gl point, motion is computed in the vertex shader
- `public/demo/` — procedural demo images (generated with the python code) plus two photos (evening and day) used as the default pair

Deploy: import the repo on vercel.com and set **Root Directory** to `site`.
