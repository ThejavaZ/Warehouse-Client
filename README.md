# Warehouse Cliente

Cliente web de la [Warehouse API](../Warehouse-API) construido con **Vue 3 + TypeScript + Vite + Tailwind CSS**, usando **bun** como gestor de paquetes.

Su propósito es probar los endpoints de la API desde una UI real: login con JWT y los cuatro módulos de negocio —**Usuarios, Productos, Almacenes e Inventario**— con listado paginado, filtros y alta/edición/baja lógica.

---

## Requisitos

- [bun](https://bun.sh) 1.3 o superior (también vale `npm`/`pnpm`, pero el `bun.lock` está generado con bun)
- La API arrancada en `http://localhost:5259` (ver [Warehouse API](../Warehouse-API#puesta-en-marcha))

---

## Puesta en marcha

```bash
bun install    # instala dependencias
bun run dev    # arranca Vite en http://localhost:5173
```

En otra terminal, la API:

```bash
cd ../Warehouse-API
dotnet run --project src/Api
```

Abrir `http://localhost:5173` e iniciar sesión con un usuario de la API. Si el puerto está ocupado, Vite prueba con el siguiente (`5174`, `5175`…) y lo indica en la terminal.

### Scripts

| Comando           | Qué hace                                     |
| ----------------- | -------------------------------------------- |
| `bun run dev`     | Servidor de desarrollo con hot reload        |
| `bun run build`   | Compila tipos (`vue-tsc`) y genera `dist/`   |
| `bun run preview` | Sirve `dist/` en local para revisar el build |

---

## Proxy a la API

En desarrollo **no hace falta configurar CORS en la API**: `vite.config.ts` reenvía `/api` al puerto 5259.

```ts
server: {
  proxy: {
    "/api": { target: "http://localhost:5259", changeOrigin: true },
  },
},
```

Por eso `src/api/http.ts` usa `baseURL: "/api"`. Para apuntar a otro origen (producción, otro entorno) se define `VITE_API_BASE_URL` en un fichero `.env` — ver [.env.example](.env.example).

---

## Arquitectura (MVVM)

Separación en tres capas, sin framework de MVVM: el patrón es una convención de organización.

```
src/
├── api/                # Model — cliente HTTP y un módulo por recurso
│   ├── http.ts         #   instancia axios, interceptores, tokens, ApiError
│   ├── paged.ts        #   fetchAllPages: recorre todas las páginas (selects)
│   ├── auth.ts         #   /api/Auth
│   ├── users.ts        #   /api/User
│   ├── products.ts     #   /api/Product
│   ├── warehouses.ts   #   /api/Warehouse
│   └── inventory.ts    #   /api/InventoryItem
├── types/              # Contratos espejo de la API (DTOs y ViewModels)
├── composables/
│   └── usePagedList.ts #   paginado compartido por los listados
├── stores/             # ViewModel — estado y acciones (Pinia)
│   ├── auth.ts         #   sesión: login, refresh programado, logout
│   ├── users.ts        #   listado: filtros, paginación, CRUD
│   ├── products.ts     #   ídem
│   ├── warehouses.ts   #   ídem
│   └── inventory.ts    #   listado + movimientos + opciones de los selects
├── views/              # View — una página por ruta
├── components/
│   ├── ui/             #   8 componentes reutilizables (ver abajo)
│   └── common/         #   HeaderComponent
├── layouts/            # Esqueleto con <RouterView />
└── router/             # Rutas + guards de sesión
```

| MVVM          | Aquí                                                                                                           |
| ------------- | -------------------------------------------------------------------------------------------------------------- |
| **Model**     | `api/` + `types/`: la verdad vive en el servidor, el cliente solo tiene el cliente HTTP y los contratos espejo |
| **View**      | el `<template>` de cada `.vue`                                                                                 |
| **ViewModel** | `stores/` (Pinia) y el `<script setup>`: exponen estado reactivo y acciones, sin lógica de negocio en la vista |

Regla práctica: **las vistas no llaman a axios directamente** (usan los módulos de `api/`) y **la API no se conoce en ningún sitio fuera de `api/` y `types/`**.

### Componentes reutilizables (`src/components/ui/`)

| Componente         | Qué resuelve                                                       |
| ------------------ | ------------------------------------------------------------------ |
| `PageHeader`       | título, descripción y acciones a la derecha                         |
| `Alert`            | error/aviso/éxito/información con `role="alert"`                    |
| `DataTable`        | columnas declaradas + slots `cell-<key>`, con loading y vacío dentro |
| `FormField`        | etiqueta, pista y errores de validación; el control va en el slot   |
| `Pagination`       | controlada; emite `change` con la página objetivo                   |
| `LoadingState`     | spinner de lista                                                    |
| `EmptyState`       | lista vacía, con slot `action`                                      |
| `ConfirmDialog`    | confirmación de acciones destructivas, teletransportada al body     |

`DataTable` y `FormField` son genéricos: conservan el tipo de la fila y del campo.

---

## Flujo de sesión

1. `POST /api/Auth/login` devuelve access token + refresh token.
2. Se guardan en `sessionStorage` (`warehouse.accessToken`, `warehouse.refreshToken`): sobreviven a recargar la pestaña y desaparecen al cerrarla.
3. Un interceptor monta `Authorization: Bearer` en cada petición.
4. El store programa un refresh con **30 segundos de margen** antes de que venza el access token.
5. Al recargar la página, los guards esperan a `ensureRestored()`, que canjea el refresh token antes de decidir si la ruta es accesible.
6. Un **401** (token caducado o revocado) limpia la sesión y manda al `/login`. En el login, un 401 significa _credenciales incorrectas_ y no navega a ninguna parte.
7. `POST /api/Auth/revoke` cierra la sesión en el servidor (es idempotente).

### Rutas

| Ruta                                          | Acceso                        |
| --------------------------------------------- | ----------------------------- |
| `/`                                           | pública                       |
| `/login`                                      | solo sin sesión (`guestOnly`) |
| `/users`, `/users/new`, `/users/:id/edit`     | requieren sesión              |
| `/products`, `/products/new`, `/products/:id/edit` | requieren sesión         |
| `/warehouses`, `/warehouses/new`, `/warehouses/:id/edit` | requieren sesión   |
| `/inventory`, `/inventory/movement`           | requieren sesión              |

---

## Módulos

Todos comparten el mismo patrón: `types/` → `api/` → `stores/` → `views/`, con el paginado extraído a `usePagedList` y los filtros propios de cada módulo en su store.

| Módulo      | Listado                                    | Escritura                                        |
| ----------- | ------------------------------------------ | ------------------------------------------------ |
| **Usuarios**    | búsqueda, estado, orden               | alta, edición (contraseña opcional), baja lógica  |
| **Productos**   | búsqueda por nombre o SKU, estado, orden | alta, edición, baja lógica                     |
| **Almacenes**   | búsqueda por nombre o ubicación, estado, orden | alta, edición, baja lógica                |
| **Inventario**  | filtro por almacén y producto        | **movimientos**: entrada (`restock`) y salida (`consume`) |

### Inventario no es un CRUD

`InventoryItem` es la tabla puente almacén–producto. No hay `PUT` ni `DELETE`: la cantidad **no se edita a mano**, solo se mueve.

- `POST /api/InventoryItem/restock` — suma `quantity`; si el par no existe, **crea la ficha**
- `POST /api/InventoryItem/consume` — resta `quantity`; **409** si no hay saldo, **404** si no hay ficha

> El base path es **`/api/InventoryItem`**, no `/api/Inventory`: lo decide el nombre de la clase `InventoryItemController`, porque `[Route("api/[controller]")]` sustituye `[controller]` por el nombre de la clase sin el sufijo `Controller`.

`InventoryMovementView` no navega al listado al terminar a propósito: un albarán suele llevar varios movimientos seguidos sobre el mismo par, así que se queda mostrando las existencias resultantes con el almacén y el producto ya elegidos.

---

## Botones y campos compartidos

`src/style.css` declara en `@layer components` las clases que antes estaban repetidas en cada vista:

`btn-primary` · `btn-secondary` · `btn-danger` · `btn-ghost` · `btn-sm` · `field` · `field-invalid`

Al ir en `@layer`, cualquier utilidad de Tailwind escrita en el template sigue ganando, así que una vista puede sobreescribir sin pelearse con la especificidad.

La paleta se declara en `@theme` (Tailwind v4): **morado** (`primary`, el de .NET) para acciones y foco, **verde** (`accent`, `#42b883`, el de Vue) para acentos, **verde oscuro** (`success`) para confirmaciones, más `slate` y blanco. Sin esas variables no existirían las clases `bg-primary-600` ni `text-accent-500`.

Rojo y ámbar se conservan para error y aviso: son colores semánticos, y cambiarlos por los de marca confundiría en vez de aclarar.

---

## Campos opcionales: omitir, no enviar vacío

Tres casos en los que **`""` no es lo mismo que omitir el campo**, y los tres se resuelven igual: el campo viaja solo si tiene contenido.

**Contraseña en la edición** — `PUT /api/User/{id}` **rechaza `password: ""`** con un 400 (`MinLength(8)`):

```ts
await usersApi.update(id, {
  name,
  email,
  ...(password ? { password } : {}), // si está vacío, no viaja
});
```

**Descripción en productos** y **ubicación en almacenes** — el servicio hace `dto.X` directamente sobre la entidad, así que `""` se guarda como cadena vacía y `null` queda de verdad sin valor. Comprobado contra el servidor: omitir da `"location": null` y enviar `""` da `"location": ""`.

```ts
const payload = {
  name: name.trim(),
  ...(location.trim() ? { location: location.trim() } : {}),
};
```

---

## Manejo de errores

Todos los fallos HTTP se convierten en `ApiError` (`src/api/http.ts`) con:

- `status`: código HTTP (`0` = sin conexión con la API)
- `code`: código de negocio de ProblemDetails (`validation_error`, `not_found`, `insufficient_stock`…)
- `field`: campo al que apunta el error, cuando la API lo sabe de uno solo (SKU, correo o nombre duplicado)
- `fieldErrors`: mensajes de validación agrupados por campo, que la vista pinta debajo de cada input

La API tiene **dos formatos** de error por campo y `toApiError` los unifica en `fieldErrors`:

| Formato        | Cuándo                                     | Ejemplo                                   |
| -------------- | ------------------------------------------ | ----------------------------------------- |
| `errors`       | validación de DataAnnotations, varios campos a la vez | `{"Quantity": ["La cantidad debe ser al menos 1."]}` |
| `field`        | un solo campo, lanzado como `ArgumentException` o `DomainException` | SKU, correo o nombre duplicado |

Sin esa normalización, un duplicado solo llegaría como mensaje general y la vista no sabría debajo de qué input pintarlo.

Los códigos de negocio propios de Inventario (`insufficient_stock`, `no_stock_record`, `inactive_warehouse`…) llegan **en inglés** desde el servicio y `InventoryMovementView` los traduce; los de validación sí vienen ya en español en `errors`.
