/* Desafios Python: tutorial digitado num "VS Code", lacunas para completar,
   execução simulada no terminal e conquistas no estilo Minecraft.
   Nada é enviado para servidor: tudo roda no navegador. */
(function () {
  "use strict";

  const RBF = window.RBF;
  if (!RBF || !document.getElementById("vsc")) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const EN = document.documentElement.lang === "en";
  const tr = (pt, en) => (EN ? en : pt); // escolhe o texto do idioma da página
  const FOLDER = tr("desafios", "challenges");
  const FILE_DIR = `C:\\${FOLDER}\\`;

  // ---------- Ícones das conquistas (pixel art) ----------
  const ICONS = {
    calc: {
      rows: [
        ".KKKKKK.",
        "KLLLLLLK",
        "KLLLLLLK",
        "KKKKKKKK",
        "KWKWKYYK",
        "KKKKKKKK",
        "KWKWKYYK",
        "KKKKKKKK",
        ".KKKKKK.",
      ],
      pal: { K: "#3a4256", L: "#7ee787", W: "#e6edf3", Y: "#ffcc4d" },
    },
    sema: {
      rows: [
        ".KKKK.",
        "KKRRKK",
        "KKRRKK",
        "KKYYKK",
        "KKYYKK",
        "KKGGKK",
        "KKGGKK",
        ".KKKK.",
        "..KK..",
        "..KK..",
      ],
      pal: { K: "#3a4256", R: "#ff6b6b", Y: "#ffcc4d", G: "#7ee787" },
    },
    clock: {
      rows: [
        "..KKKKK..",
        ".KWWWWWK.",
        "KWWWKWWWK",
        "KWWWKWWWK",
        "KWWWKKKWK",
        "KWWWWWWWK",
        "KWWWWWWWK",
        ".KWWWWWK.",
        "..KKKKK..",
      ],
      pal: { K: "#5ce1e6", W: "#1b2433" },
    },
    guess: {
      rows: [
        "TTTTTTTT",
        "TYYKKKYT",
        "TYKYYYKT",
        "TYYYYKYT",
        "TYYYKYYT",
        "TYYYYYYT",
        "TYYYKYYT",
        "TTTTTTTT",
      ],
      pal: { T: "#c9971f", Y: "#ffcc4d", K: "#0b0e14" },
    },
    cpf: {
      rows: [
        "KKKKKKKKKK",
        "KWWWWWWWWK",
        "KWLLWSSSWK",
        "KWLLWWWWWK",
        "KWWWWSSSWK",
        "KWSSSSSSWK",
        "KWWWWWGGWK",
        "KKKKKKKKKK",
      ],
      pal: { K: "#3a4256", W: "#e6edf3", L: "#5ce1e6", S: "#8b98ad", G: "#3fb950" },
    },
    ttt: {
      rows: [
        "K.K.K.K",
        "KXKKKOK",
        "K.K.K.K",
        "KKKKKKK",
        "K.K.K.K",
        "KOKXKXK",
        "K.K.K.K",
      ],
      pal: { K: "#3a4256", X: "#ff6b6b", O: "#5ce1e6" },
    },
    final: {
      rows: [
        "YYYYYYYY",
        "Y.WYYY.Y",
        "Y.YYYY.Y",
        ".YYYYYY.",
        "..YYYY..",
        "...YY...",
        "..TTTT..",
        ".TTTTTT.",
      ],
      pal: { Y: "#ffcc4d", W: "#ffffff", T: "#c9971f" },
    },
  };
  const iconSVG = (name) => RBF.toSVG(ICONS[name].rows, ICONS[name].pal);

  // ---------- Erros "de verdade" do Python ----------
  class PyError extends Error {
    constructor(type, message, line) { super(message); this.type = type; this.line = line; }
  }
  class Stopped extends Error {}

  const pyRepr = (s) => (s.includes("'") && !s.includes('"') ? `"${s}"` : `'${s.replace(/'/g, "\\'")}'`);

  function pyFloat(text, line) {
    const s = text.trim();
    if (/^[+-]?(inf|infinity)$/i.test(s)) return s.startsWith("-") ? -Infinity : Infinity;
    if (/^[+-]?nan$/i.test(s)) return NaN;
    if (!/^[+-]?(\d+(_\d+)*(\.(\d+(_\d+)*)?)?|\.\d+(_\d+)*)([eE][+-]?\d+)?$/.test(s)) {
      throw new PyError("ValueError", `could not convert string to float: ${pyRepr(text)}`, line);
    }
    return parseFloat(s.replace(/_/g, ""));
  }

  function pyInt(text, line) {
    const s = text.trim();
    if (!/^[+-]?\d+(_\d+)*$/.test(s)) {
      throw new PyError("ValueError", `invalid literal for int() with base 10: ${pyRepr(text)}`, line);
    }
    return parseInt(s.replace(/_/g, ""), 10);
  }

  // Formata um float como o print() do Python
  function fmtFloat(x) {
    if (Number.isNaN(x)) return "nan";
    if (!Number.isFinite(x)) return x > 0 ? "inf" : "-inf";
    if (Object.is(x, -0)) return "-0.0";
    const a = Math.abs(x);
    if (a !== 0 && (a >= 1e16 || a < 1e-4)) {
      return x.toExponential().replace(/e([+-])(\d)$/, "e$10$2");
    }
    if (Number.isInteger(x)) return x.toFixed(1);
    return String(x);
  }

  // ---------- Desafios ----------
  // Em "code", {{?}} marca a lacuna que o visitante completa.
  const CHALLENGES_PT = [
    {
      id: "calc",
      file: "calculadora.py",
      name: "Calculadora",
      stars: 1,
      icon: "calc",
      ach: "Você aprendeu a criar uma calculadora em Python",
      intro: "Vamos criar uma <b>calculadora</b>: o programa pede dois números e uma operação, e mostra o resultado.",
      steps: [
        {
          explain: "<code>input()</code> mostra uma pergunta e lê o que a pessoa digita, sempre como texto. <code>float()</code> transforma esse texto em número (com casas decimais).",
          code: 'n1 = float(input("Primeiro número: "))\nn2 = float(input("Segundo número: "))\n',
        },
        {
          explain: "Agora lemos qual conta fazer. A operação fica como texto mesmo, porque vamos só comparar.",
          code: 'op = input("Operação (+ - * /): ")\n\n',
        },
        {
          explain: "<code>if</code> testa uma condição. <code>elif</code> (\"senão, se\") testa a próxima. <code>==</code> compara se dois valores são iguais.",
          code: 'if op == "+":\n    print(n1 + n2)\nelif op == "-":\n    print(n1 - n2)\n',
        },
        {
          explain: "Hora da multiplicação. Complete a lacuna:",
          code: 'elif op == "{{?}}":\n    print(n1 * n2)\n',
          quiz: { q: "Qual símbolo o Python usa para <b>multiplicar</b>?", options: ["x", "*", "·"], answer: "*" },
          after: "Isso! Em Python, <code>*</code> multiplica e <code>/</code> divide.",
        },
        {
          explain: "Por último, a divisão. Repare nos 4 espaços antes do <code>print</code>: é a <b>indentação</b> que diz ao Python o que pertence a cada <code>if</code>.",
          code: 'elif op == "/":\n    print(n1 / n2)\n',
        },
      ],
      ready: "Código pronto! Clique em <b>▶ Executar</b> e digite os números no terminal. Dica: tente dividir por zero ou digitar uma letra para ver um erro de verdade.",
      async run(t) {
        const n1 = pyFloat(await t.input("Primeiro número: "), 1);
        const n2 = pyFloat(await t.input("Segundo número: "), 2);
        const op = await t.input("Operação (+ - * /): ");
        let r;
        if (op === "+") r = n1 + n2;
        else if (op === "-") r = n1 - n2;
        else if (op === "*") r = n1 * n2;
        else if (op === "/") {
          if (n2 === 0) throw new PyError("ZeroDivisionError", "float division by zero", 12);
          r = n1 / n2;
        } else {
          t.hint(`Nada apareceu? A operação <code>${escapeHTML(op) || "(vazia)"}</code> não é + - * /, então nenhum <code>if</code> foi verdadeiro. Rode de novo.`);
          return false;
        }
        t.print(fmtFloat(r));
        return true;
      },
    },
    {
      id: "sema",
      file: "semaforo.py",
      name: "Semáforo",
      stars: 2,
      icon: "sema",
      ach: "Você aprendeu a criar um semáforo em Python",
      intro: "Agora um <b>semáforo</b>: o programa passa pelas três cores, uma de cada vez, com uma pausa entre elas.",
      steps: [
        {
          explain: "<code>import</code> traz ferramentas prontas. O módulo <code>time</code> tem funções para lidar com o tempo.",
          code: "import time\n\n",
        },
        {
          explain: "Uma <b>lista</b> guarda vários valores em ordem, entre colchetes <code>[ ]</code>.",
          code: 'cores = ["VERDE", "AMARELO", "VERMELHO"]\n\n',
        },
        {
          explain: "Agora queremos fazer algo com <b>cada cor</b> da lista. Complete a lacuna:",
          code: "{{?}} cor in cores:\n    print(cor)\n    time.sleep(2)\n",
          quiz: { q: "Qual palavra <b>repete</b> o bloco uma vez para cada item da lista?", options: ["if", "for", "def"], answer: "for" },
          after: "Isso! O <code>for</code> passa por cada item. E <code>time.sleep(2)</code> pausa o programa por 2 segundos.",
        },
      ],
      ready: "Pronto! Clique em <b>▶ Executar</b> e veja o semáforo trocar de cor.",
      async run(t) {
        const light = t.widget("sema");
        for (const cor of ["VERDE", "AMARELO", "VERMELHO"]) {
          t.print(cor, "c-" + cor.toLowerCase());
          light(cor);
          await t.sleep(2000, 7);
        }
        return true;
      },
    },
    {
      id: "clock",
      file: "relogio.py",
      name: "Relógio",
      stars: 3,
      icon: "clock",
      ach: "Você aprendeu a criar um relógio em Python",
      intro: "Vamos fazer um <b>relógio digital</b> que mostra a hora atual a cada segundo, sem parar.",
      steps: [
        {
          explain: "<code>datetime</code> é o módulo de datas e horas. Com <code>from ... import</code> pegamos só a parte que vamos usar.",
          code: "import time\nfrom datetime import datetime\n\n",
        },
        {
          explain: "<code>while True</code> repete o bloco <b>para sempre</b>, até alguém interromper. <code>datetime.now()</code> pega o momento atual.",
          code: "while True:\n    agora = datetime.now()\n",
        },
        {
          explain: "<code>strftime</code> formata a hora como texto. <code>%H</code> são as horas e <code>%S</code> os segundos. Complete a lacuna:",
          code: '    print(agora.strftime("%H:{{?}}:%S"))\n',
          quiz: { q: "Qual é o código dos <b>minutos</b>?", options: ["%m", "%M", "%min"], answer: "%M" },
          after: "Isso! Cuidado com a pegadinha: <code>%m</code> minúsculo é o <b>mês</b>.",
        },
        {
          explain: "<code>time.sleep(1)</code> espera 1 segundo antes de repetir.",
          code: "    time.sleep(1)\n",
        },
      ],
      ready: "Pronto! Clique em <b>▶ Executar</b>. Como é um <code>while True</code>, ele só para quando você apertar <b>■ Parar</b> (ou Ctrl+C).",
      async run(t) {
        const show = t.widget("clock");
        let ticks = 0;
        try {
          for (;;) {
            const now = new Date();
            const hms = [now.getHours(), now.getMinutes(), now.getSeconds()].map((n) => String(n).padStart(2, "0")).join(":");
            t.print(hms);
            show(hms);
            ticks++;
            await t.sleep(1000, 7);
          }
        } catch (e) {
          if (e instanceof Stopped && ticks >= 2) t.successAfterStop = true;
          throw e;
        }
      },
    },
    {
      id: "guess",
      file: "adivinhe.py",
      name: "Adivinhe o número",
      stars: 4,
      icon: "guess",
      ach: "Você aprendeu a criar um jogo de adivinhação em Python",
      intro: "Um <b>jogo</b>: o computador sorteia um número de 1 a 10 e você tenta adivinhar, com dicas de \"mais alto\" ou \"mais baixo\".",
      steps: [
        {
          explain: "<code>random</code> sorteia números. <code>randint(1, 10)</code> escolhe um inteiro de 1 a 10. Começamos o palpite com 0.",
          code: "import random\n\nsegredo = random.randint(1, 10)\npalpite = 0\n\n",
        },
        {
          explain: "O jogo deve continuar <b>enquanto</b> o palpite estiver errado. Complete a lacuna:",
          code: "while palpite {{?}} segredo:\n",
          quiz: { q: "Qual operador significa <b>diferente</b>?", options: ["==", "=", "!="], answer: "!=" },
          after: "Isso! <code>==</code> compara se é igual, e <code>=</code> guarda um valor numa variável.",
        },
        {
          explain: "<code>int()</code> transforma o texto digitado em número inteiro. Depois comparamos com <code>&lt;</code> e <code>&gt;</code> para dar a dica.",
          code: '    palpite = int(input("Seu palpite (1-10): "))\n    if palpite < segredo:\n        print("Mais alto!")\n    elif palpite > segredo:\n        print("Mais baixo!")\n\n',
        },
        {
          explain: "Quando o <code>while</code> termina, é porque o palpite ficou igual ao segredo.",
          code: 'print("Acertou!")\n',
        },
      ],
      ready: "Pronto! Clique em <b>▶ Executar</b> e tente adivinhar o número.",
      async run(t) {
        const segredo = 1 + Math.floor(Math.random() * 10);
        let palpite = 0;
        while (palpite !== segredo) {
          palpite = pyInt(await t.input("Seu palpite (1-10): "), 7);
          if (palpite < segredo) t.print("Mais alto!");
          else if (palpite > segredo) t.print("Mais baixo!");
        }
        t.print("Acertou!");
        return true;
      },
    },
    {
      id: "cpf",
      file: "cpf.py",
      name: "Validador de CPF",
      stars: 5,
      icon: "cpf",
      ach: "Você aprendeu a validar um CPF em Python",
      intro: "O último: um <b>validador de CPF</b>. Os dois números finais de um CPF são calculados a partir dos outros nove; vamos refazer essa conta.",
      steps: [
        {
          explain: "<code>def</code> cria uma <b>função</b>: um bloco com nome que podemos reaproveitar. Esta vai calcular um dígito verificador.",
          code: "def digito(nums):\n    peso = len(nums) + 1\n    soma = 0\n",
        },
        {
          explain: "Cada número é multiplicado por um peso que vai diminuindo (10, 9, 8...). <code>+=</code> soma no total acumulado e <code>-=</code> diminui.",
          code: "    for n in nums:\n        soma += n * peso\n        peso -= 1\n",
        },
        {
          explain: "A regra do CPF usa o <b>resto</b> da divisão por 11. Complete a lacuna:",
          code: "    resto = soma {{?}} 11\n    return 0 if resto < 2 else 11 - resto\n\n",
          quiz: { q: "Qual operador dá o <b>resto</b> de uma divisão?", options: ["/", "%", "//"], answer: "%" },
          after: "Isso! <code>/</code> divide com casas decimais, <code>//</code> divide sem elas e <code>%</code> dá o resto.",
        },
        {
          explain: "Esta linha pega só os dígitos do que foi digitado (ignora pontos e traço) e transforma cada um em número.",
          code: 'cpf = input("CPF: ")\nnums = [int(c) for c in cpf if c.isdigit()]\n\n',
        },
        {
          explain: "O 1º dígito usa os 9 primeiros números; o 2º usa os 9 e mais o 1º dígito. Se os dois baterem com o final do CPF, ele é válido.",
          code: 'd1 = digito(nums[:9])\nd2 = digito(nums[:9] + [d1])\n\nif len(nums) == 11 and nums[9:] == [d1, d2]:\n    print("CPF válido!")\nelse:\n    print("CPF inválido.")\n',
        },
      ],
      ready: "Pronto! Clique em <b>▶ Executar</b>. Teste com o CPF de exemplo <code>529.982.247-25</code> e depois troque um número. O que você digitar não sai do seu navegador.",
      async run(t) {
        const cpf = await t.input("CPF: ");
        const nums = [...cpf].filter((c) => /\d/.test(c)).map(Number);
        const digito = (ns) => {
          let peso = ns.length + 1;
          let soma = 0;
          for (const n of ns) { soma += n * peso; peso -= 1; }
          const resto = soma % 11;
          return resto < 2 ? 0 : 11 - resto;
        };
        const d1 = digito(nums.slice(0, 9));
        const d2 = digito(nums.slice(0, 9).concat([d1]));
        const ok = nums.length === 11 && nums[9] === d1 && nums[10] === d2;
        t.print(ok ? "CPF válido!" : "CPF inválido.", ok ? "c-verde" : "c-vermelho");
        return true;
      },
    },
  ];


  // Versão em inglês dos desafios (mesmas linhas, para os erros apontarem a linha certa)
  const CHALLENGES_EN = [
    {
      id: "calc",
      file: "calculator.py",
      name: "Calculator",
      stars: 1,
      icon: "calc",
      ach: "You learned to build a calculator in Python",
      intro: "Let's build a <b>calculator</b>: the program asks for two numbers and an operation, then shows the result.",
      steps: [
        {
          explain: "<code>input()</code> shows a question and reads what the person types, always as text. <code>float()</code> turns that text into a number (with decimals).",
          code: 'n1 = float(input("First number: "))\nn2 = float(input("Second number: "))\n',
        },
        {
          explain: "Now we read which operation to do. It stays as text, because we'll only compare it.",
          code: 'op = input("Operation (+ - * /): ")\n\n',
        },
        {
          explain: "<code>if</code> tests a condition. <code>elif</code> (\"else, if\") tests the next one. <code>==</code> checks whether two values are equal.",
          code: 'if op == "+":\n    print(n1 + n2)\nelif op == "-":\n    print(n1 - n2)\n',
        },
        {
          explain: "Time for multiplication. Fill in the blank:",
          code: 'elif op == "{{?}}":\n    print(n1 * n2)\n',
          quiz: { q: "Which symbol does Python use to <b>multiply</b>?", options: ["x", "*", "·"], answer: "*" },
          after: "Yes! In Python, <code>*</code> multiplies and <code>/</code> divides.",
        },
        {
          explain: "Finally, division. Notice the 4 spaces before <code>print</code>: that <b>indentation</b> tells Python what belongs to each <code>if</code>.",
          code: 'elif op == "/":\n    print(n1 / n2)\n',
        },
      ],
      ready: "Code ready! Click <b>▶ Run</b> and type the numbers in the terminal. Tip: try dividing by zero or typing a letter to see a real error.",
      async run(t) {
        const n1 = pyFloat(await t.input("First number: "), 1);
        const n2 = pyFloat(await t.input("Second number: "), 2);
        const op = await t.input("Operation (+ - * /): ");
        let r;
        if (op === "+") r = n1 + n2;
        else if (op === "-") r = n1 - n2;
        else if (op === "*") r = n1 * n2;
        else if (op === "/") {
          if (n2 === 0) throw new PyError("ZeroDivisionError", "float division by zero", 12);
          r = n1 / n2;
        } else {
          t.hint(`Nothing showed up? The operation <code>${escapeHTML(op) || "(empty)"}</code> isn't + - * /, so no <code>if</code> was true. Run it again.`);
          return false;
        }
        t.print(fmtFloat(r));
        return true;
      },
    },
    {
      id: "sema",
      file: "traffic_light.py",
      name: "Traffic light",
      stars: 2,
      icon: "sema",
      ach: "You learned to build a traffic light in Python",
      intro: "Now a <b>traffic light</b>: the program goes through the three colors, one at a time, with a pause between them.",
      steps: [
        {
          explain: "<code>import</code> brings in ready-made tools. The <code>time</code> module has functions for dealing with time.",
          code: "import time\n\n",
        },
        {
          explain: "A <b>list</b> stores several values in order, inside square brackets <code>[ ]</code>.",
          code: 'colors = ["GREEN", "YELLOW", "RED"]\n\n',
        },
        {
          explain: "Now we want to do something with <b>each color</b> in the list. Fill in the blank:",
          code: "{{?}} color in colors:\n    print(color)\n    time.sleep(2)\n",
          quiz: { q: "Which word <b>repeats</b> the block once for each item in the list?", options: ["if", "for", "def"], answer: "for" },
          after: "Yes! <code>for</code> goes through each item. And <code>time.sleep(2)</code> pauses the program for 2 seconds.",
        },
      ],
      ready: "Done! Click <b>▶ Run</b> and watch the traffic light change color.",
      async run(t) {
        const light = t.widget("sema");
        for (const [color, pt] of [["GREEN", "VERDE"], ["YELLOW", "AMARELO"], ["RED", "VERMELHO"]]) {
          t.print(color, "c-" + pt.toLowerCase());
          light(pt);
          await t.sleep(2000, 7);
        }
        return true;
      },
    },
    {
      id: "clock",
      file: "clock.py",
      name: "Clock",
      stars: 3,
      icon: "clock",
      ach: "You learned to build a clock in Python",
      intro: "Let's make a <b>digital clock</b> that shows the current time every second, nonstop.",
      steps: [
        {
          explain: "<code>datetime</code> is the date and time module. With <code>from ... import</code> we take just the part we need.",
          code: "import time\nfrom datetime import datetime\n\n",
        },
        {
          explain: "<code>while True</code> repeats the block <b>forever</b>, until someone interrupts it. <code>datetime.now()</code> gets the current moment.",
          code: "while True:\n    now = datetime.now()\n",
        },
        {
          explain: "<code>strftime</code> formats the time as text. <code>%H</code> is the hours and <code>%S</code> the seconds. Fill in the blank:",
          code: '    print(now.strftime("%H:{{?}}:%S"))\n',
          quiz: { q: "What's the code for <b>minutes</b>?", options: ["%m", "%M", "%min"], answer: "%M" },
          after: "Yes! Watch out for the trap: lowercase <code>%m</code> is the <b>month</b>.",
        },
        {
          explain: "<code>time.sleep(1)</code> waits 1 second before repeating.",
          code: "    time.sleep(1)\n",
        },
      ],
      ready: "Done! Click <b>▶ Run</b>. Since it's a <code>while True</code>, it only stops when you press <b>■ Stop</b> (or Ctrl+C).",
      async run(t) {
        const show = t.widget("clock");
        let ticks = 0;
        try {
          for (;;) {
            const now = new Date();
            const hms = [now.getHours(), now.getMinutes(), now.getSeconds()].map((n) => String(n).padStart(2, "0")).join(":");
            t.print(hms);
            show(hms);
            ticks++;
            await t.sleep(1000, 7);
          }
        } catch (e) {
          if (e instanceof Stopped && ticks >= 2) t.successAfterStop = true;
          throw e;
        }
      },
    },
    {
      id: "guess",
      file: "guess.py",
      name: "Guess the number",
      stars: 4,
      icon: "guess",
      ach: "You learned to build a guessing game in Python",
      intro: "A <b>game</b>: the computer picks a number from 1 to 10 and you try to guess it, with \"higher\" or \"lower\" hints.",
      steps: [
        {
          explain: "<code>random</code> picks numbers. <code>randint(1, 10)</code> chooses an integer from 1 to 10. We start the guess at 0.",
          code: "import random\n\nsecret = random.randint(1, 10)\nguess = 0\n\n",
        },
        {
          explain: "The game should go on <b>while</b> the guess is wrong. Fill in the blank:",
          code: "while guess {{?}} secret:\n",
          quiz: { q: "Which operator means <b>not equal</b>?", options: ["==", "=", "!="], answer: "!=" },
          after: "Yes! <code>==</code> checks for equality, and <code>=</code> stores a value in a variable.",
        },
        {
          explain: "<code>int()</code> turns the typed text into a whole number. Then we compare with <code>&lt;</code> and <code>&gt;</code> to give a hint.",
          code: '    guess = int(input("Your guess (1-10): "))\n    if guess < secret:\n        print("Higher!")\n    elif guess > secret:\n        print("Lower!")\n\n',
        },
        {
          explain: "When the <code>while</code> ends, it's because the guess matched the secret.",
          code: 'print("You got it!")\n',
        },
      ],
      ready: "Done! Click <b>▶ Run</b> and try to guess the number.",
      async run(t) {
        const secret = 1 + Math.floor(Math.random() * 10);
        let guess = 0;
        while (guess !== secret) {
          guess = pyInt(await t.input("Your guess (1-10): "), 7);
          if (guess < secret) t.print("Higher!");
          else if (guess > secret) t.print("Lower!");
        }
        t.print("You got it!");
        return true;
      },
    },
    {
      id: "cpf",
      file: "cpf.py",
      name: "CPF validator",
      stars: 5,
      icon: "cpf",
      ach: "You learned to validate a CPF in Python",
      intro: "The last one: a <b>CPF validator</b> (CPF is the Brazilian taxpayer ID). Its last two digits are calculated from the other nine; let's redo that math.",
      steps: [
        {
          explain: "<code>def</code> creates a <b>function</b>: a named block we can reuse. This one calculates a check digit.",
          code: "def check_digit(nums):\n    weight = len(nums) + 1\n    total = 0\n",
        },
        {
          explain: "Each number is multiplied by a weight that keeps decreasing (10, 9, 8...). <code>+=</code> adds to the running total and <code>-=</code> subtracts.",
          code: "    for n in nums:\n        total += n * weight\n        weight -= 1\n",
        },
        {
          explain: "The CPF rule uses the <b>remainder</b> of the division by 11. Fill in the blank:",
          code: "    remainder = total {{?}} 11\n    return 0 if remainder < 2 else 11 - remainder\n\n",
          quiz: { q: "Which operator gives the <b>remainder</b> of a division?", options: ["/", "%", "//"], answer: "%" },
          after: "Yes! <code>/</code> divides with decimals, <code>//</code> divides without them and <code>%</code> gives the remainder.",
        },
        {
          explain: "This line keeps only the digits that were typed (ignoring dots and dashes) and turns each one into a number.",
          code: 'cpf = input("CPF: ")\nnums = [int(c) for c in cpf if c.isdigit()]\n\n',
        },
        {
          explain: "The 1st digit uses the first 9 numbers; the 2nd uses those 9 plus the 1st digit. If both match the end of the CPF, it's valid.",
          code: 'd1 = check_digit(nums[:9])\nd2 = check_digit(nums[:9] + [d1])\n\nif len(nums) == 11 and nums[9:] == [d1, d2]:\n    print("Valid CPF!")\nelse:\n    print("Invalid CPF.")\n',
        },
      ],
      ready: "Done! Click <b>▶ Run</b>. Try the sample CPF <code>529.982.247-25</code> and then change one digit. What you type never leaves your browser.",
      async run(t) {
        const cpf = await t.input("CPF: ");
        const nums = [...cpf].filter((c) => /\d/.test(c)).map(Number);
        const checkDigit = (ns) => {
          let weight = ns.length + 1;
          let total = 0;
          for (const n of ns) { total += n * weight; weight -= 1; }
          const remainder = total % 11;
          return remainder < 2 ? 0 : 11 - remainder;
        };
        const d1 = checkDigit(nums.slice(0, 9));
        const d2 = checkDigit(nums.slice(0, 9).concat([d1]));
        const ok = nums.length === 11 && nums[9] === d1 && nums[10] === d2;
        t.print(ok ? "Valid CPF!" : "Invalid CPF.", ok ? "c-verde" : "c-vermelho");
        return true;
      },
    },
  ];
  const CHALLENGES = EN ? CHALLENGES_EN : CHALLENGES_PT;

  const FINAL = { id: "final", name: tr("Pythonista de bolso", "Pocket Pythonista"), icon: "final", ach: tr("Você completou todos os desafios Python!", "You completed all the Python challenges!") };

  // ---------- Progresso (localStorage, opcional) ----------
  const KEY = "rbf-python-v1";
  let progress = {};
  try { progress = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { progress = {}; }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(progress)); } catch (e) { /* ignora */ } };

  // ---------- Elementos ----------
  const $ = (id) => document.getElementById(id);
  const el = {
    picker: $("qPicker"), files: $("qFiles"), tab: $("qTab"), title: $("vscTitle"),
    run: $("qRun"), code: $("qCode"), step: $("qStep"), tutor: $("qTutor"), quiz: $("qQuiz"),
    skip: $("qSkip"), next: $("qNext"), stop: $("qStop"), term: $("qTerm"), widget: $("qWidget"),
    pos: $("qPos"), err: $("qStatusErr"), ach: $("qAch"), count: $("qCount"), reset: $("qReset"),
    toasts: $("mcToasts"),
  };

  function escapeHTML(s) {
    return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  }

  // ---------- Realce de sintaxe (Python simplificado) ----------
  const KW_CTRL = new Set(["import", "from", "if", "elif", "else", "for", "while", "return", "def"]);
  const KW_CONST = new Set(["True", "False", "None", "and", "or", "not", "in", "is"]);
  const TOKEN = /(#.*$)|("(?:[^"\\]|\\.)*"?|'(?:[^'\\]|\\.)*'?)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][A-Za-z0-9_]*)|(\s+)|(.)/gm;

  function highlightLine(line) {
    let out = "";
    let m;
    TOKEN.lastIndex = 0;
    const tokens = [];
    while ((m = TOKEN.exec(line)) !== null) {
      if (m[0] === "") { TOKEN.lastIndex++; continue; }
      tokens.push(m);
    }
    tokens.forEach((t, i) => {
      const txt = escapeHTML(t[0]);
      if (t[1]) out += `<span class="cm">${txt}</span>`;
      else if (t[2]) out += `<span class="st">${txt}</span>`;
      else if (t[3]) out += `<span class="nu">${txt}</span>`;
      else if (t[4]) {
        const next = tokens[i + 1];
        if (KW_CTRL.has(t[0])) out += `<span class="kw">${txt}</span>`;
        else if (KW_CONST.has(t[0])) out += `<span class="kc">${txt}</span>`;
        else if (next && next[0] === "(") out += `<span class="fn">${txt}</span>`;
        else out += `<span class="va">${txt}</span>`;
      } else out += txt;
    });
    return out;
  }

  // ---------- Estado ----------
  let current = null; // desafio aberto
  let typed = "";     // código já escrito no editor
  let blank = false;  // lacuna aguardando resposta
  let stepIdx = -1;
  let busy = false;   // digitando
  let skipTyping = false;
  let session = 0;    // muda ao trocar de desafio, cancela tarefas antigas
  let running = null; // execução em andamento

  function renderCode() {
    const lines = typed.split("\n");
    let html = "";
    lines.forEach((line, i) => {
      let content = highlightLine(line);
      const last = i === lines.length - 1;
      if (last && blank) content += '<span class="blank">???</span>';
      if (last) content += '<span class="caret"></span>';
      html += `<div class="ln"><span class="ln__n">${i + 1}</span><span class="ln__c">${content || " "}</span></div>`;
    });
    el.code.innerHTML = html;
    const caret = el.code.querySelector(".caret");
    if (caret) {
      const top = caret.offsetTop - el.code.clientHeight + 40;
      if (top > el.code.scrollTop) el.code.scrollTop = top;
    }
    const lastLine = lines[lines.length - 1];
    el.pos.textContent = `Ln ${lines.length}, Col ${lastLine.length + 1}`;
  }

  function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

  async function typeText(text, my) {
    if (reduceMotion || skipTyping) { typed += text; renderCode(); return; }
    for (let i = 0; i < text.length; i++) {
      if (my !== session) return;
      if (skipTyping) { typed += text.slice(i); renderCode(); return; }
      typed += text[i];
      // espaços de indentação saem de uma vez, como o autocompletar do editor
      if (text[i] === " " && text[i + 1] === " ") continue;
      renderCode();
      await wait(text[i] === "\n" ? 90 : 22);
    }
    renderCode();
  }

  function setTutor(html) { el.tutor.innerHTML = `<p>${html}</p>`; }
  function addTutor(html) { el.tutor.insertAdjacentHTML("beforeend", `<p>${html}</p>`); }

  function setNext(label, enabled, visible = true) {
    el.next.textContent = label;
    el.next.disabled = !enabled;
    el.next.hidden = !visible;
  }

  // ---------- Fluxo do tutorial ----------
  function fullCode(ch) {
    return ch.steps.map((s) => s.code.replace("{{?}}", s.quiz ? s.quiz.answer : "")).join("");
  }

  function open(id) {
    const ch = CHALLENGES.find((c) => c.id === id) || CHALLENGES[0];
    session++;
    stopRun(true);
    current = ch;
    stepIdx = -1;
    blank = false;
    busy = false;
    skipTyping = false;
    el.quiz.innerHTML = "";
    el.tab.textContent = ch.file;
    el.title.textContent = `${ch.file} — ${tr("desafios-python", "python-challenges")} — Visual Studio Code`;
    el.err.textContent = "⊗ 0  ⚠ 0";
    clearTerminal();
    setWidget(null);
    renderNav();

    const stars = "★".repeat(ch.stars) + "☆".repeat(5 - ch.stars);
    el.step.textContent = stars;

    if (progress[ch.id]) {
      typed = fullCode(ch);
      renderCode();
      setTutor(tr("Você já concluiu este desafio! Rode de novo no <b>▶ Executar</b> ou refaça o tutorial.", "You've already completed this challenge! Run it again with <b>▶ Run</b> or redo the tutorial."));
      el.run.disabled = false;
      el.skip.hidden = true;
      setNext(tr("Refazer ↺", "Redo ↺"), true);
    } else {
      typed = "";
      renderCode();
      setTutor(ch.intro);
      el.run.disabled = true;
      el.skip.hidden = true;
      setNext(tr("Começar ▶", "Start ▶"), true);
    }
  }

  async function nextStep() {
    if (busy || !current) return;
    const ch = current;
    const my = session;

    if (stepIdx === -1 && progress[ch.id] && typed) { // refazer
      typed = "";
      renderCode();
      el.run.disabled = true;
      clearTerminal();
      setWidget(null);
    }

    stepIdx++;
    const step = ch.steps[stepIdx];
    if (!step) return;
    busy = true;
    skipTyping = false;
    el.skip.hidden = reduceMotion;
    setNext(tr("Próximo ▶", "Next ▶"), false);
    el.step.textContent = `${stepIdx + 1}/${ch.steps.length}`;
    setTutor(step.explain);

    const [before, after] = step.code.split("{{?}}");
    await typeText(before, my);
    if (my !== session) return;

    if (step.quiz) {
      blank = true;
      renderCode();
      el.skip.hidden = true;
      const answer = await askQuiz(step.quiz, my);
      if (my !== session) return;
      blank = false;
      addTutor(step.after);
      skipTyping = false;
      el.skip.hidden = reduceMotion;
      await typeText(answer + after, my);
      if (my !== session) return;
    }

    busy = false;
    el.skip.hidden = true;
    if (stepIdx < ch.steps.length - 1) {
      setNext(tr("Próximo ▶", "Next ▶"), true);
    } else {
      addTutor(ch.ready);
      setNext("", false, false);
      el.run.disabled = false;
      el.run.classList.add("is-ready");
    }
  }

  function askQuiz(quiz, my) {
    return new Promise((resolve) => {
      el.quiz.innerHTML = `<p class="quiz__q">${quiz.q}</p>`;
      const row = document.createElement("div");
      row.className = "quiz__opts";
      quiz.options.forEach((opt) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "quiz__opt";
        b.textContent = opt;
        b.addEventListener("click", () => {
          if (my !== session) return;
          if (opt === quiz.answer) {
            b.classList.add("is-right");
            setTimeout(() => { el.quiz.innerHTML = ""; resolve(opt); }, 350);
          } else {
            b.classList.add("is-wrong");
            b.disabled = true;
            if (!el.quiz.querySelector(".quiz__hint")) {
              el.quiz.insertAdjacentHTML("beforeend", `<p class="quiz__hint">${tr("Quase! Tente outra opção.", "Almost! Try another option.")}</p>`);
            }
          }
        });
        row.appendChild(b);
      });
      el.quiz.appendChild(row);
    });
  }

  // ---------- Terminal ----------
  function clearTerminal() {
    el.term.innerHTML = "";
    prompt();
  }

  function line(html, cls) {
    const d = document.createElement("div");
    d.className = "term__line" + (cls ? " " + cls : "");
    d.innerHTML = html;
    el.term.appendChild(d);
    el.term.scrollTop = el.term.scrollHeight;
    return d;
  }

  function prompt(cmd) {
    const d = line(`<span class="term__ps">PS C:\\${FOLDER}&gt;</span> ${cmd ? escapeHTML(cmd) : ""}`);
    if (!cmd) d.classList.add("is-idle");
    return d;
  }

  function traceback(err, ch) {
    const codeLines = fullCode(ch).split("\n");
    const ln = err.line || 1;
    line("Traceback (most recent call last):", "c-err");
    line(`  File "${escapeHTML(FILE_DIR + ch.file)}", line ${ln}, in &lt;module&gt;`, "c-err");
    line("    " + escapeHTML((codeLines[ln - 1] || "").trim()), "c-err");
    line(`${err.type}${err.message ? ": " + escapeHTML(err.message) : ""}`, "c-err c-errhead");
  }

  function stopRun(silent) {
    if (!running) return;
    running.stopped = true;
    running.silent = silent;
    running.wake.forEach((fn) => fn());
    running.wake = [];
  }

  async function runCurrent() {
    if (!current || running || el.run.disabled) return;
    const ch = current;
    const my = session;
    el.run.classList.remove("is-ready");
    el.run.disabled = true;
    el.stop.hidden = false;
    el.err.textContent = "⊗ 0  ⚠ 0";
    setWidget(null);

    // reaproveita a linha do prompt vazio
    const idle = el.term.querySelector(".term__line.is-idle:last-child");
    if (idle) idle.remove();
    prompt(`python ${ch.file}`);

    const ctx = { stopped: false, silent: false, wake: [], line: 1 };
    running = ctx;

    const t = {
      print: (text, cls) => { if (!ctx.stopped) line(escapeHTML(text), cls); },
      hint: (html) => addTutor(html),
      widget: (kind) => setWidget(kind),
      successAfterStop: false,
      sleep: (ms, lineNo) => new Promise((resolve, reject) => {
        ctx.line = lineNo || ctx.line;
        if (ctx.stopped) return reject(new Stopped());
        const id = setTimeout(resolve, ms);
        ctx.wake.push(() => { clearTimeout(id); reject(new Stopped()); });
      }),
      input: (label) => new Promise((resolve, reject) => {
        if (ctx.stopped) return reject(new Stopped());
        const d = line(`<span>${escapeHTML(label)}</span>`);
        const inp = document.createElement("input");
        inp.className = "term__in";
        inp.type = "text";
        inp.autocomplete = "off";
        inp.spellcheck = false;
        inp.setAttribute("aria-label", label);
        d.appendChild(inp);
        el.term.scrollTop = el.term.scrollHeight;
        inp.focus({ preventScroll: true });
        const done = (fn) => {
          inp.removeEventListener("keydown", onKey);
          const span = document.createElement("span");
          span.className = "term__typed";
          span.textContent = inp.value;
          inp.replaceWith(span);
          fn();
        };
        const onKey = (e) => {
          if (e.key === "Enter") { e.preventDefault(); const v = inp.value; done(() => resolve(v)); }
          else if (e.key === "c" && e.ctrlKey) { e.preventDefault(); stopRun(false); }
        };
        inp.addEventListener("keydown", onKey);
        ctx.wake.push(() => done(() => reject(new Stopped())));
      }),
    };

    let ok = false;
    try {
      ok = await ch.run(t);
    } catch (e) {
      if (my === session) {
        if (e instanceof Stopped) {
          if (!ctx.silent) {
            line("^C", "c-dim");
            traceback({ type: "KeyboardInterrupt", message: "", line: ctx.line }, ch);
          }
          ok = !!t.successAfterStop;
        } else if (e instanceof PyError) {
          traceback(e, ch);
          el.err.textContent = "⊗ 1  ⚠ 0";
          addTutor(tr(`Apareceu um <b>${e.type}</b>: é exatamente o erro que o Python de verdade mostraria. Rode de novo com outro valor.`,
            `You got a <b>${e.type}</b>: exactly the error real Python would show. Run it again with another value.`));
        } else {
          throw e;
        }
      }
    } finally {
      if (running === ctx) running = null;
      if (my === session) {
        el.stop.hidden = true;
        el.run.disabled = false;
        prompt();
      }
    }
    if (ok && my === session) complete(ch);
  }

  // ---------- Widgets visuais ----------
  function setWidget(kind) {
    el.widget.innerHTML = "";
    el.widget.className = "qwidget";
    if (!kind) return () => {};
    el.widget.classList.add("is-on", "qwidget--" + kind);
    if (kind === "sema") {
      el.widget.innerHTML = '<div class="tl"><i data-c="VERMELHO"></i><i data-c="AMARELO"></i><i data-c="VERDE"></i></div>';
      return (cor) => {
        el.widget.querySelectorAll("i").forEach((i) => i.classList.toggle("is-on", i.dataset.c === cor));
      };
    }
    if (kind === "clock") {
      el.widget.innerHTML = '<div class="clk">--:--:--</div>';
      return (hms) => { el.widget.querySelector(".clk").textContent = hms; };
    }
    return () => {};
  }

  // ---------- Conquistas ----------
  function complete(ch) {
    const first = !progress[ch.id];
    progress[ch.id] = true;
    save();
    renderNav();
    renderAchievements();
    if (first) {
      unlockToast(ch.icon, ch.ach);
      addTutor(`<b>${tr("Desafio concluído!", "Challenge complete!")}</b> ${nextSuggestion(ch)}`);
      if (CHALLENGES.every((c) => progress[c.id]) && !progress.final) {
        progress.final = true;
        save();
        renderAchievements();
        setTimeout(() => {
          unlockToast(FINAL.icon, FINAL.ach, FINAL.name);
          RBF.say(tr("pythonista de bolso!!", "pocket pythonista!!"), 3000);
        }, 2200);
      }
    }
  }

  function nextSuggestion(ch) {
    const nxt = CHALLENGES.find((c) => !progress[c.id]);
    if (!nxt) return tr("Você completou todos os desafios!", "You completed all the challenges!");
    return `${tr("Próximo", "Next")}: <button type="button" class="tutor__link" data-open="${nxt.id}">${nxt.name} ${"★".repeat(nxt.stars)}</button>`;
  }

  let toastQueue = Promise.resolve();
  function unlockToast(icon, text, title) {
    toastQueue = toastQueue.then(() => new Promise((done) => {
      const d = document.createElement("div");
      d.className = "mc__toast";
      d.innerHTML = `<span class="mc__icon">${iconSVG(icon)}</span><span><b class="mc__t">${escapeHTML(title || tr("Conquista desbloqueada!", "Achievement unlocked!"))}</b><span class="mc__d">${escapeHTML(text)}</span></span>`;
      el.toasts.appendChild(d);
      chime();
      requestAnimationFrame(() => d.classList.add("is-in"));
      setTimeout(() => {
        d.classList.remove("is-in");
        setTimeout(() => { d.remove(); done(); }, 400);
      }, 4800);
    }));
  }

  let audio;
  function chime() {
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      const t0 = audio.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
        const o = audio.createOscillator();
        const g = audio.createGain();
        o.type = "square";
        o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t0 + i * 0.08);
        g.gain.exponentialRampToValueAtTime(0.035, t0 + i * 0.08 + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + i * 0.08 + 0.12);
        o.connect(g).connect(audio.destination);
        o.start(t0 + i * 0.08);
        o.stop(t0 + i * 0.08 + 0.14);
      });
    } catch (e) { /* sem som, tudo bem */ }
  }

  // Disponível para o jogo da velha (js/companion.js)
  RBF.achievement = (icon, text, title) => unlockToast(icon, text, title);

  // ---------- Navegação entre desafios ----------
  function renderNav() {
    el.files.innerHTML = CHALLENGES.map((c) => `
      <li><button type="button" class="vsc__file${current && current.id === c.id ? " is-on" : ""}" data-open="${c.id}">
        <span class="py">py</span><span class="vsc__fname">${c.file}</span>
        <span class="vsc__fmeta">${progress[c.id] ? "✓" : "★".repeat(c.stars)}</span>
      </button></li>`).join("");
    el.picker.innerHTML = CHALLENGES.map((c) => `
      <button type="button" role="tab" class="qpick${current && current.id === c.id ? " is-on" : ""}${progress[c.id] ? " is-done" : ""}"
        aria-selected="${current && current.id === c.id}" data-open="${c.id}">
        <span class="qpick__i">${iconSVG(c.icon)}</span>
        <span class="qpick__n">${c.name}</span>
        <span class="qpick__s">${progress[c.id] ? tr("✓ feito", "✓ done") : "★".repeat(c.stars)}</span>
      </button>`).join("");
  }

  function renderAchievements() {
    const all = CHALLENGES.map((c) => ({ id: c.id, name: c.name, icon: c.icon, ach: c.ach })).concat([FINAL]);
    const got = all.filter((a) => progress[a.id]).length;
    el.count.textContent = `· ${got}/${all.length}`;
    el.ach.innerHTML = all.map((a) => `
      <li class="qach__item${progress[a.id] ? " is-got" : ""}">
        <span class="qach__icon">${iconSVG(a.icon)}</span>
        <span><b>${a.name}</b><small>${progress[a.id] ? a.ach : a.id === "final" ? tr("Complete todos os desafios", "Complete every challenge") : tr("Conclua o desafio para desbloquear", "Finish the challenge to unlock")}</small></span>
      </li>`).join("");
    el.reset.hidden = got === 0;
  }

  // ---------- Eventos ----------
  document.getElementById("python").addEventListener("click", (e) => {
    const b = e.target.closest("[data-open]");
    if (b) {
      open(b.dataset.open);
      if (b.classList.contains("tutor__link")) document.getElementById("vsc").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    }
  });
  el.next.addEventListener("click", nextStep);
  el.skip.addEventListener("click", () => { skipTyping = true; });
  el.run.addEventListener("click", runCurrent);
  el.stop.addEventListener("click", () => stopRun(false));
  document.addEventListener("keydown", (e) => {
    if (running && e.ctrlKey && e.key === "c" && !window.getSelection().toString()) stopRun(false);
  });
  el.reset.addEventListener("click", () => {
    progress = {};
    save();
    renderAchievements();
    open(CHALLENGES[0].id);
  });

  document.querySelectorAll("#python [data-sprite]").forEach((s) => { s.innerHTML = RBF.sprite(s.dataset.sprite); });

  open(CHALLENGES.find((c) => !progress[c.id])?.id || CHALLENGES[0].id);
  renderAchievements();
})();
