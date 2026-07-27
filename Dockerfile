# Imagen única que sirve la API (NestJS) + el SPA (React) compilado.
# Un solo servicio, una sola URL, sin CORS. Modo pasarela por env (simulado por defecto).

# --- Stage 1: compilar el frontend ---
FROM node:22-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
# El SPA consume la API en el mismo origen.
ENV VITE_API_URL=/api/v1
RUN npm run build

# --- Stage 2: compilar el backend ---
FROM node:22-alpine AS backend
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
RUN npm run build && npm prune --omit=dev

# --- Stage 3: runtime ---
FROM node:22-alpine AS runtime
WORKDIR /app/backend
ENV NODE_ENV=production
ENV PAYMENT_GATEWAY_MODE=simulated
COPY --from=backend /app/backend/node_modules ./node_modules
COPY --from=backend /app/backend/dist ./dist
COPY --from=backend /app/backend/package.json ./package.json
# El SPA compilado se sirve desde ./client (ver ServeStaticModule).
COPY --from=frontend /app/frontend/dist ./client
EXPOSE 3000
# Corre migraciones, siembra (idempotente) y arranca la API.
CMD ["npm", "run", "deploy:start"]
