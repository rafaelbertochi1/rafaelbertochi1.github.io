/* Nome do topo montado por robozinhos, bloco por bloco.
   Os blocos saem dos pixels reais da fonte (Press Start 2P é desenhada numa grade 8x8),
   então o que eles montam é exatamente o título. No fim, o texto de verdade aparece
   no lugar dos blocos. Um clique ou uma tecla pula a montagem. */
(function () {
  "use strict";

  const RBF = window.RBF;
  const h1 = document.querySelector(".hero__name");
  const hero = document.querySelector(".hero");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!RBF || !h1 || !hero || reduceMotion || !document.fonts) return;

  h1.classList.add("is-assembling");
  let finished = false;
  let layer;
  const fallback = setTimeout(() => reveal(true), 8000); // nunca deixa o nome escondido

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  function reveal(instant) {
    if (finished) return;
    finished = true;
    clearTimeout(fallback);
    document.removeEventListener("keydown", skip);
    document.removeEventListener("pointerdown", skip);
    window.removeEventListener("resize", skip);
    h1.classList.remove("is-assembling");
    if (!layer) return;
    if (instant) { layer.remove(); return; }
    layer.classList.add("is-done");
    setTimeout(() => layer.remove(), 900);
  }

  function skip() { reveal(true); }

  // Lê a grade de pixels de cada letra do título
  function letters() {
    const F = parseFloat(getComputedStyle(h1).fontSize);
    const b = F / 8;
    const base = hero.getBoundingClientRect();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const out = [];
    const walker = document.createTreeWalker(h1, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      for (let i = 0; i < node.data.length; i++) {
        const ch = node.data[i];
        if (!ch.trim()) continue;
        const range = document.createRange();
        range.setStart(node, i);
        range.setEnd(node, i + 1);
        const r = range.getBoundingClientRect();
        const w = Math.ceil(r.width);
        const h = Math.ceil(r.height);
        canvas.width = w;
        canvas.height = h;
        ctx.clearRect(0, 0, w, h);
        ctx.font = `${F}px "Press Start 2P"`;
        ctx.textBaseline = "alphabetic";
        ctx.fillStyle = "#000";
        const m = ctx.measureText(ch);
        ctx.fillText(ch, 0, m.fontBoundingBoxAscent || F);
        const data = ctx.getImageData(0, 0, w, h).data;
        const blocks = [];
        const rows = Math.floor(h / b);
        for (let gy = 0; gy < rows; gy++) {
          for (let gx = 0; gx < 8; gx++) {
            const px = Math.floor((gx + 0.5) * b);
            const py = Math.floor((gy + 0.5) * b);
            if (px >= w || py >= h) continue;
            if (data[(py * w + px) * 4 + 3] > 110) {
              blocks.push({ x: r.left - base.left + gx * b, y: r.top - base.top + gy * b });
            }
          }
        }
        if (blocks.length) out.push({ blocks, x: r.left - base.left, y: r.top - base.top, w: r.width, b });
      }
    }
    return out;
  }

  function flyTo(bot, x, y) {
    return new Promise((resolve) => {
      const x0 = bot.x;
      const y0 = bot.y;
      const dur = Math.min(450, Math.max(180, Math.hypot(x - x0, y - y0) * 0.9));
      const t0 = performance.now();
      bot.el.classList.toggle("is-left", x < x0);
      const step = (now) => {
        if (finished) return resolve();
        const k = Math.min(1, (now - t0) / dur);
        const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; // acelera e freia
        bot.x = x0 + (x - x0) * e;
        bot.y = y0 + (y - y0) * e;
        bot.el.style.transform = `translate(${bot.x.toFixed(1)}px, ${bot.y.toFixed(1)}px)`;
        if (k < 1) requestAnimationFrame(step);
        else resolve();
      };
      requestAnimationFrame(step);
    });
  }

  async function build() {
    let list;
    try { list = letters(); } catch (e) { return reveal(true); }
    if (!list.length || finished) return reveal(true);

    layer = document.createElement("div");
    layer.className = "namebuild";
    layer.setAttribute("aria-hidden", "true");
    const shadow = document.createElement("div");
    shadow.className = "namebuild__shadow";
    const front = document.createElement("div");
    front.className = "namebuild__front";
    layer.append(shadow, front);
    hero.appendChild(layer);

    document.addEventListener("keydown", skip);
    document.addEventListener("pointerdown", skip);
    window.addEventListener("resize", skip);

    const crewSize = window.innerWidth < 720 ? 4 : 6;
    const botSize = Math.max(22, Math.min(32, list[0].b * 3.4));
    const bots = Array.from({ length: crewSize }, (_, i) => {
      const el = document.createElement("span");
      el.className = "nbot";
      el.style.width = el.style.height = botSize + "px";
      el.innerHTML = RBF.sprite("robotFly");
      layer.appendChild(el);
      const bot = { el, x: (hero.clientWidth / crewSize) * i + 20, y: -70, frame: 0 };
      el.style.transform = `translate(${bot.x}px, ${bot.y}px)`;
      return bot;
    });

    // chamas dos jatos
    const flames = setInterval(() => {
      if (finished) return clearInterval(flames);
      bots.forEach((bot) => { bot.frame = 1 - bot.frame; bot.el.innerHTML = RBF.sprite(bot.frame ? "robotFly" : "robotFly2"); });
    }, 130);

    const queue = list.slice();
    async function worker(bot, delay) {
      await wait(delay);
      while (queue.length && !finished) {
        const letter = queue.shift();
        await flyTo(bot, letter.x + letter.w / 2 - botSize / 2, letter.y - botSize - 4);
        // solta os blocos da letra, de cima para baixo
        for (const blk of letter.blocks) {
          if (finished) return;
          for (const [parent, cls] of [[shadow, "nb nb--sh"], [front, "nb"]]) {
            const d = document.createElement("i");
            d.className = cls;
            d.style.cssText = `left:${blk.x}px;top:${blk.y}px;width:${letter.b + 0.5}px;height:${letter.b + 0.5}px`;
            parent.appendChild(d);
          }
          await wait(9);
        }
      }
      // sai voando para cima
      if (!finished) await flyTo(bot, bot.x + (Math.random() - 0.5) * 120, -90);
    }

    await Promise.all(bots.map((bot, i) => worker(bot, i * 90)));
    clearInterval(flames);
    if (!finished) { await wait(150); reveal(false); }
  }

  function go() {
    document.fonts.load('16px "Press Start 2P"').then(
      () => requestAnimationFrame(() => build()),
      () => reveal(true)
    );
  }

  if (RBF.ready) go();
  else document.addEventListener("rbf:ready", go, { once: true });
})();
