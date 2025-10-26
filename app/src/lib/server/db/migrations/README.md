# Database Migrations

## Overview

This directory contains database migration files for the PSE BMAD application.

## Initial Schema

The initial database schema is located at `db/schemas/initial_schema.sql` in the project root.
This schema represents the **existing** Neon PostgreSQL database and should be considered
the baseline for all future migrations.

## Migration Strategy

Since we are connecting to an **existing** Neon PostgreSQL database:

1. The initial schema (`db/schemas/initial_schema.sql`) is already applied to the production database
2. This file serves as documentation and reference for the current database state
3. Future migrations should be numbered sequentially (001, 002, etc.) and placed in this directory
4. All migrations should be idempotent when possible

## Migration History

| # | File | Description | Status | Related |
|---|------|-------------|--------|---------|
| 000 | `000_initial_schema.sql` | Initial database schema (baseline) | ✅ Applied | Story 1.2 |
| 001 | `001_add_visual_acuity_unique_constraint.sql` | ⚠️ **DEPRECATED** - Adds unique constraint (aluno_id, ano_referencia) | ❌ Reverted by 002 | Story 2.5 |
| 002 | `002_remove_visual_acuity_unique_constraint.sql` | Removes unique constraint to allow multiple evaluations/year | ⏳ Pending | Story 2.5 QA |
| 003 | `003_add_visual_acuity_check_constraints.sql` | Adds CHECK constraints for acuity values (0.0-1.0 range) | ⏳ Pending | Story 2.5 QA |
| 004 | `004_add_visual_acuity_composite_index.sql` | Adds composite index (aluno_id, avaliado_em) for chronological queries | ⏳ Pending | Story 2.5 QA |

## Future Migrations

When adding new migrations:

1. Create a new file with format: `XXX_description.sql` (e.g., `001_add_user_roles.sql`)
2. Include both UP and DOWN migration sections if applicable
3. Test migrations on a development database before applying to production
4. Document any breaking changes in commit messages
5. Update the Migration History table above

## Migration Tools

For this project, we use simple SQL files executed via the `postgres` client library.
Future stories may introduce automated migration tooling as needed.

## Schema Modification Guidelines

- **PSE Schema**: Full freedom to modify as needed
- **Shared Schema**: Minimal modifications only, validate with stakeholder before applying

## Reference

See Story 1.2 documentation for initial database setup details.
