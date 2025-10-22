# Product Requirements Document (PRD): Sistema de Avaliação de Saúde Escolar

## 1. Goals and Background Context
*   **Goals:**
    *   Acelerar a identificação e o encaminhamento de alunos para programas de intervenção em saúde.
    *   Centralizar os dados de avaliação de saúde em uma fonte única e confiável.
    *   Fornecer aos gestores dados em tempo real para melhorar a tomada de decisão.
    *   Reduzir drasticamente o tempo de registro de avaliações para os profissionais em campo.
    *   Eliminar o retrabalho e os erros associados à transcrição manual de dados.
*   **Background Context:** O sistema web proposto resolverá as ineficiências do processo atual de registro de avaliações de saúde, que é manual, propenso a erros e gera retrabalho. Ao digitalizar e otimizar o fluxo de trabalho para os avaliadores, o sistema garantirá a coleta de dados de alta qualidade em tempo real, permitindo uma resposta mais rápida às necessidades de saúde dos alunos.
*   **Change Log:**
    | Date | Version | Description | Author |
    | :--- | :--- | :--- | :--- |
    | 20/10/2025 | 1.0 | Initial PRD creation | John (PM) |

## 2. Requirements
### Functional (Funcionais)
*   **FR1: Autenticação de Usuário:** O sistema deve permitir que usuários (Avaliadores e Gestores) façam login de forma segura utilizando suas contas do Google (OAuth 2.0).
*   **FR2: Gestão de Dados Anual:** Gestores devem ter uma interface para importar uma planilha .xlsx contendo as matrículas do ano letivo.
*   **FR3: Dashboard Personalizado do Avaliador:** Após o login, o Avaliador deve visualizar um dashboard personalizado com as escolas que lhe foram designadas.
*   **FR4: Acesso a Todas as Escolas:** O Avaliador deve ter a opção de acessar a lista completa de todas as escolas.
*   **FR5: Navegação para Avaliação:** O Avaliador deve conseguir navegar até uma turma específica seguindo o fluxo: Escola → Período → Turma.
*   **FR6: Interface de Avaliação Individual:** Ao selecionar um aluno, o sistema deve apresentar uma interface de avaliação focada naquele aluno, com design "mobile-first".
*   **FR7: Dados do Aluno na Avaliação:** A tela de avaliação deve exibir o nome completo do aluno, sua data de nascimento e a idade calculada automaticamente.
*   **FR8: Registro de Ausência:** O Avaliador deve poder marcar um aluno como "Ausente".
*   **FR9: Formulário de Acuidade Visual:** O formulário deve permitir o registro dos índices para Olho Direito, Olho Esquerdo e Reteste.
*   **FR10: Formulário de Antropometria:** O formulário deve permitir o registro de Peso (kg) e Altura (cm).
*   **FR11: Classificação Automática de Antropometria:** O sistema deve calcular e exibir automaticamente a classificação do CDC.
*   **FR12: Formulário de Odontologia:** O formulário deve permitir o registro de Risco (A-G, +/-), ATF (sim/não), ART (sim/não, com quantidade) e Escovação Orientada (sim/não).
*   **FR13: Persistência de Dados Local:** Os dados inseridos devem ser salvos automaticamente no dispositivo do usuário.
*   **FR14: Sincronização com o Servidor:** A ação de salvar deve tentar enviar os dados para o banco de dados central e indicar o status.
*   **FR16: Adição de Aluno Existente à Turma:** O Avaliador deve poder buscar um aluno na base de dados mestre e adicioná-lo à turma atual.
*   **FR17: Cadastro de Novo Aluno:** O Avaliador deve poder cadastrar um novo aluno caso não o encontre.
*   **FR18: Edição de Dados:** Avaliadores devem poder editar dados cadastrais de um aluno e avaliações já registradas.
*   **FR19: Dashboard de Gestão com Análise Histórica:** Gestores devem ter acesso a um dashboard com métricas, gráficos e análise histórica individual e agregada.
*   **FR20: Filtragem e Exportação de Dados:** Gestores devem poder filtrar e exportar os dados.
*   **FR21: Página de Dados Públicos:** O sistema deve ter uma seção de acesso público com dados gerais e anonimizados.

### Non-Functional (Não Funcionais)
*   **NFR1: Performance:** A interface de avaliação deve ser performática em redes móveis. Ações devem ter resposta visual imediata.
*   **NFR2: Usabilidade:** Coleta de dados "mobile-first". Gestão e dashboards "desktop-first".
*   **NFR3: Confiabilidade:** Nenhum dado inserido pelo avaliador deve ser perdido por falha de conexão.
*   **NFR4: Segurança:** Acesso restrito a usuários autenticados. Dados públicos devem ser anonimizados.
*   **NFR5: Compatibilidade:** Compatível com versões estáveis e amplamente utilizadas dos principais navegadores.

## 3. User Interface Design Goals
*   **Visão Geral da UX:** Experiência "em campo" para o Avaliador (velocidade) e "de escritório" para o Gestor (análise).
*   **Paradigmas de Interação:** Coleta de dados otimizada para toque; navegação para gestores via sidebar.
*   **Telas Principais:** Login, Dashboard do Avaliador, Seleção de Turma, Tela de Avaliação, Dashboard do Gestor, Relatórios, Gestão de Matrículas, Página Pública.
*   **Branding:** Seguir a identidade visual da Prefeitura da Estância de Atibaia.
*   **Plataformas Alvo:** Web Responsivo.

## 4. Technical Assumptions
*   **Estrutura do Repositório:** Monorepo.
*   **Arquitetura de Serviço:** Monolito com SvelteKit.
*   **Stack de Tecnologia:** TypeScript, SvelteKit, Neon PostgreSQL 17, Shadcn-svelte, TailwindCSS 4.1, eCharts, Zod.
*   **Ambiente de Desenvolvimento:** Windows 11, VSCode com extensão Claude Code, Neon DB, Playwright, Context7.
*   **Requisitos de Teste:** Testes E2E com Playwright para fluxos críticos.

## 5. Epic List
*   **Épico 1: Fundação e Acesso Básico**
*   **Épico 2: O Fluxo de Coleta de Dados**
*   **Épico 3: Gestão e Análise de Dados**
*   **Épico 4: Administração e Casos de Uso Avançados**

## 6. Epic 1: Fundação e Acesso Básico
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

## 7. Epic 2: O Fluxo de Coleta de Dados
**Objetivo do Épico:** Implementar o fluxo completo de avaliação para o profissional de saúde, desde o dashboard pessoal até o registro de todas as avaliações com persistência local.

### Estória 2.1: Dashboard do Avaliador
*   **Como um** Avaliador, **eu quero** ver um dashboard com a lista das minhas escolas designadas após o login, **para que** eu possa acessar rapidamente as escolas que preciso avaliar.
*   **AC:**
    1.  Após o login, o sistema busca e exibe uma lista das escolas associadas à USF do avaliador logado.
    2.  Cada escola na lista é um link clicável.
    3.  Um botão ou link "Acessar todas as escolas" também é exibido.

### Estória 2.2: Navegação e Lista de Alunos da Turma
*   **Como um** Avaliador, **eu quero** selecionar uma escola, um período e uma turma, **para que** eu possa ver a lista de todos os alunos matriculados para iniciar as avaliações.
*   **AC:**
    1.  Ao clicar em uma escola, o sistema exibe os períodos disponíveis (Manhã, Tarde, etc.).
    2.  Ao selecionar um período, o sistema exibe as turmas correspondentes.
    3.  Ao selecionar uma turma, uma lista de todos os alunos matriculados é exibida.
    4.  Cada aluno na lista é um item clicável.

### Estória 2.3: Estrutura da Tela de Avaliação Individual
*   **Como um** Avaliador, **eu quero** uma tela de avaliação bem estruturada ao selecionar um aluno, **para que** eu possa registrar os diferentes tipos de avaliação de forma organizada.
*   **AC:**
    1.  Ao clicar em um aluno, a tela de avaliação é exibida.
    2.  O cabeçalho fixo exibe o nome do aluno, data de nascimento e idade calculada.
    3.  O cabeçalho contém um checkbox para marcar "Aluno Ausente".
    4.  Um sistema de abas (Tabs) é implementado para as avaliações: [Visual], [Antropometria], [Odonto].
    5.  Um rodapé de navegação fixo com os botões `< Anterior` e `Salvar e Próximo >` está presente.

### Estória 2.4: Implementação do Formulário de Antropometria
*   **Como um** Avaliador, **eu quero** preencher os dados de peso e altura e ver a classificação do CDC automaticamente, **para que** eu possa registrar a avaliação antropométrica de forma rápida e precisa.
*   **AC:**
    1.  A aba [Antropometria] contém campos numéricos para Peso (kg) e Altura (cm).
    2.  Ao preencher ambos os campos, a classificação do CDC é calculada e exibida na tela em tempo real.
    3.  Os dados inseridos podem ser salvos.

### Estória 2.5: Implementação do Formulário de Acuidade Visual
*   **Como um** Avaliador, **eu quero** registrar os índices de acuidade visual, **para que** eu possa identificar alunos que precisam de acompanhamento.
*   **AC:**
    1.  A aba [Visual] contém campos numéricos para Olho Direito, Olho Esquerdo e Reteste.
    2.  Fica claro na interface que o campo "Reteste" se refere a uma nova medição de ambos os olhos e seu resultado prevalece sobre as medições individuais.
    3.  Os dados inseridos podem ser salvos.

### Estória 2.6: Implementação do Formulário de Odontologia
*   **Como um** Avaliador, **eu quero** usar uma interface otimizada para toque para registrar a avaliação odontológica, **para que** o processo seja rápido e com o mínimo de digitação.
*   **AC:**
    1.  A aba [Odonto] contém uma grade de botões para Risco (A-G) e botões para o sinal (+/-).
    2.  Contém um checkbox para "ATF Realizado".
    3.  Contém um checkbox para "Necessita ART" que, ao ser marcado, exibe um campo numérico para a quantidade de dentes.
    4.  Contém um checkbox para "Escovação Orientada Realizada".
    5.  Os dados inseridos podem ser salvos.

### Estória 2.7: Implementação da Persistência de Dados Local
*   **Como um** Avaliador, **eu quero** que os dados que eu insiro sejam salvos no meu dispositivo automaticamente, **para que** eu não perca meu trabalho se a conexão com a internet falhar.
*   **AC:**
    1.  Qualquer dado inserido em um formulário de avaliação é salvo no armazenamento local do navegador.
    2.  Se a página for recarregada, os dados não enviados do aluno atual são restaurados.
    3.  O botão "Salvar e Próximo" tenta sincronizar com o servidor.
    4.  A lista de alunos exibe um status visual para cada aluno (Pendente, Salvo Localmente, Sincronizado).

## 8. Epic 3: Gestão e Análise de Dados
**Objetivo do Épico:** Construir as ferramentas para os gestores, incluindo o dashboard de métricas, os relatórios, filtros, exportação e a página de dados públicos.

### Estória 3.1: Dashboard do Gestor
*   **Como um** Gestor, **eu quero** acessar um dashboard com gráficos e métricas agregadas sobre a saúde dos alunos, **para que** eu possa ter uma visão geral e rápida da situação da rede.
*   **AC:**
    1.  Após o login, o Gestor é direcionado para um dashboard.
    2.  O dashboard exibe pelo menos 3 gráficos (eCharts) principais.
    3.  Os gráficos devem exibir as labels das séries de dados.
    4.  O dashboard é otimizado para visualização em desktop.

### Estória 3.2: Filtragem e Geração de Relatórios
*   **Como um** Gestor, **eu quero** filtrar a base de dados dos alunos por múltiplos critérios, **para que** eu possa gerar listas específicas para ações de saúde.
*   **AC:**
    1.  Uma página de "Relatórios" permite a filtragem por múltiplos critérios.
    2.  Os resultados são exibidos em uma tabela paginada.
    3.  A tabela de resultados pode ser exportada em formato .xlsx.

### Estória 3.3: Visualização de Histórico Individual e Agregado
*   **Como um** Gestor, **eu quero** visualizar a evolução dos dados de saúde ao longo do tempo, **para que** eu possa analisar tendências e o impacto das intervenções.
*   **AC:**
    1.  Na página de um aluno, é possível ver um gráfico com o histórico de suas avaliações.
    2.  No dashboard principal, os gráficos podem ser filtrados por ano para mostrar a evolução de métricas agregadas.

### Estória 3.4: Página de Dados Públicos
*   **Como um** visitante do site, **eu quero** ver um dashboard com dados gerais e anonimizados sobre a saúde dos alunos, **para que** a comunidade possa ter transparência sobre o programa.
*   **AC:**
    1.  Existe uma página de acesso público (sem login).
    2.  Esta página exibe uma versão simplificada do dashboard do gestor, com dados agregados e anonimizados.
    3.  Nenhuma informação que possa identificar um aluno individualmente está presente nesta página.

## 9. Epic 4: Administração e Casos de Uso Avançados
**Objetivo do Épico:** Implementar as funcionalidades de suporte, como a importação de planilhas de matrícula, o cadastro de novos alunos em campo e a movimentação de alunos entre turmas.

### Estória 4.1: Importação de Planilha de Matrículas
*   **Como um** Gestor, **eu quero** fazer o upload de uma planilha .xlsx com as matrículas do novo ano letivo, **para que** o sistema seja populado com os dados mais recentes.
*   **AC:**
    1.  Existe uma interface administrativa para o upload de arquivos .xlsx.
    2.  O sistema processa a planilha, identificando as colunas relevantes.
    3.  Novos alunos são adicionados e alunos existentes são atualizados com suas novas matrículas.
    4.  O sistema apresenta um relatório de sucesso da importação.

### Estória 4.2: Adição de Aluno Existente Durante a Avaliação
*   **Como um** Avaliador, **eu quero** buscar um aluno na base de dados completa e adicioná-lo à turma que estou avaliando, **para que** eu possa avaliar alunos que não estavam na lista original.
*   **AC:**
    1.  Na tela da lista de alunos da turma, há um botão "Adicionar Aluno".
    2.  Este botão abre uma interface de busca por Nome, Data de Nascimento ou CPF.
    3.  Ao selecionar um aluno, ele é matriculado na turma atual e aparece na lista para avaliação.

### Estória 4.3: Cadastro de Novo Aluno Durante a Avaliação
*   **Como um** Avaliador, **eu quero** cadastrar um novo aluno caso ele não seja encontrado na busca, **para que** eu possa avaliar alunos que são novos na rede.
*   **AC:**
    1.  Se a busca não retornar resultados, um botão "Cadastrar Novo Aluno" é exibido.
    2.  Este botão abre um formulário mínimo para inserir os dados essenciais do aluno.
    3.  Após o cadastro, o novo aluno é adicionado à base de dados e matriculado na turma atual.

### Estória 4.4: Ferramenta Administrativa de Movimentação de Alunos
*   **Como um** Gestor, **eu quero** ter uma ferramenta para mover alunos entre turmas, períodos e escolas, **para que** eu possa corrigir e gerenciar as matrículas.
*   **AC:**
    1.  Existe uma interface de administração para gerenciamento de matrículas.
    2.  Nesta interface, um Gestor pode buscar por qualquer aluno.
    3.  O Gestor pode alterar a escola, o período e a turma de um aluno.
    4.  Todas as alterações são registradas em um log de auditoria.