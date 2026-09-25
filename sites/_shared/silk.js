/*
  Silk: animated fabric-fold backgrounds drawn with WebGL.

  <canvas data-silk="crimson" data-seed="2" data-scale="1.4" data-angle="-0.5"></canvas>

  Palettes: crimson (dark red), ember (red to amber), bronze (brown/amber waves),
  graphite (black/silver ridges), iris (dark with blue/orange sheen).
  Or pass your own: data-colors="#0a0000,#5c0808,#c8332a,#ffc0a0" (shadow, body, lit, sheen).

  Other knobs: data-waves (number of folds, 2 = broad silk, 8+ = tight ridges),
  data-scale (zoom), data-angle (radians), data-seed (variation), data-speed (default 0.12),
  data-relief (fold depth, default 0.42; lower it to ~0.1 for tight ridges so they stay lit).
  Falls back to the parent's CSS background when WebGL isn't available.
*/
(() => {
  const PALETTES = {
    //        shadow            body               lit                sheen
    crimson: [[0.03, 0.0, 0.0], [0.36, 0.03, 0.03], [0.78, 0.2, 0.15], [1.0, 0.72, 0.6]],
    ember: [[0.03, 0.01, 0.0], [0.42, 0.08, 0.03], [0.86, 0.36, 0.12], [1.0, 0.82, 0.55]],
    bronze: [[0.02, 0.012, 0.008], [0.26, 0.12, 0.06], [0.72, 0.42, 0.24], [1.0, 0.84, 0.66]],
    graphite: [[0.004, 0.004, 0.005], [0.08, 0.08, 0.09], [0.42, 0.42, 0.45], [0.92, 0.93, 0.96]],
    iris: [[0.01, 0.01, 0.015], [0.1, 0.12, 0.2], [0.35, 0.5, 0.85], [1.0, 0.72, 0.42]],
  };

  const VERT = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  const FRAG = `
precision highp float;
uniform vec2 r;
uniform float t, seed, scale, angle, waves, relief;
uniform vec3 c0, c1, c2, c3;

float h(vec2 p) {
  float ca = cos(angle), sa = sin(angle);
  p = mat2(ca, -sa, sa, ca) * p;
  float tt = t + seed * 7.13;
  vec2 q = p;
  q.x += 0.42 * sin(q.y * 1.35 + tt * 0.9);
  q.y += 0.22 * sin(q.x * 1.1 - tt * 0.7);
  float a = q.x * waves
          + 1.1 * sin(q.y * 0.9 + tt * 0.5)
          + 0.45 * sin(q.x * 0.7 + q.y * 1.6 - tt * 0.4);
  return sin(a) + 0.35 * sin(a * 0.5 + q.y * 0.7 + tt * 0.6);
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * r) / r.y * scale;
  float e = 0.002 * scale;
  float hc = h(uv);
  vec2 g = vec2(h(uv + vec2(e, 0.)) - hc, h(uv + vec2(0., e)) - hc) / e;
  vec3 n = normalize(vec3(-g * relief, 1.0));
  vec3 L = normalize(vec3(-0.6, 0.7, 0.45));
  float diff = clamp(dot(n, L), 0., 1.);
  float spec = pow(clamp(dot(reflect(-L, n), vec3(0., 0., 1.)), 0., 1.), 28.);
  float amb = smoothstep(-1.35, 1.35, hc);

  float lum = (diff * 0.9 + 0.1) * mix(0.3, 1.0, amb);
  vec3 col = mix(c0, c1, smoothstep(0.08, 0.5, lum));
  col = mix(col, c2, smoothstep(0.5, 0.95, lum));
  col += c3 * spec * (0.35 + 0.65 * amb);

  vec2 v = gl_FragCoord.xy / r - 0.5;
  col *= 1.0 - dot(v, v) * 0.55;
  gl_FragColor = vec4(col, 1.);
}`;

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Inside a preview iframe (e.g. the templates index) run at a lower frame rate.
  const embedded = window.self !== window.top;
  const MAX_DPR = embedded ? 1 : 1.25;
  const items = [];

  // One WebGL context for the whole page, drawn into each canvas with drawImage.
  // Browsers cap live WebGL contexts (~16), so a context per canvas breaks pages
  // with many visuals, and the index page that previews every site at once.
  let gl, glc, uni;

  function initGL() {
    glc = document.createElement('canvas');
    gl = glc.getContext('webgl', { antialias: false, premultipliedAlpha: false, preserveDrawingBuffer: true });
    if (!gl) return false;
    const sh = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return false;
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    uni = {};
    ['r', 't', 'seed', 'scale', 'angle', 'waves', 'relief', 'c0', 'c1', 'c2', 'c3'].forEach(
      (n) => (uni[n] = gl.getUniformLocation(prog, n))
    );
    return true;
  }

  function setup(canvas) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const d = canvas.dataset;
    const hex = (h) => [1, 3, 5].map((i) => parseInt(h.trim().slice(i, i + 2), 16) / 255);
    items.push({
      canvas,
      ctx,
      pal: d.colors ? d.colors.split(',').map(hex) : PALETTES[d.silk] || PALETTES.crimson,
      seed: parseFloat(d.seed || '0'),
      scale: parseFloat(d.scale || '1.6'),
      angle: parseFloat(d.angle || '-0.6'),
      waves: parseFloat(d.waves || '3'),
      relief: parseFloat(d.relief || '0.42'),
      speed: parseFloat(d.speed || '0.12'),
      visible: true,
      w: 0,
      h: 0,
    });
    canvas.classList.add('silk-on');
  }

  function draw(it, time) {
    const w = Math.max(1, Math.round(it.canvas.clientWidth * Math.min(window.devicePixelRatio || 1, MAX_DPR)));
    const h = Math.max(1, Math.round(it.canvas.clientHeight * Math.min(window.devicePixelRatio || 1, MAX_DPR)));
    if (w !== it.w || h !== it.h) {
      it.w = it.canvas.width = w;
      it.h = it.canvas.height = h;
    }
    if (glc.width < w) glc.width = w;
    if (glc.height < h) glc.height = h;

    gl.viewport(0, 0, w, h);
    gl.uniform2f(uni.r, w, h);
    gl.uniform1f(uni.t, (time / 1000) * it.speed);
    gl.uniform1f(uni.seed, it.seed);
    gl.uniform1f(uni.scale, it.scale);
    gl.uniform1f(uni.angle, it.angle);
    gl.uniform1f(uni.waves, it.waves);
    gl.uniform1f(uni.relief, it.relief);
    ['c0', 'c1', 'c2', 'c3'].forEach((k, i) => gl.uniform3fv(uni[k], it.pal[i]));
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    // The viewport sits at the bottom-left of the GL canvas.
    it.ctx.drawImage(glc, 0, glc.height - h, w, h, 0, 0, w, h);
  }

  function init() {
    const canvases = document.querySelectorAll('canvas[data-silk], canvas[data-colors]');
    if (!canvases.length || !initGL()) return;
    canvases.forEach(setup);

    const io = new IntersectionObserver((entries) =>
      entries.forEach((e) => {
        const it = items.find((i) => i.canvas === e.target);
        if (it) it.visible = e.isIntersecting;
      })
    );
    items.forEach((i) => io.observe(i.canvas));

    const t0 = performance.now() - 4000;
    if (reduce) {
      const still = () => items.forEach((i) => draw(i, 4000));
      requestAnimationFrame(still);
      addEventListener('resize', still);
      return;
    }
    const frameGap = embedded ? 1000 / 20 : 0;
    let last = 0;
    const loop = (now) => {
      if (now - last >= frameGap) {
        last = now;
        for (const it of items) if (it.visible) draw(it, now - t0);
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
