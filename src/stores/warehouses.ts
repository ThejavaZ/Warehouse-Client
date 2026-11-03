import { defineStore } from "pinia";
import { ref } from "vue";
import { ApiError } from "../api/http";
import { usePagedList } from "../composables/usePagedList";
import { warehousesApi } from "../api/warehouses";
import type { WarehouseListViewModel } from "../types/warehouse";

/**
 * ViewModel del listado de almacenes. Filtros idénticos a Users y Products
 * (búsqueda, estado, orden) sobre el paginado común.
 */
export const useWarehousesStore = defineStore("warehouses", () => {
  const search = ref("");
  const isActive = ref<boolean | null>(null);
  const orderDesc = ref(true);

  const list = usePagedList<WarehouseListViewModel>((page, pageSize) =>
    warehousesApi.list({
      page,
      pageSize,
      search: search.value.trim() || undefined,
      isActive: isActive.value ?? undefined,
      orderDesc: orderDesc.value,
    }),
  );

  function resetFilters(): void {
    search.value = "";
    isActive.value = null;
    orderDesc.value = true;
    list.applyFilters();
  }

  /** Baja lógica, con el mismo trato del 404 que en el resto de módulos. */
  async function remove(id: number): Promise<"removed" | "not_found" | "error"> {
    try {
      await warehousesApi.remove(id);
      await list.load();
      return "removed";
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        await list.load();
        return "not_found";
      }

      list.error.value = e instanceof ApiError ? e.message : "Error inesperado.";
      return "error";
    }
  }

  return {
    ...list,
    search,
    isActive,
    orderDesc,
    resetFilters,
    remove,
  };
});
