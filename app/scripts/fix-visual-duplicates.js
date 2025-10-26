import postgres from 'postgres';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

const sql = postgres(process.env.DATABASE_URL);

async function fixDuplicates() {
	try {
		console.log('🔍 Checking for duplicates...');

		// Find duplicates
		const duplicates = await sql`
			SELECT aluno_id, ano_referencia, COUNT(*) as count
			FROM pse.avaliacoes_acuidade_visual
			GROUP BY aluno_id, ano_referencia
			HAVING COUNT(*) > 1
		`;

		console.log(`Found ${duplicates.length} duplicates`);

		if (duplicates.length > 0) {
			console.log('🗑️  Removing duplicates (keeping most recent)...');

			// For each duplicate, keep only the most recent one (highest ID)
			for (const dup of duplicates) {
				await sql`
					DELETE FROM pse.avaliacoes_acuidade_visual
					WHERE aluno_id = ${dup.aluno_id}
					AND ano_referencia = ${dup.ano_referencia}
					AND id NOT IN (
						SELECT MAX(id)
						FROM pse.avaliacoes_acuidade_visual
						WHERE aluno_id = ${dup.aluno_id}
						AND ano_referencia = ${dup.ano_referencia}
					)
				`;
				console.log(`  ✓ Cleaned duplicates for aluno ${dup.aluno_id}, ano ${dup.ano_referencia}`);
			}
		}

		console.log('🔧 Adding unique constraint...');

		await sql`
			ALTER TABLE pse.avaliacoes_acuidade_visual
			ADD CONSTRAINT avaliacoes_acuidade_visual_aluno_ano_unique
			UNIQUE (aluno_id, ano_referencia);
		`;

		console.log('✅ Migration completed successfully!');
	} catch (error) {
		if (error.code === '42P07') {
			console.log('ℹ️  Constraint already exists');
		} else {
			console.error('❌ Error:', error.message);
			throw error;
		}
	} finally {
		await sql.end();
	}
}

fixDuplicates().catch(err => {
	console.error('Fatal error:', err);
	process.exit(1);
});
