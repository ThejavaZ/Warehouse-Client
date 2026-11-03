<script setup lang="ts">
/**
 * Lista vacía. El slot `action` deja pasar el botón que corresponda
 * (crear el primer registro, limpiar filtros…).
 * Sin padding: lo aporta el contenedor que lo encaja.
 */
withDefaults(defineProps<{ message?: string }>(), {
  message: "No hay resultados.",
});
</script>

<template>
  <div class="text-center">
    <p class="text-sm text-slate-500">{{ message }}</p>
    <div v-if="$slots.action" class="mt-3 flex justify-center">
      <slot name="action" />
    </div>
  </div>
</template>
