# 8. Epic 3: Gestão e Análise de Dados
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
