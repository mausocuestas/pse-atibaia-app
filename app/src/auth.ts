import { SvelteKitAuth } from '@auth/sveltekit';
import Google from '@auth/sveltekit/providers/google';
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from '$env/static/private';
import { getAuthorizedUser } from '$lib/server/db/queries/auth';

export const { handle, signIn, signOut } = SvelteKitAuth({
	trustHost: true,
	providers: [
		Google({
			clientId: GOOGLE_CLIENT_ID,
			clientSecret: GOOGLE_CLIENT_SECRET
		})
	],
	callbacks: {
		async signIn({ user }) {
			// Verify user is authorized using our database
			if (!user.email) {
				return false;
			}

			const authorizedUser = await getAuthorizedUser(user.email);

			// Deny access if user not found or not active
			if (!authorizedUser) {
				return false;
			}

			return true;
		},
		async jwt({ token, user, account }) {
			// Add custom user data to JWT token after initial sign in
			if (account && user?.email) {
				const authorizedUser = await getAuthorizedUser(user.email);

				if (authorizedUser) {
					token.profissional_id = authorizedUser.profissional_id;
					token.avaliador_id = authorizedUser.avaliador_id;
					token.usf_id = authorizedUser.usf_id;
					token.nome_profissional = authorizedUser.nome_profissional;
				}
			}

			return token;
		},
		async session({ session, token }) {
			// Add custom data from JWT token to session
			if (token) {
				(session.user as any).profissional_id = token.profissional_id as number;
				(session.user as any).avaliador_id = token.avaliador_id as number;
				(session.user as any).usf_id = token.usf_id as number;
				(session.user as any).nome_profissional = token.nome_profissional as string;
			}

			return session;
		}
	},
	pages: {
		signIn: '/',
		error: '/auth/error'
	}
});
