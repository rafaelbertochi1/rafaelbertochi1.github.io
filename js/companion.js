/* Robô companheiro: o robô do topo decola quando a página desce, acompanha
   a rolagem comentando cada seção e, no fim, desafia o visitante para um
   jogo da velha que ele mesmo constrói. */
(function () {
  "use strict";

  const RBF = window.RBF;
  if (!RBF) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignora */ } },
  };
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const wait = (ms) => new Promise((r) => setTimeout(r, reduceMotion ? 0 : ms));

  // ---------- Sprites das peças ----------
  const MARK = {
    X: RBF.toSVG([
      "XX....XX",
      "XXX..XXX",
      ".XXXXXX.",
      "..XXXX..",
      "..XXXX..",
      ".XXXXXX.",
      "XXX..XXX",
      "XX....XX",
    ], { X: "#ff6b6b" }),
    O: RBF.toSVG([
      "..OOOO..",
      ".OOOOOO.",
      "OOO..OOO",
      "OO....OO",
      "OO....OO",
      "OOO..OOO",
      ".OOOOOO.",
      "..OOOO..",
    ], { O: "#5ce1e6" }),
  };

  // ---------- Elementos ----------
  const buddy = document.createElement("button");
  buddy.type = "button";
  buddy.className = "buddy";
  buddy.setAttribute("aria-label", "Desafiar o robô para um jogo da velha");
  buddy.setAttribute("aria-haspopup", "dialog");
  buddy.innerHTML = '<span class="buddy__fly"><span class="buddy__say" aria-hidden="true"></span><span class="buddy__sprite" aria-hidden="true"></span></span>';
  document.body.appendChild(buddy);
  const buddySprite = buddy.querySelector(".buddy__sprite");
  const buddySay = buddy.querySelector(".buddy__say");

  const panel = document.createElement("div");
  panel.className = "ttt";
  panel.hidden = true;
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "Jogo da velha contra o robô");
  panel.innerHTML = `
    <div class="ttt__head">
      <span>JOGO DA VELHA</span>
      <button type="button" class="ttt__close" aria-label="Fechar jogo">✕</button>
    </div>
    <p class="ttt__msg" aria-live="polite"></p>
    <div class="ttt__board">
      ${Array.from({ length: 9 }, (_, i) => `<button type="button" class="ttt__cell" data-i="${i}" aria-label="Casa ${i + 1}, vazia" disabled></button>`).join("")}
      <span class="ttt__builder" aria-hidden="true"></span>
    </div>
    <p class="ttt__score" aria-live="polite"></p>
    <div class="ttt__actions">
      <button type="button" class="ttt__again" hidden>Jogar de novo ▶</button>
    </div>`;
  document.body.appendChild(panel);

  const msgEl = panel.querySelector(".ttt__msg");
  const boardEl = panel.querySelector(".ttt__board");
  const cells = Array.from(panel.querySelectorAll(".ttt__cell"));
  const builder = panel.querySelector(".ttt__builder");
  const scoreEl = panel.querySelector(".ttt__score");
  const againBtn = panel.querySelector(".ttt__again");
  const closeBtn = panel.querySelector(".ttt__close");

  builder.innerHTML = RBF.sprite("robot");

  // ---------- Voo: o robô do topo decola e vira o companheiro ----------
  const heroBot = document.getElementById("bot");
  const heroSprite = document.getElementById("botSprite");
  const fly = buddy.querySelector(".buddy__fly");
  let state = "ground"; // ground | moving | air
  let sprite = "";
  let talking = false;
  let flame = 0;
  let played = false;

  function setSprite(name) {
    if (sprite === name) return;
    sprite = name;
    buddySprite.innerHTML = RBF.sprite(name);
  }
  setSprite("robotFly");

  // Chamas do jato piscando
  setInterval(() => {
    if (state === "ground" || reduceMotion) return;
    flame = 1 - flame;
    setSprite(talking ? "robotFlyTalk" : flame ? "robotFly" : "robotFly2");
  }, 140);

  function heroAway(on) {
    RBF.heroAway = on;
    if (heroBot) heroBot.classList.toggle("is-away", on);
  }

  function setVisible(on) {
    buddy.classList.toggle("is-on", on);
    buddy.classList.toggle("is-air", on);
  }

  // Leva o robô de um ponto da tela até o canto (ou o caminho inverso), num arco de voo
  function flight(from, reverse, done) {
    const to = buddySprite.getBoundingClientRect();
    const dx = from.left - to.left;
    const dy = from.top - to.top;
    const sc = from.width / to.width || 1;
    const frames = [
      { transform: `translate(${dx}px, ${dy}px) scale(${sc})`, offset: 0 },
      { transform: `translate(${dx}px, ${dy - 50}px) scale(${sc})`, offset: 0.25 },
      { transform: `translate(${dx * 0.35}px, ${Math.min(dy, 0) * 0.35 - 70}px) scale(${(sc + 1) / 2})`, offset: 0.65 },
      { transform: "translate(0px, 0px) scale(1)", offset: 1 },
    ];
    if (reverse) frames.reverse().forEach((f) => { f.offset = 1 - f.offset; });
    const anim = fly.animate(frames, { duration: 1100, easing: "ease-in-out", fill: "both" });
    anim.onfinish = () => { anim.cancel(); done(); };
  }

  function takeoff() {
    state = "moving";
    lag = 0;
    fly.style.transform = "";
    const heroRect = heroSprite ? heroSprite.getBoundingClientRect() : null;
    const from = heroRect && heroRect.bottom > 0
      ? heroRect
      : { left: window.innerWidth + 40, top: -80, width: 52 }; // chegou no meio da página: entra pelo alto
    heroAway(true);
    setVisible(true);
    if (reduceMotion) return arrived();
    flight(from, false, arrived);
  }

  function arrived() {
    state = "air";
    lastScrollY = window.scrollY;
    check();
  }

  function land() {
    state = "moving";
    current = null;
    clearBubble();
    fly.style.transform = "";
    const finish = () => {
      setVisible(false);
      heroAway(false);
      state = "ground";
      check();
    };
    if (reduceMotion || !heroSprite) return finish();
    flight(heroSprite.getBoundingClientRect(), true, finish);
  }

  // Acompanha a rolagem com um leve "atraso", como se estivesse voando atrás de você
  let lastScrollY = window.scrollY;
  let lag = 0;
  function follow() {
    if (state === "air" && !reduceMotion) {
      const y = window.scrollY;
      const v = y - lastScrollY;
      lastScrollY = y;
      lag = Math.max(-36, Math.min(36, lag * 0.86 - v * 0.5));
      fly.style.transform = Math.abs(lag) > 0.3 ? `translateY(${lag.toFixed(1)}px)` : "";
    }
    requestAnimationFrame(follow);
  }
  requestAnimationFrame(follow);

  // ---------- Comentários sobre as seções ----------
  const SECTIONS = [
    { id: "missoes", lines: ["Esses robôs rodam em produção de verdade!", "Os repositórios estão no GitHub, dá uma olhada!"] },
    { id: "ficha", lines: ["Meus primos montaram essa ficha!", "Repara nos atributos do Rafael!"] },
    { id: "jornada", lines: ["Cada save point é uma fase da carreira.", "Do Excel com VBA aos robôs em Python!"] },
    { id: "python", lines: ["Bora aprender Python? Começa pela calculadora!", "Cada desafio tem uma conquista!"] },
    { id: "contato", end: true },
  ].map((sec) => Object.assign(sec, { el: document.getElementById(sec.id), visits: 0 }));

  let current = null;
  let endTimer;
  let hopTimer;

  function bubble(text, ms) {
    clearTimeout(buddySay._t);
    buddySay.textContent = text;
    buddySay.classList.add("is-on");
    talking = true;
    if (ms) buddySay._t = setTimeout(clearBubble, ms);
  }

  function clearBubble() {
    clearTimeout(buddySay._t);
    clearTimeout(endTimer);
    clearInterval(hopTimer);
    buddySay.classList.remove("is-on");
    buddy.classList.remove("is-challenge");
    talking = false;
  }

  function hop() {
    buddy.classList.remove("is-hop");
    void buddy.offsetWidth;
    buddy.classList.add("is-hop");
  }

  function challenge() {
    buddy.classList.add("is-challenge");
    bubble(played ? "Revanche? Eu te desafio!" : "Eu te desafio!", 0);
    hop();
    clearInterval(hopTimer);
    hopTimer = setInterval(hop, 3200);
  }

  function sectionNow() {
    const nearBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
    if (nearBottom) return SECTIONS[SECTIONS.length - 1];
    let found = null;
    for (const sec of SECTIONS) {
      if (sec.el && sec.el.getBoundingClientRect().top <= window.innerHeight * 0.55) found = sec;
    }
    return found;
  }

  function comment() {
    const sec = sectionNow();
    if (sec === current) return;
    current = sec;
    clearBubble();
    if (!sec || panelOpen) return;
    if (sec.end) {
      bubble("Gostou? Chama o Rafael pra conversar!", 0);
      endTimer = setTimeout(() => { if (current === sec && !panelOpen) challenge(); }, 2600);
      return;
    }
    bubble(sec.lines[sec.visits % sec.lines.length], 3800);
    sec.visits++;
  }

  function check() {
    if (state === "moving") return;
    const y = window.scrollY;
    if (state === "ground" && y > 60) return takeoff();
    if (state === "air" && y < 20 && !panelOpen) return land();
    if (state === "air") comment();
  }

  window.addEventListener("scroll", check, { passive: true });
  window.addEventListener("resize", check);
  setTimeout(check, 300);

  // ---------- Jogo ----------
  const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
  let board = Array(9).fill(null);
  let turn = "X";
  let starter = "X";
  let over = true;
  let panelOpen = false;
  let built = false;
  let game = 0;

  const score = Object.assign({ voce: 0, robo: 0, velha: 0, venceu: false }, store.get("rbf-ttt") || {});
  let mistakeRate = 0.25;
  let streak = 0;        // >0 robô vencendo seguido, <0 visitante vencendo seguido
  let semVitoria = 0;    // partidas seguidas sem o visitante vencer

  function renderScore() {
    scoreEl.textContent = `VOCÊ ${score.voce}  ·  VELHA ${score.velha}  ·  ROBÔ ${score.robo}`;
  }

  function winnerOf(b) {
    for (const [a, c, d] of LINES) {
      if (b[a] && b[a] === b[c] && b[a] === b[d]) return { who: b[a], line: [a, c, d] };
    }
    return b.every(Boolean) ? { who: "velha", line: [] } : null;
  }

  // Minimax: robô (O) maximiza, visitante (X) minimiza
  function minimax(b, player, depth) {
    const w = winnerOf(b);
    if (w) return w.who === "O" ? 10 - depth : w.who === "X" ? depth - 10 : 0;
    let best = player === "O" ? -Infinity : Infinity;
    for (let i = 0; i < 9; i++) {
      if (b[i]) continue;
      b[i] = player;
      const s = minimax(b, player === "O" ? "X" : "O", depth + 1);
      b[i] = null;
      best = player === "O" ? Math.max(best, s) : Math.min(best, s);
    }
    return best;
  }

  function robotChoice() {
    const empty = board.map((v, i) => (v ? null : i)).filter((i) => i !== null);
    if (empty.length === 9) return pick([0, 2, 4, 6, 8]); // abertura variada
    if (Math.random() < mistakeRate) return pick(empty);    // erro de propósito
    let bestScore = -Infinity;
    let best = [];
    for (const i of empty) {
      board[i] = "O";
      const s = minimax(board, "X", 1);
      board[i] = null;
      if (s > bestScore) { bestScore = s; best = [i]; } else if (s === bestScore) best.push(i);
    }
    return pick(best);
  }

  function say(text) { msgEl.textContent = text; }

  function paint(i) {
    const c = cells[i];
    c.innerHTML = board[i] ? MARK[board[i]] : "";
    c.classList.toggle("is-x", board[i] === "X");
    c.classList.toggle("is-o", board[i] === "O");
    c.setAttribute("aria-label", `Casa ${i + 1}, ${board[i] === "X" ? "X (você)" : board[i] === "O" ? "O (robô)" : "vazia"}`);
  }

  function lock(on) {
    cells.forEach((c, i) => { c.disabled = on || !!board[i] || over; });
  }

  function moveBuilder(i) {
    const c = cells[i];
    builder.style.transform = `translate(${c.offsetLeft + c.offsetWidth / 2 - 13}px, ${c.offsetTop - 18}px)`;
  }

  async function buildBoard() {
    say("Construindo o tabuleiro...");
    boardEl.classList.add("is-building");
    builder.classList.add("is-on");
    for (const i of [0, 1, 2, 5, 4, 3, 6, 7, 8]) {
      moveBuilder(i);
      builder.innerHTML = RBF.sprite(i % 2 ? "robotWalk" : "robot");
      await wait(150);
      cells[i].classList.add("is-built");
      await wait(40);
    }
    builder.classList.remove("is-on");
    boardEl.classList.remove("is-building");
    built = true;
  }

  async function newGame() {
    board = Array(9).fill(null);
    over = false;
    game++;
    cells.forEach((c, i) => { c.classList.remove("is-win"); paint(i); });
    againBtn.hidden = true;
    boardEl.classList.remove("is-over");
    if (!built) await buildBoard();
    turn = starter;
    starter = starter === "X" ? "O" : "X"; // alterna quem começa
    if (turn === "O") {
      say("Eu começo!");
      lock(true);
      await robotTurn();
    } else {
      say("Você é o X. Sua vez!");
      lock(false);
      const firstFree = cells.find((c) => !c.disabled);
      if (firstFree) firstFree.focus({ preventScroll: true });
    }
  }

  // O robô voa até a casa e desenha o "O" ponto por ponto, em círculo
  const O_ROWS = [
    "..OOOO..",
    ".OOOOOO.",
    "OOO..OOO",
    "OO....OO",
    "OO....OO",
    "OOO..OOO",
    ".OOOOOO.",
    "..OOOO..",
  ];
  function drawO(cell) {
    const pts = [];
    O_ROWS.forEach((row, y) => [...row].forEach((ch, x) => {
      if (ch === "O") pts.push({ x, y, k: (Math.atan2(y - 3.5, x - 3.5) + Math.PI * 2.5) % (Math.PI * 2) });
    }));
    pts.sort((a, b) => a.k - b.k); // começa no topo e segue no sentido horário
    cell.innerHTML = `<svg viewBox="0 0 8 8" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">${
      pts.map((pt) => `<rect x="${pt.x}" y="${pt.y}" width="1.02" height="1.02" fill="#5ce1e6" opacity="0"/>`).join("")
    }</svg>`;
    const rects = cell.querySelectorAll("rect");
    if (reduceMotion) { rects.forEach((r) => r.setAttribute("opacity", "1")); return Promise.resolve(); }
    return new Promise((resolve) => {
      let k = 0;
      const t = setInterval(() => {
        if (k >= rects.length) { clearInterval(t); resolve(); return; }
        rects[k++].setAttribute("opacity", "1");
      }, 18);
    });
  }

  async function robotTurn() {
    const my = game;
    say(pick(["Hmm...", "Calculando...", "Deixa eu ver...", "Pensando..."]));
    await wait(350 + Math.random() * 350);
    if (my !== game || over) return;
    const i = robotChoice();
    board[i] = "O";
    // voa até a casa escolhida...
    builder.innerHTML = RBF.sprite("robotFly");
    builder.classList.add("is-on");
    moveBuilder(i);
    say("Minha vez!");
    await wait(320);
    if (my !== game) return;
    // ...e desenha
    builder.innerHTML = RBF.sprite("robotFlyTalk");
    await drawO(cells[i]);
    await wait(120);
    builder.classList.remove("is-on");
    if (my !== game) return;
    paint(i);
    if (!checkEnd()) {
      turn = "X";
      say("Sua vez!");
      lock(false);
    }
  }

  function playerMove(i) {
    if (over || turn !== "X" || board[i]) return;
    board[i] = "X";
    paint(i);
    if (!checkEnd()) {
      turn = "O";
      lock(true);
      robotTurn();
    }
  }

  function checkEnd() {
    const w = winnerOf(board);
    if (!w) return false;
    over = true;
    lock(true);
    w.line.forEach((i) => cells[i].classList.add("is-win"));
    boardEl.classList.add("is-over");
    if (w.who === "O") {
      score.robo++;
      streak = streak > 0 ? streak + 1 : 1;
      say(pick(["Ganhei! Revanche?", "GG! Dessa vez deu robô.", "Vitória do robô! Tenta de novo?"]));
    } else if (w.who === "X") {
      score.voce++;
      streak = streak < 0 ? streak - 1 : -1;
      say(pick(["Você venceu! Bug no meu código...", "Vitória sua! Vou revisar minha lógica.", "Perdi! Bem jogado."]));
      if (!score.venceu) {
        score.venceu = true;
        if (RBF.achievement) RBF.achievement("ttt", "Você venceu o robô no jogo da velha", "Conquista desbloqueada!");
        else RBF.toast("Conquista: você venceu o robô!");
      }
    } else {
      score.velha++;
      streak = 0;
      say(pick(["Deu velha! Empate.", "Velha! Ninguém ganhou.", "Empate justo!"]));
    }
    // Ajusta a dificuldade para alternar entre vitórias, derrotas e empates:
    // a cada partida sem o visitante vencer, o robô erra mais; depois que ele
    // perde, volta a jogar sério (e mais sério ainda se perder duas seguidas).
    semVitoria = w.who === "X" ? 0 : semVitoria + 1;
    if (streak <= -2) mistakeRate = 0.08;
    else if (w.who === "X") mistakeRate = 0.2;
    else mistakeRate = Math.min(0.75, 0.25 + 0.15 * semVitoria);
    store.set("rbf-ttt", score);
    renderScore();
    played = true;
    againBtn.hidden = false;
    return true;
  }

  // ---------- Abrir / fechar ----------
  function openPanel() {
    if (panelOpen) return;
    panelOpen = true;
    panel.hidden = false;
    buddy.setAttribute("aria-expanded", "true");
    clearBubble();
    renderScore();
    requestAnimationFrame(() => panel.classList.add("is-on"));
    if (over) newGame();
  }

  function closePanel() {
    if (!panelOpen) return;
    panelOpen = false;
    panel.classList.remove("is-on");
    buddy.setAttribute("aria-expanded", "false");
    setTimeout(() => { if (!panelOpen) panel.hidden = true; }, 200);
    buddy.focus({ preventScroll: true });
    current = null; // volta a comentar a seção atual
    if (played && state === "air") {
      bubble(pick(["Volta quando quiser!", "Até a próxima!", "Foi divertido!"]), 2200);
      setTimeout(check, 2300);
    } else {
      check();
    }
  }

  buddy.addEventListener("click", () => (panelOpen ? closePanel() : openPanel()));
  closeBtn.addEventListener("click", closePanel);
  againBtn.addEventListener("click", newGame);
  cells.forEach((c, i) => c.addEventListener("click", () => playerMove(i)));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && panelOpen) closePanel(); });
  document.addEventListener("click", (e) => {
    if (panelOpen && !panel.contains(e.target) && !buddy.contains(e.target)) closePanel();
  });
})();
