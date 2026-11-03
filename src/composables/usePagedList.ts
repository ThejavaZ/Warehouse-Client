import { computed, ref, type Ref } from "vue";
import { ApiError } from "../api/http";
import type { PagedResult } from "../types/api";

/**
 * Estado y acciones de cualquier listado paginado de la API.
 *
 * Es el patrón que ya usaba el store de Users, extraído para que Products,
 * Warehouses e Inventory no lo repitan: los filtros cambian de módulo, pero
 * "cargar, retroceder de página si vino vacía y no tragar el error" es
 * idéntico en todos.
 *
 * Los filtros no viven aquí a propósito: cada módulo tiene los suyos. La vista
 * los muta con `v-model` y llama a `applyFilters()`, que es lo que pone la
 * página a 1 y recarga.
 */
export function usePagedList<T>(
  /** Trae una página. Recibe ya la página y el tamaño pedidos. */
  fetchPage: (page: number, pageSize: number) => Promise<PagedResult<T>>,
  options: { pageSize?: number } = {},
): {
  items: Ref<T[]>;
  page: Ref<number>;
  pageSize: Ref<number>;
  totalPages: Ref<number>;
  totalItems: Ref<number>;
  hasPreviousPage: Ref<boolean>;
  hasNextPage: Ref<boolean>;
  loading: Ref<boolean>;
  error: Ref<string | null>;
  load: () => Promise<void>;
  applyFilters: () => void;
  goToPage: (next: number) => void;
} {
  const items = ref([]) as Ref<T[]>;
  const page = ref(1);
  const pageSize = ref(options.pageSize ?? 10);
  const totalPages = ref(0);
  const totalItems = ref(0);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const hasPreviousPage = computed(() => page.value > 1);
  const hasNextPage = computed(() => page.value < totalPages.value);

  async function load(): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      const result = await fetchPage(page.value, pageSize.value);

      items.value = [...result.items];
      totalPages.value = result.totalPages;
      totalItems.value = result.totalItems;

      // Se borra el último elemento de la última página (o un filtro deja de
      // coincidir): hay que retroceder en vez de dejar la tabla en blanco.
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

  /** Pone la página a 1 y recarga: a esto se llama tras cambiar un filtro. */
  function applyFilters(): void {
    page.value = 1;
    void load();
  }

  function goToPage(next: number): void {
    if (next < 1 || next > totalPages.value || next === page.value) return;

    page.value = next;
    void load();
  }

  return {
    items,
    page,
    pageSize,
    totalPages,
    totalItems,
    hasPreviousPage,
    hasNextPage,
    loading,
    error,
    load,
    applyFilters,
    goToPage,
  };
}
