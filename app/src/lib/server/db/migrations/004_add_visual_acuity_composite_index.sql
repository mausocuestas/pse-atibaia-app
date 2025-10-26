-- Migration: Add composite index for chronological queries by student
-- Reason: Optimize queries that fetch a student's visual acuity evaluations in chronological order
-- Related: Story 2.5 - Visual Acuity Form Implementation
-- Architecture: docs/fullstack-architecture.md - Section 4 (Avaliacao - Indexation Note)

-- Create composite index on (aluno_id, avaliado_em) to optimize chronological queries per student
-- This index is more efficient than separate indexes when querying evaluations for a specific student
-- Common query pattern: SELECT * FROM avaliacoes_acuidade_visual WHERE aluno_id = ? ORDER BY avaliado_em DESC

CREATE INDEX idx_acuidade_aluno_data_chrono
ON pse.avaliacoes_acuidade_visual
USING btree (aluno_id, avaliado_em DESC);

-- Add comment to document the index purpose
COMMENT ON INDEX pse.idx_acuidade_aluno_data_chrono
  IS 'Optimizes chronological queries of visual acuity evaluations per student. Supports multiple evaluations per student per year.';
