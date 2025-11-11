FROM node:20-bookworm

RUN apt-get update && apt-get install -y \
  build-essential ca-certificates gcc g++ make python3 pkg-config \
  libjpeg-dev libpng-dev libtiff-dev libavif-dev libheif-dev libde265-dev libx265-dev \
  libvips-dev libglib2.0-dev libgobject-2.0-dev libpango1.0-dev \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app
COPY . .

RUN npm ci --workspaces
RUN npm rebuild sharp --build-from-source --sharp-libvips=system
RUN npm run build

CMD ["node", "server/dist/index.js"]