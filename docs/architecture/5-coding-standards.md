# 5. Coding Standards

*   **Tipagem Estrita:** TypeScript com `strict` ativado.
*   **Tipos Compartilhados:** Importar de `packages/shared-types`.
*   **Acesso ao Banco de Dados:** Lógica de acesso ao DB deve residir em `src/lib/server/db`.
*   **Variáveis de Ambiente:** Acessar via módulos `$env` do SvelteKit.
*   **Validação:** Toda entrada de dados do cliente deve ser validada no servidor com Zod.