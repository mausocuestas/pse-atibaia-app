# Data Model Corrections - Visual Acuity Evaluation

**Date**: 2025-10-26
**Author**: Winston (System Architect)
**Trigger**: Story 2.5 QA Testing Findings
**Impact**: Medium - Schema changes, no data migration required

---

## Executive Summary

QA testing of the Visual Acuity Evaluation form revealed a fundamental flaw in the database design: the system incorrectly enforced a single evaluation per student per year, preventing retests and longitudinal studies. This document details the architectural corrections applied to resolve this issue.

## Changes Overview

### 🏗️ Architecture Documents Updated

1. **[docs/fullstack-architecture.md](../fullstack-architecture.md)**
   - Section 4 (Avaliacao): Added indexation note for composite index
   - Section 5 (AvaliacaoVisual): Added CHECK constraint documentation
   - Removed duplicated code in Avaliacao interface

2. **[docs/architecture/seo-3-data-models-verso-30-corrigida.md](./seo-3-data-models-verso-30-corrigida.md)**
   - Applied same corrections as fullstack-architecture.md
   - Ensures sharded documentation remains in sync

### 🗄️ Database Migrations Created

| Migration | Purpose | Status |
|-----------|---------|--------|
| **002_remove_visual_acuity_unique_constraint.sql** | Remove incorrect UNIQUE constraint on (aluno_id, ano_referencia) | ⏳ Pending |
| **003_add_visual_acuity_check_constraints.sql** | Add CHECK constraints to enforce acuity values between 0.0-1.0 | ⏳ Pending |
| **004_add_visual_acuity_composite_index.sql** | Add composite index (aluno_id, avaliado_em DESC) for performance | ⏳ Pending |

### 📝 Supporting Documentation

1. **[app/scripts/apply-visual-acuity-migrations.md](../../app/scripts/apply-visual-acuity-migrations.md)**
   - Step-by-step migration guide
   - Verification queries
   - Rollback procedures

2. **[app/scripts/check-visual-acuity-constraints.js](../../app/scripts/check-visual-acuity-constraints.js)**
   - Automated verification script
   - Checks migration application status
   - Provides clear pass/fail diagnostics

3. **[app/src/lib/server/db/migrations/README.md](../../app/src/lib/server/db/migrations/README.md)**
   - Updated with migration history table
   - Marked migration 001 as DEPRECATED

## Technical Details

### Problem: UNIQUE Constraint Limitation

**Original Schema**:
```sql
ALTER TABLE pse.avaliacoes_acuidade_visual
ADD CONSTRAINT avaliacoes_acuidade_visual_aluno_ano_unique
UNIQUE (aluno_id, ano_referencia);
```

**Issues**:
- ❌ Prevents retests for students who fail initial screening
- ❌ Blocks longitudinal vision tracking studies
- ❌ Disallows corrections to erroneous evaluations
- ❌ Conflicts with real-world clinical workflows

### Solution 1: Remove UNIQUE Constraint

**New Design**:
- ✅ Allow unlimited evaluations per student per year
- ✅ Use composite index for chronological query optimization
- ✅ Rely on application logic to determine "latest" evaluation

### Solution 2: Add CHECK Constraints

**New Constraints**:
```sql
CHECK (olho_direito IS NULL OR (olho_direito >= 0.0 AND olho_direito <= 1.0))
CHECK (olho_esquerdo IS NULL OR (olho_esquerdo >= 0.0 AND olho_esquerdo <= 1.0))
CHECK (olho_direito_reteste IS NULL OR (olho_direito_reteste >= 0.0 AND olho_direito_reteste <= 1.0))
CHECK (olho_esquerdo_reteste IS NULL OR (olho_esquerdo_reteste >= 0.0 AND olho_esquerdo_reteste <= 1.0))
```

**Benefits**:
- ✅ Database-level data validation
- ✅ Prevents invalid acuity values
- ✅ Documents valid data ranges in schema
- ✅ Complements application-level validation

### Solution 3: Composite Index for Performance

**New Index**:
```sql
CREATE INDEX idx_acuidade_aluno_data_chrono
ON pse.avaliacoes_acuidade_visual
USING btree (aluno_id, avaliado_em DESC);
```

**Benefits**:
- ✅ Optimizes "get student's evaluations chronologically" queries
- ✅ More efficient than separate indexes for this use case
- ✅ Supports ORDER BY avaliado_em DESC without extra sorting

## Migration Instructions

### Prerequisites
- Database backup completed
- Development environment tested
- Stakeholder approval obtained

### Application Steps

1. **Verify current state**:
   ```bash
   node app/scripts/check-visual-acuity-constraints.js
   ```

2. **Apply migrations in order**:
   ```bash
   psql $DATABASE_URL -f app/src/lib/server/db/migrations/002_remove_visual_acuity_unique_constraint.sql
   psql $DATABASE_URL -f app/src/lib/server/db/migrations/003_add_visual_acuity_check_constraints.sql
   psql $DATABASE_URL -f app/src/lib/server/db/migrations/004_add_visual_acuity_composite_index.sql
   ```

3. **Verify migrations applied**:
   ```bash
   node app/scripts/check-visual-acuity-constraints.js
   ```

4. **Test application**:
   - Create multiple evaluations for same student in same year
   - Verify acuity values outside 0.0-1.0 are rejected
   - Confirm chronological queries perform efficiently

## Impact Analysis

### Breaking Changes
**None** - All changes are additive or corrective

### Performance Impact
- ✅ **Improved** - Composite index speeds up common query patterns
- ✅ **Negligible overhead** - CHECK constraints add minimal validation time

### Data Migration Required
**No** - Schema-only changes, existing data remains valid

### Application Code Changes Required
**No** - Application already handles multiple evaluations correctly

## Rollback Plan

If issues arise, rollback in reverse order:

```sql
-- 1. Remove composite index
DROP INDEX IF EXISTS pse.idx_acuidade_aluno_data_chrono;

-- 2. Remove CHECK constraints
ALTER TABLE pse.avaliacoes_acuidade_visual
  DROP CONSTRAINT IF EXISTS check_olho_direito_range,
  DROP CONSTRAINT IF EXISTS check_olho_esquerdo_range,
  DROP CONSTRAINT IF EXISTS check_olho_direito_reteste_range,
  DROP CONSTRAINT IF EXISTS check_olho_esquerdo_reteste_range;

-- 3. Re-add UNIQUE constraint (NOT RECOMMENDED)
-- Only if absolutely necessary for rollback
```

## Lessons Learned

1. **Early QA is Critical**: This flaw would have been costly to fix post-deployment
2. **Test Real Workflows**: Constraint assumptions should be validated against actual clinical workflows
3. **Document Constraints**: All database constraints should be explicitly documented in architecture
4. **Composite Indexes**: Consider query patterns when designing indexes, not just individual columns

## Related Stories

- **Story 2.5**: Visual Acuity Form Implementation
- **Story 1.2**: Initial Database Setup

## References

- [PostgreSQL CHECK Constraints](https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-CHECK-CONSTRAINTS)
- [PostgreSQL Indexes](https://www.postgresql.org/docs/current/indexes-multicolumn.html)
- [Visual Acuity Measurement Standards](https://en.wikipedia.org/wiki/Visual_acuity)

---

**Status**: ⏳ Pending Migration Application
**Next Steps**: Apply migrations to development → test → staging → production
**Approval Required**: Database Administrator
