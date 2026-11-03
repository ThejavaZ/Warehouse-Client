<script setup lang="ts">
import { reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
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
    error.value = e instanceof ApiError ? e.message : "Error inesperado.";
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <section class="mx-auto max-w-sm">
    <h2 class="text-2xl font-semibold tracking-tight">Iniciar sesión</h2>
    <p class="mt-2 text-sm text-slate-600">
      Introduce tus credenciales para obtener un access token.
    </p>

    <p
      v-if="auth.sessionExpired"
      class="mt-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800"
    >
      Tu sesión ha caducado. Vuelve a iniciar sesión.
    </p>

    <form class="mt-6 space-y-4" novalidate @submit.prevent="submit">
      <div>
        <label for="email" class="block text-sm font-medium">Correo</label>
        <input
          id="email"
          v-model="form.email"
          type="email"
          required
          autocomplete="username"
          class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
      </div>

      <div>
        <label for="password" class="block text-sm font-medium">Contraseña</label>
        <input
          id="password"
          v-model="form.password"
          type="password"
          required
          autocomplete="current-password"
          class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
      </div>

      <p
        v-if="error"
        class="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700"
      >
        {{ error }}
      </p>

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
