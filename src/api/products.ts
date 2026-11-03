import { http } from "./http";
import type { PagedResult } from "../types/api";
import type {
  ProductCreateDTO,
  ProductListViewModel,
  ProductQuery,
  ProductUpdateDTO,
  ProductViewModel,
} from "../types/product";

/**
 * Endpoints de `/api/Product`, todos con `[Authorize]`.
 *
 * El SKU es único: crear o editar con uno repetido devuelve 400 con
 * `code: "validation_error"` y `field: "SKU"` — no `errors`, que es el
 * formato de la validación de DataAnnotations.
 */
export const productsApi = {
  /** Listado paginado; si llega `id` devuelve el detalle en su lugar. */
  list: (query: ProductQuery = {}): Promise<PagedResult<ProductListViewModel>> =>
    http.get<PagedResult<ProductListViewModel>>("/Product", { params: query }).then((r) => r.data),

  get: (id: number): Promise<ProductViewModel> =>
    http.get<ProductViewModel>("/Product", { params: { id } }).then((r) => r.data),

  create: (dto: ProductCreateDTO): Promise<ProductViewModel> =>
    http.post<ProductViewModel>("/Product", dto).then((r) => r.data),

  update: (id: number, dto: ProductUpdateDTO): Promise<ProductViewModel> =>
    http.put<ProductViewModel>(`/Product/${id}`, dto).then((r) => r.data),

  /** Baja lógica (SoftDelete). 404 si ya estaba dado de baja. */
  remove: (id: number): Promise<void> =>
    http.delete<void>(`/Product/${id}`).then(() => undefined),
};
