<script setup lang="ts">
import { useRouter } from "vue-router";
import { useAuthStore } from "../../stores/auth";

const auth = useAuthStore();
const router = useRouter();

async function onLogout(): Promise<void> {
  await auth.logout();
  await router.push({ name: "login" });
}
</script>

<template>
  <header class="border-b border-slate-200 bg-white">
    <div class="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
      <RouterLink to="/" class="text-base font-semibold tracking-tight">
        Warehouse
      </RouterLink>

      <nav class="flex items-center gap-4 text-sm">
        <RouterLink to="/" class="text-slate-600 hover:text-slate-900">
          Inicio
        </RouterLink>

        <template v-if="auth.isAuthenticated">
          <span class="text-slate-500">{{ auth.email }}</span>
          <button
            type="button"
            class="rounded-md border border-slate-300 px-3 py-1.5 hover:bg-slate-100"
            @click="onLogout"
          >
            Salir
          </button>
        </template>

        <RouterLink
          v-else
          :to="{ name: 'login' }"
          class="rounded-md bg-slate-900 px-3 py-1.5 font-medium text-white hover:bg-slate-700"
        >
          Entrar
        </RouterLink>
      </nav>
    </div>
  </header>
</template>
