/* Rafael Bertochi · portfólio retrô
   Sem dependências: sprites em pixel art viram SVG, o resto é DOM puro. */
(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- Armazenamento (pode falhar em aba anônima) ----------
  const store = {
    get(area, key) { try { return window[area].getItem(key); } catch (e) { return null; } },
    set(area, key, value) { try { window[area].setItem(key, value); } catch (e) { /* ignora */ } },
  };

  // ---------- Sprites ----------
  const PALETTE = {
    Y: "#ffcc4d", R: "#ff6b6b", G: "#8b98ad", B: "#2a8f99", L: "#5ce1e6",
    K: "#0b0e14", M: "#0b0e14", C: "#3fb7c0", D: "#8b98ad", W: "#e6edf3",
    S: "#8b98ad", T: "#c9971f",
  };

  const ROBOT_BASE = [
    "......YY......",
    "......GG......",
    "..BBBBBBBBBB..",
    ".BLLLLLLLLLLB.",
    ".BLWKLLLLWKLB.",
    ".BLKKLLLLKKLB.",
    ".BLLLLLLLLLLB.",
    ".BLLLMMMMLLLB.",
    "..BBBBBBBBBB..",
    ".....GGGG.....",
    "D.CCCCCCCCCC.D",
    "D.CCCYYYYCCC.D",
    "..CCCCCCCCCC..",
    "...DD....DD...",
  ];

  function variant(rows, changes) {
    const copy = rows.slice();
    Object.keys(changes).forEach((i) => { copy[i] = changes[i]; });
    return copy;
  }

  const SPRITES = {
    robot: ROBOT_BASE,
    robotBlink: variant(ROBOT_BASE, { 4: ".BLLLLLLLLLLB.", 5: ".BLKKLLLLKKLB." }),
    robotWalk: variant(ROBOT_BASE, { 13: "..DD......DD..", 10: ".DCCCCCCCCCCD.", 11: ".DCCCYYYYCCCD." }),
    robotTalk: variant(ROBOT_BASE, { 0: "......RR......", 6: ".BLLMLLLLMLLB.", 7: ".BLLLMMMMLLLB." }),
    // voando: jato no lugar dos pés (dois quadros de chama)
    robotFly: variant(ROBOT_BASE, { 13: "...RY....YR..." }),
    robotFly2: variant(ROBOT_BASE, { 13: "...YY....YY..." }),
    robotFlyTalk: variant(ROBOT_BASE, { 0: "......RR......", 6: ".BLLMLLLLMLLB.", 7: ".BLLLMMMMLLLB.", 13: "...RY....YR..." }),
    floppy: [
      "CCCCCCCCC.",
      "CCSSSSKSCC",
      "CCSSSSKSCC",
      "CCSSSSSSCC",
      "CCCCCCCCCC",
      "CWWWWWWWWC",
      "CWSSSSSSWC",
      "CWWWWWWWWC",
      "CWSSSSSSWC",
      "CCCCCCCCCC",
    ],
    trophy: [
      "YYYYYYYY",
      "Y.WYYY.Y",
      "Y.YYYY.Y",
      ".YYYYYY.",
      "..YYYY..",
      "...YY...",
      "..TTTT..",
      ".TTTTTT.",
    ],
  };

  const FLOPPY_COLORS = { C: "#2a8f99", K: "#0b0e14" };

  function toSVG(rows, overrides) {
    const h = rows.length;
    const w = rows[0].length;
    let rects = "";
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const ch = row[x];
        if (ch === ".") continue;
        const fill = (overrides && overrides[ch]) || PALETTE[ch];
        rects += `<rect x="${x}" y="${y}" width="1.02" height="1.02" fill="${fill}"/>`;
      }
    });
    return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">${rects}</svg>`;
  }

  const svgCache = {};
  function sprite(name) {
    if (!svgCache[name]) svgCache[name] = toSVG(SPRITES[name], name === "floppy" ? FLOPPY_COLORS : null);
    return svgCache[name];
  }

  document.querySelectorAll("[data-sprite]").forEach((el) => {
    el.innerHTML = sprite(el.dataset.sprite);
  });

  // ---------- Toast ----------
  const toastEl = document.getElementById("toast");
  let toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("is-on"), 2400);
  }

  // ---------- Boot ----------
  const boot = document.getElementById("boot");
  const bootLog = document.getElementById("bootLog");
  const BOOT_LINES = [
    "RBF-BIOS v21.0  (c) 2026 Rafael Bertochi",
    "",
    "Checando memória ........... OK",
    "Carregando python.exe ...... OK",
    "Carregando playwright ...... OK",
    "Conectando ao postgres ..... OK",
    "Conferindo CPF ............. OK",
    "",
    "Iniciando RAFAEL.DEV",
  ];

  if (window.matchMedia("(pointer: coarse)").matches) {
    document.querySelector(".boot__skip").textContent = "Toque na tela para pular";
  }

  function runBoot(done) {
    if (reduceMotion || /noboot/.test(location.search) || store.get("sessionStorage", "booted")) return done();
    store.set("sessionStorage", "booted", "1");
    boot.classList.add("is-on");
    document.body.style.overflow = "hidden";
    let i = 0;
    let finished = false;

    const finish = () => {
      if (finished) return;
      finished = true;
      clearInterval(timer);
      boot.classList.add("is-off");
      document.body.style.overflow = "";
      setTimeout(() => { boot.classList.remove("is-on", "is-off"); done(); }, 360);
      window.removeEventListener("keydown", finish);
    };

    const timer = setInterval(() => {
      if (i < BOOT_LINES.length) {
        bootLog.textContent += BOOT_LINES[i] + "\n";
        i++;
      } else {
        setTimeout(finish, 350);
        clearInterval(timer);
      }
    }, 150);

    boot.addEventListener("click", finish);
    window.addEventListener("keydown", finish);
  }

  // ---------- CRT ----------
  const crtBtn = document.getElementById("crtToggle");
  function setCRT(on) {
    document.body.classList.toggle("crt", on);
    crtBtn.setAttribute("aria-pressed", String(on));
  }
  setCRT(store.get("localStorage", "crt") !== "off");
  crtBtn.addEventListener("click", () => {
    const on = !document.body.classList.contains("crt");
    setCRT(on);
    store.set("localStorage", "crt", on ? "on" : "off");
  });

  // ---------- Robô ----------
  const stage = document.getElementById("stage");
  const bot = document.getElementById("bot");
  const botSprite = document.getElementById("botSprite");
  const bubble = document.getElementById("botBubble");

  const PHRASES = [
    "bip bop! rodando pipeline...",
    "conferindo CPF... OK",
    "0 envios duplicados hoje",
    "modo prévia: nada foi enviado",
    "procura-se: vaga júnior!",
    "git pull --autostash",
    "SELECT * FROM cafe;",
    "lote validado. pode gravar.",
    "robots.txt respeitado",
    "já jogou os desafios Python?",
    "me acha no canto da tela!",
  ];

  const BOT_W = 56;
  let x = 16;
  let dir = 1;
  let frame = 0;
  let talking = false;
  let lastFrameSwap = 0;
  let lastTime = 0;
  let stageVisible = true;
  let phraseIdx = Math.floor(Math.random() * PHRASES.length);
  let bubbleTimer;

  function setBotSprite(name) {
    if (botSprite.dataset.current === name) return;
    botSprite.dataset.current = name;
    botSprite.innerHTML = sprite(name);
  }
  setBotSprite("robot");

  function say(text, ms) {
    bubble.textContent = text;
    bubble.classList.add("is-on");
    keepBubbleOnScreen();
    talking = true;
    setBotSprite("robotTalk");
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(() => {
      bubble.classList.remove("is-on");
      talking = false;
    }, ms || 2200);
  }

  // Mantém o balão inteiro dentro da tela quando o robô está perto da borda
  function keepBubbleOnScreen() {
    bubble.style.setProperty("--shift", "0px");
    const margin = 8;
    const b = bubble.getBoundingClientRect();
    const limitRight = document.documentElement.clientWidth - margin;
    let shift = 0;
    if (b.left < margin) shift = margin - b.left;
    else if (b.right > limitRight) shift = limitRight - b.right;
    bubble.style.setProperty("--shift", Math.round(shift) + "px");
  }

  bot.addEventListener("click", () => {
    bot.classList.remove("is-jump");
    void bot.offsetWidth; // reinicia a animação
    bot.classList.add("is-jump");
    phraseIdx = (phraseIdx + 1) % PHRASES.length;
    say(PHRASES[phraseIdx]);
  });

  function bounds() {
    return { min: 16, max: Math.max(16, stage.clientWidth - 16 - BOT_W) };
  }

  // ---------- Movimento do robô do topo ----------
  // Ele tem um "objetivo" (goal) e anda até lá acelerando e freando.
  // Sozinho, escolhe lugares, pula e olha em volta; com o mouse se mexendo
  // no topo, vai atrás do cursor.
  let vx = 0;
  let goal = x;
  let nextDecision = 0;
  let mouseX = null;
  let mouseAt = 0;
  let followedFar = 0;
  const heroSection = document.getElementById("topo");
  if (heroSection && window.matchMedia("(pointer: fine)").matches) {
    heroSection.addEventListener("mousemove", (e) => {
      mouseX = e.clientX - stage.getBoundingClientRect().left - BOT_W / 2;
      mouseAt = performance.now();
    });
    heroSection.addEventListener("mouseleave", () => { mouseX = null; });
  }

  function jump() {
    bot.classList.remove("is-jump");
    void bot.offsetWidth;
    bot.classList.add("is-jump");
  }

  function decide(now) {
    const b = bounds();
    const r = Math.random();
    if (r < 0.62) {
      // anda até um lugar novo (nem muito perto, nem sempre longe)
      const span = b.max - b.min;
      let g = b.min + Math.random() * span;
      if (Math.abs(g - x) < span * 0.15) g = x + (g < x ? -1 : 1) * span * 0.25;
      goal = Math.max(b.min, Math.min(b.max, g));
      nextDecision = now + 2600 + Math.random() * 2600;
    } else if (r < 0.8) {
      goal = x; // pulinho no lugar
      jump();
      nextDecision = now + 1200 + Math.random() * 1200;
    } else {
      goal = x; // olha para o outro lado
      dir = -dir;
      nextDecision = now + 1400 + Math.random() * 1600;
    }
  }

  function tick(now) {
    if (!lastTime) lastTime = now;
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;

    if (stageVisible && !(window.RBF && window.RBF.heroAway)) {
      const b = bounds();
      const following = mouseX !== null && now - mouseAt < 2000;

      if (talking) {
        goal = x;
      } else if (following) {
        const g = Math.max(b.min, Math.min(b.max, mouseX));
        if (Math.abs(g - goal) > 1) followedFar += Math.abs(g - goal);
        goal = g;
        nextDecision = now + 1500;
      } else if (now > nextDecision) {
        decide(now);
      }

      // aceleração e freio suaves
      const diff = goal - x;
      const maxSpeed = following ? 230 : 95;
      const want = Math.max(-maxSpeed, Math.min(maxSpeed, diff * 3.2));
      vx += (want - vx) * (1 - Math.exp(-dt * 6));
      if (Math.abs(diff) < 0.5 && Math.abs(vx) < 2) vx = 0;
      x = Math.max(b.min, Math.min(b.max, x + vx * dt));

      // chegou perto do cursor depois de correr: comemora com um pulinho
      if (following && Math.abs(diff) < 4 && followedFar > 160) { followedFar = 0; jump(); }

      const speed = Math.abs(vx);
      if (speed > 6) dir = vx > 0 ? 1 : -1;
      if (!talking) {
        if (speed > 6) {
          // as perninhas mexem mais rápido quando ele corre
          const interval = Math.max(90, 260 - speed);
          if (now - lastFrameSwap > interval) {
            frame = 1 - frame;
            lastFrameSwap = now;
            setBotSprite(frame ? "robotWalk" : "robot");
          }
        } else {
          const blink = Math.floor(now / 160) % 18 === 0;
          setBotSprite(blink ? "robotBlink" : "robot");
        }
      }
      // balançadinha ao andar
      const bob = speed > 6 && frame ? -2 : 0;
      bot.classList.toggle("is-flip", dir < 0);
      bot.style.transform = `translate(${(x - 16).toFixed(1)}px, ${bob}px)`;
    }
    requestAnimationFrame(tick);
  }

  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => {
      stageVisible = entries[0].isIntersecting;
    }).observe(stage);
  }

  // ---------- Atributos ----------
  document.querySelectorAll("#stats li").forEach((li) => {
    const lvl = Number(li.dataset.lvl) || 0;
    const bar = li.querySelector(".stats__bar");
    bar.setAttribute("role", "img");
    bar.setAttribute("aria-label", `nível ${lvl} de 5`);
    for (let i = 0; i < 5; i++) {
      const cell = document.createElement("i");
      if (i < lvl) cell.className = "on";
      bar.appendChild(cell);
    }
  });

  // ---------- Inventário: onde cada tecnologia já foi usada ----------
  const INV_INFO = {
    "Python": "Linguagem principal do meu estágio na Uono Sanchez: robôs de cadastro, pipeline de laudos e automação do faturamento mensal. Também é a base do meu TCC.",
    "Playwright": "Automação web dos robôs que criei na Uono Sanchez: login, filtros, exportação de relatórios e cadastro de propostas entre dois sistemas, além do download de laudos na pipeline.",
    "PostgreSQL": "Banco de dados da pipeline de laudos na Uono Sanchez: os dados extraídos de cada PDF e os imóveis comparativos são gravados em tabelas próprias, via psycopg2.",
    "Docker": "Na Uono Sanchez, sobe o PostgreSQL e o Adminer da pipeline de laudos com docker compose, para o ambiente funcionar igual em qualquer máquina.",
    "Git": "Versionamento com branches em todos os projetos do estágio na Uono Sanchez, com README de instalação, uso e decisões. Os projetos públicos estão no meu GitHub.",
    "pdfplumber": "Na Uono Sanchez, leitura dos laudos de avaliação em PDF: extrai endereço, áreas, valores e outros campos para gravar no banco.",
    "PyMuPDF": "Na Uono Sanchez, extração das fotos dos laudos (fachada e relatório fotográfico), cada uma salva com um rótulo tirado da legenda.",
    "Java": "Programação orientada a objetos nas aulas da Fatec e nos cursos da Rocketseat (Imersivo de Java) e da NTT DATA.",
    "Spring": "Estudado no curso Backend Java com Spring AI, da NTT DATA.",
    "PL/SQL": "Laboratório de Banco de Dados da Fatec (em grupo): modelagem, DDL, views, cargas por período e consultas estratégicas no Oracle.",
    "Power BI": "Na COHAB SP, uso ativo em dashboards de produtividade e de faturamento. Na Uono Sanchez, em dashboards de produtividade. Também fiz o curso de Fundamentos do Power BI (Santander Open Academy).",
    "Excel / VBA": "Na COHAB SP, macros e VBA para automatizar tarefas recorrentes da equipe. Na Uono Sanchez, automação de uma planilha de faturamento preservando fórmulas e validações.",
    "C++": "Lógica de programação e estruturas de dados nas disciplinas da Fatec.",
    "Claude Code": "IA agêntica no dia a dia do estágio na Uono Sanchez, sempre revisando com cuidado o código gerado antes de ir para produção.",
  };
  const invInfo = document.getElementById("invInfo");
  const invItems = Array.from(document.querySelectorAll(".inv li"));
  invItems.forEach((li) => {
    const name = li.textContent.trim();
    if (!INV_INFO[name]) return;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "inv__btn";
    btn.textContent = name;
    btn.setAttribute("aria-pressed", "false");
    btn.setAttribute("aria-controls", "invInfo");
    li.textContent = "";
    li.appendChild(btn);
    btn.addEventListener("click", () => {
      const already = li.classList.contains("is-sel");
      invItems.forEach((other) => {
        other.classList.remove("is-sel");
        const b = other.querySelector(".inv__btn");
        if (b) b.setAttribute("aria-pressed", "false");
      });
      if (already) {
        invInfo.innerHTML = '<p class="inv__hint">Clique em um item para ver onde ele já foi usado.</p>';
        return;
      }
      li.classList.add("is-sel");
      btn.setAttribute("aria-pressed", "true");
      invInfo.innerHTML = "";
      const title = document.createElement("p");
      title.className = "inv__name";
      title.textContent = name;
      const text = document.createElement("p");
      text.className = "inv__text";
      text.textContent = INV_INFO[name];
      invInfo.append(title, text);
    });
  });

  // ---------- Reveal ----------
  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-in"));
  }

  // ---------- Link ativo no menu ----------
  const navLinks = Array.from(document.querySelectorAll(".nav__links a"));
  if ("IntersectionObserver" in window) {
    const sections = navLinks.map((a) => document.querySelector(a.getAttribute("href")));
    const navIO = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === "#" + entry.target.id));
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach((s) => s && navIO.observe(s));
  }

  // ---------- CONTINUE? ----------
  const countEl = document.getElementById("countdown");
  let count = 9;
  let countTimer;
  // Começa no 9 só quando o número está inteiro na tela (fora da borda de baixo)
  // e volta para o 9 sempre que a pessoa sai da seção.
  function startCountdown() {
    if (countTimer || reduceMotion) return;
    count = 9;
    countEl.textContent = count;
    countTimer = setInterval(() => {
      count = count === 0 ? 9 : count - 1;
      countEl.textContent = count;
    }, 1000);
  }
  function stopCountdown() {
    clearInterval(countTimer);
    countTimer = null;
    count = 9;
    countEl.textContent = count;
  }
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => {
      entries[0].isIntersecting ? startCountdown() : stopCountdown();
    }, { threshold: 1, rootMargin: "0px 0px -20% 0px" }).observe(countEl);
  }

  // ---------- Copiar e-mail ----------
  document.getElementById("copyEmail").addEventListener("click", () => {
    const email = "rafaelbertochi1@gmail.com";
    const ok = () => toast("E-mail copiado!");
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(email).then(ok, () => toast(email));
    } else {
      toast(email);
    }
  });

  // ---------- Konami ----------
  const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
  let konamiPos = 0;
  window.addEventListener("keydown", (e) => {
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    konamiPos = key === KONAMI[konamiPos] ? konamiPos + 1 : (key === KONAMI[0] ? 1 : 0);
    if (konamiPos === KONAMI.length) {
      konamiPos = 0;
      const on = document.body.classList.toggle("party");
      toast(on ? "Cheat ativado: +30 vidas!" : "Cheat desativado");
      if (on) say("modo festa!!", 2600);
    }
  });

  // Ferramentas compartilhadas com os desafios Python (js/quest.js)
  window.RBF = { toSVG, sprite, toast, say: (text, ms) => say(text, ms) };

  // ---------- Início ----------
  runBoot(() => {
    // avisa os outros módulos (ex.: montagem do nome) que a abertura terminou
    window.RBF.ready = true;
    document.dispatchEvent(new CustomEvent("rbf:ready"));
    if (!reduceMotion) {
      requestAnimationFrame(tick);
      setTimeout(() => say("oi! sou o Rafael, versão robô!", 2600), 700);
    } else {
      bot.style.transform = "translateX(0)";
    }
  });
})();
