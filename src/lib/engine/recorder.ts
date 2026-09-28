// records the gl canvas into a video: photo first, it dissolves into the pixel grid, then the flight
export const REC = { intro: 0.9, holdStart: 0.6, holdEnd: 1.5 };

const MIMES = ["video/mp4;codecs=avc1", "video/mp4", "video/webm;codecs=vp9", "video/webm"];

export function recordMime() {
  if (typeof MediaRecorder === "undefined") return undefined;
  return MIMES.find((t) => MediaRecorder.isTypeSupported(t));
}

export function download(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

export class ClipRecorder {
  readonly start = performance.now();
  private canvas = document.createElement("canvas");
  private ctx: CanvasRenderingContext2D;
  private recorder: MediaRecorder;
  private chunks: Blob[] = [];

  constructor(
    private source: HTMLCanvasElement,
    private intro: HTMLCanvasElement,
    readonly w: number,
    readonly h: number,
    private mime: string,
    private bg = "#0e0e10",
  ) {
    this.canvas.width = w;
    this.canvas.height = h;
    this.ctx = this.canvas.getContext("2d")!;
    this.recorder = new MediaRecorder(this.canvas.captureStream(60), { mimeType: mime, videoBitsPerSecond: 16e6 });
    this.recorder.ondataavailable = (e) => e.data.size && this.chunks.push(e.data);
    this.frame();
    this.recorder.start();
  }

  get elapsed() {
    return (performance.now() - this.start) / 1000;
  }

  // morph time for the current moment, or null once the clip is over
  timeFor(duration: number): number | null {
    const m = this.elapsed - REC.intro - REC.holdStart;
    if (m > duration + REC.holdEnd) return null;
    return Math.min(1, Math.max(0, m / duration));
  }

  frame() {
    const { ctx, w, h } = this;
    const side = Math.floor(Math.min(w, h) * 0.92);
    const x = (w - side) / 2;
    const y = (h - side) / 2;
    ctx.fillStyle = this.bg;
    ctx.fillRect(0, 0, w, h);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.source, x, y, side, side);
    const a = Math.min(1, Math.max(0, (this.elapsed / REC.intro - 0.35) / 0.65)); // photo dissolves into the grid
    if (a < 1) {
      ctx.globalAlpha = 1 - a;
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(this.intro, x, y, side, side);
      ctx.globalAlpha = 1;
    }
  }

  stop(): Promise<{ blob: Blob; ext: string }> {
    return new Promise((resolve) => {
      this.recorder.onstop = () =>
        resolve({ blob: new Blob(this.chunks, { type: this.mime }), ext: this.mime.startsWith("video/mp4") ? "mp4" : "webm" });
      setTimeout(() => this.recorder.stop(), 150); // let the last frames reach the encoder
    });
  }
}
