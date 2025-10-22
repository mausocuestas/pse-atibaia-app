# 7. Epic 2: O Fluxo de Coleta de Dados
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
