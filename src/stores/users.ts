import { defineStore } from "pinia";
import { ref } from "vue";
import { ApiError } from "../api/http";
import { usePagedList } from "../composables/usePagedList";
import { usersApi } from "../api/users";
import type { UserListViewModel } from "../types/user";

/**
 * ViewModel del listado de usuarios: filtros propios más el paginado común
 * que comparte con el resto de módulos (`usePagedList`).
 */
export const useUsersStore = defineStore("users", () => {
  // Filtros. Van en el store y no en el composable porque cada módulo tiene
  // los suyos; la vista los muta con v-model y llama a applyFilters().
  const search = ref("");
  const isActive = ref<boolean | null>(null);
  const orderDesc = ref(false);

  const list = usePagedList<UserListViewModel>((page, pageSize) =>
    usersApi.list({
      page,
      pageSize,
      // `undefined` no viaja en la query string: el filtro queda sin aplicar.
      search: search.value.trim() || undefined,
      isActive: isActive.value ?? undefined,
      orderDesc: orderDesc.value,
    }),
  );

  function resetFilters(): void {
    search.value = "";
    isActive.value = null;
    orderDesc.value = false;
    list.applyFilters();
  }

  /**
   * Baja lógica del usuario. Distingue el 404 (ya estaba dado de baja) de un
   * fallo real, para que la vista pueda mostrar el aviso adecuado; en el
   * segundo caso el mensaje queda en `error`.
   */
  async function remove(id: number): Promise<"removed" | "not_found" | "error"> {
    try {
      await usersApi.remove(id);
      await list.load();
      return "removed";
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        await list.load();
        return "not_found";
      }

      list.error.value = e instanceof ApiError ? e.message : "Error inesperado.";
      return "error";
    }
  }

  return {
    ...list,
    search,
    isActive,
    orderDesc,
    resetFilters,
    remove,
  };
});
