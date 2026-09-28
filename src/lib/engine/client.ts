export interface AssignOutput {
  perm: Int32Array;
  errSorted: number;
  errFinal: number;
  ms: number;
}

interface Job {
  resolve: (o: AssignOutput | null) => void;
  progress?: (p: number) => void;
}

const spawn = () => new Worker(new URL("./assign.worker.ts", import.meta.url), { type: "module" });

// runs the assignment in a worker. `latestOnly` kills whatever is still computing when a new job comes in,
// so clicking through grid sizes doesn't queue up seconds of stale work
export class Assigner {
  private worker: Worker;
  private id = 0;
  private pending = new Map<number, Job>();

  constructor(private latestOnly = false) {
    this.worker = this.boot();
  }

  private boot() {
    const w = spawn();
    w.onmessage = (e) => {
      const m = e.data;
      const job = this.pending.get(m.id);
      if (!job) return;
      if (m.type === "progress") job.progress?.(m.p);
      else {
        this.pending.delete(m.id);
        job.resolve(m);
      }
    };
    return w;
  }

  run(src: Uint8ClampedArray, tgt: Uint8ClampedArray, n: number, seed: number, progress?: (p: number) => void) {
    if (this.latestOnly && this.pending.size) {
      this.worker.terminate();
      for (const job of this.pending.values()) job.resolve(null);
      this.pending.clear();
      this.worker = this.boot();
    }
    const id = ++this.id;
    return new Promise<AssignOutput | null>((resolve) => {
      this.pending.set(id, { resolve, progress });
      this.worker.postMessage({ id, src, tgt, n, seed });
    });
  }

  dispose() {
    this.worker.terminate();
    for (const job of this.pending.values()) job.resolve(null);
    this.pending.clear();
  }
}
