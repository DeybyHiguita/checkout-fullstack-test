# Checkout Full-Stack Test

Aplicación de **checkout de un producto** pagado a través de una pasarela de pagos (en modo **Sandbox**, sin dinero real). Incluye onboarding de datos de tarjeta y de entrega, y un flujo obligatorio de **5 pantallas**:

> Producto → Tarjeta/Entrega → Resumen → Estado final → Producto (con stock actualizado)

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React + Redux Toolkit + TypeScript (Vite) |
| Backend | NestJS + TypeScript — Arquitectura Hexagonal (Ports & Adapters) + Railway Oriented Programming |
| Base de datos | PostgreSQL + TypeORM |
| Testing | Jest (backend y frontend), objetivo **>80%** de cobertura |
| Deploy | Vercel (frontend) + Railway/Render (backend + Postgres) |

## Estructura del monorepo

```
checkout-fullstack-test/
├── backend/    # API NestJS (hexagonal + ROP)
├── frontend/   # SPA React + Redux
├── docs/       # Colección Postman / OpenAPI (pendiente)
└── README.md
```

## Cómo correr en local

### Requisitos
- Node.js 22+, npm 10+
- Docker (para PostgreSQL local) — _o_ una instancia de Postgres accesible.

### Backend
```bash
cd backend
cp .env.example .env        # completar variables (ver sección Variables de entorno)
npm install
docker compose up -d        # PostgreSQL local en :5432
npm run migration:run       # crea el esquema
npm run db:seed             # siembra productos dummy + stock
npm run start:dev           # http://localhost:3000/api/v1
```

### Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev                 # http://localhost:5173
```

## Variables de entorno

Las llaves de la pasarela **nunca** se versionan; van en `.env` local (ignorado por git) o como secrets en el proveedor de deploy. Ver `backend/.env.example` y `frontend/.env.example` para la lista completa.

- Backend: conexión a Postgres, llaves de la pasarela (pública/privada/eventos/integridad), fees, CORS.
- Frontend: `VITE_API_URL` (backend propio) y `VITE_GATEWAY_PUBLIC_KEY` (única llave que llega al navegador, para tokenizar la tarjeta).

## Arquitectura

- **Backend hexagonal:** el dominio y los casos de uso no conocen NestJS, TypeORM ni la pasarela; todo entra por puertos/adaptadores.
- **ROP:** los casos de uso retornan `Result<T, E>` (éxito/error tipado) en vez de lanzar excepciones para flujos de negocio esperables (tarjeta declinada, sin stock, etc.).
- **Datos sensibles:** el backend nunca almacena PAN/CVC; solo tokeniza contra la pasarela y guarda marca + últimos 4 dígitos.

_(Detalle de modelo de datos, endpoints y máquina de estados: pendiente de documentar a medida que se implementa.)_

## API

Base URL local: `http://localhost:3000/api/v1`. Todas las respuestas de error usan el shape
`{ statusCode, error, message, details? }`.

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/products` | Lista productos con unidades comprables |
| GET | `/products/:id` | Detalle de producto + stock |
| GET | `/customers/:id` | Detalle de cliente |
| GET | `/deliveries/:id` | Detalle de entrega |
| POST | `/transactions` | Crea transacción `PENDING` y reserva stock |
| POST | `/transactions/:id/pay` | Ejecuta el pago contra la pasarela y resuelve la transacción |
| GET | `/transactions/:id` | Estado de la transacción (polling) |
| GET | `/transactions/number/:n` | Estado por número legible (`TXN-YYYYMMDD-000123`) |
| GET | `/payments/acceptance-token` | Token de aceptación de términos de la pasarela |

**Documentación interactiva:** con el backend corriendo, **Swagger UI** está en
`http://localhost:3000/api/v1/docs`. El contrato OpenAPI se exporta con `npm run docs:openapi`
a [`backend/docs/openapi.json`](backend/docs/openapi.json), y hay una **colección Postman** lista
en [`backend/docs/postman_collection.json`](backend/docs/postman_collection.json).

### Modo de pasarela: real vs simulado (demo local sin llaves)

`PAYMENT_GATEWAY_MODE` controla la implementación:

- `simulated` (por defecto si no hay `GATEWAY_BASE_URL`): **no hace llamadas de red**; el
  resultado se decide por el token — `tok_decline...` → declinada, `tok_error...` → error,
  cualquier otro → aprobada. Permite probar todo el flujo localmente **sin llaves**.
- `real`: usa el adaptador HTTP contra la pasarela (requiere las llaves de Sandbox).

### Integración con la pasarela de pagos

La integración está implementada y **solo requiere cargar las llaves de Sandbox** en
`backend/.env` (nunca se versionan). Variables:

```
GATEWAY_BASE_URL=<UAT Sandbox URL>
GATEWAY_PUBLIC_KEY=<pub_stagtest_...>
GATEWAY_PRIVATE_KEY=<prv_stagtest_...>
GATEWAY_INTEGRITY_SECRET=<stagtest_integrity_...>
GATEWAY_EVENTS_KEY=<stagtest_events_...>
```

Flujo (adaptador `PaymentGatewayAdapter`, nombre neutro sin marca):

1. El frontend obtiene el `acceptance_token` (`GET /payments/acceptance-token`) y **tokeniza la
   tarjeta directamente contra la pasarela** con la llave pública — el PAN/CVC nunca tocan el backend.
2. `POST /transactions` crea la transacción `PENDING` y reserva stock.
3. `POST /transactions/:id/pay` envía monto, moneda, token de tarjeta, `acceptance_token` y la
   **firma de integridad** (`sha256(reference + amount + currency + secret)`) con la llave privada,
   hace polling hasta un estado terminal y resuelve la transacción vía el pipeline ROP:
   - `APPROVED` → decrementa stock + asigna la entrega.
   - `DECLINED`/`ERROR` → libera la reserva de stock.
   - Si la pasarela no responde → `502` y la transacción **queda `PENDING`** (nunca se asume éxito).

Sin llaves, `/pay` y `/payments/acceptance-token` responden `502 GATEWAY_UNAVAILABLE` (verificado),
lista para funcionar en cuanto se configuren las credenciales.

## Testing

```bash
# Backend — unit + cobertura (gate 80%)
cd backend && npm run test:cov
# Backend — E2E (requiere Postgres arriba; crea una BD checkout_e2e temporal)
cd backend && npm run test:e2e
# Frontend
cd frontend && npm run test:cov
```

Cobertura backend (unit, gate ≥80% en las 4 métricas):

```
All files | % Stmts 97.44 | % Branch 82.9 | % Funcs 98.96 | % Lines 98.54
108 tests, 15 suites — verde.
```

Los E2E (6 casos) cubren el flujo completo contra Postgres real con la pasarela simulada:
aprobado (decrementa stock), declinado (libera stock), sin stock (409), doble pago (409),
validación (400).

_Cobertura de frontend: pendiente (fase de frontend)._

## Deploy

_Links de la app y la API desplegadas: pendiente._

## Notas de seguridad

- **Helmet** (security headers) y **rate limiting** (60 req/min por IP) activos.
- Validación de variables de entorno al arranque (Joi) — la app no levanta si falta algo crítico.
- Validación estricta de entrada (`class-validator`, `whitelist` + `forbidNonWhitelisted`).
- Todo el flujo de pago se prueba **solo en Sandbox**.
- Sin datos sensibles de tarjeta persistidos en BD, `localStorage` ni logs.
- HTTPS en producción; CORS restringido al dominio del frontend.
