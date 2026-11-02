import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { usersApi } from "../api/users";
import { ApiError } from "../api/http";
import type { UserListViewModel } from "../types/user";

/** Tamaño de página por defecto; la API valida entre 1 y 100. */
const DEFAULT_PAGE_SIZE = 10;

/**
 * ViewModel del listado de usuarios: filtros, paginación y estado de carga.
 * La página vuelve a 1 en cuanto cambia un filtro, porque un filtro nuevo hace
 * que la página actual deje de significar lo mismo.
 */
export const useUsersStore = defineStore("users", () => {
  // datos
  const items = ref<UserListViewModel[]>([]);
  const page = ref(1);
  const pageSize = ref(DEFAULT_PAGE_SIZE);
  const totalPages = ref(0);
  const totalItems = ref(0);

  // filtros
  const search = ref("");
  const isActive = ref<boolean | null>(null);
  const orderDesc = ref(false);

  // estado de la carga
  const loading = ref(false);
  const error = ref<string | null>(null);

  const hasPreviousPage = computed(() => page.value > 1);
  const hasNextPage = computed(() => page.value < totalPages.value);

  async function load(): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      const result = await usersApi.list({
        page: page.value,
        pageSize: pageSize.value,
        // `undefined` no viaja en la query string: el filtro queda sin aplicar.
        search: search.value.trim() || undefined,
        isActive: isActive.value ?? undefined,
        orderDesc: orderDesc.value,
      });

      items.value = result.items;
      totalPages.value = result.totalPages;
      totalItems.value = result.totalItems;

      // Si se borra el último elemento de la última página, hay que retroceder.
      if (result.items.length === 0 && page.value > 1) {
        page.value -= 1;
        await load();
      }
    } catch (e) {
      items.value = [];
      totalItems.value = 0;
      totalPages.value = 0;
      error.value = e instanceof ApiError ? e.message : "Error inesperado.";
    } finally {
      loading.value = false;
    }
  }

  /**
   * Vuelve a la primera página y recarga. La vista muta los filtros con
   * `v-model` y llama a esto para que el cambio surta efecto.
   */
  function applyFilters(): void {
    page.value = 1;
    void load();
  }

  function goToPage(next: number): void {
    if (next < 1 || next > totalPages.value || next === page.value) return;

    page.value = next;
    void load();
  }

  function resetFilters(): void {
    search.value = "";
    isActive.value = null;
    orderDesc.value = false;
    page.value = 1;
    void load();
  }

  return {
    // datos
    items,
    page,
    pageSize,
    totalPages,
    totalItems,
    hasPreviousPage,
    hasNextPage,
    // filtros
    search,
    isActive,
    orderDesc,
    // estado
    loading,
    error,
    // acciones
    load,
    applyFilters,
    goToPage,
    resetFilters,
  };
});
