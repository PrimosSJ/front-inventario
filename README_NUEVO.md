# POTO — Frontend

Interfaz web de **POTO** (*Plataforma Optimizada de Trazabilidad y Organización*), el sistema de inventario y préstamo de equipamiento de los laboratorios del departamento de informática.

Es una **SPA en React 18 + Vite** que consume la API REST del backend ([back-inventario](../back-inventario)). Desde aquí los ayudantes de laboratorio gestionan el inventario (calculadoras, notebooks, routers, Raspberry Pi, cables, juegos de mesa…), registran préstamos, marcan devoluciones y consultan el historial por RUT.

> Para el panorama completo del sistema — arquitectura, modelos de datos y estado del proyecto — ver [ESTADO_PROYECTO.md](../ESTADO_PROYECTO.md).

---

## Stack

Extraído de [package.json](package.json).

### Dependencias

| Librería | Versión | Rol |
|---|---|---|
| `react` / `react-dom` | ^18.3.1 | Base de la SPA |
| `react-router-dom` | ^6.24.1 | Enrutado con `createBrowserRouter` |
| `@tanstack/react-query` | ^5.101.0 | Caché y mutaciones optimistas de préstamos |
| `axios` | ^1.7.2 | Cliente HTTP con interceptores de auth |
| `socket.io-client` | ^4.7.5 | Conexión WebSocket con el backend |
| `@tailwindcss/vite` | ^4.3.1 | Plugin de Tailwind v4 para Vite |
| `tailwind-variants` | ^3.2.2 | Variantes de los componentes UI propios (`tv()`) |
| `tailwind-merge` | ^3.6.0 | Resolución de conflictos de clases |
| `framer-motion` | ^12.40.0 | Animaciones y transiciones de página |
| `@floating-ui/react` | ^0.27.19 | Posicionamiento de tooltips y menús |
| `xlsx` | ^0.18.5 | Import/export de inventario en Excel |
| `qrcode.react` | ^4.0.1 | Render de códigos QR |
| `@emailjs/browser` | ^4.4.1 | Envío de correos desde el navegador (opcional) |

### Dependencias de desarrollo

| Librería | Versión | Rol |
|---|---|---|
| `vite` | ^5.3.1 | Bundler y dev server |
| `@vitejs/plugin-react` | ^4.3.1 | Fast Refresh y JSX |
| `tailwindcss` | ^4.3.1 | Motor de estilos |
| `daisyui` | ^5.0.0 | Componentes base y sistema de temas |
| `eslint` + plugins react | ^8.57.0 | Linting |
| `postcss` / `autoprefixer` | — | Procesamiento CSS |
| `@types/react` / `@types/react-dom` | ^18.3.x | Tipos para el editor (el proyecto es JS, no TS) |

> ⚠️ **`prop-types` se usa en 16 archivos pero no está en `package.json`.** Hoy funciona porque
> llega como dependencia transitiva. Si esa cadena cambia, el build se rompe. Conviene declararlo:
> `npm install prop-types`

---

## Requisitos previos

- **Node.js 20 o superior** — es la versión que usa el [Dockerfile](Dockerfile) (`node:20-alpine`)  y la que exigen Vite 5 y Tailwind 4.
- **npm** (viene con Node).
- El **backend corriendo** en `http://localhost:4000` (o el host que configures). Ver  [back-inventario/README_NUEVO.md](../back-inventario/README_NUEVO.md).

---

## Instalación

```bash
cd front-inventario
npm install
```

---

## Variables de entorno

**No existe un `.env.example` en el repositorio.** La lista completa está abajo, obtenida de las apariciones reales de `import.meta.env` en el código. Todas se centralizan en [src/config/env.config.js](src/config/env.config.js), salvo las de EmailJS que se leen directo en [src/services/email.service.js](src/services/email.service.js).

Vite solo expone al cliente las variables con prefijo `VITE_`.

| Variable | Requerida | Default | Qué hace |
|---|---|---|---|
| `VITE_API_URL` | No | `http://localhost:4000` | URL base del backend. La usa axios y también socket.io |
| `VITE_IGNORE_AUTH_BACKEND` | No | `false` | `"true"` activa el **modo mock**: salta el login. Solo desarrollo |
| `VITE_EMAIL_ENABLED` | No | `false` | `"true"` activa el envío de correos por EmailJS |
| `VITE_EMAILJS_SERVICE_ID` | Solo si hay email | — | ID del servicio de EmailJS |
| `VITE_EMAILJS_TEMPLATE_PRESTAMO` | Solo si hay email | — | Plantilla de confirmación de préstamo |
| `VITE_EMAILJS_TEMPLATE_RECORDATORIO` | Solo si hay email | — | Plantilla de recordatorio de devolución |
| `VITE_EMAILJS_PUBLIC_KEY` | Solo si hay email | — | Clave pública de EmailJS |

> Las comparaciones son contra el **string** `"true"`, no contra un booleano: `import.meta.env.VITE_EMAIL_ENABLED === "true"`. Cualquier otro valor cuenta como desactivado.

### `.env` mínimo para desarrollo local

```env
VITE_API_URL=http://localhost:4000
```

Si el backend está en `localhost:4000`, este archivo es **opcional** — el default ya apunta ahí.

### `.env` completo con todas las opciones

```env
# API
VITE_API_URL=http://localhost:4000

# Modo mock: salta el login (SOLO desarrollo)
VITE_IGNORE_AUTH_BACKEND=false

# Correos (EmailJS)
VITE_EMAIL_ENABLED=false
VITE_EMAILJS_SERVICE_ID=service_xxxxxxx
VITE_EMAILJS_TEMPLATE_PRESTAMO=template_xxxxxxx
VITE_EMAILJS_TEMPLATE_RECORDATORIO=template_xxxxxxx
VITE_EMAILJS_PUBLIC_KEY=xxxxxxxxxxxxxxxx
```

`.env` está en el [.gitignore](.gitignore) — no se versiona.

### Dos advertencias sobre las variables

⚠️ **Se inyectan en tiempo de build, no de ejecución.** Cambiar el `.env` exige reconstruir (`npm run build`) o reiniciar el dev server. Para Docker, esto significa que pasarlas como `environment:` en el compose **no tiene efecto**: hay que tenerlas presentes al construir la imagen.

⚠️ **Todo lo que lleve prefijo `VITE_` queda visible en el bundle** que descarga el navegador. No pongas secretos ahí. Las claves de EmailJS son públicas por diseño, así que en ese caso no hay problema.

---

## Comandos disponibles

Definidos en [package.json](package.json):

| Comando | Qué hace |
|---|---|
| `npm run dev` | Dev server de Vite en **http://localhost:3000** con HMR |
| `npm run build` | Build de producción a `dist/` |
| `npm run preview` | Sirve localmente el contenido de `dist/` para verificar el build |
| `npm run lint` | ESLint sobre `.js` y `.jsx`, con `--max-warnings 0` |

### Notas sobre el dev server

La configuración en [vite.config.js](vite.config.js) fija:

```js
server: {
  watch: { usePolling: true },  // detecta cambios en volúmenes Docker y en algunos FS de Windows
  host: true,                    // escucha en 0.0.0.0 → accesible desde otros equipos de la red
  strictPort: true,              // si el 3000 está ocupado, FALLA en vez de saltar al 3001
  port: 3000,
}
```

`strictPort: true` es la causa habitual de que `npm run dev` no arranque: si algo más ocupa el 3000, Vite aborta en vez de buscar otro puerto.

### Nota sobre el lint

`--max-warnings 0` convierte cualquier *warning* en fallo. Si `npm run lint` falla en un repo que no has tocado, revisa la salida antes de asumir que rompiste algo — parte del código actual genera warnings de `react-hooks` y de `key` en listas.

---

## Estructura de carpetas

```
front-inventario/
├── index.html                 Entrada de Vite. Fija data-theme="dark"
├── vite.config.js             Plugins y configuración del dev server
├── .eslintrc.cjs              ESLint (config legacy, no flat config)
├── Dockerfile                 ⚠️ corre `npm run dev`, no un build de producción
├── docker-compose.yml         Servicio único, mapea 8005:3000
├── public/                    Estáticos servidos tal cual: logo, background, favicon
└── src/
    ├── main.jsx               Punto de entrada de React
    ├── App.jsx                Árbol de providers y router
    ├── router.config.jsx      ⚠️ ARCHIVO MUERTO — ver abajo
    ├── api/                   Capa HTTP
    ├── config/                Lectura centralizada de env
    ├── context/               Estado global (Auth, Socket)
    ├── hooks/                 Lógica de datos reutilizable
    ├── routes/                Definición del enrutado + layout
    ├── pages/                 Una vista por ruta
    ├── components/            UI, agrupada por dominio
    ├── services/              Integraciones externas (Excel, EmailJS)
    ├── utils/                 Funciones puras
    └── css/                   Estilos globales y tema
```

### Qué contiene cada carpeta

**`src/api/`** — Toda la comunicación HTTP, una función por endpoint.

- `client.js` — instancia de axios con dos interceptores: uno inyecta el token de `localStorage` en  cada request; el otro, ante un `401`, borra el token y recarga la página (salvo en modo mock).
- `auth.api.js` — `loginRequest` y `verifyTokenRequest`. Usan `fetch` nativo, **no** la instancia  axios, para evitar el bucle de recarga al verificar un token inválido.
- `inventory.api.js` — 9 funciones de inventario.
- `loans.api.js` — 5 funciones de préstamos.

**`src/config/`** — `env.config.js`, el único lugar donde se leen las variables `VITE_*` de la app (las de EmailJS son la excepción). Si necesitas una variable nueva, agrégala aquí en vez de leer `import.meta.env` desde un componente.

**`src/context/`** — Estado global.

- `AuthContext.jsx` — sesión, `login`, `logout`, verificación del token al montar, modo mock. Se consume con el hook `useAuth()`.
- `SocketContext.jsx` — abre **una sola** conexión socket.io compartida por toda la app. Se consume con `useSocket()`.

**`src/hooks/`** — Lógica de datos, separada de la presentación.

- `useInventory.js` — `useInventoryData` (fetch, filtro por texto y categoría, orden con las   categorías primero, expansión de filas) y `useExtensionComments` (modal de comentarios).
- `useLoans.js` — `useLoansData` (TanStack Query, filtros, ordenamiento) más las mutaciones  `useReturnLoanMutation` y `useBulkReturnLoansMutation`, ambas con actualización optimista y
  rollback automático ante error.
- `useExcelImport.js` — parseo del archivo, estado de la vista previa y confirmación del import.

Los hooks de datos aceptan **inyección de dependencias** para la capa API (`useInventoryData({ getInventory })`), pensado para poder mockearlos en tests.

**`src/routes/`** — El enrutado **activo**.

- `index.jsx` — `createBrowserRouter` con las tres rutas reales.
- `MainLayout.jsx` — `Header` + transiciones de página con Framer Motion vía `useOutlet`.

**`src/pages/`** — Una vista de nivel superior por ruta (detalle en la sección siguiente).

**`src/components/`** — UI agrupada por dominio.

| Subcarpeta | Contenido |
|---|---|
| `auth/` | `LoginForm` (formulario de acceso), `ProtectedRoute` (bloquea la app sin sesión) |
| `inventario/` | `AgregarItem`, `EditarItem`, `EliminarItem`, `SelectCategoria`, `QRRender` |
| `prestamos/` | `AgregarPrestamo` (modal de préstamo), `DevolverPrestamo`, `ReturnStatus` (badge de plazo) |
| `layout/` | `Header` (navegación y sesión), `DataPageLayout` (envoltorio estándar de páginas con tabla) |
| `shared/` | `RutReader` (input de RUT compatible con lector de cédula), `AlertasDevoluciones` (componente invisible que dispara recordatorios) |
| `ui/` | Sistema de diseño propio: `Table`, `Button`, `Menu`, `Tooltip`, `SearchBar`, `Skeleton`, `DataStateManager`, `QueryStateManager` |
| `icons/` | 24 íconos SVG como componentes React, con un `index.js` que los reexporta |

**`src/services/`** — Integraciones externas.

- `excel.service.js` — `exportarExcel` (descarga `inventario_POTO_YYYY-MM-DD.xlsx`) y `parsearExcel`  (lee el archivo y valida que existan las columnas `Nombre`, `Descripción`, `Categoría`, `Stock`).
- `email.service.js` — EmailJS con guarda: si `VITE_EMAIL_ENABLED` no es `"true"`, las funciones   resuelven de inmediato sin hacer nada.

**`src/utils/`** — Funciones puras, sin dependencias de React.

- `rut.utils.js` — `extractRutFromInput` (interpreta la salida del lector de cédula chilena, patrón   `RUN¿…`) y `formatRut` (formatea a `12.345.678-9`).
- `date.utils.js` — `formatTimestamp` (`Hoy, 16:42` / `Ayer, 09:15` / `12 jun, 12:00`),  `getPrestamoDate`, `calcularTexto`.
- `search.utils.js` — `normalizeText` (quita acentos vía NFD y pasa a minúsculas) y `lazyMatch`.
- `inventory.utils.js` — `generateExtensionCodes`, `validateExtensionGeneration` (tope de 50 códigos por generación, detección de colisiones) y `buildItemPayload`.

**`src/css/`**

- `index.css` — importa Tailwind v4, declara el plugin de DaisyUI con un tema `dark` personalizado   (primario violeta `#A259FF` sobre base `#1E1E1E`) y define la animación shimmer de los skeletons.   La configuración de Tailwind vive **aquí**, no en un `tailwind.config.js` — es el enfoque  CSS-first de Tailwind v4.
- `functions.css` — función CSS `--transparent()` basada en `oklch`, usada por los badges rayados  de `ReturnStatus`.

> ⚠️ **`src/router.config.jsx` es código muerto.** No lo importa nadie y sus imports apuntan a archivos que ya no existen (`./components/Inventario`, `./components/Prestamos`, `./components/inventario/ItemView`, `./components/prestamos/GetAllByRut`, `./components/shared/Header`). Es un resto de la estructura previa al rehacer del frontend.
> El enrutado real está en [src/routes/index.jsx](src/routes/index.jsx). **Se puede borrar.**

---

## Páginas y vistas

El router ([src/routes/index.jsx](src/routes/index.jsx)) define **tres rutas**, todas hijas de `MainLayout`:

| Ruta | Componente | Archivo |
|---|---|---|
| `/` | `LoansPage` | [src/pages/LoansPage.jsx](src/pages/LoansPage.jsx) |
| `/inventario` | `InventoryPage` | [src/pages/InventoryPage.jsx](src/pages/InventoryPage.jsx) |
| `/historial_rut` | `HistoryPage` | [src/pages/HistoryPage.jsx](src/pages/HistoryPage.jsx) |

### `/` — Préstamos (pantalla principal)

Es la vista por defecto, la que queda abierta en el mesón. Tabla de todos los préstamos con:

- **Búsqueda** simultánea sobre nombre, RUT, producto y email, insensible a acentos.
- **Filtros** por estado (todos / solo pendientes / finalizados — por defecto **solo pendientes**) y   por tipo (todos / especial / público). Un punto en el botón *Filtrar* avisa cuando hay filtros   activos distintos del default.
- **Ordenamiento** por RUT, nombre, email, producto o fecha, ascendente o descendente.
- **Selección múltiple** con checkboxes (incluye "seleccionar todo" con estado indeterminado). Solo   se pueden seleccionar préstamos no finalizados.
- **Barra de acción flotante** que aparece animada al seleccionar y permite devolver el lote completo.   Si son más de 2, pide confirmación.
- **Badge de estado** por fila (`ReturnStatus`): `Completado`, `Pendiente`, tiempo restante con  código de color, o `Vencido hace N días`.
- Íconos de tipo de préstamo (estrella = especial, globo = público) y de comentario, ambos con tooltip.

### `/inventario` — Inventario

Tabla de todos los items, con las categorías ordenadas primero:

- **Filas expandibles** para items de tipo `categoria`: al hacer clic se despliega, con animación,  una subtabla con cada extensión, su estado (Disponible / Prestado) y su comentario.
- **Indicador de disponibilidad** `disponibles/total` con barra de progreso y tooltip de porcentajes;  se pinta en rojo cuando no queda nada.
- **Búsqueda** por nombre o descripción, y **filtro** por categoría.
- **Menú `⋮` por fila** con *Editar producto* y *Prestar* (deshabilitado si no hay stock).
- **Exportar** — descarga el inventario completo en Excel.
- **Importar** — carga un `.xlsx`/`.xls`, muestra vista previa y reporta errores por fila.
- **Agregar Item** — modal de creación.

Modales que se abren desde esta página: agregar item, editar item (incluye QR y borrado), agregar préstamo, comentario de extensión, y vista previa de importación.

### `/historial_rut` — Historial por RUT

Consulta de todos los préstamos de una persona:

- Campo de RUT con `RutReader` (acepta lector de cédula o escritura manual) y botón *Buscar*.
- Tabla con todos los préstamos de ese RUT, activos e históricos.
- Botón **Marcar Devuelto** directo sobre las filas pendientes.
- Sin RUT ingresado muestra un estado vacío explicativo, no un skeleton infinito.

> ⚠️ La búsqueda es de **coincidencia exacta** del string del RUT contra la base de datos. Un RUT guardado como `20.345.678-5` no se encuentra buscando `20345678`. Ver [ESTADO_PROYECTO.md](../ESTADO_PROYECTO.md) § 4.3.

### Elementos presentes en todas las páginas

**`Header`** ([src/components/layout/Header.jsx](src/components/layout/Header.jsx)) — logo con el significado de la sigla al pasar el cursor, navegación a las tres rutas con indicador de la activa, botón **"Prestar con QR"** (abre el modal de préstamo con buscador por texto), email del usuario y botón de logout.

**`LoginForm`** — no es una ruta. `ProtectedRoute` envuelve el `RouterProvider` completo en [App.jsx](src/App.jsx), así que sin sesión válida se muestra el formulario de login **en lugar de toda la aplicación**.

**`AlertasDevoluciones`** — componente invisible (retorna `null`) montado a nivel de `App`. Si el envío de correos está activado, revisa cada 30 minutos los préstamos especiales que vencen dentro de 24 horas y manda recordatorio. Con `VITE_EMAIL_ENABLED=false` no hace absolutamente nada, ni siquiera el polling.

---

## Arquitectura de datos en el cliente

Hay **dos estrategias conviviendo**, y conviene saber cuál toca antes de modificar algo:

| | Préstamos | Inventario |
|---|---|---|
| Gestión | TanStack Query (`useQuery` / `useMutation`) | `useState` + `useEffect` |
| Caché | Sí, `staleTime` de 5 min | No |
| Updates optimistas | Sí, con rollback automático | No |
| Query key | `["loans"]` | — |
| Hook | `useLoansData` | `useInventoryData` |

El `QueryClient` se configura en [App.jsx](src/App.jsx) con `staleTime: 5 min` y
`refetchOnWindowFocus: false` (para que cambiar de pestaña no dispare refetches en el mesón).

Migrar el inventario a TanStack Query sería la unificación natural, pero hoy **no está hecha**.

### Tiempo real

⚠️ Los hooks escuchan los eventos `inventoryUpdate` y `prestamosUpdate` por socket.io, pero **el backend no emite ninguno de los dos**. La conexión se establece y queda abierta sin tráfico. En la práctica: los cambios hechos por otro ayudante en otra sesión **no aparecen sin recargar**. Ver [ESTADO_PROYECTO.md](../ESTADO_PROYECTO.md) § 2.

---

## Build de producción

```bash
npm run build     # genera dist/
npm run preview   # verifica el resultado localmente
```

`dist/` contiene estáticos que puede servir cualquier servidor web. Recuerda que **las variables `VITE_*` quedan congeladas en el bundle en el momento del build**: para apuntar a otro backend hay que reconstruir.

### Docker

```bash
docker compose up --build -d      # queda en http://localhost:8005
```

⚠️ El [Dockerfile](Dockerfile) actual ejecuta `npm run dev` — es decir, corre el **dev server de Vite** dentro del contenedor, no un build estático. Funciona, pero para producción real corresponde un build multi-stage que compile con `npm run build` y sirva `dist/` con nginx.

⚠️ El [docker-compose.yml](docker-compose.yml) no define variables de entorno, así que la imagen se  construye con `VITE_API_URL` en su default `http://localhost:4000` — que dentro del contenedor apunta al contenedor mismo, no al backend. Para un despliegue real hay que pasar la URL como build arg o incluir un `.env` al construir.

---

## Problemas frecuentes

| Síntoma | Causa probable |
|---|---|
| `npm run dev` no arranca | Puerto 3000 ocupado y `strictPort: true` hace que Vite aborte en vez de saltar al 3001 |
| La app se queda en el login sin error | El backend no responde, o `VITE_API_URL` apunta al lugar equivocado |
| Login devuelve error de servidor | `JWT_SECRET` sin definir en el `.env` del **backend** |
| Todas las llamadas fallan con `401` y la página recarga en bucle | Token expirado (duran 24h). El interceptor limpia y recarga; basta con volver a entrar |
| El historial por RUT sale vacío | Formato del RUT distinto al almacenado — la búsqueda es exacta |
| Los cambios de otro ayudante no aparecen | Esperado: socket.io no emite eventos. Recargar |
| No llegan correos | `VITE_EMAIL_ENABLED` no es `"true"`, o faltan las claves `VITE_EMAILJS_*` |
| Cambié el `.env` y no pasó nada | Las variables se inyectan en build: reinicia el dev server o reconstruye |
| Error de importación sobre `prop-types` | No está declarado en `package.json`: `npm install prop-types` |
