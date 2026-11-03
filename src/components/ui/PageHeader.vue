<script setup lang="ts">
/**
 * Cabecera de página: título, descripción y acciones a la derecha.
 * Unifica el bloque que se repite en todas las vistas.
 */
withDefaults(
  defineProps<{
    title: string;
    description?: string;
  }>(),
  { description: undefined },
);
</script>

<template>
  <div class="flex flex-wrap items-end justify-between gap-4">
    <div class="min-w-0">
      <h2 class="text-2xl font-semibold tracking-tight">{{ title }}</h2>
      <p v-if="description || $slots.description" class="mt-1 text-sm text-slate-600">
        <slot name="description">{{ description }}</slot>
      </p>
    </div>

    <div v-if="$slots.actions" class="flex shrink-0 gap-2">
      <slot name="actions" />
    </div>
  </div>
</template>
