# DEV: Vite HMR (Hot Module Replacement) (dev)
FROM node:24.4.1
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
EXPOSE 3000
CMD ["npm","run","dev","--","--host","0.0.0.0","--port","3000"]
