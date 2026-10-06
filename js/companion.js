/* Robô companheiro: acompanha a rolagem no canto da tela e desafia
   o visitante para um jogo da velha que ele mesmo constrói. */
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
  buddy.innerHTML = '<span class="buddy__say" aria-hidden="true"></span><span class="buddy__sprite" aria-hidden="true"></span>';
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

  // ---------- Robô que acompanha a rolagem ----------
  let visible = false;
  let frame = 0;
  let walkTimer = null;
  let lastY = window.scrollY;
  let sprite = "";

  function setSprite(name) {
    if (sprite === name) return;
    sprite = name;
    buddySprite.innerHTML = RBF.sprite(name);
  }
  setSprite("robot");

  function show(on) {
    if (visible === on) return;
    visible = on;
    buddy.classList.toggle("is-on", on);
    if (on) scheduleCall(2500);
  }

  // Só aparece quando o robô do topo saiu da tela
  const stage = document.getElementById("stage");
  function checkStage() {
    if (!stage) return show(true);
    const r = stage.getBoundingClientRect();
    show(r.bottom < 0 || r.top > window.innerHeight || panelOpen);
  }
  window.addEventListener("scroll", checkStage, { passive: true });
  window.addEventListener("resize", checkStage);
  setTimeout(checkStage, 0);

  // "Anda" enquanto a página rola
  window.addEventListener("scroll", () => {
    if (!visible || reduceMotion || panelOpen) return;
    const y = window.scrollY;
    buddy.classList.toggle("is-up", y < lastY);
    lastY = y;
    if (!walkTimer) {
      walkTimer = setInterval(() => {
        frame = 1 - frame;
        setSprite(frame ? "robotWalk" : "robot");
      }, 130);
    }
    clearTimeout(buddy._stop);
    buddy._stop = setTimeout(() => {
      clearInterval(walkTimer);
      walkTimer = null;
      setSprite("robot");
    }, 180);
  }, { passive: true });

  // ---------- Chamadas para o desafio ----------
  const CALLS = ["Desafio?", "Bora um jogo da velha?", "Aposto que te ganho!", "Me clica, vai!", "Jogo da velha?"];
  const CALLS_AFTER = ["Revanche?", "Mais uma?", "Agora eu ganho!"];
  let callTimer;
  let calls = 0;
  let played = false;

  function bubble(text, ms) {
    buddySay.textContent = text;
    buddySay.classList.add("is-on");
    setSprite("robotTalk");
    clearTimeout(buddySay._t);
    buddySay._t = setTimeout(() => {
      buddySay.classList.remove("is-on");
      setSprite("robot");
    }, ms || 3200);
  }

  function scheduleCall(delay) {
    clearTimeout(callTimer);
    callTimer = setTimeout(() => {
      if (!visible || panelOpen) return scheduleCall(8000);
      if (calls >= 6) return; // não insiste para sempre
      calls++;
      bubble(played ? pick(CALLS_AFTER) : pick(CALLS));
      buddy.classList.remove("is-hop");
      void buddy.offsetWidth;
      buddy.classList.add("is-hop");
      scheduleCall(22000 + Math.random() * 10000);
    }, delay);
  }

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

  async function robotTurn() {
    const my = game;
    say(pick(["Hmm...", "Calculando...", "Deixa eu ver...", "Pensando..."]));
    await wait(450 + Math.random() * 450);
    if (my !== game || over) return;
    const i = robotChoice();
    board[i] = "O";
    paint(i);
    cells[i].classList.add("is-pop");
    setTimeout(() => cells[i].classList.remove("is-pop"), 300);
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
    buddySay.classList.remove("is-on");
    clearTimeout(callTimer);
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
    if (played) bubble(pick(["Volta quando quiser!", "Até a próxima!", "Foi divertido!"]), 2200);
    scheduleCall(25000);
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
