<script setup lang="ts">
/**
 * Paginación de listado. Controlada: el padre guarda la página y decide qué
 * hacer; este componente solo emite `change` con la página objetivo.
 */
withDefaults(
  defineProps<{
    page: number;
    totalPages: number;
    loading?: boolean;
  }>(),
  { loading: false },
);

const emit = defineEmits<{ change: [page: number] }>();

/** Botón deshabilitado en los extremos, para no pedir páginas que no existen. */
function go(target: number): void {
  emit("change", target);
}
</script>

<template>
  <nav
    v-if="totalPages > 1"
    class="flex items-center justify-between text-sm"
    aria-label="Paginación"
  >
    <button
      type="button"
      :disabled="page <= 1 || loading"
      class="rounded-md border border-slate-300 px-3 py-1.5 disabled:opacity-40"
      @click="go(page - 1)"
    >
      Anterior
    </button>

    <span class="text-slate-600" aria-current="page">
      Página {{ page }} de {{ totalPages }}
    </span>

    <button
      type="button"
      :disabled="page >= totalPages || loading"
      class="rounded-md border border-slate-300 px-3 py-1.5 disabled:opacity-40"
      @click="go(page + 1)"
    >
      Siguiente
    </button>
  </nav>
</template>
