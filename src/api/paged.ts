import type { PagedResult } from "../types/api";

/**
 * Recorre todas las páginas de un listado y devuelve los items juntos.
 *
 * Hace falta para poblar desplegables: ahí se quiere el conjunto completo,
 * no una página. La API limita `pageSize` a 100, así que con un único
 * request el desplegable se quedaría corto en cuanto el catálogo creciera,
 * y empezaría a no encontrar productos sin que el usuario entendiera por
 * qué.
 *
 * `maxPages` es una red de seguridad: sin él, un listado que siempre
 * dijera `hasNextPage` dejaría la petición en bucle para siempre.
 */
export async function fetchAllPages<T>(
  fetchPage: (page: number) => Promise<PagedResult<T>>,
  maxPages = 50,
): Promise<T[]> {
  const items: T[] = [];

  for (let page = 1; page <= maxPages; page += 1) {
    const result = await fetchPage(page);
    items.push(...result.items);

    if (!result.hasNextPage) break;
  }

  return items;
}
