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
      <p class="mt-4 text-xs text-muted-foreground">
        © 2025 Secretaria Municipal de Saúde - TI Saúde e UAC
      </p>
    </div>
  </div>
</div>