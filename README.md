# Tabulador e Analisador de Códigos - Portal SAMP

Um tabulador e analisador de código front-end estático, moderno e interativo, projetado para a comunidade do Portal SAMP. Esta ferramenta facilita a formatação e a verificação de código PAWN, C e JavaScript diretamente no navegador.

## Funcionalidades

- **Formatação de Código**: Indenta o código automaticamente com base em chaves (`{` e `}`).
- **Análise e Detecção de Erros**: Identifica erros de sintaxe comuns, como chaves desbalanceadas, e aponta a linha do erro.
- **Interface Moderna**: UI limpa e responsiva com temas claro e escuro.
- **Suporte Multilíngue**: Disponível em Português, Inglês e Espanhol.
- **Realce de Sintaxe (implícito)**: A estrutura com números de linha e a fonte monoespaçada facilitam a leitura do código.
- **Download do Código**: Permite baixar o código formatado como um arquivo de texto.

## Tecnologias Utilizadas

- **HTML5**
- **CSS3**: Organizado em módulos para `base`, `layout`, `componentes` e `temas`.
- **JavaScript (ES6+ Modules)**: Lógica modular para `análise de código`, `controle de UI`, `tradução` e `gerenciamento de tema`.
- **Font Awesome**: Para ícones.
- **SweetAlert2**: Para notificações e alertas.

## Estrutura do Projeto

O projeto é organizado da seguinte forma:

- `index.html`: A página principal da aplicação.
- `css/`: Contém os arquivos de estilo:
   - `base.css`: Estilos globais e reset.
   - `layout.css`: Estrutura principal da página.
   - `components.css`: Estilos para componentes como botões, painéis e textareas.
   - `theme.css`: Variáveis e estilos para os temas claro e escuro.
- `js/`: Contém a lógica JavaScript:
   - `main.js`: Ponto de entrada da aplicação, orquestra os outros módulos.
   - `code_analyzer.js`: O coração da ferramenta, responsável por analisar e formatar o código.
   - `ui_controller.js`: Gerencia todas as interações e atualizações da interface do usuário.
   - `translator.js`: Cuida da internacionalização e da troca de idiomas.
   - `theme.js`: Gerencia a troca entre os temas claro e escuro.
- `images/`: Contém as imagens utilizadas na interface.
- `translations/`: Arquivos JSON com as traduções para os idiomas suportados (pt, en, es).

## Como Rodar Localmente

Para executar o projeto localmente, você precisará de um servidor web estático para evitar problemas com CORS ao carregar os módulos JavaScript.

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/seu-usuario/Tabulador-PortalSamp.git
   cd Tabulador-PortalSamp
   ```

2. **Inicie um servidor local:**
   - Se você usa o **Visual Studio Code** com a extensão [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer):
      - Abra a pasta do projeto no VS Code.
      - Clique com o botão direito no arquivo `index.html` e selecione "Open with Live Server" (ou clique em "Go Live" no canto inferior direito).
   - Se você tem o **Python 3** instalado:
      ```bash
      python -m http.server
      ```
   - Se você tem o **Node.js** instalado, pode usar o pacote `serve`:
      ```bash
      npx serve
      ```

3. **Abra no navegador:**
   - Acesse `http://localhost:8000` (ou a porta que o seu servidor indicar).

## Deploy (GitHub Pages)

Este projeto está pronto para ser publicado no GitHub Pages.

1. Faça o push do seu código para a branch `main` ou `gh-pages`.
2. No seu repositório no GitHub, vá para `Settings` > `Pages`.
3. Em `Branch`, selecione a branch que você usou e clique em `Save`.
4. Aguarde alguns minutos e sua página estará no ar.

## Como Contribuir

Contribuições são bem-vindas! Se você tiver ideias para novas funcionalidades ou encontrar um bug, siga os passos abaixo:

1. Abra uma **Issue** para discutir a mudança que você deseja fazer.
2. Faça um **Fork** do projeto.
3. Crie uma nova **Branch** para sua feature (`git checkout -b feature/nova-feature`).
4. Faça o **Commit** de suas mudanças (`git commit -m 'Adiciona nova feature'`).
5. Faça o **Push** para a sua branch (`git push origin feature/nova-feature`).
6. Abra um **Pull Request**.

## Licença

Este projeto está licenciado sob a Licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.