# Imagen única que sirve la API (NestJS) + el SPA (React) compilado.
# Un solo servicio, una sola URL, sin CORS. Modo pasarela por env (simulado por defecto).

# --- Stage 1: compilar el frontend ---
# NODE_ENV=development durante el build para garantizar que se instalen las
# devDependencies (vite, etc.) aunque el proveedor inyecte NODE_ENV=production.
FROM node:22-alpine AS frontend
ENV NODE_ENV=development
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --include=dev
COPY frontend/ ./
# El SPA consume la API en el mismo origen.
ENV VITE_API_URL=/api/v1
# Llave PÚBLICA + URL de la pasarela para tokenizar la tarjeta en el navegador.
# Se hornean en el build (Vite). Railway las inyecta como build args con los
# mismos nombres del backend. Si van vacías, el frontend queda en modo simulado.
# (La llave privada y el secreto de integridad NUNCA se exponen al frontend.)
ARG GATEWAY_PUBLIC_KEY=""
ARG GATEWAY_BASE_URL=""
ENV VITE_GATEWAY_PUBLIC_KEY=$GATEWAY_PUBLIC_KEY
ENV VITE_GATEWAY_BASE_URL=$GATEWAY_BASE_URL
RUN npm run build

# --- Stage 2: compilar el backend ---
FROM node:22-alpine AS backend
ENV NODE_ENV=development
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --include=dev
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
