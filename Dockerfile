FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .
RUN mkdir -p /app/logs
RUN npm run build

FROM nginx:alpine

ENV BACKEND_URL=http://backend:8000
ENV NGINX_ENVSUBST_FILTER=^BACKEND_URL$

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template

EXPOSE 80
