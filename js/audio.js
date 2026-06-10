/* ═══ 字宙音效引擎 · WebAudio 合成器（宫商角徵羽 五声音阶）═══ */
const ZAudio = (() => {
  let ctx = null;
  let enabled = false;

  // 宫商角徵羽：C4 D4 E4 G4 A4，外加高八度
  const PENTA = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.26, 784.0, 880.0];

  function ensureCtx() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, { dur = 0.18, type = 'square', vol = 0.06, slide = 0, delay = 0 } = {}) {
    if (!enabled) return;
    const c = ensureCtx();
    if (!c) return;
    const t0 = c.currentTime + delay;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t0 + dur);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  return {
    get enabled() { return enabled; },
    setEnabled(v) { enabled = v; if (v) ensureCtx(); },
    // 界面点击：短促方波
    click() { tone(620, { dur: 0.07, vol: 0.04 }); },
    // 接字成功：随机五声音阶 + 泛音
    penta(i) {
      const f = PENTA[((i % PENTA.length) + PENTA.length) % PENTA.length];
      tone(f, { dur: 0.35, type: 'triangle', vol: 0.09 });
      tone(f * 2, { dur: 0.22, type: 'sine', vol: 0.04 });
    },
    // 熔合成功：上行琶音
    fuseOk() {
      [0, 2, 4, 7].forEach((s, k) => tone(PENTA[s], { dur: 0.3, type: 'triangle', vol: 0.08, delay: k * 0.09 }));
    },
    // 熔合失败：下滑噪声感
    fuseFail() {
      tone(220, { dur: 0.3, type: 'sawtooth', vol: 0.05, slide: -160 });
    },
    // 铸字：低频涌起
    cast() {
      tone(110, { dur: 0.5, type: 'sawtooth', vol: 0.05, slide: 330 });
      tone(523, { dur: 0.25, type: 'sine', vol: 0.04, delay: 0.18 });
    },
    // 引爆
    boom() {
      tone(80, { dur: 0.6, type: 'sawtooth', vol: 0.08, slide: -50 });
    },
    // 开机
    boot() {
      [261.63, 392.0, 523.25, 784.0].forEach((f, k) => tone(f, { dur: 0.4, type: 'square', vol: 0.05, delay: k * 0.13 }));
    },
    // 整句诗完成：绽放和弦
    bloom() {
      [261.63, 329.63, 392.0, 523.25, 659.26].forEach((f, k) =>
        tone(f, { dur: 1.4, type: 'sine', vol: 0.06, delay: k * 0.07 }));
    },
  };
})();
