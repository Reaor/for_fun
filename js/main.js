/* ═══ 字宙主控：开机引导 / 终端栏 / 背景字符场 / 滚动观测 ═══ */
(() => {
  const $ = (s) => document.querySelector(s);

  /* ── 开机引导序列 ── */
  const BOOT_LINES = [
    { t: 'ZIVERSE BIOS v1.984 · 仓颉核心 (C) 平行历1984', d: 120 },
    { t: '正在唤醒磷光显像管 ............ [ OK ]', d: 260 },
    { t: '检测部首协处理器 ×214 ......... [ OK ]', d: 200 },
    { t: '装载五声音阶合成器 ............ [ OK ]', d: 200 },
    { t: '校准甲骨文天线 → 殷墟 36.12°N . [ OK ]', d: 260 },
    { t: '警告：检测到三千年前的信号残留', d: 320, cls: 'warn' },
    { t: '警告：字符仍然存活，请勿惊扰', d: 320, cls: 'warn' },
    { t: '挂载字宙文件系统 /dev/hanzi ... [ OK ]', d: 200 },
    { t: '', d: 150 },
    { t: '>> 一切文明，始于一个字。', d: 400 },
  ];

  const boot = $('#boot');
  const bootLog = $('#bootLog');
  const bootPrompt = $('#bootPrompt');
  let bootDone = false;

  function typeLines(i) {
    if (i >= BOOT_LINES.length) {
      bootPrompt.classList.remove('hidden');
      return;
    }
    const { t, d, cls } = BOOT_LINES[i];
    const span = document.createElement('span');
    if (cls) span.className = cls;
    span.textContent = t + '\n';
    bootLog.appendChild(span);
    setTimeout(() => typeLines(i + 1), d);
  }
  setTimeout(() => typeLines(0), 350);

  function enterZiverse() {
    if (bootDone) return;
    bootDone = true;
    ZAudio.setEnabled(true);
    updateSoundBtn();
    ZAudio.boot();
    boot.classList.add('off');
    setTimeout(() => boot.remove(), 1100);
    window.removeEventListener('keydown', enterZiverse);
  }
  window.addEventListener('keydown', enterZiverse);
  boot.addEventListener('click', enterZiverse);
  // 防止访客在引导页等太久——8 秒后即使没读完也允许跳过提示出现
  setTimeout(() => { if (!bootDone) bootPrompt.classList.remove('hidden'); }, 8000);

  /* ── 音效开关 ── */
  const soundToggle = $('#soundToggle');
  function updateSoundBtn() {
    soundToggle.textContent = ZAudio.enabled ? '♪ 音效' : '♪ 静音';
    soundToggle.classList.toggle('on', ZAudio.enabled);
  }
  soundToggle.addEventListener('click', () => {
    ZAudio.setEnabled(!ZAudio.enabled);
    updateSoundBtn();
    ZAudio.click();
  });

  /* ── 终端时钟（平行历：年份 +93）── */
  const clock = $('#clock');
  function tick() {
    const n = new Date();
    const p = (x) => String(x).padStart(2, '0');
    clock.textContent = `平行历${n.getFullYear() + 93}·${p(n.getHours())}:${p(n.getMinutes())}:${p(n.getSeconds())}`;
  }
  tick();
  setInterval(tick, 1000);

  /* ── 导航高亮 ── */
  const navLinks = document.querySelectorAll('[data-nav]');
  const sections = [...navLinks].map((a) => $(a.getAttribute('href')));
  const navObs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      navLinks.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  sections.forEach((s) => s && navObs.observe(s));
  navLinks.forEach((a) => a.addEventListener('click', () => ZAudio.click()));

  /* ── 模块滚动浮现 ── */
  const seenObs = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('seen'); });
  }, { threshold: 0.12 });
  document.querySelectorAll('.module').forEach((m) => seenObs.observe(m));

  /* ── 背景漂浮字符场 ── */
  const GLYPH_POOL = '卜爻雷電風雲山川日月水火齊飛龍鳳氣靈夢書詩酒茶劍俠墨硯',
        bg = $('#bgGlyphs'),
        bctx = bg.getContext('2d');
  let drifters = [];

  function resizeBg() {
    bg.width = innerWidth;
    bg.height = innerHeight;
    const n = Math.min(26, Math.floor(innerWidth / 55));
    drifters = Array.from({ length: n }, () => ({
      x: Math.random() * bg.width,
      y: Math.random() * bg.height,
      ch: GLYPH_POOL[Math.floor(Math.random() * GLYPH_POOL.length)],
      size: 14 + Math.random() * 34,
      vy: 0.08 + Math.random() * 0.25,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.004,
      hue: Math.random() < 0.5 ? '5,217,232' : '255,42,109',
      a: 0.04 + Math.random() * 0.08,
    }));
  }
  resizeBg();
  addEventListener('resize', resizeBg);

  (function drawBg() {
    bctx.clearRect(0, 0, bg.width, bg.height);
    for (const d of drifters) {
      d.y -= d.vy;
      d.rot += d.vr;
      if (d.y < -50) { d.y = bg.height + 50; d.x = Math.random() * bg.width; }
      bctx.save();
      bctx.translate(d.x, d.y);
      bctx.rotate(d.rot);
      bctx.font = `${d.size}px "Noto Serif SC", serif`;
      bctx.fillStyle = `rgba(${d.hue},${d.a})`;
      bctx.fillText(d.ch, 0, 0);
      bctx.restore();
    }
    requestAnimationFrame(drawBg);
  })();

  /* ── 彩蛋：连点 LOGO 五次触发故障风暴 ── */
  const heroLogo = $('#heroLogo');
  let taps = 0, tapTimer = null;
  heroLogo.addEventListener('click', () => {
    taps++;
    clearTimeout(tapTimer);
    tapTimer = setTimeout(() => (taps = 0), 1600);
    if (taps >= 5) {
      taps = 0;
      heroLogo.classList.add('storm');
      ZAudio.boom();
      drifters.forEach((d) => { d.vy *= 14; d.a = Math.min(0.5, d.a * 5); });
      setTimeout(() => {
        heroLogo.classList.remove('storm');
        drifters.forEach((d) => { d.vy /= 14; d.a /= 5; });
      }, 2600);
    }
  });

  /* ── 控制台问候 ── */
  console.log(
    '%c字宙 ZIVERSE%c\n你找到了终端的后门。\n第一位读到这行字的人类，请善待每一个汉字。',
    'font-size:28px;color:#05d9e8;text-shadow:0 0 10px #05d9e8;font-family:serif;',
    'color:#8d87a8;font-size:12px;'
  );
})();
