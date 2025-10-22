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

## Future Migrations

When adding new migrations:

1. Create a new file with format: `XXX_description.sql` (e.g., `001_add_user_roles.sql`)
2. Include both UP and DOWN migration sections if applicable
3. Test migrations on a development database before applying to production
4. Document any breaking changes in commit messages

## Migration Tools

For this project, we use simple SQL files executed via the `postgres` client library.
Future stories may introduce automated migration tooling as needed.

## Schema Modification Guidelines

- **PSE Schema**: Full freedom to modify as needed
- **Shared Schema**: Minimal modifications only, validate with stakeholder before applying

## Reference

See Story 1.2 documentation for initial database setup details.
