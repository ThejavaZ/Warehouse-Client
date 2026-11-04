import { http } from "./http";
import type { PagedResult } from "../types/api";
import type {
  InventoryItemViewModel,
  InventoryMovementDTO,
  InventoryQuery,
} from "../types/inventory";

/**
 * Endpoints de `/api/InventoryItem`, todos con `[Authorize]`.
 *
 * El base path es `InventoryItem` y no `Inventory` por el nombre de la
 * clase: `[Route("api/[controller]")]` sustituye `[controller]` por el
 * nombre del controlador sin el sufijo `Controller`, y la clase se llama
 * `InventoryItemController`. Apuntar a `/Inventory` da 404, no 401: la
 * ruta ni siquiera existe.
 *
 * No hay `GET ...?id=` ni `DELETE`: las existencias no se editan ni se
 * borran, se mueven. El único camino para cambiar `quantity` es restock
 * (suma) o consume (resta).
 *
 * Los códigos de error de los movimientos, que es donde está la lógica:
 *
 * - 400 `invalid_quantity` (con `field: "Quantity"`), `inactive_warehouse`,
 *   `inactive_product`
 * - 404 `not_found` si el almacén o el producto no existen, y
 *   `no_stock_record` si se intenta consumir de un par sin ficha
 * - 409 `insufficient_stock` si no hay saldo (la cantidad no queda negativa)
 * - 409 `stock_update_conflict` si otra petición ganó la carrera
 */
export const inventoryApi = {
  /** Listado paginado de pares almacén–producto, con filtros opcionales. */
  list: (query: InventoryQuery = {}): Promise<PagedResult<InventoryItemViewModel>> =>
    http.get<PagedResult<InventoryItemViewModel>>("/InventoryItem", { params: query }).then((r) => r.data),

  /** Entrada: suma `quantity`. Si el par no existe, lo crea. */
  restock: (dto: InventoryMovementDTO): Promise<InventoryItemViewModel> =>
    http.post<InventoryItemViewModel>("/InventoryItem/restock", dto).then((r) => r.data),

  /** Salida: resta `quantity`. 409 si no hay saldo, 404 si no hay ficha. */
  consume: (dto: InventoryMovementDTO): Promise<InventoryItemViewModel> =>
    http.post<InventoryItemViewModel>("/InventoryItem/consume", dto).then((r) => r.data),
};
