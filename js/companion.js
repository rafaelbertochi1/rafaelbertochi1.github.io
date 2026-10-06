/* Robô companheiro: o robô do topo decola quando a página desce, acompanha
   a rolagem comentando cada seção e, no fim, desafia o visitante para um
   jogo da velha que ele mesmo constrói. */
(function () {
  "use strict";

  const RBF = window.RBF;
  if (!RBF || document.documentElement.classList.contains("direto")) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const EN = document.documentElement.lang === "en";
  const t = (pt, en) => (EN ? en : pt);
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
  buddy.setAttribute("aria-label", t("Desafiar o robô para um jogo da velha", "Challenge the robot to tic-tac-toe"));
  buddy.setAttribute("aria-haspopup", "dialog");
  buddy.innerHTML = '<span class="buddy__fly"><span class="buddy__say" aria-hidden="true"></span><span class="buddy__sprite" aria-hidden="true"></span></span>';
  document.body.appendChild(buddy);
  const buddySprite = buddy.querySelector(".buddy__sprite");
  const buddySay = buddy.querySelector(".buddy__say");

  const panel = document.createElement("div");
  panel.className = "ttt";
  panel.hidden = true;
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", t("Jogo da velha contra o robô", "Tic-tac-toe against the robot"));
  panel.innerHTML = `
    <div class="ttt__head">
      <span>${t("JOGO DA VELHA", "TIC-TAC-TOE")}</span>
      <button type="button" class="ttt__close" aria-label="${t("Fechar jogo", "Close game")}">✕</button>
    </div>
    <p class="ttt__msg" aria-live="polite"></p>
    <div class="ttt__board">
      ${Array.from({ length: 9 }, (_, i) => `<button type="button" class="ttt__cell" data-i="${i}" aria-label="${t("Casa", "Square")} ${i + 1}, ${t("vazia", "empty")}" disabled></button>`).join("")}
      <span class="ttt__builder" aria-hidden="true"></span>
    </div>
    <p class="ttt__score" aria-live="polite"></p>
    <div class="ttt__actions">
      <button type="button" class="ttt__again" hidden>${t("Jogar de novo ▶", "Play again ▶")}</button>
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
  const navEl = document.querySelector(".nav");
  const size = () => buddy.offsetWidth || 52;
  let state = "ground"; // ground | air
  let sprite = "";
  let talking = false;
  let flame = 0;
  let played = false;

  // Posição atual (coordenadas da tela) e o "modo" que define o que ele está fazendo:
  //   perch  = flutuando na lateral          spot = voando até um ponto
  //   stand  = em pé em cima de algo, andando lift/land = decolagem e pouso no chão do topo
  const pos = { x: 0, y: 0 };
  let mode = { kind: "perch" };
  let facing = 1;
  let looping = false;

  function setSprite(name) {
    if (sprite === name) return;
    sprite = name;
    buddySprite.innerHTML = RBF.sprite(name);
  }
  setSprite("robotFly");

  const standing = () => mode.kind === "stand" && mode.landed;

  // Animação do sprite: chamas quando voa, passinhos quando anda em cima de algo
  setInterval(() => {
    if (state === "ground" || reduceMotion || document.hidden) return;
    flame = 1 - flame;
    if (standing()) {
      if (talking) setSprite("robotTalk");
      else setSprite(mode.dir && flame ? "robotWalk" : "robot");
    } else {
      setSprite(talking ? "robotFlyTalk" : flame ? "robotFly" : "robotFly2");
    }
    buddy.classList.toggle("is-standing", standing());
  }, 150);

  function heroAway(on) {
    RBF.heroAway = on;
    if (heroBot) heroBot.classList.toggle("is-away", on);
  }

  function setVisible(on) {
    buddy.classList.toggle("is-on", on);
    buddy.classList.toggle("is-air", on);
  }

  const navH = () => (navEl ? navEl.offsetHeight : 60);
  const clampX = (x) => Math.max(8, Math.min(window.innerWidth - size() - 8, x));
  const clampY = (y) => Math.max(navH() + 10, Math.min(window.innerHeight - size() - 10, y));
  const isMobile = () => window.innerWidth < 720;
  const rand = (a, b) => a + Math.random() * (b - a);

  function perchPoint(t) {
    const s = size();
    const wx = reduceMotion ? 0 : Math.sin(t / 1700) * 8;
    const wy = reduceMotion ? 0 : Math.sin(t / 1100) * 14;
    if (isMobile()) return { x: window.innerWidth - s - 14 + wx * 0.5, y: window.innerHeight - s - 20 + wy * 0.4 };
    return { x: window.innerWidth - s - 30 + wx, y: window.innerHeight * 0.58 + wy };
  }

  function textRect(el) {
    const r = document.createRange();
    r.selectNodeContents(el);
    const rect = r.getBoundingClientRect();
    return rect.width ? rect : el.getBoundingClientRect();
  }

  const onScreen = (r) => r.top > navH() + 30 && r.top < window.innerHeight - 70 && r.width > 0;

  // Em pé em cima de um elemento: os pés encostam na borda de cima
  function standPoint(m) {
    const r = m.rect();
    const s = size();
    return { x: r.left + m.ox, y: r.top - s + 3 };
  }

  function target(t) {
    switch (mode.kind) {
      case "stand": return standPoint(mode);
      case "spot":
      case "lift": return mode.point;
      case "land": {
        const r = heroSprite.getBoundingClientRect();
        return { x: r.left + (r.width - size()) / 2, y: r.top + r.height - size() };
      }
      default: return perchPoint(t);
    }
  }

  let running = false;
  function frame(t) {
    if (state === "ground" || document.hidden) { running = false; return; }

    if (mode.kind === "stand") {
      const r = mode.rect();
      // o que ele pisava saiu da tela: decola e procura outro lugar
      if (!onScreen(r)) { mode = { kind: "perch" }; scheduleRoam(400); }
      else if (mode.landed && mode.dir && !talking) {
        // anda de um lado para o outro em cima do elemento
        mode.ox += mode.dir * (isMobile() ? 0.6 : 0.8);
        const max = Math.max(0, r.width - size());
        if (mode.ox <= 0 || mode.ox >= max) { mode.ox = Math.max(0, Math.min(max, mode.ox)); mode.dir *= -1; }
        facing = mode.dir;
      }
    }

    const tg = target(t);
    let k = mode.kind === "land" ? 0.14 : 0.075;
    if (standing() || reduceMotion) k = 1; // em pé: acompanha o elemento sem atraso
    let dx = (tg.x - pos.x) * k;
    let dy = (tg.y - pos.y) * k;
    const d = Math.hypot(dx, dy);
    if (k < 1 && d > 22) { dx *= 22 / d; dy *= 22 / d; }
    pos.x += dx;
    pos.y += dy;
    if (!standing() && Math.abs(dx) > 0.7) facing = dx > 0 ? 1 : -1;
    buddy.style.transform = `translate(${pos.x.toFixed(1)}px, ${pos.y.toFixed(1)}px)`;
    buddy.classList.toggle("is-left", facing < 0);
    buddy.classList.toggle("say-left", pos.x < window.innerWidth / 2);
    buddy.classList.toggle("say-below", pos.y < navH() + 110);

    const left = Math.hypot(tg.x - pos.x, tg.y - pos.y);
    if (mode.kind === "stand" && !mode.landed && left < 3) mode.landed = true;
    if (mode.kind === "land" && left < 2) return touchdown();
    if (mode.kind === "lift" && left < 8) mode = mode.next;
    requestAnimationFrame(frame);
  }
  function run() {
    if (running || state === "ground") return;
    running = true;
    requestAnimationFrame(frame);
  }
  document.addEventListener("visibilitychange", () => { if (!document.hidden) run(); });

  function takeoff() {
    const s = size();
    const r = heroSprite ? heroSprite.getBoundingClientRect() : null;
    if (r && r.bottom > 0 && r.top < window.innerHeight) {
      pos.x = r.left + (r.width - s) / 2;
      pos.y = r.top + r.height - s;
    } else {
      pos.x = window.innerWidth + 20;
      pos.y = window.innerHeight * 0.3;
    }
    state = "air";
    heroAway(true);
    setVisible(true);
    mode = { kind: "lift", point: { x: clampX(pos.x + 30), y: clampY(pos.y - 120) }, next: { kind: "perch" } };
    run();
    scheduleRoam(1800);
  }

  function land() {
    current = null;
    clearBubble();
    clearTimeout(perchTimer);
    clearTimeout(roamTimer);
    mode = { kind: "land" };
  }

  function touchdown() {
    running = false;
    state = "ground";
    mode = { kind: "perch" };
    setVisible(false);
    heroAway(false);
    clearTimeout(roamTimer);
  }

  function loopTrick() {
    if (looping || reduceMotion) return;
    looping = true;
    buddy.classList.add("is-loop");
    setTimeout(() => { buddy.classList.remove("is-loop"); looping = false; }, 850);
  }

  // Pousa em cima de um elemento (rectFn devolve o retângulo onde ele pisa)
  function standOn(rectFn, opts) {
    const r = rectFn();
    const max = Math.max(0, r.width - size());
    mode = {
      kind: "stand",
      rect: rectFn,
      ox: opts && opts.ox != null ? Math.max(0, Math.min(max, opts.ox)) : rand(0, max),
      dir: opts && opts.still ? 0 : (Math.random() < 0.5 ? -1 : 1),
      landed: false,
    };
  }

  // ---------- Comentários sobre as seções ----------
  const SECTIONS = [
    { id: "missoes", lines: EN
      ? ["These bots I built run in production for real!", "My repositories are on GitHub, take a look!"]
      : ["Esses robôs que eu criei rodam em produção de verdade!", "Meus repositórios estão no GitHub, dá uma olhada!"] },
    { id: "ficha", lines: EN
      ? ["My cousins built my character sheet!", "Click my inventory to see where I used each thing!"]
      : ["Meus primos montaram a minha ficha!", "Clica no meu inventário pra ver onde usei cada coisa!"] },
    { id: "jornada", lines: EN
      ? ["Each save point is a stage of my career.", "From Excel macros to Python bots!"]
      : ["Cada save point é uma fase da minha carreira.", "Do Excel com VBA aos robôs em Python!"] },
    { id: "python", lines: EN
      ? ["Want to learn Python? Start with the calculator!", "Every challenge has an achievement!"]
      : ["Bora aprender Python? Começa pela calculadora!", "Cada desafio tem uma conquista!"] },
    { id: "contato", end: true },
  ].map((sec) => Object.assign(sec, {
    el: document.getElementById(sec.id),
    title: document.querySelector(sec.id === "contato" ? "#contato .continue__title" : `#${sec.id} .section__title`),
    visits: 0,
  }));

  let current = null;
  let pending = null;
  let pendingTimer;
  let endTimer;
  let hopTimer;
  let perchTimer;

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
    bubble(played ? t("Revanche? Eu te desafio para um jogo!", "Rematch? I challenge you to a game!") : t("Eu te desafio para um jogo!", "I challenge you to a game!"), 0);
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

  // Só reage se a pessoa ficar na seção por um instante
  function considerSection() {
    const sec = sectionNow();
    if (sec === current) { pending = null; clearTimeout(pendingTimer); return; }
    if (sec === pending) return;
    pending = sec;
    clearTimeout(pendingTimer);
    pendingTimer = setTimeout(() => {
      if (pending === sectionNow()) comment(pending);
      pending = null;
    }, 650);
  }

  function comment(sec) {
    current = sec;
    clearBubble();
    clearTimeout(perchTimer);
    if (!sec || panelOpen || state !== "air" || mode.kind === "land") return;
    const titleOk = sec.title && onScreen(textRect(sec.title));
    // pousa em cima do título da seção, perto do fim do texto
    if (titleOk) {
      const t = sec.title;
      standOn(() => textRect(t), { ox: textRect(t).width - size() - 10, still: true });
    } else {
      // o título já passou: pousa em outra coisa visível da mesma seção
      const inside = landables().filter((el) => sec.el.contains(el));
      if (inside.length) { const el = inside[0]; standOn(() => el.getBoundingClientRect(), { still: true }); mode.el = el; }
    }
    clearTimeout(roamTimer);
    if (sec.end) {
      bubble(t("Gostou? Me chame para conversarmos!", "Liked it? Reach out and let's talk!"), 0);
      endTimer = setTimeout(() => {
        if (current === sec && !panelOpen) { loopTrick(); challenge(); }
      }, 9000); // a frase "Gostou?..." fica 9 s antes do desafio
      return;
    }
    bubble(sec.lines[sec.visits % sec.lines.length], 4200);
    sec.visits++;
    // depois de comentar, volta a passear
    perchTimer = setTimeout(() => { if (current === sec) scheduleRoam(200); }, 4600);
  }

  // ---------- Vida própria: passeia, pousa nas coisas, faz graça ----------
  const CHIRPS = EN
    ? ["Psst!", "Beep boop!", "I'm watching!", "All good there?", "Scrolling along!"]
    : ["Psiu!", "Bip bop!", "Tô de olho!", "Tudo certo aí?", "Rolando junto!"];
  const PERCHES = [".card", ".section__title", ".subhead", ".sheet", ".save__body", ".trophy", ".vsc", ".qach__item", ".continue", ".quest"];
  let roamTimer;

  function landables() {
    return Array.from(document.querySelectorAll(PERCHES.join(","))).filter((el) => {
      const r = el.getBoundingClientRect();
      return onScreen(r) && r.width > size() + 24;
    });
  }

  function roam() {
    if (state !== "air" || panelOpen || mode.kind === "land" || mode.kind === "lift") return scheduleRoam(1500);
    if (current && current.end) return; // no fim, fica no "CONTINUE?" desafiando
    if (talking) return scheduleRoam(1500);
    const roll = Math.random();
    const places = landables();
    if (places.length && roll < 0.7) {
      // pousa em cima de algo visível (evita repetir o mesmo lugar)
      const options = places.filter((el) => !(mode.kind === "stand" && mode.el === el));
      const el = (options.length ? options : places)[Math.floor(Math.random() * (options.length || places.length))];
      const useText = el.matches(".section__title, .subhead");
      standOn(() => (useText ? textRect(el) : el.getBoundingClientRect()));
      mode.el = el;
      if (Math.random() < 0.3) setTimeout(() => { if (standing()) bubble(CHIRPS[Math.floor(Math.random() * CHIRPS.length)], 1800); }, 1400);
      scheduleRoam(rand(4500, 7500));
    } else if (roll < 0.87) {
      // voa até um ponto qualquer da tela
      mode = { kind: "spot", point: { x: clampX(rand(10, window.innerWidth)), y: clampY(rand(navH() + 40, window.innerHeight - 90)) } };
      if (Math.random() < 0.4) setTimeout(loopTrick, 700);
      scheduleRoam(rand(2200, 3200));
    } else {
      loopTrick();
      if (Math.random() < 0.5) bubble(Math.random() < 0.5 ? "Wheee!" : CHIRPS[Math.floor(Math.random() * CHIRPS.length)], 1500);
      scheduleRoam(rand(2000, 3000));
    }
  }

  function scheduleRoam(ms) {
    clearTimeout(roamTimer);
    if (reduceMotion) return;
    roamTimer = setTimeout(roam, ms);
  }

  // Decola quando o "chão" do robô do topo chega na parte de cima da tela
  // (assim dá para vê-lo andando antes) e pousa quando o chão volta para baixo.
  const heroStage = document.getElementById("stage");
  function groundTop() {
    return heroStage ? heroStage.getBoundingClientRect().top / window.innerHeight : (window.scrollY > 60 ? -1 : 1);
  }

  function check() {
    const g = groundTop();
    if (state === "ground") { if (g < 0.35) { takeoff(); considerSection(); } return; }
    if (g > 0.5 && !panelOpen) { if (mode.kind !== "land") land(); return; }
    if (mode.kind === "land") { mode = { kind: "perch" }; scheduleRoam(800); }
    considerSection();
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

  // Provocações quando o robô vence (não repete até usar todas)
  const TAUNTS = EN ? [
    "I won! Want a rematch?",
    "GG! Beep boop, I win.",
    "Robot 1, human 0.",
    "I trained for this in Python!",
    "Didn't even need the full minimax.",
    "Easy, easy. One more?",
    "My code has no bugs. Not today.",
    "Gonna tell my cousins!",
    "I calculated everything. Or was it luck?",
    "Robot wins! Try again?",
  ] : [
    "Ganhei! Quer revanche?",
    "GG! Bip bop, venci.",
    "Robô 1, humano 0.",
    "Treinei isso no Python!",
    "Nem precisei do minimax inteiro.",
    "Fácil, fácil. Mais uma?",
    "Meu código não tem bug. Hoje não.",
    "Vou contar pros meus primos!",
    "Calculei tudo. Ou foi sorte?",
    "Vitória do robô! Tenta de novo?",
  ];
  let tauntBag = [];
  function nextTaunt() {
    if (!tauntBag.length) tauntBag = TAUNTS.slice().sort(() => Math.random() - 0.5);
    return tauntBag.pop();
  }

  function renderScore() {
    scoreEl.textContent = EN
      ? `YOU ${score.voce}  ·  DRAWS ${score.velha}  ·  ROBOT ${score.robo}`
      : `VOCÊ ${score.voce}  ·  VELHA ${score.velha}  ·  ROBÔ ${score.robo}`;
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
    // Se dá para ganhar agora, ganha sempre (robô que deixa passar parece bobo)
    for (const i of empty) {
      board[i] = "O";
      const wins = winnerOf(board)?.who === "O";
      board[i] = null;
      if (wins) return i;
    }
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
    c.setAttribute("aria-label", `${t("Casa", "Square")} ${i + 1}, ${board[i] === "X" ? t("X (você)", "X (you)") : board[i] === "O" ? t("O (robô)", "O (robot)") : t("vazia", "empty")}`);
  }

  function lock(on) {
    cells.forEach((c, i) => { c.disabled = on || !!board[i] || over; });
  }

  function moveBuilder(i) {
    const c = cells[i];
    builder.style.transform = `translate(${c.offsetLeft + c.offsetWidth / 2 - 13}px, ${c.offsetTop - 18}px)`;
  }

  async function buildBoard() {
    say(t("Construindo o tabuleiro...", "Building the board..."));
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
      say(t("Eu começo!", "I go first!"));
      lock(true);
      await robotTurn();
    } else {
      say(t("Você é o X. Sua vez!", "You're X. Your turn!"));
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
    say(pick(EN ? ["Hmm...", "Calculating...", "Let me see...", "Thinking..."] : ["Hmm...", "Calculando...", "Deixa eu ver...", "Pensando..."]));
    await wait(350 + Math.random() * 350);
    if (my !== game || over) return;
    const i = robotChoice();
    board[i] = "O";
    // voa até a casa escolhida...
    builder.innerHTML = RBF.sprite("robotFly");
    builder.classList.add("is-on");
    moveBuilder(i);
    say(t("Minha vez!", "My turn!"));
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
      say(t("Sua vez!", "Your turn!"));
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
      say(nextTaunt());
    } else if (w.who === "X") {
      score.voce++;
      streak = streak < 0 ? streak - 1 : -1;
      say(pick(EN ? ["You won! Bug in my code...", "Your win! I'll review my logic.", "I lost! Well played."] : ["Você venceu! Bug no meu código...", "Vitória sua! Vou revisar minha lógica.", "Perdi! Bem jogado."]));
      if (!score.venceu) {
        score.venceu = true;
        if (RBF.achievement) RBF.achievement("ttt", t("Você venceu o robô no jogo da velha", "You beat the robot at tic-tac-toe"), t("Conquista desbloqueada!", "Achievement unlocked!"));
        else RBF.toast(t("Conquista: você venceu o robô!", "Achievement: you beat the robot!"));
      }
    } else {
      score.velha++;
      streak = 0;
      say(pick(EN ? ["It's a draw!", "Draw! Nobody won.", "A fair tie!"] : ["Deu velha! Empate.", "Velha! Ninguém ganhou.", "Empate justo!"]));
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
    clearTimeout(perchTimer);
    clearTimeout(roamTimer);
    mode = { kind: "spot", point: { x: window.innerWidth - size() - 20, y: window.innerHeight - size() - 18 } };
    run();
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
    mode = { kind: "perch" };
    scheduleRoam(2600);
    if (played && state === "air") {
      bubble(pick(EN ? ["Come back anytime!", "See you next time!", "That was fun!"] : ["Volta quando quiser!", "Até a próxima!", "Foi divertido!"]), 2200);
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
