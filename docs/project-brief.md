# Project Brief: Sistema de Avaliação de Saúde Escolar

## Executive Summary

Um sistema web, com design mobile-first, para permitir que profissionais de saúde registrem e gerenciem com eficiência quatro tipos de avaliações de saúde (visual, antropometria, odontologia e escovação) para aproximadamente 20.000 alunos da rede pública anualmente. O sistema focará na rapidez da inserção de dados em campo, mesmo com conectividade limitada, e fornecerá dashboards e relatórios para análise posterior dos resultados.

## Problem Statement

O processo atual de registro das avaliações de saúde dos alunos é ineficiente e gera um retrabalho significativo. Os profissionais anotam os dados manualmente em campo e, posteriormente, outro funcionário na secretaria de saúde precisa transcrever tudo para planilhas, lidando com caligrafia ilegível, rasuras e a inevitável introdução de erros.

Este fluxo de trabalho duplo não só é lento e propenso a falhas, mas também resulta em dados descentralizados que são difíceis de consolidar e analisar. A falta de uma ferramenta digital otimizada para celulares e resiliente a falhas de conexão com a internet agrava o problema, aumentando o risco de perda de dados e atrasando a identificação de alunos que precisam de atenção imediata (por exemplo, com problemas de visão ou obesidade).

## Proposed Solution

A criação de um sistema web com design 'mobile-first' que centraliza e simplifica o registro das avaliações de saúde dos alunos.

A ferramenta permitirá que os avaliadores insiram os dados diretamente no sistema durante o atendimento na escola, eliminando a necessidade de transcrição manual e o retrabalho, o que reduzirá drasticamente os erros. Com um mecanismo de salvamento local automático, o sistema garantirá que nenhum dado seja perdido, mesmo em ambientes com conexão de internet instável.

Seu fluxo de trabalho otimizado, com um dashboard personalizado para cada avaliador, navegação rápida entre alunos e preenchimento por toques (em vez de digitação), foi projetado para maximizar a eficiência dos profissionais em campo. Como resultado, os dados se tornarão disponíveis para análise em tempo real, permitindo que a gestão da saúde identifique rapidamente os alunos que necessitam de acompanhamento.

## Target Users

*   **Usuário Primário: O Avaliador (Profissional de Saúde da USF):** Necessita de um método rápido e eficiente para registrar dezenas de avaliações em sequência em um ambiente de campo, com uma interface mobile simples e resiliente a falhas de conexão.
*   **Usuário Secundário: O Gestor de Saúde (Administrador do Sistema):** Necessita de acesso a dados consolidados e em tempo real através de dashboards e relatórios para planejar intervenções e gerenciar o programa.

## Goals & Success Metrics

*   **Business Objectives:** Acelerar a intervenção em saúde, centralizar os dados e melhorar a tomada de decisão.
*   **User Success Metrics:** Reduzir o tempo de registro por turma, zerar erros de transcrição e gerar relatórios em minutos.
*   **KPIs:** Redução no tempo de encaminhamento para programas (ex: "Menina dos Olhos"), 100% de adoção pelos avaliadores, eliminação do retrabalho.

## MVP Scope

*   **Core Features:** Autenticação, Gestão de dados base (importação), Dashboard do Avaliador, Interface de Avaliação Rápida com salvamento local, Cálculos automáticos, Dashboard de Gestão com filtros e exportação.
*   **Out of Scope for MVP:** Geração de documentos PDF, funcionalidade PWA offline completa, portal para pais/escolas.

## Technical Considerations

*   **Frontend:** SvelteKit (latest), Shadcn-svelte (latest), eCharts (latest), TailwindCSS v4.1 (sem `tailwind.config.js`).
*   **Backend/Database:** Neon PostgreSQL 17.
*   **Validação:** Preferência por Zod.
*   **Autenticação:** Google OAuth 2.0.
*   **Arquitetura:** Coleta de dados "mobile-first", dashboards "desktop-first".
*   **Ambiente de Desenvolvimento:** Windows 11, VSCode com extensão Claude Code, Neon DB, Playwright, Context7.
*   **Rede:** Utilizar `::1` para `localhost`.

## Constraints & Assumptions

*   **Restrição:** Deve funcionar em conexões de baixa qualidade.
*   **Premissa:** A Secretaria de Educação fornecerá os dados de matrícula anualmente em formato de planilha.
*   **Premissa:** Os avaliadores terão acesso a dispositivos móveis modernos.

## Risks & Open Questions

*   **Risco:** Adoção do sistema pode exigir treinamento. **Mitigação:** Interface extremamente intuitiva.
*   **Risco:** Qualidade dos dados importados pode ser inconsistente. **Mitigação:** Permitir correção dos dados pelos avaliadores.
*   **Questão em Aberto:** Qual o processo exato para a importação da planilha de matrículas?