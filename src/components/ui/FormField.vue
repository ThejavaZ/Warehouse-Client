<script setup lang="ts">
/**
 * Campo de formulario: etiqueta, pista opcional y errores de validación.
 *
 * El control va en el slot por defecto, así que sirve para input, select o
 * textarea sin que el componente sepa qué es. Los mensajes vienen de
 * `ApiError.fieldErrors` (el `errors` de ValidationProblemDetails).
 */
withDefaults(
  defineProps<{
    /** Id del control, para que el label lo enfoste. */
    inputId: string;
    label: string;
    /** Pista secundaria, p. ej. "déjala en blanco para no cambiarla". */
    hint?: string;
    /** Mensajes de validación de un campo concreto. */
    errors?: string[];
    required?: boolean;
  }>(),
  { hint: undefined, errors: () => [], required: false },
);
</script>

<template>
  <div>
    <label :for="inputId" class="block text-sm font-medium">
      {{ label }}
      <span v-if="required" class="text-red-600" aria-hidden="true">*</span>
      <span v-if="hint" class="font-normal text-slate-500">{{ hint }}</span>
    </label>

    <slot />

    <!-- aria-invalid deja el error accesible además de visible -->
    <p
      v-for="message in errors"
      :key="message"
      class="mt-1 text-xs text-red-600"
      role="alert"
      :aria-describedby="inputId"
    >
      {{ message }}
    </p>
  </div>
</template>
