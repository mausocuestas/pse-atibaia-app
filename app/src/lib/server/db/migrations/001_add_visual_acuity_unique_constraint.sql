-- Migration: Add unique constraint to avaliacoes_acuidade_visual
-- This constraint is needed for UPSERT operations on (aluno_id, ano_referencia)

-- Add unique constraint to ensure one visual acuity evaluation per student per year
ALTER TABLE pse.avaliacoes_acuidade_visual
ADD CONSTRAINT avaliacoes_acuidade_visual_aluno_ano_unique
UNIQUE (aluno_id, ano_referencia);
