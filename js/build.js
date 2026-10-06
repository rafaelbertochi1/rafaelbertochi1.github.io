/* Ficha do personagem montada por robozinhos.
   O conteúdo está no HTML desde o início; aqui só escondemos as peças
   e uma equipe de robôs "encaixa" cada uma no lugar (~5 s, toda vez que a página abre). */
(function () {
  "use strict";

  const RBF = window.RBF;
  const sheet = document.querySelector("#ficha .sheet");
  if (!RBF || !sheet || !("IntersectionObserver" in window)) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const EN = document.documentElement.lang === "en";
  const t = (pt, en) => (EN ? en : pt);
  if (reduceMotion || document.documentElement.classList.contains("direto")) return;

  const ROBOTS = 5;
  const SPEED = 640;      // px por segundo
  const DEADLINE = 6200;  // garante que tudo termina por volta de 5–6 s

  const q = (sel) => Array.from(sheet.querySelectorAll(sel));
  const chunk = (arr, n) => arr.reduce((acc, el, i) => { if (i % n === 0) acc.push([]); acc[acc.length - 1].push(el); return acc; }, []);

  const JOBS = [
    { els: q(".portrait"), color: "#5ce1e6", say: t("instalando retrato...", "installing portrait...") },
    ...q(".idlist > div").map((el, i) => ({ els: [el], color: "#ffcc4d", say: i === 0 ? t("jogador: Rafael", "player: Rafael") : null })),
    ...q(".sheet__bio p").map((el, i) => ({ els: [el], color: "#e6edf3", say: i === 0 ? t("escrevendo a bio...", "writing the bio...") : null })),
    ...q(".stats li").map((el, i) => ({
      els: [el], color: "#5ce1e6", stat: true,
      say: i === 0 ? t("instalando Python...", "installing Python...") : i === 1 ? t("atributo SQL: OK", "SQL attribute: OK") : null,
    })),
    ...chunk(q(".inv li"), 4).map((els, i) => ({ els, color: "#ffcc4d", say: i === 0 ? t("carregando inventário...", "loading inventory...") : null })),
    ...q(".move").map((el, i) => ({ els: [el], color: "#7ee787", say: i === 0 ? t("golpe especial: OK!", "special move: OK!") : null })),
  ].filter((j) => j.els.length);

  // Estado inicial: peças em "planta baixa" e barras de atributo vazias
  JOBS.forEach((j) => j.els.forEach((el) => el.setAttribute("data-bpart", "")));
  sheet.classList.add("is-building");
  q(".stats__bar i.on").forEach((i) => { i.classList.remove("on"); i.dataset.on = "1"; });

  let started = false;
  let finished = false;
  let crew;
  let robots = [];
  let nextJob = 0;
  let runId = 0;

  function rel(el) {
    const s = sheet.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    return { x: r.left - s.left, y: r.top - s.top, w: r.width, h: r.height };
  }

  function fillStat(li) {
    li.querySelectorAll(".stats__bar i[data-on]").forEach((cell, k) => {
      setTimeout(() => cell.classList.add("on"), 70 * k);
    });
  }

  function sparks(x, y, color) {
    for (let k = 0; k < 6; k++) {
      const s = document.createElement("span");
      s.className = "spark";
      const ang = (Math.PI * 2 * k) / 6;
      s.style.cssText = `left:${x}px;top:${y}px;--c:${color};--dx:${Math.round(Math.cos(ang) * 22)}px;--dy:${Math.round(Math.sin(ang) * 22)}px`;
      crew.appendChild(s);
      setTimeout(() => s.remove(), 520);
    }
  }

  function place(job, withFx) {
    if (job.done) return;
    job.done = true;
    job.els.forEach((el) => el.classList.add("is-placed"));
    if (job.stat) fillStat(job.els[0]);
    if (withFx) {
      const r = rel(job.els[0]);
      sparks(r.x + Math.min(r.w / 2, 60), r.y + r.h / 2, job.color);
    }
  }

  function makeRobot(i) {
    const el = document.createElement("span");
    el.className = "crew__bot is-empty";
    el.innerHTML = '<span class="crew__box"></span><span class="crew__sprite"></span><span class="crew__say"></span>';
    crew.appendChild(el);
    const w = sheet.clientWidth;
    const h = sheet.clientHeight;
    const fromLeft = i % 2 === 0;
    const bot = {
      el,
      sprite: el.querySelector(".crew__sprite"),
      say: el.querySelector(".crew__say"),
      x: fromLeft ? -30 : w + 4,
      y: Math.min(h - 40, 60 + i * 70),
      frame: 0,
    };
    bot.sprite.innerHTML = RBF.sprite("robot");
    move(bot, 0);
    return bot;
  }

  function move(bot, now) {
    const bob = now ? (Math.floor(now / 110) % 2) * -2 : 0;
    bot.el.style.transform = `translate(${Math.round(bot.x)}px, ${Math.round(bot.y + bob)}px)`;
  }

  function walk(bot, x1, y1) {
    const id = (bot.walkId = (bot.walkId || 0) + 1);
    return new Promise((resolve) => {
      const x0 = bot.x;
      const y0 = bot.y;
      // trajetos longos (ficha comprida no celular) andam mais rápido
      const dur = Math.min(650, Math.max(200, (Math.hypot(x1 - x0, y1 - y0) / SPEED) * 1000));
      const t0 = performance.now();
      let lastSwap = 0;
      bot.el.classList.toggle("is-flip", x1 < x0);
      const step = (now) => {
        if (id !== bot.walkId || (finished && !bot.leaving)) return resolve();
        const k = Math.min(1, (now - t0) / dur);
        bot.x = x0 + (x1 - x0) * k;
        bot.y = y0 + (y1 - y0) * k;
        if (now - lastSwap > 120) {
          bot.frame = 1 - bot.frame;
          bot.sprite.innerHTML = RBF.sprite(bot.frame ? "robotWalk" : "robot");
          lastSwap = now;
        }
        move(bot, now);
        if (k < 1) requestAnimationFrame(step);
        else resolve();
      };
      requestAnimationFrame(step);
    });
  }

  function talk(bot, text) {
    if (!text) return;
    bot.say.textContent = text;
    // mantém o balão dentro da ficha
    const w = sheet.clientWidth;
    bot.say.classList.toggle("is-left", bot.x < 90);
    bot.say.classList.toggle("is-right", bot.x > w - 110);
    bot.say.classList.add("is-on");
    setTimeout(() => bot.say.classList.remove("is-on"), 1100);
  }

  async function worker(bot, delay) {
    await new Promise((r) => setTimeout(r, delay));
    while (!finished && nextJob < JOBS.length) {
      const job = JOBS[nextJob++];
      bot.el.style.setProperty("--c", job.color);
      bot.el.classList.remove("is-empty");
      talk(bot, job.say);
      const r = rel(job.els[0]);
      const tx = r.x + Math.min(r.w / 2, 60) - 13;
      const ty = r.y + r.h / 2 - 13;
      await walk(bot, tx, ty);
      if (finished) break;
      bot.el.classList.add("is-empty");
      place(job, true);
      await new Promise((r2) => setTimeout(r2, 90));
    }
  }

  async function leave(bot) {
    bot.leaving = true;
    bot.el.classList.add("is-empty");
    const w = sheet.clientWidth;
    const outX = bot.x < w / 2 ? -40 : w + 10;
    bot.el.classList.add("is-going");
    await walk(bot, outX, bot.y);
    bot.el.remove();
  }

  function finish(skip) {
    if (finished) return;
    finished = true;
    JOBS.forEach((j) => place(j, false));
    const skipBtn = sheet.querySelector(".crew__skip");
    if (skipBtn) skipBtn.remove();
    let doneOnce = false;
    const done = () => {
      if (doneOnce) return;
      doneOnce = true;
      sheet.classList.remove("is-building");
      if (crew) crew.remove();
    };
    if (skip) return done();
    Promise.all(robots.map(leave)).then(() => setTimeout(done, 200));
    setTimeout(done, 1600); // garantia caso a aba fique em segundo plano
  }

  function start() {
    if (started) return;
    started = true;
    crew = document.createElement("div");
    crew.className = "crew";
    crew.setAttribute("aria-hidden", "true");
    sheet.appendChild(crew);

    const skip = document.createElement("button");
    skip.type = "button";
    skip.className = "crew__skip";
    skip.textContent = t("⏩ Pular montagem", "⏩ Skip building");
    skip.addEventListener("click", () => finish(true));
    sheet.appendChild(skip);

    const id = ++runId; // cada montagem tem seu próprio cronômetro
    robots = Array.from({ length: ROBOTS }, (_, i) => makeRobot(i));
    Promise.all(robots.map((b, i) => worker(b, i * 140))).then(() => { if (id === runId) finish(false); });
    setTimeout(() => { if (id === runId) finish(false); }, DEADLINE);
  }

  const io = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      io.disconnect();
      setTimeout(start, 250);
    }
  }, { threshold: 0, rootMargin: "0px 0px -25% 0px" }); // basta o topo da ficha chegar a 3/4 da tela
  io.observe(sheet);

  // Garantia: se a montagem não começou e a pessoa já passou pela ficha, mostra pronta
  window.addEventListener("scroll", function guard() {
    if (started) return window.removeEventListener("scroll", guard);
    if (sheet.getBoundingClientRect().bottom < 0) {
      window.removeEventListener("scroll", guard);
      started = true;
      finish(true);
    }
  }, { passive: true });
})();
