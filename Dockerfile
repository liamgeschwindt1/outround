FROM node:20-alpine

WORKDIR /app

# Install dependencies first — this layer is cached unless package.json changes
COPY package*.json ./
RUN npm ci --only=production

# Copy application files
COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
