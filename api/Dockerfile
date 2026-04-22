FROM node:22-alpine
WORKDIR /app
COPY package*.json tsconfig.json prisma ./
RUN npm install
COPY src ./src
RUN npx prisma generate
RUN npm run build
EXPOSE 4000
CMD ["node", "dist/server.js"]
