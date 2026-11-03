<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import Alert from "../components/ui/Alert.vue";
import FormField from "../components/ui/FormField.vue";
import PageHeader from "../components/ui/PageHeader.vue";
import { ApiError } from "../api/http";
import { productsApi } from "../api/products";
import { useProductsStore } from "../stores/products";
import type { ProductViewModel } from "../types/product";

/**
 * Alta y edición de productos. Mismo esquema que UserFormView: `products.create`
 * no trae id y `products.edit` lo trae por params.
 *
 * A diferencia de Users aquí no hay campo opcional "omitir si vacío": los
 * cuatro campos de ProductUpdateDTO son obligatorios, así que todos se
 * envían siempre.
 */
const route = useRoute();
const router = useRouter();
const products = useProductsStore();

const isEdit = computed(() => route.name === "products.edit");
const productId = computed(() => Number(route.params.id));

const form = reactive({ sku: "", name: "", description: "", price: 0 });
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
    const product: ProductViewModel = await productsApi.get(productId.value);
    form.sku = product.sku ?? "";
    form.name = product.name ?? "";
    form.description = product.description ?? "";
    form.price = product.price;
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : "No se pudo cargar el producto.";
  } finally {
    loading.value = false;
  }
});

async function submit(): Promise<void> {
  if (saving.value) return;

  saving.value = true;
  error.value = null;
  fieldErrors.value = {};

  // `description` vacía se omite para que quede null en la BD, no "".
  const payload = {
    sku: form.sku.trim(),
    name: form.name.trim(),
    price: form.price,
    ...(form.description.trim() ? { description: form.description.trim() } : {}),
  };

  try {
    if (isEdit.value) {
      await productsApi.update(productId.value, payload);
    } else {
      await productsApi.create(payload);
    }

    await router.push({ name: "products" });
    await products.load();
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
      :title="isEdit ? 'Editar producto' : 'Nuevo producto'"
      :description="isEdit ? `Producto #${productId}` : 'Alta en el módulo de productos'"
    />

    <Alert v-if="loading" variant="info">Cargando producto…</Alert>

    <form v-else class="space-y-4" novalidate @submit.prevent="submit">
      <FormField
        input-id="sku"
        label="SKU"
        hint="(único en todo el catálogo)"
        required
        :errors="fieldErrors.SKU"
      >
        <input
          id="sku"
          v-model="form.sku"
          type="text"
          required
          minlength="2"
          maxlength="50"
          placeholder="SKU-1001"
          class="field font-mono"
          :class="invalid('SKU') && 'field-invalid'"
        />
      </FormField>

      <FormField
        input-id="product-name"
        label="Nombre"
        required
        :errors="fieldErrors.Name"
      >
        <input
          id="product-name"
          v-model="form.name"
          type="text"
          required
          minlength="2"
          maxlength="100"
          class="field"
          :class="invalid('Name') && 'field-invalid'"
        />
      </FormField>

      <FormField
        input-id="product-price"
        label="Precio"
        required
        :errors="fieldErrors.Price"
      >
        <input
          id="product-price"
          v-model.number="form.price"
          type="number"
          required
          min="0"
          step="0.01"
          inputmode="decimal"
          class="field tabular-nums"
          :class="invalid('Price') && 'field-invalid'"
        />
      </FormField>

      <FormField
        input-id="product-description"
        label="Descripción"
        hint="(opcional, hasta 500 caracteres)"
        :errors="fieldErrors.Description"
      >
        <textarea
          id="product-description"
          v-model="form.description"
          rows="3"
          maxlength="500"
          class="field resize-y"
          :class="invalid('Description') && 'field-invalid'"
        />
      </FormField>

      <Alert v-if="error" variant="error">{{ error }}</Alert>

      <div class="flex gap-3">
        <button type="submit" :disabled="saving" class="btn-primary">
          {{ saving ? "Guardando…" : "Guardar" }}
        </button>

        <RouterLink :to="{ name: 'products' }" class="btn-secondary">
          Cancelar
        </RouterLink>
      </div>
    </form>
  </section>
</template>
