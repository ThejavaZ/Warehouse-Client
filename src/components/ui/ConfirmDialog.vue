<script setup lang="ts">
/**
 * Diálogo de confirmación para acciones destructivas (borrar, dar de baja).
 *
 * Controlado por el padre: `open` decide cuándo se muestra y el padre cierra
 * en `confirm` o en `cancel`. Se teletransporta al body para que no quede
 * dentro de la tabla, y `role="alertdialog"` anuncia la urgencia.
 */
withDefaults(
  defineProps<{
    open: boolean;
    title: string;
    message?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    /** Botón de confirmación en rojo: para acciones destructivas. */
    danger?: boolean;
    /** Deshabilita los botones mientras la petición está en curso. */
    loading?: boolean;
  }>(),
  {
    message: undefined,
    confirmLabel: "Confirmar",
    cancelLabel: "Cancelar",
    danger: false,
    loading: false,
  },
);

const emit = defineEmits<{ confirm: []; cancel: [] }>();
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      role="alertdialog"
      aria-modal="true"
      :aria-label="title"
      @click.self="!loading && emit('cancel')"
      @keydown.esc="!loading && emit('cancel')"
    >
      <div class="w-full max-w-sm rounded-lg bg-white p-5 shadow-xl">
        <h3 class="text-base font-semibold tracking-tight">{{ title }}</h3>
        <p v-if="message" class="mt-2 text-sm text-slate-600">{{ message }}</p>

        <div class="mt-5 flex justify-end gap-3">
          <button
            type="button"
            class="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-100 disabled:opacity-50"
            :disabled="loading"
            @click="emit('cancel')"
          >
            {{ cancelLabel }}
          </button>

          <button
            type="button"
            class="rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            :class="danger
              ? 'bg-red-600 hover:bg-red-500'
              : 'bg-slate-900 hover:bg-slate-700'"
            :disabled="loading"
            @click="emit('confirm')"
          >
            {{ loading ? "Procesando…" : confirmLabel }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
