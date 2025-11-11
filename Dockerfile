FROM node:20-bookworm

# ---- system deps ----
RUN apt-get update && apt-get install -y \
    build-essential ca-certificates gcc g++ make python3 pkg-config cmake git \
    libjpeg-dev libpng-dev libtiff-dev libavif-dev libde265-dev libx265-dev \
    libvips-dev libglib2.0-dev libpango1.0-dev libgirepository1.0-dev \
    && rm -rf /var/lib/apt/lists/*

# ---- build libheif with HEVC/AVIF ----
RUN git clone https://github.com/strukturag/libheif.git /tmp/libheif \
 && cd /tmp/libheif && mkdir build && cd build \
 && cmake -DENABLE_PLUGIN_LOADING=ON -DENABLE_X265=ON -DENABLE_LIBDE265=ON -DENABLE_LIBAVIF=ON .. \
 && make -j$(nproc) && make install && ldconfig \
 && rm -rf /tmp/libheif

# ---- app ----
WORKDIR /usr/src/app
COPY . .

RUN npm ci --workspaces
RUN npm rebuild sharp --build-from-source --sharp-libvips=system
RUN npm run build

CMD ["node", "server/dist/index.js"]