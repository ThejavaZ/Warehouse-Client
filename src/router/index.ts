import { createRouter, createWebHistory } from "vue-router";

/**
 * Rutas de la aplicación. Se van añadiendo junto con su vista para que cada
 * commit deje el proyecto compilando y navegable.
 */
export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: () => import("../views/HomeView.vue"),
    },
    // Sin coincidencia → inicio, en vez de una página en blanco.
    { path: "/:pathMatch(.*)*", redirect: "/" },
  ],
});
