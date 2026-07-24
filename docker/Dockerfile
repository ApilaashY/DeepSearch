FROM node:24-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the application code
COPY . .

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Build the prisma data
RUN npx prisma generate

# Build the Next.js app
RUN npm run build

# Expose the default port
EXPOSE 3000

# Run prisma db push to sync DB schema and serve the application
CMD ["sh", "-c", "npx prisma db push && npm run start"]
