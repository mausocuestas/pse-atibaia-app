-- Migration: Add CHECK constraints for visual acuity values
-- Reason: Ensure data integrity by validating that acuity values are within valid range (0.0-1.0)
-- Related: Story 2.5 - Visual Acuity Form Implementation
-- Architecture: docs/fullstack-architecture.md - Section 5 (AvaliacaoVisual)

-- Add CHECK constraints to ensure visual acuity values are between 0.0 and 1.0
-- These constraints enforce domain rules at the database level

ALTER TABLE pse.avaliacoes_acuidade_visual
ADD CONSTRAINT check_olho_direito_range
  CHECK (olho_direito IS NULL OR (olho_direito >= 0.0 AND olho_direito <= 1.0));

ALTER TABLE pse.avaliacoes_acuidade_visual
ADD CONSTRAINT check_olho_esquerdo_range
  CHECK (olho_esquerdo IS NULL OR (olho_esquerdo >= 0.0 AND olho_esquerdo <= 1.0));

ALTER TABLE pse.avaliacoes_acuidade_visual
ADD CONSTRAINT check_olho_direito_reteste_range
  CHECK (olho_direito_reteste IS NULL OR (olho_direito_reteste >= 0.0 AND olho_direito_reteste <= 1.0));

ALTER TABLE pse.avaliacoes_acuidade_visual
ADD CONSTRAINT check_olho_esquerdo_reteste_range
  CHECK (olho_esquerdo_reteste IS NULL OR (olho_esquerdo_reteste >= 0.0 AND olho_esquerdo_reteste <= 1.0));

-- Add comments to document the constraints
COMMENT ON CONSTRAINT check_olho_direito_range ON pse.avaliacoes_acuidade_visual
  IS 'Ensures right eye acuity values are between 0.0 (worst) and 1.0 (perfect vision)';

COMMENT ON CONSTRAINT check_olho_esquerdo_range ON pse.avaliacoes_acuidade_visual
  IS 'Ensures left eye acuity values are between 0.0 (worst) and 1.0 (perfect vision)';

COMMENT ON CONSTRAINT check_olho_direito_reteste_range ON pse.avaliacoes_acuidade_visual
  IS 'Ensures right eye retest acuity values are between 0.0 (worst) and 1.0 (perfect vision)';

COMMENT ON CONSTRAINT check_olho_esquerdo_reteste_range ON pse.avaliacoes_acuidade_visual
  IS 'Ensures left eye retest acuity values are between 0.0 (worst) and 1.0 (perfect vision)';
