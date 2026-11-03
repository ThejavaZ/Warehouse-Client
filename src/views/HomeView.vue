<script setup lang="ts">
import { useAuthStore } from "../stores/auth";

// Vista de inicio: punto de entrada y acceso rápido a los módulos.
const auth = useAuthStore();
</script>

<template>
  <section class="space-y-8">
    <!-- Hero -->
    <div class="rounded-xl border border-primary-100 bg-white p-8 shadow-sm">
      <div class="flex items-center gap-3">
        <span
          class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600 text-lg font-bold text-white"
          aria-hidden="true"
        >
          W
        </span>
        <div>
          <h2 class="text-2xl font-semibold tracking-tight">Warehouse</h2>
          <p class="text-sm text-slate-500">Gestión de almacén</p>
        </div>
      </div>

      <p class="mt-4 max-w-2xl text-slate-600">
        Cliente de la API de gestión de almacén. Autentícate para acceder a los
        endpoints protegidos.
      </p>

      <!-- Accesos: los módulos protegidos, o el login si no hay sesión -->
      <div class="mt-6 flex flex-wrap gap-3">
        <template v-if="auth.isAuthenticated">
          <RouterLink :to="{ name: 'users' }" class="btn-primary">
            Usuarios
          </RouterLink>
          <RouterLink :to="{ name: 'products' }" class="btn-secondary">
            Productos
          </RouterLink>
          <RouterLink :to="{ name: 'warehouses' }" class="btn-secondary">
            Almacenes
          </RouterLink>
          <RouterLink :to="{ name: 'inventory' }" class="btn-secondary">
            Inventario
          </RouterLink>
        </template>

        <RouterLink v-else :to="{ name: 'login' }" class="btn-primary">
          Iniciar sesión
        </RouterLink>
      </div>
    </div>

    <!-- Las tres piezas de la paleta, a modo de leyenda -->
    <div class="grid gap-4 sm:grid-cols-3">
      <div class="rounded-lg border border-slate-200 bg-white p-4">
        <span class="block h-8 w-8 rounded-md bg-primary-600" aria-hidden="true" />
        <p class="mt-3 text-sm font-medium">Morado · .NET</p>
        <p class="mt-1 text-xs text-slate-500">Acciones principales y foco</p>
      </div>

      <div class="rounded-lg border border-slate-200 bg-white p-4">
        <span class="block h-8 w-8 rounded-md bg-accent-500" aria-hidden="true" />
        <p class="mt-3 text-sm font-medium">Verde · Vue</p>
        <p class="mt-1 text-xs text-slate-500">Acentos y elementos activos</p>
      </div>

      <div class="rounded-lg border border-slate-200 bg-white p-4">
        <span class="block h-8 w-8 rounded-md bg-success-900" aria-hidden="true" />
        <p class="mt-3 text-sm font-medium">Verde oscuro · Éxito</p>
        <p class="mt-1 text-xs text-slate-500">Confirmaciones y estados OK</p>
      </div>
    </div>
  </section>
</template>
