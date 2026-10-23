"""Gera a versão em inglês (en/index.html) a partir do index.html em português.

    python scripts/gerar_en.py

Cada par abaixo é (texto em português, texto em inglês). Se algum texto em
português mudar no index.html, o script para e avisa qual tradução atualizar.
Os textos falados pelos robôs e os desafios Python ficam traduzidos dentro dos
próprios arquivos .js (eles escolhem o idioma pelo <html lang>).
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = "https://rafaelbertochi1.github.io"

PAIRS = [
    # cabeçalho da página
    ('<html lang="pt-BR">', '<html lang="en">'),
    ("<title>Rafael Bertochi · Back-end e Dados</title>", "<title>Rafael Bertochi · Back-end & Data</title>"),
    ('content="Rafael Bertochi: desenvolvedor back-end e de engenharia de dados. Robôs e pipelines de dados em Python, Playwright, PostgreSQL e Docker. Buscando vaga júnior em Back-end ou Engenharia de Dados."',
     'content="Rafael Bertochi: back-end and data engineering developer. Bots and data pipelines in Python, Playwright, PostgreSQL and Docker. Looking for a junior role in Back-end or Data Engineering."'),
    ('<meta property="og:title" content="Rafael Bertochi · Back-end e Dados">', '<meta property="og:title" content="Rafael Bertochi · Back-end & Data">'),
    ('content="Construo robôs e pipelines de dados em Python que tiram trabalho manual do caminho."',
     'content="I build bots and data pipelines in Python that take manual work out of the way."'),
    (f'<meta property="og:url" content="{SITE}/">', f'<meta property="og:url" content="{SITE}/en/">'),
    ('content="Rafael Bertochi: back-end e engenharia de dados, com o robô em pixel art do portfólio"',
     'content="Rafael Bertochi: back-end and data engineering, with the portfolio\'s pixel art robot"'),
    ('<meta property="og:locale" content="pt_BR">', '<meta property="og:locale" content="en_US">'),
    (f'content="{SITE}/assets/og.png"', f'content="{SITE}/assets/og-en.png"'),  # imagem de prévia em inglês
    (f'<link rel="canonical" href="{SITE}/">', f'<link rel="canonical" href="{SITE}/en/">'),

    # navegação
    ("Pular para o conteúdo", "Skip to content"),
    ("Pressione qualquer tecla para pular", "Press any key to skip"),
    ('aria-label="Início"', 'aria-label="Home"'),
    ('aria-label="Seções"', 'aria-label="Sections"'),
    ('<li><a href="#missoes">Projetos</a></li>', '<li><a href="#missoes">Projects</a></li>'),
    ('<li><a href="#ficha">Sobre</a></li>', '<li><a href="#ficha">About</a></li>'),
    ('<li><a href="#jornada">Experiência</a></li>', '<li><a href="#jornada">Experience</a></li>'),
    ('<li><a href="#contato">Contato</a></li>', '<li><a href="#contato">Contact</a></li>'),
    ('      <div class="lang" role="group" aria-label="Idioma / Language">\n        <span class="lang__globe" data-sprite="globe" aria-hidden="true"></span>\n        <span class="lang__opt is-on" aria-current="page" title="Português (página atual)">PT</span>\n        <a class="lang__opt" href="en/" hreflang="en" lang="en" title="English" data-lang="en">EN</a>\n      </div>',
     '      <div class="lang" role="group" aria-label="Language / Idioma">\n        <span class="lang__globe" data-sprite="globe" aria-hidden="true"></span>\n        <a class="lang__opt" href="../" hreflang="pt-BR" lang="pt-BR" title="Português" data-lang="pt">PT</a>\n        <span class="lang__opt is-on" aria-current="page" title="English (current page)">EN</span>\n      </div>'),
    ('title="Modo direto: desliga a abertura, as montagens e os robôs para ler tudo na hora">DIRETO</button>',
     'title="Quick mode: turns off the intro, the building animations and the robots so you can read everything right away">QUICK</button>'),
    ('title="Liga/desliga o efeito de tela antiga"', 'title="Turns the old screen effect on/off"'),

    # topo
    ('aria-label="Status"', 'aria-label="Status"'),
    ("CLASSE <b>BACK-END + DADOS</b>", "CLASS <b>BACK-END + DATA</b>"),
    ('aria-label="Progresso de estagiário para júnior"', 'aria-label="Progress from intern to junior"'),
    ("ESTAGIÁRIO → JÚNIOR", "INTERN → JUNIOR"),
    ("Back-end · Engenharia de dados · Python · SQL", "Back-end · Data engineering · Python · SQL"),
    ("""Construo robôs e pipelines de dados em Python: extraio informação de sistemas
          web e PDFs, trato, valido e gravo em bancos de dados, sem trabalho manual no
          caminho. Hoje eles rodam em produção no meu estágio.""",
     """I build bots and data pipelines in Python: I extract information from web systems
          and PDFs, then clean, validate and load it into databases, with no manual work along
          the way. Today they run in production at my internship."""),
    ("▶ Ver projetos", "▶ See projects"),
    ('<span class="now__tag">AGORA</span>', '<span class="now__tag">NOW</span>'),
    ("Levando a pipeline de laudos para o 3º banco, evoluindo o app de fotos que a equipe usa e codando a base do meu TCC.",
     "Bringing the appraisal pipeline to a 3rd bank, improving the photo app my team uses and coding the foundation of my thesis."),
    (">atualizado em out/2026</time>", ">updated Oct 2026</time>"),
    ('href="assets/cv/Rafael_Bertochi_CV_Backend_Jr.pdf"', 'href="assets/cv/Rafael_Bertochi_Resume_Backend_EN.pdf"'),
    ('href="assets/cv/Rafael_Bertochi_CV_Engenharia_Dados.pdf"', 'href="assets/cv/Rafael_Bertochi_Resume_Data_Engineering_EN.pdf"'),
    ("↓ CV Back-end</a>", "↓ CV Back-end</a>"),
    ("↓ CV Dados</a>", "↓ CV Data</a>"),
    ('aria-label="Robô do Rafael. Clique para ele falar."', 'aria-label="Rafael\'s robot. Click to make it talk."'),

    # projetos
    ("MUNDO 1 · PROJETOS", "WORLD 1 · PROJECTS"),
    ("Missões principais", "Main quests"),
    ("""Projetos reais do meu estágio, rodando em produção. Os repositórios são versões de
            portfólio: troquei nomes de empresa, sistemas e bancos por nomes genéricos.""",
     """Real projects from my internship, running in production. The repositories are portfolio
            versions: I replaced company, system and bank names with generic ones."""),
    ("<i></i>EM PRODUÇÃO", "<i></i>IN PRODUCTION"),
    ("Robô de cadastro de vistorias", "Inspection registration bot"),
    ("""Leva o status das inspeções de um portal de laudos para o sistema de gestão da
              empresa: exporta o relatório, cadastra as propostas e atribui o engenheiro
              responsável. Tudo num único comando, com execução agendada. Substituiu um processo manual.""",
     """Moves the status of inspections from an appraisal portal into the company's management
              system: it exports the report, registers the proposals and assigns the responsible
              engineer. All in a single command, on a schedule. It replaced a manual process."""),
    ("O que eu resolvi", "What I solved"),
    ("Travas para um fluxo que impacta pagamentos: confirmação por CPF exato, modo prévia, reconferência após cada gravação, idempotência e deduplicação.",
     "Safeguards for a flow that affects payments: exact taxpayer ID (CPF) match, preview mode, re-check after every write, idempotency and deduplication."),
    ("Conferência uma a uma das inspeções canceladas antes de liberar o arquivo. Se a contagem não bate, o robô para e avisa em vez de seguir.",
     "Checks every cancelled inspection one by one before releasing the file. If the count doesn't match, the bot stops and warns instead of carrying on."),
    ("Filtros marcados por texto exato, testados contra as listas reais de 22 e 33 status, e tratamento de lista com rolagem virtual.",
     "Filters selected by exact text, tested against the real lists of 22 and 33 statuses, plus handling of a virtually scrolled list."),
    ("Integração com endpoints HTTP internos e ferramenta própria para mapear telas, frames e seletores.",
     "Integration with internal HTTP endpoints and a tool I built to map screens, frames and selectors."),
    ('aria-label="Tecnologias"', 'aria-label="Technologies"'),
    ("Repo · Banco A ↗", "Repo · Bank A ↗"),
    ("Repo · Banco B ↗", "Repo · Bank B ↗"),
    ("Pipeline de laudos imobiliários", "Property appraisal pipeline"),
    ("""Baixa laudos de avaliação de imóveis, extrai os dados e as fotos de cada PDF
              e grava tudo num PostgreSQL, com o lote validado antes de qualquer gravação.""",
     """Downloads property appraisal reports, extracts the data and photos from each PDF
              and loads everything into PostgreSQL, validating the batch before any write."""),
    ("Download direto pela API da plataforma, com vários PDFs ao mesmo tempo e volta para a tela só quando a API não resolve.",
     "Downloads straight from the platform's API, several PDFs at a time, falling back to the UI only when the API can't."),
    ("Validação do lote inteiro antes de gravar: se algo indica layout novo de PDF, nada é gravado e sai um relatório.",
     "Validates the whole batch before writing: if anything points to a new PDF layout, nothing is written and a report comes out."),
    ("Medição da própria taxa de acerto: compara ~20 campos do banco com uma segunda fonte dentro do PDF, numa amostra de 500 laudos.",
     "Measures its own accuracy: compares ~20 database fields against a second source inside the PDF, on a sample of 500 reports."),
    ("Geocodificação de endereços sem coordenada (OpenStreetMap → CEP → cidade), com erro típico de ~180 m em 200 laudos testados.",
     "Geocodes addresses without coordinates (OpenStreetMap → ZIP code → city), with a typical error of ~180 m across 200 tested reports."),
    ("<summary>Ver a arquitetura</summary>", "<summary>See the architecture</summary>"),
    ('aria-label="Etapas da pipeline"', 'aria-label="Pipeline stages"'),
    ("<li><b>Plataforma</b><small>laudos de avaliação em PDF</small></li>", "<li><b>Platform</b><small>appraisal reports as PDFs</small></li>"),
    ("<li><b>Download</b><small>API da plataforma, vários ao mesmo tempo</small></li>", "<li><b>Download</b><small>platform API, several at a time</small></li>"),
    ("<li><b>Extração</b><small>dados com pdfplumber, fotos com PyMuPDF</small></li>", "<li><b>Extraction</b><small>data with pdfplumber, photos with PyMuPDF</small></li>"),
    ('<li class="is-gate"><b>Validação do lote</b><small>sinal de layout novo? nada é gravado</small></li>',
     '<li class="is-gate"><b>Batch validation</b><small>new layout spotted? nothing is written</small></li>'),
    ("<li><b>PostgreSQL</b><small>no Docker, via psycopg2</small></li>", "<li><b>PostgreSQL</b><small>in Docker, via psycopg2</small></li>"),
    ("<li><b>Geocodificação</b><small>OpenStreetMap → CEP → cidade, em segundo plano</small></li>",
     "<li><b>Geocoding</b><small>OpenStreetMap → ZIP code → city, in the background</small></li>"),
    ("<small>laudos na amostra de conferência</small>", "<small>reports in the accuracy sample</small>"),
    ("<small>etapas num comando só</small>", "<small>stages in a single command</small>"),
    ("<small>bancos atendidos</small>", "<small>banks served</small>"),
    ("<small>testes automatizados no CI</small>", "<small>automated tests in CI</small>"),
    ("<small>bancos clientes em produção</small>", "<small>client banks in production</small>"),
    ("<small>laudos na conferência de acerto</small>", "<small>reports in the accuracy check</small>"),
    ("<i></i>EM USO NA EQUIPE", "<i></i>USED BY MY TEAM"),
    ("App de fotos dos laudos", "Appraisal photo app"),
    ("""Programa de computador que a equipe de avaliação usa todo dia: busca as fotos da
              proposta no sistema, deixa escolher, ordenar e nomear, e monta o relatório fotográfico
              em Excel no modelo de cada banco. Antes isso era feito à mão, foto por foto.""",
     """Desktop program the appraisal team uses every day: it fetches the photos of a
              proposal from the system, lets you pick, order and name them, and builds the photo
              report in Excel using each bank's template. This used to be done by hand, photo by photo."""),
    ("Um perfil por banco: abas, blocos de foto, quadros e nome do arquivo ficam numa configuração. Banco novo é uma pasta de modelos e um perfil.",
     "One profile per bank: sheets, photo blocks, frames and file name live in a config. A new bank is a template folder plus a profile."),
    ("Pré-preenchimento do formulário do banco com os dados da vistoria, com o modelo escolhido sozinho pelo tipo de operação.",
     "Pre-fills the bank's form with the inspection data, picking the template automatically from the type of operation."),
    ("Testes de regressão contra gabaritos de casos reais, para uma versão nova não quebrar um modelo que já funcionava.",
     "Regression tests against answer keys from real cases, so a new version can't break a template that already worked."),
    ("Distribuição como .exe versionado, publicado numa pasta compartilhada e em releases.",
     "Shipped as a versioned .exe, published to a shared folder and as releases."),
    ("<small>versões publicadas em 1 semana</small>", "<small>versions shipped in 1 week</small>"),
    ("<small>bancos com modelos próprios</small>", "<small>banks with their own templates</small>"),
    ("<small>campos comparados com uma 2ª fonte do PDF</small>", "<small>fields checked against a 2nd source in the PDF</small>"),
    ("<small>erro típico da geocodificação</small>", "<small>typical geocoding error</small>"),
    ("Missões secundárias <span>· faculdade e estudos</span>", "Side quests <span>· college and studies</span>"),
    ("EM DESENVOLVIMENTO", "IN PROGRESS"),
    ("TCC · Pipeline de dados imobiliários", "Thesis · Real estate data pipeline"),
    ("""Coleta de anúncios de imóveis, ETL, banco relacional e análise exploratória.
              A base já roda: coletor que respeita robots.txt e limita requisições, ETL validado e
              histórico de preços no banco, com 106 testes no CI e decisões registradas em ADRs.""",
     """Collection of property listings, ETL, relational database and exploratory analysis.
              The foundation already runs: a collector that respects robots.txt and rate limits, validated ETL
              and price history in the database, with 106 tests in CI and decisions recorded in ADRs."""),
    ("EM GRUPO", "GROUP WORK"),
    ("Laboratório de Banco de Dados", "Database Lab"),
    ("""Modelagem relacional, scripts DDL, views, cargas DML por período e consultas
              estratégicas em SQL, com dicionário de dados e modelo documentados.""",
     """Relational modeling, DDL scripts, views, period-based DML loads and strategic
              SQL queries, with a documented data dictionary and model."""),

    # ficha
    ("MUNDO 2 · SOBRE", "WORLD 2 · ABOUT"),
    ("Ficha do personagem", "Character sheet"),
    ("<dt>Jogador</dt>", "<dt>Player</dt>"),
    ("<dt>Classe</dt><dd>Back-end · Engenharia de dados</dd>", "<dt>Class</dt><dd>Back-end · Data engineering</dd>"),
    ("<dt>Base</dt><dd>Mogi das Cruzes, SP</dd>", "<dt>Base</dt><dd>Mogi das Cruzes, SP, Brazil</dd>"),
    ("<dt>Guilda</dt><dd>Fatec Mogi das Cruzes · ADS</dd>", "<dt>Guild</dt><dd>Fatec Mogi das Cruzes · Systems Analysis</dd>"),
    ("<dt>Idiomas</dt><dd>Português (nativo) · Inglês B2 (TOEIC)</dd>", "<dt>Languages</dt><dd>Portuguese (native) · English B2 (TOEIC)</dd>"),
    ("""Estudo Análise e Desenvolvimento de Sistemas e sou estagiário de dados e
              desenvolvimento. No dia a dia construo e mantenho em produção automações em
              Python que integram sistemas web, endpoints HTTP, arquivos e bancos de dados,
              e pipelines que extraem, validam e gravam no PostgreSQL os dados de laudos em PDF.""",
     """I study Systems Analysis and Development and work as a data and development intern.
              Day to day I build and maintain production automations in Python that connect web
              systems, HTTP endpoints, files and databases, plus pipelines that extract, validate
              and load data from PDF appraisal reports into PostgreSQL."""),
    ("""Trabalho com Git, Docker e investigação de erros por logs, e uso IA agêntica
              (Claude Code) revisando com cuidado tudo o que é gerado antes de ir para produção.
              Tenho base em Java/POO com Spring e em SQL. Antes, na COHAB SP, trabalhei com
              análise e tratamento de grandes volumes de dados.""",
     """I work with Git, Docker and log-based debugging, and I use agentic AI (Claude Code),
              carefully reviewing everything it generates before it reaches production. I have a
              foundation in Java/OOP with Spring and in SQL. Before that, at COHAB SP, I analyzed
              and processed large volumes of data."""),
    ('<h3 class="mini">Atributos</h3>', '<h3 class="mini">Attributes</h3>'),
    ('<span class="stats__name">Java / POO</span>', '<span class="stats__name">Java / OOP</span>'),
    ('<span class="stats__tag">BÁS</span>', '<span class="stats__tag">BAS</span>'),
    ('<span class="stats__tag">NOÇÕES</span>', '<span class="stats__tag">INTRO</span>'),
    ('<h3 class="mini">Inventário</h3>', '<h3 class="mini">Inventory</h3>'),
    ("Clique em um item para ver onde ele já foi usado.", "Click an item to see where I've used it."),
    ('<h3 class="mini">Golpe especial</h3>', '<h3 class="mini">Special move</h3>'),
    ("Transformar um processo manual de horas num único comando.", "Turning an hours-long manual process into a single command."),
    ('<h3 class="mini">Habilidade passiva</h3>', '<h3 class="mini">Passive skill</h3>'),
    ("Nada que mexe com pagamento roda sem prévia e reconferência.", "Nothing that touches payments runs without a preview and a re-check."),
    ('<h3 class="mini">Próximas habilidades</h3>', '<h3 class="mini">Next skills</h3>'),
    ("<li>Microsserviços</li>", "<li>Microservices</li>"),

    # experiência
    ("MUNDO 3 · EXPERIÊNCIA", "WORLD 3 · EXPERIENCE"),
    ('<p class="save__date">ago/2026 · atual</p>', '<p class="save__date">Aug 2026 · present</p>'),
    ("Estagiário de Dados e Desenvolvimento", "Data and Development Intern"),
    ('Robô em Python e Playwright que exporta relatórios, cadastra propostas e atribui o engenheiro responsável.',
     'Python and Playwright bot that exports reports, registers proposals and assigns the responsible engineer.'),
    ('Pipelines de laudos de três bancos clientes: download pela API, extração de PDFs e carga em PostgreSQL com Docker.',
     'Appraisal pipelines for three client banks: API downloads, PDF extraction and loading into PostgreSQL with Docker.'),
    ('App desktop em Python usado pela equipe para montar o relatório fotográfico dos laudos, com versões publicadas e testes de regressão.',
     'Python desktop app my team uses to build the photo report of each appraisal, with versioned releases and regression tests.'),
    ('Faturamento mensal de um cliente bancário automatizado: leitura de laudos em PDF e validação contra a base de preços.',
     'Automated monthly billing for a banking client: reading PDF reports and validating them against the price table.'),
    ('Travas em fluxo que impacta pagamentos e correção de bugs em produção a partir de logs.',
     'Safeguards on a payment-related flow and production bug fixes from logs.'),
    ('<p class="save__date">jan/2025 · fev/2026</p>', '<p class="save__date">Jan 2025 · Feb 2026</p>'),
    ("Estagiário de Análise e Tratamento de Dados", "Data Analysis and Processing Intern"),
    ('Análise e tratamento de grandes volumes de dados de crédito imobiliário.',
     'Analyzed and processed large volumes of housing credit data.'),
    ("Automação de tarefas recorrentes com Excel avançado, macros e VBA.", "Automated recurring tasks with advanced Excel, macros and VBA."),
    ('<p class="save__date">ago/2024 · dez/2027 (previsão)</p>', '<p class="save__date">Aug 2024 · Dec 2027 (expected)</p>'),
    ("Tecnologia em Análise e Desenvolvimento de Sistemas", "Associate Degree in Systems Analysis and Development"),
    ("Conquistas desbloqueadas <span>· cursos e certificados</span>", "Achievements unlocked <span>· courses and certificates</span>"),
    ("<b>Backend Java com Spring AI</b>", "<b>Java Back-end with Spring AI</b>"),
    ("<b>Curso Imersivo de Java</b>", "<b>Java Immersive Course</b>"),
    ("<b>Fundamentos do Power BI</b>", "<b>Power BI Fundamentals</b>"),
    ("<b>Segurança de Rede</b>", "<b>Network Security</b>"),
    ("<b>Laboratório de Hardware</b>", "<b>Hardware Lab</b>"),
    ("<b>Inglês B2</b>", "<b>English B2</b>"),

    # desafios python
    ("FASE BÔNUS · PYTHON", "BONUS STAGE · PYTHON"),
    ("Entenda o básico de Python", "Learn the basics of Python"),
    ("""Cinco mini desafios, do mais fácil ao mais difícil. O código vai sendo escrito na sua
            frente, o robô explica cada parte e você completa as lacunas. No fim, é só rodar no
            terminal e ganhar a conquista. Tudo roda no seu navegador.""",
     """Five mini challenges, from easiest to hardest. The code gets typed in front of you,
            the robot explains each part and you fill in the blanks. At the end, just run it in
            the terminal and earn the achievement. Everything runs in your browser."""),
    ('aria-label="Desafios"', 'aria-label="Challenges"'),
    ("desafios-python — Visual Studio Code", "python-challenges — Visual Studio Code"),
    ('aria-label="Arquivos dos desafios"', 'aria-label="Challenge files"'),
    ('<p class="vsc__label">EXPLORADOR</p>', '<p class="vsc__label">EXPLORER</p>'),
    ("▾ DESAFIOS-PYTHON", "▾ PYTHON-CHALLENGES"),
    ('<span class="vsc__tab" id="qTab">calculadora.py</span>', '<span class="vsc__tab" id="qTab">calculator.py</span>'),
    ('title="Executar arquivo Python">▶ Executar</button>', 'title="Run Python file">▶ Run</button>'),
    ('aria-label="Código do desafio"', 'aria-label="Challenge code"'),
    ("⏩ Pular digitação", "⏩ Skip typing"),
    ('id="qNext" type="button">Começar ▶</button>', 'id="qNext" type="button">Start ▶</button>'),
    ("<span>PROBLEMAS</span><span>SAÍDA</span>", "<span>PROBLEMS</span><span>OUTPUT</span>"),
    ("■ Parar (Ctrl+C)", "■ Stop (Ctrl+C)"),
    ("Conquistas Python <span", "Python achievements <span"),
    ('id="qReset" type="button">Zerar progresso</button>', 'id="qReset" type="button">Reset progress</button>'),

    # contato e rodapé
    ("""Estou procurando minha primeira vaga júnior em Back-end ou Engenharia de Dados.
            Se tiver uma oportunidade ou quiser trocar uma ideia, é só chamar.""",
     """I'm looking for my first junior role in Back-end or Data Engineering.
            If you have an opportunity or just want to chat, reach out."""),
    ("▶ Mandar e-mail", "▶ Send an email"),
    ("<span>[copiar]</span>", "<span>[copy]</span>"),
    ("""            Currículo:
""", """            CV:
"""),
    ('data-goatcounter-click="cv-dados-contato">Engenharia de Dados ↓</a>', 'data-goatcounter-click="cv-dados-contato">Data Engineering ↓</a>'),
    ("© 2026 Rafael Bertochi · Feito pixel por pixel.", "© 2026 Rafael Bertochi · Made pixel by pixel."),
    ("Visitas contadas de forma anônima, sem cookies.", "Visits are counted anonymously, without cookies."),
    ("Dica: ↑ ↑ ↓ ↓ ← → ← → B A", "Tip: ↑ ↑ ↓ ↓ ← → ← → B A"),
]


def main():
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    faltando = []
    for pt, en in PAIRS:
        if pt not in html:
            faltando.append(pt)
            continue
        html = html.replace(pt, en)
    if faltando:
        print("Textos em português que não foram encontrados (atualize a tradução):")
        for t in faltando:
            print("  -", t[:90].replace("\n", " "))
        sys.exit(1)
    # caminhos relativos: a página em inglês fica uma pasta abaixo
    html = re.sub(r'(href|src)="(css|js|assets)/', r'\1="../\2/', html)
    # marca as cópias dos eventos de clique como inglês
    html = re.sub(r'data-goatcounter-click="([\w-]+)"', r'data-goatcounter-click="en-\1"', html)
    destino = ROOT / "en" / "index.html"
    destino.parent.mkdir(exist_ok=True)
    destino.write_text(html, encoding="utf-8")
    print("ok", destino)


if __name__ == "__main__":
    main()
