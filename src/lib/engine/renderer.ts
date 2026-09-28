import type { Morph } from "./morph";
import { DEFAULT_TRAJ, EASES, type Trajectory } from "./trajectory";

// same motion as reimage/anim.py plus the constructor knobs, per-vertex on the gpu
// keep in sync with pathPoint() in trajectory.ts
const VS = `#version 300 es
in vec2 aStart;
in vec2 aEnd;
in float aRank;
in float aCurl;
in float aRand;
in vec3 aColor;
uniform float uT;
uniform float uSpread;
uniform float uN;
uniform float uPoint;
uniform float uLift;
uniform float uArc;
uniform float uBias;
uniform float uSwirl;
uniform float uBurst;
uniform float uWobble;
uniform int uEase;
uniform float uDepthBias;
uniform float uTNow;
out vec3 vColor;
out float vLift;
out float vNow;

float ease(float p) {
  if (uEase == 1) return p >= 1.0 ? 1.0 : 1.0 - pow(2.0, -10.0 * p);
  if (uEase == 2) return p;
  if (uEase == 3) return 1.0 + 2.70158 * pow(p - 1.0, 3.0) + 1.70158 * pow(p - 1.0, 2.0);
  return p < 0.5 ? 4.0 * p * p * p : 1.0 - pow(-2.0 * p + 2.0, 3.0) / 2.0;
}

void main() {
  float p = clamp((uT - aRank * uSpread) / (1.0 - uSpread), 0.0, 1.0);
  float pNow = (uTNow - aRank * uSpread) / (1.0 - uSpread);
  float e = ease(p);
  float arc = sin(3.14159265 * clamp(e, 0.0, 1.0));
  vec2 d = aEnd - aStart;
  float dir = mix(aCurl, abs(aCurl) * (uBias < 0.0 ? -1.0 : 1.0), abs(uBias));
  vec2 pos = aStart + d * e + vec2(-d.y, d.x) * arc * dir * uArc;

  vec2 c = vec2((uN - 1.0) * 0.5);
  vec2 q = pos - c;
  float a = uSwirl * 6.2831853 * arc;
  q = vec2(q.x * cos(a) - q.y * sin(a), q.x * sin(a) + q.y * cos(a));
  q += q / (length(q) + 1e-3) * uBurst * arc * uN * 0.35 * (0.5 + aRand);
  pos = c + q;
  pos += vec2(sin(e * 19.0 + aRand * 6.283), cos(e * 23.0 + aRand * 9.1)) * uWobble * arc * uN * 0.04;

  vec2 clip = vec2((pos.x + 0.5) / uN * 2.0 - 1.0, 1.0 - (pos.y + 0.5) / uN * 2.0);
  float lift = arc * step(0.01, dot(d, d));
  gl_Position = vec4(clip, 0.5 - 0.49 * lift + uDepthBias, 1.0); // flying ones on top
  gl_PointSize = uPoint; // always one grid cell, growing in flight turns the picture into mush
  vColor = aColor;
  vLift = lift;
  vNow = pNow > 0.0 && pNow < 1.0 ? 1.0 : 0.0; // still flying right now
}`;

const FS = `#version 300 es
precision highp float;
in vec3 vColor;
in float vLift;
in float vNow;
uniform float uGlow;
uniform float uLift;
uniform float uGhost;
out vec4 outColor;
void main() {
  // tails only for particles in the air now, otherwise landed ones would leave a blur on the final frame
  if (uGhost > 0.0 && (vLift < 0.02 || vNow < 0.5)) discard;
  outColor = vec4(vColor * (1.0 + uGlow * vLift * (0.4 + uLift)), uGhost > 0.0 ? uGhost : 1.0); // lift also brightens
}`;

function compile(gl: WebGL2RenderingContext, vs: string, fs: string) {
  const prog = gl.createProgram()!;
  for (const [type, src] of [
    [gl.VERTEX_SHADER, vs],
    [gl.FRAGMENT_SHADER, fs],
  ] as const) {
    const sh = gl.createShader(type)!;
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) ?? "shader error");
    gl.attachShader(prog, sh);
  }
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? "link error");
  return prog;
}

export interface DrawOptions {
  trails?: boolean;
  glow?: number;
  traj?: Trajectory;
}

export class PixelRenderer {
  readonly canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext;
  private prog: WebGLProgram;
  private vao: WebGLVertexArrayObject;
  private buffers: Record<string, WebGLBuffer> = {};
  private u: Record<string, WebGLUniformLocation | null> = {};
  private morph: Morph | null = null;
  private bg: [number, number, number];
  private maxPoint: number;

  constructor(canvas: HTMLCanvasElement, bg: [number, number, number]) {
    this.canvas = canvas;
    this.bg = bg;
    const gl = canvas.getContext("webgl2", { antialias: false, preserveDrawingBuffer: true, alpha: false });
    if (!gl) throw new Error("webgl2 not supported");
    this.gl = gl;
    this.prog = compile(gl, VS, FS);
    this.vao = gl.createVertexArray()!;
    this.maxPoint = (gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE) as Float32Array)[1];
    for (const name of ["uT", "uSpread", "uN", "uPoint", "uLift", "uGlow", "uArc", "uBias", "uSwirl", "uBurst", "uWobble", "uEase", "uGhost", "uDepthBias", "uTNow"]) this.u[name] = gl.getUniformLocation(this.prog, name);

    gl.bindVertexArray(this.vao);
    const attr = (name: string, size: number, type: number, normalized = false) => {
      const buf = gl.createBuffer()!;
      const loc = gl.getAttribLocation(this.prog, name);
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, type, normalized, 0, 0);
      this.buffers[name] = buf;
    };
    attr("aStart", 2, gl.FLOAT);
    attr("aEnd", 2, gl.FLOAT);
    attr("aRank", 1, gl.FLOAT);
    attr("aCurl", 1, gl.FLOAT);
    attr("aRand", 1, gl.FLOAT);
    attr("aColor", 3, gl.UNSIGNED_BYTE, true);
    gl.bindVertexArray(null);
    this.clear();
  }

  setMorph(m: Morph) {
    const gl = this.gl;
    const up = (name: string, data: ArrayBufferView) => {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers[name]);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    };
    up("aStart", m.start);
    up("aEnd", m.end);
    up("aRank", m.rank);
    up("aCurl", m.curl);
    up("aRand", m.rand);
    up("aColor", m.color);
    this.morph = m;
  }

  get current() {
    return this.morph;
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round(this.canvas.clientWidth * dpr);
    const h = Math.round(this.canvas.clientHeight * dpr);
    if (w && h && (this.canvas.width !== w || this.canvas.height !== h)) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
  }

  clear() {
    const gl = this.gl;
    gl.clearColor(this.bg[0], this.bg[1], this.bg[2], 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  }

  draw(t: number, o: DrawOptions = {}) {
    const gl = this.gl;
    const m = this.morph;
    this.resize();
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);

    this.clear();
    if (!m) return;

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.useProgram(this.prog);
    gl.bindVertexArray(this.vao);
    const cell = this.canvas.width / m.n;
    const tr = o.traj ?? DEFAULT_TRAJ;
    gl.uniform1f(this.u.uT, t);
    gl.uniform1f(this.u.uTNow, t);
    gl.uniform1f(this.u.uSpread, Math.min(0.95, tr.spread));
    gl.uniform1f(this.u.uN, m.n);
    gl.uniform1f(this.u.uPoint, Math.min(this.maxPoint / 2, cell + 0.35)); // tiny overlap hides seams
    gl.uniform1f(this.u.uLift, tr.lift);
    gl.uniform1f(this.u.uGlow, o.glow ?? 0.25);
    gl.uniform1f(this.u.uArc, tr.arc);
    gl.uniform1f(this.u.uBias, tr.bias);
    gl.uniform1f(this.u.uSwirl, tr.swirl);
    gl.uniform1f(this.u.uBurst, tr.burst);
    gl.uniform1f(this.u.uWobble, tr.wobble);
    gl.uniform1i(this.u.uEase, EASES.indexOf(tr.ease));
    gl.uniform1f(this.u.uGhost, 0);
    gl.uniform1f(this.u.uDepthBias, 0);
    gl.drawArrays(gl.POINTS, 0, m.count);

    if (o.trails) {
      // tail = the same particles a moment ago, fading out. above the still pixels, below the live ones
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.depthMask(false);
      gl.uniform1f(this.u.uDepthBias, 0.004);
      for (let k = 8; k >= 1; k--) {
        gl.uniform1f(this.u.uT, t - k * 0.026);
        gl.uniform1f(this.u.uGhost, 0.55 * (1 - k / 9));
        gl.drawArrays(gl.POINTS, 0, m.count);
      }
      gl.depthMask(true);
      gl.disable(gl.BLEND);
    }
    gl.bindVertexArray(null);
  }

  // no loseContext here: strict mode remounts and would get a dead context back from the same canvas
  dispose() {
    this.morph = null;
  }
}
