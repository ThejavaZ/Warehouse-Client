import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/auth";

/**
 * Rutas de la aplicación. Se van añadiendo junto con su vista para que cada
 * commit deje el proyecto compilando y navegable.
 *
 * `requiresAuth` y `guestOnly` se resuelven en el guard de abajo.
 */
export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: () => import("../views/HomeView.vue"),
    },
    {
      path: "/login",
      name: "login",
      component: () => import("../views/LoginView.vue"),
      meta: { guestOnly: true },
    },
    {
      path: "/users",
      name: "users",
      component: () => import("../views/UsersView.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/users/new",
      name: "users.create",
      component: () => import("../views/UserFormView.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/users/:id/edit",
      name: "users.edit",
      component: () => import("../views/UserFormView.vue"),
      meta: { requiresAuth: true },
    },
    // Sin coincidencia → inicio, en vez de una página en blanco.
    { path: "/:pathMatch(.*)*", redirect: "/" },
  ],
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();

  // Al recargar la página solo hay refresh token: se canjea antes de decidir.
  await auth.ensureRestored();

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: "login", query: { redirect: to.fullPath } };
  }

  // Con sesión abierta el login no aporta nada: se manda al listado.
  if (to.meta.guestOnly && auth.isAuthenticated) {
    return { name: "home" };
  }
});
