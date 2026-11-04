import { createApp } from "vue";
import { createPinia } from "pinia";
import "./style.css";
import App from "./App.vue";
import { setUnauthorizedHandler } from "./api/http";
import { router } from "./router";
import { useAuthStore } from "./stores/auth";

const pinia = createPinia();

// Un 401 con token significa que la sesión ya no sirve: se limpia en el store y
// se vuelve al login. El handler lo instala quien conoce el router.
setUnauthorizedHandler(() => {
  useAuthStore(pinia).handleUnauthorized();

  if (router.currentRoute.value.name === "login") {
    return;
  }

  // Se conserva la ruta actual para volver a ella tras autenticarse: es lo
  // mismo que hace el guard en la primera visita. Sin esto, una sesión que
  // caduca a mitad de uso manda al inicio en vez de a donde se estaba
  // trabajando, y lo perdido es justo la página que costó llegar.
  const from = router.currentRoute.value.fullPath;

  void router.push({
    name: "login",
    // La raíz es el destino por defecto del login: no hace falta apuntarla.
    ...(from === "/" ? {} : { query: { redirect: from } }),
  });
});

// Pinia antes que el router: los guards leen stores.
createApp(App).use(pinia).use(router).mount("#app");
