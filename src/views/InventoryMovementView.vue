<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute } from "vue-router";
import Alert from "../components/ui/Alert.vue";
import FormField from "../components/ui/FormField.vue";
import PageHeader from "../components/ui/PageHeader.vue";
import { ApiError } from "../api/http";
import { useInventoryStore } from "../stores/inventory";
import type { InventoryItemViewModel } from "../types/inventory";

/**
 * Registro de un movimiento de inventario: entrada (restock) o salida
 * (consume).
 *
 * A diferencia de los formularios de Users, Products y Warehouses, este no
 * navega al listado al terminar. Un albarán suele llevar varios movimientos
 * seguidos sobre el mismo par, así que se queda aquí mostrando las
 * existencias resultantes, con el almacén y el producto ya elegidos.
 *
 * El modo y el par pueden venir precargados en la query desde las acciones
 * del listado (`?warehouseId=3&productId=7&mode=consume`).
 */
const route = useRoute();
const inventory = useInventoryStore();

const form = reactive({
  mode: "restock" as "restock" | "consume",
  warehouseId: null as number | null,
  productId: null as number | null,
  quantity: 1 as number | "",
});

const submitting = ref(false);
const error = ref<string | null>(null);
/** Mensajes de validación por campo que devuelve la API. */
const fieldErrors = ref<Record<string, string[]>>({});
/** Existencias tras el último movimiento aplicado, para el aviso de éxito. */
const lastResult = ref<InventoryItemViewModel | null>(null);

const isConsume = computed(() => form.mode === "consume");

const title = computed(() => (isConsume.value ? "Registrar salida" : "Registrar entrada"));

/**
 * Traduce los códigos de error propios del módulo, que la API devuelve en
 * inglés. Las validaciones de DataAnnotations sí vienen ya en español en
 * `errors`, así que solo se tocan los códigos de negocio.
 *
 * Se conoce `quantity` (lo que acaba de pedir el usuario), pero no cuánto
 * había: decir "solo hay 3" exigiría leerlo del error, que lo trae como
 * texto suelto en inglés. Preferible perder el número a inventarlo.
 */
function describeError(e: ApiError, quantity: number): string {
  switch (e.code) {
    case "insufficient_stock":
      return `Saldo insuficiente: no quedan existencias suficientes para las ${quantity} unidades pedidas.`;
    case "no_stock_record":
      return "Este par almacén–producto aún no tiene ficha de existencias. Registra una entrada para crearla.";
    case "inactive_warehouse":
      return "El almacén seleccionado está de baja y no admite movimientos.";
    case "inactive_product":
      return "El producto seleccionado está de baja y no admite movimientos.";
    case "not_found":
      return "El almacén o el producto seleccionado ya no existe.";
    case "stock_update_conflict":
      return "Otra operación estaba actualizando el stock a la vez. Inténtalo de nuevo.";
    case "invalid_quantity":
      return "La cantidad debe ser al menos 1.";
    default:
      return e.message;
  }
}

function invalid(field: string): boolean {
  return (fieldErrors.value[field]?.length ?? 0) > 0;
}

onMounted(() => {
  // Precarga desde las acciones del listado.
  const mode = route.query.mode;
  if (mode === "restock" || mode === "consume") form.mode = mode;

  const warehouseId = Number(route.query.warehouseId);
  if (Number.isInteger(warehouseId) && warehouseId > 0) form.warehouseId = warehouseId;

  const productId = Number(route.query.productId);
  if (Number.isInteger(productId) && productId > 0) form.productId = productId;

  void inventory.loadOptions();
});

async function submit(): Promise<void> {
  if (submitting.value) return;

  const quantity = Number(form.quantity);

  // El guard incluye NaN: `v-model.number` devuelve el texto tal cual si no
  // es numérico, y JSON.stringify convierte NaN en null, que la API
  // rechazaría como "cantidad obligatoria" en vez de un error de formato.
  if (form.warehouseId === null || form.productId === null || !Number.isFinite(quantity)) {
    return;
  }

  submitting.value = true;
  error.value = null;
  fieldErrors.value = {};

  try {
    const item = await inventory.move(form.mode, {
      warehouseId: form.warehouseId,
      productId: form.productId,
      quantity: Math.trunc(quantity),
    });

    lastResult.value = item;
    // La cantidad se vacía a propósito: repetir la última sin mirar es
    // como se cuelan dobles entradas. El par se queda, que es lo común.
    form.quantity = 1;
  } catch (e) {
    lastResult.value = null;

    if (e instanceof ApiError) {
      if (e.code === "invalid_quantity") {
        // DomainException lo lanza en inglés; se traduce y se pinta bajo el
        // campo, que es donde corresponde.
        fieldErrors.value = { Quantity: ["La cantidad debe ser al menos 1."] };
        error.value = null;
      } else if (Object.keys(e.fieldErrors).length > 0) {
        // Validación de DataAnnotations: el mensaje ya viene en español,
        // en `errors`, y solo hace falta señalar dónde está el problema.
        fieldErrors.value = e.fieldErrors;
        error.value = "Revisa los campos marcados.";
      } else {
        fieldErrors.value = {};
        error.value = describeError(e, quantity);
      }
    } else {
      error.value = "Error inesperado.";
    }
  } finally {
    submitting.value = false;
  }
}

/** Cambia de modo y limpia lo que solo tenía sentido en el anterior. */
function setMode(mode: "restock" | "consume"): void {
  form.mode = mode;
  error.value = null;
  lastResult.value = null;
}
</script>

<template>
  <section class="mx-auto max-w-lg space-y-4">
    <PageHeader
      :title="title"
      description="El movimiento actualiza las existencias del par almacén–producto"
    />

    <!-- Sin opciones no se puede elegir nada, y el motivo importa. -->
    <Alert v-if="inventory.optionsError" variant="error">
      {{ inventory.optionsError }}
    </Alert>
    <Alert v-else-if="inventory.optionsLoading" variant="info">
      Cargando almacenes y productos…
    </Alert>
    <Alert
      v-else-if="inventory.warehouses.length === 0 || inventory.products.length === 0"
      variant="warning"
    >
      Hacen falta almacenes y productos activos antes de poder mover inventario.
    </Alert>

    <!--
      El modo va en dos botones y no en un select: son las dos únicas
      operaciones y elegir mal es costoso, así que se ve de un vistazo cuál
      está activo.
    -->
    <div class="flex gap-2" role="group" aria-label="Tipo de movimiento">
      <button
        type="button"
        class="btn-secondary flex-1"
        :class="!isConsume && 'border-primary-500 bg-primary-50 text-primary-700'"
        :aria-pressed="!isConsume"
        @click="setMode('restock')"
      >
        Entrada
      </button>
      <button
        type="button"
        class="btn-secondary flex-1"
        :class="isConsume && 'border-red-300 bg-red-50 text-red-700'"
        :aria-pressed="isConsume"
        @click="setMode('consume')"
      >
        Salida
      </button>
    </div>

    <form class="space-y-4" novalidate @submit.prevent="submit">
      <FormField input-id="move-warehouse" label="Almacén" required>
        <select
          id="move-warehouse"
          v-model="form.warehouseId"
          class="field"
          required
          :disabled="inventory.optionsLoading"
        >
          <option :value="null" disabled>Selecciona un almacén</option>
          <option
            v-for="w in inventory.warehouses"
            :key="w.id"
            :value="w.id"
            :disabled="!w.isActive"
          >
            {{ w.name ?? `Almacén #${w.id}` }}{{ w.isActive ? "" : " (de baja)" }}
          </option>
        </select>
      </FormField>

      <FormField input-id="move-product" label="Producto" required>
        <select
          id="move-product"
          v-model="form.productId"
          class="field"
          required
          :disabled="inventory.optionsLoading"
        >
          <option :value="null" disabled>Selecciona un producto</option>
          <option
            v-for="p in inventory.products"
            :key="p.id"
            :value="p.id"
            :disabled="!p.isActive"
          >
            {{ p.sku ?? `#${p.id}` }} — {{ p.name ?? "Sin nombre" }}
            {{ p.isActive ? "" : "(de baja)" }}
          </option>
        </select>
      </FormField>

      <FormField
        input-id="move-quantity"
        label="Cantidad"
        :hint="isConsume ? '(unidades que salen)' : '(unidades que entran)'"
        required
        :errors="fieldErrors.Quantity"
      >
        <input
          id="move-quantity"
          v-model.number="form.quantity"
          type="number"
          required
          min="1"
          step="1"
          inputmode="numeric"
          class="field tabular-nums"
          :class="invalid('Quantity') && 'field-invalid'"
        />
      </FormField>

      <Alert v-if="error" variant="error">{{ error }}</Alert>

      <Alert v-if="lastResult" variant="success">
        Movimiento aplicado.
        <strong>{{ lastResult.quantity }}</strong>
        unidades en
        {{ lastResult.warehouseName ?? `almacén #${lastResult.warehouseId}` }}
        para
        {{ lastResult.productSku ?? `producto #${lastResult.productId}` }}.
      </Alert>

      <div class="flex gap-3">
        <button
          type="submit"
          :disabled="submitting || inventory.optionsLoading"
          class="btn-primary"
        >
          {{ submitting ? "Aplicando…" : isConsume ? "Registrar salida" : "Registrar entrada" }}
        </button>

        <RouterLink :to="{ name: 'inventory' }" class="btn-secondary">
          Volver
        </RouterLink>
      </div>
    </form>
  </section>
</template>
