<script setup lang="ts">
import { reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import Alert from "../components/ui/Alert.vue";
import FormField from "../components/ui/FormField.vue";
import PageHeader from "../components/ui/PageHeader.vue";
import { ApiError } from "../api/http";
import { useAuthStore } from "../stores/auth";

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();

const form = reactive({ email: "", password: "" });
const submitting = ref(false);
const error = ref<string | null>(null);

// Si venimos de una ruta protegida, se vuelve a ella tras autenticarse.
const redirect =
  typeof route.query.redirect === "string" ? route.query.redirect : "/";

async function submit(): Promise<void> {
  if (submitting.value) return;

  error.value = null;
  submitting.value = true;

  try {
    await auth.login({ email: form.email.trim(), password: form.password });
    await router.replace(redirect);
  } catch (e) {
    // En el login un 401 son credenciales incorrectas: no hay fieldErrors.
    error.value = e instanceof ApiError ? e.message : "Error inesperado.";
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <section class="mx-auto max-w-sm space-y-4">
    <PageHeader
      title="Iniciar sesión"
      description="Introduce tus credenciales para obtener un access token."
    />

    <Alert v-if="auth.sessionExpired" variant="warning">
      Tu sesión ha caducado. Vuelve a iniciar sesión.
    </Alert>

    <form class="space-y-4" novalidate @submit.prevent="submit">
      <FormField input-id="email" label="Correo" required>
        <input
          id="email"
          v-model="form.email"
          type="email"
          required
          autocomplete="username"
          class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
      </FormField>

      <FormField input-id="password" label="Contraseña" required>
        <input
          id="password"
          v-model="form.password"
          type="password"
          required
          autocomplete="current-password"
          class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
      </FormField>

      <Alert v-if="error" variant="error">{{ error }}</Alert>

      <button
        type="submit"
        :disabled="submitting"
        class="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
      >
        {{ submitting ? "Entrando…" : "Entrar" }}
      </button>
    </form>
  </section>
</template>
