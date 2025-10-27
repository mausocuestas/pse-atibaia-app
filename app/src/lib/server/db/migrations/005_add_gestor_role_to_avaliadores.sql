-- Migration 005: Add gestor role support to avaliadores table
-- This allows evaluators to also have manager privileges
-- Story: 3.1 - Dashboard do Gestor

-- Add is_gestor column to pse.avaliadores
ALTER TABLE pse.avaliadores
ADD COLUMN IF NOT EXISTS is_gestor BOOLEAN DEFAULT false NOT NULL;

-- Add comment to explain the column
COMMENT ON COLUMN pse.avaliadores.is_gestor IS 'Indica se o avaliador também tem permissões de gestor para acessar dashboards gerenciais';

-- Optional: Create an index for faster queries filtering by gestor role
CREATE INDEX IF NOT EXISTS idx_avaliadores_is_gestor ON pse.avaliadores(is_gestor) WHERE is_gestor = true;
