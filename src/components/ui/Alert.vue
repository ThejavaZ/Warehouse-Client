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
  // Error y aviso conservan rojo/ámbar: son colores semánticos, no de marca,
  // y cambiarlos por morado/verde confundiría en vez de aclarar.
  error: "border-red-300 bg-red-50 text-red-700",
  warning: "border-amber-300 bg-amber-50 text-amber-800",
  // El éxito usa el verde oscuro de la paleta, no el acento de Vue, para que
  // el texto pase el contraste AA sobre fondo claro.
  success: "border-success-200 bg-success-50 text-success-900",
  info: "border-primary-200 bg-primary-50 text-primary-800",
};
</script>

<template>
  <div role="alert" class="rounded-md border px-3 py-2 text-sm" :class="styles[props.variant]">
    <p v-if="title" class="font-medium">{{ title }}</p>
    <slot />
  </div>
</template>
