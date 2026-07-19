FROM node:22-alpine AS BUILD
WORKDIR /app
RUN corepack enable 
#makes the pnpm related commands easy without having bulking npm i -g pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --dangerously-allow-all-builds
COPY prisma.config.ts ./
COPY prisma ./prisma
COPY . .
RUN npx prisma generate
RUN pnpm build


FROM node:22-alpine AS PRODUCTION
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install \
    --prod \
    --frozen-lockfile \
    --dangerously-allow-all-builds
COPY --from=BUILD /app/dist ./dist
COPY --from=BUILD /app/prisma ./prisma
COPY --from=BUILD /app/prisma.config.ts ./
COPY --from=BUILD /app/generated ./generated
EXPOSE 3000
CMD ["node", "dist/src/main.js"]
