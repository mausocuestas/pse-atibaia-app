# 6. Epic 1: Fundação e Acesso Básico
**Objetivo do Épico:** Configurar a estrutura do projeto, o banco de dados e o sistema de autenticação. Ao final, um usuário poderá fazer login e ver uma página inicial vazia, mas segura.

### Estória 1.1: Configuração Inicial do Projeto
*   **Como um** desenvolvedor, **eu quero** configurar um novo projeto SvelteKit com TypeScript, TailwindCSS e Shadcn-svelte, **para que** tenhamos uma base de código limpa e consistente para construir a aplicação.
*   **Critérios de Aceitação (AC):**
    1.  Um novo projeto SvelteKit é criado e funcional.
    2.  TypeScript está configurado e operando.
    3.  TailwindCSS v4.1 está integrado (sem `tailwind.config.js`).
    4.  Shadcn-svelte está inicializado e um componente de botão de exemplo pode ser renderizado com sucesso.
    5.  O projeto é inicializado como um repositório Git com um arquivo `.gitignore` apropriado.

### Estória 1.2: Conexão e Implementação do Schema Existente
*   **Como um** desenvolvedor, **eu quero** conectar a aplicação SvelteKit ao banco de dados Neon PostgreSQL e implementar os schemas `shared` e `pse` existentes, **para que** a aplicação possa utilizar a estrutura de dados já validada como base.
*   **Critérios de Aceitação (AC):**
    1.  As credenciais do banco de dados são gerenciadas de forma segura através de variáveis de ambiente.
    2.  Os schemas `shared` e `pse` fornecidos pelo stakeholder são implementados como a base inicial do banco de dados.
    3.  A aplicação tem total liberdade para modificar o schema `pse`. Modificações no schema `shared` devem ser mínimas e validadas com o stakeholder.
    4.  Uma rota de API interna (ex: `/api/healthcheck`) é criada para testar e confirmar a conexão bem-sucedida com o banco de dados.

### Estória 1.3: Autenticação de Usuário com Google OAuth
*   **Como um** usuário (Avaliador ou Gestor), **eu quero** fazer login no sistema usando minha conta do Google, **para que** eu possa acessar as funcionalidades protegidas de forma segura.
*   **Critérios de Aceitação (AC):**
    1.  A página inicial exibe um botão "Login com Google".
    2.  Ao clicar, o fluxo de autenticação do Google é iniciado.
    3.  Após a autenticação bem-sucedida, o sistema verifica se o e-mail do usuário existe na tabela `avaliadores` para autorizar o acesso.
    4.  Se autorizado, o usuário é redirecionado para o seu dashboard e uma sessão é criada.
    5.  Se não autorizado, uma mensagem de "Acesso Negado" é exibida.
    6.  Um botão de "Logout" está disponível para encerrar a sessão.

### Estória 1.4: Layout Básico e Rotas Protegidas
*   **Como um** usuário logado, **eu quero** ver um layout de aplicação consistente e ser impedido de acessar páginas protegidas quando não estou logado, **para que** a navegação seja segura e estruturada.
*   **Critérios de Aceitação (AC):**
    1.  Um layout básico é criado, contendo um cabeçalho e uma área de conteúdo principal.
    2.  O cabeçalho exibe o nome do usuário logado e o botão de "Logout".
    3.  A rota do dashboard (`/dashboard`) é protegida. Tentativas de acesso direto sem login redirecionam para a página inicial.
    4.  Após o login, o usuário é direcionado para a página do dashboard (que pode, por enquanto, exibir apenas uma mensagem de boas-vindas).
