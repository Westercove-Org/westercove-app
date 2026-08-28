# Expo web (output: single) → static SPA served by nginx. The ALB path-routes
# API prefixes to the backend BEFORE the request reaches this container, so nginx
# here is static-only (no proxy_pass); it just serves the bundle + SPA fallback.
FROM node:20-bookworm-slim AS build
WORKDIR /app

# EXPO_PUBLIC_* is inlined into the bundle at build time, so these are build
# args, not runtime env (ECS env never reaches the browser bundle). Empty API
# URL => relative, same-origin requests.
ARG EXPO_PUBLIC_API_URL=""
ENV EXPO_PUBLIC_API_URL=$EXPO_PUBLIC_API_URL

# Cognito user-pool + SPA app-client IDs. PUBLIC client identifiers (no secret),
# required for browser SRP sign-in — must be inlined at export time.
ARG EXPO_PUBLIC_COGNITO_USER_POOL_ID=""
ENV EXPO_PUBLIC_COGNITO_USER_POOL_ID=$EXPO_PUBLIC_COGNITO_USER_POOL_ID
ARG EXPO_PUBLIC_COGNITO_CLIENT_ID=""
ENV EXPO_PUBLIC_COGNITO_CLIENT_ID=$EXPO_PUBLIC_COGNITO_CLIENT_ID

COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx expo export --platform web

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
