import postgres from 'postgres';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

const sql = postgres(process.env.DATABASE_URL);

async function addConstraint() {
	try {
		console.log('🔧 Adding unique constraint to avaliacoes_acuidade_visual...');

		await sql`
			ALTER TABLE pse.avaliacoes_acuidade_visual
			ADD CONSTRAINT avaliacoes_acuidade_visual_aluno_ano_unique
			UNIQUE (aluno_id, ano_referencia);
		`;

		console.log('✅ Constraint added successfully!');
	} catch (error) {
		if (error.code === '42P07') {
			console.log('ℹ️  Constraint already exists');
		} else {
			console.error('❌ Error adding constraint:', error.message);
			throw error;
		}
	} finally {
		await sql.end();
	}
}

addConstraint().catch(err => {
	console.error('Fatal error:', err);
	process.exit(1);
});
