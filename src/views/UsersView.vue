<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useUsersStore } from "../stores/users";

const users = useUsersStore();

/** Texto del filtro de búsqueda; se sincroniza con el store al enviar. */
const searchInput = ref("");

function onSearch(): void {
  users.search = searchInput.value;
  users.applyFilters();
}

/** El selector y el orden cambian el resultado sin necesidad de botón. */
function onFilterChange(): void {
  users.applyFilters();
}

function clearFilters(): void {
  searchInput.value = "";
  users.resetFilters();
}

onMounted(() => void users.load());
</script>

<template>
  <section class="space-y-4">
    <div>
      <h2 class="text-2xl font-semibold tracking-tight">Usuarios</h2>
      <p class="mt-1 text-sm text-slate-600">
        <code class="rounded bg-slate-200 px-1">GET /api/User</code>
        · {{ users.totalItems }} resultado{{ users.totalItems === 1 ? "" : "s" }}
      </p>
    </div>

    <!-- Filtros -->
    <form class="flex flex-wrap items-end gap-3" @submit.prevent="onSearch">
      <div class="min-w-56 flex-1">
        <label for="search" class="block text-sm font-medium">Buscar</label>
        <input
          id="search"
          v-model="searchInput"
          type="search"
          placeholder="Nombre o correo"
          class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
      </div>

      <div>
        <label for="status" class="block text-sm font-medium">Estado</label>
        <select
          id="status"
          v-model="users.isActive"
          class="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          @change="onFilterChange"
        >
          <option :value="null">Todos</option>
          <option :value="true">Activos</option>
          <option :value="false">De baja</option>
        </select>
      </div>

      <label class="flex items-center gap-2 py-2 text-sm">
        <input
          v-model="users.orderDesc"
          type="checkbox"
          class="rounded border-slate-300"
          @change="onFilterChange"
        />
        Más recientes primero
      </label>

      <button
        type="submit"
        class="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-100"
      >
        Buscar
      </button>

      <button
        type="button"
        class="rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
        @click="clearFilters"
      >
        Limpiar
      </button>
    </form>

    <p
      v-if="users.error"
      class="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700"
    >
      {{ users.error }}
    </p>

    <!-- Listado -->
    <div class="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table class="min-w-full divide-y divide-slate-200 text-sm">
        <thead class="bg-slate-50 text-left text-slate-500">
          <tr>
            <th class="px-4 py-2 font-medium">ID</th>
            <th class="px-4 py-2 font-medium">Nombre</th>
            <th class="px-4 py-2 font-medium">Correo</th>
            <th class="px-4 py-2 font-medium">Estado</th>
          </tr>
        </thead>

        <tbody class="divide-y divide-slate-100">
          <tr v-if="users.loading && users.items.length === 0">
            <td colspan="4" class="px-4 py-6 text-center text-slate-500">
              Cargando…
            </td>
          </tr>

          <tr v-else-if="users.items.length === 0">
            <td colspan="4" class="px-4 py-6 text-center text-slate-500">
              No hay usuarios que coincidan con los filtros.
            </td>
          </tr>

          <template v-else>
            <tr v-for="user in users.items" :key="user.id" class="hover:bg-slate-50">
              <td class="px-4 py-2 text-slate-500">{{ user.id }}</td>
              <td class="px-4 py-2 font-medium">{{ user.name ?? "—" }}</td>
              <td class="px-4 py-2 text-slate-600">{{ user.email ?? "—" }}</td>
              <td class="px-4 py-2">
                <span
                  class="rounded-full px-2 py-0.5 text-xs font-medium"
                  :class="user.isActive
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-200 text-slate-600'"
                >
                  {{ user.isActive ? "Activo" : "De baja" }}
                </span>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <!-- Paginación -->
    <nav v-if="users.totalPages > 1" class="flex items-center justify-between text-sm">
      <button
        type="button"
        :disabled="!users.hasPreviousPage || users.loading"
        class="rounded-md border border-slate-300 px-3 py-1.5 disabled:opacity-40"
        @click="users.goToPage(users.page - 1)"
      >
        Anterior
      </button>

      <span class="text-slate-600">
        Página {{ users.page }} de {{ users.totalPages }}
      </span>

      <button
        type="button"
        :disabled="!users.hasNextPage || users.loading"
        class="rounded-md border border-slate-300 px-3 py-1.5 disabled:opacity-40"
        @click="users.goToPage(users.page + 1)"
      >
        Siguiente
      </button>
    </nav>
  </section>
</template>
