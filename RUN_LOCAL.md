# Cómo correr el proyecto en local

Guía paso a paso para levantar, **parar** y **volver a correr** el checkout completo
(backend NestJS + frontend React + PostgreSQL) en tu máquina.

- Backend (API): http://localhost:3000/api/v1 — Swagger en `/api/v1/docs`
- Frontend (SPA): http://localhost:5173
- Base de datos: PostgreSQL en `localhost:5432` (contenedor Docker)

Por defecto la pasarela va en **modo simulado** (sin llaves, sin red) para que todo
funcione de una. Al final está cómo usar el sandbox real.

---

## 0. Requisitos (una sola vez)

- **Node.js 22+** y **npm 10+** → `node -v`
- **Docker Desktop** corriendo → `docker info` (si falla, abre Docker Desktop)
- Terminal en la carpeta del proyecto: `checkout-fullstack-test/`

---

## 1. Primera vez (setup inicial)

Hazlo una sola vez. Son 2 terminales: una para el **backend**, otra para el **frontend**.

### 1.1 Backend

```bash
cd backend
cp .env.example .env          # crea tu .env local (ya trae PAYMENT_GATEWAY_MODE=simulated)
npm install                   # instala dependencias
docker compose up -d          # levanta PostgreSQL en :5432
npm run migration:run         # crea las tablas
npm run db:seed               # siembra 4 productos con stock
npm run start:dev             # arranca la API con recarga en caliente
```

Déjala corriendo. Deberías ver `Nest application successfully started`.

### 1.2 Frontend (otra terminal)

```bash
cd frontend
npm install                   # instala dependencias
npm run dev                   # arranca Vite en :5173
```

Abre **http://localhost:5173** y prueba el flujo completo:
Producto → Tarjeta → Resumen → Resultado.

---

## 2. Uso diario: parar y volver a correr

### 2.1 Parar los servicios

- **Backend / Frontend**: en su terminal, presiona `Ctrl + C`.
- **PostgreSQL (Docker)**: se puede dejar corriendo. Para pararlo:
  ```bash
  cd backend
  docker compose stop           # detiene el contenedor (conserva los datos)
  ```

Si quieres parar procesos "colgados" que quedaron en segundo plano:
```bash
pkill -f "nest start"    # backend
pkill -f "vite"          # frontend
```

### 2.2 Volver a correr (arranque normal)

Ya no repites el setup; solo arrancas.

**Terminal 1 — Backend:**
```bash
cd backend
docker compose up -d          # asegura Postgres arriba (no hace nada si ya está)
npm run start:dev
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

> Nota: **no** necesitas volver a correr `migration:run` ni `db:seed` — los datos
> persisten en el volumen de Docker. Solo los corres si reiniciaste la base (ver 4.3).

---

## 3. Probar el pago (modo simulado, sin llaves)

En la pantalla de tarjeta, el resultado se decide por el número:

| Tarjeta | Resultado |
|---|---|
| `4242 4242 4242 4242` | ✅ Aprobada |
| cualquiera que **termine en `0002`** (ej. `4000 0000 0000 0002`) | ❌ Declinada |
| termine en `0119` | ⚠️ Error técnico |

Expiración futura (ej. `12/29`), CVC de 3 dígitos (ej. `123`), titular cualquiera.

---

## 4. Comandos útiles

### 4.1 Correr las pruebas

```bash
# Backend (unit + cobertura, gate 80%)
cd backend && npm run test:cov

# Backend E2E (requiere Postgres arriba; usa una BD checkout_e2e aparte)
cd backend && npm run test:e2e

# Frontend
cd frontend && npm run test          # o npm run test:cov
```

### 4.2 Ver el estado de la base / Docker

```bash
docker ps                                   # ¿está corriendo checkout-postgres?
docker compose -f backend/docker-compose.yml logs -f postgres   # logs de la BD
```

### 4.3 Reiniciar la base desde cero (catálogo limpio)

```bash
cd backend
docker exec checkout-postgres psql -U postgres -d checkout -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
npm run migration:run
npm run db:seed
```

O borrando todo el contenedor y su volumen:
```bash
cd backend
docker compose down -v        # elimina contenedor Y datos
docker compose up -d
npm run migration:run
npm run db:seed
```

---

## 5. Usar la pasarela REAL (sandbox, con llaves)

Solo si tienes las llaves de sandbox. En `backend/.env`:

```
PAYMENT_GATEWAY_MODE=real
GATEWAY_BASE_URL=<UAT sandbox URL>
GATEWAY_PUBLIC_KEY=<pub_...>
GATEWAY_PRIVATE_KEY=<prv_...>
GATEWAY_INTEGRITY_SECRET=<...integrity...>
GATEWAY_EVENTS_KEY=<...events...>
```

Y en `frontend/.env` (para tokenizar la tarjeta desde el navegador):
```
VITE_GATEWAY_PUBLIC_KEY=<pub_...>
VITE_GATEWAY_BASE_URL=<UAT sandbox URL>
```

Reinicia backend y frontend. Las llaves **nunca** se suben al repo (`.env` está en
`.gitignore`). Para volver al modo demo, pon `PAYMENT_GATEWAY_MODE=simulated`.

---

## 6. Problemas comunes

| Síntoma | Solución |
|---|---|
| `Cannot connect to the Docker daemon` | Abre Docker Desktop y espera a que diga "running". |
| El backend no conecta a la BD | `docker compose up -d` en `backend/`; revisa `docker ps`. |
| `port 3000 already in use` | `lsof -ti:3000 \| xargs kill` (o `:5173`, `:5432`). |
| La app carga pero no muestra productos | ¿Corriste `migration:run` y `db:seed`? ¿El backend está arriba? |
| Cambié `.env` y no toma efecto | Reinicia el proceso (`Ctrl+C` y vuelve a arrancar). |
| Quiero empezar 100% limpio | Sección 4.3 (`docker compose down -v` + migración + seed). |

---

## Resumen ultra-rápido (ya instalado)

```bash
# Terminal 1
cd backend && docker compose up -d && npm run start:dev
# Terminal 2
cd frontend && npm run dev
# Abrir http://localhost:5173
```
