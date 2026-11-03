/**
 * Contratos del módulo Warehouses (espejo de `Api.Warehouses`).
 * `Location` es anulable: los almacenes pueden no tener ubicación.
 */

/** Fila del listado (`WarehouseListViewModel`). */
export interface WarehouseListViewModel {
  id: number;
  uuid: string;
  name: string | null;
  location: string | null;
  isActive: boolean;
}

/** Detalle (`WarehouseViewModel`): la fila anterior más timestamps. */
export interface WarehouseViewModel extends WarehouseListViewModel {
  createdAt: string;
  updatedAt: string;
}

/** Alta de almacén (`WarehouseCreateDTO`). */
export interface WarehouseCreateDTO {
  name: string;
  /** Opcional, hasta 200 caracteres. */
  location?: string;
}

/** Actualización (`WarehouseUpdateDTO`): los dos campos llegan siempre. */
export interface WarehouseUpdateDTO {
  name: string;
  location?: string;
}

/** Parámetros de consulta de `GET /api/Warehouse` (`WarehouseQuery`). */
export interface WarehouseQuery {
  id?: number;
  /** Búsqueda case-insensitive por nombre o ubicación. */
  search?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
  /** Orden por id; `PagedQuery` lo da por defecto a `true`. */
  orderDesc?: boolean;
}
