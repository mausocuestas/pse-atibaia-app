import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [sveltekit()],
		server: { // <-- ADICIONE ESTE BLOCO
		port: 5178,
		strictPort: true, // Garante que ele use essa porta ou falhe, em vez de tentar outra
	},
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
		globals: true,
		environment: 'node'
	}
});
