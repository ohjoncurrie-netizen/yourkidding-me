"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ── GLSL Shaders ───────────────────────────────────────── */
const VERT = `
attribute vec2 a_position;
attribute vec2 a_texCoord;
varying vec2 v_texCoord;
void main() {
  gl_Position = vec4(a_position, 0, 1);
  v_texCoord = a_texCoord;
}`;

const SHADERS: Record<string, { name: string; frag: string; desc: string }> = {
  original: {
    name: "Original",
    desc: "Unprocessed upload",
    frag: `
precision mediump float;
uniform sampler2D u_image;
varying vec2 v_texCoord;
void main() {
  gl_FragColor = texture2D(u_image, v_texCoord);
}`,
  },
  contrast: {
    name: "Boost Contrast",
    desc: "Gamma + saturation push for clinical clarity",
    frag: `
precision mediump float;
uniform sampler2D u_image;
varying vec2 v_texCoord;
void main() {
  vec4 c = texture2D(u_image, v_texCoord);
  vec3 rgb = (c.rgb - 0.5) * 1.6 + 0.5;
  float luma = dot(rgb, vec3(0.299, 0.587, 0.114));
  rgb = mix(vec3(luma), rgb, 1.4);
  gl_FragColor = vec4(clamp(rgb, 0.0, 1.0), c.a);
}`,
  },
  edge: {
    name: "Edge Detect",
    desc: "Sobel operator — highlights skin texture boundaries",
    frag: `
precision mediump float;
uniform sampler2D u_image;
uniform vec2 u_resolution;
varying vec2 v_texCoord;
void main() {
  vec2 px = 1.0 / u_resolution;
  float tl = dot(texture2D(u_image, v_texCoord + vec2(-px.x,  px.y)).rgb, vec3(0.299,0.587,0.114));
  float tm = dot(texture2D(u_image, v_texCoord + vec2( 0.0,   px.y)).rgb, vec3(0.299,0.587,0.114));
  float tr = dot(texture2D(u_image, v_texCoord + vec2( px.x,  px.y)).rgb, vec3(0.299,0.587,0.114));
  float ml = dot(texture2D(u_image, v_texCoord + vec2(-px.x,  0.0)).rgb, vec3(0.299,0.587,0.114));
  float mr = dot(texture2D(u_image, v_texCoord + vec2( px.x,  0.0)).rgb, vec3(0.299,0.587,0.114));
  float bl = dot(texture2D(u_image, v_texCoord + vec2(-px.x, -px.y)).rgb, vec3(0.299,0.587,0.114));
  float bm = dot(texture2D(u_image, v_texCoord + vec2( 0.0,  -px.y)).rgb, vec3(0.299,0.587,0.114));
  float br = dot(texture2D(u_image, v_texCoord + vec2( px.x, -px.y)).rgb, vec3(0.299,0.587,0.114));
  float sx = -tl - 2.0*ml - bl + tr + 2.0*mr + br;
  float sy = -tl - 2.0*tm - tr + bl + 2.0*bm + br;
  float edge = sqrt(sx*sx + sy*sy);
  gl_FragColor = vec4(vec3(edge), 1.0);
}`,
  },
  redChannel: {
    name: "Inflammation Map",
    desc: "Isolates red channel — reveals vascularity & redness",
    frag: `
precision mediump float;
uniform sampler2D u_image;
varying vec2 v_texCoord;
void main() {
  vec4 c = texture2D(u_image, v_texCoord);
  float r = c.r * 2.0 - (c.g + c.b) * 0.5;
  gl_FragColor = vec4(clamp(r, 0.0, 1.0), 0.0, 0.0, 1.0);
}`,
  },
  vhs: {
    name: "VHS / Glitch",
    desc: "Chromatic aberration + scan-line distortion",
    frag: `
precision mediump float;
uniform sampler2D u_image;
uniform vec2 u_resolution;
varying vec2 v_texCoord;
void main() {
  vec2 uv = v_texCoord;
  float shift = sin(uv.y * 80.0) * 0.003;
  float r = texture2D(u_image, uv + vec2( shift, 0.0)).r;
  float g = texture2D(u_image, uv).g;
  float b = texture2D(u_image, uv + vec2(-shift, 0.0)).b;
  float scan = mod(uv.y * u_resolution.y, 3.0) < 1.5 ? 0.85 : 1.0;
  gl_FragColor = vec4(r, g, b, 1.0) * scan;
}`,
  },
};

/* ── WebGL helpers ──────────────────────────────────────── */
function compileShader(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  return s;
}

function createProgram(gl: WebGLRenderingContext, vert: string, frag: string) {
  const prog = gl.createProgram()!;
  gl.attachShader(prog, compileShader(gl, gl.VERTEX_SHADER, vert));
  gl.attachShader(prog, compileShader(gl, gl.FRAGMENT_SHADER, frag));
  gl.linkProgram(prog);
  return prog;
}

function applyShader(canvas: HTMLCanvasElement, img: HTMLImageElement, fragSrc: string) {
  const gl = canvas.getContext("webgl");
  if (!gl) return;

  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  gl.viewport(0, 0, canvas.width, canvas.height);

  const prog = createProgram(gl, VERT, fragSrc);
  gl.useProgram(prog);

  // Quad
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1,-1, 0,1,  1,-1, 1,1,  -1,1, 0,0,
    -1, 1, 0,0,  1,-1, 1,1,   1,1, 1,0,
  ]), gl.STATIC_DRAW);

  const pos = gl.getAttribLocation(prog, "a_position");
  const tex = gl.getAttribLocation(prog, "a_texCoord");
  gl.enableVertexAttribArray(pos);
  gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 16, 0);
  gl.enableVertexAttribArray(tex);
  gl.vertexAttribPointer(tex, 2, gl.FLOAT, false, 16, 8);

  // Texture
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);

  // Uniforms
  const resLoc = gl.getUniformLocation(prog, "u_resolution");
  if (resLoc) gl.uniform2f(resLoc, canvas.width, canvas.height);
  gl.uniform1i(gl.getUniformLocation(prog, "u_image"), 0);

  gl.drawArrays(gl.TRIANGLES, 0, 6);
}

/* ── Component ──────────────────────────────────────────── */
const PLACEHOLDER = "https://images.unsplash.com/photo-1502767089025-6572583495f9?w=400&q=80";

export default function ZitsSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [activeShader, setActiveShader] = useState("original");
  const [processing, setProcessing] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  const runShader = useCallback((shaderId: string, img: HTMLImageElement) => {
    if (!canvasRef.current) return;
    setProcessing(true);
    setActiveShader(shaderId);
    requestAnimationFrame(() => {
      applyShader(canvasRef.current!, img, SHADERS[shaderId].frag);
      setProcessing(false);
    });
  }, []);

  // Load placeholder on mount
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imgRef.current = img;
      setImageLoaded(true);
      if (canvasRef.current) applyShader(canvasRef.current, img, SHADERS.original.frag);
    };
    img.src = PLACEHOLDER;
    setImageSrc(PLACEHOLDER);
  }, []);

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImageSrc(url);
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setImageLoaded(true);
      setActiveShader("original");
      if (canvasRef.current) applyShader(canvasRef.current, img, SHADERS.original.frag);
    };
    img.src = url;
  }

  return (
    <div className="space-y-4 font-mono text-sm">
      <div className="grid md:grid-cols-2 gap-4">
        {/* Canvas output */}
        <div
          className="relative border rounded-lg overflow-hidden flex items-center justify-center"
          style={{ borderColor: "var(--accent2)", background: "rgba(0,0,0,0.5)", minHeight: 260 }}
        >
          {processing && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/50">
              <span className="text-[10px] tracking-widest" style={{ color: "var(--accent)" }}>
                APPLYING SHADER...
              </span>
            </div>
          )}
          <canvas ref={canvasRef} className="w-full h-auto max-h-72 object-contain" />
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs opacity-30">loading sample image...</span>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="space-y-3">
          {/* Upload */}
          <div>
            <p className="text-[9px] tracking-widest uppercase opacity-30 mb-2">Input</p>
            <label
              className="flex items-center gap-2 border rounded px-3 py-2 cursor-pointer hover:opacity-80 transition-opacity text-xs"
              style={{ borderColor: "var(--accent2)" }}
            >
              <span style={{ color: "var(--accent2)" }}>↑</span>
              <span className="opacity-60">upload image (or use sample)</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            </label>
          </div>

          {/* Shader selector */}
          <div>
            <p className="text-[9px] tracking-widest uppercase opacity-30 mb-2">WebGL Filter</p>
            <div className="space-y-1">
              {Object.entries(SHADERS).map(([id, s]) => (
                <button
                  key={id}
                  onClick={() => imgRef.current && runShader(id, imgRef.current)}
                  disabled={!imageLoaded || processing}
                  className="w-full text-left px-3 py-2 rounded border transition-all"
                  style={{
                    borderColor: activeShader === id ? "var(--accent)" : "var(--accent2)",
                    background: activeShader === id ? "var(--glow)" : "transparent",
                    color: activeShader === id ? "var(--accent)" : "var(--fg)",
                    opacity: imageLoaded ? 1 : 0.4,
                  }}
                >
                  <span className="font-bold text-xs">{s.name}</span>
                  <span className="ml-2 text-[10px] opacity-50">{s.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Active shader code */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeShader}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="border rounded-lg p-3 overflow-x-auto"
          style={{ borderColor: "var(--accent2)", background: "rgba(0,0,0,0.6)" }}
        >
          <p className="text-[9px] tracking-widest uppercase opacity-30 mb-2">
            active glsl fragment shader — {SHADERS[activeShader].name}
          </p>
          <pre className="text-[10px] opacity-60 leading-relaxed whitespace-pre-wrap">
            {SHADERS[activeShader].frag.trim()}
          </pre>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
