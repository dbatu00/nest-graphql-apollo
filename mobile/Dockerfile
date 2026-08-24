# ---- Build stage ----
FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# EXPO_PUBLIC_API_URL must be passed at build time:
#   Railway → service → Variables → EXPO_PUBLIC_API_URL=https://your-backend.up.railway.app/graphql
ARG EXPO_PUBLIC_API_URL
ENV EXPO_PUBLIC_API_URL=$EXPO_PUBLIC_API_URL

RUN npx expo export --platform web

# ---- Serve stage ----
FROM nginx:alpine AS runner

COPY --from=builder /app/dist /usr/share/nginx/html

# SPA fallback: all routes → index.html
RUN printf 'server {\n\
    listen ${PORT};\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
    location / {\n\
    try_files $uri $uri/ /index.html;\n\
    }\n\
    }\n' > /etc/nginx/conf.d/default.conf.template

EXPOSE 80

# Railway injects $PORT at runtime. envsubst replaces it in the template
# before nginx starts, so nginx actually listens on the right port.
CMD ["/bin/sh", "-c", "envsubst '$PORT' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
