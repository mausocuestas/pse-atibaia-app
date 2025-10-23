# 6. Padrões de Implementação de UI

## 6.1 Fonte da Verdade para Componentes Shadcn-Svelte

Para garantir a precisão na implementação dos componentes, a **fonte de verdade** para o código-fonte dos componentes shadcn-svelte é o arquivo de contexto oficial para LLMs:

**URL de Referência Primária:** https://shadcn-svelte.com/llms.txt

### Diretrizes de Uso

- **Dev Agents** devem usar este arquivo como referência primária ao implementar ou modificar componentes shadcn-svelte
- Este arquivo contém a implementação canônica e atualizada de todos os componentes
- Em caso de dúvidas ou conflitos sobre implementação de componentes, consultar este recurso primeiro
- A documentação oficial em https://shadcn-svelte.com deve ser usada para contexto adicional e exemplos de uso

## 6.2 Instalação de Componentes via CLI (Não Interativa)

### Comando Padrão

A CLI do shadcn-svelte deve ser executada de forma **não interativa** para evitar prompts. O comando padrão para adicionar novos componentes ao nosso projeto é:

```bash
npx shadcn-svelte@latest add [component-name] --cwd app --tailwind-css "app/src/app.pcss" --tailwind-config "app/tailwind.config.cjs" --components "app/src/lib/components/ui" --yes
```

### Parâmetros Explicados

- `--cwd app`: Define o diretório de trabalho como `app/`
- `--tailwind-css "app/src/app.pcss"`: Especifica o arquivo CSS principal do Tailwind
- `--tailwind-config "app/tailwind.config.cjs"`: Aponta para o arquivo de configuração do Tailwind
- `--components "app/src/lib/components/ui"`: Define o diretório de destino dos componentes
- `--yes`: Confirma automaticamente todas as operações (modo não interativo)

### Pré-requisito: Tailwind Config Temporário

⚠️ **IMPORTANTE:** É necessário criar um arquivo `app/tailwind.config.cjs` temporário para que este comando funcione corretamente.

Este requisito existe devido à migração para o Tailwind CSS v4, conforme documentado na [documentação de migração do Tailwind v4](https://tailwindcss.com/docs/upgrade-guide).

#### Workflow de Instalação de Componentes

1. Verificar se `app/tailwind.config.cjs` existe
2. Se não existir, criar arquivo temporário compatível
3. Executar comando de instalação do componente
4. Remover arquivo temporário se necessário (conforme política do projeto)

### Exemplo de Uso

```bash
# Adicionar componente Button
npx shadcn-svelte@latest add button --cwd app --tailwind-css "app/src/app.pcss" --tailwind-config "app/tailwind.config.cjs" --components "app/src/lib/components/ui" --yes

# Adicionar múltiplos componentes
npx shadcn-svelte@latest add card dialog --cwd app --tailwind-css "app/src/app.pcss" --tailwind-config "app/tailwind.config.cjs" --components "app/src/lib/components/ui" --yes
```

## 6.3 Diretrizes Gerais de Implementação de UI

### Consistência de Componentes

- Sempre usar componentes shadcn-svelte quando disponíveis
- Manter personalização consistente através da configuração do Tailwind
- Evitar estilos inline; preferir classes utilitárias do Tailwind

### Estratégia de Responsividade (Dual-Track)

Nossa aplicação adota uma **estratégia de responsividade de duas frentes**, baseada nos diferentes contextos de uso:

#### 6.3.1 Mobile-First: Telas de Coleta de Dados (Avaliadores)

**Aplicável a:** Interfaces usadas pelos avaliadores em campo

**Exemplos:**
- Tela de avaliação individual de alunos
- Formulários de coleta de medidas (peso, altura, IMC)
- Interfaces de registro de dados em tempo real
- Checklists de avaliação

**Estratégia de Implementação:**
- Design primário otimizado para telas de celular (320px - 428px)
- Interações touch-first (botões maiores, espaçamento adequado para dedos)
- Layouts verticais/empilhados por padrão
- Navegação simplificada para uso com uma mão
- Performance otimizada para conexões móveis
- Breakpoints de expansão: `sm` → `md` → `lg` (se acessado em tablet/desktop)

**Código de Exemplo:**
```svelte
<!-- Layout mobile-first -->
<div class="flex flex-col gap-4 p-4 md:flex-row md:gap-6 md:p-6">
  <!-- Conteúdo empilhado em mobile, lado a lado em desktop -->
</div>
```

#### 6.3.2 Desktop-First: Telas de Gestão e Dashboards (Gestores)

**Aplicável a:** Interfaces de administração e visualização de dados

**Exemplos:**
- Dashboards de visualização de estatísticas
- Relatórios consolidados
- Interfaces de administração do sistema
- Telas de configuração e gerenciamento
- Análises e gráficos complexos

**Estratégia de Implementação:**
- Design primário otimizado para monitores grandes (~21 polegadas / 1920px+)
- Aproveitamento de espaço horizontal para múltiplas colunas
- Tabelas de dados expansivas com múltiplas colunas
- Navegação lateral persistente
- Visualizações de dados ricas (gráficos, tabelas complexas)
- Breakpoints de redução: `2xl` → `xl` → `lg` → `md` (graceful degradation)
- **Ainda responsivo:** Deve funcionar em telas menores, mas com layout adaptado

**Código de Exemplo:**
```svelte
<!-- Layout desktop-first -->
<div class="grid grid-cols-3 gap-8 p-8 lg:grid-cols-2 lg:gap-6 md:grid-cols-1 md:gap-4 md:p-4">
  <!-- 3 colunas em desktop grande, 2 em médio, 1 em mobile -->
</div>
```

#### 6.3.3 Identificação de Telas por Contexto

Para facilitar a identificação da estratégia apropriada, classificar as rotas/componentes por persona de usuário:

| Persona | Contexto | Estratégia | Rotas Típicas |
|---------|----------|------------|---------------|
| **Avaliador** | Campo, uso móvel | Mobile-First | `/avaliar/*`, `/coleta/*`, `/checklist/*` |
| **Gestor** | Escritório, desktop | Desktop-First | `/dashboard/*`, `/relatorios/*`, `/admin/*`, `/configuracoes/*` |
| **Compartilhado** | Ambos os contextos | Híbrido/Flexível | `/login`, `/perfil`, `/ajuda` |

#### 6.3.4 Breakpoints do Tailwind (Referência)

```css
/* Tailwind Breakpoints */
sm:  640px   /* Small tablets */
md:  768px   /* Tablets */
lg:  1024px  /* Small laptops */
xl:  1280px  /* Desktops */
2xl: 1536px  /* Large desktops */
```

### Acessibilidade

- Componentes shadcn-svelte já incluem atributos ARIA apropriados
- Garantir navegação por teclado funcional
- Manter contraste de cores adequado (WCAG AA mínimo)
- Testar com leitores de tela quando apropriado
- Touch targets mínimos de 44x44px para interfaces mobile

### Performance de UI

- Lazy loading de componentes pesados
- Otimização de imagens com componente `<Image>` do SvelteKit
- Minimizar re-renders desnecessários
- Usar Svelte stores para estado compartilhado
- Code splitting por rota para otimizar bundle size
