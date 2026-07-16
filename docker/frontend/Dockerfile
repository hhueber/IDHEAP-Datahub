# DEV: Vite HMR (Hot Module Replacement) (dev)
FROM node:24.4.1
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
