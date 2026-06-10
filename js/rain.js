/* ═══ 实验舱 04 · 诗境雨幕：在数据雨中打捞一句古诗 ═══ */
(() => {
  const VERSES = [
    { text: '星垂平野阔，月涌大江流', author: '杜甫 · 旅夜书怀' },
    { text: '海上生明月，天涯共此时', author: '张九龄 · 望月怀远' },
    { text: '大漠孤烟直，长河落日圆', author: '王维 · 使至塞上' },
    { text: '野旷天低树，江清月近人', author: '孟浩然 · 宿建德江' },
    { text: '我寄愁心与明月，随君直到夜郎西', author: '李白 · 闻王昌龄左迁' },
  ];
  // 干扰字符池：常用字 + 部首，营造"数据雨"质感
  const NOISE = '的一是了我不人在他有这上们来到时大地为子中你说生国年着就那和要她出也得里后自以会家可下而过天去能对小多然于心学么之都好看起发当没成只如事把还用第样道想作种开美总从无情己面最女但现前些所同日手又行意动方期它头经长儿回位分爱老因很给名法间斯知世什两次使身者被高已亲其进此话常与活正感';

  const canvas = document.getElementById('rainCanvas');
  const ctx = canvas.getContext('2d');
  const slotsEl = document.getElementById('verseSlots');
  const authorEl = document.getElementById('verseAuthor');
  const bloomEl = document.getElementById('rainBloom');
  const bloomVerse = document.getElementById('bloomVerse');
  const bloomAuthor = document.getElementById('bloomAuthor');
  const scoreEl = document.getElementById('rainScore');

  let verseIdx = 0;
  let slots = [];        // { ch, filled, el, punct }
  let drops = [];        // { x, y, ch, speed, needed, size }
  let speedMul = 1;
  let totalCaught = 0;
  let pops = [];         // 点击反馈特效
  let running = true;

  function resize() {
    const r = canvas.getBoundingClientRect();
    canvas.width = r.width * devicePixelRatio;
    canvas.height = r.height * devicePixelRatio;
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  }
  resize();
  addEventListener('resize', resize);

  function loadVerse(i) {
    const v = VERSES[i % VERSES.length];
    slots = [];
    slotsEl.innerHTML = '';
    for (const ch of v.text) {
      const el = document.createElement('div');
      const punct = '，。、！？ '.includes(ch);
      el.className = 'verse-slot' + (punct ? ' punct' : '');
      el.textContent = ch;
      slotsEl.appendChild(el);
      slots.push({ ch, el, punct, filled: punct });
    }
    authorEl.textContent = '—— ' + v.author + ' ——';
    bloomEl.classList.add('hidden');
    drops = [];
    running = true;
  }

  function neededChars() {
    return slots.filter((s) => !s.filled).map((s) => s.ch);
  }

  function spawn() {
    if (!running) return;
    const w = canvas.clientWidth;
    const need = neededChars();
    // 40% 概率掉落目标字，混入干扰字
    const isNeeded = need.length > 0 && Math.random() < 0.4;
    const ch = isNeeded
      ? need[Math.floor(Math.random() * need.length)]
      : NOISE[Math.floor(Math.random() * NOISE.length)];
    drops.push({
      x: 24 + Math.random() * (w - 48),
      y: -30,
      ch,
      speed: 0.8 + Math.random() * 1.4,
      size: 20 + Math.random() * 12,
      phase: Math.random() * Math.PI * 2,
    });
  }
  setInterval(spawn, 240);

  function frame() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    ctx.fillStyle = 'rgba(2, 1, 8, 0.18)';
    ctx.fillRect(0, 0, w, h);

    const needSet = new Set(neededChars());
    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i];
      d.y += d.speed * speedMul;
      d.x += Math.sin(d.y * 0.02 + d.phase) * 0.3;
      if (d.y > h + 40) { drops.splice(i, 1); continue; }
      const isTarget = needSet.has(d.ch);
      ctx.font = `${d.size}px "Noto Serif SC", serif`;
      ctx.textAlign = 'center';
      if (isTarget) {
        // 目标字带微光，但不过分显眼——留一点搜寻的乐趣
        ctx.shadowColor = 'rgba(5, 217, 232, .9)';
        ctx.shadowBlur = 12;
        ctx.fillStyle = 'rgba(180, 245, 250, .95)';
      } else {
        ctx.shadowBlur = 0;
        ctx.fillStyle = `rgba(57, 255, 20, ${0.18 + (d.size - 20) / 40})`;
      }
      ctx.fillText(d.ch, d.x, d.y);
    }
    ctx.shadowBlur = 0;

    // 点击反馈光环
    for (let i = pops.length - 1; i >= 0; i--) {
      const p = pops[i];
      p.r += 2.4; p.a -= 0.04;
      if (p.a <= 0) { pops.splice(i, 1); continue; }
      ctx.strokeStyle = `rgba(${p.color}, ${p.a})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.stroke();
    }
    requestAnimationFrame(frame);
  }

  canvas.addEventListener('pointerdown', (e) => {
    if (!running) return;
    const r = canvas.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    // 命中检测：找点击半径 34px 内最近的雨滴
    let best = null, bestD = 34 * 34;
    for (const d of drops) {
      const dx = d.x - x, dy = d.y - y - d.size / 2;
      const dd = dx * dx + dy * dy;
      if (dd < bestD) { bestD = dd; best = d; }
    }
    if (!best) return;
    const slot = slots.find((s) => !s.filled && s.ch === best.ch);
    if (slot) {
      slot.filled = true;
      slot.el.classList.add('filled');
      drops.splice(drops.indexOf(best), 1);
      pops.push({ x: best.x, y: best.y, r: 6, a: 0.9, color: '5,217,232' });
      totalCaught++;
      scoreEl.textContent = `捞起 ${totalCaught} 字`;
      ZAudio.penta(slots.filter((s) => s.filled && !s.punct).length);
      if (slots.every((s) => s.filled)) verseComplete();
    } else {
      pops.push({ x: best.x, y: best.y, r: 6, a: 0.7, color: '255,42,109' });
      ZAudio.fuseFail();
    }
  });

  function verseComplete() {
    running = false;
    const v = VERSES[verseIdx % VERSES.length];
    setTimeout(() => {
      bloomVerse.textContent = v.text;
      bloomAuthor.textContent = '—— ' + v.author + ' ——';
      bloomEl.classList.remove('hidden');
      ZAudio.bloom();
    }, 700);
  }

  document.getElementById('nextVerse').addEventListener('click', () => {
    verseIdx++;
    ZAudio.click();
    loadVerse(verseIdx);
  });

  document.querySelectorAll('.chip.speed').forEach((b) =>
    b.addEventListener('click', () => {
      speedMul = parseFloat(b.dataset.speed);
      ZAudio.click();
      document.querySelectorAll('.chip.speed').forEach((x) => x.classList.toggle('active', x === b));
    }));

  loadVerse(0);
  frame();
})();
