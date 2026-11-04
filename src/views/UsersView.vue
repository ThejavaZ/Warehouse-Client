<script setup lang="ts">
import { onMounted, ref } from "vue";
import Alert from "../components/ui/Alert.vue";
import ConfirmDialog from "../components/ui/ConfirmDialog.vue";
import DataTable, { type TableColumn } from "../components/ui/DataTable.vue";
import EmptyState from "../components/ui/EmptyState.vue";
import LoadingState from "../components/ui/LoadingState.vue";
import PageHeader from "../components/ui/PageHeader.vue";
import Pagination from "../components/ui/Pagination.vue";
import { useUsersStore } from "../stores/users";
import type { UserListViewModel } from "../types/user";

const users = useUsersStore();

/** Texto del filtro de búsqueda; se sincroniza con el store al enviar. */
const searchInput = ref("");
/** Aviso transaccional (p. ej. dado de baja por otro administrador). */
const notice = ref<string | null>(null);

const columns: TableColumn[] = [
  { key: "id", label: "ID" },
  { key: "name", label: "Nombre" },
  { key: "email", label: "Correo" },
  { key: "status", label: "Estado" },
];

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

/**
 * Baja lógica con confirmación en dos pasos: el botón de la fila solo
 * guarda qué registro pendiente, y el diálogo hace la petición. Así se
 * puede mantener abierto mientras carga y bloquear el doble clic.
 */
const pending = ref<{ id: number; label: string } | null>(null);
const removing = ref(false);

function askRemove(id: number, email: string | null): void {
  pending.value = { id, label: email ?? `#${id}` };
}

async function confirmRemove(): Promise<void> {
  if (pending.value === null || removing.value) return;

  const { id, label } = pending.value;
  removing.value = true;
  notice.value = null;

  try {
    const result = await users.remove(id);

    notice.value =
      result === "removed"
        ? `Usuario ${label} dado de baja.`
        : result === "not_found"
          ? `El usuario ${label} ya estaba dado de baja.`
          : null; // error real: lo muestra el banner del store
  } finally {
    removing.value = false;
    pending.value = null;
  }
}

onMounted(() => void users.load());
</script>

<template>
  <section class="space-y-4">
    <PageHeader title="Usuarios">
      <template #description>
        {{ users.totalItems }} resultado{{ users.totalItems === 1 ? "" : "s" }}
      </template>

      <template #actions>
        <RouterLink :to="{ name: 'users.create' }" class="btn-primary">
          Nuevo usuario
        </RouterLink>
      </template>
    </PageHeader>

    <Alert v-if="notice" variant="warning">{{ notice }}</Alert>

    <!-- Filtros -->
    <form class="flex flex-wrap items-end gap-3" @submit.prevent="onSearch">
      <div class="min-w-56 flex-1">
        <label for="search" class="block text-sm font-medium">Buscar</label>
        <input
          id="search"
          v-model="searchInput"
          type="search"
          placeholder="Nombre o correo"
          class="field"
        />
      </div>

      <div>
        <label for="status" class="block text-sm font-medium">Estado</label>
        <select
          id="status"
          v-model="users.isActive"
          class="field"
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

      <button type="submit" class="btn-secondary">Buscar</button>

      <button type="button" class="btn-ghost" @click="clearFilters">
        Limpiar
      </button>
    </form>

    <Alert v-if="users.error" variant="error">{{ users.error }}</Alert>

    <DataTable
      :columns="columns"
      :rows="users.items"
      :row-key="(user: UserListViewModel) => user.id"
      :loading="users.loading && users.items.length === 0"
      empty-message="No hay usuarios que coincidan con los filtros."
    >
      <template #cell-id="{ row }">
        <span class="text-slate-500">{{ row.id }}</span>
      </template>

      <template #cell-name="{ row }">
        <span class="font-medium">{{ row.name ?? "—" }}</span>
      </template>

      <template #cell-email="{ row }">
        <span class="text-slate-600">{{ row.email ?? "—" }}</span>
      </template>

      <template #cell-status="{ row }">
        <span
          class="rounded-full px-2 py-0.5 text-xs font-medium"
          :class="row.isActive
            ? 'bg-success-100 text-success-900'
            : 'bg-slate-200 text-slate-600'"
        >
          {{ row.isActive ? "Activo" : "De baja" }}
        </span>
      </template>

      <template #actions="{ row }">
        <div class="flex justify-end gap-2">
          <RouterLink
            :to="{ name: 'users.edit', params: { id: row.id } }"
            class="btn-secondary btn-sm"
          >
            Editar
          </RouterLink>
          <button
            v-if="row.isActive"
            type="button"
            class="btn-danger btn-sm"
            @click="askRemove(row.id, row.email)"
          >
            Dar de baja
          </button>
        </div>
      </template>

      <template #loading>
        <LoadingState />
      </template>

      <template #empty>
        <EmptyState message="No hay usuarios que coincidan con los filtros." />
      </template>
    </DataTable>

    <Pagination
      :page="users.page"
      :total-pages="users.totalPages"
      :loading="users.loading"
      @change="users.goToPage"
    />

    <ConfirmDialog
      :open="pending !== null"
      title="Dar de baja"
      :message="pending ? `¿Dar de baja a ${pending.label}? Se ocultará del listado activo.` : ''"
      confirm-label="Dar de baja"
      danger
      :loading="removing"
      @confirm="confirmRemove"
      @cancel="pending = null"
    />
  </section>
</template>
