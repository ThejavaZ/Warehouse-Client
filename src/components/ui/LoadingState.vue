<script setup lang="ts">
/**
 * Estado de carga de una tabla o listado. Sin dependencias de la API.
 * No lleva padding: quien lo encaja (la celda de DataTable) lo pone, para
 * no duplicarlo.
 */
withDefaults(defineProps<{ message?: string }>(), { message: "Cargando…" });
</script>

<template>
  <div class="flex items-center justify-center gap-2 text-sm text-slate-500">
    <svg
      class="h-4 w-4 animate-spin text-slate-400"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
    {{ message }}
  </div>
</template>
