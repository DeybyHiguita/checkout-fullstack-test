# Despliegue (Railway)

La app se despliega como **un solo servicio**: la API de NestJS sirve además el SPA de
React compilado (mismo origen, sin CORS). El `Dockerfile` de la raíz compila frontend y
backend y produce una imagen que, al arrancar, **corre las migraciones, siembra los
productos y levanta el servidor**.

- Modo de pasarela: **simulado** por defecto (sin llaves). Ver el final para usar el sandbox real.
- CI (GitHub Actions) valida lint + tests + cobertura + build en cada push/PR a `main`.

## Requisitos

- Cuenta en [Railway](https://railway.app) (login con GitHub).
- El repo ya está en GitHub: `DeybyHiguita/checkout-fullstack-test`.

## Pasos

### 1. Crear el proyecto y el servicio

1. En Railway: **New Project → Deploy from GitHub repo** → elige `checkout-fullstack-test`.
2. Railway detecta el `Dockerfile` (config en `railway.json`) y empieza a construir.

### 2. Agregar PostgreSQL

1. Dentro del proyecto: **New → Database → Add PostgreSQL**.
2. Railway crea la base y expone la variable `DATABASE_URL` del plugin.

### 3. Conectar la base al servicio

En el **servicio de la app → pestaña Variables**, agrega:

| Variable | Valor |
|---|---|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (referencia al plugin de Postgres) |

> `NODE_ENV=production` y `PAYMENT_GATEWAY_MODE=simulated` ya vienen fijados en el
> `Dockerfile`. `PORT` lo inyecta Railway automáticamente. `DB_SSL` queda en `false`
> (la red interna de Railway no usa SSL).

### 4. Exponer el dominio

En el servicio: **Settings → Networking → Generate Domain**. Railway te da una URL
pública `https://<algo>.up.railway.app`.

### 5. Desplegar y verificar

Railway redepliega en cada push a `main`. Al arrancar ejecuta `npm run deploy:start`
(migraciones → seed → server). Verifica:

- App (SPA): `https://<tu-dominio>/`
- API: `https://<tu-dominio>/api/v1/products`
- Swagger: `https://<tu-dominio>/api/v1/docs`

Prueba el flujo completo con las tarjetas de demo (`4242 4242 4242 4242` aprueba;
termina en `0002` declina). El botón flotante ⚡ de autollenado aparece por estar en
modo simulado.

## Checklist previo a entregar

- [ ] La app carga en HTTPS y el flujo de las 5 pantallas funciona en el ambiente desplegado.
- [ ] La API responde en `/api/v1/...` y Swagger en `/api/v1/docs`.
- [ ] El seed corrió (hay productos en el catálogo).
- [ ] README actualizado con la URL desplegada.

## Usar el sandbox REAL en el deploy

En las **Variables** del servicio (los valores nunca se versionan; son secrets del proveedor):

```
PAYMENT_GATEWAY_MODE=real
GATEWAY_BASE_URL=<UAT sandbox URL>
GATEWAY_PUBLIC_KEY=<pub_...>
GATEWAY_PRIVATE_KEY=<prv_...>
GATEWAY_INTEGRITY_SECRET=<...integrity...>
GATEWAY_EVENTS_KEY=<...events...>
```

El frontend tokeniza la tarjeta en el navegador con la **llave pública**, que Vite hornea
en **tiempo de build**. El `Dockerfile` declara `ARG GATEWAY_PUBLIC_KEY` y `ARG GATEWAY_BASE_URL`
en el stage `frontend`, y Railway los inyecta automáticamente desde las variables del
servicio (mismos nombres) → el SPA queda apuntando al sandbox real. La llave **privada** y el
secreto de **integridad** los usa solo el backend; **nunca** llegan al navegador.

Tras cambiar a `real`, **haz un Redeploy** para que se reconstruya el frontend con la llave
pública. Prueba con la tarjeta de sandbox `4242 4242 4242 4242` (aprobada).

## Alternativa: frontend y backend separados

Si prefieres separar (p. ej. frontend en Vercel), despliega solo el backend en Railway
(quita el `COPY` del `client` y el `ServeStaticModule`), y en Vercel importa la carpeta
`frontend/` con `VITE_API_URL` apuntando a la URL del backend, añadiendo `CORS_ORIGIN`
con el dominio de Vercel en el backend.
