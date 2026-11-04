<script setup lang="ts">
import { onMounted, ref } from "vue";
import Alert from "../components/ui/Alert.vue";
import ConfirmDialog from "../components/ui/ConfirmDialog.vue";
import DataTable, { type TableColumn } from "../components/ui/DataTable.vue";
import EmptyState from "../components/ui/EmptyState.vue";
import LoadingState from "../components/ui/LoadingState.vue";
import PageHeader from "../components/ui/PageHeader.vue";
import Pagination from "../components/ui/Pagination.vue";
import { useProductsStore } from "../stores/products";
import type { ProductListViewModel } from "../types/product";

const products = useProductsStore();

const searchInput = ref("");
/** Aviso transaccional (p. ej. dado de baja por otro administrador). */
const notice = ref<string | null>(null);

const columns: TableColumn[] = [
  { key: "sku", label: "SKU" },
  { key: "name", label: "Nombre" },
  { key: "price", label: "Precio", align: "right" },
  { key: "status", label: "Estado" },
];

/**
 * La API no define moneda, así que se formatea solo el número con dos
 * decimales: inventar un símbolo sería prometer algo que el backend no dice.
 */
const priceFormatter = new Intl.NumberFormat("es-ES", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatPrice(value: number): string {
  return priceFormatter.format(value);
}

function onSearch(): void {
  products.search = searchInput.value;
  products.applyFilters();
}

function onFilterChange(): void {
  products.applyFilters();
}

function clearFilters(): void {
  searchInput.value = "";
  products.resetFilters();
}

/**
 * Baja lógica con confirmación en dos pasos: el botón de la fila solo
 * guarda qué registro pendiente, y el diálogo hace la petición. Así se
 * puede mantener abierto mientras carga y bloquear el doble clic.
 */
const pending = ref<{ id: number; label: string } | null>(null);
const removing = ref(false);

function askRemove(id: number, sku: string | null): void {
  pending.value = { id, label: sku ?? `#${id}` };
}

async function confirmRemove(): Promise<void> {
  if (pending.value === null || removing.value) return;

  const { id, label } = pending.value;
  removing.value = true;
  notice.value = null;

  try {
    const result = await products.remove(id);

    notice.value =
      result === "removed"
        ? `Producto ${label} dado de baja.`
        : result === "not_found"
          ? `El producto ${label} ya estaba dado de baja.`
          : null; // error real: lo muestra el banner del store
  } finally {
    removing.value = false;
    pending.value = null;
  }
}

onMounted(() => void products.load());
</script>

<template>
  <section class="space-y-4">
    <PageHeader title="Productos">
      <template #description>
        {{ products.totalItems }} resultado{{ products.totalItems === 1 ? "" : "s" }}
      </template>

      <template #actions>
        <RouterLink :to="{ name: 'products.create' }" class="btn-primary">
          Nuevo producto
        </RouterLink>
      </template>
    </PageHeader>

    <Alert v-if="notice" variant="warning">{{ notice }}</Alert>

    <!-- Filtros -->
    <form class="flex flex-wrap items-end gap-3" @submit.prevent="onSearch">
      <div class="min-w-56 flex-1">
        <label for="product-search" class="block text-sm font-medium">Buscar</label>
        <input
          id="product-search"
          v-model="searchInput"
          type="search"
          placeholder="Nombre o SKU"
          class="field"
        />
      </div>

      <div>
        <label for="product-status" class="block text-sm font-medium">Estado</label>
        <select
          id="product-status"
          v-model="products.isActive"
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
          v-model="products.orderDesc"
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

    <Alert v-if="products.error" variant="error">{{ products.error }}</Alert>

    <DataTable
      :columns="columns"
      :rows="products.items"
      :row-key="(product: ProductListViewModel) => product.id"
      :loading="products.loading && products.items.length === 0"
      empty-message="No hay productos que coincidan con los filtros."
    >
      <template #cell-sku="{ row }">
        <span class="font-mono text-xs text-slate-600">{{ row.sku ?? "—" }}</span>
      </template>

      <template #cell-name="{ row }">
        <span class="font-medium">{{ row.name ?? "—" }}</span>
      </template>

      <template #cell-price="{ row }">
        <span class="tabular-nums">{{ formatPrice(row.price) }}</span>
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
            :to="{ name: 'products.edit', params: { id: row.id } }"
            class="btn-secondary btn-sm"
          >
            Editar
          </RouterLink>
          <button
            v-if="row.isActive"
            type="button"
            class="btn-danger btn-sm"
            @click="askRemove(row.id, row.sku)"
          >
            Dar de baja
          </button>
        </div>
      </template>

      <template #loading>
        <LoadingState />
      </template>

      <template #empty>
        <EmptyState message="No hay productos que coincidan con los filtros." />
      </template>
    </DataTable>

    <Pagination
      :page="products.page"
      :total-pages="products.totalPages"
      :loading="products.loading"
      @change="products.goToPage"
    />

    <ConfirmDialog
      :open="pending !== null"
      title="Dar de baja"
      :message="pending ? `¿Dar de baja el producto ${pending.label}? Se ocultará del catálogo activo.` : ''"
      confirm-label="Dar de baja"
      danger
      :loading="removing"
      @confirm="confirmRemove"
      @cancel="pending = null"
    />
  </section>
</template>
