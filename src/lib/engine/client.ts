export interface AssignOutput {
  perm: Int32Array;
  errSorted: number;
  errFinal: number;
  ms: number;
}

// one worker per consumer, newer jobs make older ones stale
export class Assigner {
  private worker: Worker;
  private id = 0;
  private pending = new Map<number, { resolve: (o: AssignOutput) => void; progress?: (p: number) => void }>();

  constructor() {
    this.worker = new Worker(new URL("./assign.worker.ts", import.meta.url), { type: "module" });
    this.worker.onmessage = (e) => {
      const m = e.data;
      const job = this.pending.get(m.id);
      if (!job) return;
      if (m.type === "progress") job.progress?.(m.p);
      else {
        this.pending.delete(m.id);
        job.resolve(m);
      }
    };
  }

  run(src: Uint8ClampedArray, tgt: Uint8ClampedArray, n: number, seed: number, progress?: (p: number) => void) {
    const id = ++this.id;
    return new Promise<AssignOutput | null>((resolve) => {
      this.pending.set(id, { resolve, progress });
      this.worker.postMessage({ id, src, tgt, n, seed });
    });
  }

  get latest() {
    return this.id;
  }

  dispose() {
    this.worker.terminate();
    this.pending.clear();
  }
}
