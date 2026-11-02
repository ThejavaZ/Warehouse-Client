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

  if (router.currentRoute.value.name !== "login") {
    void router.push({ name: "login" });
  }
});

// Pinia antes que el router: los guards leen stores.
createApp(App).use(pinia).use(router).mount("#app");
