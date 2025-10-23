<script lang="ts">
  import * as Card from "$lib/components/ui/card/index.js";
  import {
    FieldGroup,
    Field,
    FieldLabel,
    FieldDescription,
  } from "$lib/components/ui/field/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { cn } from "$lib/utils.js";
  import type { HTMLAttributes } from "svelte/elements";

  interface Props extends HTMLAttributes<HTMLDivElement> {
    onGoogleSignIn: () => Promise<void>;
    isLoading: boolean;
    isAuthenticated: boolean;
    userName?: string;
  }

  let {
    class: className,
    onGoogleSignIn,
    isLoading,
    isAuthenticated,
    userName,
    ...restProps
  }: Props = $props();
</script>

<div class={cn("flex flex-col gap-6", className)} {...restProps}>
  <Card.Root class="overflow-hidden p-0">
    <Card.Content class="grid p-0 md:grid-cols-2">
      <div class="p-6 md:p-8">
        <FieldGroup>
          <div class="flex flex-col items-center gap-2 text-center">
            <img
              src="/logoPEA.png"
              alt="Programa Saúde na Escola - PSE Atibaia"
              class="mb-4 h-24 w-auto object-contain"
            />
            <h1 class="text-2xl font-bold">Bem-vindo ao PSE Atibaia</h1>
            <p class="text-balance text-muted-foreground">
              Sistema de Avaliação de Alunos
            </p>
          </div>

          <div class="rounded-lg border border-sky-200 bg-sky-50 p-4 dark:border-sky-800 dark:bg-sky-950">
            <div class="flex items-start gap-3">
              <svg
                class="mt-0.5 h-5 w-5 flex-shrink-0 text-sky-700 dark:text-sky-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z"
                  clip-rule="evenodd"
                />
              </svg>
              <div class="flex-1 text-sm">
                <p class="font-semibold text-sky-900 dark:text-sky-300">Sistema Fechado</p>
                <p class="mt-1 text-sky-800 dark:text-sky-400">
                  Apenas profissionais autorizados podem acessar. Entre em contato com o
                  administrador do sistema para solicitar acesso.
                </p>
              </div>
            </div>
          </div>

          {#if isAuthenticated}
            <Field class="pt-2">
              <p class="text-center mb-4">Olá, {userName}!</p>
              <Button href="/dashboard" class="w-full">
                Ir para Dashboard
              </Button>
            </Field>
          {:else}
            <Field class="pt-2">
              <FieldLabel class="text-center">Faça login com sua conta Google autorizada</FieldLabel>
              <Button
                type="button"
                onclick={onGoogleSignIn}
                disabled={isLoading}
                class="w-full"
              >
                {#if isLoading}
                  <svg
                    class="mr-2 h-4 w-4 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      class="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      stroke-width="4"
                    ></circle>
                    <path
                      class="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Autenticando...
                {:else}
                  <svg
                    class="mr-2 h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                      fill="currentColor"
                    />
                  </svg>
                  Entrar com Google
                {/if}
              </Button>
            </Field>

            <FieldDescription class="text-center text-xs leading-relaxed">
              Ao continuar, você concorda com os termos de uso do sistema PSE Atibaia e confirma
              que é um profissional autorizado da rede municipal de saúde.
            </FieldDescription>
          {/if}
        </FieldGroup>
      </div>
      <div class="relative hidden bg-muted md:block">
        <img
          src="/imagem-login.png"
          alt="PSE Atibaia - Saúde na Escola"
          class="absolute inset-0 h-full w-full object-cover dark:brightness-[0.8]"
        />
      </div>
    </Card.Content>
  </Card.Root>
</div>
