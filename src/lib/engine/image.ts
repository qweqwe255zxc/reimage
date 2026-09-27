export async function loadBitmap(src: string | Blob): Promise<ImageBitmap> {
  const blob = typeof src === "string" ? await (await fetch(src)).blob() : src;
  return createImageBitmap(blob, { imageOrientation: "from-image" });
}

function crop(bmp: ImageBitmap) {
  const s = Math.min(bmp.width, bmp.height);
  return { sx: (bmp.width - s) / 2, sy: (bmp.height - s) / 2, s };
}

// center crop + downscale in halving steps, one big jump looks aliased
export function toGrid(bmp: ImageBitmap, n: number): Uint8ClampedArray {
  const { sx, sy, s } = crop(bmp);
  let size = s;
  let from: CanvasImageSource = bmp;
  let fx = sx;
  let fy = sy;
  let fs = s;
  while (size / 2 > n) {
    size = Math.floor(size / 2);
    const next = document.createElement("canvas");
    next.width = next.height = size;
    const ctx = next.getContext("2d")!;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(from, fx, fy, fs, fs, 0, 0, size, size);
    from = next;
    fx = fy = 0;
    fs = size;
  }
  const out = document.createElement("canvas");
  out.width = out.height = n;
  const ctx = out.getContext("2d", { willReadFrequently: true })!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(from, fx, fy, fs, fs, 0, 0, n, n);
  return ctx.getImageData(0, 0, n, n).data;
}

export function toSquare(bmp: ImageBitmap, size = 720): HTMLCanvasElement {
  const { sx, sy, s } = crop(bmp);
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bmp, sx, sy, s, s, 0, 0, size, size);
  return c;
}
