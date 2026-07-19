FROM node:22-alpine
WORKDIR /app
RUN corepack enable 
#makes the pnpm related commands easy without having bulking npm i -g pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --dangerously-allow-all-builds
COPY prisma.config.ts ./
COPY prisma ./prisma
RUN npx prisma generate
COPY . .
EXPOSE 3000
CMD [ "pnpm", "run", "start:dev" ]
