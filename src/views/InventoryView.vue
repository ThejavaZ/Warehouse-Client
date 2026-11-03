<script setup lang="ts">
import { onMounted } from "vue";
import Alert from "../components/ui/Alert.vue";
import DataTable, { type TableColumn } from "../components/ui/DataTable.vue";
import EmptyState from "../components/ui/EmptyState.vue";
import LoadingState from "../components/ui/LoadingState.vue";
import PageHeader from "../components/ui/PageHeader.vue";
import Pagination from "../components/ui/Pagination.vue";
import { useInventoryStore } from "../stores/inventory";
import type { InventoryItemViewModel } from "../types/inventory";

const inventory = useInventoryStore();

const columns: TableColumn[] = [
  { key: "warehouse", label: "Almacén" },
  { key: "product", label: "Producto" },
  { key: "quantity", label: "Existencias", align: "right" },
  { key: "updated", label: "Actualizado" },
];

/**
 * Fecha corta, sin hora: lo que importa en una ficha de existencias es el
 * día, no la hora exacta del último movimiento.
 */
const dateFormatter = new Intl.DateTimeFormat("es-ES", {
  dateStyle: "medium",
});

function formatDate(value: string): string {
  return dateFormatter.format(new Date(value));
}

function onFilterChange(): void {
  inventory.applyFilters();
}

function clearFilters(): void {
  inventory.resetFilters();
}

onMounted(() => {
  void inventory.load();
  // Los desplegables del filtro necesitan las opciones aunque el usuario
  // nunca abra el formulario de movimiento.
  void inventory.loadOptions();
});
</script>

<template>
  <section class="space-y-4">
    <PageHeader title="Inventario">
      <template #description>
        {{ inventory.totalItems }} par{{ inventory.totalItems === 1 ? "" : "s" }}
        almacén–producto
      </template>
    </PageHeader>

    <!--
      Los desplegables del filtro salen de los mismos datos que los del
      formulario de movimiento, así que se cargan aquí también: si el
      listado se monta solo, sin pasar por el formulario, igual hace falta
      poder filtrar por almacén.
    -->
    <Alert v-if="inventory.optionsError" variant="error">
      {{ inventory.optionsError }}
    </Alert>

    <!-- Filtros -->
    <form class="flex flex-wrap items-end gap-3" @submit.prevent="onFilterChange">
      <div>
        <label for="inventory-warehouse" class="block text-sm font-medium">Almacén</label>
        <select
          id="inventory-warehouse"
          v-model="inventory.warehouseId"
          class="field"
          :disabled="inventory.optionsLoading"
          @change="onFilterChange"
        >
          <option :value="null">Todos</option>
          <option v-for="w in inventory.warehouses" :key="w.id" :value="w.id">
            {{ w.name ?? `Almacén #${w.id}` }}
          </option>
        </select>
      </div>

      <div>
        <label for="inventory-product" class="block text-sm font-medium">Producto</label>
        <select
          id="inventory-product"
          v-model="inventory.productId"
          class="field"
          :disabled="inventory.optionsLoading"
          @change="onFilterChange"
        >
          <option :value="null">Todos</option>
          <option v-for="p in inventory.products" :key="p.id" :value="p.id">
            {{ p.sku ?? `#${p.id}` }} — {{ p.name ?? "Sin nombre" }}
          </option>
        </select>
      </div>

      <label class="flex items-center gap-2 py-2 text-sm">
        <input
          v-model="inventory.orderDesc"
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

    <Alert v-if="inventory.error" variant="error">{{ inventory.error }}</Alert>

    <DataTable
      :columns="columns"
      :rows="inventory.items"
      :row-key="(item: InventoryItemViewModel) => item.id"
      :loading="inventory.loading && inventory.items.length === 0"
      empty-message="No existencias registradas. Da de alta un movimiento para crear la primera ficha."
    >
      <template #cell-warehouse="{ row }">
        <span class="font-medium">{{ row.warehouseName ?? `Almacén #${row.warehouseId}` }}</span>
      </template>

      <template #cell-product="{ row }">
        <span class="font-mono text-xs text-slate-600">{{ row.productSku ?? "—" }}</span>
        <span class="ml-2">{{ row.productName ?? `Producto #${row.productId}` }}</span>
      </template>

      <!--
        Cero existencias se pinta en ámbar y no en rojo: no es un error, es
        un estado legítimo (se agotó el producto). El rojo queda para el
        fallo de una operación.
      -->
      <template #cell-quantity="{ row }">
        <span
          class="tabular-nums"
          :class="row.quantity === 0 ? 'font-semibold text-amber-700' : 'text-slate-900'"
        >
          {{ row.quantity }}
        </span>
      </template>

      <template #cell-updated="{ row }">
        <span class="text-slate-600">{{ formatDate(row.updatedAt) }}</span>
      </template>

      <template #loading>
        <LoadingState />
      </template>

      <template #empty>
        <EmptyState message="No existencias registradas. Da de alta un movimiento para crear la primera ficha." />
      </template>
    </DataTable>

    <Pagination
      :page="inventory.page"
      :total-pages="inventory.totalPages"
      :loading="inventory.loading"
      @change="inventory.goToPage"
    />
  </section>
</template>
