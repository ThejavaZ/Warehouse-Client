<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
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
    <div>
      <h2 class="text-2xl font-semibold tracking-tight">
        {{ isEdit ? "Editar usuario" : "Nuevo usuario" }}
      </h2>
      <p class="mt-1 text-sm text-slate-600">
        <code class="rounded bg-slate-200 px-1">
          {{ isEdit ? `PUT /api/User/${userId}` : "POST /api/User" }}
        </code>
      </p>
    </div>

    <p v-if="loading" class="text-sm text-slate-600">Cargando usuario…</p>

    <form v-else class="space-y-4" novalidate @submit.prevent="submit">
      <div>
        <label for="name" class="block text-sm font-medium">Nombre</label>
        <input
          id="name"
          v-model="form.name"
          type="text"
          required
          minlength="2"
          maxlength="100"
          class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          :class="fieldErrors.Name && 'border-red-400'"
        />
        <p v-for="msg in fieldErrors.Name" :key="msg" class="mt-1 text-xs text-red-600">
          {{ msg }}
        </p>
      </div>

      <div>
        <label for="user-email" class="block text-sm font-medium">Correo</label>
        <input
          id="user-email"
          v-model="form.email"
          type="email"
          required
          autocomplete="off"
          class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          :class="fieldErrors.Email && 'border-red-400'"
        />
        <p v-for="msg in fieldErrors.Email" :key="msg" class="mt-1 text-xs text-red-600">
          {{ msg }}
        </p>
      </div>

      <div>
        <label for="user-password" class="block text-sm font-medium">
          Contraseña
          <span v-if="isEdit" class="font-normal text-slate-500">
            (déjala en blanco para no cambiarla)
          </span>
        </label>
        <input
          id="user-password"
          v-model="form.password"
          type="password"
          :required="!isEdit"
          minlength="8"
          :placeholder="isEdit ? 'Sin cambios' : 'Mínimo 8 caracteres'"
          autocomplete="new-password"
          class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          :class="fieldErrors.Password && 'border-red-400'"
        />
        <p v-for="msg in fieldErrors.Password" :key="msg" class="mt-1 text-xs text-red-600">
          {{ msg }}
        </p>
      </div>

      <p
        v-if="error"
        class="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700"
      >
        {{ error }}
      </p>

      <div class="flex gap-3">
        <button
          type="submit"
          :disabled="saving"
          class="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {{ saving ? "Guardando…" : "Guardar" }}
        </button>

        <RouterLink
          :to="{ name: 'users' }"
          class="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-100"
        >
          Cancelar
        </RouterLink>
      </div>
    </form>
  </section>
</template>
