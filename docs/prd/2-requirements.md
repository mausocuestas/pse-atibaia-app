# 2. Requirements
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
