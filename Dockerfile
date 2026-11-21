FROM node:26-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY bachelors-api/package.json ./bachelors-api/
COPY masters-api/package.json ./masters-api/
COPY shared/package.json ./shared/
COPY web/package.json ./web/
RUN npm ci --ignore-scripts

COPY . ./

ARG VITE_DIPLOMAS_API_URL
ARG VITE_MASTERS_API_URL
ENV VITE_DIPLOMAS_API_URL=${VITE_DIPLOMAS_API_URL}
ENV VITE_MASTERS_API_URL=${VITE_MASTERS_API_URL}

RUN npm run build --workspace theses-listing-web

FROM nginxinc/nginx-unprivileged:alpine AS final

USER root

COPY nginx.conf /etc/nginx/conf.d/default.conf
RUN rm -rf /usr/share/nginx/html/*

COPY --from=build /app/web/dist /usr/share/nginx/html

USER 101

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
