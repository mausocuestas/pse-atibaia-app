# Visual Acuity Data Model Corrections

## Context

During QA testing of Story 2.5 (Visual Acuity Form Implementation), a critical architectural flaw was discovered in the database design. The initial implementation incorrectly assumed that only one visual acuity evaluation per student per year was needed.

## Problem Identified

**Original Design Flaw**: Migration `001_add_visual_acuity_unique_constraint.sql` added a UNIQUE constraint on `(aluno_id, ano_referencia)`, which prevented:
- Retests for students who failed initial screening
- Longitudinal studies tracking vision changes throughout the year
- Multiple evaluations due to data entry corrections or medical follow-ups

## Architectural Decisions

Based on QA findings and real-world requirements, the following architectural corrections were made:

### 1. **Multiple Evaluations Per Student Per Year** ✅
- **Decision**: Allow unlimited evaluations per student per year
- **Rationale**: Support retests, longitudinal studies, and medical follow-ups
- **Implementation**: Remove UNIQUE constraint via migration 002

### 2. **Data Integrity via CHECK Constraints** ✅
- **Decision**: Enforce acuity value ranges at database level
- **Rationale**: Prevent invalid data entry (values outside 0.0-1.0 range)
- **Implementation**: Add CHECK constraints via migration 003

### 3. **Query Optimization for Chronological Access** ✅
- **Decision**: Create composite index on (aluno_id, avaliado_em DESC)
- **Rationale**: Optimize common query pattern of fetching student evaluations chronologically
- **Implementation**: Add composite index via migration 004

## Migrations to Apply

Execute these migrations in order on your database:

```bash
# 1. Remove the incorrect UNIQUE constraint
psql $DATABASE_URL -f app/src/lib/server/db/migrations/002_remove_visual_acuity_unique_constraint.sql

# 2. Add CHECK constraints for data validation
psql $DATABASE_URL -f app/src/lib/server/db/migrations/003_add_visual_acuity_check_constraints.sql

# 3. Add composite index for performance
psql $DATABASE_URL -f app/src/lib/server/db/migrations/004_add_visual_acuity_composite_index.sql
```

## Verification

After applying migrations, verify with:

```sql
-- Verify UNIQUE constraint is removed
SELECT conname, contype
FROM pg_constraint
WHERE conrelid = 'pse.avaliacoes_acuidade_visual'::regclass
  AND conname = 'avaliacoes_acuidade_visual_aluno_ano_unique';
-- Should return 0 rows

-- Verify CHECK constraints are in place
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'pse.avaliacoes_acuidade_visual'::regclass
  AND contype = 'c';
-- Should return 4 CHECK constraints

-- Verify composite index exists
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'avaliacoes_acuidade_visual'
  AND indexname = 'idx_acuidade_aluno_data_chrono';
-- Should return 1 row
```

## Impact Analysis

### Breaking Changes
- ❌ **None** - These migrations are additive/corrective only

### Performance Impact
- ✅ **Improved** - Composite index will speed up chronological queries
- ✅ **Minimal overhead** - CHECK constraints add negligible validation time

### Data Migration Required
- ❌ **No data migration needed** - All changes are schema-only

## Related Documentation

- **Architecture**: [docs/fullstack-architecture.md](../../docs/fullstack-architecture.md) - Section 3 (Data Models)
- **Story**: [docs/stories/2.5.implementacao-do-formulario-de-acuidade-visual.md](../../docs/stories/2.5.implementacao-do-formulario-de-acuidade-visual.md)
- **QA Gate**: [docs/qa/gates/2.5-implementacao-do-formulario-de-acuidade-visual.yml](../../docs/qa/gates/2.5-implementacao-do-formulario-de-acuidade-visual.yml)

## Rollback Plan

If needed, rollback in reverse order:

```sql
-- Remove composite index
DROP INDEX IF EXISTS pse.idx_acuidade_aluno_data_chrono;

-- Remove CHECK constraints
ALTER TABLE pse.avaliacoes_acuidade_visual
  DROP CONSTRAINT IF EXISTS check_olho_direito_range,
  DROP CONSTRAINT IF EXISTS check_olho_esquerdo_range,
  DROP CONSTRAINT IF EXISTS check_olho_direito_reteste_range,
  DROP CONSTRAINT IF EXISTS check_olho_esquerdo_reteste_range;

-- Re-add UNIQUE constraint (NOT RECOMMENDED)
-- ALTER TABLE pse.avaliacoes_acuidade_visual
-- ADD CONSTRAINT avaliacoes_acuidade_visual_aluno_ano_unique
-- UNIQUE (aluno_id, ano_referencia);
```

---

**Author**: Winston (System Architect)
**Date**: 2025-10-26
**Related Story**: 2.5 - Visual Acuity Form Implementation
**QA Finding**: Multiple evaluations per student per year required
