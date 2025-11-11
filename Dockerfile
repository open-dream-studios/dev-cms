FROM ghcr.io/lovell/sharp-libvips:latest

WORKDIR /usr/src/app
COPY . .

RUN npm ci --workspaces

RUN npm run build

CMD ["node", "server/dist/index.js"]