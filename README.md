# rafael.dev · portfólio

Portfólio pessoal em estilo retrô/pixel. HTML, CSS e JavaScript puros, sem build e sem dependências.

## Rodar localmente

```bash
python -m http.server 5173
```

Abra http://localhost:5173 (`?noboot` pula a tela de boot).

## Estrutura

```
index.html             conteúdo de todas as seções
css/style.css          visual (cores em :root)
js/main.js             sprites em pixel art, robô, boot, animações
assets/favicon.svg     ícone (o robô)
assets/cv/             currículo em PDF do botão "Baixar CV"
```

Os sprites são desenhados como texto em `js/main.js` (`SPRITES`): cada letra é uma cor da `PALETTE` e `.` é transparente.

## Publicar (GitHub Pages)

1. Crie o repositório `rafaelbertochi1.github.io` e suba estes arquivos na branch `main`.
2. O site fica em https://rafaelbertochi1.github.io.
3. Domínio próprio (ex.: `rafaelbertochi.dev`):
   - registre o domínio (Cloudflare Registrar ou Porkbun);
   - no DNS, crie 4 registros `A` para `185.199.108.153`, `185.199.109.153`, `185.199.110.153` e `185.199.111.153`, e um `CNAME` `www` → `rafaelbertochi1.github.io`;
   - em *Settings → Pages* do repositório, preencha *Custom domain* e marque *Enforce HTTPS* (obrigatório para `.dev`).

## Easter eggs

- Clique no robô.
- Código Konami: ↑ ↑ ↓ ↓ ← → ← → B A.
- Botão CRT no menu liga e desliga as linhas de tela antiga.
