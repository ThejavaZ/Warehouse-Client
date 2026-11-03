/**
 * Contratos del módulo Products (espejo de `Api.Products`).
 * `Description` es anulable en ambos lados: la API puede devolver null.
 */

/** Fila del listado (`ProductListViewModel`). */
export interface ProductListViewModel {
  id: number;
  uuid: string;
  sku: string | null;
  name: string | null;
  /** Decimal con precisión (18,2). El JSON lo trae como número. */
  price: number;
  isActive: boolean;
}

/** Detalle (`ProductViewModel`): la fila anterior más descripción y timestamps. */
export interface ProductViewModel extends ProductListViewModel {
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Alta de producto (`ProductCreateDTO`). */
export interface ProductCreateDTO {
  sku: string;
  name: string;
  description?: string;
  price: number;
}

/**
 * Actualización (`ProductUpdateDTO`).
 * Todos los campos son obligatorios: no hay actualización parcial real, el
 * objeto completo sustituye al anterior.
 */
export interface ProductUpdateDTO {
  sku: string;
  name: string;
  description?: string;
  price: number;
}

/** Parámetros de consulta de `GET /api/Product` (`ProductQuery`). */
export interface ProductQuery {
  id?: number;
  /** Búsqueda case-insensitive por SKU o nombre. */
  search?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
  /** Orden por id; la API lo da por defecto a `true` (más recientes primero). */
  orderDesc?: boolean;
}
