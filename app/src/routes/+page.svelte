<script lang="ts">
  import LoginForm from "$lib/components/login-form.svelte";
  import { signIn } from "@auth/sveltekit/client";
  import type { PageData } from "./$types";

  export let data: PageData;

  let isLoading = false;

  async function handleSignIn() {
    isLoading = true;
    try {
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch (error) {
      console.error("Sign in error:", error);
      isLoading = false;
    }
  }
</script>

<div class="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
  <div class="w-full max-w-sm md:max-w-3xl">
    <LoginForm
      onGoogleSignIn={handleSignIn}
      isLoading={isLoading}
      isAuthenticated={!!data.session}
      userName={data.session?.user?.name ?? undefined}
    />

    <div class="mt-6 text-center">
      <h2 class="text-lg font-semibold text-foreground">PSE Atibaia - Programa Saúde na Escola</h2>
      <p class="mt-1 text-sm text-muted-foreground">
        Gestão de avaliações de saúde de alunos da rede municipal de ensino
      </p>

      <!-- Public Dashboard Link -->
      <div class="mt-4">
        <a
          href="/dados-publicos"
          class="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
        >
          <svg
            class="mr-2 h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
          Ver Dados Públicos - Transparência
        </a>
      </div>

      <p class="mt-4 text-xs text-muted-foreground">
        © 2025 Secretaria Municipal de Saúde - TI Saúde e UAC
      </p>
    </div>
  </div>
</div>
