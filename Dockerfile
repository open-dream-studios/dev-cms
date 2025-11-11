FROM node:20-bullseye

RUN apt-get update && apt-get install -y \
  build-essential ca-certificates gcc g++ make python3 pkg-config \
  libjpeg-dev libpng-dev libtiff5-dev libavif-dev libheif-dev libde265-dev libx265-dev libvips-dev \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

# Copy all files (including workspace package.jsons)
COPY . .

# 🟩 Install all workspace deps together
RUN npm ci --workspaces

# Build
RUN npm run build

# Optional: rebuild sharp for container arch
RUN npm rebuild sharp --force

CMD ["node", "server/dist/index.js"]