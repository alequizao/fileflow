# FileFlow

FileFlow é uma aplicação web desenvolvida para gerenciar arquivos e diretórios de forma intuitiva e eficiente. O projeto é desenvolvido usando **TypeScript**.

**Importante:** Esta versão do FileFlow utiliza um estado temporário em memória para gerenciar arquivos. **Os arquivos e pastas enviados não são persistentes** e serão perdidos ao atualizar a página ou fechar o navegador. Todos os usuários que acessarem a aplicação verão o mesmo estado temporário (simulando um drive compartilhado), mas as alterações não são salvas permanentemente. Para um drive compartilhado real com persistência de dados, seria necessário implementar um backend com banco de dados e armazenamento de arquivos (como Firebase, AWS S3, etc.).

## Pré-requisitos

Antes de começar, você precisará ter instalado em sua máquina:

-   **Node.js e npm:** O Node.js é a plataforma de execução do JavaScript que utilizaremos e o npm (Node Package Manager) é o gerenciador de pacotes do Node.js. Você pode baixá-los e instalá-los em [https://nodejs.org/](https://nodejs.org/).
-   **Git:** O Git é um sistema de controle de versão utilizado para gerenciar o código do projeto. Você pode baixá-lo e instalá-lo em [https://git-scm.com/](https://git-scm.com/).

## Instalação e Execução

1.  **Clone o repositório:**
    ```bash
    git clone <url-do-repositorio>
    cd fileflow
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Execute o servidor de desenvolvimento:**
    ```bash
    npm run dev
    ```
    A aplicação estará disponível em `http://localhost:9002` (ou a porta definida no script `dev`).

## Funcionalidades Atuais (Estado Temporário)

*   Upload de arquivos e criação de pastas.
*   Visualização de imagens, código e markdown.
*   Renomear arquivos e pastas.
*   Mover itens para a lixeira.
*   Excluir permanentemente itens da lixeira.
*   Restaurar itens da lixeira.
*   Marcar itens como favoritos.
*   Filtrar e pesquisar itens.
*   Navegação por breadcrumbs.
*   Drag and drop para upload.
*   Tema claro e escuro.

**Lembre-se:** Todas essas ações operam sobre um estado temporário que não é salvo.
```