<script setup lang="ts">
import HeaderComponent from "../components/common/HeaderComponent.vue";
</script>

<template>
  <div class="min-h-screen bg-slate-100 text-slate-900">
    <!-- Franja de color: identidad de la app antes de que se vea el contenido -->
    <div class="h-1 bg-gradient-to-r from-primary-700 via-accent-500 to-success-800" />

    <HeaderComponent />

    <main class="mx-auto w-full max-w-6xl px-4 py-8">
      <RouterView />
    </main>
  </div>
</template>
