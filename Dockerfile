FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY . .

RUN mkdir -p uploads

EXPOSE 3000

# Run migrations then start the API
CMD ["sh", "-c", "node src/db/migrate.js && node src/server.js"]
