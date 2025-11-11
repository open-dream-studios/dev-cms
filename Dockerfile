# Dockerfile (example)
FROM node:18-bullseye

# Install system deps (libheif + codecs + build tools)
RUN apt-get update && apt-get install -y \
  build-essential \
  ca-certificates \
  gcc \
  g++ \
  make \
  python3 \
  pkg-config \
  libjpeg-dev \
  libpng-dev \
  libtiff5-dev \
  libavif-dev \
  libheif-dev \
  libde265-dev \
  libx265-dev \
  libvips-dev \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app
COPY package.json package-lock.json ./
# install deps (this will build sharp against system libvips/libheif)
RUN npm ci

COPY . .

# (If you change source, rebuild; you may need `npm rebuild sharp --force` in some setups)
CMD ["node", "server/dist/index.js"]