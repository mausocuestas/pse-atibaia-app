import type { DefaultSession } from '@auth/core/types';

declare module '@auth/core/types' {
	interface Session {
		user: {
			profissional_id: number;
			avaliador_id: number;
			usf_id: number;
			nome_profissional: string;
			name: string;
			email: string;
		} & DefaultSession['user'];
	}

	interface User {
		profissional_id?: number;
		avaliador_id?: number;
		usf_id?: number;
		nome_profissional?: string;
	}
}

declare module '@auth/core/jwt' {
	interface JWT {
		profissional_id?: number;
		avaliador_id?: number;
		usf_id?: number;
		nome_profissional?: string;
	}
}

export {};

