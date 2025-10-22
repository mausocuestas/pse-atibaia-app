# 9. Epic 4: Administração e Casos de Uso Avançados
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