<script lang="ts">
  import { Button } from "$lib/components/ui/button";
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

<div class="flex justify-center items-center h-screen">
  <div class="text-center">
    <h1 class="text-2xl font-bold mb-4">Projeto PSE Atibaia</h1>
    <p class="text-muted-foreground mb-6">Sistema de Avaliação de Unidades de Saúde</p>

    {#if data.session}
      <p class="mb-4">Bem-vindo, {data.session.user?.name}!</p>
      <Button href="/dashboard">Ir para Dashboard</Button>
    {:else}
      <Button onclick={handleSignIn} disabled={isLoading}>
        {isLoading ? "Carregando..." : "Login com Google"}
      </Button>
    {/if}
  </div>
</div>