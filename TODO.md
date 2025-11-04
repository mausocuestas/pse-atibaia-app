# Backlog de Melhorias

Esta lista contém pequenas melhorias e otimizações sugeridas durante as revisões de QA.

## Estória 1.4: Refatoração da UI de Login

- [ ] **Acessibilidade:** Verificar o contraste de cores do aviso de segurança para conformidade com WCAG AA. (Prioridade: Média)
- [ ] **Acessibilidade:** Adicionar `aria-hidden="true"` ao ícone decorativo de cadeado. (Prioridade: Baixa)
- [ ] **Performance:** Otimizar a imagem `imagem-login.png` (atualmente ~982KB) para um tamanho menor, idealmente ~300KB. (Prioridade: Baixa)
- [ ] **Logo Home PSE:** Criar e atualizar o logo do PSE na home da sidebar (Prioridade: Baixa)
- [ ] **De Dashboard para Avaliadores:** Transferir página do Avaliador para Avaliadores (Prioridade: Média)
- [ ] Integration tests for multi-tab save flow
- [ ] E2E tests for mobile touch interactions
- [ ] Photo capture feature for dental conditions
- [ ] Automated CPOD index calculation
[ ] ALTA PRIORIDADE: Criar testes de integração com banco de dados real para a funcionalidade de busca.
[ ] MÉDIA PRIORIDADE: Implementar rate limiting nos endpoints de API.
[ ] MÉDIA PRIORIDADE: Refatorar a query de busca de alunos para evitar o padrão N+1.
[ ] ALTA PRIORIDADE: Corrigir os 30 erros de TypeScript nos arquivos de teste da Estória 4.3 para garantir a cobertura da nova funcionalidade de cadastro.