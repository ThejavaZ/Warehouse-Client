<script setup lang="ts">
import HeaderComponent from "../components/common/HeaderComponent.vue";
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-900">
    <HeaderComponent />

    <main class="mx-auto w-full max-w-6xl px-4 py-8">
      <RouterView />
    </main>
  </div>
</template>
