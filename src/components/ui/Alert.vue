<script setup lang="ts">
/**
 * Mensaje destacado: error de la API, aviso o confirmación.
 * `role="alert"` hace que los lectores de pantalla lo anuncien.
 */
const props = withDefaults(
  defineProps<{
    variant?: "error" | "success" | "warning" | "info";
    title?: string;
  }>(),
  { variant: "info", title: undefined },
);

const styles: Record<string, string> = {
  error: "border-red-300 bg-red-50 text-red-700",
  success: "border-emerald-300 bg-emerald-50 text-emerald-800",
  warning: "border-amber-300 bg-amber-50 text-amber-800",
  info: "border-sky-300 bg-sky-50 text-sky-800",
};
</script>

<template>
  <div role="alert" class="rounded-md border px-3 py-2 text-sm" :class="styles[props.variant]">
    <p v-if="title" class="font-medium">{{ title }}</p>
    <slot />
  </div>
</template>
