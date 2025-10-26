-- Migration: Remove unique constraint from avaliacoes_acuidade_visual
-- Reason: QA testing revealed that the system needs to support multiple evaluations
--         per student per year (e.g., retests, longitudinal studies)
-- Related: Story 2.5 - Visual Acuity Form Implementation
-- Reverts: 001_add_visual_acuity_unique_constraint.sql

-- Remove the unique constraint that was preventing multiple evaluations per student per year
ALTER TABLE pse.avaliacoes_acuidade_visual
DROP CONSTRAINT IF EXISTS avaliacoes_acuidade_visual_aluno_ano_unique;
