/* ═══ 实验舱 03 · 拆字炼金所：汉字加法合成游戏 ═══ */
(() => {
  const BASE = ['木', '日', '月', '女', '子', '田', '力', '火', '人', '口', '鸟', '山', '石', '目', '心', '生'];

  // 配方：键为排序后的两字组合；产物可再次作为原料（链式合成）
  const RECIPES = {
    '木木': { out: '林', lore: '两木并立，是为林。树与树站在一起，就有了庇荫。' },
    '林木': { out: '森', lore: '三木成森。当树多到数不清，汉字干脆让它们挤进一个字里。' },
    '日月': { out: '明', lore: '日月同辉，是为光明。白天最亮的与黑夜最亮的，在一个字里相遇。' },
    '女子': { out: '好', lore: '上古的人认为，有女有子，便是人间最好的事。' },
    '力田': { out: '男', lore: '在田里出力的人。一个字，就是一部农耕史。' },
    '火火': { out: '炎', lore: '火上加火，是为炎。夏天的脾气，就是这么写出来的。' },
    '炎火': { out: '焱', lore: '三火成焱，火花迸射。这个字本身就在燃烧。' },
    '人人': { out: '从', lore: '一人在前，一人随行。"从"字里藏着人类最早的信任。' },
    '人从': { out: '众', lore: '三人为众。人一旦站到三个，就有了力量，也有了江湖。' },
    '口鸟': { out: '鸣', lore: '鸟开口，天下闻。一声鸟鸣被冻结在字形里，三千年未散。' },
    '山石': { out: '岩', lore: '山上之石，是为岩。汉字的地质学，两笔写完。' },
    '日生': { out: '星', lore: '"星"从日从生——古人猜测，星星是太阳生出的孩子。' },
    '木目': { out: '相', lore: '以目观木，是为相。最早的"看见"，是凝视一棵树。' },
    '心相': { out: '想', lore: '相由心生，是为想。把看见的放进心里，就成了思念。' },
    '口口': { out: '吕', lore: '两口相连，是为吕——古人用它记录音律，仿佛两张嘴在合唱。' },
    '口吕': { out: '品', lore: '三口为品。品尝、品评、品格——都从"多张嘴"开始。' },
  };
  const TOTAL = Object.keys(RECIPES).length;

  const grid = document.getElementById('elementGrid');
  const slotA = document.getElementById('slotA');
  const slotB = document.getElementById('slotB');
  const resultEl = document.getElementById('fuseResult');
  const msgEl = document.getElementById('fuseMsg');
  const progressEl = document.getElementById('alchemyProgress');
  const logEl = document.getElementById('discoveryLog');

  const discovered = new Set();
  let pick = { A: null, B: null };

  function chipFor(ch, isNew) {
    const b = document.createElement('button');
    b.className = 'chip' + (isNew ? ' new' : '');
    b.textContent = ch;
    b.addEventListener('click', () => pickGlyph(ch, b));
    return b;
  }

  function pickGlyph(ch, btn) {
    ZAudio.click();
    const slot = pick.A === null ? 'A' : 'B';
    pick[slot] = ch;
    const el = slot === 'A' ? slotA : slotB;
    el.textContent = ch;
    el.classList.add('filled');
    btn.classList.add('picked');
    setTimeout(() => btn.classList.remove('picked'), 500);
    resultEl.innerHTML = '<span class="slot-hint">？</span>';
    resultEl.classList.remove('success');
    if (pick.A !== null && pick.B !== null) {
      msgEl.textContent = '投料完毕，可以熔合 ——';
      msgEl.className = 'fuse-msg';
    }
  }

  function clearSlot(slot) {
    pick[slot] = null;
    const el = slot === 'A' ? slotA : slotB;
    el.innerHTML = `<span class="slot-hint">字符·${slot === 'A' ? '甲' : '乙'}</span>`;
    el.classList.remove('filled');
  }
  slotA.addEventListener('click', () => clearSlot('A'));
  slotB.addEventListener('click', () => clearSlot('B'));

  function fuse() {
    if (pick.A === null || pick.B === null) {
      msgEl.textContent = '熔炉空转中——请先从字符库点选两枚字符。';
      msgEl.className = 'fuse-msg bad';
      ZAudio.fuseFail();
      return;
    }
    const key = [pick.A, pick.B].sort().join('');
    const recipe = RECIPES[key];
    if (!recipe) {
      msgEl.textContent = `「${pick.A}」与「${pick.B}」拒绝融合。炉壁震颤了一下，仿佛在嘲笑你。`;
      msgEl.className = 'fuse-msg bad';
      ZAudio.fuseFail();
      clearSlot('A'); clearSlot('B');
      return;
    }
    resultEl.textContent = recipe.out;
    resultEl.classList.add('success');
    const isNew = !discovered.has(key);
    if (isNew) {
      discovered.add(key);
      progressEl.textContent = `已发现 ${discovered.size} / ${TOTAL}`;
      // 新产物入库，可继续做原料（如 林→森）
      if (![...grid.children].some((c) => c.textContent === recipe.out)) {
        grid.appendChild(chipFor(recipe.out, true));
      }
      if (logEl.querySelector('.log-empty')) logEl.innerHTML = '';
      const item = document.createElement('div');
      item.className = 'log-item';
      item.innerHTML = `<b>${pick.A} ＋ ${pick.B} ＝ ${recipe.out}</b>　${recipe.lore}`;
      logEl.prepend(item);
    }
    msgEl.textContent = isNew
      ? `合成成功！${recipe.lore}`
      : `「${recipe.out}」再次出炉。${recipe.lore}`;
    msgEl.className = 'fuse-msg good';
    ZAudio.fuseOk();
    clearSlot('A'); clearSlot('B');

    if (discovered.size === TOTAL) {
      setTimeout(() => {
        msgEl.textContent = '◆ 全部 16 道配方点亮！仓颉远程发来一枚赞许的爻。你已掌握汉字的加法。◆';
        msgEl.className = 'fuse-msg good';
        ZAudio.bloom();
      }, 1400);
    }
  }
  document.getElementById('fuseBtn').addEventListener('click', fuse);

  BASE.forEach((ch) => grid.appendChild(chipFor(ch, false)));
})();
