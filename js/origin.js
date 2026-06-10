/* ═══ 实验舱 02 · 字源回溯：甲骨文 → 篆意 → 今体 的时间机器
   甲骨文与篆书字形为手绘示意重构（stroke 路径，viewBox 0 0 100 100）═══ */
(() => {
  const GLYPHS = [
    {
      ch: '日',
      desc: '一轮圆日，中央一点是太阳的心跳。先民抬头所见，就这样刻进了龟甲。三千年后，这颗太阳仍在每一份日历、每一句"日子"里燃烧。',
      oracle: ['M50 16 A 34 34 0 1 0 50 84 A 34 34 0 1 0 50 16', 'M43 50 L57 50'],
      seal: ['M30 20 Q26 20 26 26 L26 74 Q26 80 32 80 L68 80 Q74 80 74 74 L74 26 Q74 20 68 20 Z', 'M30 50 Q50 46 70 50'],
    },
    {
      ch: '月',
      desc: '一弯残月。月有圆缺，先民偏取其缺——因为残缺最易辨认，也最像思念的形状。后来所有的"明""朝""期"，都借走了这一弯月光。',
      oracle: ['M60 14 C30 28 26 70 56 86 C40 70 40 30 60 14 Z', 'M49 42 L52 58'],
      seal: ['M38 16 C28 42 28 66 38 86', 'M38 16 C58 12 68 20 66 44 C64 68 58 78 46 88', 'M42 42 C50 40 58 41 62 43', 'M40 58 C48 56 56 57 60 59'],
    },
    {
      ch: '山',
      desc: '三峰并立。横亘在甲骨上的，是三千年前某个黄昏的地平线。写下这个字的人早已无名，但他看见的山，今天依然叫"山"。',
      oracle: ['M10 78 L28 40 L42 64 L50 22 L58 64 L72 40 L90 78', 'M10 78 L90 78'],
      seal: ['M50 18 L50 70', 'M30 36 L30 70', 'M70 36 L70 70', 'M22 62 Q20 84 50 84 Q80 84 78 62'],
    },
    {
      ch: '水',
      desc: '中间一道奔流，两侧是飞溅的水花。这是被按了暂停键的河。汉字里凡与液体有关的字，至今仍从这条河里取水——三点水，就是它的支流。',
      oracle: ['M50 10 C40 28 60 42 50 58 C42 72 56 80 50 92', 'M32 24 C27 33 35 37 30 46', 'M30 60 C25 69 33 73 28 82', 'M68 24 C73 33 65 37 70 46', 'M70 60 C75 69 67 73 72 82'],
      seal: ['M50 10 C42 30 58 48 50 68 C44 80 52 86 50 92', 'M34 18 C28 32 38 40 32 54 C28 64 34 68 32 76', 'M66 18 C72 32 62 40 68 54 C72 64 66 68 68 76', 'M20 34 C17 42 23 45 20 52', 'M80 34 C83 42 77 45 80 52'],
    },
    {
      ch: '火',
      desc: '升腾的火舌，左右两点是迸出的火星。这把火从新石器时代一直烧到屏幕里——"灯""热""烧""灿烂"，全是它的余焰。',
      oracle: ['M50 14 C42 36 58 48 50 80', 'M30 42 C25 56 34 62 31 80', 'M70 42 C75 56 66 62 69 80', 'M26 80 C40 88 60 88 74 80'],
      seal: ['M50 12 C40 34 60 50 50 82', 'M32 38 C24 52 36 60 30 82', 'M68 38 C76 52 64 60 70 82', 'M18 56 C14 64 20 68 16 76', 'M82 56 C86 64 80 68 84 76'],
    },
    {
      ch: '木',
      desc: '上为枝桠，下为根须，中间一竖是树干。一棵树把天与地连在了一起。两棵成"林"，三棵成"森"——汉字早在造字时，就懂得了生态学。',
      oracle: ['M50 12 L50 88', 'M50 36 C40 28 34 20 28 10', 'M50 36 C60 28 66 20 72 10', 'M50 58 C40 68 34 76 28 88', 'M50 58 C60 68 66 76 72 88'],
      seal: ['M50 10 L50 90', 'M50 34 C36 30 28 22 24 12', 'M50 34 C64 30 72 22 76 12', 'M50 56 C38 64 30 74 26 88', 'M50 56 C62 64 70 74 74 88'],
    },
  ];

  const oracleSvg = document.getElementById('originOracle');
  const sealSvg = document.getElementById('originSeal');
  const modernEl = document.getElementById('originModern');
  const slider = document.getElementById('originSlider');
  const yearEl = document.getElementById('originYear');
  const stageEl = document.getElementById('originStage');
  const descEl = document.getElementById('originDesc');
  const picker = document.getElementById('originPicker');

  let current = GLYPHS[0];

  function renderPaths(svg, paths) {
    svg.innerHTML = paths.map((d) => `<path d="${d}"/>`).join('');
  }

  function selectGlyph(g, btn) {
    current = g;
    renderPaths(oracleSvg, g.oracle);
    renderPaths(sealSvg, g.seal);
    modernEl.textContent = g.ch;
    descEl.textContent = g.desc;
    picker.querySelectorAll('.chip').forEach((c) => c.classList.toggle('active', c === btn));
    applyTime(+slider.value);
  }

  /* 时间轴：0=甲骨文(前1300) 50=篆意(前220) 100=今体(今年) */
  function applyTime(v) {
    const fade = (center, span) => Math.max(0, 1 - Math.abs(v - center) / span);
    oracleSvg.style.opacity = fade(0, 45);
    sealSvg.style.opacity = fade(50, 32);
    modernEl.style.opacity = fade(100, 45);
    // 临界区轻微错位，制造"信号重组"的故障感
    const drift = Math.sin(v * 0.4) * (v > 5 && v < 95 ? 2 : 0);
    sealSvg.style.transform = `translateX(${drift}px)`;

    let year, stage;
    const NOW = new Date().getFullYear();
    if (v <= 50) {
      year = Math.round(-1300 + (v / 50) * (1300 - 220));
      stage = v < 28 ? '甲骨文 · 刻于龟甲' : '篆意 · 铸于钟鼎';
    } else {
      year = Math.round(-220 + ((v - 50) / 50) * (220 + NOW));
      stage = v < 78 ? '篆意 · 书于竹帛' : '今体 · 显于磷光屏';
    }
    yearEl.textContent = year < 0 ? `公元前 ${-year} 年` : `公元 ${year} 年`;
    stageEl.textContent = stage;
  }

  slider.addEventListener('input', () => applyTime(+slider.value));

  GLYPHS.forEach((g, i) => {
    const b = document.createElement('button');
    b.className = 'chip';
    b.textContent = g.ch;
    b.addEventListener('click', () => { ZAudio.click(); selectGlyph(g, b); });
    picker.appendChild(b);
    if (i === 0) selectGlyph(g, b);
  });

  /* 缓慢自动播放，访客拖动后停止 */
  let auto = setInterval(() => {
    const v = (+slider.value + 0.5) % 101;
    slider.value = v;
    applyTime(v);
  }, 60);
  slider.addEventListener('pointerdown', () => { clearInterval(auto); auto = null; }, { once: true });
})();
