FROM ubuntu:latest as builder

# Install any needed packages
RUN apt-get update && \
  apt-get install --no-install-recommends -y build-essential curl git gnupg ca-certificates

# install nodejs
RUN curl -sL https://deb.nodesource.com/setup_lts.x | bash -
RUN apt-get install --no-install-recommends -y nodejs && \
  apt-get clean && \
  rm -rf /var/lib/apt/lists/*
RUN npm install yarn -g

WORKDIR /apps
COPY . .

# Quip hybrid dev signer, baked into the static bundle by default. webpack's
# DefinePlugin reads this at build time (the same `process.env.QUIP_DEV_SIGNER`
# initQuipSigner.ts checks), so it must be set before `yarn build:www` — exactly
# like `QUIP_DEV_SIGNER=1 yarn start` locally. Override with
# `--build-arg QUIP_DEV_SIGNER=` to build an image without the signer.
ARG QUIP_DEV_SIGNER=1
ENV QUIP_DEV_SIGNER=$QUIP_DEV_SIGNER

RUN yarn && NODE_ENV=production yarn build:www

# ===========================================================
FROM nginx:stable-alpine

# The following is mainly for doc purpose to show which ENV is supported
ENV WS_URL=

WORKDIR /usr/share/nginx/html

COPY docker/env.sh .

RUN apk add --no-cache bash; chmod +x env.sh

COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY --from=builder /apps/packages/apps/build /usr/share/nginx/html

EXPOSE 80

CMD ["/bin/bash", "-c", "/usr/share/nginx/html/env.sh && nginx -g \"daemon off;\""]
