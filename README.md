# Tabulador-PortalSamp

Um pequeno projeto frontend estático para o Tabulador do Portal Samp.

> Este repositório contém uma página estática (HTML/CSS/JS) construída para facilitar a visualização e interação com o Tabulador do Portal Samp.

## Conteúdo

- `index.html` - Página principal.
- `app.js` - Lógica JavaScript do projeto.
- `styles.css` - Estilos CSS.
- `images/` - Imagens usadas na página.

## Pré-requisitos

Você só precisa de um navegador moderno. Para desenvolvimento local, é recomendado usar um servidor HTTP estático (evita problemas com CORS e módulos ES).

### Servidores simples recomendados

- Python 3.x: `python -m http.server 8000`
- Node.js (serve): `npx serve .`

Execute o comando na raiz do projeto.

## Como rodar localmente

1. Abra um terminal na pasta do projeto.
2. Rode um servidor estático (ex.: `python -m http.server 8000`).
3. Abra `http://localhost:8000` no seu navegador.

## Deploy (GitHub Pages)

Este repositório já pode ser publicado via GitHub Pages na branch `gh-pages` ou na configuração de Pages do repositório.

Passos rápidos:

1. Commit e push na branch `gh-pages`.
2. No GitHub, abra as configurações do repositório → Pages → selecione a branch `gh-pages` (ou `main`/`master`) e salve.
3. Aguarde alguns minutos e acesse a URL indicada.

## Estrutura do projeto

```
index.html
app.js
styles.css
images/
README.md
```

## Como contribuir

- Abra uma issue para discutir mudanças.
- Faça um fork, crie uma branch com a feature/bugfix e envie um Pull Request.

## Licença

Este projeto está licenciado sob a Licença MIT. Consulte o arquivo `LICENSE` na raiz do repositório para o texto completo.

SPDX: MIT

## Commit e deploy (exemplos - PowerShell)

Comandos básicos para commitar e enviar suas alterações ao GitHub (Windows PowerShell):

```powershell
# criar branch (opcional)
git checkout -b feat/readme

# adicionar alterações
git add README.md

# criar commit
git commit -m "docs: adicionar README do projeto"

# enviar para o remoto
git push -u origin feat/readme
```

Se você preferir commitar direto na `gh-pages` (atenção: sobrescreve histórico localmente se a branch divergir):

```powershell
git add .
git commit -m "docs: adicionar README"
git push origin gh-pages
```