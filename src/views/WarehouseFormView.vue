<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import Alert from "../components/ui/Alert.vue";
import FormField from "../components/ui/FormField.vue";
import PageHeader from "../components/ui/PageHeader.vue";
import { ApiError } from "../api/http";
import { warehousesApi } from "../api/warehouses";
import { useWarehousesStore } from "../stores/warehouses";
import type { WarehouseViewModel } from "../types/warehouse";

/**
 * Alta y edición de almacenes. Mismo esqueleto que UserFormView y
 * ProductFormView: `warehouses.create` no trae id y `warehouses.edit` lo
 * trae por params.
 *
 * `location` es el único campo opcional y hay que omitirlo si sale vacío:
 * WarehouseService hace `warehouse.Location = dto.Location` sin pasar por
 * nada, así que `""` se guardaría como cadena vacía y `null` (omitido)
 * queda de verdad sin ubicación.
 */
const route = useRoute();
const router = useRouter();
const warehouses = useWarehousesStore();

const isEdit = computed(() => route.name === "warehouses.edit");
const warehouseId = computed(() => Number(route.params.id));

const form = reactive({ name: "", location: "" });
const loading = ref(false);
const saving = ref(false);
const error = ref<string | null>(null);
const fieldErrors = ref<Record<string, string[]>>({});

function invalid(field: string): boolean {
  return (fieldErrors.value[field]?.length ?? 0) > 0;
}

onMounted(async () => {
  if (!isEdit.value) return;

  loading.value = true;

  try {
    const warehouse: WarehouseViewModel = await warehousesApi.get(warehouseId.value);
    form.name = warehouse.name ?? "";
    form.location = warehouse.location ?? "";
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : "No se pudo cargar el almacén.";
  } finally {
    loading.value = false;
  }
});

async function submit(): Promise<void> {
  if (saving.value) return;

  saving.value = true;
  error.value = null;
  fieldErrors.value = {};

  const payload = {
    name: form.name.trim(),
    // Vacío → omitir, para que quede null y no "".
    ...(form.location.trim() ? { location: form.location.trim() } : {}),
  };

  try {
    if (isEdit.value) {
      await warehousesApi.update(warehouseId.value, payload);
    } else {
      await warehousesApi.create(payload);
    }

    await router.push({ name: "warehouses" });
    await warehouses.load();
  } catch (e) {
    if (e instanceof ApiError) {
      error.value = e.message;
      fieldErrors.value = e.fieldErrors;
    } else {
      error.value = "Error inesperado.";
    }
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <section class="mx-auto max-w-lg space-y-4">
    <PageHeader
      :title="isEdit ? 'Editar almacén' : 'Nuevo almacén'"
      :description="isEdit ? `Almacén #${warehouseId}` : 'Alta en el módulo de almacenes'"
    />

    <Alert v-if="loading" variant="info">Cargando almacén…</Alert>

    <form v-else class="space-y-4" novalidate @submit.prevent="submit">
      <FormField
        input-id="warehouse-name"
        label="Nombre"
        hint="(único entre almacenes)"
        required
        :errors="fieldErrors.Name"
      >
        <input
          id="warehouse-name"
          v-model="form.name"
          type="text"
          required
          minlength="2"
          maxlength="100"
          placeholder="Almacén central"
          class="field"
          :class="invalid('Name') && 'field-invalid'"
        />
      </FormField>

      <FormField
        input-id="warehouse-location"
        label="Ubicación"
        hint="(opcional, hasta 200 caracteres)"
        :errors="fieldErrors.Location"
      >
        <input
          id="warehouse-location"
          v-model="form.location"
          type="text"
          maxlength="200"
          placeholder="Calle Mayor 12, Madrid"
          class="field"
          :class="invalid('Location') && 'field-invalid'"
        />
      </FormField>

      <Alert v-if="error" variant="error">{{ error }}</Alert>

      <div class="flex gap-3">
        <button type="submit" :disabled="saving" class="btn-primary">
          {{ saving ? "Guardando…" : "Guardar" }}
        </button>

        <RouterLink :to="{ name: 'warehouses' }" class="btn-secondary">
          Cancelar
        </RouterLink>
      </div>
    </form>
  </section>
</template>
