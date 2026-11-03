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
      <!-- Marca: cuadrado morado con la inicial, verde Vue de acento -->
      <RouterLink to="/" class="flex items-center gap-2">
        <span
          class="flex h-8 w-8 items-center justify-center rounded-md bg-primary-600 text-sm font-bold text-white"
          aria-hidden="true"
        >
          W
        </span>
        <span class="text-base font-semibold tracking-tight">Warehouse</span>
      </RouterLink>

      <nav class="flex items-center gap-4 text-sm">
        <RouterLink
          to="/"
          class="text-slate-600 hover:text-primary-700"
          active-class="text-primary-700 font-medium"
          exact-active-class="text-primary-700 font-medium"
        >
          Inicio
        </RouterLink>

        <template v-if="auth.isAuthenticated">
          <RouterLink
            :to="{ name: 'users' }"
            class="text-slate-600 hover:text-primary-700"
            active-class="text-primary-700 font-medium"
          >
            Usuarios
          </RouterLink>

          <RouterLink
            :to="{ name: 'products' }"
            class="text-slate-600 hover:text-primary-700"
            active-class="text-primary-700 font-medium"
          >
            Productos
          </RouterLink>

          <RouterLink
            :to="{ name: 'warehouses' }"
            class="text-slate-600 hover:text-primary-700"
            active-class="text-primary-700 font-medium"
          >
            Almacenes
          </RouterLink>

          <span class="flex items-center gap-2 text-slate-500">
            <span
              class="h-2 w-2 rounded-full bg-accent-500"
              aria-hidden="true"
            />
            {{ auth.email }}
          </span>

          <button
            type="button"
            class="btn-secondary btn-sm"
            @click="onLogout"
          >
            Salir
          </button>
        </template>

        <RouterLink
          v-else
          :to="{ name: 'login' }"
          class="rounded-md bg-primary-600 px-3 py-1.5 font-medium text-white hover:bg-primary-700"
        >
          Entrar
        </RouterLink>
      </nav>
    </div>
  </header>
</template>
