# Migration 000: Initial Schema (Existing Database)

**Status**: Already applied to Neon PostgreSQL database
**Date**: Pre-existing
**Source**: `db/schemas/initial_schema.sql`

## Description

This migration represents the existing database schema that was already applied to the Neon PostgreSQL database before this application was connected.

## Schemas

- `shared`: Shared municipal data (minimal modifications allowed)
- `pse`: PSE-specific data (full modification freedom)

## Tables

### PSE Schema
- `avaliacoes_acuidade_visual`: Visual acuity assessments
- `avaliacoes_antropometricas`: Anthropometric assessments
- `avaliacoes_odontologicas`: Dental assessments
- `avaliadores`: Evaluators
- `matriculas`: Student enrollments
- `sessions`: User sessions
- `sessoes_escovacao`: Tooth brushing sessions
- `usf_escolas`: USF-School relationships

### Shared Schema
- `cep_enderecos`: ZIP code addresses
- `cid10_completo`: Complete ICD-10 codes
- `clientes`: Clients/Students
- `escolas`: Schools
- `estabelecimentos`: Establishments/Facilities
- `profissionais`: Healthcare professionals

## Notes

- This is a **reference migration** only
- The schema is already applied to the database
- Do not attempt to re-run this migration
- Use `db/schemas/initial_schema.sql` as the source of truth
- All future migrations should build upon this baseline

## Verification

To verify the schema is correctly applied, run:

```sql
SELECT schema_name FROM information_schema.schemata
WHERE schema_name IN ('pse', 'shared');
```

Expected result: Both `pse` and `shared` schemas should exist.
