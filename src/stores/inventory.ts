import { defineStore } from "pinia";
import { ref } from "vue";
import { ApiError } from "../api/http";
import { fetchAllPages } from "../api/paged";
import { inventoryApi } from "../api/inventory";
import { productsApi } from "../api/products";
import { warehousesApi } from "../api/warehouses";
import { usePagedList } from "../composables/usePagedList";
import type { InventoryItemViewModel, InventoryMovementDTO } from "../types/inventory";
import type { ProductListViewModel } from "../types/product";
import type { WarehouseListViewModel } from "../types/warehouse";

/**
 * ViewModel de Inventory: el listado de pares almacén–producto más los
 * desplegables y la acción de mover stock, que es lo único que cambia aquí.
 *
 * A diferencia de los otros módulos no hay `remove`: las existencias no se
 * borran, se mueven.
 */
export const useInventoryStore = defineStore("inventory", () => {
  // Filtros del listado. No hay texto libre: InventoryQuery no declara
  // `search`, solo el par almacén y producto.
  const warehouseId = ref<number | null>(null);
  const productId = ref<number | null>(null);
  const orderDesc = ref(true);

  const list = usePagedList<InventoryItemViewModel>((page, pageSize) =>
    inventoryApi.list({
      page,
      pageSize,
      // `undefined` no viaja en la query string: el filtro queda sin aplicar.
      warehouseId: warehouseId.value ?? undefined,
      productId: productId.value ?? undefined,
      orderDesc: orderDesc.value,
    }),
  );

  /**
   * Opciones de los desplegables del formulario de movimiento.
   * Se cargan solo las activas: la API rechaza el movimiento con 400
   * `inactive_warehouse` o `inactive_product`, así que listar las de baja
   * en el selector solo serviría para elegir algo que luego falla.
   */
  const warehouses = ref<WarehouseListViewModel[]>([]);
  const products = ref<ProductListViewModel[]>([]);
  const optionsLoading = ref(false);
  const optionsError = ref<string | null>(null);

  async function loadOptions(): Promise<void> {
    // Si ya se están cargando no se vuelve a disparar: el formulario puede
    // montarse de nuevo mientras la primera petición sigue en vuelo.
    if (optionsLoading.value) return;

    optionsLoading.value = true;
    optionsError.value = null;

    try {
      const [warehouseRows, productRows] = await Promise.all([
        fetchAllPages((page) => warehousesApi.list({ page, pageSize: 100, isActive: true })),
        fetchAllPages((page) => productsApi.list({ page, pageSize: 100, isActive: true })),
      ]);

      warehouses.value = warehouseRows;
      products.value = productRows;
    } catch (e) {
      optionsError.value = e instanceof ApiError ? e.message : "Error inesperado.";
    } finally {
      optionsLoading.value = false;
    }
  }

  function resetFilters(): void {
    warehouseId.value = null;
    productId.value = null;
    orderDesc.value = true;
    list.applyFilters();
  }

  /**
   * Aplica un movimiento de entrada (restock) o salida (consume).
   *
   * No recarga el listado: esto se lanza desde la vista de movimiento, donde
   * no se ve, y al volver el listado se monta de nuevo y recarga en su
   * `onMounted`.
   *
   * Los errores se propagan tal cual llegan de la API. `insufficient_stock`
   * (409) o `no_stock_record` (404) no son fallos del listado sino del
   * movimiento concreto, y los pinta la vista que lo ha lanzado.
   */
  async function move(
    kind: "restock" | "consume",
    dto: InventoryMovementDTO,
  ): Promise<InventoryItemViewModel> {
    return kind === "restock"
      ? inventoryApi.restock(dto)
      : inventoryApi.consume(dto);
  }

  return {
    ...list,
    warehouseId,
    productId,
    orderDesc,
    warehouses,
    products,
    optionsLoading,
    optionsError,
    loadOptions,
    resetFilters,
    move,
  };
});
