/**
 * Contratos del módulo Inventory (espejo de `Api.Inventory`).
 *
 * A diferencia de Users, Products y Warehouses, aquí no hay endpoint de
 * detalle por `id`: `InventoryQuery` solo admite `warehouseId` y `productId`,
 * y lo que devuelve siempre es el listado. La existencia de un par es
 * resultado de un movimiento, no algo que se crea desde un formulario.
 *
 * El base path es `/api/InventoryItem`, no `/api/Inventory`: lo decide el
 * nombre de la clase `InventoryItemController`. Ver `api/inventory.ts`.
 */

/** Fila del listado (`InventoryItemViewModel`): un par almacén–producto. */
export interface InventoryItemViewModel {
  id: number;
  warehouseId: number;
  warehouseName: string | null;
  productId: number;
  productSku: string | null;
  productName: string | null;
  /** Existencias actuales; nunca negativo (CHECK en BD + validación al consumir). */
  quantity: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Movimiento de entrada o salida (`InventoryMovementDTO`).
 * Los tres campos son obligatorios y `quantity` es al menos 1.
 */
export interface InventoryMovementDTO {
  warehouseId: number;
  productId: number;
  quantity: number;
}

/**
 * Parámetros de consulta de `GET /api/Inventory` (`InventoryQuery`).
 * No hay `search` ni `id`: el filtro es por par, y el orden es por `id`.
 */
export interface InventoryQuery {
  warehouseId?: number;
  productId?: number;
  page?: number;
  pageSize?: number;
  /** Orden por id; `PagedQuery` lo da por defecto a `true`. */
  orderDesc?: boolean;
}
