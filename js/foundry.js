/* ═══ 实验舱 01 · 粒子铸字：把汉字采样为可扰动的粒子场 ═══ */
(() => {
  const canvas = document.getElementById('foundryCanvas');
  const ctx = canvas.getContext('2d');
  const countEl = document.getElementById('foundryCount');
  const input = document.getElementById('foundryInput');

  const MODES = {
    neon:     { cycle: true },                       // 沿字形渐变流转
    phosphor: { color: [57, 255, 20] },
    amber:    { color: [255, 176, 0] },
    ember:    { color: [255, 90, 40], flicker: true },
  };
  let mode = 'neon';
  let particles = [];
  let mouse = { x: -9999, y: -9999, down: false };
  let hueShift = 0;

  function resize() {
    const r = canvas.getBoundingClientRect();
    canvas.width = r.width * devicePixelRatio;
    canvas.height = r.height * devicePixelRatio;
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  }
  resize();
  addEventListener('resize', () => { resize(); cast(currentText, true); });

  /* 用离屏画布渲染文字并按网格采样像素，生成粒子家园坐标 */
  let currentText = '龘';
  function sampleGlyph(text) {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    const off = document.createElement('canvas');
    off.width = w; off.height = h;
    const octx = off.getContext('2d', { willReadFrequently: true });
    const fontSize = Math.min(h * 0.72, (w * 0.86) / Math.max(1, text.length));
    octx.font = `900 ${fontSize}px "Noto Serif SC", "Songti SC", serif`;
    octx.textAlign = 'center';
    octx.textBaseline = 'middle';
    octx.fillStyle = '#fff';
    octx.fillText(text, w / 2, h / 2);
    const data = octx.getImageData(0, 0, w, h).data;
    // 根据字形面积自适应采样密度，把粒子数控制在 ~2400 以内
    const homes = [];
    for (let step = 3; step <= 8; step++) {
      homes.length = 0;
      for (let y = 0; y < h; y += step) {
        for (let x = 0; x < w; x += step) {
          if (data[(y * w + x) * 4 + 3] > 128) homes.push([x, y]);
        }
      }
      if (homes.length <= 2400) break;
    }
    return homes;
  }

  function cast(text, silent) {
    text = (text || '').trim().slice(0, 2) || '字';
    currentText = text;
    const homes = sampleGlyph(text);
    if (!silent) ZAudio.cast();
    // 复用已有粒子，多退少补：旧粒子飞往新家园，形成"重铸"效果
    const next = [];
    for (let i = 0; i < homes.length; i++) {
      const [hx, hy] = homes[i];
      const p = particles[i] || {
        x: Math.random() * canvas.clientWidth,
        y: Math.random() * canvas.clientHeight,
        vx: 0, vy: 0,
      };
      p.hx = hx; p.hy = hy;
      p.size = 0.8 + Math.random() * 1.4;
      p.t = i / homes.length;           // 沿字形归一化位置，用于霓虹渐变
      p.jitter = Math.random() * Math.PI * 2;
      next.push(p);
    }
    particles = next;
    countEl.textContent = `PARTICLES: ${particles.length}`;
  }

  function scatter() {
    ZAudio.boom();
    for (const p of particles) {
      const a = Math.random() * Math.PI * 2;
      const f = 6 + Math.random() * 18;
      p.vx += Math.cos(a) * f;
      p.vy += Math.sin(a) * f;
    }
  }

  /* 物理循环：弹簧回家 + 鼠标斥力 + 阻尼 */
  function frame() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    ctx.fillStyle = 'rgba(2, 1, 8, 0.32)';
    ctx.fillRect(0, 0, w, h);
    hueShift += 0.4;
    const m = MODES[mode];

    for (const p of particles) {
      const dx = p.hx - p.x, dy = p.hy - p.y;
      p.vx += dx * 0.012;
      p.vy += dy * 0.012;
      const mdx = p.x - mouse.x, mdy = p.y - mouse.y;
      const md2 = mdx * mdx + mdy * mdy;
      const R = mouse.down ? 140 : 90;
      if (md2 < R * R && md2 > 0.01) {
        const md = Math.sqrt(md2);
        const f = ((R - md) / R) * (mouse.down ? 3.2 : 1.6);
        p.vx += (mdx / md) * f;
        p.vy += (mdy / md) * f;
      }
      p.vx *= 0.88;
      p.vy *= 0.88;
      p.x += p.vx;
      p.y += p.vy;

      let r, g, b, alpha = 0.92;
      if (m.cycle) {
        const hue = (p.t * 240 + hueShift) % 360;
        [r, g, b] = hsl2rgb(hue, 95, 62);
      } else {
        [r, g, b] = m.color;
        if (m.flicker) alpha = 0.4 + 0.6 * Math.abs(Math.sin(hueShift * 0.08 + p.jitter));
      }
      ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
      const speed2 = p.vx * p.vx + p.vy * p.vy;
      const s = p.size + Math.min(2.4, speed2 * 0.012); // 高速粒子更亮更大
      ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
    }
    requestAnimationFrame(frame);
  }

  function hsl2rgb(h, s, l) {
    s /= 100; l /= 100;
    const k = (n) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return [255 * f(0), 255 * f(8), 255 * f(4)].map(Math.round);
  }

  /* 指针交互（兼容触屏）*/
  function setMouse(e) {
    const r = canvas.getBoundingClientRect();
    const pt = e.touches ? e.touches[0] : e;
    mouse.x = pt.clientX - r.left;
    mouse.y = pt.clientY - r.top;
  }
  canvas.addEventListener('pointermove', setMouse);
  canvas.addEventListener('pointerdown', (e) => { mouse.down = true; setMouse(e); });
  addEventListener('pointerup', () => { mouse.down = false; });
  canvas.addEventListener('pointerleave', () => { mouse.x = -9999; mouse.y = -9999; });
  canvas.addEventListener('touchmove', (e) => { e.preventDefault(); setMouse(e); }, { passive: false });

  /* 控件 */
  document.getElementById('foundryCast').addEventListener('click', () => cast(input.value));
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') cast(input.value); });
  document.getElementById('foundryScatter').addEventListener('click', scatter);
  document.querySelectorAll('[data-cast]').forEach((b) =>
    b.addEventListener('click', () => { input.value = b.dataset.cast; cast(b.dataset.cast); }));
  document.querySelectorAll('.chip.mode').forEach((b) =>
    b.addEventListener('click', () => {
      mode = b.dataset.mode;
      ZAudio.click();
      document.querySelectorAll('.chip.mode').forEach((x) => x.classList.toggle('active', x === b));
    }));

  /* 等字体加载后铸初始字，避免采样到回退字体 */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => cast(currentText, true));
  }
  cast(currentText, true);
  frame();
})();
