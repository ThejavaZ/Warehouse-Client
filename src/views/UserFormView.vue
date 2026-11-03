<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import Alert from "../components/ui/Alert.vue";
import FormField from "../components/ui/FormField.vue";
import PageHeader from "../components/ui/PageHeader.vue";
import { ApiError } from "../api/http";
import { usersApi } from "../api/users";
import { useUsersStore } from "../stores/users";
import type { UserViewModel } from "../types/user";

/**
 * Alta y edición de usuarios en una sola vista: `users.create` no trae id y
 * `users.edit` lo trae en los params. La contraseña es obligatoria al crear y
 * opcional al editar.
 */
const route = useRoute();
const router = useRouter();
const users = useUsersStore();

const isEdit = computed(() => route.name === "users.edit");
const userId = computed(() => Number(route.params.id));

const form = reactive({ name: "", email: "", password: "" });
const loading = ref(false);
const saving = ref(false);
const error = ref<string | null>(null);
/** Mensajes de validación por campo que devuelve la API. */
const fieldErrors = ref<Record<string, string[]>>({});

/** Marca el control con borde rojo cuando su campo tiene errores. */
function invalid(field: string): boolean {
  return (fieldErrors.value[field]?.length ?? 0) > 0;
}

onMounted(async () => {
  if (!isEdit.value) return;

  loading.value = true;

  try {
    const user: UserViewModel = await usersApi.get(userId.value);
    form.name = user.name ?? "";
    form.email = user.email ?? "";
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : "No se pudo cargar el usuario.";
  } finally {
    loading.value = false;
  }
});

async function submit(): Promise<void> {
  if (saving.value) return;

  saving.value = true;
  error.value = null;
  fieldErrors.value = {};

  try {
    if (isEdit.value) {
      // Omitir `password` cuando está vacío: la API responde 400 con "".
      await usersApi.update(userId.value, {
        name: form.name.trim(),
        email: form.email.trim(),
        ...(form.password ? { password: form.password } : {}),
      });
    } else {
      await usersApi.create({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });
    }

    // El listado guardado queda obsoleto: se recarga al volver.
    await router.push({ name: "users" });
    await users.load();
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
      :title="isEdit ? 'Editar usuario' : 'Nuevo usuario'"
      :description="isEdit ? `Usuario #${userId}` : 'Alta en el módulo de usuarios'"
    />

    <Alert v-if="loading" variant="info">Cargando usuario…</Alert>

    <form v-else class="space-y-4" novalidate @submit.prevent="submit">
      <FormField
        input-id="name"
        label="Nombre"
        required
        :errors="fieldErrors.Name"
      >
        <input
          id="name"
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
        input-id="user-email"
        label="Correo"
        required
        :errors="fieldErrors.Email"
      >
        <input
          id="user-email"
          v-model="form.email"
          type="email"
          required
          autocomplete="off"
          class="field"
          :class="invalid('Email') && 'field-invalid'"
        />
      </FormField>

      <FormField
        input-id="user-password"
        label="Contraseña"
        :hint="isEdit ? '(déjala en blanco para no cambiarla)' : undefined"
        :required="!isEdit"
        :errors="fieldErrors.Password"
      >
        <input
          id="user-password"
          v-model="form.password"
          type="password"
          :required="!isEdit"
          minlength="8"
          :placeholder="isEdit ? 'Sin cambios' : 'Mínimo 8 caracteres'"
          autocomplete="new-password"
          class="field"
          :class="invalid('Password') && 'field-invalid'"
        />
      </FormField>

      <Alert v-if="error" variant="error">{{ error }}</Alert>

      <div class="flex gap-3">
        <button type="submit" :disabled="saving" class="btn-primary">
          {{ saving ? "Guardando…" : "Guardar" }}
        </button>

        <RouterLink :to="{ name: 'users' }" class="btn-secondary">
          Cancelar
        </RouterLink>
      </div>
    </form>
  </section>
</template>
