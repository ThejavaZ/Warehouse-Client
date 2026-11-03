<script setup lang="ts" generic="T">
import { useSlots } from "vue";

/**
 * Tabla genérica con estados integrados.
 *
 * El padre declara las columnas y rellena cada celda con un slot con nombre
 * `cell-<key>`; si no se aporta slot, se pinta el valor tal cual. El slot
 * `actions` añade la última columna (solo si se usa, para no dejar un hueco).
 *
 * `generic="T"` conserva el tipo de la fila en los slots: en la vista `row`
 * sigue siendo `UserListViewModel` y no `unknown`.
 */
export interface TableColumn {
  /** Clave del dato y sufijo del slot (`cell-<key>`). */
  key: string;
  label: string;
  align?: "left" | "right";
}

const props = withDefaults(
  defineProps<{
    columns: TableColumn[];
    rows: readonly T[];
    /** Identificador estable de la fila (la API usa `id`). */
    rowKey: (row: T) => string | number;
    loading?: boolean;
    emptyMessage?: string;
  }>(),
  { loading: false, emptyMessage: "No hay resultados." },
);

const slots = useSlots();

function alignClass(align: TableColumn["align"]): string {
  return align === "right" ? "text-right" : "text-left";
}

/**
 * Lee una celda sin exigir que el tipo de fila tenga índice de firmas
 * (las interfaces no lo tienen). El valor se pinta como texto.
 */
function cellValue(row: T, key: string): unknown {
  return (row as Record<string, unknown>)[key];
}

/** Total de columnas visibles: las declaradas más la de acciones si existe. */
function columnCount(): number {
  return props.columns.length + (slots.actions ? 1 : 0);
}
</script>

<template>
  <div class="overflow-x-auto rounded-lg border border-slate-200 bg-white">
    <table class="min-w-full divide-y divide-slate-200 text-sm">
      <thead class="bg-slate-50 text-slate-500">
        <tr>
          <th
            v-for="column in columns"
            :key="column.key"
            scope="col"
            class="px-4 py-2 font-medium"
            :class="alignClass(column.align)"
          >
            {{ column.label }}
          </th>
          <th v-if="slots.actions" scope="col" class="px-4 py-2 text-right font-medium">
            Acciones
          </th>
        </tr>
      </thead>

      <tbody class="divide-y divide-slate-100">
        <tr v-if="loading">
          <td :colspan="columnCount()" class="px-4 py-6 text-center text-slate-500">
            <slot name="loading">Cargando…</slot>
          </td>
        </tr>

        <tr v-else-if="rows.length === 0">
          <td :colspan="columnCount()" class="px-4 py-6 text-center text-slate-500">
            <slot name="empty">{{ emptyMessage }}</slot>
          </td>
        </tr>

        <template v-else>
          <tr v-for="row in rows" :key="rowKey(row)" class="hover:bg-slate-50">
            <td
              v-for="column in columns"
              :key="column.key"
              class="px-4 py-2"
              :class="alignClass(column.align)"
            >
              <!--
                El nombre del slot se construye en runtime: `cell-<key>`.
                Sin slot propio, se pinta el valor crudo de la columna.
              -->
              <slot :name="`cell-${column.key}`" :row="row">
                {{ cellValue(row, column.key) }}
              </slot>
            </td>

            <td v-if="slots.actions" class="px-4 py-2 text-right">
              <slot name="actions" :row="row" />
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>
