/**
 * Database TypeScript Types
 * Generated based on db/schemas/initial_schema.sql
 */

// ============================================================================
// PSE Schema Types
// ============================================================================

export interface AvaliacaoAcuidadeVisual {
	id: number;
	aluno_id: number;
	escola_id: number | null;
	profissional_id: number | null;
	usf_id: number | null;
	avaliado_em: Date;
	ano_referencia: number;
	olho_direito: number | null;
	olho_esquerdo: number | null;
	olho_direito_reteste: number | null;
	olho_esquerdo_reteste: number | null;
	tem_problema_od: boolean | null;
	tem_problema_oe: boolean | null;
	observacoes: string | null;
	created_at: Date;
	updated_at: Date;
}

export interface AvaliacaoAntropometrica {
	id: number;
	aluno_id: number;
	escola_id: number | null;
	profissional_id: number | null;
	usf_id: number | null;
	avaliado_em: Date;
	ano_referencia: number;
	peso_kg: number;
	altura_cm: number;
	data_nascimento: Date;
	sexo: string;
	imc: number | null;
	classificacao_cdc: string | null;
	observacoes: string | null;
	created_at: Date;
	updated_at: Date;
}

export interface AvaliacaoOdontologica {
	id: number;
	aluno_id: number;
	escola_id: number | null;
	profissional_id: number | null;
	usf_id: number | null;
	avaliado_em: Date;
	ano_referencia: number;
	risco: string;
	complemento: string | null;
	classificacao_completa: string | null;
	precisa_art: boolean;
	recebeu_atf: boolean;
	has_escovacao: boolean;
	observacoes: string | null;
	created_at: Date;
	updated_at: Date;
	qtde_dentes_art: number;
}

export interface Avaliador {
	id: number;
	profissional_id: number;
	usf_id: number;
	is_ativo: boolean;
	data_entrada: Date;
	data_saida: Date | null;
	observacoes: string | null;
	created_at: Date;
	updated_at: Date;
}

export interface Matricula {
	id: number;
	aluno_id: number;
	escola_id: number;
	ano_letivo: number;
	turma: string;
	periodo: string;
	observacoes: string | null;
	created_at: Date;
	updated_at: Date;
}

export interface Session {
	id: string;
	profissional_id: number;
	email: string;
	expires_at: Date;
	created_at: Date;
}

export interface SessaoEscovacao {
	id: number;
	escola_id: number;
	turma: string;
	profissional_id: number | null;
	usf_id: number | null;
	data_sessao: Date;
	ano_referencia: number;
	total_participantes: number;
	observacoes: string | null;
	created_at: Date;
}

export interface UsfEscola {
	id: number;
	usf_id: number;
	escola_id: number;
	is_ativo: boolean;
	data_vinculo: Date;
	data_desvinculo: Date | null;
	observacoes: string | null;
	created_at: Date;
}

// ============================================================================
// Shared Schema Types
// ============================================================================

export interface CepEndereco {
	id: number;
	cep: string;
	logradouro: string;
	numeracao_ate: string | null;
	bairro: string;
	municipio: string;
	uf: string;
	created_at: Date;
	updated_at: Date;
}

export interface Cid10Completo {
	id: number;
	codigo: string;
	codigo_sem_ponto: string | null;
	classificacao: string | null;
	restricao_sexo: string | null;
	causa_obito: string | null;
	descricao: string;
	descricao_abreviada: string | null;
	referencia: string | null;
	excluidos: string | null;
	data_importacao: Date;
	tipo: string | null;
	tamanho_codigo: number | null;
	codigo_pai: string | null;
	numero_capitulo: number | null;
}

export interface Cliente {
	id: number;
	cliente: string;
	data_nasc: Date | null;
	sexo: string | null;
	cpf: string | null;
	fone: string | null;
	cep: string | null;
	logradouro: string | null;
	numero: string | null;
	complemento: string | null;
	bairro: string | null;
	municipio: string | null;
	uf: string | null;
	nome_responsavel: string | null;
	fone_responsavel: string | null;
	observacoes: string | null;
	ra: string | null;
	cns: string | null;
	ativo: boolean;
	created_at: Date;
	updated_at: Date;
}

export interface Escola {
	inep: number | null;
	escola: string | null;
	nome_educacao: string | null;
	tipo: string | null;
	usf_cnes: number | null;
	logradouro: string | null;
	numero: string | null;
	bairro: string | null;
	cep: string | null;
	municipio: string | null;
	uf: string | null;
	localizacao: string | null;
	latitude: number | null;
	longitude: number | null;
	mapa: string | null;
	fone: string | null;
	contato: string | null;
	email: string | null;
	ativo: string | null;
}

export interface Estabelecimento {
	id: number;
	estabelecimento: string;
	nome_oficial: string;
	tipo_estabelecimento: string;
	cnes: number | null;
	logradouro: string;
	numero: string;
	complemento: string | null;
	bairro: string;
	cep: string | null;
	municipio: string;
	uf: string;
	latitude: number | null;
	longitude: number | null;
	ativo: boolean;
	created_at: Date;
	updated_at: Date;
}

export interface Profissional {
	id: number;
	nome_profissional: string;
	data_nasc: Date | null;
	sexo: string | null;
	cpf: string | null;
	matricula: string | null;
	fone: string | null;
	conta_google: string | null;
	observacoes: string | null;
	created_at: Date;
	updated_at: Date;
}
