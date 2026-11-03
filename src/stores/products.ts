import { defineStore } from "pinia";
import { ref } from "vue";
import { ApiError } from "../api/http";
import { usePagedList } from "../composables/usePagedList";
import { productsApi } from "../api/products";
import type { ProductListViewModel } from "../types/product";

/**
 * ViewModel del listado de productos. Los filtros son los mismos que en
 * Users (búsqueda por nombre o SKU, estado, orden), así que el store es
 * deliberadamente corto: el paginado vive en `usePagedList`.
 */
export const useProductsStore = defineStore("products", () => {
  const search = ref("");
  const isActive = ref<boolean | null>(null);
  const orderDesc = ref(true);

  const list = usePagedList<ProductListViewModel>((page, pageSize) =>
    productsApi.list({
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

  /**
   * Baja lógica del producto, con la misma distinción que en Users entre
   * "ya estaba dado de baja" (404) y un fallo real.
   */
  async function remove(id: number): Promise<"removed" | "not_found" | "error"> {
    try {
      await productsApi.remove(id);
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
