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

_Colección Postman / Swagger: pendiente (se publicará en `/api/docs` y en `docs/`)._

## Testing

```bash
# Backend
cd backend && npm run test:cov
# Frontend
cd frontend && npm run test:cov
```

_Resultados de cobertura: pendiente de pegar aquí antes de la entrega._

## Deploy

_Links de la app y la API desplegadas: pendiente._

## Notas de seguridad

- Todo el flujo de pago se prueba **solo en Sandbox**.
- Sin datos sensibles de tarjeta persistidos en BD, `localStorage` ni logs.
- HTTPS + security headers (Helmet) en producción; CORS restringido al dominio del frontend.
