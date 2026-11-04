<script setup lang="ts">
import { onMounted, ref } from "vue";
import Alert from "../components/ui/Alert.vue";
import ConfirmDialog from "../components/ui/ConfirmDialog.vue";
import DataTable, { type TableColumn } from "../components/ui/DataTable.vue";
import EmptyState from "../components/ui/EmptyState.vue";
import LoadingState from "../components/ui/LoadingState.vue";
import PageHeader from "../components/ui/PageHeader.vue";
import Pagination from "../components/ui/Pagination.vue";
import { useWarehousesStore } from "../stores/warehouses";
import type { WarehouseListViewModel } from "../types/warehouse";

const warehouses = useWarehousesStore();

const searchInput = ref("");
/** Aviso transaccional (p. ej. dado de baja por otro administrador). */
const notice = ref<string | null>(null);

const columns: TableColumn[] = [
  { key: "name", label: "Nombre" },
  { key: "location", label: "Ubicación" },
  { key: "status", label: "Estado" },
];

function onSearch(): void {
  warehouses.search = searchInput.value;
  warehouses.applyFilters();
}

function onFilterChange(): void {
  warehouses.applyFilters();
}

function clearFilters(): void {
  searchInput.value = "";
  warehouses.resetFilters();
}

/**
 * Baja lógica con confirmación en dos pasos: el botón de la fila solo
 * guarda qué registro pendiente, y el diálogo hace la petición. Así se
 * puede mantener abierto mientras carga y bloquear el doble clic.
 *
 * Un almacén puede tener stock asociado: la confirmación no lo dice porque
 * la API no lo comprueba, pero al menos obliga a un clic consciente.
 */
const pending = ref<{ id: number; label: string } | null>(null);
const removing = ref(false);

function askRemove(id: number, name: string | null): void {
  pending.value = { id, label: name ?? `#${id}` };
}

async function confirmRemove(): Promise<void> {
  if (pending.value === null || removing.value) return;

  const { id, label } = pending.value;
  removing.value = true;
  notice.value = null;

  try {
    const result = await warehouses.remove(id);

    notice.value =
      result === "removed"
        ? `Almacén ${label} dado de baja.`
        : result === "not_found"
          ? `El almacén ${label} ya estaba dado de baja.`
          : null; // error real: lo muestra el banner del store
  } finally {
    removing.value = false;
    pending.value = null;
  }
}

onMounted(() => void warehouses.load());
</script>

<template>
  <section class="space-y-4">
    <PageHeader title="Almacenes">
      <template #description>
        {{ warehouses.totalItems }} resultado{{ warehouses.totalItems === 1 ? "" : "s" }}
      </template>

      <template #actions>
        <RouterLink :to="{ name: 'warehouses.create' }" class="btn-primary">
          Nuevo almacén
        </RouterLink>
      </template>
    </PageHeader>

    <Alert v-if="notice" variant="warning">{{ notice }}</Alert>

    <!-- Filtros -->
    <form class="flex flex-wrap items-end gap-3" @submit.prevent="onSearch">
      <div class="min-w-56 flex-1">
        <label for="warehouse-search" class="block text-sm font-medium">Buscar</label>
        <input
          id="warehouse-search"
          v-model="searchInput"
          type="search"
          placeholder="Nombre o ubicación"
          class="field"
        />
      </div>

      <div>
        <label for="warehouse-status" class="block text-sm font-medium">Estado</label>
        <select
          id="warehouse-status"
          v-model="warehouses.isActive"
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
          v-model="warehouses.orderDesc"
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

    <Alert v-if="warehouses.error" variant="error">{{ warehouses.error }}</Alert>

    <DataTable
      :columns="columns"
      :rows="warehouses.items"
      :row-key="(warehouse: WarehouseListViewModel) => warehouse.id"
      :loading="warehouses.loading && warehouses.items.length === 0"
      empty-message="No hay almacenes que coincidan con los filtros."
    >
      <template #cell-name="{ row }">
        <span class="font-medium">{{ row.name ?? "—" }}</span>
      </template>

      <template #cell-location="{ row }">
        <span class="text-slate-600">{{ row.location ?? "Sin ubicación" }}</span>
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
            :to="{ name: 'warehouses.edit', params: { id: row.id } }"
            class="btn-secondary btn-sm"
          >
            Editar
          </RouterLink>
          <button
            v-if="row.isActive"
            type="button"
            class="btn-danger btn-sm"
            @click="askRemove(row.id, row.name)"
          >
            Dar de baja
          </button>
        </div>
      </template>

      <template #loading>
        <LoadingState />
      </template>

      <template #empty>
        <EmptyState message="No hay almacenes que coincidan con los filtros." />
      </template>
    </DataTable>

    <Pagination
      :page="warehouses.page"
      :total-pages="warehouses.totalPages"
      :loading="warehouses.loading"
      @change="warehouses.goToPage"
    />

    <ConfirmDialog
      :open="pending !== null"
      title="Dar de baja"
      :message="pending ? `¿Dar de baja el almacén ${pending.label}? Se ocultará del listado activo.` : ''"
      confirm-label="Dar de baja"
      danger
      :loading="removing"
      @confirm="confirmRemove"
      @cancel="pending = null"
    />
  </section>
</template>
