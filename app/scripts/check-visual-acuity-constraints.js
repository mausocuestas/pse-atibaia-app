/**
 * Visual Acuity Database Constraints Checker
 *
 * This script verifies the database schema state for visual acuity evaluations.
 * Use this to confirm that migrations 002-004 have been applied correctly.
 *
 * Usage:
 *   node scripts/check-visual-acuity-constraints.js
 *
 * Related: Story 2.5 QA - Data Model Corrections
 */

import postgres from 'postgres';
import { DATABASE_URL } from '$env/static/private';

const sql = postgres(DATABASE_URL);

async function checkConstraints() {
  console.log('🔍 Checking Visual Acuity Database Constraints...\n');

  try {
    // Check 1: Verify UNIQUE constraint is removed
    console.log('1️⃣  Checking UNIQUE constraint (should NOT exist)...');
    const uniqueConstraint = await sql`
      SELECT conname, contype
      FROM pg_constraint
      WHERE conrelid = 'pse.avaliacoes_acuidade_visual'::regclass
        AND conname = 'avaliacoes_acuidade_visual_aluno_ano_unique'
    `;

    if (uniqueConstraint.length === 0) {
      console.log('   ✅ UNIQUE constraint successfully removed\n');
    } else {
      console.log('   ❌ UNIQUE constraint still exists - Migration 002 not applied!\n');
    }

    // Check 2: Verify CHECK constraints exist
    console.log('2️⃣  Checking CHECK constraints (should have 4)...');
    const checkConstraints = await sql`
      SELECT conname, pg_get_constraintdef(oid) as definition
      FROM pg_constraint
      WHERE conrelid = 'pse.avaliacoes_acuidade_visual'::regclass
        AND contype = 'c'
      ORDER BY conname
    `;

    const expectedChecks = [
      'check_olho_direito_range',
      'check_olho_direito_reteste_range',
      'check_olho_esquerdo_range',
      'check_olho_esquerdo_reteste_range'
    ];

    const foundChecks = checkConstraints.map(c => c.conname);
    const allFound = expectedChecks.every(expected => foundChecks.includes(expected));

    if (allFound && checkConstraints.length === 4) {
      console.log('   ✅ All 4 CHECK constraints found:');
      checkConstraints.forEach(c => {
        console.log(`      - ${c.conname}`);
      });
      console.log('');
    } else {
      console.log(`   ❌ CHECK constraints incomplete - Migration 003 not applied!`);
      console.log(`      Expected: ${expectedChecks.length}, Found: ${checkConstraints.length}\n`);
    }

    // Check 3: Verify composite index exists
    console.log('3️⃣  Checking composite index...');
    const compositeIndex = await sql`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE schemaname = 'pse'
        AND tablename = 'avaliacoes_acuidade_visual'
        AND indexname = 'idx_acuidade_aluno_data_chrono'
    `;

    if (compositeIndex.length === 1) {
      console.log('   ✅ Composite index found:');
      console.log(`      ${compositeIndex[0].indexdef}\n`);
    } else {
      console.log('   ❌ Composite index not found - Migration 004 not applied!\n');
    }

    // Summary
    console.log('━'.repeat(60));
    const allPassed =
      uniqueConstraint.length === 0 &&
      allFound &&
      checkConstraints.length === 4 &&
      compositeIndex.length === 1;

    if (allPassed) {
      console.log('✅ All migrations applied correctly!');
      console.log('   Database schema is ready for Story 2.5');
    } else {
      console.log('⚠️  Some migrations are missing or incomplete');
      console.log('   Please apply pending migrations:');
      if (uniqueConstraint.length > 0) {
        console.log('   - 002_remove_visual_acuity_unique_constraint.sql');
      }
      if (!allFound || checkConstraints.length !== 4) {
        console.log('   - 003_add_visual_acuity_check_constraints.sql');
      }
      if (compositeIndex.length === 0) {
        console.log('   - 004_add_visual_acuity_composite_index.sql');
      }
    }
    console.log('━'.repeat(60));

  } catch (error) {
    console.error('❌ Error checking constraints:', error.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

checkConstraints();
