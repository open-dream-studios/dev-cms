# Dockerfile

# =========================
# BUILD STAGE
# =========================
FROM node:20-bookworm AS build
ENV LD_LIBRARY_PATH=/usr/local/lib
  
RUN apt-get update && apt-get install -y \
  build-essential \
  python3 \
  pkg-config \
  meson \
  ninja-build \
  cmake \
  git \
  libglib2.0-dev \
  libexpat1-dev \
  liborc-0.4-dev \
  libjpeg-dev \
  libpng-dev \
  libtiff-dev \
  # libheif-dev \ 
  libde265-dev \
  libx265-dev \
  && rm -rf /var/lib/apt/lists/*

# Build modern libheif
RUN git clone https://github.com/strukturag/libheif.git /tmp/libheif \
  && cd /tmp/libheif \
  && mkdir build && cd build \
  && cmake .. \
     -DENABLE_PLUGIN_LOADING=ON \
     -DENABLE_X265=ON \
     -DENABLE_LIBDE265=ON \
  && make -j$(nproc) \
  && make install \
  && ldconfig \
  && rm -rf /tmp/libheif

# Build libvips WITH HEIF + x265
RUN git clone --branch v8.17.3 https://github.com/libvips/libvips.git /tmp/libvips \
  && cd /tmp/libvips \
  && meson setup builddir --prefix=/usr \
     -Dheif=enabled \
  && ninja -C builddir \
  && ninja -C builddir install \
  && ldconfig \
  && rm -rf /tmp/libvips

WORKDIR /usr/src/app

COPY server ./server
COPY shared ./shared
COPY package.json package-lock.json ./

# IMPORTANT: do NOT ignore global libvips
RUN npm ci --workspaces --include=optional

# IMPORTANT: rebuild sharp against system libvips
RUN npm rebuild sharp --build-from-source --sharp-libvips=system

RUN npm run build --workspace=shared
# RUN npm run build --workspace=server
RUN npx tsc -b server --force

# =========================
# RUNTIME STAGE
# =========================
FROM node:20-bookworm
ENV LD_LIBRARY_PATH=/usr/local/lib

RUN apt-get update && apt-get install -y default-mysql-client \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

COPY --from=build /usr/lib /usr/lib
COPY --from=build /usr/local/lib /usr/local/lib
COPY --from=build /usr/src/app/server/dist ./dist
COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/package.json ./
COPY --from=build /usr/src/app/shared ./shared

RUN ldconfig

CMD ["node", "dist/index.js"]