"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Assigner } from "@/lib/engine/client";
import { flatness, rgbaToLab } from "@/lib/engine/color";
import { loadBitmap, toGrid, toSquare } from "@/lib/engine/image";
import { buildMorph, MODES, type Mode } from "@/lib/engine/morph";
import { PixelRenderer } from "@/lib/engine/renderer";
import { DEFAULT_TRAJ, randomTrajectory, type Trajectory } from "@/lib/engine/trajectory";
import { useLang } from "@/lib/i18n";
import { DEMOS, INK } from "@/lib/site";
import { Info } from "./Info";
import { Line, Presence } from "./Reveal";
import { TrajectoryEditor } from "./TrajectoryEditor";

type Slot = "src" | "tgt";
interface Img {
  bmp: ImageBitmap;
  name: string;
  thumb: string;
}
interface Rec {
  recorder: MediaRecorder;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  intro: HTMLCanvasElement;
  start: number;
  w: number;
  h: number;
}

const GRIDS = [64, 96, 128, 160, 192];
const REC = { intro: 0.9, holdStart: 0.6, holdEnd: 1.5 };

async function makeImg(src: string | Blob, name: string): Promise<Img> {
  const bmp = await loadBitmap(src);
  return { bmp, name, thumb: toSquare(bmp, 200).toDataURL("image/jpeg", 0.85) };
}

function pickMime() {
  const types = ["video/mp4;codecs=avc1", "video/mp4", "video/webm;codecs=vp9", "video/webm"];
  return types.find((t) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t));
}

function download(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

export function Playground() {
  const { t } = useLang();
  const section = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const scrub = useRef<HTMLInputElement>(null);
  const renderer = useRef<PixelRenderer | null>(null);
  const assigner = useRef<Assigner | null>(null);

  const [src, setSrc] = useState<Img | null>(null);
  const [tgt, setTgt] = useState<Img | null>(null);
  const [n, setN] = useState(128);
  const [mode, setMode] = useState<Mode>("contrast");
  const [duration, setDuration] = useState(4);
  const [trails, setTrails] = useState(false);
  const [traj, setTraj] = useState<Trajectory>(DEFAULT_TRAJ);
  const [progress, setProgress] = useState<number | null>(0);
  const [stats, setStats] = useState<{ n: number; ms: number; a: number; b: number } | null>(null);
  const [status, setStatus] = useState<{ key: "recording" | "saved" | "no_rec" | "bad_file"; error?: boolean } | null>(null);
  const [playing, setPlaying] = useState(false);
  const [recording, setRecording] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [failed, setFailed] = useState(false);
  const [flat, setFlat] = useState(0);

  const st = useRef({ t: 0, dir: 1, playing: false, seed: 0, duration: 4, trails: false, inView: false, traj: DEFAULT_TRAJ });
  const perm = useRef<Int32Array | null>(null);
  const grid = useRef<Uint8ClampedArray | null>(null);
  const rec = useRef<Rec | null>(null);
  st.current.duration = duration;
  st.current.trails = trails;
  st.current.traj = traj;

  const play = (v: boolean) => {
    st.current.playing = v;
    setPlaying(v);
  };
  const restart = () => {
    st.current.t = -0.2;
    st.current.dir = 1;
    play(true);
  };

  const rebuild = useCallback(
    (m: Mode) => {
      if (!perm.current || !grid.current || !renderer.current) return;
      renderer.current.setMorph(buildMorph({ n: Math.sqrt(perm.current.length), src: grid.current, perm: perm.current, mode: m, seed: st.current.seed }));
      restart();
    },
    [],
  );

  useEffect(() => {
    try {
      renderer.current = new PixelRenderer(canvas.current!, INK);
    } catch (e) {
      console.error(e);
      setFailed(true);
      return;
    }
    assigner.current = new Assigner();
    Promise.all([makeImg("/demo/plasma.png", "plasma"), makeImg("/demo/sunset.png", "sunset")]).then(([a, b]) => {
      setSrc(a);
      setTgt(b);
    });
    // a file dropped anywhere else would make the browser leave the page and open it
    const stop = (e: DragEvent) => e.preventDefault();
    window.addEventListener("dragover", stop);
    window.addEventListener("drop", stop);
    const io = new IntersectionObserver(([e]) => (st.current.inView = e.intersectionRatio > 0.35), { threshold: [0, 0.35, 1] });
    io.observe(section.current!);
    return () => {
      window.removeEventListener("dragover", stop);
      window.removeEventListener("drop", stop);
      io.disconnect();
      assigner.current?.dispose();
      renderer.current?.dispose();
    };
  }, []);

  // heavy part: new images or grid size -> reassign in the worker
  useEffect(() => {
    if (!src || !tgt || !assigner.current) return;
    let stale = false;
    setProgress(0);
    const s = toGrid(src.bmp, n);
    const g = toGrid(tgt.bmp, n);
    setFlat(flatness(rgbaToLab(s)));
    assigner.current.run(s, g, n, 0, (p) => !stale && setProgress(p)).then((r) => {
      if (stale || !r) return;
      perm.current = r.perm;
      grid.current = s;
      setStats({ n, ms: r.ms, a: r.errSorted, b: r.errFinal });
      setProgress(null);
      rebuild(mode);
    });
    return () => {
      stale = true;
    };
    // mode is applied via rebuild, no need to reassign on it
  }, [src, tgt, n, rebuild]);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const s = st.current;
      const r = rec.current;
      if (r) {
        const el = (now - r.start) / 1000;
        const m = el - REC.intro - REC.holdStart;
        if (m > s.duration + REC.holdEnd) stopRecording();
        else s.t = Math.min(1, Math.max(0, m / s.duration));
      } else if (s.playing) {
        s.t += (s.dir * dt) / s.duration;
        if ((s.dir > 0 && s.t >= 1) || (s.dir < 0 && s.t <= 0)) {
          s.t = Math.min(1, Math.max(0, s.t));
          play(false);
        }
      }
      renderer.current?.draw(Math.max(0, s.t), { trails: s.trails, traj: s.traj });
      if (r) compose(r, (now - r.start) / 1000);
      if (scrub.current) scrub.current.value = String(Math.round(Math.max(0, s.t) * 1000));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  function compose(r: Rec, el: number) {
    const { ctx, w, h } = r;
    const side = Math.floor(Math.min(w, h) * 0.92);
    const x = (w - side) / 2;
    const y = (h - side) / 2;
    ctx.fillStyle = "#0e0e10";
    ctx.fillRect(0, 0, w, h);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(canvas.current!, x, y, side, side);
    const a = Math.min(1, Math.max(0, (el / REC.intro - 0.35) / 0.65)); // photo dissolves into the grid
    if (a < 1) {
      ctx.globalAlpha = 1 - a;
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(r.intro, x, y, side, side);
      ctx.globalAlpha = 1;
    }
  }

  function startRecording(w: number, h: number) {
    const mime = pickMime();
    if (!mime) return setStatus({ key: "no_rec", error: true });
    if (!src || progress !== null) return;
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d")!;
    const recorder = new MediaRecorder(c.captureStream(60), { mimeType: mime, videoBitsPerSecond: 16e6 });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    recorder.onstop = () => {
      download(new Blob(chunks, { type: mime }), `reimage_${w}x${h}.${mime.startsWith("video/mp4") ? "mp4" : "webm"}`);
      setStatus({ key: "saved" });
    };
    rec.current = { recorder, canvas: c, ctx, intro: toSquare(src.bmp, 1080), start: performance.now(), w, h };
    st.current.t = 0;
    play(false);
    setRecording(true);
    setStatus({ key: "recording" });
    compose(rec.current, 0);
    recorder.start();
  }

  function stopRecording() {
    const r = rec.current;
    if (!r) return;
    rec.current = null;
    setRecording(false);
    setTimeout(() => r.recorder.stop(), 150);
  }

  function savePng() {
    const c = document.createElement("canvas");
    c.width = c.height = 1080;
    const ctx = c.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(canvas.current!, 0, 0, 1080, 1080);
    c.toBlob((b) => b && download(b, "reimage_frame.png"));
  }

  async function loadFile(slot: Slot, file?: File) {
    if (!file) return;
    try {
      const img = await makeImg(file, file.name.replace(/\.[^.]+$/, ""));
      (slot === "src" ? setSrc : setTgt)(img);
      setStatus(null);
    } catch {
      setStatus({ key: "bad_file", error: true });
    }
  }

  async function loadDemo(slot: Slot, id: string, url: string) {
    const img = await makeImg(url, id);
    (slot === "src" ? setSrc : setTgt)(img);
  }

  const togglePlay = () => {
    const s = st.current;
    if (!s.playing && ((s.dir > 0 && s.t >= 1) || (s.dir < 0 && s.t <= 0))) s.t = s.dir > 0 ? 0 : 1;
    play(!s.playing);
  };
  const reverse = () => {
    st.current.dir *= -1;
    play(true);
  };
  const swap = () => {
    setSrc(tgt);
    setTgt(src);
  };
  // new knobs should be seen right away, so replay from the start
  const pickTraj = (tr: Trajectory) => {
    setTraj(tr);
    if (!st.current.playing) restart();
  };
  const pickMode = (m: Mode) => {
    setMode(m);
    rebuild(m);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (!st.current.inView || rec.current || el.matches("input, textarea")) return;
      // a focused button would also "click" on space, so it'd toggle twice
      if (el.matches("button")) el.blur();
      const k = e.key.toLowerCase();
      if (k === " ") {
        e.preventDefault();
        togglePlay();
      } else if (k === "r" || k === "к") reverse();
      else if (k === "n" || k === "т") pickTraj(randomTrajectory());
      else if (k === "arrowleft" || k === "arrowright") {
        st.current.t = Math.min(1, Math.max(0, st.current.t + (k === "arrowright" ? 0.02 : -0.02)));
        play(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const busy = progress !== null || recording;

  return (
    <section
      id="play"
      ref={section}
      className="play"
      onDragEnter={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        loadFile("src", e.dataTransfer.files[0]);
      }}
    >
      <header className="section-head">
        <span className="mono idx">{t.play_idx}</span>
        <h2 className="section-title">
          <Line>{t.play_title_1}</Line>
          <Line delay={0.08}>
            <em>{t.play_title_2}</em> {t.play_title_3}
          </Line>
        </h2>
      </header>

      <div className="play-grid">
        <div className="play-stage">
          <div className="play-frame">
            {failed ? <p className="mono fail">WebGL2 is not available</p> : <canvas ref={canvas} className="play-canvas" />}
            <Presence show={progress !== null} className="play-overlay">
              <span className="pct">{Math.round((progress ?? 1) * 100)}</span>
              <span className="mono">{t.computing}</span>
            </Presence>
          </div>
          <div className="transport">
            <button className="txt" onClick={togglePlay} disabled={busy}>
              {playing ? t.pause : t.play}
            </button>
            <button className="txt" onClick={reverse} disabled={busy}>
              {t.reverse}
            </button>
            <input
              ref={scrub}
              type="range"
              min={0}
              max={1000}
              defaultValue={0}
              aria-label="time"
              disabled={busy}
              onInput={(e) => {
                st.current.t = +e.currentTarget.value / 1000;
                play(false);
              }}
            />
          </div>
          <p className={`mono status ${status?.error ? "error" : ""}`}>
            {status ? t[status.key] : stats ? t.stats(stats.n, stats.ms, stats.a, stats.b) : " "}
            {!status && stats && <Info text={t.stats_hint} />}
          </p>
          {flat > 0.7 && progress === null && <p className="hint warn">{t.flat_warn(Math.round(flat * 100))}</p>}
        </div>

        <div className="play-controls">
          {(["src", "tgt"] as const).map((slot, i) => {
            const img = slot === "src" ? src : tgt;
            return (
              <label
                key={slot}
                className="slot"
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragging(false);
                  loadFile(slot, e.dataTransfer.files[0]);
                }}
              >
                <span className="mono idx">(0{i + 1})</span>
                {img ? <img src={img.thumb} alt="" /> : <span className="thumb-empty" />}
                <span className="slot-text">
                  <b>
                    {slot === "src" ? t.from : t.into}
                    <Info text={slot === "src" ? t.tips.from : t.tips.into} />
                  </b>
                  <span className="mono">{img?.name ?? "…"} · {t.drop}</span>
                </span>
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  disabled={busy}
                  onChange={(e) => {
                    loadFile(slot, e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
              </label>
            );
          })}

          <div className="block">
            <span className="mono idx">
              {t.presets} <Info text={t.tips.presets} />
            </span>
            <div className="chips">
              {DEMOS.map((d) => (
                <button key={d.id} className={tgt?.name === d.id ? "on" : ""} disabled={busy} onClick={() => loadDemo("tgt", d.id, d.src)}>
                  <img src={d.src} alt="" />
                  <span>{d.id}</span>
                </button>
              ))}
            </div>
            <button className="txt" onClick={swap} disabled={busy}>
              {t.swap} ⇅
            </button>
          </div>

          <div className="block">
            <span className="mono idx">
              (03) {t.grid} <Info text={t.tips.grid} />
            </span>
            <div className="seg">
              {GRIDS.map((g) => (
                <button key={g} className={g === n ? "on" : ""} disabled={busy} onClick={() => setN(g)}>
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div className="block">
            <span className="mono idx">
              (04) {t.order} <Info text={t.tips.order} />
            </span>
            <div className="seg small">
              {MODES.map((m) => (
                <button key={m} className={m === mode ? "on" : ""} disabled={busy} onClick={() => pickMode(m)}>
                  {t.modes[m]}
                </button>
              ))}
            </div>
          </div>

          <div className="block">
            <span className="mono idx">
              (05) {t.traj} <Info text={t.tips.traj} />
            </span>
            <TrajectoryEditor value={traj} onChange={pickTraj} disabled={recording} />
          </div>

          <div className="block row2">
            <label className="field">
              <span className="mono idx">
                (06) {t.duration} <Info text={t.tips.duration} />{" "}
                <b>
                  {duration.toFixed(1)} {t.sec}
                </b>
              </span>
              <input type="range" min={1} max={12} step={0.5} value={duration} onChange={(e) => setDuration(+e.target.value)} />
            </label>
            <div className="field">
              <span className="mono idx">
                (07) {t.trails} <Info text={t.tips.trails} />
              </span>
              <div className="seg small">
                <button className={trails ? "on" : ""} onClick={() => setTrails(true)}>
                  {t.on}
                </button>
                <button className={!trails ? "on" : ""} onClick={() => setTrails(false)}>
                  {t.off}
                </button>
              </div>
            </div>
          </div>

          <div className="block export">
            <span className="mono idx">
              (08) {t.save} <Info text={t.tips.save} />
            </span>
            <button className="big" disabled={busy} onClick={() => startRecording(1080, 1080)}>
              {t.video_sq} <span>↗</span>
            </button>
            <button className="big" disabled={busy} onClick={() => startRecording(1080, 1920)}>
              {t.video_v} <span>↗</span>
            </button>
            <button className="big" disabled={busy} onClick={savePng}>
              {t.frame} <span>↗</span>
            </button>
          </div>
        </div>
      </div>

      <Presence show={dragging} className="drop-veil">
        <span>{t.drop_here}</span>
      </Presence>
    </section>
  );
}
