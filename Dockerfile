# # FROM node:20-bookworm

# # # Install all build dependencies including meson + ninja
# # RUN apt-get update && apt-get install -y \
# #   build-essential ca-certificates gcc g++ make python3 python3-pip pkg-config cmake git curl \
# #   libjpeg-dev libpng-dev libtiff-dev libavif-dev libde265-dev libx265-dev \
# #   libglib2.0-dev libpango1.0-dev libgirepository1.0-dev \
# #   meson ninja-build \
# #   && rm -rf /var/lib/apt/lists/*

# # # Build and install libvips 8.17.3 (required by sharp >=0.34)
# # RUN git clone --branch v8.17.3 https://github.com/libvips/libvips.git /tmp/libvips \
# #   && cd /tmp/libvips \
# #   && meson setup builddir --prefix=/usr \
# #   && ninja -C builddir \
# #   && ninja -C builddir install \
# #   && ldconfig \
# #   && rm -rf /tmp/libvips

# # # Optional: Build and install libheif for HEIC/AVIF image support
# # RUN git clone https://github.com/strukturag/libheif.git /tmp/libheif \
# #   && cd /tmp/libheif && mkdir build && cd build \
# #   && cmake -DENABLE_PLUGIN_LOADING=ON -DENABLE_X265=ON -DENABLE_LIBDE265=ON -DENABLE_LIBAVIF=ON .. \
# #   && make -j"$(nproc)" && make install && ldconfig \
# #   && rm -rf /tmp/libheif

# # WORKDIR /usr/src/app
# # COPY . .

# # RUN npm ci --workspaces
# # RUN npm rebuild sharp --build-from-source --sharp-libvips=system
# # RUN npm run build

# # CMD ["npm", "start"]

# # =========================
# # BUILD STAGE
# # =========================
# FROM node:20-bookworm AS build

# # RUN apt-get update && apt-get install -y \
# #   build-essential ca-certificates gcc g++ make python3 pkg-config cmake git curl \
# #   libjpeg-dev libpng-dev libtiff-dev libavif-dev libde265-dev libx265-dev \
# #   libglib2.0-dev libpango1.0-dev libgirepository1.0-dev \
# #   meson ninja-build \
# #   && rm -rf /var/lib/apt/lists/*

# # # Build libvips
# # RUN git clone --branch v8.17.3 https://github.com/libvips/libvips.git /tmp/libvips \
# #   && cd /tmp/libvips \
# #   && meson setup builddir --prefix=/usr \
# #   && ninja -C builddir \
# #   && ninja -C builddir install \
# #   && ldconfig \
# #   && rm -rf /tmp/libvips

# # # Build libheif
# # RUN git clone https://github.com/strukturag/libheif.git /tmp/libheif \
# #   && cd /tmp/libheif && mkdir build && cd build \
# #   && cmake -DENABLE_PLUGIN_LOADING=ON -DENABLE_X265=ON -DENABLE_LIBDE265=ON -DENABLE_LIBAVIF=ON .. \
# #   && make -j"$(nproc)" && make install && ldconfig \
# #   && rm -rf /tmp/libheif

# RUN apt-get update && apt-get install -y \
#   build-essential \
#   python3 \
#   pkg-config \
#   meson \
#   ninja-build \
#   libglib2.0-dev \
#   libexpat1-dev \
#   liborc-0.4-dev \
#   libjpeg-dev \
#   libpng-dev \
#   libtiff-dev \
#   libheif-dev \
#   libde265-dev \
#   libx265-dev \
#   && rm -rf /var/lib/apt/lists/*

# RUN git clone --branch v8.17.3 https://github.com/libvips/libvips.git /tmp/libvips \
#   && cd /tmp/libvips \
#   && meson setup builddir --prefix=/usr \
#   && ninja -C builddir \
#   && ninja -C builddir install \
#   && ldconfig \
#   && rm -rf /tmp/libvips

# WORKDIR /usr/src/app

# COPY server ./server
# COPY shared ./shared
# COPY package.json package-lock.json ./

# RUN npm ci --workspaces

# # RUN npm rebuild sharp --build-from-source

# RUN npm run build --workspace=shared
# RUN npm run build --workspace=server

# # =========================
# # RUNTIME STAGE
# # =========================
# FROM node:20-bookworm-slim

# # RUN apt-get update && apt-get install -y \
# #   libjpeg62-turbo libpng16-16 libtiff6 libavif15 libde265-0 libx265-199 \
# #   libglib2.0-0 libpango-1.0-0 \
# #   && rm -rf /var/lib/apt/lists/*

# RUN apt-get update && apt-get install -y \
#   # libvips42 \
#   libheif1 \
#   libde265-0 \
#   libx265-199 \
#   && rm -rf /var/lib/apt/lists/*

# WORKDIR /usr/src/app

# # Copy only runtime artifacts
# COPY --from=build /usr/lib /usr/lib
# COPY --from=build /usr/local/lib /usr/local/lib
# COPY --from=build /usr/src/app/server/dist ./dist
# COPY --from=build /usr/src/app/node_modules ./node_modules
# COPY --from=build /usr/src/app/package.json ./
# COPY --from=build /usr/src/app/shared ./shared

# CMD ["node", "dist/index.js"]

FROM node:20-bookworm-slim

WORKDIR /usr/src/app

COPY package.json package-lock.json ./
RUN npm ci --workspaces

COPY server ./server
COPY shared ./shared

RUN npm run build --workspace=shared
RUN npm run build --workspace=server

CMD ["node", "dist/index.js"]