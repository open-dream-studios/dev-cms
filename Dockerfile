FROM node:20-bookworm

# Install all build dependencies including meson + ninja
RUN apt-get update && apt-get install -y \
  build-essential ca-certificates gcc g++ make python3 python3-pip pkg-config cmake git curl \
  libjpeg-dev libpng-dev libtiff-dev libavif-dev libde265-dev libx265-dev \
  libglib2.0-dev libpango1.0-dev libgirepository1.0-dev \
  meson ninja-build \
  && rm -rf /var/lib/apt/lists/*

# Build and install libvips 8.17.3 (required by sharp >=0.34)
RUN git clone --branch v8.17.3 https://github.com/libvips/libvips.git /tmp/libvips \
  && cd /tmp/libvips \
  && meson setup builddir --prefix=/usr \
  && ninja -C builddir \
  && ninja -C builddir install \
  && ldconfig \
  && rm -rf /tmp/libvips

# Optional: Build and install libheif for HEIC/AVIF image support
RUN git clone https://github.com/strukturag/libheif.git /tmp/libheif \
  && cd /tmp/libheif && mkdir build && cd build \
  && cmake -DENABLE_PLUGIN_LOADING=ON -DENABLE_X265=ON -DENABLE_LIBDE265=ON -DENABLE_LIBAVIF=ON .. \
  && make -j"$(nproc)" && make install && ldconfig \
  && rm -rf /tmp/libheif

WORKDIR /usr/src/app
COPY . .

RUN npm ci --workspaces
RUN npm rebuild sharp --build-from-source --sharp-libvips=system
RUN npm run build