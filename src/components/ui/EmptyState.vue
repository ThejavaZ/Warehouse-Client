<script setup lang="ts">
/**
 * Lista vacía. El slot `action` deja pasar el botón que corresponda
 * (crear el primer registro, limpiar filtros…).
 */
withDefaults(defineProps<{ message?: string }>(), {
  message: "No hay resultados.",
});
</script>

<template>
  <div class="px-4 py-8 text-center">
    <p class="text-sm text-slate-500">{{ message }}</p>
    <div v-if="$slots.action" class="mt-3 flex justify-center">
      <slot name="action" />
    </div>
  </div>
</template>
