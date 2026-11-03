import { http } from "./http";
import type { PagedResult } from "../types/api";
import type {
  WarehouseCreateDTO,
  WarehouseListViewModel,
  WarehouseQuery,
  WarehouseUpdateDTO,
  WarehouseViewModel,
} from "../types/warehouse";

/**
 * Endpoints de `/api/Warehouse`, todos con `[Authorize]`.
 *
 * El nombre es único entre almacenes vivos: repetirlo devuelve 400 con
 * `code: "validation_error"` y `field: "Name"` (mismo caso que el SKU en
 * Products, resuelto por ArgumentException en el servicio).
 */
export const warehousesApi = {
  /** Listado paginado; si llega `id` devuelve el detalle en su lugar. */
  list: (query: WarehouseQuery = {}): Promise<PagedResult<WarehouseListViewModel>> =>
    http.get<PagedResult<WarehouseListViewModel>>("/Warehouse", { params: query }).then((r) => r.data),

  get: (id: number): Promise<WarehouseViewModel> =>
    http.get<WarehouseViewModel>("/Warehouse", { params: { id } }).then((r) => r.data),

  create: (dto: WarehouseCreateDTO): Promise<WarehouseViewModel> =>
    http.post<WarehouseViewModel>("/Warehouse", dto).then((r) => r.data),

  update: (id: number, dto: WarehouseUpdateDTO): Promise<WarehouseViewModel> =>
    http.put<WarehouseViewModel>(`/Warehouse/${id}`, dto).then((r) => r.data),

  /** Baja lógica (SoftDelete). 404 si ya estaba dado de baja. */
  remove: (id: number): Promise<void> =>
    http.delete<void>(`/Warehouse/${id}`).then(() => undefined),
};
