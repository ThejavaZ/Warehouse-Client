<script setup lang="ts">
import { useAuthStore } from "../stores/auth";

// Vista de inicio: punto de entrada y acceso rápido a los módulos.
const auth = useAuthStore();
</script>

<template>
  <section class="space-y-6">
    <div>
      <h2 class="text-2xl font-semibold tracking-tight">Warehouse</h2>
      <p class="mt-2 max-w-2xl text-slate-600">
        Cliente de la API de gestión de almacén. Autentícate para acceder a los
        endpoints protegidos.
      </p>
    </div>

    <div class="flex gap-3">
      <RouterLink
        v-if="auth.isAuthenticated"
        :to="{ name: 'users' }"
        class="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
      >
        Usuarios
      </RouterLink>

      <RouterLink
        v-else
        :to="{ name: 'login' }"
        class="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
      >
        Iniciar sesión
      </RouterLink>
    </div>
  </section>
</template>
