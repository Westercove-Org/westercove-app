# Expo web (output: single) → static SPA served by nginx. The ALB path-routes
# API prefixes to the backend BEFORE the request reaches this container, so nginx
# here is static-only (no proxy_pass); it just serves the bundle + SPA fallback.
FROM node:20-bookworm-slim AS build
WORKDIR /app

# EXPO_PUBLIC_* is inlined into the bundle at build time, so the API base URL is
# a build arg, not a runtime env. Empty => relative, same-origin requests.
ARG EXPO_PUBLIC_API_URL=""
ENV EXPO_PUBLIC_API_URL=$EXPO_PUBLIC_API_URL

COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx expo export --platform web

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
