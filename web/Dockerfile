FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json tsconfig.json tailwind.config.ts postcss.config.js next.config.js ./
COPY app ./app
COPY components ./components
COPY public ./public
COPY styles ./styles 2>/dev/null || true
RUN npm install
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app .
EXPOSE 3000
CMD ["npm", "run", "start"]
