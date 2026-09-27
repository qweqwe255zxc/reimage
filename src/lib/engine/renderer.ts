import type { Morph } from "./morph";

// same motion as reimage/anim.py, but per-vertex on the gpu
const VS = `#version 300 es
in vec2 aStart;
in vec2 aEnd;
in float aDelay;
in float aCurl;
in vec3 aColor;
uniform float uT;
uniform float uSpread;
uniform float uN;
uniform float uPoint;
uniform float uLift;
out vec3 vColor;
out float vLift;

float ease(float p) {
  return p < 0.5 ? 4.0 * p * p * p : 1.0 - pow(-2.0 * p + 2.0, 3.0) / 2.0;
}

void main() {
  float p = clamp((uT - aDelay) / (1.0 - uSpread), 0.0, 1.0);
  float e = ease(p);
  vec2 d = aEnd - aStart;
  float arc = sin(3.14159265 * e);
  vec2 c = aStart + d * e + vec2(-d.y, d.x) * arc * aCurl;
  vec2 clip = vec2((c.x + 0.5) / uN * 2.0 - 1.0, 1.0 - (c.y + 0.5) / uN * 2.0);
  float lift = arc * step(0.01, dot(d, d));
  gl_Position = vec4(clip, 0.5 - 0.49 * lift, 1.0); // flying ones on top
  gl_PointSize = uPoint * (1.0 + uLift * lift);
  vColor = aColor;
  vLift = lift;
}`;

const FS = `#version 300 es
precision highp float;
in vec3 vColor;
in float vLift;
uniform float uGlow;
out vec4 outColor;
void main() {
  outColor = vec4(vColor * (1.0 + uGlow * vLift), 1.0);
}`;

const FADE_VS = `#version 300 es
void main() {
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

const FADE_FS = `#version 300 es
precision highp float;
uniform vec4 uColor;
out vec4 outColor;
void main() { outColor = uColor; }`;

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
  lift?: number;
  glow?: number;
}

export class PixelRenderer {
  readonly canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext;
  private prog: WebGLProgram;
  private fade: WebGLProgram;
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
    this.fade = compile(gl, FADE_VS, FADE_FS);
    this.vao = gl.createVertexArray()!;
    this.maxPoint = (gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE) as Float32Array)[1];
    for (const name of ["uT", "uSpread", "uN", "uPoint", "uLift", "uGlow"]) this.u[name] = gl.getUniformLocation(this.prog, name);
    this.u.uColor = gl.getUniformLocation(this.fade, "uColor");

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
    attr("aDelay", 1, gl.FLOAT);
    attr("aCurl", 1, gl.FLOAT);
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
    up("aDelay", m.delay);
    up("aCurl", m.curl);
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

    if (o.trails) {
      gl.disable(gl.DEPTH_TEST);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(this.fade);
      gl.uniform4f(this.u.uColor, this.bg[0], this.bg[1], this.bg[2], 0.22);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.disable(gl.BLEND);
      gl.clear(gl.DEPTH_BUFFER_BIT);
    } else {
      this.clear();
    }
    if (!m) return;

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.useProgram(this.prog);
    gl.bindVertexArray(this.vao);
    const cell = this.canvas.width / m.n;
    gl.uniform1f(this.u.uT, t);
    gl.uniform1f(this.u.uSpread, m.spread);
    gl.uniform1f(this.u.uN, m.n);
    gl.uniform1f(this.u.uPoint, Math.min(this.maxPoint / 2, cell + 0.35)); // tiny overlap hides seams
    gl.uniform1f(this.u.uLift, o.lift ?? 0.6);
    gl.uniform1f(this.u.uGlow, o.glow ?? 0.25);
    gl.drawArrays(gl.POINTS, 0, m.count);
    gl.bindVertexArray(null);
  }

  // no loseContext here: strict mode remounts and would get a dead context back from the same canvas
  dispose() {
    this.morph = null;
  }
}
